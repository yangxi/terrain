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
import TerrainComponent from 'common/components/TerrainComponent';
import TerrainTabs from 'common/components/TerrainTabs';
import ETLNotifications from 'etl/components/ETLNotifications';
import { ETLActions } from 'etl/ETLRedux';
import IntegrationEditorPage from 'etl/integrations/components/IntegrationEditorPage';
import IntegrationList from 'etl/integrations/components/IntegrationList';
import TemplateList from 'etl/templates/components/TemplateList';
import ETLWalkthrough from 'etl/walkthrough/components/ETLWalkthrough';
import Jobs from 'jobs/components/Jobs';
import * as React from 'react';
import { Route, Switch } from 'react-router-dom';
import ScheduleEditor from 'scheduler/components/ScheduleEditor';
import ScheduleList from 'scheduler/components/ScheduleList';
import { ETLTemplate } from 'shared/etl/immutable/TemplateRecords';
import Util from 'util/Util';
import './DataTabs.less';
import ETLEditorPage from './ETLEditorPage';

interface DataTabsProps
{
  templates: List<ETLTemplate>;
  etlActions?: typeof ETLActions;
  children: JSX.Element;
  location: any;
}

class DataTabs extends TerrainComponent<DataTabsProps>
{
  public tabs = [
    { key: 'templates', label: 'Templates' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'schedules', label: 'Schedules' },
    { key: 'jobs', label: 'Jobs' },

    { key: 'newtemplate', label: 'New Import or Export' },
  ];

  public tabToRouteMap = {
    templates: '/data/templates',
    integrations: '/data/integrations',
    schedules: '/data/schedules',
    jobs: '/data/jobs',

    newtemplate: '/data/newtemplate',
  };

  public componentWillMount()
  {
    this.props.etlActions({
      actionType: 'fetchTemplates',
    });

    this.props.etlActions({
      actionType: 'getIntegrations',
    });
    // TODO lock UI until done?
  }

  public render()
  {
    const { children, location } = this.props;

    return (
      <div className='etl'>
        <div className='etl-tabs'>
          <TerrainTabs
            tabs={this.tabs}
            tabToRouteMap={this.tabToRouteMap}
            location={location}
          >
            <Switch>
              <Route exact path='/data/templates' component={TemplateList} />
              <Route exact path='/data/newtemplate/:step?' component={ETLWalkthrough} />
              <Route exact path='/data/templates/edit/new' component={ETLEditorPage} />
              <Route exact path='/data/templates/edit/algorithmId=:algorithmId' component={ETLEditorPage} />
              <Route exact path='/data/templates/edit/templateId=:templateId' component={ETLEditorPage} />

              <Route exact path='/data/integrations' component={IntegrationList} />
              <Route exact path='/data/integrations/edit/integrationId=:integrationId' component={IntegrationEditorPage} />

              <Route exact path='/data/schedules' component={ScheduleList} />
              <Route exact path='/data/schedules/edit/scheduleId=:scheduleId' component={ScheduleEditor} />
              <Route exact path='/data/jobs' component={Jobs} />
            </Switch>
          </TerrainTabs>
          <ETLNotifications />
        </div>
      </div>
    );
  }
}

export default Util.createContainer(
  DataTabs,
  [],
  { etlActions: ETLActions },
);
