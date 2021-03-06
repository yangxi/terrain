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
// tslint:disable:import-spacing

import { FileConfig } from 'shared/etl/immutable/EndpointRecords';
import { ConstrainedMap, GetType, TerrainRedux } from 'src/app/store/TerrainRedux';
import { _WalkthroughState, WalkthroughState } from './ETLWalkthroughTypes';

type CfgOrHandler = ((cfg: FileConfig) => FileConfig) | FileConfig;
type OptionsOrHandler = ((options: object) => object) | object;

export interface WalkthroughActionTypes
{
  setState: {
    actionType: 'setState',
    state: Partial<{
      [k in keyof WalkthroughState]: WalkthroughState[k];
    }>;
  };
  resetState: {
    actionType: 'resetState',
  };
  // provide a value to set, or a function that calculates what value to set
  setFileConfig: {
    actionType: 'setFileConfig';
    sourceConfig?: CfgOrHandler;
    sinkConfig?: CfgOrHandler;
  };
  // reminder: options is not an immutable object, unlike fileConfig
  setEndpointOptions: {
    actionType: 'setEndpointOptions';
    sourceOptions?: OptionsOrHandler;
    sinkOptions?: OptionsOrHandler;
  };
}

class WalkthroughRedux extends TerrainRedux<WalkthroughActionTypes, WalkthroughState>
{
  public reducers: ConstrainedMap<WalkthroughActionTypes, WalkthroughState> =
    {
      setState: (state, action) =>
      {
        let newState = state;
        const toUpdate = action.payload.state;
        for (const k of Object.keys(toUpdate))
        {
          newState = newState.set(k, toUpdate[k]);
        }
        return newState;
      },
      resetState: (state, action) =>
      {
        return _WalkthroughState();
      },
      setFileConfig: (state, action) =>
      {
        let newState = state;
        const { sourceConfig, sinkConfig } = action.payload;
        if (sourceConfig != null)
        {
          if (typeof sourceConfig === 'function')
          {
            newState = newState.updateIn(['source', 'fileConfig'], sourceConfig);
          }
          else
          {
            newState = newState.setIn(['source', 'fileConfig'], sourceConfig);
          }
        }
        if (sinkConfig != null)
        {
          if (typeof sinkConfig === 'function')
          {
            newState = newState.updateIn(['sink', 'fileConfig'], sinkConfig);
          }
          else
          {
            newState = newState.setIn(['sink', 'fileConfig'], sinkConfig);
          }
        }
        return newState;
      },
      setEndpointOptions: (state, action) =>
      {
        let newState = state;
        const { sourceOptions, sinkOptions } = action.payload;
        if (sourceOptions != null)
        {
          if (typeof sourceOptions === 'function')
          {
            newState = newState.updateIn(['source', 'options'], sourceOptions);
          }
          else
          {
            newState = newState.setIn(['source', 'options'], sourceOptions);
          }
        }
        if (sinkOptions != null)
        {
          if (typeof sinkOptions === 'function')
          {
            newState = newState.updateIn(['sink', 'options'], sinkOptions);
          }
          else
          {
            newState = newState.setIn(['sink', 'options'], sinkOptions);
          }
        }
        return newState;
      },
    };
}

const ReduxInstance = new WalkthroughRedux();
export const WalkthroughActions = ReduxInstance._actionsForExport();
export const WalkthroughReducers = ReduxInstance._reducersForExport(_WalkthroughState);
export declare type WalkthroughActionType<K extends keyof WalkthroughActionTypes> =
  GetType<K, WalkthroughActionTypes>;
