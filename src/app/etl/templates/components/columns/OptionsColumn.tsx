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
// tslint:disable:no-var-requires import-spacing
import TerrainComponent from 'common/components/TerrainComponent';
import * as Immutable from 'immutable';
import * as _ from 'lodash';
import memoizeOne from 'memoize-one';
import * as Radium from 'radium';
import * as React from 'react';
import { backgroundColor, borderColor, Colors, fontColor, getStyle } from 'src/app/colors/Colors';
import Util from 'util/Util';

import { DynamicForm } from 'common/components/DynamicForm';
import { DisplayState, DisplayType, InputDeclarationMap } from 'common/components/DynamicFormTypes';
import { instanceFnDecorator } from 'src/app/Classes';

import { _FileConfig, _SourceConfig, FileConfig, SinkConfig, SourceConfig } from 'etl/EndpointTypes';
import { TemplateEditorActions } from 'etl/templates/TemplateEditorRedux';
import { ETLTemplate, TemplateEditorState } from 'etl/templates/TemplateTypes';
import { Sinks, Sources } from 'shared/etl/types/EndpointTypes';
import { FileTypes } from 'shared/etl/types/ETLTypes';

import SinkOptions from 'etl/templates/components/endpoints/SinkOptions';
import SourceOptions from 'etl/templates/components/endpoints/SourceOptions';

import './OptionsColumn.less';
const { List } = Immutable;

export interface Props
{
  // below from container
  template?: ETLTemplate;
  act?: typeof TemplateEditorActions;
}

class OptionsColumn extends TerrainComponent<Props>
{
  public renderSource(source: SourceConfig, key)
  {
    return (
      <div
        className='endpoint-block'
        key={key}
      >
        <div className='endpoint-name-section'>
          {key}
        </div>
        <SourceOptions
          sourceKey={key}
        />
      </div>
    );
  }

  public renderSink(sink: SinkConfig, key)
  {
    return (
      <div
        className='endpoint-block'
        key={key}
      >
        <div className='endpoint-name-section'>
          {key}
        </div>
        <SinkOptions
          sinkKey={key}
        />
      </div>
    );
  }

  public renderSourceOptions()
  {
    const { sources } = this.props.template;
    return (
      <div className='endpoint-type-block'>
        <div
          className='endpoint-type-title'
          style={getStyle('borderBottom', `1px solid ${Colors().border1}`)}
        >
          Sources
        </div>
        {sources.map(this.renderSource).toList()}
      </div>
    );
  }

  public renderSinkOptions()
  {
    const { sinks } = this.props.template;
    return (
      <div className='endpoint-type-block'>
        <div
          className='endpoint-type-title'
          style={getStyle('borderBottom', `1px solid ${Colors().border1}`)}
        >
          Sinks
        </div>
        {sinks.map(this.renderSink).toList()}
      </div>
    );
  }

  public render()
  {
    return (
      <div
        className='template-editor-options-column'
        style={_.extend({},
          backgroundColor(Colors().bg3),
          getStyle('boxShadow', `1px 1px 5px ${Colors().boxShadow}`),
        )}
      >
        <div className='options-column-content'>
          {this.renderSourceOptions()}
          {this.renderSinkOptions()}
        </div>
      </div>
    );
  }
}

export default Util.createContainer(
  OptionsColumn,
  [['templateEditor', 'template']],
  { act: TemplateEditorActions },
);
