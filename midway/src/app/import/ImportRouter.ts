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
import * as stream from 'stream';
import * as winston from 'winston';

import { HA } from '../App';
import { Permissions } from '../permissions/Permissions';
import { UserConfig } from '../users/Users';
import * as Util from '../Util';
import { ExportConfig, Import } from './Import';

const Router = new KoaRouter();
const imprt: Import = new Import();
const perm: Permissions = new Permissions();

Router.post('/', async (ctx, next) =>
{
  winston.info('importing to database');
  const authStream: object = await Util.authenticateStream(ctx.req);
  if (authStream['user'] === null)
  {
    ctx.status = 400;
    return;
  }
  Util.verifyParameters(authStream['fields'], ['dbid', 'dbname', 'filetype', 'filesize', 'tablename']);
  Util.verifyParameters(authStream['fields'], ['columnTypes', 'originalNames', 'primaryKeys', 'transformations']);
  // optional parameters: hasCsvHeader, isNewlineSeparatedJSON, requireJSONHaveAllFields, update

  await perm.ImportPermissions.verifyDefaultRoute(authStream['user'] as UserConfig, authStream['fields']);

  ctx.body = await imprt.upsert(authStream['files'], authStream['fields'], false);
});

Router.post('/export', passport.authenticate('access-token-local'), async (ctx, next) =>
{
  const requestObj: object = JSON.parse(ctx.request.body.data).body;
  Util.verifyParameters(requestObj, ['columnTypes', 'dbid', 'dbname', 'filetype', 'query', 'rank', 'transformations']);
  const exprtConf: ExportConfig = requestObj as ExportConfig;

  await perm.ImportPermissions.verifyExportRoute(ctx.state.user, requestObj);

  const exportReturn: stream.Readable | string = await imprt.export(exprtConf, false);

  ctx.type = 'text/plain';
  ctx.attachment(ctx.request.body.filename);
  ctx.body = exportReturn;
});

Router.post('/export/headless', passport.authenticate('access-token-local'), async (ctx, next) =>
{
  const exprtConf: ExportConfig = ctx.request.body.body;
  Util.verifyParameters(exprtConf, ['templateId', 'variantId']);

  await perm.ImportPermissions.verifyExportRoute(ctx.state.user, ctx.request.body.body);

  const exportReturn: stream.Readable | string = await imprt.export(exprtConf, true);
  ctx.body = exportReturn;
});

Router.post('/headless', async (ctx, next) =>
{
  winston.info('importing to database, from file and template id');
  const authStream: object = await Util.authenticateStream(ctx.req);
  if (authStream['user'] === null)
  {
    ctx.status = 400;
    return;
  }

  Util.verifyParameters(authStream['fields'], ['filetype', 'templateId']);
  // optional parameters: hasCsvHeader, isNewlineSeparatedJSON, requireJSONHaveAllFields, update

  await perm.ImportPermissions.verifyHeadlessRoute(authStream['user'] as UserConfig, authStream['fields']);

  ctx.body = await imprt.upsert(authStream['files'], authStream['fields'], true);
});

Router.post('/progress', passport.authenticate('access-token-local'), async (ctx, next) =>
{
  // TODO: add permissions
  const progress: number | string = await imprt.getProgress();
  ctx.body = progress;
});

export default Router;
