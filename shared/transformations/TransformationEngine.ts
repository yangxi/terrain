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

import arrayTypeOfValues = require('array-typeof-values');
import * as GraphLib from 'graphlib';
import { List, Map } from 'immutable';
import isPrimitive = require('is-primitive');
import * as _ from 'lodash';
import memoizeOne from 'memoize-one';
import TransformationNode from 'shared/transformations/TransformationNode';
import { instanceFnDecorator } from 'shared/util/Classes';
import { KeyPath } from 'terrain-keypath';
import * as yadeep from 'yadeep';

import DataStore from './DataStore';
import TransformationNodeType, { IdentityTypes, NodeOptionsType, TransformationEdgeTypes as EdgeTypes } from './TransformationNodeType';
import TransformationRegistry from './TransformationRegistry';
import CreateTransformationVisitor from './visitors/CreateTransformationVisitor';
import TransformationEngineNodeVisitor from './visitors/TransformationEngineNodeVisitor';
import TransformationNodeConstructorVisitor from './visitors/TransformationNodeConstructorVisitor';
import TransformationVisitError from './visitors/TransformationVisitError';
import TransformationVisitResult from './visitors/TransformationVisitResult';

import { TransformationGraph } from 'shared/transformations/TypedGraph';
import * as Utils from 'shared/transformations/util/EngineUtils';

const NodeConstructor = new TransformationNodeConstructorVisitor();
const TransformationCreator = new CreateTransformationVisitor();
const ExecutionVisitor = new TransformationEngineNodeVisitor();

interface TransformOptions
{
  cache?: boolean;               // whether or not to use the cached execution order (if it exists)
  includeUnknown?: boolean;      // whether or not to transform on fields that aren't recognized by the engine
  removeEmptyObjects?: boolean;  // whether or not to remove fields such as `foo: {}` from the end result
}

/**
 * A TransformationEngine performs transformations on complex JSON documents.
 *
 * This is used by the ETL import/export system in order to pre-/post-process
 * data, but is a fairly general-purpose system for manipulating deep objects.
 *
 */
export class TransformationEngine
{
  public static datastore = new DataStore();

  /**
   * Creates a TransformationEngine from a serialized representation
   * (either a JSON object or stringified JSON object).
   *
   * @param {object | string} json   The serialized representation to
   *                                 deserialize into a working engine.
   * @returns {TransformationEngine} A deserialized, ready-to-go engine.
   */
  public static load(json: string): TransformationEngine
  {
    const parsedJSON: object = typeof json === 'string' ?
      TransformationEngine.parseSerializedString(json as string)
      :
      json as object;
    const e: TransformationEngine = new TransformationEngine();
    e.dag = GraphLib.json.read(parsedJSON['dag']) as TransformationGraph;
    e.executionOrder = parsedJSON['executionOrder'];
    e.uidField = parsedJSON['uidField'];
    e.uidNode = parsedJSON['uidNode'];
    e.IDToPathMap = Map<number, KeyPath>(parsedJSON['IDToPathMap']);
    e.fieldEnabled = Map<number, boolean>(parsedJSON['fieldEnabled']);
    e.fieldProps = Map<number, object>(parsedJSON['fieldProps']);
    return e;
  }

  /**
   * A helper function to parse a string representation of a
   * `TransformationEngine` into a working, fully-typed engine
   * (stringified JS objects lose all type information, so it
   * must be restored here...).
   *
   * @param {string} s The serialized string to parse into an engine.
   * @returns {object} An intermediate object that undergoes further
   *                   processing in `load` to finish converting
   *                   to a `TransformationEngine`.
   */
  protected static parseSerializedString(s: string): object
  {
    const parsed: object = JSON.parse(s);
    parsed['IDToPathMap'] = parsed['IDToPathMap'].map((v) => [v[0], KeyPath(v[1])]);
    for (let i: number = 0; i < parsed['dag']['nodes'].length; i++)
    {
      const raw: object = parsed['dag']['nodes'][i]['value'];
      parsed['dag']['nodes'][i]['value'] = NodeConstructor.visit(raw['typeCode'], undefined, {
        id: raw['id'],
        fields: raw['fields'],
        meta: raw['meta'],
        deserialize: true,
      });
    }
    return parsed;
  }

