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

// tslint:disable:no-var-requires restrict-plus-operands interface-name

import * as classNames from 'classnames';
import AccountDropdown from 'common/components/AccountDropdown';
import { tooltip } from 'common/components/tooltip/Tooltips';
import * as Radium from 'radium';
import * as React from 'react';
import { Link } from 'react-router';
import { backgroundColor, Colors, fontColor, getStyle } from '../../colors/Colors';
import { ColorsActions } from '../../colors/data/ColorsRedux';
import TerrainComponent from '../../common/components/TerrainComponent';
import Util from '../../util/Util';
import './Sidebar.less';

const ExpandIcon = require('./../../../images/icon_expand_12x12.svg?name=ExpandIcon');
const linkHeight = 36; // Coordinate with Sidebar.less
const TerrainIcon = require('images/logo_terrainLong_blue@2x.png');
const TerrainSmallIcon = require('images/logo_terrain_mountain.png');
const linkOffsetExpanded = 207;
const linkOffsetCollapsed = 133;
export interface ILink
{
  icon: any;
  text: string;
  route: string;
  enabled?: boolean;
}

export interface Props
{
  links: ILink[];
  colorsActions: typeof ColorsActions;
  selectedIndex: number;
  expandable?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
}

@Radium
/*
        {
          this.state.loggedInAndLoaded &&
          <div
            className='app-top-bar'
            style={backgroundColor(Colors().bg2)}
          >
            <img
              src={TerrainIcon}
              className='app-top-bar-icon'
            />
            <AccountDropdown />
          </div>
        }
*/
export class Sidebar extends TerrainComponent<Props>
{
  public state: {
    linkOffset: number,
  } =
    {
      linkOffset: 0,
    };

  public componentWillMount()
  {
    this.props.colorsActions({
      actionType: 'setStyle',
      selector: '.sidebar-expand-icon',
      style: { fill: Colors().text2 },
    });
    this.props.colorsActions({
      actionType: 'setStyle',
      selector: '.sidebar-expand:hover .sidebar-expand-icon',
      style: { fill: Colors().text1 },
    });
    this.props.colorsActions({
      actionType: 'setStyle',
      selector: '.sidebar-link svg',
      style: { fill: Colors().iconColor, stroke: Colors().iconColor},
    });
    this.props.colorsActions({
      actionType: 'setStyle',
      selector: '.sidebar-link .sidebar-link-inner-selected svg',
      style: { fill: Colors().active, stroke: Colors().active },
    });
    this.setState({
      linkOffset: this.props.expanded ? linkOffsetExpanded : linkOffsetCollapsed,
    });
  }

  public componentWillReceiveProps(nextProps)
  {
    if (nextProps.expanded !== this.props.expanded)
    {
      this.setState({
        linkOffset: nextProps.expanded ? linkOffsetExpanded : linkOffsetCollapsed,
      });
    }
  }

  public handleLinkDisabled(link)
  {
    return (e) =>
    {
      e.preventDefault();
      alert(`You have not set up ${link.text}`);
    };
  }

  public render()
  {
    return (
      <div
        className={classNames({
          'sidebar-container': true,
          'sidebar-container-expanded': this.props.expanded,
        })}
        style={backgroundColor(Colors().sidebarBg)}
      >
        {
          this.props.expanded ?
            <img
              src={TerrainIcon}
              className='sidebar-logo'
            />
            :
            <img src={TerrainSmallIcon}
              className='sidebar-logo-small'
            />
        }
        <AccountDropdown small={!this.props.expanded} />
       {
        // <div
        //        className={classNames({
        //          'sidebar-selected-square': true,
        //          'sidebar-selected-square-hidden': this.props.selectedIndex === -1,
        //        })}
        //        style={{
        //          top: (this.props.selectedIndex * linkHeight + this.state.linkOffset) + 'px',
        //          backgroundColor: Colors().active,
        //        }}
        //      />
           }
        <div className='sidebar-links'>
        {
          this.props.links.map((link, index) =>
            <Link
              to={link.route}
              key={index}
              onClick={link.enabled === false ? this.handleLinkDisabled(link) : null}
            >
              <div
                className={Util.objToClassname({
                  'sidebar-link': true,
                  'xr': index === this.props.selectedIndex,
                })}
                key={'sidebar-link-' + index}
              >

                {tooltip(<div
                  className={classNames({
                    'sidebar-link-inner': true,
                    'sidebar-link-inner-selected': index === this.props.selectedIndex,
                  })
                }
                  style={getStyle('fill', index === this.props.selectedIndex ? Colors().active : Colors().text1)}
                >
                  {
                    link.icon
                  }
                  <div
                    className={classNames({
                      'sidebar-link-text': true,
                      'sidebar-link-text-hidden': !this.props.expanded,
                    })}
                    style={fontColor(index === this.props.selectedIndex ? Colors().active : Colors().text1)}
                  >
                    {
                      link.text
                    }
                  </div>
                </div>,
                  {
                    title: (!this.props.expanded ? link.text : ''),
                    position: 'right',
                  })}
              </div>
            </Link>,
          )
        }
        </div>
        {
          this.props.expandable ?
            (
              <div
                className='sidebar-expand' onClick={this.props.onExpand}
                // style={backgroundColor(Colors().bg1, Colors().inactiveHover)}
              >
                <div className='dead-center'>
                  <ExpandIcon
                    className='sidebar-expand-icon'
                    style={{
                      'fill': Colors().text2,
                      ':active': {
                        fill: Colors().active,
                      },
                    }}
                  />
                </div>
              </div>
            )
            : null
        }
      </div>
    );
  }
}

export default Util.createContainer(
  Sidebar,
  [],
  {
    colorsActions: ColorsActions,
  },
);
