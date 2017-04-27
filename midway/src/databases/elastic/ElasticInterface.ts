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

import * as Elastic from 'elasticsearch';

import ElasticCluster from './ElasticCluster';
import ElasticConfig from './ElasticConfig';
import ElasticController from './ElasticController';
import ElasticIndices from './ElasticIndices';

/**
 * An interface which acts as a selective isomorphic wrapper around
 * the elastic.js API.
 */
class ElasticInterface
{
  private static defaultConfig: ElasticConfig = {
    hosts: ['http://localhost:9200'],
  };

  public cluster: ElasticCluster;
  public indices: ElasticIndices;
  private controller: ElasticController;

  constructor(config: ElasticConfig = ElasticInterface.defaultConfig)
  {
    this.controller = new ElasticController(config);
    this.cluster = new ElasticCluster(this.controller);
    this.indices = new ElasticIndices(this.controller);
  }

  /**
   * https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-bulk
   */
  public bulk(params: Elastic.BulkIndexDocumentsParams, callback: (error: any, response: any) => void): void
  {
    this.log('bulk', params);
    return this.controller.client.bulk(params, callback);
  }

  /**
   * https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-delete
   */
  public delete(params: Elastic.DeleteDocumentParams,
    callback: (error: any, response: Elastic.DeleteDocumentResponse) => void): void
  {
    this.log('delete', params);
    return this.controller.client.delete(params, callback);
  }

  /**
   * https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-index
   */
  public index<T>(params: Elastic.IndexDocumentParams<T>, callback: (error: any, response: any) => void): void
  {
    this.log('index', params);
    return this.controller.client.index(params, callback);
  }

  /**
   * https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-putscript
   */
  public putScript(params: Elastic.PutScriptParams, callback: (err: any, response: any, status: any) => void): void
  {
    this.log('putScript', params);
    return this.controller.client.putScript(params, callback);
  }

  /**
   * https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-search
   */
  public search<T>(params: Elastic.SearchParams,
    callback: (error: any, response: Elastic.SearchResponse<T>) => void): void
  {
    this.log('search', params);
    return this.controller.client.search(params, callback);
  }

  private log(methodName: string, info: any)
  {
    this.controller.log('ElasticInterface.' + methodName, info);
  }

}

export default ElasticInterface;