  protected dag: TransformationGraph = new GraphLib.Graph({ directed: true }) as TransformationGraph;
  protected executionOrder: number[] = [];
  protected uidField: number = 0;
  protected uidNode: number = 0;
  protected fieldEnabled: Map<number, boolean> = Map<number, boolean>();
  protected fieldProps: Map<number, object> = Map<number, object>();
  protected IDToPathMap: Map<number, KeyPath> = Map<number, KeyPath>();
  protected cachedOrder: number[];

  /**
   *  Constructor for `TransformationEngine`.
   */
  constructor()
  {

  }

  /**
   *  Return a deep copy of this transformation engine.
   */
  public clone(): TransformationEngine
  {
    return TransformationEngine.load(JSON.stringify(this.toJSON()));
  }

  /**
   * Checks whether the provided (`other`) `TransformationEngine` is equal to the current `TransformationEngine` (`this`).
   * Performs a "deep equals" due to the complex nature of this type.
   *
   * NOTE: This feels rather inefficient and should be optimized in the future if it's used frequently
   *       (for example, if many checks are misses, then consider using a hash code comparison first).
   *       Currently this is only used for testing.
   *
   * @param {TransformationEngine} other The `TransformationEngine` against which to compare
   * @returns {boolean} Whether `this` is the same as `other`
   */
  public equals(other: TransformationEngine): boolean
  {
    return JSON.stringify(this.toJSON()) === JSON.stringify(other.toJSON());
  }

  /**
   * This is the method by which one adds transformations to the engine.  Use
   * after adding the relevant fields to the engine.  The transformation is
   * appended to the engine's transformation DAG in the appropriate place.
   *
   * @param {TransformationNodeType} nodeType    The type of transformation to create
   * @param {Immutable.List<KeyPath | number>} inFields A list of field names or IDs
   *                                             on which to apply the new transformation
   * @param {object} options                     Any options for the transformation;
   *                                             different transformation types have
   *                                             various specialized options available
   * @returns {number}                           The ID of the newly-created transformation
   */
  public appendTransformation(nodeType: TransformationNodeType, inFields: List<KeyPath | number>,
    options?: object): number
  {
    // should this create new fields?
    const fields = inFields.map((val) =>
    {
      if (typeof val === 'number')
      {
        const path = this.getFieldPath(val);
        if (path === undefined)
        {
          throw new Error('Could not find that ID');
        }
        return {
          id: val,
          path,
        };
      }
      else
      {
        const id = this.getFieldID(val);
        if (id === undefined)
        {
          throw new Error('Could not find that path');
        }
        return {
          id,
          path: val,
        };
      }
    }).toList();

    const nodeId = this.uidNode;
    this.uidNode++;
    const node: TransformationNode = NodeConstructor.visit(nodeType, undefined, {
      id: nodeId,
      fields,
      meta: options,
    });
    this.dag.setNode(nodeId.toString(), node);
    this.executionOrder.push(nodeId);
    node.accept(TransformationCreator, this);

    return nodeId;
  }

  /**
   * Transform a document according to the current engine configuration.
   *
   * @param {object} doc The document to transform.
   * @param {object} options See TransformOptions. TODO Refactor how caching works
   * @returns {object}   The transformed document, or possibly errors.
   */
  public transform(doc: object, options: TransformOptions = {}): object
  {
    let ordered;
    if (this.cachedOrder != null && options.cache)
    {
      ordered = this.cachedOrder;
    }
    else
    {
      ordered = this.computeExecutionOrder();
      this.cachedOrder = ordered;
    }

    let output = options.includeUnknown ? _.cloneDeep(doc) : this.getInitialDocument(doc);

    for (const nodeKey of ordered)
    {
      const node: TransformationNode = this.dag.node(nodeKey);
      const transformationResult = node.accept(ExecutionVisitor, output);
      if (transformationResult.errors !== undefined)
      {
        transformationResult.errors.forEach((error: TransformationVisitError) =>
        {
          // TODO handle error
        });
      }
      const document = transformationResult.document;
      output = document;
    }

    return this.getCleanedDocument(output, options.removeEmptyObjects);
  }

