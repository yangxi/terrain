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

// Copyright 2017-2018 Terrain Data, Inc.

import * as Elastic from 'elasticsearch';

import { Config } from './Config';
import { logger } from './Logging';

export let index: string = '';
export const type: string = 'data';

export interface Request
{
  s: string; // server address
  q: string; // query string
  p: string; // page number
  v: string; // variant id
}

export class Demo
{

  private config: Config;

  constructor(config: Config)
  {
    this.config = config;

    index = `${this.config.instanceId}.movies`;
  }

  public async search(req: Request): Promise<object[]>
  {
    const client = new Elastic.Client({
      host: req.s,
    });

    try
    {
      await client.ping({
        requestTimeout: 500,
      });
    }
    catch (e)
    {
      logger.error('creating ES client for host: ' + String(req.s) + ': ' + String(e));
      return [];
    }

    try
    {
      const from: number = Number(req.p) * 30;
      const size: number = 30;

      let resp;
      if (req.v === undefined || req.v === 'MovieDemoAlgorithm')
      {
        logger.info('Calling ES query: (from: ' + String(from) + ', size: ' + String(size) + ', title: ' + req.q + ')');
        resp = await client.search({
          index,
          type,
          from,
          size,
          body: {
            query: {
              prefix: {
                'title.keyword': req.q,
              },
            },
          },
        });
      }
      else
      {
        logger.info('Calling Terrain variant: ' + req.v +
          '(from: ' + String(from) + ', size: ' + String(size) + ', title: ' + req.q + ')');
        resp = await client.searchTemplate({
          body: {
            id: req.v,
            params: {
              from: (Number(req.p) * 30),
              size: 30,
              title: '\"' + req.q + '\"',
            },
          },
        } as any);
      }

      if (resp.hits.hits === undefined)
      {
        return [];
      }

      return resp.hits.hits.map((m) => Object.assign({}, m._source, { _id: m._id }));
    }
    catch (e)
    {
      logger.error('querying ES: ' + String(req.q) + ': ' + String(e));
      return [];
    }
  }

}
