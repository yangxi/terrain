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

require('./ResultsConfig.less');
import * as Immutable from 'immutable';
let {List,Map} = Immutable;
import * as _ from 'underscore';
import * as React from 'react';
import * as classNames from 'classnames';
import Util from '../../../util/Util.tsx';
import Ajax from '../../../util/Ajax.tsx';
import Result from "../results/Result.tsx";
import InfoArea from '../../../common/components/InfoArea.tsx';
import PureClasss from './../../../common/components/PureClasss.tsx';
import Switch from './../../../common/components/Switch.tsx';
import { DragSource, DropTarget } from 'react-dnd';

var CloseIcon = require("./../../../../images/icon_close_8x8.svg?name=CloseIcon");
var GearIcon = require("./../../../../images/icon_gear.svg?name=GearIcon");
var TextIcon = require("./../../../../images/icon_text_12x18.svg?name=TextIcon");
var ImageIcon = require("./../../../../images/icon_profile_16x16.svg?name=ImageIcon");

class Format
{
  type: string = "";
  template: string = "";
  showRaw: boolean = false;
  showField: boolean = false;
  
  set: (f: string, v: any) => Format;
  setIn: (f: string[], v: any) => Format;
}
const Format_Record = Immutable.Record(new Format());
const _Format = (config?:any) => {
  return new Format_Record(config || {}) as any as Format;
} 

export class IResultsConfig
{
  name: string = "";
  score: string = "";
  fields: List<string> = List([]);
  enabled: boolean = false;
  formats: Map<string, Format> = Map({});
  
  set: (f: string, v: any) => IResultsConfig;
  setIn: (f: string[], v: any) => IResultsConfig;
}
const IResultsConfig_Record = Immutable.Record(new IResultsConfig());
const _IResultsConfig = (config?:any) => {
  return new IResultsConfig_Record(config || {}) as any as IResultsConfig;
}
export const DefaultIResultsConfig = _IResultsConfig();

interface Props
{
  results: any[];
  resultsWithAllFields: any[];
  config: IResultsConfig;
  onConfigChange: (config:IResultsConfig) => void;
  onClose: () => void;
}

export class ResultsConfig extends PureClasss<Props>
{
  state: {
    fields: List<string>;
    lastHover: {index: number, field: string},
    config: IResultsConfig;
  } = {
    fields: null,
    lastHover: {index: null, field: null},
    config: null,
  };
  
  constructor(props:Props)
  {
    super(props);
    this.state.config = props.config;
    this.state.fields = this.calcFields(this.props.results, this.props.resultsWithAllFields);
  }
  
  componentWillReceiveProps(nextProps:Props)
  {
    if(nextProps.config !== this.props.config)
    {
      this.setState({
        config: nextProps.config,
      });
    }
    
    if(this.props.results !== nextProps.results || this.props.resultsWithAllFields !== nextProps.resultsWithAllFields)
    {
      this.setState({
        fields: this.calcFields(nextProps.results, nextProps.resultsWithAllFields),
      });
    }
  }
  
  calcFields(results:any[], resultsWithAllFields:any[]):List<string>
  {
    var fieldMap = {};
    let resultsMapFn = (result:any) => _.map(result, (v,field) => fieldMap[field] = 1);
    console.log(results, resultsWithAllFields);
    results && results.map(resultsMapFn);
    resultsWithAllFields && resultsWithAllFields.map(resultsMapFn);
    
    let fields = _.keys(resultsMapFn);
    console.log(fields);
    return List(fields);
  }
  
  handleDrop(type: string, field: string, index?: number)
  {
    if(this.state.lastHover.field === field && index === undefined && type === 'field')
    {
      this.setState({
        lastHover: {index: null, field: null},
      });
      return;
    }
    
    var {config} = this.state;
    
    // remove if already set
    if(config.name === field)
    {
      config = config.set('name', null);
    }
    if(config.score === field)
    {
      config = config.set('score', null);
    }
    if(config.fields.indexOf(field) !== -1)
    {
      config = config.set('fields',
        config.fields.splice(config.fields.indexOf(field), 1)
      );
    }

    // set if needed    
    if(type === 'field')
    {
      if(index !== undefined)
      {
        config = config.set('fields', config.fields.splice(index, 0, field));
      }
      else
      {
        config = config.set('fields', config.fields.push(field));
      }
    }
    else if(type != null)
    {
      config = config.set(type, field);
    }
    
    this.changeConfig(config);
    
    if(index === undefined)
    {
      this.setState({
        lastHover: {index: null, field: null},
      });
    }
  }
  
  changeConfig(config:IResultsConfig)
  {
    this.setState({
      config,
    });
  }
  
  handleEnabledToggle()
  {
    this.changeConfig(this.state.config.set('enabled', !this.state.config.enabled));
  }
  
  fieldType(field)
  {
    let {config} = this.state;
    if(!config) return null;
    if(config.name === field)
    {
      return 'name';
    }
    if(config.score === field)
    {
      return 'score';
    }
    if(config.fields.indexOf(field) !== -1)
    {
      return 'field';
    }
    return null;
  }
  