  /**
   * Converts the current engine to an equivalent JSON representation.
   *
   * @returns {object} A JSON representation of `this`.
   */
  public toJSON(): object
  {
    // Note: dealing with a lot of Immutable data structures so some
    // slightly verbose syntax is required to convert to plain JS arrays
    return {
      dag: GraphLib.json.write(this.dag),
      executionOrder: this.executionOrder,
      uidField: this.uidField,
      uidNode: this.uidNode,
      IDToPathMap: this.IDToPathMap.map((v: KeyPath, k: number) => [k, v]).toArray(),
      fieldEnabled: this.fieldEnabled.map((v: boolean, k: number) => [k, v]).toArray(),
      fieldProps: this.fieldProps.map((v: object, k: number) => [k, v]).toArray(),
    };
  }

  /**
   * Register a field with the current engine.  This enables adding
   * transformations to the field. If the field already exists, throw an error
   *
   * @param {KeyPath} fullKeyPath The path of the field to add
   * @param {object} options      Field Metadata
   * @param {number} sourceNode   If specified, indicates the field is created by or structurally
   *                              affected by the transformation node
   * @returns {number}            The ID of the newly-added field
   */
  public addField(fullKeyPath: KeyPath, options: object = {}, sourceNode?: number): number
  {
    if (this.getFieldID(fullKeyPath) !== undefined)
    {
      throw new Error('Field already exists');
    }

    const id = this.uidField;
    this.uidField++;
    this.setFieldPath(id, fullKeyPath);
    this.fieldEnabled = this.fieldEnabled.set(id, true);
    this.fieldProps = this.fieldProps.set(id, options);
    const identityId = this.addIdentity(id, sourceNode, sourceNode !== undefined ? IdentityTypes.Synthetic : undefined);

    return id;
  }

  // TODO Need to make this traverse the dag properly
  public deleteField(id: number): void
  {
    if (!Utils.fields.isOrganic(this, id))
    {
      throw new Error('Cannot delete synthetic field');
    }
    this.getTransformations(id).forEach((t: number) => this.deleteTransformation(t));
    this.IDToPathMap = this.IDToPathMap.delete(id);
    this.fieldProps = this.fieldProps.delete(id);
    this.fieldEnabled = this.fieldEnabled.delete(id);
  }

  /**
   * TODO This function should be refactored to traverse the DAG
   * Get the IDs of all transformations that act on a given field.
   *
   * @param {number} field   The field whose associated transformations should be identified
   * @returns {Immutable.List<number>} A list of the associated transformations, sorted properly
   */
  public getTransformations(field: number): List<number>
  {
    // Note: This function is O(n) in number of nodes.  Future work
    // could be adding a map e.g. (field ID => List<transformation ID>)
    // to make this function O(1), if it's ever a performance issue.
    const nodes: TransformationNode[] = [];
    _.each(this.dag.nodes(), (node) =>
    {
      if ((this.dag.node(node) as TransformationNode).fields.findIndex((f) => f.id === field) !== -1)
      {
        nodes.push(this.dag.node(node) as TransformationNode);
      }
    });
    // Need to order nodes...
    const allSorted = GraphLib.alg.topsort(this.dag);
    let nodesSorted: List<number> = List<number>();
    for (let i: number = 0; i < allSorted.length; i++)
    {
      if (nodes.includes(this.dag.node(allSorted[i])))
      {
        nodesSorted = nodesSorted.push(parseInt(allSorted[i], 10));
      }
    }
    return nodesSorted;
  }

