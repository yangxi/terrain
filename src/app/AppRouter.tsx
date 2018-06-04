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
import createHistory from 'history/createBrowserHistory';
import * as React from 'react';
import { Redirect as RRedirect, Route, Router } from 'react-router';

import App from './App';
import TerrainComponent from './common/components/TerrainComponent';

import IntegrationEditorPage from './etl/integrations/components/IntegrationEditorPage';
import IntegrationList from './etl/integrations/components/IntegrationList';

class AppRouter extends TerrainComponent<{}> {
  public render()
  {
    return (
      <Router history={this.browserHistory}>
        <Route path='/' component={App} />
      </Router>
    );
  }
}

export default AppRouter;

/*
<Router history={this.browserHistory}>
        <Route path='/' component={App}>
          <Route exact path='/' component={Redirect} />

          <Route path='/builder' component={Builder} />
          <Route path='/builder/:config' component={Builder} />
          <Route path='/builder/:config/:splitConfig' component={Builder} />

          <Route path='/library'>
            <Route exact path='/' component={libraryLibrary} />
            <Route path=':categoryId' component={libraryLibrary}>
              <Route exact path='/' component={libraryLibrary} />
              <Route path=':groupId' component={libraryLibrary}>
                <Route exact path='/' component={libraryLibrary} />
                <Route path=':algorithmId' component={libraryLibrary}>
                  <Route exact path='/' component={libraryLibrary} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path='/account' component={Account}>
            <Route exact path='/' component={Profile} />
            <Route path='/account/profile' component={Profile} />
            <Route path='/account/profile/edit' component={EditProfile} />
            <Route path='/account/settings' component={Settings} />
            <Route path='/account/notifications' component={Notifications} />
            <Route path='/account/connections' component={Connections} />
            <Route path='/account/team' component={Team} />
          </Route>

          <Route path='/manual' component={ManualWrapper} />
          <Route path='/manual/:term' component={ManualWrapper} />

          <Route path='/users/:userId' component={Profile} />

          <Route path='/reporting' component={Placeholder} />

          <Route path='/logout' component={Logout} />

          <Route path='/x' component={X} />
          <Route path='/x/:x' component={X} />

          <Route path='/ui' component={UIComponentsPage} />

          <Route path='/browser' component={Redirect} />
          <Route path='/browser/:a' component={Redirect} />
          <Route path='/browser/:a/:b' component={Redirect} />
          <Route path='/browser/:a/:b/:c' component={Redirect} />

          <Route path='/schema' component={SchemaPage} />

          <Route path='/data' component={DataTabs}>
            <Route exact path='/' component={() => <RRedirect to='/data/templates' />} />
            <Route path='templates' component={TemplateList} />
            <Route path='newtemplate(/:step)' component={ETLWalkthrough} />
            <Route path='templates/edit/new' component={ETLEditorPage} />
            <Route path='templates/edit/algorithmId=:algorithmId' component={ETLEditorPage} />
            <Route path='templates/edit/templateId=:templateId' component={ETLEditorPage} />

            <Route path='integrations' component={IntegrationList} />
            <Route path='integrations/edit/integrationId=:integrationId' component={IntegrationEditorPage} />

            <Route path='schedules' component={ScheduleList} />
            <Route path='jobs' component={Jobs} />
          </Route>

          <Route path='/analytics'>
            <Route exact path='/' component={analyticsLibrary} />
            <Route path=':categoryId' component={analyticsLibrary}>
              <Route exact path='/' component={analyticsLibrary} />
              <Route path=':groupId' component={analyticsLibrary}>
                <Route exact path='/' component={analyticsLibrary} />
                <Route path=':algorithmId' component={analyticsLibrary}>
                  <Route exact path='/' component={analyticsLibrary} />
                </Route>
              </Route>
            </Route>
          </Route>

        </Route>
      </Router>
      */
