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

import * as fs from 'fs';
import jsurl = require('jsurl');
import * as KoaRouter from 'koa-router';
import * as _ from 'lodash';
import stringHash = require('string-hash');

import { Config } from './Config';
import { Demo } from './Demo';
import { EventConfig, Events } from './Events';
import { logger } from './Logging';

export class Router
{
  private router: KoaRouter;
  private appRouter: KoaRouter;
  private events: Events;
  private demo: Demo;

  constructor(config: Config)
  {
    this.router = new KoaRouter();
    this.events = new Events(config);
    this.demo = new Demo(config);

    /**
     * @api {post} / Track analytics event(s) (POST)
     * @apiName postEvent
     * @apiGroup Tracking
     *
     * @apiDescription Track an analytics event using a POST request. Event parameters can be provided using the POST payload / body.
     *
     * @apiParam {String} eventname Mandatory Name of the tracking event
     * @apiParam {Number} algorithmid Mandatory ID of the Terrain algorithm to track this event for
     * @apiParam {Number} visitorid Mandatory A unique ID to identify the current visitor
     * @apiParam {Object} meta Mandatory Auxiliary information associated with the tracking event
     * @apiParam {Object} batch Optional A batch registration request
     *
     */
    this.router.post('/', async (ctx, next) =>
    {
      await this.handleEvent(ctx.request);
      ctx.body = '';
    });

    /**
     * @api {get} / Track analytics event(s) (GET)
     * @apiName getEvent
     * @apiGroup Tracking
     *
     * @apiParam {String} eventname Name of the tracking event
     * @apiParam {Number} algorithmid ID of the Terrain algorithm to track this event for
     * @apiParam {Number} visitorid A unique ID to identify the current visitor
     * @apiParam {Object} meta Auxiliary information associated with the tracking event
     * @apiParam {Object} batch Optional A batch registration request
     *
     * @apiDescription Track an analytics event using a GET request. Event parameters can be provided using the GET query string.
     *
     * @apiExample {curl} Example usage:
     *     curl http://localhost:3001/v1?eventname=impression&visitorid=3161077040&algorithmid=123&meta=~(itemName~343~itemType~%27movie)
     */
    this.router.get('/', async (ctx, next) =>
    {
      await this.handleEvent(ctx.request);
      ctx.body = '';
    });

    this.appRouter = new KoaRouter();

    /**
     * @api {get} /bundle.js Serve Terrain analytics.js library
     * @apiName getBundle
     * @apiGroup AnalyticsJS
     */
    this.appRouter.get('/bundle.js', async (ctx, next) =>
    {
      ctx.type = 'js';
      if (fs.existsSync('./build/bundle.js'))
      {
        ctx.body = fs.createReadStream('./build/bundle.js');
      }
      else
      {
        ctx.body = fs.createReadStream('../analytics.js/build/bundle.js');
      }
    });

    /**
     * @api {get} /bundle.js.map Serve Terrain analytics.js library sourcemap
     * @apiName getBundleMap
     * @apiGroup AnalyticsJS
     */
    this.appRouter.get('/bundle.js.map', async (ctx, next) =>
    {
      ctx.type = 'js';
      if (fs.existsSync('./build/bundle.js.map'))
      {
        ctx.body = fs.createReadStream('./build/bundle.js.map');
      }
      else
      {
        ctx.body = fs.createReadStream('../analytics.js/build/bundle.js.map');
      }
    });

    /**
     * @api {get} /demo/search Search endpoint for the Terrain Analytics demo website
     * @apiPrivate
     * @apiName getDemoSearch
     * @apiGroup Demo
     *
     * @apiParam {String} s Elasticsearch server to query
     * @apiParam {String} q Title to search
     * @apiParam {Number} p Page number
     * @apiParam {Number} v Algorithm ID
     *
     * @apiParamExample {json} Request-Example:
     *     {
     *       "s": "http://localhost:9200",
     *       "q": "Star",
     *       "p": 0,
     *       "v": 8,
     *     }
     * @apiSuccess {Object[]} results Results of the search query.
     */
    this.appRouter.get('/demo/search', async (ctx, next) =>
    {
      ctx.body = await this.demo.search(ctx.request.query);
    });

    this.appRouter.use('/v1', this.router.routes(), this.router.allowedMethods());
  }

  public async initialize()
  {
    return this.events.initialize();
  }

  public routes(): any
  {
    return this.appRouter.routes();
  }

  private async prepareEvent(request: any, event: any): Promise<EventConfig>
  {
    let meta = event['meta'];
    try
    {
      meta = jsurl.parse(event['meta']);
    }
    catch (e)
    {
      meta = event['meta'];
    }

    const date = new Date();
    const now = date.getTime();

    const ev: EventConfig = {
      eventname: event['eventname'],
      algorithmid: event['algorithmid'],
      visitorid: event['visitorid'],
      source: {
        ip: request.ip,
        host: request.host,
        useragent: request.useragent,
        referer: request.header.referer,
      },
      timestamp: date,
      intervalBucketSeconds: Math.round(now / 1000),
      intervalBucketMinutes: Math.round(now / 1000 / 60),
      intervalBucketHours: Math.round(now / 1000 / 60 / 60),
      intervalBucketDays: Math.round(now / 1000 / 60 / 60 / 24),
      meta,
      hash: stringHash(JSON.stringify(request.query)),
    };

    const unexpectedFields = _.difference(Object.keys(event), Object.keys(ev).concat(['id', 'accessToken', 'batch']));
    if (unexpectedFields.length > 0)
    {
      logger.error('storing analytics event: unexpected fields encountered ' + JSON.stringify(unexpectedFields));
    }

    return ev;
  }

  private async handleEvent(request: any)
  {
    if (request.body !== undefined && Object.keys(request.body).length > 0 &&
      request.query !== undefined && Object.keys(request.query).length > 0)
    {
      return logger.error('Both request query and body cannot be set.');
    }

    if ((request.body === undefined ||
      request.body !== undefined && Object.keys(request.body).length === 0) &&
      (request.query === undefined ||
        request.query !== undefined && Object.keys(request.query).length === 0))
    {
      return logger.error('Either request query or body parameters are required.');
    }

    let event: object = request.body;
    if (event === undefined || (event !== undefined && Object.keys(event).length === 0))
    {
      event = request.query;
    }

    if (event['batch'] !== undefined)
    {
      let events = [];
      try
      {
        events = jsurl.parse(event['batch']);
      }
      catch (e)
      {
        events = event['batch'];
      }

      // insert batched events
      if (!Array.isArray(events))
      {
        return logger.error('Expected batch parameter to be an array.');
      }

      const promises: Array<Promise<EventConfig>> = [];
      events.forEach((ev) => promises.push(this.prepareEvent(request, ev)));
      const evs = await Promise.all(promises);
      const r = await this.events.storeBulk(evs);
      if (r['errors'] === true)
      {
        logger.error('Elastic reported errors when storing events.  Full response object: ' + JSON.stringify(r));
      }
    }
    else
    {
      const ev = await this.prepareEvent(request, event);
      try
      {
        await this.events.store(ev);
      }
      catch (e)
      {
        logger.error('storing analytics event: ' + JSON.stringify(e));
      }
    }
  }

}

export default Router;
