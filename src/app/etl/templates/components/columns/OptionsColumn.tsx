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
// tslint:disable:no-var-requires import-spacing max-classes-per-file
import TerrainComponent from 'common/components/TerrainComponent';
import * as _ from 'lodash';
import * as React from 'react';
import { backgroundColor, Colors, getStyle } from 'src/app/colors/Colors';
import Util from 'util/Util';

import { TemplateEditorActions } from 'etl/templates/TemplateEditorRedux';

import TemplateSettingsForm from 'etl/common/components/TemplateSettingsForm';
import EndpointSection from 'etl/templates/components/endpoints/EndpointSection';
import EdgeSection from 'etl/templates/components/graph/EdgeSection';
import { ETLTemplate } from 'shared/etl/immutable/TemplateRecords';
import { TemplateSettings } from 'shared/etl/immutable/TemplateSettingsRecords';

import './OptionsColumn.less';

export class EndpointsColumn extends TerrainComponent<{}>
{
  public render()
  {
    return (
      <div
        className='template-editor-options-column'
        style={columnStyle}
      >
        <div className='options-column-content'>
          <EndpointSection isSource={true} />
          <EndpointSection isSource={false} />
        </div>
      </div>
    );
  }
}

export class StepsColumn extends TerrainComponent<{}>
{
  public render()
  {
    return (
      <div
        className='template-editor-options-column'
        style={columnStyle}
      >
        <div className='options-column-content'>
          <EdgeSection />
        </div>
      </div>
    );
  }
}

interface OptionsProps
{
  // injected props
  template?: ETLTemplate;
  editorAct?: typeof TemplateEditorActions;
}

class OptionsColumnC extends TerrainComponent<OptionsProps>
{
  public state: {
    templateSettings: TemplateSettings;
  };

  constructor(props)
  {
    super(props);
    this.state = {
      templateSettings: props.template.settings,
    };
  }

  public componentWillReceiveProps(nextProps: OptionsProps)
  {
    if (this.props.template.settings !== nextProps.template.settings)
    {
      this.setState({
        templateSettings: nextProps.template.settings,
      });
    }
  }

  public render()
  {
    return (
      <div
        className='template-editor-options-column'
        style={columnStyle}
      >
        <div className='options-column-content'>
          <div className='options-column-title'>
            Execution Settings
          </div>
          <TemplateSettingsForm
            onChange={this.handleTemplateSettingsChange}
            settings={this.state.templateSettings}
          />
        </div>
      </div>
    );
  }

  public handleTemplateSettingsChange(settings: TemplateSettings, isBlur?: boolean)
  {
    this.setState({
      templateSettings: settings,
    }, isBlur ? this.applyTemplateSettingsChanges : undefined);
  }

  public applyTemplateSettingsChanges()
  {
    const newTemplate = this.props.template.set('settings', this.state.templateSettings);
    this.props.editorAct({
      actionType: 'setTemplate',
      template: newTemplate,
      history: 'push',
    });
  }
}

export const OptionsColumn = Util.createTypedContainer(
  OptionsColumnC,
  [['templateEditor', 'template']],
  { editorAct: TemplateEditorActions },
);

const columnStyle = _.extend({},
  backgroundColor(Colors().bg3),
  getStyle('boxShadow', `1px 1px 5px ${Colors().boxShadow}`),
);
