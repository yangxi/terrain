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

// tslint:disable:no-var-requires switch-default strict-boolean-expressions restrict-plus-operands

import { BuilderState } from 'app/builder/data/BuilderState';
import ExpandIcon from 'app/common/components/ExpandIcon';
import FadeInOut from 'app/common/components/FadeInOut';
import { SchemaState } from 'app/schema/SchemaTypes';
import * as classNames from 'classnames';
import { getIndex } from 'database/elastic/blocks/ElasticBlockHelpers';
import ElasticBlockHelpers from 'database/elastic/blocks/ElasticBlockHelpers';
import * as Immutable from 'immutable';
import { List, Map } from 'immutable';
import * as $ from 'jquery';
import * as _ from 'lodash';
import * as Radium from 'radium';
import * as React from 'react';
import Draggable from 'react-draggable';
import { _Format, _ResultsConfig, ResultsConfig } from '../../../../../shared/results/types/ResultsConfig';
import { backgroundColor, borderColor, Colors, fontColor, getStyle } from '../../../colors/Colors';
import ColorManager from '../../../util/ColorManager';
import { SpotlightActions } from '../../data/SpotlightRedux';
import * as SpotlightTypes from '../../data/SpotlightTypes';
import TerrainComponent from './../../../common/components/TerrainComponent';
import { tooltip } from './../../../common/components/tooltip/Tooltips';
import Util from './../../../util/Util';
import './Hit.less';
import { _Hit, Hit } from './ResultTypes';

const PinIcon = require('./../../../../images/icon_pin_21X21.svg?name=PinIcon');
const ScoreIcon = require('./../../../../images/icon_terrain_27x16.svg?name=ScoreIcon');
const CloseIcon = require('./../../../../images/icon_close_8x8.svg?name=CloseIcon');
const CarrotIcon = require('images/icon_carrot?name=CarrotIcon');

// TODO REMOVE
import Actions from '../../data/BuilderActions';

const MAX_DEFAULT_FIELDS = 4;

export interface Props
{
  hit: Hit;

  resultsConfig: ResultsConfig;
  index: number;
  primaryKey: string;
  onExpand: (index: number) => void;
  expanded?: boolean;
  allowSpotlights: boolean;
  onSpotlightAdded: (id, spotlightData) => void;
  onSpotlightRemoved: (id) => void;
  hitSize?: 'large' | 'small' | 'smaller';
  style?: any;
  depth?: any;
  isNestedHit?: boolean;
  nestedFields?: List<string>;
  hideNested?: boolean;
  hideFieldNames?: boolean;
  firstVisibleField?: number;
  isVisible?: boolean;
  parentHit?: Hit;
  fieldTypes?: Map<string, string>;

  isOver?: boolean;
  isDragging?: boolean;
  connectDragSource?: (a: any) => any;
  connectDropTarget?: (a: any) => any;
  connectDragPreview?: (a: any) => void;

  locations?: { [field: string]: any };
  dataIndex?: string; // What index (elastic index) this hit comes from
  // injected props
  spotlights?: SpotlightTypes.SpotlightState;
  spotlightActions?: typeof SpotlightActions;
  schema?: SchemaState;
  builder?: BuilderState;
}

enum NestedState
{
  Normal,
  Collapsed,
  Expanded,
}

@Radium
class HitComponent extends TerrainComponent<Props> {

  public state: {
    hovered: boolean;
    nestedStates: Immutable.Map<string, NestedState>,
    nestedFields: string[],
    scrollState: Immutable.Map<string, number>,
    fieldTypes: Immutable.Map<string, string>,
  } =
    {
      hovered: false,
      nestedStates: Map<string, NestedState>({}),
      nestedFields: [],
      scrollState: Map<string, number>({}),
      fieldTypes: Map(),
    };

  public constructor(props: Props)
  {
    super(props);
  }

  public componentWillMount()
  {
    if (this.props.nestedFields === undefined && !this.props.hideNested)
    {
      this.setState({
        nestedFields: getResultNestedFields(this.props.hit, this.props.resultsConfig),
      });
    }
    if (this.props.fieldTypes === undefined)
    {
      this.setFieldTypes();
    }
  }

  public componentWillReceiveProps(nextProps)
  {
    if (!_.isEqual(this.props.hit.toJS(), nextProps.hit.toJS())
      || !_.isEqual(Util.asJS(this.props.resultsConfig), Util.asJS(nextProps.resultsConfig))
      && nextProps.nestedFields === undefined && !this.props.hideNested)
    {
      this.setState({
        nestedFields: getResultNestedFields(nextProps.hit, nextProps.resultsConfig),
      });
    }
  }

