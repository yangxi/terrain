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
import * as Immutable from 'immutable';
import * as React from 'react';
import { DragDropContext } from 'react-dnd';
import PureClasss from './../../common/components/PureClasss';;
import FileImportStore from './../data/FileImportStore';
import FileImportInfo from './FileImportInfo';
import { FileImportState } from './../data/FileImportStore';
import FileImportTypes from './../FileImportTypes';
import './FileImport.less';
const HTML5Backend = require('react-dnd-html5-backend');
import { browserHistory } from 'react-router';
import SchemaStore from './../../schema/data/SchemaStore';
import SchemaTypes from './../../schema/SchemaTypes';
import Preview from './Preview';
const { List } = Immutable;

export interface Props
{
  params?: any;
  location?: any;
  router?: any;
  route?: any;
}

const CLUSTERS = Immutable.List(['test1', 'test2', 'test3']);
const FILETYPES = Immutable.List(['json', 'csv']);
const ROWS_COUNT = 10;

class FileImport extends PureClasss<any>
{
  public state: {
    fileImportState: FileImportState;
    databases?: SchemaTypes.DatabaseMap;
    tables?: SchemaTypes.TableMap;
  } = {
    fileImportState: FileImportStore.getState(),
  };

  constructor(props)
  {
    super(props);

    this._subscribe(FileImportStore, {
      stateKey: 'fileImportState',
    });

    this._subscribe(SchemaStore, {
      stateKey: 'databases',
      storeKeyPath: ['databases'],
    });

    this._subscribe(SchemaStore, {
      stateKey: 'tables',
      storeKeyPath: ['tables'],
    });
  }

  private getMapKeys(map: IMMap<string, any>)
  {
    if (map === undefined)
    {
      return List();
    }

    const list = [];
    map.forEach((value, key) =>
    {
      list.push(key);
    })
    return List(list);
  }

  public render()
  {
    const { fileImportState } = this.state;
    const { clusterIndex, dbText, tableText, dbSelected, tableSelected, fileChosen, previewRows, previewMaps } = fileImportState;

    return (
      <div className="fileImport">
        <h2>File Import Page</h2>
        <FileImportInfo
          canSelectCluster={true}
          clusterIndex={clusterIndex}
          clusters={CLUSTERS}
          canSelectDb={true}
          dbs={this.getMapKeys(this.state.databases)}
          dbText={dbText}
          dbSelected={dbSelected}
          canSelectTable={true}
          tables={this.getMapKeys(this.state.tables)}
          tableText={tableText}
          tableSelected={tableSelected}
          canImport={true}
          validFiletypes={FILETYPES}
          fileChosen={fileChosen}
          rowsCount={ROWS_COUNT}
        />
        {
          previewRows &&
          <div>
            <Preview
              rowsCount={Math.min(ROWS_COUNT, previewRows.length)}
              previewRows={previewRows}
              previewMaps={null}
            />
          </div>
        }
      </div>
    );
  }
}

// ReactRouter does not like the output of DragDropContext, hence the `any` cast
const ExportFileImport = DragDropContext(HTML5Backend)(FileImport) as any;

export default ExportFileImport;
