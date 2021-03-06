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

// tslint:disable:max-classes-per-file strict-boolean-expressions

import { List, Map } from 'immutable';
import * as _ from 'lodash';
import * as TerrainLog from 'loglevel';

import { defaultProps, ElasticFieldProps, ElasticToETL, ElasticTypes, etlTypeToElastic } from 'shared/etl/types/ETLElasticTypes';
import { etlFieldTypesNames, FieldTypes, Languages } from 'shared/etl/types/ETLTypes';
import { TransformationEngine } from 'shared/transformations/TransformationEngine';
import { KeyPath, KeyPath as EnginePath } from 'terrain-keypath';

import * as Utils from 'shared/transformations/util/EngineUtils';

interface PathHashMap<T>
{
  [k: string]: T;
}

export interface TypeConfig
{
  type: string;
  index?: boolean;
  fields?: {
    keyword: {
      type: 'keyword';
      index: boolean;
      ignore_above?: number;
    },
  };
  analyzer?: string;
}

export interface MappingType
{
  properties?: {
    [k: string]: {
      properties?: MappingType['properties'],
    } & TypeConfig,
  };
}

// generator that iterates over each field in mapping
// e.g. ['properties', 'foo'], ['properties', 'foo', 'properties', 'bar'], ...
function* getKeyPathsForComparison(mapping: MappingType): IterableIterator<KeyPath>
{
  if (_.has(mapping, 'properties'))
  {
    const basePath = List(['properties']);
    for (const key of Object.keys(mapping['properties']))
    {
      yield basePath.push(key);
      for (const kp of getKeyPathsForComparison(mapping['properties'][key]))
      {
        yield basePath.push(key).concat(kp).toList();
      }
    }
  }
}

// turn a keypath into a readable string.
// isMappingPath specifies if its a regular keypath, or one that comes from a MappingType
function humanReadablePathName(keypath: EnginePath, isMappingPath = false)
{
  const filterFn = isMappingPath ?
    (val, index) => index % 2 === 1
    :
    (val, index) => true;

  return keypath.filter(filterFn)
    .reduce((accum, val) =>
    {
      if (accum === '')
      {
        return `[${val}`;
      }
      else
      {
        return `${accum}, ${val}`;
      }
    }, '') as string + ']';
}

export interface MappingComparison
{
  isSubset: boolean; // if true, then newMapping represents a subset of existingMapping (less than or equal)
  hasConflicts: boolean; // if true, the two mappings are not compatible
  conflicts: string[]; // an array of human readable conflict descriptions
}

export class ElasticMapping
{
  // compare two elastic mapping to determine if they are compatible
  public static compareMapping(toCompare: MappingType, existingMapping: MappingType): MappingComparison
  {
    const result: MappingComparison = {
      isSubset: true,
      hasConflicts: false,
      conflicts: [],
    };

    for (const kp of getKeyPathsForComparison(toCompare))
    {
      const kpArray = kp.toArray();
      const toCompareConfig: TypeConfig = _.get(toCompare, kpArray);
      const existingConfig: TypeConfig = _.get(existingMapping, kpArray);

      if (existingConfig === undefined)
      {
        result.isSubset = false;
      }
      else
      {
        const { valid, message } = ElasticMapping.compareConfigs(toCompareConfig, existingConfig, kp);
        if (!valid)
        {
          result.hasConflicts = true;
          result.conflicts.push(message);
        }
      }
    }
    return result;
  }

  public static compareSingleField(fieldID: number, engine: TransformationEngine, existingMapping: MappingType)
    : { valid: boolean, message?: string }
  {
    const toCompareConfig = ElasticMapping.getTypeConfig(fieldID, engine);
    const okp = engine.getFieldPath(fieldID);
    const mappingPath = ElasticMapping.enginePathToMappingPath(okp);
    const existingConfig = _.get(existingMapping, mappingPath.toArray());

    if (existingConfig != null && toCompareConfig != null)
    {
      return ElasticMapping.compareConfigs(toCompareConfig, existingConfig, mappingPath);
    }
    else
    {
      return {
        valid: true,
      };
    }
  }

  protected static compareConfigs(
    toCompareConfig: TypeConfig,
    existingConfig: TypeConfig,
    kp: KeyPath,
  ): { valid: boolean, message?: string }
  {
    if (toCompareConfig['type'] !== existingConfig['type'])
    {
      const toCompareType = toCompareConfig['type'];
      const existingType = existingConfig['type'];
      let message;
      if (ElasticToETL[toCompareType] === ElasticToETL[existingType])
      {
        message = `Type conflict for field ${humanReadablePathName(kp, true)}. ` +
          `Base types match, but advanced type '${toCompareType}' does not match type '${existingType}'.`;
      }
      else
      {
        const toCompareName = etlFieldTypesNames.get(ElasticToETL[toCompareType]);
        const existingName = etlFieldTypesNames.get(ElasticToETL[existingType]);
        message = `Type conflict for field ${humanReadablePathName(kp, true)}. ` +
          `Type '${toCompareName}' does not match type '${existingName}'.`;
      }

      return {
        valid: false,
        message,
      };
    }
    else if (toCompareConfig['analyzer'] !== existingConfig['analyzer'])
    {
      const message = `Type conflict for field ${humanReadablePathName(kp, true)}. ` +
        `Analyzer '${toCompareConfig['analyzer']}' does not match Analyzer '${existingConfig['analyzer']}'.`;
      return {
        valid: false,
        message,
      };
    }
    else
    {
      return {
        valid: true,
      };
    }
  }

