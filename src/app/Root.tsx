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
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Ajax from 'util/Ajax';
import TerrainTools from 'util/TerrainTools';
import AppRouter from './AppRouter';
import TerrainStore from './store/TerrainStore';

declare global
{
  interface Window
  {
    TerrainTools: any;
  }
}

if (!DEV)
{
  // TerrainTools.setDefaultLogLevel('warn');
  // report uncaught errors in production
  window.onerror = (errorMsg, url, lineNo, columnNo, error) =>
  {
    const store = TerrainStore.getState() as Immutable.Map<string, any>;
    const user = store.get('users').currentUser;
    const userId = user && user.id;
    const libraryState = JSON.stringify(store.get('library').toJS());
    const builderState = JSON.stringify(store.get('builder').toJS());
    const location = JSON.stringify(window.location);
    const colorsState = store.get('colors').toJS();
    const msg = `${errorMsg} by ${userId}
      Location:
      ${location}

      Library State:
      ${libraryState}

      Builder State:
      ${builderState}

      Colors State:
      ${colorsState}

      Error Stack:
      ${(error != null && error.stack != null) ? error.stack : ''}
    `;

    $.post('https://lukeknepper.com/email.php', {
      msg,
      secret: '11235813',
    });

    return false;
  };
}
// TerrainTools.setLogLevel('info');
window.TerrainTools = TerrainTools;
TerrainTools.welcome();

Ajax.config({
  reduxStoreDispatch: TerrainStore.dispatch,
});

ReactDOM.render(
  <Provider store={TerrainStore}>
    <AppRouter />
  </Provider>,
  document.getElementById('app'), () =>
  {
    // tests can go here
  });
