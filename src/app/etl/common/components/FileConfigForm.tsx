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

import TerrainComponent from 'common/components/TerrainComponent';
import * as _ from 'lodash';
import memoizeOne from 'memoize-one';
import * as React from 'react';

import { DynamicForm } from 'common/components/DynamicForm';
import { DisplayState, DisplayType, InputDeclarationMap } from 'common/components/DynamicFormTypes';
import { instanceFnDecorator } from 'shared/util/Classes';

import Util from 'app/util/Util';
import { _FileConfig, FileConfig } from 'shared/etl/immutable/EndpointRecords';
import { FileConfig as FileConfigI } from 'shared/etl/types/EndpointTypes';
import { FileTypes } from 'shared/etl/types/ETLTypes';

import Button from 'app/common/components/Button';
import FadeInOut from 'app/common/components/FadeInOut';
import Modal from 'app/common/components/Modal';
import PathUtil from 'etl/pathselector/PathguesserUtil';
import { List } from 'immutable';
import { backgroundColor, Colors, fontColor, getStyle } from '../../../colors/Colors';
import { ColorsActions } from '../../../colors/data/ColorsRedux';
import ButtonModal from './ButtonModal';
import './ButtonModal.less';
import DataModal from './DataModal';
const InfoIcon = require('../../../../images/icon_info.svg?name=InfoIcon');

export interface Props
{
  fileConfig: FileConfig;
  onChange: (config: FileConfig, isBlur?: boolean) => void;
  hideTypePicker?: boolean;
  style?: any;
  isSource?: boolean;
  source?: any;
}

type FormState = FileConfigI & {
  useXmlPath: boolean;
  useJsonPath: boolean;
  isPlaFeed: boolean;
  previewDataSource: any;
  ignoreQuotes: boolean;
};

export default class FileConfigForm extends TerrainComponent<Props>
{
  public state = {
    suggestedPathsOpen: false,
  };

  public inputMap: InputDeclarationMap<FormState> =
    {
      fileType: {
        type: DisplayType.Pick,
        displayName: 'File Type',
        widthFactor: 2,
        group: 'file type',
        options: {
          pickOptions: (s: FormState) => fileTypeList,
          indexResolver: (value) => fileTypeList.indexOf(value),
        },
        getDisplayState: this.fileTypeDisplayState,
      },
      // hasCsvHeader: {
      //   type: DisplayType.CheckBox,
      //   displayName: 'File Has Header',
      //   group: 'file type',
      //   widthFactor: 4,
      //   getDisplayState: (s: FormState) => (s.fileType === FileTypes.Csv || s.fileType === FileTypes.Tsv)
      //     ? DisplayState.Active : DisplayState.Hidden,
      // }, currently disabled since we don't allow not having a header
      jsonNewlines: {
        type: DisplayType.CheckBox,
        displayName: 'Objects separated by newlines',
        group: 'file type',
        widthFactor: 4,
        getDisplayState: (s: FormState) => s.fileType === FileTypes.Json ? DisplayState.Active : DisplayState.Hidden,
      },
      useXmlPath: {
        type: DisplayType.CheckBox,
        displayName: 'Use XML Extract Key',
        group: 'path',
        widthFactor: 3,
        getDisplayState: (s: FormState) => s.fileType === FileTypes.Xml ? DisplayState.Active : DisplayState.Hidden,
      },
      xmlPath: {
        type: DisplayType.TextBox,
        displayName: 'XML Extract Key',
        group: 'path',
        widthFactor: 3,
        getDisplayState: this.xmlPathDisplay,
      },
      useJsonPath: {
        type: DisplayType.CheckBox,
        displayName: 'Use JSON Path',
        group: 'path',
        widthFactor: 3,
        getDisplayState: (s: FormState) => s.fileType === FileTypes.Json ? DisplayState.Active : DisplayState.Hidden,
      },
      ignoreQuotes: {
        type: DisplayType.CheckBox,
        displayName: 'Ignore Quoting',
        group: 'path',
        widthFactor: 3,
        getDisplayState: (s: FormState) => s.fileType === FileTypes.Csv ? DisplayState.Active : DisplayState.Hidden,
      },
      jsonPath: {
        type: DisplayType.TextBox,
        displayName: 'JSON Path',
        group: 'suggested path',
        widthFactor: 3,
        style: { marginTop: '10px' },
        getDisplayState: this.jsonPathDisplay,
      },
      previewDataSource: {
        type: DisplayType.Custom,
        displayName: '',
        group: 'suggested path',
        widthFactor: 1,
        style: { marginTop: '10px' },
        options: {
          render: this.renderSuggestedJsonPaths,
        },
        getDisplayState: this.jsonPathDisplay,
      },
      isPlaFeed: {
        type: DisplayType.CheckBox,
        displayName: 'Google PLA Feed',
        group: 'path',
        widthFactor: 3,
        getDisplayState: this.plaFeedDisplay,
      },
    };

  public render()
  {
    return (
      <DynamicForm
        inputMap={this.inputMap}
        inputState={this.configToState(this.props.fileConfig, this.props.source)}
        onStateChange={this.handleFormChange}
        style={this.props.style}
      />
    );
  }

  public updateJsonPath(possiblePath)
  {
    const pathName: string = possiblePath.split(':')[0];
    const formattedPath = (pathName === '*') ? '*' : pathName + '.*';
    const updatedFileConfig = this.props.fileConfig.set('jsonPath', formattedPath);
    this.props.onChange(updatedFileConfig);
  }

