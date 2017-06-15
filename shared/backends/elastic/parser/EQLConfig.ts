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

import EQLSpec from './EQLSpec';
import ESAnyClause from './ESAnyClause';
import ESArrayClause from './ESArrayClause';
import ESBaseClause from './ESBaseClause';
import ESBooleanClause from './ESBooleanClause';
import ESClause from './ESClause';
import ESEnumClause from './ESEnumClause';
import ESMapClause from './ESMapClause';
import ESNullClause from './ESNullClause';
import ESNumberClause from './ESNumberClause';
import ESReferenceClause from './ESReferenceClause';
import ESStringClause from './ESStringClause';
import ESStructureClause from './ESStructureClause';
import ESVariantClause from './ESVariantClause';

/**
 *
 */
export default class EQLConfig
{

  private undefinedTypes: { [name: string]: boolean };
  private clauses: { [name: string]: ESClause };

  public constructor(clauseConfiguration: any = EQLSpec)
  {
    this.undefinedTypes = {};
    this.clauses = {};

    // winston.info(JSON.stringify(clauseConfiguration));
    Object.keys(clauseConfiguration).forEach(
      (typename: string): void =>
      {
        // winston.info('defining "' + id + '"');

        const settings: any = clauseConfiguration[typename];
        this.declareType(typename, settings);
        if (this.clauses[typename] !== undefined)
        {
          return;
        }

        const def: any = settings.def;
        let clause: ESClause;
        if (typeof (def) === 'object')
        {
          // structured object id
          clause = new ESStructureClause(settings, this);
        }
        else if (typeof (def) === 'string')
        {
          switch (def)
          {
            case 'enum':
              clause = new ESEnumClause(settings);
              break;
            case 'variant':
              clause = new ESVariantClause(settings, this);
              break;
            default:
              // reference clause
              clause = new ESReferenceClause(settings, this);
              break;
          }
        }
        else
        {
          throw new Error('Unknown clause "' + 'type:' + String(typename)  + ','  + 'def:' + String(def) + ' ".');
        }

        // winston.info('registering clause "' + id + '"');
        this.clauses[typename] = clause;
        delete this.undefinedTypes[typename];
      },
    );

    // TODO: validate id references and other settings
  }

  public declareType(type: string, settings: any = {}): void
  {
    if (this.clauses[type] !== undefined)
    {
      return; // already declared
    }

    // winston.info('declare "' + id + '"');
    settings.type = type;
    let clause: ESClause | null = null;
    switch (type)
    {
      case 'null':
        clause = new ESNullClause(settings);
        break;
      case 'boolean':
        clause = new ESBooleanClause(settings);
        break;
      case 'number':
        clause = new ESNumberClause(settings);
        break;
      case 'string':
        clause = new ESStringClause(settings);
        break;
      case 'base':
        clause = new ESBaseClause(settings);
        break;
      case 'any':
        clause = new ESAnyClause(settings);
        break;

      default:
        this.validateTypename(type);

        if (type.endsWith('[]'))
        {
          // array
          clause = new ESArrayClause(settings, type.substring(0, type.length - 2));
        }
        else if (type.startsWith('{'))
        {
          // map {"ktype":"vtype"}
          let mapTypes;
          try
          {
            mapTypes = JSON.parse(type);
          } catch (e)
          {
            throw new Error('The map type "' + type + '" is not a JSON object');
          }

          if (Object.keys(mapTypes).length !== 1)
          {
            throw new Error('The map type "' + type + '" has more than one field');
          }

          const ktype = Object.keys(mapTypes)[0];
          const vtype = mapTypes[ktype];

          if (typeof vtype !== 'string')
          {
            throw new Error('The value type of the map type "' + type + '" is not a string');
          }

          clause = new ESMapClause(settings, ktype, vtype, this);
        }
        else
        {
          // undefined reference id
          this.undefinedTypes[type] = true;
        }
        break;
    }

    if (clause !== null)
    {
      this.clauses[type] = clause;
    }
  }

  public validateTypename(type: string): void
  {
    if (type.match(/^(?:[a-zA-Z0-9_"]+(:?\[])?|{[a-zA-Z0-9_"]+:[a-zA-Z0-9_"]+})$/gim) === null)
    {
      throw new Error('Type names must be composed only of letters, numbers, and underscores. Type "' +
        String(type) +
        '" is an invalid type name.');
    }
  }

  public getClause(id: string): ESClause
  {
    const clause: ESClause = this.clauses[id];
    if (clause !== undefined)
    {
      return clause;
    }
    else
    {
      throw new Error('Unknown clause id "' + id + '"');
    }
  }

}
