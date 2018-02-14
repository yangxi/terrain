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
// tslint:disable:no-var-requires import-spacing max-classes-per-file no-invalid-this no-unused-expression

import * as classNames from 'classnames';
import TerrainComponent from 'common/components/TerrainComponent';
import * as _ from 'lodash';
import memoizeOne from 'memoize-one';
import * as Radium from 'radium';
import * as React from 'react';
import { backgroundColor, borderColor, buttonColors, Colors, fontColor, getStyle } from 'src/app/colors/Colors';
import Util from 'util/Util';

import * as Immutable from 'immutable';
const { List, Map } = Immutable;
import Autocomplete from 'common/components/Autocomplete';
import CheckBox from 'common/components/CheckBox';
import Dropdown from 'common/components/Dropdown';
import FadeInOut from 'common/components/FadeInOut';

// DynamicForm associated Types
export enum DisplayState
{
  Active,
  Inactive,
  Hidden,
}

export enum DisplayType
{
  TextBox = 'TextBox',
  NumberBox = 'NumberBox',
  CheckBox = 'CheckBox',
}

export interface InputDeclarationOptionTypes
{
  TextBox: {
    acOptions?: List<string>;
  };
  NumberBox: {
    acOptions?: List<string>;
    integerOnly?: boolean; // not implemented yet, just an example
  };
  CheckBox: {
    large?: boolean;
  };
}
export type OptionType<K extends keyof InputDeclarationOptionTypes> = InputDeclarationOptionTypes[K];

export interface InputDeclarationType<S>
{
  type: string;
  options: any; // one of InputDeclarationOptionTypes
  group?: string; // inputs with the same group value will show in a row
  displayName?: string; // defaults to type
  shouldShow?: (state: S) => DisplayState;
}

export type InputDeclarationMap<State extends {[k: string]: any}> =
{
  [key in keyof State]: InputDeclaration<State>; // is an inputDeclaration
}

export interface Props<FState>
{
  inputMap: InputDeclarationMap<FState>; // inputMap is memoized, so be careful about changing its properties!
  inputState: FState;
  onStateChange: (newState: FState) => void;
  handleConfirm: () => void;
}

// DynamicForm component types

type MatrixType<S> = List<MatrixRowType<S>>; // list of list of functions
type MatrixRowType<S> = List<MatrixCellFn<S>>;
type MatrixCellFn<S> = (state: S, key) => any;

export default class DynamicForm<S> extends TerrainComponent<Props<S>>
{
  public renderFnLookup:
    {[K in DisplayType]: (inputInfo, stateName, state, index, disabled) => any} =
  {
    [DisplayType.CheckBox]: this.renderCheckBox,
    [DisplayType.NumberBox]: this.renderNumberBox,
    [DisplayType.TextBox]: this.renderTextBox,
  }

  constructor(props)
  {
    super(props);
    this.setStateHOC = _.memoize(this.setStateHOC);
    this.computeRenderMatrix = memoizeOne(this.computeRenderMatrix);
  }

  public renderTextBox(inputInfo: InputDeclarationType<S>, stateName, state: S, index, disabled: boolean)
  {
    const options = inputInfo.options as OptionType<DisplayType.TextBox> || {};
    return (
      <div className='te-autocomplete-block' key={index}>
        <div className='te-label' style={fontColor(Colors().text2)}> {inputInfo.displayName} </div>
        <Autocomplete
          className='te-autocomplete'
          value={this.props.inputState[stateName]}
          onChange={this.setStateHOC(stateName)}
          options={options.acOptions}
          disabled={disabled}
        />
      </div>
    );
  }

  // TODO make this only accept numbers
  public renderNumberBox(inputInfo: InputDeclarationType<S>, stateName, state: S, index, disabled: boolean)
  {
    const options = inputInfo.options as OptionType<DisplayType.TextBox> || {};
    return (
      <div className='te-autocomplete-block' key={index}>
        <div className='te-label' style={fontColor(Colors().text2)}> {inputInfo.displayName} </div>
        <Autocomplete
          className='te-autocomplete'
          value={this.props.inputState[stateName]}
          onChange={this.setStateHOC(stateName)}
          options={options.acOptions}
          disabled={disabled}
        />
      </div>
    );
  }

  public renderCheckBox(inputInfo: InputDeclarationType<S>, stateName, state: S, index, disabled: boolean)
  {
    const options = inputInfo.options as OptionType<DisplayType.CheckBox> || {};
    return (
     <div
        className='te-checkbox-row'
        key={index}
        onClick={noop(disabled,
            this.setStateWithTransformHOC(stateName, (value, inputState) => !inputState[stateName] )
          )}
      >
        <CheckBox
          className='te-checkbox'
          disabled={disabled}
          checked={this.props.inputState[stateName]}
          onChange={() => null}
          large={options.large}
        />
        <div className='te-label'> {inputInfo.displayName} </div>
      </div>
    );
  }

