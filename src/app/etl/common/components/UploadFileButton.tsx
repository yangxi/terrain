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
// tslint:disable:no-var-requires

import TerrainComponent from 'common/components/TerrainComponent';
import * as Radium from 'radium';
import * as React from 'react';

import FilePicker from 'common/components/FilePicker';

import { backgroundColor, borderColor, Colors, fontColor, getStyle } from 'src/app/colors/Colors';

const UploadIcon = require('images/icon_export.svg');

export interface Props
{
  file: File;
  onChange: (file: File) => void;
}

@Radium
export default class UploadFileButton extends TerrainComponent<Props>
{
  // a bit verbose, but keeping this here to preserve history
  public _altButtonStyle()
  {
    return altButtonStyle;
  }

  public _altButtonClass()
  {
    return 'etl-alt-button';
  }

  public render()
  {
    const button = (
      <div
        className={this._altButtonClass()}
        style={this._altButtonStyle()}
      >
        <UploadIcon />
        <div className='alt-button-text'>
          Choose a File
        </div>
      </div>
    );

    const { file, onChange } = this.props;
    const showFileName = file != null;
    return (
      <div className='etl-button-column'>
        <FilePicker
          large={true}
          onChange={onChange}
          accept={'.csv,.json,.xml,.tsv,.xlsx'}
          customButton={button}
        />
        <span
          style={{
            marginTop: '6px',
          }}
        >
          <div
            className='etl-transition-element upload-filename'
          >
            {showFileName ? file.name : ''}
          </div>
        </span>
      </div>
    );
  }
}

const altButtonStyle = [
  backgroundColor(Colors().bg3),
  fontColor(Colors().text2, Colors().text2),
  borderColor(Colors().darkerHighlight, Colors().active),
  getStyle('boxShadow', `2px 1px 3px ${Colors().boxShadow}`),
];
