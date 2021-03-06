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
import { _AnalyticsState, AnalyticsState } from 'analytics/data/AnalyticsStore';
import { shallow } from 'enzyme';
import * as Immutable from 'immutable';
import { AlgorithmsColumn } from 'library/components/AlgorithmsColumn';
import { _LibraryState } from 'library/LibraryTypes';
import * as LibraryTypes from 'library/LibraryTypes';
import * as React from 'react';

import createHistory from 'history/createBrowserHistory';

const browserHistory = createHistory();

describe('AlgorithmsColumn', () =>
{
  const categoryId = 1;
  const groupId = 2;
  const algorithmId = 3;
  let library = _LibraryState({
    categories: Immutable.Map<number, LibraryTypes.Category>(),
    groups: Immutable.Map<number, LibraryTypes.Category>(),
    algorithms: Immutable.Map<number, LibraryTypes.Algorithm>(),
  });

  library = library
    .setIn(['categories', categoryId], LibraryTypes._Category({
      id: categoryId,
      name: 'Category 1',
    }))
    .setIn(['groups', groupId], LibraryTypes._Group({
      id: groupId,
      name: 'Group 1',
    }))
    .setIn(['algorithms', algorithmId], LibraryTypes._Algorithm({
      id: algorithmId,
      name: 'Algorithm 1',
    }));

  const analytics: AnalyticsState = _AnalyticsState({
    loaded: true,
    data: Immutable.Map(),
    selectedMetric: 1,
  });

  const analyticsActions = {
    selectAnalyticsConnection: (connectionName) => { return; },
    fetch: () => { return; },
  };

  const selectedAlgorithm = 3;

  let algorithmsColumnComponent = null;

  beforeEach(() =>
  {
    algorithmsColumnComponent = shallow(
      <AlgorithmsColumn
        basePath={'/library'}
        algorithms={library.algorithms}
        algorithmsOrder={library.groups.get(groupId).algorithmsOrder}
        categoryId={categoryId}
        groupId={groupId}
        groups={library.groups}
        selectedAlgorithm={selectedAlgorithm}
        analytics={analytics}
        analyticsActions={analyticsActions}
        canPinItems={false}
        match={{ params: { categoryId: '1' }, location: { query: '' } }}
        location={{}}
      />,
    );
  });

  describe('#handleDoubleClick', () =>
  {
    describe('when canPinItems is set to false', () =>
    {
      it('should redirect to the builder', () =>
      {
        browserHistory.push = jest.fn();
        algorithmsColumnComponent.instance().handleDoubleClick(algorithmId);

        expect(algorithmsColumnComponent.instance().browserHistory.push).toHaveBeenCalledTimes(1);
        expect(algorithmsColumnComponent.instance().browserHistory.push).toHaveBeenCalledWith(`/builder/?o=${algorithmId}`);
      });
    });

    describe('when canPinItems is set to true', () =>
    {
      it('should NOT redirect to the builder', () =>
      {
        algorithmsColumnComponent = shallow(
          <AlgorithmsColumn
            basePath={'/library'}
            algorithms={library.algorithms}
            algorithmsOrder={library.groups.get(groupId).algorithmsOrder}
            categoryId={categoryId}
            groupId={groupId}
            groups={library.groups}
            selectedAlgorithm={selectedAlgorithm}
            analytics={analytics}
            analyticsActions={analyticsActions}
            canPinItems={true}
            match={{ params: { categoryId: '1' }, location: { query: '' } }}
            location={{}}
          />,
        );

        browserHistory.push = jest.fn();
        algorithmsColumnComponent.instance().handleDoubleClick(algorithmId);

        expect(algorithmsColumnComponent.instance().browserHistory.push).not.toHaveBeenCalled();
      });
    });
  });
});
