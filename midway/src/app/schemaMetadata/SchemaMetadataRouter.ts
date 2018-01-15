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

import DatabaseController from '../../database/DatabaseController';
import DatabaseRegistry from '../../databaseRegistry/DatabaseRegistry';
import * as Tasty from '../../tasty/Tasty';
import SchemaMetadata from './SchemaMetadata';

const Router = new KoaRouter();
export const schemaMetadata = new SchemaMetadata();

Router.post('/star', passport.authenticate('access-token-local'), async (ctx, next) =>
{
  winston.warn('Changing columns starred status');
  const starred: boolean = ctx.request.body.body.starred;
  const columnId: string | number = ctx.request.body.body.columnId;
  winston.info(String(starred));
  winston.info(String(columnId));
  ctx.body = await schemaMetadata.upsert(ctx.state.user,
    { starred, id: columnId });
});

Router.post('/count/:columnId', passport.authenticate('access-token-local'), async (ctx, next) =>
{
  winston.info('Incrementing the count of a column');
  const columnId: string | number = ctx.params.columnIdreq;
  const count: number = ctx.request.body.body.count;
  const algorithmId: string | number = ctx.request.body.body.algorithmId;
  if (algorithmId === undefined)
  {
    // Just incrementing the total count, not for a specific algorithm
    // ctx.body = await schemaMetadata.upsert(ctx.state.user, { count, id: columnId });
  }
  else
  {
    // TODO NEED TO MERGE THE COUNT BY ALGORITHM THING WITH THE COLUMN'S OLD countByAlgorithm property
  //  ctx.body = await schemaMetadata.upsert(ctx.state.user, { countByAlgorithm: { algirithmId: count }, id: columnId });
  }
});

Router.get('/:columnId', passport.authenticate('access-token-local'), async (ctx, next) =>
{
  winston.info('Retrieving column info');
  const columnId: string | number = ctx.params.columnId;
  ctx.body = await schemaMetadata.get(columnId);
});

export default Router;