  /**
   * Returns the actual `TransformationNode` with the specified ID.
   *
   * @param {number} transformationID          ID of the node to retrieve
   * @returns {TransformationNode | undefined} The retrieved node (or undefined if not found)
   */
  public getTransformationInfo(transformationID: number): TransformationNode | undefined
  {
    if (!this.dag.nodes().includes(transformationID.toString()))
    {
      return undefined;
    }
    return this.dag.node(transformationID.toString()) as TransformationNode;
  }

  /**
   *  TODO make an 'EditTransformation' visitor to handle side effects
   *
   * @param {number} transformationID  Which transformation to update
   * @param {object} options           New options
   */
  public editTransformation(transformationID: number, options?: object): void
  {
    if (!this.dag.nodes().includes(transformationID.toString()))
    {
      return;
    }

    if (options !== undefined)
    {
      (this.dag.node(transformationID.toString()) as TransformationNode).meta = options;
    }
  }

  /**
   *  TODO Need to make this traverse the dag properly (like with delete field)
   *
   * @param {number} transformationID Which transformation to delete.
   */
  public deleteTransformation(transformationID: number): void
  {
    const inEdges: void | GraphLib.Edge[] = this.dag.inEdges(transformationID.toString());
    const outEdges: void | GraphLib.Edge[] = this.dag.outEdges(transformationID.toString());

    if (typeof inEdges !== 'undefined' && typeof outEdges !== 'undefined')
    {
      if (inEdges.length === 1 && outEdges.length === 1)
      {
        // re-link in node with out node
        this.dag.setEdge(inEdges[0].v, outEdges[0].w);
      } // else not supported yet
    }
    const execIndex = this.executionOrder.indexOf(transformationID);
    if (execIndex !== -1)
    {
      this.executionOrder = this.executionOrder.splice(execIndex, 1);
    }
    this.dag.removeNode(transformationID.toString());
  }

  public getFieldPath(fieldID: number): KeyPath
  {
    return this.IDToPathMap.get(fieldID);
  }

  public getFieldID(path: KeyPath): number
  {
    return this._getFieldIDCache(this.IDToPathMap).get(Utils.path.hash(path));
  }

  /**
   * Rename a field
   *
   * @param {number} fieldID    The Field to rename
   * @param {KeyPath} newPath   The path to move the field to
   * @return {number}           The id of the rename transformation
   */
  public renameField(fieldID: number, newPath: KeyPath): number
  {
    const oldPath = this.getFieldPath(fieldID);
    if (oldPath.equals(newPath))
    {
      return null; // invalid
    }

    return this.appendTransformation(
      TransformationNodeType.RenameNode,
      List([fieldID]),
      { newFieldKeyPaths: List([newPath]) },
    );
  }

  public getFieldEnabled(fieldID: number): boolean
  {
    return this.fieldEnabled.get(fieldID) === true;
  }

  public getFieldProp(fieldID: number, prop: KeyPath): any
  {
    return yadeep.get(this.fieldProps.get(fieldID), prop);
  }

  public getFieldProps(fieldID: number): object
  {
    return this.fieldProps.get(fieldID);
  }

  public setFieldProps(fieldID: number, props: object): void
  {
    this.fieldProps = this.fieldProps.set(fieldID, props);
  }

  public setFieldProp(fieldID: number, prop: KeyPath, value: any): void
  {
    const newProps: object = this.fieldProps.get(fieldID);
    yadeep.set(newProps, prop, value, { create: true });
    this.fieldProps = this.fieldProps.set(fieldID, newProps);
  }

  /**
   * Get all field IDs registered in this transformation engine.
   *
   * @param {boolean} includeDead    If true, return fields that don't exist in the engine's
   *                                 understanding of what the end document should look like.
   *                                 Defaults to false
   * @return {List<number>}          A list of all the IDs
   */
  public getAllFieldIDs(includeDead = false): List<number>
  {
    const filtered = includeDead ?
      this.IDToPathMap
      :
      this.IDToPathMap.filter((kp, id) => !this.isDead(kp));
    return filtered.keySeq().toList();
  }

