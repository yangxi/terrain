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

// Copyright 2018 Terrain Data, Inc.

import * as stream from 'stream';
import * as winston from 'winston';

import { TaskConfig } from 'shared/types/jobs/TaskConfig';
import { TaskOutputConfig } from 'shared/types/jobs/TaskOutputConfig';
import Templates from '../../etl/Templates';
import LogStream from '../../io/streams/LogStream';
import { Task } from '../Task';

const templates: Templates = new Templates();

export class TaskETL extends Task
{
  constructor(taskConfig: TaskConfig)
  {
    super(taskConfig);
  }

  public async run(): Promise<TaskOutputConfig>
  {
    return new Promise<TaskOutputConfig>(async (resolve, reject) =>
    {
      const taskOutputConfig: TaskOutputConfig =
        {
          exit: false,
          options: {
            logStream: null,
            outputStream: null,
          },
          status: true,
        };

      try
      {
        const streams = await templates.executeETL(this.taskConfig['params']['options'],
          this.taskConfig['params']['options']['inputStreams']);
        winston.info('finished executing ETL');
        taskOutputConfig['options']['outputStream'] = streams['outputStream'];
        taskOutputConfig['options']['logStream'] = streams['logStream'];
      }
      catch (e)
      {
        taskOutputConfig.status = false;
        winston.error('Error while running ETL task: ' + String(e.toString()));
        const errLogStream = new LogStream();
        errLogStream.error(e.toString());
        // errLogStream.push(null);
        taskOutputConfig['options']['logStream'] = errLogStream;
        taskOutputConfig['options']['logStream'].push(null);
      }
      finally
      {
        resolve(taskOutputConfig);
      }
    });
  }

  public async printNode(): Promise<TaskOutputConfig>
  {
    winston.info('Printing ETL Task, params: ' + JSON.stringify(this.taskConfig.params as object));
    return Promise.resolve(
      {
        exit: false,
        status: true,
      } as TaskOutputConfig);
  }
}
