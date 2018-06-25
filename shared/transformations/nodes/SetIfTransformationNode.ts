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
// tslint:disable:max-classes-per-file

import { ETLFieldTypes, FieldTypes } from 'shared/etl/types/ETLTypes';
import { TransformationEngine } from 'shared/transformations/TransformationEngine';
import EngineUtil from 'shared/transformations/util/EngineUtil';
import TransformationNodeInfo from 'shared/transformations/TransformationNodeInfo';

import { List } from 'immutable';

import { visitHelper } from 'shared/transformations/TransformationEngineNodeVisitor';
import TransformationNodeType, { NodeOptionsType } from 'shared/transformations/TransformationNodeType';
import TransformationVisitError from 'shared/transformations/TransformationVisitError';
import TransformationVisitResult from 'shared/transformations/TransformationVisitResult';
import { KeyPath } from 'shared/util/KeyPath';
import * as yadeep from 'shared/util/yadeep';
import TransformationNode from 'shared/transformations/TransformationNode';

const TYPECODE = TransformationNodeType.SetIfNode;

export class SetIfTransformationNode extends TransformationNode
{
  public readonly typeCode = TYPECODE;

  public transform(doc: object)
  {
    const opts = this.meta as NodeOptionsType<TransformationNodeType.SetIfNode>;

    return visitHelper(this.fields, doc, { document: doc }, (kp, el) =>
    {
      let condition = setIfHelper(opts, el);
      condition = opts.invert ? !condition : condition;
      if (condition)
      {
        yadeep.set(doc, kp, opts.newValue, { create: true });
      }
    });
  }
}

class SetIfTransformationInfoC extends TransformationNodeInfo
{
  public readonly typeCode = TYPECODE;
  public humanName = 'Set If';
  public description = 'Checks if a field matches a certain special value, and if so, replaces that value';
  public nodeClass = SetIfTransformationNode;

  public editable = true;
  public creatable = true;

  public isAvailable(engine: TransformationEngine, fieldId: number)
  {
    const type = EngineUtil.getRepresentedType(fieldId, engine);
    return type === 'number' || type === 'string' || type === 'boolean';
  }
}

export const SetIfTransformationInfo = new SetIfTransformationInfoC();

function setIfHelper(o: NodeOptionsType<TransformationNodeType.SetIfNode>, e: any)
{
  if (o.filterNaN)
  {
    return isNaN(e);
  }
  else if (o.filterUndefined)
  {
    return e === undefined;
  }
  else if (o.filterNull)
  {
    return e === null;
  }
  else if (o.filterStringNull)
  {
    return e === 'null';
  }
  else if (o.filterValue !== undefined)
  {
    return e === o.filterValue;
  }

  return false;
}