  public shouldComponentUpdate(nextProps: Props, nextState)
  {
    // Never update the component if it's not visible (unless it's a size change)
    if (!nextProps.isVisible && nextProps.hitSize === this.props.hitSize)
    {
      return false;
    }
    for (const key in nextProps)
    {
      if (nextProps.hasOwnProperty(key))
      {
        if (key === 'resultsConfig' && !_.isEqual(
          Util.asJS(this.props.resultsConfig),
          Util.asJS(nextProps.resultsConfig)))
        {
          return true;
        }
        else if (key !== 'hit' && key !== 'builder'
          && !_.isEqual(this.props[key], nextProps[key]))
        {
          return true;
        }
      }
    }

    for (const key in nextState)
    {
      if (!_.isEqual(this.state[key], nextState[key]))
      {
        return true;
      }
    }
    // If only the id has changed, we don't need to update the result
    for (const key in nextProps.hit.toJS())
    {
      if (key !== 'id' && !_.isEqual(nextProps.hit.toJS()[key], this.props.hit.toJS()[key]))
      {
        return true;
      }
    }
    return false;
  }

  public setFieldTypes()
  {
    const { hit, schema, builder } = this.props;
    let fieldTypes: Map<string, string> = Map();
    _.keys(hit.fields.toJS()).forEach((field) =>
    {
      const type = ElasticBlockHelpers.getTypeOfField(
        schema,
        builder,
        field,
        true,
      );
      fieldTypes = fieldTypes.set(field, type);
      const subFields = ElasticBlockHelpers.getSubfields(field, schema, builder);
      subFields.forEach((subField) =>
      {
        const subType = ElasticBlockHelpers.getTypeOfField(
          schema,
          builder,
          subField,
          true,
        );
        fieldTypes = fieldTypes.set(subField, subType);
      });
    });
    this.setState({
      fieldTypes,
    });
  }

  public renderExpandedField(value, field)
  {
    return this.renderField(field, 0, null, {
      showField: true,
      showRaw: true,
    });
  }

  public changeNestedState(state: NestedState, field: string)
  {
    this.setState({
      nestedStates: this.state.nestedStates.set(field, state),
    });
  }

  public renderNestedFieldHeader(field, depth, size, expandState: NestedState, maxFields: number, thumbnail: string)
  {
    const scrollState = this.state.scrollState.get(field) || 0;
    return (
      <div>
        <div
          className='hit-nested-content-header'
          style={[borderColor(Colors().blockOutline),
          backgroundColor(depth % 2 === 1 ? Colors().fontWhite : Colors().blockBg),
          { opacity: size === 0 ? 0.5 : 1 },
          ]}
        >
          <ExpandIcon
            open={expandState === NestedState.Expanded}
            onClick={this._fn(
              this.changeNestedState,
              expandState !== NestedState.Expanded ?
                NestedState.Expanded : NestedState.Normal,
              field,
            )}
            small={true}
          />
          <div
            className='hit-nested-content-title'
          // onClick={this._fn(
          //   this.changeNestedState,
          //   expandState !== NestedState.Collapsed ?
          //     NestedState.Collapsed : NestedState.Normal,
          //   field)}
          >
            {field} ({size})
          </div>
          <div
            className='hit-nested-column-names'
            style={fontColor(Colors().fontColorLightest)}
          >
            {
              thumbnail &&
              <span className='column-name-image'>Image</span>
            }
            <span
              className={classNames({
                'column-name-number': true,
                'column-name-number-no-thumbnail': !thumbnail,
              })}
            >
              No.
            </span>
            <span
              className={classNames({
                'column-name-name': true,
                'column-name-name-no-thumbnail': !thumbnail,
              })}
            >
              Name
              </span>
          </div>
        </div>
        {
          expandState !== NestedState.Collapsed &&
          <div>
            {
              scrollState ?
                <div
                  onClick={this._fn(this.handleScroll, field, -1)}
                  className='hit-content-scroll-back'
                  style={getStyle('fill', Colors().iconColor)}
                  key='forward-icon'
                >
                  <CarrotIcon />
                </div>
                :
                null
            }
            {
              (scrollState < maxFields - 2) &&
              <div
                onClick={this._fn(this.handleScroll, field, 1)}
                className='hit-content-scroll-forward'
                style={getStyle('fill', Colors().iconColor)}
                key='back-icon'
              >
                <CarrotIcon />
              </div>
            }
          </div>
        }
      </div>
    );
  }

  public handleScroll(field, change)
  {
    const prevState = this.state.scrollState.get(field) || 0;
    this.setState({
      scrollState: this.state.scrollState.set(field, prevState + change),
    });
  }

  public onVideoHoverStart(e)
  {
    const video: HTMLVideoElement = document.getElementsByClassName(e.target.className)[0] as HTMLVideoElement;
    if (video.paused)
    {
      const playPromise = video.play();
      if (playPromise !== undefined)
      {
        playPromise.then(() => { }).catch(() => { });
      }
    }
  }

  public onVideoHoverStop(e)
  {
    const video: HTMLVideoElement = document.getElementsByClassName(e.target.className)[0] as HTMLVideoElement;
    if (!video.paused)
    {
      video.pause();
    }
  }