  protected static getElasticProps(fieldID: number, engine: TransformationEngine): ElasticFieldProps
  {
    const props: Partial<ElasticFieldProps> = engine.getFieldProp(fieldID, elasticPropPath);
    return defaultProps(props);
  }

  // converts engine keypaths to keypaths in the elastic mapping
  // e.g. ['foo', 'bar'] to ['properties', 'foo', 'properties', 'bar']
  // e.g. ['foo', '0', 'bar'] to ['properties', 'foo', 'properties', 'bar']
  // e.g. ['foo', '*'] to ['properties', 'foo']
  protected static enginePathToMappingPath(path: EnginePath): EnginePath
  {
    return path.flatMap(
      (value, i) => Utils.path.isNamed(path, i) ? ['properties', value] : [],
    ).toList() as EnginePath;
  }

  protected static getTextConfig(elasticProps: ElasticFieldProps, isMerge: boolean): TypeConfig
  {
    if (isMerge)
    {
      return {
        type: 'keyword',
        index: true,
        fields: {
          keyword: {
            type: 'keyword',
            index: true,
            ignore_above: 256,
          },
        },
      };
    }

    const config: TypeConfig = {
      type: elasticProps.isAnalyzed ? 'text' : 'keyword',
      index: true,
      fields:
      {
        keyword: elasticProps.isAnalyzed ?
          {
            type: 'keyword',
            index: elasticProps.isAnalyzed,
          }
          :
          {
            type: 'keyword',
            index: true,
            ignore_above: 256,
          },
      },
    };
    if (elasticProps.isAnalyzed)
    {
      config.analyzer = elasticProps.analyzer;
    }
    return config;
  }

  protected static getTypeConfig(
    fieldID: number,
    engine: TransformationEngine,
    isMerge: boolean = false,
  ): TypeConfig | null
  {
    const elasticProps = ElasticMapping.getElasticProps(fieldID, engine);

    const etlType = Utils.fields.fieldType(fieldID, engine);
    const elasticType = elasticProps.elasticType === ElasticTypes.Auto ?
      etlTypeToElastic(etlType)
      :
      elasticProps.elasticType;

    switch (elasticType)
    {
      case ElasticTypes.Text:
        return ElasticMapping.getTextConfig(elasticProps, isMerge);
      case ElasticTypes.Array:
        return null;
      case ElasticTypes.Nested:
        return {
          type: ElasticTypes.Nested,
        };
      default:
        return {
          type: elasticType,
        };
    }
  }

  private errors: string[] = [];
  private pathSchema: PathHashMap<{
    type: ElasticTypes,
    analyzer: string,
  }> = {};
  private engine: TransformationEngine;
  private isMerge: boolean;
  private mapping: MappingType = {};
  private primaryKey: string | null = null;
  private primaryKeyAttempts: any[] = [];

  constructor(engine: TransformationEngine, isMerge: boolean = false)
  {
    this.engine = engine;
    this.isMerge = isMerge;

    const disabledMap = this.computeDisabledFields();
    this.createElasticMapping(disabledMap);
    this.findPrimaryKeys(disabledMap);
  }

  public getMapping(): MappingType
  {
    return this.mapping;
  }

  public getErrors(): string[]
  {
    return this.errors;
  }

  public getPrimaryKey(): string | null
  {
    return this.primaryKey;
  }

  protected getETLType(fieldID: number): FieldTypes
  {
    return Utils.fields.fieldType(fieldID, this.engine);
  }

  protected clearGeopointMappings(disabledFields: { [k: number]: boolean })
  {
    const ids = this.engine.getAllFieldIDs();
    ids.forEach((id, i) =>
    {
      if (disabledFields[id])
      {
        return;
      }
      const etlType = this.getETLType(id);
      if (etlType !== FieldTypes.GeoPoint)
      {
        return;
      }
      else
      {
        const okp = this.engine.getFieldPath(id);
        const cleanedPath = ElasticMapping.enginePathToMappingPath(okp).toJS();
        const fieldMapping = _.get(this.mapping, cleanedPath);
        const newFieldMapping = _.omit(fieldMapping, ['properties']);
        _.set(this.mapping, cleanedPath, newFieldMapping);
      }
    });
  }

