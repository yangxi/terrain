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

// tslint:disable:no-var-requires strict-boolean-expressions

import * as classNames from 'classnames';
import * as _ from 'lodash';
import * as Radium from 'radium';
import * as React from 'react';
import onClickOutside, { InjectedOnClickOutProps } from 'react-onclickoutside';
import Util from '../../util/Util';
import TerrainComponent from './../../common/components/TerrainComponent';
import './Menu.less';
const MoreIcon = require('./../../../images/icon_more_12x3.svg?name=MoreIcon');
import { tooltip } from 'common/components/tooltip/Tooltips';
import { borderColor, Colors, fontColor } from '../../colors/Colors';
import { ColorsActions } from '../../colors/data/ColorsRedux';

const optionHeight = 30; // coordinate with Menu.less

export interface MenuOption
{
  text: string;
  onClick: (index: number, id: string) => void;
  disabled?: boolean;
  selected?: boolean;
  icon?: any;
  iconColor?: string;
  tooltip?: string;
}

export interface Props
{
  options: List<MenuOption>;
  colorsActions: typeof ColorsActions;
  small?: boolean;
  style?: any;
  id?: ID;
  vertical?: boolean;
  openRight?: boolean; // menu will open to the right
  registerButton?: (ref) => void;
  onChangeState?: (open: boolean) => void;
  overrideMultiplier?: number;
  title?: string;
  expanded?: boolean; // Force the menu to be expanded
}

@Radium
class Menu extends TerrainComponent<Props & InjectedOnClickOutProps>
{
  public state: {
    open: boolean;
  } = {
      open: false,
    };

  public renderOption(option, index)
  {
    if (option.spacer)
    {
      return <div className='menu-option menu-option-spacer' key={index} />;
    }

    let onClick: any = _.noop;

    if (!option.disabled || !option.selected)
    {
      // TODO
      onClick = (event) =>
      {
        event.preventDefault();
        event.stopPropagation();
        option.onClick(index, this.props.id);
        this.setState({
          open: false,
        });
      };
    }

    return (
      <div
        className={classNames({
          'menu-option': true,
          'menu-option-disabled': option.disabled,
          'menu-option-selected': option.selected,
        })}
        key={index}
        onClick={onClick}
      >
        <div
          className='menu-option-icon'
          style={{
            fill: option.iconColor || 'black',
            stroke: option.iconColor || 'black',
          }}>
          {
            option.icon
          }
        </div>
        <div
          className={option.icon ? 'menu-text-padding' : 'menu-text-padding-no-icon'}
        >
          {
            option.text
          }
        </div>
      </div>
    );
  }

  public handleClickOutside()
  {
    if (this.props.onChangeState)
    {
      this.props.onChangeState(false);
    }
    this.setState({
      open: false,
    });
  }

  public registerMenuButton(button)
  {
    if (this.props.registerButton !== undefined)
    {
      this.props.registerButton(button);
    }
  }

  public componentWillMount()
  {
    this.props.colorsActions({
      actionType: 'setStyle',
      selector: '.menu-wrapper .menu-icon .st0',
      style: { fill: Colors().text3 },
    });
    this.setState({
      open: this.props.expanded,
    });
  }

  public toggleOpen(e)
  {
    e.preventDefault();
    e.stopPropagation();

    if (this.props.onChangeState)
    {
      this.props.onChangeState(!this.state.open);
    }
    this.setState({
      open: !this.state.open,
    });
  }

  public render()
  {
    const { options, overrideMultiplier } = this.props;
    if (!options || !options.size)
    {
      return null;
    }

    let multiplier = 10;
    if (options.get(0).icon)
    {
      multiplier = 14;
    }
    multiplier = overrideMultiplier === undefined ? multiplier : overrideMultiplier;

    const width = multiplier * options.reduce((max, option) =>
      option.text && (option.text.length > max) ? option.text.length : max, 1);

    const style = {
      width,
      height: options.size * optionHeight,
    };

    return (
      <div
        className={classNames({
          'menu-wrapper': true,
          'menu-wrapper-small': this.props.small,
          'menu-open': this.state.open,
          'menu-vertical': this.props.vertical,
          'menu-wrapper-right': this.props.openRight,
        })}
        style={[
          borderColor(this.state.open ? Colors().active : Colors().iconColor),
          this.props.style ? this.props.style : null,
        ]}
      >
        {this.props.title !== undefined ?
          <div
            className='menu-icon-title'
            onClick={this.toggleOpen}
            style={fontColor(this.state.open ? Colors().active : Colors().iconColor, Colors().active)}
          >
            {this.props.title}
          </div>
          :
          <div
            className='menu-icon-wrapper'
            onClick={this.toggleOpen}
            style={fontColor(this.state.open ? Colors().active : Colors().iconColor, Colors().active)}
            ref={this.registerMenuButton}
          >
            <MoreIcon className='menu-icon' />
          </div>}
        {
          this.state.open &&
          <div
            className='menu-options-wrapper'
            style={style}
            onClick={this.toggleOpen}
          >
            {
              options.map((option, index) =>
                <div key={index}>
                  {
                    option.tooltip ?
                      tooltip(this.renderOption(option, index), {
                        title: option.tooltip,
                        position: 'right',
                      })
                      :
                      this.renderOption(option, index)
                  }
                </div>,
              )
            }
          </div>
        }
      </div>
    );
  }
}

const MenuContainer = Util.createContainer(
  onClickOutside(Menu),
  [],
  {
    colorsActions: ColorsActions,
  },
);

export { MenuContainer as Menu };

export default MenuContainer;