  public onYoutubeVideoHoverStart(e)
  {
    const video: HTMLMediaElement = document.getElementsByClassName(e.target.className)[0] as HTMLMediaElement;
    video.src = e.target.className.replace('watch?v=', 'embed/').concat('?autoplay=1&mute=1&loop=1');
  }

  public onYoutubeVideoHoverStop(e)
  {
    const video: HTMLMediaElement = document.getElementsByClassName(e.target.className)[0] as HTMLMediaElement;
    video.src = e.target.className.replace('watch?v=', 'embed/');
  }

  public renderNestedItems(items, format, field, depth, offset)
  {
    return (
      <div>
        {
          items.map((fields, i) =>
          {
            let canSpotlight = false;
            if (fields['_source'])
            {
              fields = _.extend({}, fields, fields['_source']);
              canSpotlight = true;
            }
            if (fields['fields'] !== undefined)
            {
              const scriptFields = {};
              _.keys(fields['fields']).forEach((f) =>
              {
                scriptFields[f] = fields['fields'][f][0];
              });
              fields = _.extend({}, fields, scriptFields);
            }
            // This happens when the source isn't properly set, such as in the Schema Browser
            if (typeof fields !== 'object')
            {
              return null;
            }
            return (
              <HitComponent
                {...this.props}
                resultsConfig={format && format.config}
                index={i + offset}
                expanded={false}
                allowSpotlights={canSpotlight}
                key={fields['_id'] !== undefined ? fields['_id'] : i}
                style={borderColor(Colors().blockOutline)}
                hitSize={this.props.hitSize === 'small' ? 'smaller' : 'small'}
                hit={_Hit({
                  fields: Map(fields),
                })}
                depth={depth + 1}
                nestedFields={undefined}
                hideFieldNames={true}
                firstVisibleField={this.state.scrollState.get(field)}
                primaryKey={fields['_id']}
                onExpand={undefined}
                isNestedHit={true}
                parentHit={this.props.hit}
                fieldTypes={undefined}
              />);
          },
          )
        }
      </div>
    );
  }

  public getNumberOfFields(fields, format)
  {
    if (typeof fields !== 'object')
    {
      return 0;
    }
    if (fields['_source'])
    {
      fields = _.extend({}, fields, fields['_source']);
    }
    const nestedFields = getResultNestedFields(_Hit({ fields: Map(fields) }), format && format.config);
    // Get sample set of result fields to set max length
    const allFields = getResultFields(
      _Hit({ fields: Map(fields) }),
      format && format.config,
      nestedFields,
      this.props.schema,
      this.props.builder,
    );
    return allFields.length;
  }

  public renderNestedField(field)
  {
    const config = this.props.resultsConfig;
    let format = config && config.enabled && config.formats && config.formats.get(field);
    format = _Format(Util.asJS(format));
    let allValues = Util.asJS(this.props.hit.fields.get(field)) || [];
    if (!Array.isArray(allValues))
    {
      if (typeof allValues === 'object')
      {
        allValues = [allValues];
      }
      else
      {
        return null;
      }
    }
    const expandState = this.state.nestedStates.get(field);
    const size = allValues.length;
    const depth = this.props.depth ? this.props.depth : 0;
    const maxFields = this.getNumberOfFields(allValues[0], format);
    return (
      <div
        className='hit-nested-content'
        key={field}
        style={[
          { left: depth > 0 ? 15 : 0 },
          { width: `calc(100% - ${depth > 0 ? 15 : 0}px` },
          backgroundColor(depth % 2 === 1 ? Colors().fontWhite : Colors().blockBg),
          borderColor(Colors().blockOutline),
        ]}
      >
        {
          this.renderNestedFieldHeader(
            field,
            depth,
            size,
            expandState,
            maxFields,
            format && format.config && format.config.thumbnail)
        }
        <div
          className='hit-nested-content-values'
        // style={{ height: expandState === NestedState.Expanded ? '100%' : 'auto' }}
        >
          <FadeInOut
            open={expandState !== NestedState.Collapsed}
          >
            {this.renderNestedItems(allValues.slice(0, 1), format, field, depth, 0)}
          </FadeInOut>
          <FadeInOut
            open={expandState === NestedState.Expanded}
          >
            {
              this.renderNestedItems(allValues.slice(1), format, field, depth, 1)
            }
          </FadeInOut>
        </div>
      </div>
    );
  }

