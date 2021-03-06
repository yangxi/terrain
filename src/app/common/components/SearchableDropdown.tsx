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

// tslint:disable:strict-boolean-expressions member-access no-var-requires

import * as classNames from 'classnames';
import { List } from 'immutable';
import * as _ from 'lodash';
import * as Radium from 'radium';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import onClickOutside, { InjectedOnClickOutProps } from 'react-onclickoutside';
import Util from 'util/Util';
import BuilderActions from '../../builder/data/BuilderActions';
import { borderColor, Colors, getStyle } from '../../colors/Colors';
import TerrainComponent from './../../common/components/TerrainComponent';
import './Dropdown.less';

const CloseIcon = require('images/icon_close_8x8.svg?name=CloseIcon');

export interface Props
{
  options: List<string>;
  selectedIndex: number;
  keyPath?: KeyPath;
  onChange?: (index: number, event?: any) => void;
  canEdit?: boolean;
  className?: string;
  centerAlign?: boolean;
  directionBias?: number; // bias for determining whether or not dropdown opens up or down
  openDown?: boolean;
  placeholder?: string;
  action?: (keyPath, value) => void | string;
  floatingLabel?: string;
  builderActions?: typeof BuilderActions;
  width?: string;
  open?: boolean; // force it to be open
  onClose?: () => void;
}

@Radium
class SearchableDropdown extends TerrainComponent<Props & InjectedOnClickOutProps>
{
  public state: {
    up: boolean,
    open: boolean;
    focusedIndex: number;
    hoveredIndex: number;
    inputValue: string,
  };

  constructor(props: Props & InjectedOnClickOutProps)
  {
    super(props);

    this.state =
      {
        up: false,
        open: false || this.props.open,
        focusedIndex: -1,
        inputValue: '',
        hoveredIndex: -1,
      };
  }

  public handleInputChange(e)
  {
    this.setState({
      inputValue: e.target.value,
    });
  }

  public clearInput(e)
  {
    this.setState({
      inputValue: '',
    });
    e.preventDefault();
    e.stopPropagation();
  }

  public componentWillMount()
  {
    if (this.props.selectedIndex >= 0)
    {
      this.setState({
        inputValue: this.props.options.get(this.props.selectedIndex),
      });
    }
  }

  public componentWillReceiveProps(nextProps)
  {
    if (nextProps.selectedIndex !== this.props.selectedIndex || !_.isEqual(nextProps.options, this.props.options))
    {
      this.setState({
        inputValue: nextProps.options.get(nextProps.selectedIndex),
        open: false,
      });
    }
    if (nextProps.selectedIndex < 0)
    {
      this.setState({
        inputValue: '',
      });
    }
    if (this.props.open !== nextProps.open)
    {
      this.setState({
        open: nextProps.open,
      });
    }
  }

  public getFilteredOptions(filterValue)
  {
    let filteredOptions = List([]);
    this.props.options.forEach((option, i) =>
    {
      if (option.toLowerCase().indexOf(filterValue.toLowerCase()) !== -1)
      {
        filteredOptions = filteredOptions.push({
          title: option,
          index: i,
        });
      }
    });
    return filteredOptions;
  }

  public mouseOverOption(index)
  {
    this.setState({
      hoveredIndex: index,
    });
  }

  public mouseLeaveOption(value)
  {
    this.setState({
      hoveredIndex: -1,
    });
  }

  public clickHandler(index)
  {
    const value = index === -1 ? '' : this.props.options.get(index);
    if (this.props.onClose)
    {
      this.props.onClose();
    }
    this.setState({
      inputValue: value,
      open: false,
      focusedValue: -1,
    });
    if (this.props.keyPath !== undefined)
    {
      if (this.props.action)
      {
        const { action } = this.props;
        if (typeof action === 'string')
        {
          (this.props.builderActions[action] as any)(this.props.keyPath, value);
        }
        else
        {
          action(this.props.keyPath, value);
        }
      }
      else
      {
        this.props.builderActions.change(this.props.keyPath, value);
      }
    }
    if (this.props.onChange !== undefined)
    {
      this.props.onChange(index);
    }
  }

