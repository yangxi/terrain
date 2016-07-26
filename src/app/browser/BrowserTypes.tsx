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
import * as Immutable from 'immutable';

export module BrowserTypes
{
  export enum EVariantStatus
  {
    // This order must be consistent with Midway
    Archive,
    Build,
    Approve,
    Live,
  }

  let _Variant = Immutable.Record(
  {
    id: "",
    name: "",
    lastEdited: "",
    lastUsername: "",
    algorithmId: "",
    groupId: "",
    mode: "",
    tql: "",
    status: EVariantStatus.Build,
    version: true,

    cards: Immutable.List([]),
    inputs: Immutable.List([]),
    
    // for DB storage
    type: "variant",
    dbFields: ['groupId', 'algorithmId', 'status'],
    dataFields: ['name', 'lastEdited', 'lastUsername', 'cards', 'inputs'],    
    statusMap: (s:EVariantStatus) => EVariantStatus[s],
  });
  export class Variant extends _Variant
  {
    id: ID;
    name: string;
    lastEdited: any;
    lastUsername: string;
    status: EVariantStatus;
    algorithmId: ID;
    groupId: Group;

    cards: any;
    inputs: any;
    mode: string;
    tql: string;
    version: boolean;
    
    type: string;
    dbFields: string[]; // fields saved directly to DB
    dataFields: string[]; // fields saved in metadata
  }
  export function newVariant(algorithmId: string, groupId: string, id?: ID, name?: string, status?: EVariantStatus):Variant
  {
    return touchVariant(new Variant(Util.extendId({ algorithmId, groupId, id, name, status})));
  }
  
  export function touchVariant(v: Variant): Variant
  {
    return v.set('lastEdited', new Date())
      .set('lastUsername', localStorage['username']) as Variant;
  }
  
  export enum EAlgorithmStatus
  {
    // This order must be consistent with Midway
    Archive,  
    Live,
  }


  let _Algorithm = Immutable.Record(
  {
    id: "",
    name: "",
    lastEdited: "",
    lastUsername: "",
    groupId: "",
    variants: Immutable.Map({}),
    variantsOrder: Immutable.List([]),
    status: EAlgorithmStatus.Live,
    
    // for DB storage
    type: "algorithm",
    dbFields: ['groupId', 'status'],
    dataFields: ['name', 'lastEdited', 'lastUsername', 'variantsOrder'],
    statusMap: (s:EAlgorithmStatus) => EAlgorithmStatus[s],
  });
  export class Algorithm extends _Algorithm
  {
    id: ID;
    name: string;
    lastEdited: string;
    lastUsername: string;
    groupId: ID;
    variants: Immutable.Map<ID, Variant>;
    variantsOrder: Immutable.List<ID>;
    status: EAlgorithmStatus;
    
    type: string;
    dbFields: string[]; // fields saved directly to DB
    dataFields: string[]; // fields saved in metadata
  }
  export function newAlgorithm(groupId: string, id?: ID, name?: string, lastEdited?: string, lastUsername?: string,
    variants?: Immutable.Map<ID, Variant>, variantsOrder?: Immutable.List<ID>, status?: EAlgorithmStatus):Algorithm
  {
    return new Algorithm(Util.extendId({ groupId, id, name, lastEdited, lastUsername, variants, variantsOrder, status }));
  }


  export enum EGroupStatus
  {
    // This order must be consistent with Midway
    Archive,
    Live,
  }
  let _Group = Immutable.Record(
  {
    id: "",
    name: "",
    lastEdited: "",
    lastUsername: "",
    usernames: Immutable.List([]),
    algorithms: Immutable.Map({}),
    algorithmsOrder: Immutable.List([]),
    status: EGroupStatus.Live,
    
    // for DB storage
    type: "group",
    dbFields: ['status'],
    dataFields: ['name', 'lastEdited', 'lastUsername', 'algorithmsOrder'],
    statusMap: (s:EGroupStatus) => EGroupStatus[s],
  });
  export class Group extends _Group
  {
    id: ID;
    name: string;
    lastEdited: string;
    lastUsername: string;
    usernames: string[];
    algorithms: Immutable.Map<ID, Algorithm>;
    algorithmsOrder: Immutable.List<ID>;
    status: EGroupStatus;
    
    type: string;
    dbFields: string[]; // fields saved directly to DB
    dataFields: string[]; // fields saved in metadata
  }
  export function newGroup(id?: ID, name?: string, lastEdited?: string, lastUsername?: string, usernames?: Immutable.List<ID>,
    algorithms?: Immutable.Map<ID, Algorithm>, algorithmsOrder?: Immutable.List<ID>, status?: EGroupStatus):Group
  {
    return new Group(Util.extendId({ id, name, lastEdited, lastUsername, usernames, algorithms, algorithmsOrder, status }));
  }
}

export default BrowserTypes;