  public renderField(field, i?, fields?, overrideFormat?)
  {
    if (
      !resultsConfigHasFields(this.props.resultsConfig) &&
      i >= MAX_DEFAULT_FIELDS &&
      this.props.hitSize !== 'small' &&
      this.props.hitSize !== 'smaller'
    )
    {
      return null;
    }
    const { hideFieldNames, index, isNestedHit } = this.props;
    const spotlights = this.props.spotlights.spotlights;
    const isSpotlit = spotlights.get(this.props.primaryKey);
    const color = isSpotlit ? spotlights.get(this.props.primaryKey).color : 'black';
    const value = getResultValue(this.props.hit, field, this.props.resultsConfig,
      false, this.props.expanded, this.props.fieldTypes || this.state.fieldTypes, overrideFormat, this.props.locations, color);
    const format = this.props.resultsConfig && this.props.resultsConfig.formats.get(field);
    const showField = overrideFormat ? overrideFormat.showField : (!format || format.type === 'text' || format.showField);
    let style = {};
    if (hideFieldNames && index !== 0)
    {
      style = { minWidth: $(`#${field}-header`).width() };
    }
    return (
      <div
        className={classNames({
          'result-field': true,
          'results-are-small': this.props.hitSize === 'small' || this.props.hitSize === 'smaller',
          'result-field-hide-field': this.props.hideFieldNames,
        })}
        style={style}
        key={field}
        id={hideFieldNames && index === 0 ? String(field) + '-header' : ''}
      >
        {
          showField &&
          <div
            className={classNames({
              'result-field-name': true,
              'result-field-name-header': hideFieldNames && index === 0,
            })}
            style={hideFieldNames && index !== 0 ?
              { opacity: 0, color: Colors().fontColorLightest } :
              { color: Colors().fontColorLightest }
            } // Keep them there to make sizing work
          >
            {
              field === '_score' ? 'Match quality' : field
            }
          </div>
        }
        {
          // Need to duplicate the above, when we are rendering a header to make it's width count towards the parent
          hideFieldNames && index === 0 &&
          <div
            className='result-field-name'
            style={{ visibility: 'hidden', height: 0, overflow: 'hidden', padding: 0 }}
          >
            {
              field
            }
          </div>
        }
        <div
          className={classNames({
            'result-field-value': true,
            'result-field-value-short': (field + value).length < 0,
            'result-field-value-number': typeof value === 'number',
            'result-field-value-show-overflow': format && format.type === 'map',
            'result-field-value-header': hideFieldNames && index === 0,
            'nested-results-are-small': this.props.hitSize === 'smaller' && isNestedHit,
          })}
        >
          {
            value
          }
        </div>
      </div>
    );
  }

  public spotlight(e, overrideId?, overrideColor?)
  {
    if (!this.props.allowSpotlights)
    {
      return;
    }
    const id = overrideId || this.props.primaryKey;
    const spotlightColor = overrideColor || ColorManager.altColorForKey(id);
    const spotlightData = this.props.hit.toJS();
    spotlightData['name'] = getResultName(this.props.hit, this.props.resultsConfig, this.props.expanded,
      this.props.fieldTypes || this.state.fieldTypes, this.props.schema, this.props.builder, this.props.locations, spotlightColor, true);
    spotlightData['color'] = spotlightColor;
    spotlightData['id'] = id;
    spotlightData['rank'] = this.props.index;
    this.props.spotlightActions({
      actionType: 'spotlightAction',
      id,
      hit: spotlightData,
      parentHit: this.props.parentHit ? this.props.parentHit.toJS()['fields'] : undefined,
    });
    this.props.onSpotlightAdded(id, spotlightData);
  }

  public unspotlight()
  {
    if (!this.props.allowSpotlights)
    {
      return;
    }
    this.props.onSpotlightRemoved(this.props.primaryKey);
    this.props.spotlightActions({
      actionType: 'clearSpotlightAction',
      id: this.props.primaryKey,
    });
  }

  public renderSpotlight()
  {
    const spotlights = this.props.spotlights.spotlights;
    const spotlight = spotlights.get(this.props.primaryKey);
    return tooltip(
      <div
        onClick={spotlight !== undefined ? this.unspotlight : this.spotlight}
        className={classNames({
          'result-spotlight': true,
          'result-spotlight-lit': spotlight !== undefined,
        })}
        style={{
          background: spotlight !== undefined ?
            spotlight.color : 'transparent',
        }}
      >
        <div
          className={classNames({
            'result-spotlight-text': true,
            'result-spotlight-text-small': this.props.index + 1 >= 100,
            'result-spotlight-text-large': this.props.index + 1 < 10,
          })}
        >
          {_.padStart((this.props.index + 1).toString(), 2, '0')}
        </div>
      </div>,
      this.props.allowSpotlights ? spotlight !== undefined ? 'Unspotlight' : 'Spotlight' : '',
    );
  }

  public expand()
  {
    if (this.props.onExpand !== undefined)
    {
      this.props.onExpand(this.props.index);
    }
  }