  handleFieldHover(index:number, field:string)
  {
    if(this.state.lastHover.index !== index || this.state.lastHover.field !== field)
    {
      this.setState({
        lastHover: {index, field},
      });
      this.handleDrop('field', field, index);
    }
  }
  
  handleRemove(field:string)
  {
    this.handleDrop(null, field);
  }
  
  handleFormatChange(field:string, format:Format)
  {
    this.changeConfig(
      this.state.config.setIn(['formats', field], format)
    );
  }
  
  handleClose()
  {
    this.props.onConfigChange(this.state.config);
    this.props.onClose();
  }
  
	render()
  {
    let {config} = this.state;
    let {enabled, formats} = config;
    
    return (
      <div className='results-config-wrapper'>
        <div className={classNames({
            'results-config': true,
            'results-config-disabled': !enabled,
          })}>
          <div className='results-config-bar'>
            <div className='results-config-title'>
              Configure Results View
            </div>
            <div className='results-config-switch'>
              <Switch
                first='Enabled'
                second='Disabled'
                onChange={this.handleEnabledToggle}
                selected={enabled ? 1 : 2}
              />
            </div>
            <div className='results-config-button' onClick={this.handleClose}>
              Done
            </div>
          </div>
          <div className='results-config-config-wrapper'>
            <div className='results-config-instructions'>
              Drag fields to/from the sample result below to customize
              how this algorithm's results look in the Builder.
            </div>
            <div className='results-config-config'>
              <CRTarget
                className='results-config-name'
                type='name'
                onDrop={this.handleDrop}
              >
                <div className='results-config-area-title'>
                  Name
                </div>
                { 
                  config && config.name ? 
                    <IResultsConfigResult
                      field={config.name}
                      is='score'
                      onRemove={this.handleRemove}
                      format={formats.get(config.name)}
                      onFormatChange={this.handleFormatChange}
                    />
                  : 
                    <div className='results-config-placeholder'>
                      Drag name field <em>(optional)</em>
                    </div>
                }
              </CRTarget>
              <CRTarget
                className='results-config-score'
                type='score'
                onDrop={this.handleDrop}
              >
                <div className='results-config-area-title'>
                  Score
                </div>
                {
                  config && config.score ?
                    <IResultsConfigResult
                      field={config.score}
                      is='score'
                      onRemove={this.handleRemove}
                      format={formats.get(config.score)}
                      onFormatChange={this.handleFormatChange}
                    />
                  : 
                    <div className='results-config-placeholder'>
                      Drag score field <em>(optional)</em>
                    </div>
                }
              </CRTarget>
              <CRTarget
                className='results-config-fields'
                type='field'
                onDrop={this.handleDrop}
              >
                <div className='results-config-area-title'>
                  Fields
                </div>
                {
                  config && config.fields.map((field, index) =>
                      <div className='results-config-field-wrapper' key={field}>
                        <IResultsConfigResult
                          field={field}
                          is='field'
                          index={index}
                          onHover={this.handleFieldHover}
                          draggingField={this.state.lastHover.field}
                          onRemove={this.handleRemove}
                          format={formats.get(field)}
                          onFormatChange={this.handleFormatChange}
                        />
                      </div>
                    )
                }
                <div className='results-config-placeholder'>
                  Drag more fields here
                </div>
              </CRTarget>
            </div>
          </div>
          <CRTarget
            className='results-config-available-fields'
            type={null}
            onDrop={this.handleDrop}
          >
            { this.state.fields.map(field =>
                <IResultsConfigResult
                  key={field}
                  field={field}
                  is={this.fieldType(field)}
                  isAvailableField={true}
                  onRemove={this.handleRemove}
                  format={formats.get(field)}
                  onFormatChange={this.handleFormatChange}
                />
            ) }
          </CRTarget>
          <div className='results-config-disabled-veil'>
            <div className='results-config-disabled-veil-inner'>
              <b>Custom results view is off.</b>
              Results will display the information returned from the query.
            </div>
          </div>
        </div>
      </div>
    );
	}
}

interface IResultsConfigResultProps
{
  field: string;
  is?: string; // 'title', 'score', 'field', or null
  onHover?: (index:number, field:string) => void;
  index?: number;
  connectDragSource?: (a:any) => any; 
  connectDropTarget?: (a:any) => any; 
  isDragging?: boolean;
  draggingField?: string;
  isAvailableField?: boolean;
  onRemove: (field: any) => void;
  format: Format;
  onFormatChange: (field: string, format:Format) => void;
}
class IResultsConfigResultC extends PureClasss<IResultsConfigResultProps>
{
  state: {
    showFormat: boolean;
  } = {
    showFormat: false,
  }
  
  handleRemove()
  {
    this.props.onRemove(this.props.field);
  }
  
  toggleShowFormat()
  {
    this.setState({
      showFormat: !this.state.showFormat,
    })
  }
  
  changeToText()
  {
    this.changeFormat('type', 'text');
  }
  
  changeToImage()
  {
    this.changeFormat('type', 'image');
  }
  