  public renderOption(option, i)
  {
    const index = option.index;
    option = option.title;
    const focused = i === this.state.focusedIndex;
    const selected = i === this.props.selectedIndex;
    const style = {
      ':hover': {
        backgroundColor: 'transparent',
        color: Colors().active,
        stroke: Colors().active,
      },
    };

    if (focused)
    {
      _.extend(style, {
        borderColor: Colors().inactiveHover,
        // color: Colors().text1,
      });
    }

    if (selected)
    {
      _.extend(style, {
        'backgroundColor': Colors().active,
        'color': Colors().activeText,
        ':hover': {
          backgroundColor: Colors().active,
          color: Colors().activeText,
          stroke: Colors().activeText,
        },
        'stroke': Colors().activeText,
      });
    }
    return (<div
      className={classNames({
        'dropdown-option': true,
        'dropdown-option-selected': selected,
        'dropdown-option-focused': focused,
      })}
      key={index}
      style={style}
      onClick={this._fn(this.clickHandler, index)}
      ref={'opt' + String(index)}
      onMouseEnter={this._fn(this.mouseOverOption, i)}
      onMouseLeave={this.mouseLeaveOption}
    >
      <div
        className='dropdown-option-inner'
      >
        {
          this.props.options.get(index)
        }
      </div>
    </div>
    );
  }

  public handleClickOutside()
  {
    if (this.props.onClose)
    {
      this.props.onClose();
    }
    this.setState({
      open: false,
      focusedIndex: -1,
    });
  }

  public open()
  {
    this.toggleOpen(true);
  }

  public toggleOpen(value?: boolean)
  {
    if (!this.props.canEdit)
    {
      return;
    }
    if (!this.state.open || value)
    {
      const cr = this.refs['value']['getBoundingClientRect']();
      const windowBottom = window.innerHeight;

      let up;
      if (this.props.openDown !== undefined)
      {
        up = !this.props.openDown;
      }
      else
      {
        up = cr.bottom > windowBottom / 2 + (this.props.directionBias as number || 0);
      }
      if (!value)
      {
        this.refs['input']['focus']();
      }
      this.setState({
        open: true,
        up,
      });
    }
    else
    {
      if (this.props.onClose)
      {
        this.props.onClose();
      }
      this.setState({
        open: false,
        focusedIndex: -1,
      });
    }
  }

  public selectIndex(index)
  {
    const dropdown = ReactDOM.findDOMNode(this.refs['dropdown']) as Element;
    const opt = ReactDOM.findDOMNode(this.refs['opt' + String(index)]) as Element;
    if (dropdown && opt)
    {
      const acMin = dropdown.scrollTop;
      const acMax = dropdown.scrollTop + dropdown.clientHeight;
      const oMin: number = opt['offsetTop'];
      const oMax = oMin + opt.clientHeight;

      if (oMin < acMin)
      {
        dropdown.scrollTop = oMin;
      }
      if (oMax > acMax)
      {
        dropdown.scrollTop += (oMax - acMax);
      }
    }
    this.setState({
      focusedIndex: index,
    });
  }