  public render()
  {
    const {
      isDragging,
      connectDragSource,
      isOver,
      connectDropTarget,
      hit,
      hitSize,
      expanded,
      isNestedHit,
    } = this.props;
    let { resultsConfig } = this.props;
    const classes = classNames({
      'result': true,
      'result-expanded': this.props.expanded,
      'result-dragging': isDragging,
      'result-drag-over': isOver,
    });
    let score: any = null;

    if (resultsConfig && resultsConfig.score && resultsConfig.enabled)
    {
      score = this.renderField(resultsConfig.score);
    }

    const spotlights = this.props.spotlights.spotlights;
    const spotlight = spotlights.get(this.props.primaryKey);
    const color = spotlight ? spotlight.color : 'black';

    const thumbnail = resultsConfig && resultsConfig.thumbnail ?
      getResultThumbnail(
        hit, resultsConfig,
        this.props.expanded,
        this.props.fieldTypes || this.state.fieldTypes,
        this.props.schema,
        this.props.builder,
      ) : null;
    const name = getResultName(hit, resultsConfig, this.props.expanded, this.props.fieldTypes || this.state.fieldTypes,
      this.props.schema, this.props.builder, this.props.locations, color);
    const nestedFields = this.props.nestedFields !== undefined
      ? this.props.nestedFields.toJS()
      : this.state.nestedFields !== undefined ?
        this.state.nestedFields : [];
    let fields = getResultFields(hit, resultsConfig, nestedFields, this.props.schema, this.props.builder);
    if (this.props.hideFieldNames)
    {
      // Only show a set number of fields, starting at firstVisibleField (which is controlled by
      // scroll buttons in the header)
      const start = this.props.firstVisibleField || 0;
      fields = fields.slice(start, start + 2);
    }

    const configHasFields = resultsConfigHasFields(resultsConfig);
    let bottomContent: any;
    if (!configHasFields && fields.length > 4 && !expanded && hitSize !== 'small' && this.props.hitSize !== 'smaller')
    {
      bottomContent = (
        <div className='result-bottom' onClick={this.expand}>
          {fields.length - MAX_DEFAULT_FIELDS} more field{fields.length - 4 === 1 ? '' : 's'}
        </div>
      );
    }

    let expandedContent: any;
    if (this.props.expanded)
    {
      expandedContent = (
        <div className='result-expanded-fields'>
          <div className='result-expanded-fields-title'>
            All Fields
          </div>
          {
            hit.fields.keySeq().map(
              (key) =>
                this.renderExpandedField(hit.fields.get(key), key),
            )
          }
        </div>
      );
    }

    if (!resultsConfig)
    {
      resultsConfig = _ResultsConfig();
    }

    const thumbnailWidth = hitSize === 'small' || hitSize === 'smaller' ? resultsConfig.smallThumbnailWidth :
      resultsConfig.thumbnailWidth;
    const depth = this.props.depth !== undefined ? this.props.depth : 0;
    return ((
      <div
        className={classes}
        style={this.props.style}
      // onMouseEnter={this._fn(this.handleHover, true)}
      // onMouseLeave={this._fn(this.handleHover, false)}
      >
        <div
          className={classNames({
            'result-inner': true,
            'results-are-small': hitSize === 'small' || hitSize === 'smaller',
            'nested-results-are-small': hitSize === 'smaller' && isNestedHit,
          })}
          style={[
            borderColor(Colors().resultLine),
            backgroundColor((depth + 1) % 2 === 1 ? Colors().fontWhite : Colors().blockBg),
          ]}
          onDoubleClick={this.expand}
        >
          {
            thumbnail &&
            [
              <div className={classNames({
                'result-thumbnail-wrapper': true,
                'results-are-small': hitSize === 'small' || hitSize === 'smaller',
              })}
                style={{
                  width: thumbnailWidth,
                  minWidth: thumbnailWidth,
                  backgroundImage: `url(${thumbnail})`,
                }}
                key={1}>
                {
                  (thumbnail.includes('imgur') && !thumbnail.includes('gif'))
                    ?
                    <video id='thumbnailVideo' className={thumbnail} src={thumbnail.concat('.webm')}
                      onMouseOver={this.onVideoHoverStart} onMouseOut={this.onVideoHoverStop} loop
                      style={{
                        width: thumbnailWidth,
                        minWidth: thumbnailWidth,
                      }}> </video>
                    :
                    (thumbnail.includes('gifv'))
                      ?
                      <video id='thumbnailVideo' className={thumbnail} src={thumbnail.replace('gifv', 'webm')}
                        onMouseOver={this.onVideoHoverStart} onMouseOut={this.onVideoHoverStop} loop
                        style={{
                          width: thumbnailWidth,
                          minWidth: thumbnailWidth,
                        }}> </video>
                      :
                      (thumbnail.includes('youtube'))
                        ?
                        <iframe id='thumbnailVideo' className={thumbnail} src={thumbnail.replace('watch?v=', 'embed/')}
                          onMouseOver={this.onYoutubeVideoHoverStart}
                          onMouseOut={this.onYoutubeVideoHoverStop}
                          style={{
                            width: thumbnailWidth,
                            minWidth: thumbnailWidth,
                          }}>
                        </iframe>
                        :
                        (thumbnail.includes('vimeo'))
                          ?
                          <iframe id='thumbnailVideo' className={thumbnail} src={thumbnail.replace('vimeo.com', 'player.vimeo.com/video')}
                            style={{
                              width: thumbnailWidth,
                              minWidth: thumbnailWidth,
                            }}>
                          </iframe>
                          :
                          (thumbnail.includes('mp4') || thumbnail.includes('webm'))
                            ?
                            <video id='thumbnailVideo' className={thumbnail} src={thumbnail}
                              onMouseOver={this.onVideoHoverStart} onMouseOut={this.onVideoHoverStop} loop
                              style={{
                                width: thumbnailWidth,
                                minWidth: thumbnailWidth,
                              }}> </video>
                            :
                            null
                }
              </div>
              ,
              this.state.hovered &&
              <Draggable
                axis='x'
                bounds='parent'
                position={{
                  x: thumbnailWidth - 15,
                  y: 0,
                }}
                onDrag={this.handleThumbnailResize}
                key={2}
              >
                <div
                  className='result-thumbnail-resizer'
                />
              </Draggable>,
            ]
          }
          <div
            className={classNames({
              'result-details-wrapper': true,
              'results-are-small': hitSize === 'small' || hitSize === 'smaller',
            })}
          >
            <div
              className={classNames({
                'result-name': true,
                'results-are-small': hitSize === 'small' || hitSize === 'smaller',
              })}
            >
              <div
                className='result-name-inner'
                style={fontColor(Colors().text.baseLight)}
              >
                {
                  this.renderSpotlight()
                }
                <div className='result-pin-icon'>
                  <PinIcon />
                </div>
                <span className='result-name-label'>
                  {name}
                </span>
                {
                  this.props.expanded &&
                  <div
                    onClick={this.expand}
                    className='result-expanded-close-button'
                  >
                    <CloseIcon className='close close-icon' />
                  </div>
                }
              </div>
            </div>
            <div
              className={classNames({
                'result-fields-wrapper': true,
                'results-are-small': hitSize === 'small' || hitSize === 'smaller',
                'nested-results-are-small': this.props.hitSize === 'smaller' && isNestedHit,
              })}
            >
              {score}
              {
                _.map(fields, this.renderField)
              }
              {
                expandedContent
              }
            </div>
            {
              bottomContent
            }
          </div>
        </div>
        <div>
          {
            (!this.props.hideNested && !this.props.expanded) &&
            _.map(nestedFields, this.renderNestedField)
          }
        </div>
      </div>
    ));
  }

