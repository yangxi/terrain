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
import * as React from 'react';
import { backgroundColor, borderColor, Colors, fontColor, getStyle } from 'src/app/colors/Colors';
import Util from 'util/Util';

const Color = require('color');
import Modal from 'common/components/Modal';
import { instanceFnDecorator } from 'shared/util/Classes';
import Quarantine from 'util/RadiumQuarantine';

import EndpointForm from 'etl/common/components/EndpointForm';
import GraphHelpers from 'etl/helpers/GraphHelpers';
import { TemplateEditorActions } from 'etl/templates/TemplateEditorRedux';
import { _SourceConfig, SinkConfig, SourceConfig } from 'shared/etl/immutable/EndpointRecords';
import { ETLTemplate, SinksMap, SourcesMap } from 'shared/etl/immutable/TemplateRecords';
import TemplateEndpoint from './TemplateEndpoint';

import './EndpointSection.less';

import { Map } from 'immutable';

export interface Props
{
  isSource?: boolean;
  // below from container
  template: ETLTemplate;
  act?: typeof TemplateEditorActions;
}

type EndpointsType = SourcesMap | SinksMap;
type LooseEndpointsType = Immutable.Map<string, SourceConfig | SinkConfig>;

class EndpointSection extends TerrainComponent<Props>
{
  public state: {
    expandableState: Immutable.Map<string, boolean>;
    endpoints: EndpointsType;
    newSourceModalOpen: boolean;
    newSourceModalName: string;
    newSource: SourceConfig;
    sourceModalError: string;
  };

  constructor(props: Props)
  {
    super(props);
    this.state = {
      expandableState: Map(),
      endpoints: props.isSource ? props.template.getSources() : props.template.getSinks(),
      newSourceModalOpen: false,
      newSourceModalName: '',
      newSource: _SourceConfig(),
      sourceModalError: '',
    };
  }

  public componentWillReceiveProps(nextProps: Props)
  {
    const { isSource, template } = this.props;
    const newEndpoints = isSource ? nextProps.template.getSources() : nextProps.template.getSinks();
    const oldEndpoints = isSource ? template.getSources() : template.getSinks();

    if (newEndpoints !== oldEndpoints || isSource !== nextProps.isSource)
    {
      this.setState({
        endpoints: newEndpoints,
      });
    }
  }

  public renderEndpoint(endpoint: SourceConfig | SinkConfig, key)
  {
    return (
      <TemplateEndpoint
        key={key}
        endpointKey={key}
        endpoint={endpoint}
        onEndpointChange={this.handleEndpointChangeFactory(key)}
        isSource={this.props.isSource}
      />
    );
  }

  public renderNewSourceButton()
  {
    if (!this.props.isSource)
    {
      return null; // Currently no need for dests
    }
    return (
      <Quarantine>
        <div
          className='add-additional-endpoint'
          style={addEndpointStyle}
          onClick={this.openNewSourceModal}
        >
          Add Another Source
        </div>
      </Quarantine>
    );
  }

  public closeNewSourceModal()
  {
    this.setState({
      newSourceModalOpen: false,
      newSourceModalName: '',
    });
  }

  public openNewSourceModal()
  {
    this.setState({
      newSourceModalOpen: true,
      sourceModalError: '',
    });
  }

  public renderNewSourceModal()
  {
    const { template } = this.props;
    const { sourceModalError } = this.state;

    const editForm = (
      <div className='new-source-modal'>
        <EndpointForm
          isSource={true}
          endpoint={this.state.newSource}
          onChange={this._setStateWrapper('newSource')}
          onSubmit={this.handleAddNewSource}
        />
      </div>
    );
    const confirmDisabled =
      this.state.newSourceModalName === '' ||
      this.state.newSource.type == null ||
      template.getSources().hasIn([this.state.newSourceModalName]);

    return (
      <Modal
        open={this.state.newSourceModalOpen}
        onValidate={this.handleSourceValidation}
        onConfirm={this.handleAddNewSource}
        onClose={this.closeNewSourceModal}
        // confirmDisabled={confirmDisabled}
        title='Add New Source'
        showTextbox={true}
        confirm={true}
        textboxValue={this.state.newSourceModalName}
        onTextboxValueChange={this._setStateWrapper('newSourceModalName')}
        textboxPlaceholderValue='Source Name'
        closeOnConfirm={true}
        allowOverflow={true}
        errorMessage={sourceModalError}
        onErrorClear={this.handleModalErrorClear}
      >
        {editForm}
      </Modal>
    );
  }

