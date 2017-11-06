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

/**
 * Tooltips use react-tippy: https://github.com/tvkhoa/react-tippy
 * For themes to work, a StyleTag needs to be embedded somewhere in the app
 * using classes generated by generateThemeStyles()
 */

import * as _ from 'lodash';
import * as React from 'react';
import { Tooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css';

import TerrainComponent from 'common/components/TerrainComponent';
import { backgroundColor, borderColor, Colors, fontColor, getStyle } from './../../../colors/Colors';

import './Tooltips.less';

const tooltipTitleStyle = { maxWidth: '400px', display: 'inline-block' };
// tooltipMaxWidth makes text-only tooltips have a consistent size
// tippy-popper's max-width is 400 by default but we override it so that large html tooltips work.

function assertUnreachable(param: never): never
{
  throw new Error('Unreachable code reached');
}

// https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
function cartesianProductOf(...vars: any[])
{
  return _.reduce(arguments, (a, b) =>
  {
    return _.flatten(_.map(a, (x) =>
    {
      return _.map(b, (y) =>
      {
        return x.concat([y]);
      });
    }), true);
  }, [[]]);
}
const classCombinations = cartesianProductOf(['regular', 'small', 'big', 'circle'], ['top', 'bottom', 'left', 'right']);

type ArrowModifier = 'regular' | 'small' | 'big' | 'circle';
type ShowDirection = 'top' | 'bottom' | 'left' | 'right';

class TooltipStyleGenerator
{
  public static generateStyle(theme: Theme, bgColor: string, textColor: string): object
  {
    let classes = {};
    for (const combination of classCombinations)
    {
      const modifier: ArrowModifier = combination[0];
      const direction: ShowDirection = combination[1];
      const className = TooltipStyleGenerator.getClassName(theme, modifier, direction);
      const objToAdd = { [className]: TooltipStyleGenerator.styleForArrow(modifier, direction, bgColor) };
      classes = _.extend(classes, objToAdd);
    }
    const bodyClass = {
      [TooltipStyleGenerator.getSimpleClassName(theme)]: TooltipStyleGenerator.styleForBody(theme, bgColor, textColor),
    };
    const bodyAnimateFillClass = {
      [TooltipStyleGenerator.getSimpleClassName(theme) + '[data-animatefill]']: {
        'background-color': 'transparent',
      },
    };
    classes = _.extend(classes, bodyClass, bodyAnimateFillClass);
    return classes;
  }

  private static styleForBody(theme: Theme, bgColor: string, textColor: string): object
  {
    const defaultStyle = {
      'color': textColor,
      'box-shadow': `0 4px 20px 4px ${Colors().boxShadow}, 0 4px 80px -8px ${Colors().boxShadow}`,
      'background-color': bgColor,
    };
    if (theme === 'noStyle')
    {
      return _.extend({}, defaultStyle,
        {
          'border-radius': '0px',
          'padding': '0px',
          'box-shadow': 'none',
        },
      );
    }
    return defaultStyle;
  }

  private static styleForArrow(modifier: ArrowModifier, direction: ShowDirection, color: string): object
  {
    let size: string;
    let suffix: string;
    switch (modifier)
    {
      case 'small':
        size = '5px';
        suffix = '.arrow-small';
        break;
      case 'regular':
        size = '7px';
        suffix = '';
        break;
      case 'big':
        size = '10px';
        suffix = '.arrow-big';
        break;
      case 'circle':
        return {
          'background-color': color,
        };
      default:
        assertUnreachable(modifier);
    }
    switch (direction)
    {
      case 'top':
        return {
          'border-top': `${size} solid ${color}`,
          'border-right': `${size} solid transparent`,
          'border-left': `${size} solid transparent`,
        };
      case 'bottom':
        return {
          'border-bottom': `${size} solid ${color}`,
          'border-right': `${size} solid transparent`,
          'border-left': `${size} solid transparent`,
        };
      case 'left':
        return {
          'border-left': `${size} solid ${color}`,
          'border-top': `${size} solid transparent`,
          'border-bottom': `${size} solid transparent`,
        };
      case 'right':
        return {
          'border-right': `${size} solid ${color}`,
          'border-top': `${size} solid transparent`,
          'border-bottom': `${size} solid transparent`,
        };
      default:
        assertUnreachable(direction);
    }
  }

  private static getClassName(theme: string, modifier: ArrowModifier, direction: ShowDirection): string
  {
    const bracketText = modifier === 'circle' ? 'x-circle' : 'x-arrow';
    let suffix: string;
    switch (modifier)
    {
      case 'small':
        suffix = '.arrow-small';
        break;
      case 'big':
        suffix = '.arrow-big';
        break;
      case 'regular':
      case 'circle':
        suffix = '';
        break;
      default:
        assertUnreachable(modifier);
    }
    return `.tippy-popper[x-placement^=${direction}] .tippy-tooltip.${theme}-theme [${bracketText}]${suffix}`;
  }

  private static getSimpleClassName(name): string
  {
    return `.tippy-popper .tippy-tooltip.${name}-theme`;
  }
}

// exports

export interface ThemeInfo
{
  backgroundColor: () => string;
  fontColor: () => string;
}

export interface Themes
{
  main: ThemeInfo;
  faded: ThemeInfo;
  alt: ThemeInfo;
  error: ThemeInfo;
  noStyle: ThemeInfo;
}

export type Theme = keyof Themes;

export const TOOLTIP_THEMES: Themes = {
  main: {
    backgroundColor: () => Colors().bg1,
    fontColor: () => Colors().text2,
  },
  faded: {
    backgroundColor: () => Colors().bg3,
    fontColor: () => Colors().text1,
  },
  alt: {
    backgroundColor: () => '#fff',
    fontColor: () => '#242424',
  },
  error: {
    backgroundColor: () => Colors().error,
    fontColor: () => Colors().text1,
  },
  noStyle: {
    backgroundColor: () => 'rgba(0,0,0,0)', // none does not work
    fontColor: () => 'none',
  },
};

// see https://github.com/tvkhoa/react-tippy
export interface TooltipProps
{
  title?: string;
  disabled?: boolean;
  open?: boolean;
  useContext?: boolean;
  onRequestClose?: () => void;
  position?: string;
  trigger?: string;
  tabIndex?: number;
  interactive?: boolean;
  interactiveBorder?: number;
  delay?: number;
  hideDelay?: number;
  animation?: 'shift' | 'perspective' | 'fade' | 'scale' | 'none';
  arrow?: boolean;
  arrowSize?: 'small' | 'regular' | 'big';
  animateFill?: boolean;
  duration?: number;
  distance?: number;
  offset?: number; // appears to be inconsistent when over inline lements
  hideOnClick?: boolean | 'persistent';
  multiple?: boolean;
  followCursor?: boolean;
  inertia?: boolean;
  transitionFlip?: boolean;
  popperOptions?: object;
  html?: any;
  unmountHTMLWhenHide?: boolean;
  size?: 'small' | 'regular' | 'big';
  sticky?: boolean;
  stickyDuration?: number;
  theme?: Theme;
  className?: string;
  style?: any;
  key?: any; // not naturally a react-tippy option
}

export const defaultProps: TooltipProps = {
  arrow: true,
  size: 'regular',
  theme: 'alt',
  animation: 'shift',
  position: 'top-start',
  delay: 600,
  duration: 200,
  hideDelay: 0,
};

export function generateThemeStyles()
{
  let allClasses = {};
  for (const themeName of Object.keys(TOOLTIP_THEMES))
  {
    const theme: ThemeInfo = TOOLTIP_THEMES[themeName];
    const bgColor = theme.backgroundColor();
    const textColor = theme.fontColor();
    const classes = TooltipStyleGenerator.generateStyle(themeName as Theme, bgColor, textColor);
    allClasses = _.extend(allClasses, classes);
  }
  return allClasses;
}

export function tooltip(innerComponent: any, options: TooltipProps | string)
{
  if (options === undefined || options === '') // don't wrap with tooltip if options is not provided
  {
    return innerComponent;
  }
  else if (typeof options === 'string')
  {
    const props: TooltipProps = { ...defaultProps };
    props.html = <span style={tooltipTitleStyle}> {options} </span>;
    return <Tooltip children={innerComponent} {...props} />;
  }
  else if ((options.title === '' || options.title === undefined || options.title === null)
    && (options.html === null || options.html === undefined))
  { // don't wrap with a tooltip if no title or html is provided
    return innerComponent;
  }
  else
  {
    const props = _.defaults({}, options, defaultProps);
    if (props.html === undefined || props.html === null)
    {
      props.html = <span style={tooltipTitleStyle}> {props.title} </span>;
      props.title = undefined;
    }
    return <Tooltip children={innerComponent} {...props} />;
  }
}
