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
// tslint:disable:max-classes-per-file import-spacing

import * as Immutable from 'immutable';
const { List, Map } = Immutable;
import * as Radium from 'radium';
import * as React from 'react';
import { withRouter } from 'react-router';

import { Algorithm, LibraryState } from 'library/LibraryTypes';
import TerrainStore from 'src/app/store/TerrainStore';
import Util from 'util/Util';

import ETLHelpers from './ETLHelpers';
import GraphHelpers from './GraphHelpers';

import { _FileConfig, _SinkConfig, _SourceConfig, FileConfig, SinkConfig, SourceConfig } from 'etl/EndpointTypes';
import { ETLActions } from 'etl/ETLRedux';
import ETLRouteUtil from 'etl/ETLRouteUtil';
import TemplateEditor from 'etl/templates/components/TemplateEditor';
import { _ETLEdge, _ETLNode, _ETLProcess, ETLEdge, ETLNode, ETLProcess, MergeJoinOptions } from 'etl/templates/ETLProcess';
import { _TemplateField, TemplateField } from 'etl/templates/FieldTypes';
import { createTreeFromEngine } from 'etl/templates/SyncUtil';
import { TemplateEditorActions } from 'etl/templates/TemplateEditorRedux';
import { FieldMap } from 'etl/templates/TemplateEditorTypes';
import { _ETLTemplate, ETLTemplate } from 'etl/templates/TemplateTypes';
import { _WalkthroughState, WalkthroughState } from 'etl/walkthrough/ETLWalkthroughTypes';
import { Sinks, Sources } from 'shared/etl/types/EndpointTypes';
import { FileTypes, NodeTypes } from 'shared/etl/types/ETLTypes';
import { TransformationEngine } from 'shared/transformations/TransformationEngine';
import { createEngineFromDocuments } from 'shared/transformations/util/EngineUtil';
import { TemplateProxy } from 'etl/templates/TemplateProxy';

import DocumentsHelpers from './DocumentsHelpers';


class Initializers extends ETLHelpers
{
  public loadExistingTemplate(templateId: number)
  {
    this._getTemplate(templateId)
      .then((template: ETLTemplate) =>
      {
        this.editorAct({
          actionType: 'resetState',
        });
        this.editorAct({
          actionType: 'setTemplate',
          template,
        });
        const edge = template.getLastEdgeId();
        this.editorAct({ // todo find the last edge
          actionType: 'setCurrentEdge',
          edge,
        });
        this.editorAct({
          actionType: 'setIsDirty',
          isDirty: false,
        });
        DocumentsHelpers.fetchSources(template.getSources().keySeq().toList());
        ETLRouteUtil.gotoEditTemplate(template.id);
      })
      .catch(this._logError);
  }

  public initNewFromAlgorithm(algorithmId: number)
  {
    const source = _SourceConfig({
      type: Sources.Algorithm,
      fileConfig: _FileConfig({
        fileType: FileTypes.Json,
      }),
      options: {
        algorithmId,
      },
    });
    DocumentsHelpers.fetchDocuments(source, '_default')
      .then(this.createInitialTemplateFn(source))
      .catch(this._logError);
  }

  public initNewFromWalkthrough(walkthrough: WalkthroughState = this._walkthrough)
  {
    const source = walkthrough.source;
    const sink = walkthrough.sink;
    const file = walkthrough.getFile();
    DocumentsHelpers.fetchDocuments(source, '_default')
      .then(this.createInitialTemplateFn(source, sink))
      .catch(this._logError);
  }

  private createInitialTemplateFn(
    source?: SourceConfig,
    sink?: SinkConfig,
  ): (hits: List<object>) => void
  {
    return (hits) =>
    {
      const { template, fieldMap, initialEdge } = this.createInitialTemplate(hits, source, sink);
      if (initialEdge === -1)
      {
        throw new Error('Failed to create initial edge');
      }
      this.editorAct({
        actionType: 'setTemplate',
        template,
      });
      this.editorAct({
        actionType: 'setFieldMap',
        fieldMap,
      });
      GraphHelpers.switchEdge(initialEdge);
    };
  }

  private createInitialTemplate(documents: List<object>, source?: SourceConfig, sink?: SinkConfig):
    {
      template: ETLTemplate,
      fieldMap: FieldMap,
      initialEdge: number,
      warnings: string[],
      softWarnings: string[],
    }
  {
    if (documents == null || documents.size === 0)
    {
      return {
        template: _ETLTemplate(),
        fieldMap: Map(),
        warnings: ['No documents provided for initial Template construction'],
        softWarnings: [],
        initialEdge: 0,
      };
    }
    const { engine, warnings, softWarnings } = createEngineFromDocuments(documents);

    const fieldMap = createTreeFromEngine(engine);

    let template = _ETLTemplate({
      id: -1,
      templateName: name,
    });
    const sourceToAdd = source !== undefined ? source : _SourceConfig({ type: Sources.Upload });
    const sinkToAdd = sink !== undefined ? sink : _SinkConfig({ type: Sinks.Download });
    // default source and sink is upload and download
    const proxy = new TemplateProxy(template);
    const sourceId = proxy.addSource('_default', sourceToAdd);
    const sinkId = proxy.addSink('_default', sinkToAdd);
    const initialEdge = proxy.addEdge(sourceId, sinkId, engine);

    template = proxy.getTemplate();

    return {
      template,
      fieldMap,
      warnings,
      softWarnings,
      initialEdge,
    };
  }
}
export default new Initializers(TerrainStore);