  public render()
  {
    const { isSource, template } = this.props;
    const { endpoints } = this.state;
    const buttonsDisabled = endpoints === (isSource ? template.getSources() : template.getSinks());

    return (
      <div className='endpoint-section'>
        <Quarantine>
          <div
            className='endpoint-type-title'
            style={getStyle('borderBottom', `1px solid ${Colors().border1}`)}
          >
            <div className='endpoint-type-title-text'>
              {isSource ? 'Sources' : 'Destination'}
            </div>
          </div>
        </Quarantine>
        {(endpoints as LooseEndpointsType).map(this.renderEndpoint).toList()}
        {isSource ? this.renderNewSourceButton() : null}
        {isSource ? this.renderNewSourceModal() : null}
      </div>
    );
  }

  public handleApplyChanges()
  {
    const { template, isSource, act } = this.props;
    if (isSource)
    {
      GraphHelpers.updateSources(this.state.endpoints);
    }
    else
    {
      GraphHelpers.updateSinks(this.state.endpoints);
    }
  }

  public handleSourceValidation(): boolean
  {
    const { newSourceModalName, newSource } = this.state;
    const source = newSource.set('name', newSourceModalName);
    if (source.name === '')
    {
      this.setState({ sourceModalError: 'Please specify a Source Name' });
      return false;
    }

    if (newSource.type == null)
    {
      this.setState({ sourceModalError: 'Please specify a Source Type' });
      return false;
    }

    return true;
  }

  public handleAddNewSource()
  {
    const { endpoints, newSourceModalName, newSource } = this.state;
    const source = newSource.set('name', newSourceModalName);
    this.setState({
      endpoints: (endpoints as LooseEndpointsType).set(newSourceModalName, source),
    }, this.handleApplyChanges);
  }

  public handleModalErrorClear()
  {
    this.setState({ sourceModalError: '' });
  }

  public isEndpointOpen(key: string)
  {
    return this.state.expandableState.get(key) !== false;
  }

  @instanceFnDecorator(_.memoize)
  public handleEndpointChangeFactory(key: string)
  {
    return (endpoint: SourceConfig | SinkConfig, apply: boolean = true) =>
    {
      const { endpoints } = this.state;
      this.setState({
        endpoints: (endpoints as LooseEndpointsType).set(key, endpoint),
      }, apply ? this.handleApplyChanges : undefined);
    };
  }
}

const addEndpointStyle = _.extend({},
  backgroundColor('rgba(0,0,0,0)', Colors().highlight),
);
// memoized
let getButtonStyle = (active: boolean, disabled: boolean) =>
{
  if (active)
  {
    return disabled ? [
      fontColor(Colors().activeText),
      backgroundColor(Colors().activeHover, Colors().activeHover),
      borderColor(Colors().altBg2),
    ] : [
        backgroundColor(Colors().active, Colors().activeHover),
        borderColor(Colors().active, Colors().activeHover),
        fontColor(Colors().activeText),
      ];
  }
  else
  {
    return disabled ? [
      fontColor(Colors().text3, Colors().text3),
      backgroundColor(Color(Colors().bg2).alpha(0.5).toString(), Color(Colors().bg2).alpha(0.5).toString()),
      borderColor(Colors().bg2),
    ] : [
        fontColor(Colors().text2, Colors().text3),
        backgroundColor(Colors().bg2, Color(Colors().bg2).alpha(0.5).toString()),
        borderColor(Colors().bg1),
      ];
  }
};
function resolveBooleans(a, b)
{
  return a ? (b ? 'tt' : 'tf') : (b ? 'ft' : 'ff');
}
getButtonStyle = _.memoize(getButtonStyle, resolveBooleans);

export default Util.createContainer(
  EndpointSection,
  [
    ['templateEditor', 'template'],
  ],
  { act: TemplateEditorActions },
);
