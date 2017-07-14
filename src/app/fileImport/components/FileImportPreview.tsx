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

// tslint:disable:no-empty strict-boolean-expressions no-console

import * as classNames from 'classnames';
import * as Immutable from 'immutable';
import * as $ from 'jquery';
import * as React from 'react';
import * as _ from 'underscore';
import Util from '../../util/Util';
import Autocomplete from './../../common/components/Autocomplete';
import Dropdown from './../../common/components/Dropdown';
import TerrainComponent from './../../common/components/TerrainComponent';
import Actions from './../data/FileImportActions';
import * as FileImportTypes from './../FileImportTypes';
import FileImportPreviewColumn from './FileImportPreviewColumn';
import FileImportPreviewRow from './FileImportPreviewRow';

import './FileImportPreview.less';
const { List } = Immutable;

export interface Props
{
  previewRows: List<List<string>>;
  columnsCount: number;
  primaryKey: number;
  oldNames: List<string>;

  columnsToInclude: List<boolean>;
  columnNames: List<string>;
  columnTypes: List<FileImportTypes.ColumnType>;
  columnOptions: List<string>;
  templates: List<FileImportTypes.Template>;
  transforms: List<FileImportTypes.Transform>;
}

class FileImportPreview extends TerrainComponent<Props>
{
  public state: {
    colName: string,
    newName: string,
    templateId: number,
    templateText: string,
    editColumnId: number,
  } = {
    colName: '',
    newName: '',
    templateId: -1,
    templateText: '',
    editColumnId: -1,
  };

  public componentDidMount()
  {
    Actions.getTemplates();
  }

  public handleEditColumnChange(editColumnId: number)
  {
    this.setState({
      editColumnId,
    });
  }

  /* To prevent redundancy of renames in list of transforms, save the current rename transform and only add to list
   * when changing transform columns or types */
  public handleRenameTransform(colName: string, newName: string)
  {
    if (this.state.colName && this.state.newName !== colName)
    {
      console.log('adding rename transform: ', this.state.colName + ', ' + this.state.newName);
      Actions.addTransform({
        name: 'rename',
        colName: this.state.colName,
        args: {
          newName: this.state.newName,
        },
      });
      this.setState({
        colName,
        newName,
      });
    }
    else
    {
      if (!this.state.colName)
      {
        this.setState({
          colName,
        });
      }
      console.log('setting rename transform: ', this.state.colName + ' to ' + newName);
      this.setState({
        newName,
      });
    }
  }

  public addRenameTransform()
  {
    if (this.state.colName)
    {
      console.log('adding rename transform: ', this.state.colName + ', ' + this.state.newName);
      Actions.addTransform({
        name: 'rename',
        colName: this.state.colName,
        args: {
          newName: this.state.newName,
        },
      });
      this.setState({
        colName: '',
        newName: '',
      });
    }
  }

  public handleTemplateChange(templateId: number)
  {
    this.setState({
      templateId,
    });
  }

  public handleAutocompleteTemplateChange(templateText: string)
  {
    this.setState({
      templateText,
    });
  }

  public handleLoadTemplate()
  {
    Actions.loadTemplate(this.state.templateId);
  }

  public handleSaveTemplate()
  {
    Actions.saveTemplate(this.state.templateText);
    Actions.getTemplates();
  }

  public handleUploadFile()
  {
    // TODO: database and table name error checking
    this.addRenameTransform();
    Actions.uploadFile();
  }

  public render()
  {
    return (
      <div>
        <button onClick={this.handleLoadTemplate}>
          Load Template
        </button>
        <button onClick={this.handleSaveTemplate}>
          Save as Template
        </button>
        <Autocomplete
          value={this.state.templateText}
          options={null}
          onChange={this.handleAutocompleteTemplateChange}
          placeholder={'template name'}
          disabled={false}
        />
        <Dropdown
          selectedIndex={this.state.templateId}
          options={List<string>(this.props.templates.map((template, i) => template.name))}
          onChange={this.handleTemplateChange}
          canEdit={true}
        />
        <table>
          <thead>
            <tr>
              {
                this.props.columnNames.map((value, key) =>
                  <FileImportPreviewColumn
                    key={key}
                    columnId={key}
                    isIncluded={this.props.columnsToInclude.get(key)}
                    columnType={this.props.columnTypes.get(key)}
                    isPrimaryKey={this.props.primaryKey === key}
                    columnNames={this.props.columnNames}
                    datatypes={List(FileImportTypes.ELASTIC_TYPES)}
                    columnOptions={this.props.columnOptions}
                    editing={key === this.state.editColumnId}
                    handleRenameTransform={this.handleRenameTransform}
                    addRenameTransform={this.addRenameTransform}
                    handleEditColumnChange={this.handleEditColumnChange}
                  />,
                ).toArray()
              }
            </tr>
          </thead>
          <tbody>
            {
              this.props.previewRows.map((items, key) =>
                <FileImportPreviewRow
                  key={key}
                  items={items}
                />,
              )
            }
          </tbody>
        </table>
        <button onClick={this.handleUploadFile}>
          Import
        </button>
      </div>
    );
  }
}

export default FileImportPreview;
