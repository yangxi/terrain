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

import * as passport from 'koa-passport';
import * as KoaRouter from 'koa-router';
import * as winston from 'winston';

// import DatabaseController from '../../database/DatabaseController';
// import DatabaseRegistry from '../../databaseRegistry/DatabaseRegistry';
import ElasticConfig from '../../database/elastic/ElasticConfig';
import ElasticController from '../../database/elastic/ElasticController';
import * as DBUtil from '../../database/Util';
import * as Tasty from '../../tasty/Tasty';
import * as Util from '../Util';
import { ImportConfig } from './Import';

const Router = new KoaRouter();
// export const items: Items = new Items();

Router.post('/', passport.authenticate('access-token-local'), async (ctx, next) =>
{
  winston.info('importing to database');
  const imprt: ImportConfig = ctx.request.body.body;
  Util.verifyParameters(imprt, ['dbtype', 'contents', 'dsn', 'table']);
  if (imprt.dbtype !== 'elastic')
  {
    throw new Error('File import currently is only supported for Elastic databases.');
  }
  Util.verifyParameters(imprt, ['db']);

  const items: object[] = JSON.parse(imprt.contents);
  // let columns: string[];
  // const database: DatabaseController | undefined = DatabaseRegistry.get(imprt.dbid);
  // if (database !== undefined)
  // {
  //     // find schema to find primary key ; somewhat redundant with SchemaRouter.ts
  //     const schema: Tasty.Schema = await database.getTasty().schema();
  //     columns = schema.fieldNames(imprt.db, imprt.table);
  // } else {
  //     columns = Object.keys(items[0]);    // for now assume all items have all keys
  // }
  const columns: string[] = Object.keys(items[0]);

  const insertTable: Tasty.Table = new Tasty.Table(
    imprt.table,
    ['_id'],        // TODO: find schema to find primary key
    columns,
    imprt.db,      // TODO: only if this exists
  );

  const elasticConfig: ElasticConfig = DBUtil.DSNToConfig(imprt.dbtype, imprt.dsn) as ElasticConfig;
  const elasticController: ElasticController = new ElasticController(elasticConfig, 0, 'Import');

  await elasticController.getTasty().upsert(insertTable, items);
});

export default Router;
