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

// tslint:disable:no-var-requires
import * as classNames from 'classnames';
import TerrainComponent from 'common/components/TerrainComponent';
import * as _ from 'lodash';
import * as Radium from 'radium';
import * as React from 'react';
import { backgroundColor, borderColor, buttonColors, Colors, fontColor, getStyle } from 'src/app/colors/Colors';
import Util from 'util/Util';

import ExpandableView from 'common/components/ExpandableView';
import { TemplateEditorActions } from 'etl/templates/data/TemplateEditorRedux';
import { _TemplateField, ELASTIC_TYPES, TemplateEditorState, TemplateField } from 'etl/templates/TemplateTypes';
import { TemplateEditorField, TemplateEditorFieldProps } from './TemplateEditorField';
import './TemplateEditorField.less';
import TemplateEditorFieldSettings from './TemplateEditorFieldSettings';
const AddIcon = require('images/icon_add.svg');

export interface Props extends TemplateEditorFieldProps
{
  keyPath: KeyPath;
  field: TemplateField;
  canEdit: boolean;
  // below from container
  templateEditor?: TemplateEditorState;
  act?: typeof TemplateEditorActions;
}

@Radium
class TemplateEditorFieldNodeC extends TemplateEditorField<Props>
{
  public state: {
    expandableViewOpen: boolean;
  } = {
    expandableViewOpen: true,
  };

  public renderChildFields()
  {
    const { field, keyPath, canEdit } = this.props;

    return field.children.map((value, index) =>
    {
      const newKeyPath = keyPath.push('children', index);
      return (
        <div className='subfield-spacer' key={index}>
          <TemplateEditorFieldNode
            keyPath={newKeyPath}
            field={value}
            canEdit={field.isIncluded && canEdit}
          />
        </div>
      );
    }).toList();
  }

  public renderCreateNewFieldButton()
  {
    const buttonStyle = this._inputDisabled() ?
      fontColor(Colors().text3, Colors().text3) :
      fontColor(Colors().text3, Colors().text2);
    return (
      <div className='new-field-button-spacer' key='new field button'>
        <div
          className={classNames({
            'create-new-template-field-button': true,
            'template-editor-field-input-disabled': this._inputDisabled(),
          })}
          onClick={this._noopIfDisabled(this.handleCreateNewField)}
          style={buttonStyle}
        >
          <AddIcon className='template-editor-add-icon' />
          <div> Add Field </div>
        </div>
      </div>
    );
  }

  public render()
  {
    const { field, keyPath, canEdit } = this.props;

    const settings = (
      <TemplateEditorFieldSettings
        keyPath={keyPath}
        field={field}
        canEdit={canEdit}
      />
    );

    const children = (this._isRoot() || this._isNested()) ? (
      <div className='template-editor-children-container'>
        {this.renderChildFields()}
        {this.renderCreateNewFieldButton()}
      </div>) : undefined;

    if (this._isRoot())
    {
      return children;
    }
    else
    {
      const childrenStyle = (canEdit === true && field.isIncluded === false) ?
        getStyle('opacity', '0.7') : {};
      return (
        <ExpandableView
          content={settings}
          open={this.state.expandableViewOpen}
          onToggle={this.handleExpandArrowClicked}
          children={children}
          style={childrenStyle}
        />
      );
    }
  }

  public handleExpandArrowClicked()
  {
    this.setState({
      expandableViewOpen: !this.state.expandableViewOpen,
    });
  }

  public handleCreateNewField()
  {
    const { keyPath, act } = this.props;
    const newField = _TemplateField({ name: `new field hello there` });
    act({
      actionType: 'createField',
      sourcePath: keyPath,
      field: newField,
    });
  }

  public handleFieldClicked()
  {
    const { field, keyPath, act } = this.props;
  }
}

const TemplateEditorFieldNode = Util.createTypedContainer(
  TemplateEditorFieldNodeC,
  ['templateEditor'],
  { act: TemplateEditorActions },
);

export default TemplateEditorFieldNode;
