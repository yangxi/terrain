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
// tslint:disable:no-var-requires no-empty-interface max-classes-per-file

import { DisplayState, DisplayType, InputDeclarationMap } from 'common/components/DynamicFormTypes';
import { TransformationNode } from 'etl/templates/FieldTypes';
import { TransformationEngine } from 'shared/transformations/TransformationEngine';
import TransformationNodeType from 'shared/transformations/TransformationNodeType';
import { FactoryArgs, transformationFormFactory, TransformationFormProps } from './TransformationFormFactory';

import * as Immutable from 'immutable';
const { List, Map } = Immutable;

/*
 *  How to add a transformations to the UI:
 *  1: See 'SUBSTRING' for an example of how to declare the transformation UI config.
 *  2: Add the transformation class to the getTransformationForm switch statement
 */

export function getTransformationForm(type: TransformationNodeType): React.ComponentClass<TransformationFormProps>
{
  switch (type)
  {
    case TransformationNodeType.CapitalizeNode:
      return CapitalizeClass as any;
    case TransformationNodeType.SubstringNode:
      return SubstringClass;
    default:
      return null;
  }
}

export const availableTransformations: List<TransformationNodeType> = determineAvailableTransformations();
// all transformation types for which getTransformationForm does not return null

function determineAvailableTransformations(): List<TransformationNodeType>
{
  let typeList = List([]);
  for (const type in TransformationNodeType)
  {
    if (getTransformationForm(type as TransformationNodeType) !== null)
    {
      typeList = typeList.push(type);
    }
  }
  return typeList;
}

// CAPITALIZE
interface CapitalizeState
{

}

const capitalizeInputMap = {

};

const capitalizeArgs: FactoryArgs<CapitalizeState, TransformationNodeType.CapitalizeNode> = {
  inputMap: capitalizeInputMap,
  type: TransformationNodeType.CapitalizeNode,
  initialState: {},
};

const CapitalizeClass =
  transformationFormFactory<CapitalizeState, TransformationNodeType.CapitalizeNode>(capitalizeArgs);

// SUBSTRING
interface SubstringState
{
  from: number;
  length: number;
}

const substringInputMap: InputDeclarationMap<SubstringState> = {
  from: {
    type: DisplayType.NumberBox,
    displayName: 'From Position',
    group: 'main',
  },
  length: {
    type: DisplayType.NumberBox,
    displayName: 'Substring Length',
    group: 'main',
  },
};

const substringArgs: FactoryArgs<SubstringState, TransformationNodeType.SubstringNode> = {
  inputMap: substringInputMap,
  type: TransformationNodeType.SubstringNode,
  initialState: {
    from: 0,
    length: 3,
  },
};

const SubstringClass =
  transformationFormFactory<SubstringState, TransformationNodeType.SubstringNode>(substringArgs);