  public renderInputElement(inputInfo: InputDeclarationType<S>, stateName, state: S, index): any
  {
    const displayState = inputInfo.shouldShow(state);
    const renderFn = this.renderFnLookup[inputInfo.type];
    return (
      <FadeInOut
        open={displayState === DisplayState.Hidden}
      >
        { renderFn(inputInfo, stateName, state, index, displayState) }
      </FadeInOut>
    );
  }

  public computeRenderMatrix(inputMap: InputDeclarationMap<S>)
  {
    let renderMatrix: MatrixType<S> = List([]);
    const groupToIndex = {};
    for (const stateName of Object.keys(inputMap))
    {
      const { group } = inputMap[stateName];
      const inputInfo: InputDeclarationType<S> = _.defaults({}, inputMap[stateName],
        { displayName: stateName, shouldShow: () => true }
      );
      let useIndex = renderMatrix.size;
      if (group !== undefined)
      {
        useIndex = _.defaults(groupToIndex, { group: useIndex })[group];
      }
      renderMatrix = renderMatrix.updateIn([useIndex], List([]), (value) =>
      {
        return (state, index) => this.renderInputElement(inputInfo, stateName, state, index);
      });
    }
    return renderMatrix;
  }

  public renderMatrixCell(cellFn: MatrixCellFn<S>, index)
  {
    return cellFn(this.props.inputState, index);
  }

  public renderMatrixRow(row: MatrixRowType<S>, index)
  {
    return (
      <div key={index}>
        {
          row.map(this.renderMatrixCell)
        }
      </div>
    );
  }

  public render()
  {
    const renderMatrix: MatrixType<S> = this.computeRenderMatrix(this.props.inputMap);
    return (
      <div>
        { renderMatrix.map(this.renderMatrixRow) }
      </div>
    );
  }

  // optional transformValue can change the value based on the state. This function is not transformed
  public setStateWithTransformHOC(stateName, transformValue: (value, state?: S) => any = (value) => value)
  {
    return (value) => {
      const shallowCopy = _.clone(this.props.inputState);
      const newValue = transformValue(value, this.props.inputState);
      shallowCopy[stateName] = newValue;
      this.props.onStateChange(shallowCopy);
    }
  }

  // This function is memoized
  public setStateHOC(stateName)
  {
    return (value) => {
      const shallowCopy = _.clone(this.props.inputState);
      shallowCopy[stateName] = value;
      this.props.onStateChange(shallowCopy);
    }
  }
}

function noop(disabled: boolean, fn)
{
  return disabled ? () => null : fn;
}

/*** Dynamic Form TYPE SORCERY! ***/
type DisplayTypeKeys = keyof typeof DisplayType;

// make sure that the DisplayType enum has keys equal to its values
type AssertEnumValuesEqualKeys = {
  [K in DisplayTypeKeys]: K
};
DisplayType as AssertEnumValuesEqualKeys; // if this is giving errors, double check that
// DisplayTypeKeys are equal to its values

// make sure that for every item in the DisplayType enum there's an associated InputDeclaration
type AssertOptionTypesExhaustive = {
  [K in DisplayType]: InputDeclarationOptionTypes[K]
}

// below are types that do some magic to add type checking to InputDeclarationMap
interface InputDeclarationHelper<K extends DisplayTypeKeys, State> extends InputDeclarationType<State>
{
  type: K;
  options: InputDeclarationOptionTypes[K];
}

type InputDeclarationBundle<State> = {
  [K in DisplayTypeKeys]: InputDeclarationHelper<K, State>
}

type InputDeclaration<State> = InputDeclarationBundle<State>[keyof InputDeclarationBundle<State>];
/*** End of Type Sorcery ***/

// interface FormState
// {
//   from: number;
//   length: number;
//   textField: string;
//   flag: boolean;
// }

// // should succeed
// const DeclarationMap: InputDeclarationMap<FormState> =
// {
//   from: {
//     type: DisplayType.NumberBox,
//     options: {

//     }
//   },
//   length: {
//     type: DisplayType.NumberRange,
//     options: {
//       from: 0,
//       to: -1,
//     }
//   },
//   textField: {
//     type: DisplayType.TextBox,
//     options: {
//       randomThing: 'test',
//     }
//   },
//   flag: {
//     type: DisplayType.CheckBox,
//     options: {}
//   }
// }
