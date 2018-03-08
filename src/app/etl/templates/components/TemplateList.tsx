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

// tslint:disable:no-var-requires strict-boolean-expressions

import * as classNames from 'classnames';
import cronstrue from 'cronstrue';
import { List } from 'immutable';
import * as _ from 'lodash';
import * as React from 'react';
import Util from 'util/Util';

import { backgroundColor, borderColor, Colors, fontColor, getStyle } from 'app/colors/Colors';
import { notificationManager } from 'common/components/InAppNotification';
import { Menu, MenuOption } from 'common/components/Menu';
import Modal from 'common/components/Modal';
import TerrainComponent from 'common/components/TerrainComponent';
import { tooltip } from 'common/components/tooltip/Tooltips';
import { MidwayError } from 'shared/error/MidwayError';

import { HeaderConfig, HeaderConfigItem, ItemList } from 'etl/common/components/ItemList';

import { TemplateEditorActions } from 'etl/templates/TemplateEditorRedux';
import { ETLTemplate, TemplateEditorState } from 'etl/templates/TemplateTypes';

export interface Props
{
  onClick?: (template: ETLTemplate) => void;
  getRowStyle?: (template: ETLTemplate) => object | object[];
  // injected props
  templates: List<ETLTemplate>;
}

class TemplateList extends TerrainComponent<Props>
{
  public displayConfig: HeaderConfig<ETLTemplate> = [
    {
      name: 'Name',
      render: (template, index) => template.templateName,
    },
    {
      name: 'ID',
      render: (template, index) => template.id,
    },
    {
      name: 'Source Type',
      render: (template, index) => template.getIn(['sources', '_default', 'type'], 'N/A'),
    },
    {
      name: 'Sink Type',
      render: (template, index) => template.getIn(['sinks', '_default', 'type'], 'N/A'),
    },
  ];

  public getRowStyle(index)
  {
    const { templates, getRowStyle } = this.props;
    if (getRowStyle !== undefined)
    {
      return getRowStyle(templates.get(index));
    }
    else
    {
      return templateListItemStyle;
    }
  }

  public render()
  {
    return (
      <ItemList
        items={this.props.templates}
        columnConfig={this.displayConfig}
        onRowClicked={this.handleOnClick}
        getRowStyle={this.getRowStyle}
      />
    );
  }

  public handleOnClick(index)
  {
    if (this.props.onClick != null)
    {
      const { templates } = this.props;
      const template = templates.get(index);
      this.props.onClick(template);
    }
  }
}

const templateListItemStyle = {};

export default Util.createContainer(
  TemplateList,
  [['etl', 'templates']],
  {},
);