  private handleHover(hovered: boolean)
  {
    this.setState({
      hovered,
    });
  }

  private handleThumbnailResize(e, data: {
    x: number, y: number,
    deltaX: number, deltaY: number,
  })
  {
    const { x, y } = data;

    let config = this.props.resultsConfig;
    const key = this.props.hitSize === 'small' || this.props.hitSize === 'smaller' ? 'smallThumbnailWidth' : 'thumbnailWidth';
    config = config.set(key, Math.max(config[key] + data.deltaX, 15));

    Actions.changeResultsConfig(config);
  }
}

export function getResultValue(hit: Hit, field: string, config: ResultsConfig, isTitle: boolean, expanded: boolean,
  fieldTypes: Map<string, string>, overrideFormat?: any, locations?: { [field: string]: any }, color?: string, bgUrlOnly = false)
{
  let value: any;
  if (hit && field)
  {
    const pieces = field.split('.');
    value = hit.fields.get(pieces[0]);
    if (!Map.isMap(value))
    {
      value = Immutable.fromJS(value);
    }
    if (pieces.length > 1)
    {
      value = value.getIn(pieces.slice(1));
    }
  }
  return ResultFormatValue(field, value, config, isTitle, expanded, fieldTypes, overrideFormat, locations, color, bgUrlOnly);
}

export function resultsConfigHasFields(config: ResultsConfig): boolean
{
  return config && config.enabled && config.fields && config.fields.size > 0;
}

export function getResultFields(hit: Hit, config: ResultsConfig, nested: string[],
  schema?: SchemaState, builder?: BuilderState): string[]
{
  let fields: string[];

  if (config && config.fields && config.enabled)
  {
    fields = config.fields.filter((field) =>
      nested.indexOf(field) === -1,
    ).toArray();
  }
  else
  {
    const builderState = builder;
    if (builderState === undefined)
    {
      return _.keys(hit.fields.toJS());
    }
    // If there is a path
    const server: string = builderState.db.name;
    let serverIndex = server + '/' + getIndex('', builder);
    if (builderState && builderState.query && builderState.query.path !== undefined &&
      builderState.query.path.source !== undefined &&
      builderState.query.path.source.dataSource !== undefined)
    {
      serverIndex = (builderState.query.path.source.dataSource as any).index;
    }

    fields = Util.orderFields(List(_.keys(hit.fields.toJS())), schema, -1, serverIndex).toArray();
    fields = fields.filter((field) =>
      nested.indexOf(field) === -1,
    );
  }
  return fields;
}

