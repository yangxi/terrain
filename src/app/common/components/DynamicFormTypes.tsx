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
// tslint:disable:no-var-requires no-unused-expression strict-boolean-expressions

import * as React from 'react';

export enum DisplayType
{
  TextBox = 'TextBox',
  NumberBox = 'NumberBox',
  CheckBox = 'CheckBox',
  Pick = 'Pick',
  TagsBox = 'TagsBox',
  Custom = 'Custom',
  Delegate = 'Delegate',
  Switch = 'Switch',
}

export type InputDeclarationMap<State extends { [k: string]: any }> =
  {
    [key in keyof State]?: InputDeclaration<State>; // resolves to a more strongly typed version of InputDeclarationType
  };

// additional types to import / look at if using advanced options
export interface InputDeclarationOptionTypes<S = any>
{
  TextBox: {
    acOptions?: (state: S) => List<string>;
    debounce?: boolean;
  };
  NumberBox: {
    acOptions?: (state: S) => List<string>;
    debounce?: boolean;
  };
  CheckBox: {
    large?: boolean;
  };
  Pick: {
    pickOptions: (state: S) => List<string | number>;
    indexResolver?: (option) => number;
    displayNames?: (state: S) => Immutable.Map<any, string>;
    textColor?: (index: number) => string;
    wrapperHeight?: string;
  };
  TagsBox: {
    acOptions?: (state: S) => List<string>;
    debounce?: boolean;
    transformValue?: (value) => string[];
    untransformValue?: (value) => any;
  };
  Custom: {
    render: (state: S, disabled: boolean) => any;
  };
  Delegate: {
    component: React.ComponentClass<any>;
    inputKey?: string; // default to 'inputState'
    onChangeKey?: string; // defaults to 'onChange'
    isList?: boolean;
    listDefaultValue?: any;
  };
  Switch: {
    values: List<string>;
  };
}

export interface InputDeclarationType<S>
{
  type: string; // TextBox, NumberBox etc
  options?: any; // one of InputDeclarationOptionTypes
  displayName?: string; // defaults to the state name
  group?: string; // inputs with the same group value will show in a row
  getDisplayState?: (state: S) => DisplayState;
  widthFactor?: number; // defaults to 4, set to -1 to have no set width
  style?: object; // extend the cell style
  help?: string;
}

export type OptionType<K extends keyof InputDeclarationOptionTypes, S = any> = InputDeclarationOptionTypes<S>[K];
export enum DisplayState
{
  Active,
  Inactive,
  Hidden,
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
};

// below are types that do some magic to add type checking to InputDeclarationMap
interface InputDeclarationHelper<K extends DisplayTypeKeys, State> extends InputDeclarationType<State>
{
  type: K;
  options?: InputDeclarationOptionTypes<State>[K];
}

type InputDeclarationBundle<State> = {
  [K in DisplayTypeKeys]: InputDeclarationHelper<K, State>
};

type InputDeclaration<State> = InputDeclarationBundle<State>[keyof InputDeclarationBundle<State>];
/*** End of Type Sorcery ***/
