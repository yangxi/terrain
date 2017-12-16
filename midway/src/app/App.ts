/*
University of Illinois/NCSA Open Source License 

Copyright (c) 2018 Terrain Data, Inc. and the authors. All rights reserved.

Developed by: Terrain Data, Inc. and
              the individuals who committed the code in this file.
              https://github.com/terraindata/terrain
                  
Permission is hereby granted, free of charge, to any person 
obtaining a copy of this software and associated documentation files 
(the "Software"), to deal with the Software without restriction, 
including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, 
and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

* Redistributions of source code must retain the above copyright notice, 
  this list of conditions and the following disclaimers.

* Redistributions in binary form must reproduce the above copyright 
  notice, this list of conditions and the following disclaimers in the 
  documentation and/or other materials provided with the distribution.

* Neither the names of Terrain Data, Inc., Terrain, nor the names of its 
  contributors may be used to endorse or promote products derived from
  this Software without specific prior written permission.

This license supersedes any copyright notice, license, or related statement
following this comment block.  All files in this repository are provided
under the same license, regardless of whether a corresponding comment block
appears in them.  This license also applies retroactively to any previous
state of the repository, including different branches and commits, which
were made public on or after December 8th, 2018.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
CONTRIBUTORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS WITH
THE SOFTWARE.
*/

// Copyright 2017 Terrain Data, Inc.

import * as http from 'http';
import * as Koa from 'koa';
import * as winston from 'winston';

import cors = require('kcors');
import session = require('koa-session');
import serve = require('koa-static-server');
import srs = require('secure-random-string');
import v8 = require('v8');

import * as DBUtil from '../database/Util';
import RouteError from '../error/RouteError';
import * as Tasty from '../tasty/Tasty';
import './auth/Passport';
import { CmdLineArgs } from './CmdLineArgs';
import * as Config from './Config';
import { credentials } from './credentials/CredentialRouter';
import { databases } from './database/DatabaseRouter';
import { events } from './events/EventRouter';
import './Logging';
import Middleware from './Middleware';
import NotFoundRouter from './NotFoundRouter';
import MidwayRouter from './Router';
import { scheduler } from './scheduler/SchedulerRouter';
import * as Schema from './Schema';
import { users } from './users/UserRouter';
import Users from './users/Users';

export let CFG: Config.Config;
export let DB: Tasty.Tasty;
export let HA: number;

class App
{
  private static initializeDB(type: string, dsn: string): Tasty.Tasty
  {
    winston.info('Initializing system database { type: ' + type + ' dsn: ' + dsn + ' }');
    const controller = DBUtil.makeDatabaseController(type, dsn);
    return controller.getTasty();
  }

  private static uncaughtExceptionHandler(err: Error): void
  {
    winston.error('Uncaught Exception: ' + err.toString());
    // this is a good place to clean tangled resources
    process.abort();
  }

  private static unhandledRejectionHandler(err: Error): void
  {
    winston.error('Unhandled Promise Rejection: ' + err.toString());
  }

  private DB: Tasty.Tasty;
  private app: Koa;
  private config: Config.Config;
  private heapAvail: number;

  constructor(config: Config.Config = CmdLineArgs)
  {
    process.on('uncaughtException', App.uncaughtExceptionHandler);
    process.on('unhandledRejection', App.unhandledRejectionHandler);

    // first, load config from a config file, if one is specified
    config = Config.loadConfigFromFile(config);
    this.DB = App.initializeDB(config.db as string, config.dsn as string);
    DB = this.DB;

    winston.debug('Using configuration: ' + JSON.stringify(config));
    this.config = config;
    CFG = this.config;

    this.app = new Koa();
    this.app.proxy = true;
    this.app.keys = [srs({ length: 256 })];
    this.app.use(async (ctx, next) =>
    {
      // tslint:disable-next-line:no-empty
      ctx.req.setTimeout(0, () => { });
      await next();
    });
    this.app.use(cors());
    this.app.use(session(undefined, this.app));

    this.app.use(Middleware.bodyParser({ jsonLimit: '10gb', formLimit: '10gb' }));
    this.app.use(Middleware.favicon(__dirname + '/../../../src/app/favicon.ico'));
    this.app.use(Middleware.logger(winston));
    this.app.use(Middleware.responseTime());
    this.app.use(Middleware.passport.initialize());
    this.app.use(Middleware.passport.session());

    // make sure we insert the RouteErrorHandler first
    this.app.use(RouteError.RouteErrorHandler);
    this.app.use(MidwayRouter.routes());
    this.app.use(serve({ rootDir: './midway/src/assets', rootPath: '/midway/v1/assets' }));
    this.app.use(NotFoundRouter.routes());
  }

  public async start(): Promise<http.Server>
  {
    // create application schema
    await Schema.createAppSchema(this.config.db as string, this.DB);
    console.log("MADE DAT SCHEMA");

    // process configuration options
    await Config.handleConfig(this.config);
    console.log("MADE DEM CONF OPTIONS");

    // create a default seed user
    await users.initializeDefaultUser();
    console.log("MADE DEFAULT USER");

    // add local filesystem credential config
    await credentials.initializeLocalFilesystemCredential();
    console.log("MADE CREDNETIALXZXXZZZZZZZZ");

    // connect to configured databases
    const dbs = await databases.select(['id'], {});
    for (const db of dbs)
    {
      if (db.id !== undefined)
      {
        await databases.connect({} as any, db.id);
      }

      if (db.analyticsIndex !== undefined && db.analyticsType !== undefined)
      {
        await events.initializeEventMetadata(DB, db.analyticsIndex, db.analyticsType);
      }
    }

    // setup stored users
    await scheduler.initializeJobs();
    await scheduler.initializeSchedules();

    const heapStats: object = v8.getHeapStatistics();
    this.heapAvail = Math.floor(0.8 * (heapStats['heap_size_limit'] - heapStats['used_heap_size']));
    HA = this.heapAvail;

    winston.info('Listening on port ' + String(this.config.port));
    return this.app.listen(this.config.port);
  }

  public getConfig(): Config.Config
  {
    return this.config;
  }
}

export default App;

// TODO list
// - import HTML rather than writing directly inline
// - kick off webpack dev server when in DEV mode (and kill it when server stops)
// - difference between prod and dev mode: prod references bundle.js static file