  protected addFieldToMapping(id: number)
  {
    const config = ElasticMapping.getTypeConfig(id, this.engine, this.isMerge);
    const enginePath = this.engine.getFieldPath(id);
    const cleanedPath = ElasticMapping.enginePathToMappingPath(enginePath);
    const hashed = Utils.path.hash(cleanedPath);

    if (config !== null)
    {
      if (this.pathSchema[hashed] === undefined)
      {
        const mappingPath = cleanedPath.toJS();
        const toExtend = _.get(this.mapping, mappingPath, {});
        const newObject = _.extend({}, toExtend, config);
        _.set(this.mapping, cleanedPath.toJS(), newObject);
        this.pathSchema[hashed] = {
          type: config.type as ElasticTypes,
          analyzer: config.analyzer,
        };
      }
      else if (config.type !== this.pathSchema[hashed].type)
      {
        this.errors.push(
          `Type Mismatch: ${enginePath.toJS()} has a type of '${config.type}' but ` +
          `the type is already defined to be '${this.pathSchema[hashed].type}'`,
        );
      }
      else if (config.analyzer !== this.pathSchema[hashed].analyzer)
      {
        this.errors.push(
          `Type Mismatch: ${enginePath.toJS()} has an analyzer of '${config.analyzer}' but ` +
          `the analyzer is already defined to be '${this.pathSchema[hashed].analyzer}'`,
        );
      }
    }
  }

  protected computeDisabledFields()
  {
    const ids = this.engine.getAllFieldIDs();
    const disabledMap: { [k: number]: boolean } = {};
    const tree = this.engine.createTree();
    const disabledFields = ids.filter((id) => !this.engine.getFieldEnabled(id)).toSet();
    const shouldExplore = (id) => disabledMap[id] === undefined;
    disabledFields.forEach((id) =>
    {
      for (const childId of Utils.traversal.preorder(tree, id, shouldExplore))
      {
        disabledMap[childId] = true;
      }
    });
    return disabledMap;
  }

  protected createElasticMapping(disabledMap: { [k: number]: boolean })
  {
    const ids = this.engine.getAllFieldIDs();

    ids.forEach((id, i) =>
    {
      try
      {
        if (!disabledMap[id])
        {
          this.addFieldToMapping(id);
        }
      }
      catch (e)
      {
        this.errors.push(
          `Error encountered while adding field '${id}' to mapping. Details: ${String(e)}`,
        );
      }
    });
    try
    {
      this.clearGeopointMappings(disabledMap);
    }
    catch (e)
    {
      this.errors.push(`Error encountered while clearing Geopoint Mappings. Details: ${String(e)}`);
    }

    TerrainLog.debug('Create ES mapping: ' + JSON.stringify(this.mapping));
  }

  protected verifyAndSetPrimaryKey(id: number)
  {
    const elasticProps = ElasticMapping.getElasticProps(id, this.engine);
    const etlType = this.getETLType(id);
    const elasticType = elasticProps.elasticType === ElasticTypes.Auto ?
      etlTypeToElastic(etlType)
      :
      elasticProps.elasticType;
    const enginePath = this.engine.getFieldPath(id);
    if (enginePath.size > 1)
    {
      this.errors.push(
        `'${humanReadablePathName(enginePath)}' is not a valid primary key. ` +
        `Primary keys should be a root level field`,
      );
      this.primaryKeyAttempts.push(humanReadablePathName(enginePath));
    }
    else if (enginePath.size === 0)
    {
      this.errors.push(
        `'${humanReadablePathName(enginePath)}' is not a valid primary key. `,
      );
      this.primaryKeyAttempts.push(humanReadablePathName(enginePath));
    }
    else
    {
      const primaryKey = enginePath.get(0);
      this.primaryKeyAttempts.push(primaryKey);
      if (typeof primaryKey !== 'string')
      {
        this.errors.push(
          `Unexpected primary key name. Field name '${String(primaryKey)}' is not a string`,
        );
      }
      else if (this.primaryKey !== null && this.primaryKey !== primaryKey)
      {
        this.errors.push(
          `Cannot set new primary key to '${primaryKey}'. There is already a primary key '${this.primaryKey}'`,
        );
      }
      else if (
        elasticType === ElasticTypes.Array
        || elasticType === ElasticTypes.Nested
        || elasticType === ElasticTypes.Boolean
      )
      {
        this.errors.push(
          `Field '${primaryKey}' of type '${elasticType}' cannot be a primary key. Primary keys cannot be Array, Nested or Boolean.`,
        );
      }
      else
      {
        this.primaryKey = primaryKey;
      }
    }
  }

  protected findPrimaryKeys(disabledMap: { [k: number]: boolean })
  {
    const ids = this.engine.getAllFieldIDs();

    ids.forEach((id, i) =>
    {
      try
      {
        if (!disabledMap[id])
        {
          const elasticProps = ElasticMapping.getElasticProps(id, this.engine);
          if (elasticProps.isPrimaryKey)
          {
            this.verifyAndSetPrimaryKey(id);
          }
        }
      }
      catch (e)
      {
        this.errors.push(
          `Error encountered while searching for primary key. Details: ${String(e)}`,
        );
      }
    });

    if (this.primaryKey === null)
    {
      const msg = this.primaryKeyAttempts.length > 0 ?
        `Primary keys are specified but none are valid`
        :
        `No primary key specified`;
      this.errors.push(
        msg,
      );
    }
  }
}

const elasticPropPath = EnginePath([Languages.Elastic]);