  /**
   * A field is dead if it is removed from a document by side effect of a transformation
   *
   * @param {number | KeyPath} field    The field path or id to check
   * @return {boolean}                  True if the field is dead
   */
  public isDead(field: KeyPath | number): boolean
  {
    let kp: KeyPath;
    if (typeof field === 'number')
    {
      kp = this.getFieldPath(field);
    }
    else
    {
      kp = field;
    }
    return kp.size === 1 && kp.get(0) === null;
  }

  public enableField(fieldID: number): void
  {
    this.fieldEnabled = this.fieldEnabled.set(fieldID, true);
  }

  public disableField(fieldID: number): void
  {
    this.fieldEnabled = this.fieldEnabled.set(fieldID, false);
  }

  /*
   *  Create a simple tree representation that maps fieldIds to a list of that field's children
   */
  public createTree(): Map<number, List<number>>
  {
    const ids = this.getAllFieldIDs();
    // sort the paths to ensure we visit parents before children
    const sortedIds = ids.sort((a, b) => this.getFieldPath(a).size - this.getFieldPath(b).size);

    const enginePathToField: {
      [kp: string]: List<number>,
    } = {};

    sortedIds.forEach((id, index) =>
    {
      const enginePath = this.getFieldPath(id);
      if (enginePath.size === 0)
      {
        return;
      }
      const parentPath = enginePath.slice(0, -1).toList();
      let parentHash = Utils.path.hash(parentPath);
      if (enginePathToField[parentHash] === undefined) // if no parent found, attempt to despecify
      {
        parentHash = Utils.path.hash(Utils.path.convertIndices(parentPath));
      }
      const parentField: List<number> = enginePathToField[parentHash];
      const newField = List([]);

      if (parentField != null)
      {
        enginePathToField[parentHash] = parentField.push(id);
      }
      enginePathToField[Utils.path.hash(enginePath)] = newField;
    });

    const fieldMap: { [k: number]: List<number> } = {};
    sortedIds.forEach((id, index) =>
    {
      const enginePath = this.getFieldPath(id).toJS();
      const field = enginePathToField[JSON.stringify(enginePath)];
      if (field != null)
      {
        fieldMap[id] = field;
      }
    });
    return Map<number, List<number>>(fieldMap)
      .mapKeys((key) => Number(key))
      .toMap();
  }

  protected setFieldPath(fieldID: number, path: KeyPath)
  {
    const existingId = this.getFieldID(path);
    if (existingId !== undefined && !this.isDead(path) && fieldID !== existingId)
    {
      const existingPath = this.getFieldPath(fieldID);
      if (existingPath === undefined)
      {
        throw new Error(`Cannot set new field to ${path}. This field already exists`);
      }
      else
      {
        throw new Error(`Cannot change field ${existingPath} to ${path}. This field already exists`);
      }
    }
    this.IDToPathMap = this.IDToPathMap.set(fieldID, path);
  }

  /*
   *  Add Identity Node.
   *  idType indicates the type of identity node
   *    Organic   - this field exists in the source document
   *    Synthetic - this field is created by a transformation
   *    Removal   - this field gets removed from the document
   *    Rename    - this field gets moved to a new name
   */
  protected addIdentity(
    fieldId: number,
    sourceNode?: number,
    idType?: IdentityTypes.Removal | IdentityTypes.Rename | IdentityTypes.Synthetic,
  ): number
  {
    let type;
    if (sourceNode !== undefined && idType !== undefined)
    {
      type = idType;
    }
    else
    {
      type = IdentityTypes.Organic;
    }
    const options: NodeOptionsType<TransformationNodeType.IdentityNode> = {
      type,
    };
    const identityId = this.appendTransformation(TransformationNodeType.IdentityNode, List([fieldId]), options);
    if (sourceNode !== undefined)
    {
      this.dag.setEdge(String(sourceNode), String(identityId), EdgeTypes.Synthetic);
    }
    return identityId;
  }

  protected killField(fieldID: number, killedByNode: number): number
  {
    return this.addIdentity(fieldID, killedByNode, IdentityTypes.Removal);
  }

