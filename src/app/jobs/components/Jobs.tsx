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
// tslint:disable:no-console
import TerrainComponent from 'common/components/TerrainComponent';
import * as Immutable from 'immutable';
import * as React from 'react';
import JobsApi from 'jobs/JobsApi';
import Util from 'util/Util';
import XHR from 'util/XHR';

class Jobs extends TerrainComponent<any> {

  public jobsApi: JobsApi = new JobsApi(XHR.getInstance());

  public constructor(props)
  {
    super(props);
    this.state = {
      responseText: '',
      jobs: null,
      id: '',
    };
  }

  public componentDidMount()
  {
    this.getJobs();
  }

  public getJobs()
  {
    this.jobsApi.getJobs()
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response), jobs: response.data });
      })
      .catch((error) =>
      {
        console.error(error)
        this.setState({ responseText: error.response.data.errors[0].detail });
      });
  }

  public getJob(id: number)
  {
    this.jobsApi.getJob(id)
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error.response.data.errors[0].detail });
      });
  }

  public renderJob(job)
  {
    return (
      <div key={job.id} style={{
        display: 'flex', justifyContent: 'space-between',
        width: '90%', padding: 10, borderBottom: '1px solid',
      }}>
        <div style={{ flex: 1 }}>{job.id}</div>
        <div style={{ flex: 1 }}>{job.name || 'not defined'}</div>
        <div style={{ flex: 1 }}>{job.pausedFilename}</div>
        <div style={{ flex: 1 }}>{job.priority}</div>
        <div style={{ flex: 1 }}>{job.running ? 'running' : 'not running'}</div>
        <div style={{ flex: 1 }}>{job.runNowPriority}</div>
        <div style={{ flex: 1 }}>{job.scheduleId}</div>
        <div style={{ flex: 1 }}>{job.status}</div>
        <div style={{ flex: 1 }}>{job.tasks}</div>
        <div style={{ flex: 1 }}>{job.type}</div>
        <div style={{ flex: 1 }}>{job.workerId}</div>
      </div>
    );
  }

  public render()
  {
    const { jobs } = this.state;
    const { id } = this.state;

    return (
      <div>
        <div>
          {this.state.responseText}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {
            jobs !== null ?
              (
                jobs.reduce(
                  (jobRows, j, sId) => jobRows.concat(
                    this.renderJob(j),
                  ),
                  [],
                )
              ) : null
          }
        </div>
      </div>
    );
  }
}

export default Jobs;
