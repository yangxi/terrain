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

// tslint:disable:no-var-requires restrict-plus-operands strict-boolean-expressions

import PathfinderFilterSection from 'app/builder/components/pathfinder/filter/PathfinderFilterSection';
import PathfinderAggregationLine from 'app/builder/components/pathfinder/more/PathfinderAggregationLine';
import PathfinderAggregationMoreSection from 'app/builder/components/pathfinder/more/PathfinderAggregationMoreSection';
import PathfinderCreateLine from 'app/builder/components/pathfinder/PathfinderCreateLine';
import PathfinderText from 'app/builder/components/pathfinder/PathfinderText';
import
{
  _AggregationLine, _FilterGroup, _Sample, _Script,
  AggregationLine, PathfinderContext,
} from 'app/builder/components/pathfinder/PathfinderTypes';
import BuilderActions from 'app/builder/data/BuilderActions';
import BuilderTextbox from 'app/common/components/BuilderTextbox';
import Dropdown from 'app/common/components/Dropdown';
import Menu from 'app/common/components/Menu';
import RadioButtons from 'app/common/components/RadioButtons';
import TerrainComponent from 'app/common/components/TerrainComponent';
import { List } from 'immutable';
import * as React from 'react';
import Util from 'util/Util';

const ArrowIcon = require('images/icon_arrow.svg?name=ArrowIcon');
const RemoveIcon = require('images/icon_close_8x8.svg?name=RemoveIcon');

export interface Props
{
  pathfinderContext: PathfinderContext;
  aggregation: AggregationLine;
  keyPath: KeyPath;
  fields: List<string>;

  builderActions?: typeof BuilderActions;
}

export class PathfinderAggregationMoreArea extends TerrainComponent<Props>
{

  public addSampler(index, id)
  {
    this.props.builderActions.changePath(this._ikeyPath(this.props.keyPath, 'sampler'), _Sample());
  }

  public addFilters()
  {
    this.props.builderActions.changePath(this._ikeyPath(this.props.keyPath, 'filters'), _FilterGroup());
  }

  public addNested()
  {
    this.props.builderActions.changePath(this._ikeyPath(this.props.keyPath, 'nested'), List([]));
  }

  public addScripts()
  {
    this.props.builderActions.changePath(this._ikeyPath(this.props.keyPath, 'scripts'), List([]));
  }

  public renderSampleSection()
  {
    const { sampleType } = this.props.aggregation.sampler;
    const { canEdit } = this.props.pathfinderContext;
    const { fields } = this.props;
    return (
      <div>
        <RadioButtons
          selected={sampleType}
          radioKey={'sampleType'}
          keyPath={this._ikeyPath(this.props.keyPath, 'sample', 'sampleType')}
          action={this.props.builderActions.changePath}
          options={List([
            {
              key: 'global',
              display: <div className='pf-aggregation-sampler-option'><span>All hits</span></div>,
            },
            {
              key: 'sampler',
              display:
                <div className='pf-aggregation-sampler-option'>
                  <span>The top</span>
                  <BuilderTextbox
                    value={this.props.aggregation.sampler.numSamples}
                    keyPath={this._ikeyPath(this.props.keyPath, 'sample', 'numSamples')}
                    canEdit={canEdit && sampleType === 'sampler'}
                    action={this.props.builderActions.changePath}
                  />
                  <span>hits</span>
                </div>,
            },
            {
              key: 'diversified_sampler',
              display:
                <div className='pf-aggregation-sampler-option'>
                  <span>The top</span>
                  <BuilderTextbox
                    value={this.props.aggregation.sampler.numSamples}
                    keyPath={this._ikeyPath(this.props.keyPath, 'sampler', 'numSamples')}
                    canEdit={canEdit && sampleType === 'diversified_sampler'}
                    action={this.props.builderActions.changePath}
                  />
                  <span>hits with unique</span>
                  <Dropdown
                    selectedIndex={fields.indexOf(this.props.aggregation.sampler.diverseField)}
                    options={fields}
                    keyPath={this._ikeyPath(this.props.keyPath, 'samples', 'diversified_field')}
                    canEdit={canEdit && sampleType === 'diversified_sampler'}
                    action={this.props.builderActions.changePath}
                  />
                </div>,
            },
          ])}
        />
      </div>
    );
  }

  public renderFilterSection()
  {
    return (
      <PathfinderFilterSection
        pathfinderContext={this.props.pathfinderContext}
        filterGroup={this.props.aggregation.filters}
        keyPath={this._ikeyPath(this.props.keyPath, 'filters')}
        valueOptions={List()}
      />
    );
  }

  public handleDeleteNestedLine(index)
  {
    this.props.builderActions.changePath(this._ikeyPath(this.props.keyPath, 'nested'), this.props.aggregation.nested.delete(index));
  }

