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

import Util from './../util/Util.tsx';
import UserTypes from './../users/UserTypes.tsx';
import RoleTypes from './../roles/RoleTypes.tsx';
import BuilderTypes from './../builder/BuilderTypes.tsx';
import * as Immutable from 'immutable';
import {IResultsConfig} from '../builder/components/results/ResultsConfig.tsx';

export module LibraryTypes
{
  export enum EVariantStatus
  {
    // This order must be consistent with Midway
    Archive,
    Build,
    Approve,
    Live,
  }

  class VariantC
  {
    id = "";
    name = "";
    lastEdited = "";
    lastUsername = "";
    algorithmId = "";
    groupId = "";
    resultsConfig = null;
    mode = "";
    tql = "";
    status = EVariantStatus.Build;
    version = false;
    db = '';
    deckOpen = true;
    
    isDefault = false;

    cards = Immutable.List([]);
    inputs = Immutable.List([]);
    
    // for DB storage
    type = "variant";
    dbFields = ['groupId', 'algorithmId', 'status'];
    dataFields = ['name', 'lastEdited', 'lastUsername', 'cards', 'inputs', 'mode', 'tql', 'resultsConfig', 'db', 'deckOpen', 'isDefault'];    
  }
  export interface Variant extends VariantC, IRecord<Variant> {}
  const Variant_Record = Immutable.Record(new VariantC());
  export const _Variant = (config?:any) => {
    let v = new Variant_Record(Util.extendId(config || {})) as any as Variant;
    if(!config || !config.lastUsername || !config.lastEdited)
    {
      v = touchVariant(v);
    }
    return v;
  }
  
  export function touchVariant(v: Variant): Variant
  {
    return v.set('lastEdited', new Date())
      .set('lastUsername', localStorage['username']);
  }
  
  export function variantForSave(v: Variant): Variant
  {
    v = touchVariant(v);
    v = v.set('cards', BuilderTypes.cardsForServer(v.cards));
    v = v.set('resultsConfig', v.resultsConfig.toJS());
    return v;
  }
  
  export enum EAlgorithmStatus
  {
    // This order must be consistent with Midway
    Archive,  
    Live,
  }

  class AlgorithmC
  {
    id = "";
    name = "";
    lastEdited = "";
    lastUsername = "";
    groupId = "";
    variants = Immutable.Map({});
    variantsOrder = Immutable.List([]);
    status = EAlgorithmStatus.Live;
    
    // for DB storage
    type = "algorithm";
    dbFields = ['groupId', 'status'];
    dataFields = ['name', 'lastEdited', 'lastUsername', 'variantsOrder'];
  }
  const Algorithm_Record = Immutable.Record(new AlgorithmC());
  export interface Algorithm extends AlgorithmC, IRecord<Algorithm> {}
  export const _Algorithm = (config?:any) => {
    return new Algorithm_Record(Util.extendId(config || {})) as any as Algorithm;
  }

  export const groupColors =
  [
    '#00A7F7',
    '#00BCD6',
    '#009788',
    '#48B14B',
    '#8AC541',
    '#CCDD1F',
    '#FFEC18',
    '#FFC200',
    '#FF9900',
    '#5F7D8C',
  ];

  export enum EGroupStatus
  {
    // This order must be consistent with Midway
    Archive,
    Live,
  }
  
  class GroupC
  {
    id = "";
    name = "";
    lastEdited = "";
    lastUsername = "";
    usernames = Immutable.List([]);
    algorithms = Immutable.Map({});
    algorithmsOrder = Immutable.List([]);
    status = EGroupStatus.Live;
    
    // for DB storage
    type = "group";
    dbFields = ['status'];
    dataFields = ['name', 'lastEdited', 'lastUsername', 'algorithmsOrder'];
  }
  const Group_Record = Immutable.Record(new GroupC());
  export interface Group extends GroupC, IRecord<Group> {}
  export const _Group = (config?:any) => {
    return new Group_Record(Util.extendId(config || {})) as any as Group;
  }
  
  export function nameForStatus(status:EVariantStatus): string
  {
    switch(status)
    {
      case EVariantStatus.Approve:
        return 'Approve';
      case EVariantStatus.Archive:
        return 'Archive';
      case EVariantStatus.Build:
        return 'Build';
      case EVariantStatus.Live:
        return 'Live';
      default:
        return 'None';
    }
  }
  
  export function colorForStatus(status:EVariantStatus): string
  {
    switch(status)
    {
      case EVariantStatus.Approve:
        return '#bf5bff';
      case EVariantStatus.Archive:
        return '#ff735b';
      case EVariantStatus.Build:
        return '#00a7f7';
      case EVariantStatus.Live:
        return '#48b14b';
      default:
        return '#000';
    }
  }
}

export default LibraryTypes;