// Return a list of fields that have nested configurations, as well as fields
// that are nested objects that may not be configured
export function getResultNestedFields(hit: Hit, config: ResultsConfig): string[]
{
  if (resultsConfigHasFields(config))
  {
    const configuredNested = config.fields.filter((field) =>
      config.formats.get(field) !== undefined &&
      config.formats.get(field).config !== undefined &&
      config.formats.get(field).config.enabled,
    ).toArray();
    const unconfigNested = config.fields.filter((field) =>
    {
      return (List.isList(hit.fields.get(field))) &&
        configuredNested.indexOf(field) === -1;
    }).toArray();
    return unconfigNested.concat(configuredNested);
  }
  return _.keys(hit.fields.toJS()).filter((field) =>
  {
    return List.isList(hit.fields.get(field));
  });
}

export function getResultThumbnail(hit: Hit, config: ResultsConfig, expanded: boolean, fieldTypes: Map<string, string>,
  schema?: SchemaState, builder?: BuilderState, locations?: { [field: string]: any }, color?: string)
{
  let thumbnailField: string;

  if (config && config.thumbnail && config.enabled)
  {
    thumbnailField = config.thumbnail;
  }
  else
  {
    thumbnailField = _.first(getResultFields(hit, config, [], schema, builder));
  }

  return getResultValue(hit, thumbnailField, config, false, expanded, fieldTypes, null, locations, color, true);
}

export function getResultName(hit: Hit, config: ResultsConfig, expanded: boolean, fieldTypes: Map<string, string>,
  schema?: SchemaState, builder?: BuilderState, locations?: { [field: string]: any }, color?: string, valueOnly = false)
{
  let nameField: string;

  if (config && config.name && config.enabled)
  {
    nameField = config.name;
  }
  else
  {
    nameField = _.first(getResultFields(hit, config, [], schema, builder));
  }

  return getResultValue(hit, nameField, config, true, expanded, fieldTypes, null, locations, color, valueOnly);
}