  public handleAddLine()
  {
    this.props.builderActions.changePath(this._ikeyPath(this.props.keyPath, 'nested'),
      this.props.aggregation.nested.push(_AggregationLine()));
  }

  public renderNestedAggregations()
  {
    return (
      <div>
        {
          this.props.aggregation.nested.map((agg, i) =>
          {
            return (
              <PathfinderAggregationLine
                pathfinderContext={this.props.pathfinderContext}
                aggregation={agg}
                keyPath={this._ikeyPath(this.props.keyPath, 'nested').push(i)}
                onDelete={this.handleDeleteNestedLine}
                index={i}
                key={i}
              />
            );
          })}
        <PathfinderCreateLine
          canEdit={this.props.pathfinderContext.canEdit}
          onCreate={this.handleAddLine}
          text={PathfinderText.createAggregationLine}
        />
      </div>
    );
  }

  public handleAddScript()
  {
    this.props.builderActions.changePath(this._ikeyPath(this.props.keyPath, 'scripts'),
      this.props.aggregation.scripts.push(_Script()));
  }

  public renderScripts()
  {
    return (
      <div className='pf-aggregation-script-section'>
        {
          this.props.aggregation.scripts.map((script, i) =>
          {
            return (
              <div key={i} className='pf-aggregation-script-item'>
                <div className='pf-aggregation-script-title'>
                  <span>Name</span>
                  <BuilderTextbox
                    value={script.id}
                    canEdit={this.props.pathfinderContext.canEdit}
                    keyPath={this._ikeyPath(this.props.keyPath, 'scripts', i, 'name')}
                    placeholder={'Script Name'}
                    action={this.props.builderActions.changePath}
                  />
                </div>
                <BuilderTextbox
                  value={script.script}
                  keyPath={this._ikeyPath(this.props.keyPath, 'scripts', i, 'script')}
                  canEdit={this.props.pathfinderContext.canEdit}
                  textarea={true}
                  action={this.props.builderActions.changePath}
                />
              </div>
            );
          })
        }
        <PathfinderCreateLine
          canEdit={this.props.pathfinderContext.canEdit}
          onCreate={this.handleAddScript}
          text={'script'}
        />
      </div>
    );
  }

  // If any extra-advanced features (scripts, nested, filters, samplers) have been rendered, add them
  public renderMoreAdvancedSections()
  {
    return (
      <div>
        {this.props.aggregation.sampler !== undefined &&
          <PathfinderAggregationMoreSection
            canEdit={this.props.pathfinderContext.canEdit}
            content={this.renderSampleSection()}
            title={'Sample From'}
            keyPath={this._ikeyPath(this.props.keyPath, 'sample')}
          />
        }
        {this.props.aggregation.filters !== undefined &&
          <PathfinderAggregationMoreSection
            canEdit={this.props.pathfinderContext.canEdit}
            content={this.renderFilterSection()}
            title={'Filter By'}
            keyPath={this._ikeyPath(this.props.keyPath, 'filters')}
          />
        }
        {this.props.aggregation.nested !== undefined &&
          <PathfinderAggregationMoreSection
            canEdit={this.props.pathfinderContext.canEdit}
            content={this.renderNestedAggregations()}
            title={'Nested'}
            keyPath={this._ikeyPath(this.props.keyPath, 'nested')}
          />
        }
        {
          this.props.aggregation.scripts !== undefined &&
          <PathfinderAggregationMoreSection
            canEdit={this.props.pathfinderContext.canEdit}
            content={this.renderScripts()}
            title={'Scripts'}
            keyPath={this._ikeyPath(this.props.keyPath, 'scripts')}
          />
        }
      </div>
    );
  }

  public renderMoreMenu()
  {
    let moreOptions = List([]);
    if (this.props.aggregation.sampler === undefined)
    {
      moreOptions = moreOptions.push({
        text: 'Sample from...',
        onClick: this.addSampler,
      });
    }
    if (this.props.aggregation.filters === undefined)
    {
      moreOptions = moreOptions.push({
        text: 'Filter by...',
        onClick: this.addFilters,
      });
    }
    if (this.props.aggregation.nested === undefined)
    {
      moreOptions = moreOptions.push({
        text: 'Add nested...',
        onClick: this.addNested,
      });
    }
    if (this.props.aggregation.scripts === undefined)
    {
      moreOptions = moreOptions.push({
        text: 'Add script...',
        onClick: this.addScripts,
      });
    }
    return (
      <div className='pf-aggregation-more-menu-wrapper'>
        <Menu
          options={moreOptions}
          title='More...'
          openRight={true}
        />
      </div>
    );
  }

  public render()
  {
    return (
      <div>
        {this.renderMoreAdvancedSections()}
        {this.renderMoreMenu()}
      </div>
    );
  }
}

export default Util.createTypedContainer(
  PathfinderAggregationMoreArea,
  [],
  { builderActions: BuilderActions },
);
