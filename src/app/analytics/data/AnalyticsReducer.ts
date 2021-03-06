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

import ActionTypes from './AnalyticsActionTypes';
import { _AnalyticsState, AnalyticsState } from './AnalyticsStore';

const AnalyticsReducer = {};

AnalyticsReducer[ActionTypes.fetchStart] =
  (state, action: Action<{}>) =>
  {
    return state
      .set('loaded', false)
      .set('errors', []);
  };

AnalyticsReducer[ActionTypes.fetchSuccess] =
  (state, action: Action<{ analytics: any, dateRangeDomain: any }>) =>
  {
    const { analytics, dateRangeDomain } = action.payload;
    let nextState = state;

    Object.keys(analytics).forEach((algorithmId) =>
    {
      const algorithmAnalytics = analytics[algorithmId];
      nextState = nextState
        .set('loaded', true)
        .setIn(['data', algorithmId], algorithmAnalytics)
        .set('selectedDateRangeDomain', dateRangeDomain)
        .set('errors', []);
    });

    return nextState;
  };

AnalyticsReducer[ActionTypes.fetchFailure] =
  (state, action: Action<{ errors: string[] }>) =>
  {
    const { errors } = action.payload;
    const nextState = state
      .set('loaded', true)
      .set('errors', state.get('errors').concat(errors));

    return nextState;
  };

AnalyticsReducer[ActionTypes.selectMetric] =
  (state, action: Action<{ metric: string }>) =>
  {
    const { metric } = action.payload;
    return state.set('selectedMetric', metric);
  };

AnalyticsReducer[ActionTypes.selectInterval] =
  (state, action: Action<{ intervalId: string }>) =>
  {
    const { intervalId } = action.payload;
    return state.set('selectedInterval', intervalId);
  };

AnalyticsReducer[ActionTypes.selectDateRange] =
  (state, action: Action<{ dateRangeId: string }>) =>
  {
    const { dateRangeId } = action.payload;
    return state.set('selectedDateRange', dateRangeId);
  };

AnalyticsReducer[ActionTypes.selectAnalyticsConnection] =
  (state, action: Action<{ connectionName: string }>) =>
  {
    const { connectionName } = action.payload;
    return state.set('selectedAnalyticsConnection', connectionName);
  };

AnalyticsReducer[ActionTypes.pinAlgorithm] =
  (state, action: Action<{ algorithmId: ID }>) =>
  {
    const { algorithmId } = action.payload;
    const isAlgorithmPinned = state.getIn(['pinnedAlgorithms', algorithmId], false);

    return state.setIn(['pinnedAlgorithms', algorithmId], !isAlgorithmPinned);
  };

AnalyticsReducer[ActionTypes.clearPinned] =
  (state, action: Action<{}>) =>
  {
    return state.set('pinnedAlgorithms', state.pinnedAlgorithms.clear());
  };

AnalyticsReducer[ActionTypes.fetchAvailableMetricsSuccess] =
  (state, action: Action<{ availableMetrics: any[] }>) =>
  {
    const { availableMetrics } = action.payload;

    return state.set(
      'availableMetrics',
      state.availableMetrics.clear().concat(availableMetrics),
    );
  };

const AnalyticsReducerWrapper = (state: AnalyticsState = _AnalyticsState(), action) =>
{
  let nextState = state;
  if (AnalyticsReducer[action.type])
  {
    nextState = AnalyticsReducer[action.type](state, action);
  }

  return nextState;
};

export default AnalyticsReducerWrapper;