  public handleKeydown(event)
  {
    const filteredOptions = this.getFilteredOptions(this.state.inputValue);
    if (!filteredOptions || !filteredOptions.size)
    {
      // still be able to hit enter when there are no options
      if (event.keyCode === 1)
      {
        this.clickHandler(-1);
        this.refs['input']['blur']();
      }
      return;
    }
    let newIndex = this.state.focusedIndex + 1 >= filteredOptions.size ?
      0 : this.state.focusedIndex + 1;
    switch (event.keyCode)
    {
      case 38:
        // up
        if (!this.state.up)
        {
          newIndex = this.state.focusedIndex - 1 === -1 ?
            filteredOptions.size - 1 : this.state.focusedIndex - 1;
        }
        else
        {
          newIndex = this.state.focusedIndex === -1 || this.state.focusedIndex - 1 === -1
            ? filteredOptions.size - 1 :
            this.state.focusedIndex - 1;
        }
        if (newIndex > filteredOptions.size)
        {
          newIndex = 0;
        }
        this.selectIndex(newIndex);
        break;
      case 40:
        // down
        if (newIndex > filteredOptions.size)
        {
          newIndex = 0;
        }
        this.selectIndex(newIndex);
        break;
      case 13:
      case 9:
        // enter or tab
        let value;
        if (this.state.focusedIndex !== -1)
        {
          value = filteredOptions.get(this.state.focusedIndex);
        }
        else if (this.state.hoveredIndex !== -1)
        {
          value = filteredOptions.get(this.state.hoveredIndex);
        }
        if (value === undefined)
        {
          value = filteredOptions.get(0);
        }
        this.clickHandler(value.index);
        this.refs['input']['blur']();
        if (this.props.onClose)
        {
          this.props.onClose();
        }
        this.setState({
          open: false,
          focusedIndex: -1,
        });
        break;
      case 27:
        // esc
        this.clickHandler(this.state.focusedIndex);
        this.refs['input']['blur']();
        break;
      default:
    }
  }

  public render()
  {
    // Element with options, rendered at the top or bottom of the dropdown
    let optionsEl: El = null;
    const filteredOptions = this.getFilteredOptions(this.state.inputValue);
    if (this.state.open)
    {
      optionsEl =
        <div
          className='dropdown-options-wrapper'
          ref='dropdown'
          style={borderColor(Colors().blockOutline)}
        >
          {
            (filteredOptions && filteredOptions.size > 0) ?
              filteredOptions.map((option, i) => this.renderOption(option, i))
              :
              'No options available'
          }
        </div>;
    }

    const { selectedIndex, options } = this.props;

    const closeStyle = _.extend({},
      getStyle('fill', Colors().iconColor),
      getStyle('stroke', Colors().iconColor));

    return (
      <div
        className={classNames({
          'dropdown-wrapper': true,
          'altBg': true,
          'dropdown-up': this.state.up,
          'dropdown-open': this.state.open,
          'dropdown-disabled': !this.props.canEdit,
          'dropdown-center': this.props.centerAlign,
          [this.props.className]: !!this.props.className,
        })}
        key='dropdown-body'
        style={[{ width: this.props.width }, borderColor(Colors().blockOutline)]}
      >
        {
          this.state.up && this.state.open
          && optionsEl
        }
        <div
          className='dropdown-value'
          ref='value'
          key='dropdown-value'
          onClick={this._fn(this.toggleOpen, false)}
        >
          {
            // map through all of the options so that the dropdown takes the width of the longest one
            //  CSS hides all but the selected option
            options && options.map((option, index) =>
              <div
                key={index}
                className={classNames({
                  'dropdown-option-inner': true,
                  'searchable-dropdown-option-hidden': index !== selectedIndex,
                })}
              >
                {
                  this.props.options.get(index)
                }
              </div>,
            )
          }
          <div className='searchable-dropdown-input-wrapper'>
            <input
              value={this.state.inputValue}
              onChange={this.handleInputChange}
              placeholder={this.props.placeholder !== undefined ? this.props.placeholder : ''}
              onFocus={this.open}
              onKeyDown={this.handleKeydown}
              ref='input'
              disabled={!this.props.canEdit}
              onClick={(e) => { e.stopPropagation(); }}
            />
            {
              this.state.inputValue &&
              <div
                onClick={this.clearInput}
                className='searchable-dropdown-input-clear'
              >
                <CloseIcon style={closeStyle} />
              </div>
            }
          </div>
        </div>
        {
          !this.state.up && this.state.open
          && optionsEl
        }
      </div>
    );
  }
}

export default
  Util.createTypedContainer(
    onClickOutside(SearchableDropdown),
    [],
    { builderActions: BuilderActions },
  );