  public renderSuggestedJsonPaths(state, disabled)
  {
    if (this.props.source == null)
    {
      return undefined;
    }
    else
    {
      const suggestedFilePaths = PathUtil.guessFilePaths(this.props.source);
      if (suggestedFilePaths.length === 0)
      {
        return undefined;
      }
      return (
        <ButtonModal
          buttonIcon={
            <InfoIcon />
          }
          iconColor={Colors().mainBlue}
          modal='Suggested JSON Paths (Select One)'
          wide={true}
          noFooterPadding={true}
          smallIconButton={true}
          modalContent={this.renderSuggestedPathsData(suggestedFilePaths)}
        />
      );
    }
  }

  public formatSectionTabs(key, i)
  {
    return `${key.name}: ${key.score}`;
  }

  public formatSectionData(key, i)
  {
    const jsonPath = (key.name === '*') ? JSON.stringify(this.props.source.slice(0, 60), null, 2) :
      JSON.stringify(this.props.source[key.name], null, 2);
    return jsonPath;
  }

  public formatSectionTitles(key, i)
  {
    const selectedText = (key.name === '*') ? 'CURRENTLY SELECTED: *' : `CURRENTLY SELECTED: ${key.name}.*`;
    const scoreButton = `(${key.score})`;
    const pathScoreMessage = (
      <div className='path-score-message' style={{ color: Colors().mainSectionTitle }}>
        <p>
          The suggested path scoring is calculated upon the JSON object's key meeting
          certain requirements of expected behavior, such as:
        </p>
        <ul>
          <li>corresponding values not being numbers or strings</li>
          <li>values being a list of objects</li>
          <li>objects contain identical inner keys</li>
          <li>objects contain equal amounts of inner keys</li>
        </ul>
        <p>
          A higher score indicates a stronger confidence of that key being the correct path, on
          a 0-10 point scale.
        </p>
        <p>
          If there is only one suggested key, then its score is automatically 10 as there is no comparison.
        </p>
      </div>
    );
    return (
      <div className='path-with-score'>
        <div className='path-title-buffer'>{selectedText}</div>
        <ButtonModal
          button={scoreButton}
          modal='Path Scoring'
          wide={false}
          noFooterPadding={true}
          smallTextButton={true}
          modalContent={pathScoreMessage}
          helpCursor={true}
        />
      </div>
    );
  }

  public renderSuggestedPathsData(suggestedFilePaths)
  {
    return (
      <DataModal
        sectionType='path'
        sectionOptions={
          List(suggestedFilePaths.map((key, i) => this.formatSectionTabs(key, i)))
        }
        sectionBoxes={
          List(suggestedFilePaths.map((key, i) => this.formatSectionData(key, i)))
        }
        sectionTitles={
          List(suggestedFilePaths.map((key, i) => this.formatSectionTitles(key, i)))
        }
        width='100%'
        height='80%'
        strictFormatting={true}
        dynamicTitle={true}
        preselected={true}
        onChange={this.updateJsonPath}
      />
    );
  }

  public xmlPathDisplay(s: FormState)
  {
    return (s.fileType === FileTypes.Xml && s.useXmlPath === true) ? DisplayState.Active : DisplayState.Hidden;
  }

  public plaFeedDisplay(s: FormState)
  {
    return (s.fileType === FileTypes.Xml && !this.props.isSource) ? DisplayState.Active : DisplayState.Hidden;
  }

  public jsonPathDisplay(s: FormState)
  {
    return (s.fileType === FileTypes.Json && s.useJsonPath === true) ?
      DisplayState.Active : DisplayState.Hidden;
  }

  public fileTypeDisplayState(s: FormState)
  {
    return this.props.hideTypePicker === true ? DisplayState.Hidden : DisplayState.Active;
  }

  @instanceFnDecorator(memoizeOne)
  public configToState(config: FileConfig, previewDataSource?: any): FormState
  {
    const state = Util.asJS(config) as FormState;
    if (state.xmlPath !== null)
    {
      state.useXmlPath = true;
    }
    if (state.jsonPath !== null)
    {
      state.useJsonPath = true;
    }
    state.previewDataSource = previewDataSource;
    return state;
  }

  public handleFormChange(formState: FormState, isBlur?: boolean)
  {
    const state = _.extend({}, formState);
    if (state.useXmlPath && state.xmlPath === null)
    {
      state.xmlPath = '';
    }
    else if (!state.useXmlPath && state.xmlPath !== null)
    {
      state.xmlPath = null;
    }

    if (state.useJsonPath && state.jsonPath === null)
    {
      const suggestedPath = PathUtil.guessFilePaths(this.props.source)[0];
      if (suggestedPath != null)
      {
        const currentPath = (suggestedPath.name === '*') ? '*' : suggestedPath.name + '.*';
        state.jsonPath = currentPath;
      }
      else
      {
        state.jsonPath = '';
      }
    }
    else if (!state.useJsonPath && state.jsonPath !== null)
    {
      state.jsonPath = null;
    }

    this.props.onChange(_FileConfig(state), isBlur);
  }
}

const fileTypeList = List([FileTypes.Json, FileTypes.Csv, FileTypes.Xml, FileTypes.Tsv, FileTypes.Xlsx]);
