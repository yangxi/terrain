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
import * as React from 'react';
import { SchedulerActions } from 'scheduler/data/SchedulerRedux';
import SchedulerApi from 'scheduler/SchedulerApi';
import Util from 'util/Util';
import XHR from 'util/XHR';
import { notificationManager } from './../../common/components/InAppNotification';

class Scheduler extends TerrainComponent<any> {

  public schedulerApi: SchedulerApi = new SchedulerApi(XHR.getInstance());

  public constructor(props)
  {
    super(props);
    this.state = {
      responseText: '',
      schedules: null,
      id: '',
    };
  }

  public componentDidMount()
  {
    this.getSchedules();
  }

  public createSchedule()
  {
    const scheduleParams = {
      cron: '* * 10 * *',
      name: `Jmansor Schedule ${Math.floor(Math.random() * 100)}`,
      priority: 1,
      tasks: [],
      workerId: 10,
    };

    this.props.schedulerActions({
      actionType: 'createSchedule',
      schedule: scheduleParams,
    })
      .then((schedule) =>
      {
        this.setState({ responseText: JSON.stringify(schedule) });
        notificationManager.addNotification(
          'Schedule created',
          schedule.name,
          'info',
          4,
        );
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
        notificationManager.addNotification(
          error,
          '',
          'error',
          4,
        );
      });
  }

  public createInvalidSchedule()
  {
    const scheduleParams = {
      // Remove cron property so the endpoint returns an error
      // cron: '* * 10 * *',
      name: `Jmansor Schedule ${Math.floor(Math.random() * 100)}`,
      priority: 1,
      tasks: [],
      workerId: 10,
    };

    this.props.schedulerActions({
      actionType: 'createSchedule',
      schedule: scheduleParams,
    })
      .then((schedule) =>
      {
        this.setState({ responseText: JSON.stringify(schedule) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
        notificationManager.addNotification(
          error,
          '',
          'error',
          4,
        );
      });
  }

  public getSchedules()
  {
    this.props.schedulerActions({
      actionType: 'getSchedules',
    })
      .then((schedules) =>
      {
        this.setState({ responseText: JSON.stringify(schedules) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
      });
  }

  public getSchedule(id: number)
  {
    this.schedulerApi.getSchedule(id)
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
      });
  }

  public updateSchedule(id: number)
  {
    const changes = { id, name: 'Jmansor Schedule Modified' };
    this.props.schedulerActions({
      actionType: 'updateSchedule',
      schedule: changes,
    })
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
      });
  }

  public deleteSchedule(id?: number)
  {
    this.props.schedulerActions({
      actionType: 'deleteSchedule',
      scheduleId: id,
    })
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
      });
  }

  public duplicateSchedule(id?: number)
  {
    this.props.schedulerActions({
      actionType: 'duplicateSchedule',
      scheduleId: id,
    })
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
      });
  }

  public getScheduleLog(id: number)
  {
    this.schedulerApi.getScheduleLog(id)
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
      });
  }

  public pauseSchedule(id: number)
  {
    this.schedulerApi.pauseSchedule(id)
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
      });
  }

  public unpauseSchedule(id: number)
  {
    this.schedulerApi.unpauseSchedule(id)
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
      });
  }

  public runSchedule(id: number)
  {
    this.schedulerApi.runSchedule(id)
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
      });
  }

  public setScheduleStatus(id: number)
  {
    this.schedulerApi.setScheduleStatus(id, false)
      .then((response) =>
      {
        this.setState({ responseText: JSON.stringify(response) });
      })
      .catch((error) =>
      {
        this.setState({ responseText: error });
      });
  }

  public handleIdChange(e)
  {
    this.setState({
      id: e.target.value,
    });
  }

  public renderSchedule(schedule)
  {
    return (
      <div key={schedule.id} style={{
        display: 'flex', justifyContent: 'space-between',
        width: '90%', padding: 10, borderBottom: '1px solid',
      }}>
        <div style={{ flex: 1 }}>{schedule.id}</div>
        <div style={{ flex: 1 }}>{schedule.name}</div>
        <div style={{ flex: 1 }}>{schedule.running ? 'running' : 'not running'}</div>
        <div style={{ flex: 1 }}>{schedule.shouldRunNext.toString()}</div>
        <div style={{ flex: 1.5 }}>
          <a href='#' onClick={() => this.updateSchedule(schedule.id)}>Update</a>,
          <a href='#' onClick={() => this.deleteSchedule(schedule.id)}>Delete</a>,
          <a href='#' onClick={() => this.duplicateSchedule(schedule.id)}>Duplicate</a>,
          <a href='#'>Log</a>,
          <a href='#' onClick={() => this.pauseSchedule(schedule.id)}>Pause</a>,
          <a href='#' onClick={() => this.unpauseSchedule(schedule.id)}>Unpause</a>,
          <a href='#' onClick={() => this.runSchedule(schedule.id)}>Run</a>,
          <a href='#' onClick={() => this.deleteSchedule(schedule.id)}>Set Status</a>
        </div>
      </div>
    );
  }

  public render()
  {
    const { scheduler } = this.props;
    const { id } = this.state;

    return (
      <div>
        id: <input style={{ width: 50 }} onChange={this.handleIdChange} value={id} />
        <ul>
          <li onClick={() => this.createSchedule()}>Create Schedule</li>
          <li onClick={() => this.createInvalidSchedule()}>Create Invalid Schedule and handle error</li>
        </ul>
        <div style={{ display: 'none' }}>
          {this.state.responseText}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {
            scheduler.schedules !== null ?
              (
                scheduler.schedules.reduce(
                  (scheduleRows, s, sId) => scheduleRows.concat(
                    this.renderSchedule(s),
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

export default Util.createTypedContainer(
  Scheduler,
  ['scheduler'],
  { schedulerActions: SchedulerActions },
);