  toggleRaw(event)
  {
    this.changeFormat('showRaw', event.target.checked);
  }
  
  toggleField(event)
  {
    this.changeFormat('showField', event.target.checked);
  }
  
  handleTemplateChange(event)
  {
    this.changeFormat('template', event.target.value);
  }
  
  changeFormat(key:string, val:any)
  {
    var format = this.props.format || _Format({
      type: 'text',
      template: '',
      showRaw: false,
      showField: true,
    });
    
    this.props.onFormatChange(this.props.field,
      this.props.format.set(key, val)
    );
  }
  
  render()
  {
    let {format} = this.props;
    let image = format && format.type === 'image';
    
    return this.props.connectDropTarget(this.props.connectDragSource(
      <div className={classNames({
        'results-config-field': true,
        'results-config-field-dragging': this.props.isDragging ||
          (this.props.draggingField && this.props.draggingField === this.props.field),
        'results-config-field-name': this.props.is === 'name',
        'results-config-field-score': this.props.is === 'score',
        'results-config-field-field': this.props.is === 'field',
        'results-config-field-used': this.props.is !== null && this.props.isAvailableField,
      })}>
        <div className='results-config-field-body'>
          <span className='results-config-handle'>⋮⋮</span>
          {
            this.props.field
          }
          {
            this.props.is !== null ? 
              <CloseIcon
                className='close'
                onClick={this.handleRemove}
              />
            : null
          }
          <GearIcon
            className='results-config-field-gear'
            onClick={this.toggleShowFormat}
          />
        </div>
        
        <div className={classNames({
          'results-config-field-format': true,
          'results-config-field-format-showing': this.state.showFormat,
          'results-config-field-format-text': !image,
          'results-config-field-format-image': image,
        })}>
          <div className='results-config-format-header'>
            Display the value of { this.props.field } as:
          </div>
          <div className='results-config-format-btns'>
            <div className='results-config-text-btn' onClick={this.changeToText}>
              <TextIcon /> Text
            </div>
            <div className='results-config-image-btn' onClick={this.changeToImage}>
              <ImageIcon /> Image
            </div>
          </div>
          
          <div className='results-config-image'>
            <div>
              <b>Image URL Template</b>
            </div>
            <div>
              <input
                type='text'
                value={format ? format.template : ''}
                onChange={this.handleTemplateChange}
                placeholder={'http://web.com/img/[value].png'}
              />
            </div>
            <div>
              <em>"[value]" inserts the value of {this.props.field}</em>
            </div>
            <div className='results-config-field-value'>
              <input
                type='checkbox'
                id={'check-f-' + this.props.field}
                checked={format && format.showField}
                onChange={this.toggleField}
              />
              <label htmlFor={'check-f-' + this.props.field}>
                Show field name label
              </label>
            </div>
            <div className='results-config-raw-value'>
              <input
                type='checkbox'
                id={'check-' + this.props.field}
                checked={format && format.showRaw}
                onChange={this.toggleRaw}
              />
              <label htmlFor={'check-' + this.props.field}>
                Show raw value, as well
              </label>
            </div>
          </div>
        </div>
      </div>
    ));
  }
}
// Defines a draggable result functionality
const resultSource = 
{
  beginDrag(props)
  {
    return props;
  },
  
  endDrag(props, monitor, component)
  {
    if(!monitor.didDrop())
    {
      return;
    }
    
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();
  }
}

// Defines props to inject into the component
const dragCollect = (connect, monitor) =>
({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
  connectDragPreview: connect.dragPreview()
});

const resultTarget = 
{
  canDrop(props, monitor)
  {
    return false;
  },
  
  hover(props, monitor, component)
  {
    if(!props.isAvailableField && props.onHover)
    {
      props.onHover(props.index, monitor.getItem().field);
    }
  },
  
  drop(props, monitor, component)
  {
  }
}

const resultDropCollect = (connect, monitor) =>
({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
});


let IResultsConfigResult = DropTarget('RESULTCONFIG', resultTarget, resultDropCollect)(DragSource('RESULTCONFIG', resultSource, dragCollect)(IResultsConfigResultC));


interface CRTargetProps
{
  type: string;
  onDrop: (type:string, field:string) => void;
  className: string;
  connectDropTarget?: (a:any) => any;
  children?: any;
  isOver?: boolean;
}
class CRTargetC extends PureClasss<CRTargetProps>
{
  render()
  {
    return this.props.connectDropTarget(
      <div className={this.props.className + (this.props.isOver ? ' results-config-over' : '')}>
        { this.props.children } 
      </div>
    );
  }
}

const crTarget = 
{
  canDrop(props, monitor)
  {
    return true;
  },
  
  hover(props, monitor, component)
  {
    const canDrop = monitor.canDrop();
  },
  
  drop(props, monitor, component)
  {
    const item = monitor.getItem();
    props.onDrop(props.type, item.field);
  }
}

const crDropCollect = (connect, monitor) =>
({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
});

let CRTarget = DropTarget('RESULTCONFIG', crTarget, crDropCollect)(CRTargetC);

export default ResultsConfig;
