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

import TransformationNodeInfo from './info/TransformationNodeInfo';
import { TransformationEngine } from 'shared/transformations/TransformationEngine';
import EngineUtil from 'shared/transformations/util/EngineUtil';
import { ETLFieldTypes, FieldTypes } from 'shared/etl/types/ETLTypes';

import { List } from 'immutable';

import { visitHelper } from 'shared/transformations/TransformationEngineNodeVisitor';
import TransformationNodeType, { NodeOptionsType } from 'shared/transformations/TransformationNodeType';
import TransformationVisitError from 'shared/transformations/TransformationVisitError';
import TransformationVisitResult from 'shared/transformations/TransformationVisitResult';
import { KeyPath } from 'shared/util/KeyPath';
import * as yadeep from 'shared/util/yadeep';
import TransformationNode from './TransformationNode';

import * as _ from 'lodash';

const TYPECODE = TransformationNodeType.CaseNode;

export class CaseTransformationNode extends TransformationNode
{
  public typeCode = TYPECODE;

  public transform(doc: object)
  {
    const opts = this.meta as NodeOptionsType<TransformationNodeType.CaseNode>;

    return visitHelper(this.fields, doc, { document: doc }, (kp, el) =>
    {
      if (typeof el !== 'string')
      {
        return {
          errors: [
            {
              message: 'Attempted to change the case of a non-string field (this is not supported)',
            } as TransformationVisitError,
          ],
        } as TransformationVisitResult;
      }
      else
      {
        switch (opts.format)
        {
          case 'uppercase':
            yadeep.set(doc, kp, el.toUpperCase());
            break;
          case 'lowercase':
            yadeep.set(doc, kp, el.toLowerCase());
            break;
          case 'titlecase':
            yadeep.set(doc, kp, el.toLowerCase().replace(/[^\s_\-/]*/g, (word) =>
              word.replace(/./, (ch) => ch.toUpperCase()),
            ));
            break;
          case 'camelcase':
            yadeep.set(doc, kp, _.camelCase(el));
            break;
          case 'pascalcase':
            yadeep.set(doc, kp, _.upperFirst(_.camelCase(el)));
            break;
          default:
            return {
              errors: [
                {
                  message: 'Unknown case format specified',
                } as TransformationVisitError,
              ],
            } as TransformationVisitResult;
        }
      }
    });
  }
}

class CaseTransformationInfoC extends TransformationNodeInfo
{
  public typeCode = TYPECODE;
  public humanName = 'Change Case';
  public description = 'Change case for text fields (e.g. lowercase, uppercase)';
  public nodeClass = CaseTransformationNode;

  public editable = true;
  public creatable = true;

  public isAvailable(engine: TransformationEngine, fieldId: number)
  {
    return EngineUtil.getRepresentedType(fieldId, engine) === 'string';
  }
}

export const CaseTransformationInfo = new CaseTransformationInfoC();