  /*
   *  Returns the document that only includes recognized fields
   */
  protected getInitialDocument(doc: object): object
  {
    const output = {};
    const fields = this.dag.sources()
      .map((id) => this.dag.node(id).fields.get(0).path)
      .sort((f1, f2) => f1.size - f2.size);

    for (const path of fields)
    {
      for (const { location, value } of yadeep.search(doc, path))
      {
        if (isPrimitive(value))
        {
          yadeep.setIn(output, location, value);
        }
        else if (Array.isArray(value))
        {
          yadeep.setIn(output, location, []);
        }
        else
        {
          yadeep.setIn(output, location, {});
        }
      }
    }
    return output;
  }

  /*
   *  Returns the document that only has enabled fields and if specified, removes empty objects
   */
  protected getCleanedDocument(doc: object, removeEmpty = true): object
  {
    const output = _.cloneDeep(doc);

    const tree = this.createTree();
    if (removeEmpty)
    {
      for (const { value, location } of yadeep.traverse(output))
      {
        if (isPrimitive(value))
        {
          continue;
        }
        else if (!Array.isArray(value) && Object.keys(value).length === 0)
        {
          yadeep.deleteIn(output, location);
        }
      }
    }

    const enabledMap = {};
    this.getAllFieldIDs().forEach((fieldId) =>
    {
      if (this.getFieldPath(fieldId).size === 1) // is root
      {
        const shouldExplore = (id) =>
        {
          return this.getFieldEnabled(id);
        };
        for (const id of Utils.traversal.preorder(tree, fieldId, shouldExplore))
        {
          enabledMap[id] = true;
        }
      }
    });

    this.getAllFieldIDs().forEach((fieldId) =>
    {
      if (!enabledMap[fieldId])
      {
        const path = this.getFieldPath(fieldId);
        for (const { location, value } of yadeep.search(output, path))
        {
          yadeep.deleteIn(output, location);
        }
      }
    });

    return output;
  }

  @instanceFnDecorator(memoizeOne)
  protected _getFieldIDCache(pathMap: Map<number, KeyPath>): Map<string, number>
  {
    const reverseMap: { [k: string]: number } = {};
    pathMap.forEach((path, id) =>
    {
      reverseMap[Utils.path.hash(path)] = id;
    });
    return Map<string, number>(reverseMap);
  }

  /*
   *  Returns nodes in the order they should be executed
   *  Makes sure that edges are sorted so that synthetic edges are walked first
   */
  protected computeExecutionOrder(): string[]
  {
    // copy the dag
    const dag = GraphLib.json.read(GraphLib.json.write(this.dag)) as TransformationGraph;

    // iterate through all rename, same, and removal edges (v, w). For each node v whose synthetic edges are
    // [v, w_synth], create a "helper" edge from w_synth to w. This ensures a topological dependency that enforces that
    // the synthetic nodes w_synth are visited before w.

    for (const edge of dag.edges())
    {
      const label = dag.edge(edge);
      if (label !== EdgeTypes.Synthetic && label !== 'DUMMY' as any)
      {
        const { v, w } = edge;
        const synthSuccessors = dag.successors(v).filter((wTest) => dag.edge(v, wTest) === EdgeTypes.Synthetic);
        for (const wSynth of synthSuccessors)
        {
          if (dag.edge(wSynth, w) === undefined)
          {
            dag.setEdge(wSynth, w, 'DUMMY' as any);
          }
        }
      }
    }

    // for each transformation in the executionOrder, explicitly create an edge between the nodes in chronological order
    for (let i = 1; i < this.executionOrder.length; i++)
    {
      dag.setEdge(String(this.executionOrder[i - 1]), String(this.executionOrder[i]), 'DUMMY' as any);
    }

    if (!GraphLib.alg.isAcyclic(dag))
    {
      throw new Error('Could not perform topological sort: Graph is Cyclic');
    }

    const order = GraphLib.alg.topsort(dag)
      .filter((id) => dag.node(id).typeCode !== TransformationNodeType.IdentityNode);
    return order;
  }
}