export function ResultFormatValue(field: string, value: any, config: ResultsConfig, isTitle: boolean, expanded: boolean,
  fieldTypes: Map<string, string>, overrideFormat?: any, locations?: { [field: string]: any }, color?: string, bgUrlOnly = false): any
{
  let format = config && config.enabled && config.formats && config.formats.get(field);
  format = _Format(Util.asJS(format));
  const { showRaw } = overrideFormat || format || { showRaw: false };
  let italics = false;
  let tooltipText = '';
  if (value === undefined)
  {
    value = 'undefined';
    italics = true;
  }
  if (typeof value === 'boolean')
  {
    value = value ? 'true' : 'false';
    italics = true;
  }
  if (typeof value === 'string' && !value.length)
  {
    value = '"" (blank)';
    italics = true;
  }
  if (value === null)
  {
    value = 'null';
    italics = true;
  }
  if ((format && format.type !== 'map') || !format)
  {
    if (List.isList(value))
    {
      tooltipText = JSON.stringify(value, null, 2);
      tooltipText = tooltipText
        .replace(/\"/g, '')
        .replace(/\\/g, '')
        .replace(/:/g, ': ')
        .replace(/,/g, ', ')
        .replace(/\[/g, '')
        .replace(/\]/g, '');
      const valueString = '';

      const content = (
        <div>
          {
            value.map((val, i) =>
            {
              if (typeof val === 'object')
              {
                val = Util.asJS(val);
                return (
                  <div key={i}>
                    {
                      _.keys(val).map((key, j) =>
                        <div key={j}>
                          <span
                            style={{ marginRight: 6, opacity: 0.35 }}
                          >
                            <b>{key}: </b>
                          </span>
                          <span>
                            {JSON.stringify(val[key])}
                          </span>
                          <br />
                        </div>,
                      )
                    }
                    <br />
                  </div>
                );
              }
              return <span key={i}>{i !== 0 ? ', ' + val : val} </span>;
            })
          }
        </div>
      );
      if (value.size && typeof value.get(0) !== 'object')
      {
        return tooltip(content, {
          html: <div style={{
            overflowY: 'auto',
            maxHeight: '200px',
            maxWidth: '300px',
            display: 'inline-block',
            textAlign: 'left',
            zIndex: 9999,
            background: 'white',
            borderRadius: 0,
          }}
          >
            {tooltipText}
          </div>,
          arrow: false,
        });
      }
      return content;
    }
  }

  if (format && !isTitle)
  {
    switch (format.type)
    {
      case 'image':
        let url;
        if (typeof value === 'object')
        {
          const path = format.template.match(/\[value(.*)\]/i);
          if (path.length < 2)
          {
            break;
          }
          for (const p of path[1].split('.'))
          {
            if (p === '')
            {
              continue;
            }
            value = value.get(p);
          }
        }
        url = format.template.replace(/\[value.*\]/g, value as string);

        if (bgUrlOnly)
        {
          return url;
        }

        return (
          <div
            className='result-field-value-image-wrapper'
          >
            <div
              className='result-field-value-image'
              style={{
                backgroundImage: `url(${url})`,
                // give the div the background image, to make use of the "cover" CSS positioning,
                // but also include the <img> tag below (with opacity 0) so that right-click options still work
              }}
            >
              {/*<img src={url} />*/}
            </div>
            <div className='result-field-value'>
              {
                showRaw ? value : null
              }
            </div>
          </div>
        );
        // case 'date':
        //   value = Util.formatDate(value, true);
        //   if (!expanded && !bgUrlOnly)
        //   {
        //     return tooltip(
        //       value,
        //       {
        //         title: value,
        //         position: 'left-start',
        //         arrow: false,
        //       });
        //   }
        break;
      // case 'map':
      //   const resultLocation = MapUtil.getCoordinatesFromGeopoint(value);
      //   let targetLocation: [number, number];
      //   if (locations !== undefined && locations[field] !== undefined)
      //   {
      //     targetLocation = MapUtil.getCoordinatesFromGeopoint(locations[field]) as [number, number];
      //   }
      //   const marker = {
      //     coordinates: resultLocation,
      //     name: '',
      //     color,
      //     index: -1
      //   };
      //   return (
      //     <div className='result-field-value-map-wrapper'>
      //       <MapComponent
      //         coordinates={targetLocation}
      //         showDirectDistance={targetLocation !== undefined}
      //         hideSearchBar={true}
      //         hideZoomControl={true}
      //         markers={List([marker])}
      //         geocoder='photon'
      //         canEdit={false}
      //       />
      //     </div>
      //   );

      case 'text':
        break;
    }
  }
  if (fieldTypes !== undefined && fieldTypes.get(field) === 'date')
  {
    value = Util.formatDate(value, true);
    if (!expanded)
    {
      return tooltip(
        value,
        {
          title: value,
          position: 'left-start',
          arrow: false,
        });
    }
    return value;
  }

  if (typeof value === 'object')
  {
    tooltipText = JSON.stringify(value, null, 2);
    tooltipText = tooltipText.replace(/\"/g, '').replace(/\\/g, '').replace(/:/g, ': ').replace(/,/g, ', ');
    let valueString = '';
    value = Util.asJS(value);
    for (const key in value)
    {
      if (value.hasOwnProperty(key))
      {
        valueString += key + ': ' + JSON.stringify(value[key]) + ', ';
      }
    }
    value = valueString.slice(0, -2);
  }

  if (typeof value === 'number')
  {
    value = Math.floor((value as number) * 10000) / 10000;
    value = value.toLocaleString();
  }

  if (!tooltipText)
  {
    tooltipText = value;
  }

  if (tooltipText && !expanded && !bgUrlOnly)
  {
    return tooltip(<div>{value}</div>, {
      html: <div style={{
        overflowY: 'auto',
        maxHeight: '200px',
        maxWidth: '300px',
        display: 'inline-block',
        textAlign: 'left',
        zIndex: 9999,
        background: 'white',
        borderRadius: 0,
      }}
      >
        {tooltipText}
      </div>,
      interactive: true,
      position: 'left-start',
      arrow: false,
    });
  }

  if (italics)
  {
    return <em>{value}</em>;
  }

  return value;
}

export default Util.createTypedContainer(
  HitComponent,
  ['spotlights', 'schema'],
  { spotlightActions: SpotlightActions },
);

// DnD stuff

// Defines a draggable result functionality
// const resultSource =
// {
//   canDrag(props)
//   {
//     return false; // TODO remove once we get result dragging and pinning working
//     // return props.canDrag;
//   },

//   beginDrag(props)
//   {
//     const item = props.result;
//     return item;
//   },

//   endDrag(props, monitor, component)
//   {
//     if(!monitor.didDrop())
//     {
//       return;
//     }

//     const item = monitor.getItem();
//     const dropResult = monitor.getDropResult();
//   }
// }

// // Defines props to inject into the component
// const dragCollect = (connect, monitor) =>
// ({
//   connectDragSource: connect.dragSource(),
//   isDragging: monitor.isDragging(),
//   connectDragPreview: connect.dragPreview()
// });

// const resultTarget =
// {
//   canDrop(props, monitor)
//   {
//     return true;
//   },

//   hover(props, monitor, component)
//   {
//     const canDrop = monitor.canDrop();
//   },

//   drop(props, monitor, component)
//   {
//     const item = monitor.getItem();
//     // TODO
//     // Actions.results.move(item, props.index);
//   }
// }

// const dropCollect = (connect, monitor) =>
// ({
//   connectDropTarget: connect.dropTarget(),
//   isOver: monitor.isOver(),
//   isOverCurrent: monitor.isOver({ shallow: true }),
//   canDrop: monitor.canDrop(),
//   itemType: monitor.getItemType()
// });

// export default DropTarget('RESULT', resultTarget, dropCollect)(DragSource('RESULT', resultSource, dragCollect)(Result));
