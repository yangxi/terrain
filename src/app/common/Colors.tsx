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

// tslint:disable:no-var-requires strict-boolean-expressions max-line-length comment-format restrict-plus-operands

import { extend } from 'lodash';

const Color = require('color');

interface Theme
{
  // Use these colors

  // main background colors
  bg1: string; // most contrast
  bg2: string;
  bg3: string; // least contrast

  emptyBg: string; // special BG to denote "empty nothingness"

  border1: string; // high contrast border
  border2: string; // medium contrast border
  border3: string; // low contrast border

  text1: string; // most contrast
  text2: string;
  text3: string; // least contrast

  altText1: string;
  altText2: string;
  altText3: string;

  altBg1: string;
  altBg2: string;

  altHighlight: string;

  active: string; // active color
  activeText: string;
  inactiveHover: string; // when something isn't active but could be
  inactiveHoverText: string;
  activeHover: string; // when an active thing is hovered

  highlight: string; // for slight emphasis
  darkerHighlight: string; // for depth effect with highlight

  boxShadow: string; // shadow color

  fadedOutBg: string; // for obscuring background contents behind a dark blur

  inputBg: string;

  scrollbarBG: string;
  scrollbarPiece: string;
  altScrollbarPiece: string;

  error: string;

  // DO NOT USE these below colors anymore -- these need to be cleaned up

  // text
  text: {
    baseDark: string,
    secondaryDark: string,
    baseLight: string,
    secondaryLight: string,
    thirdLight: string,

    link: string, // TODO
    linkHover: string,
  };

  button: {
    text: string,
    background: string,
    backgroundHover: string,
  };

  // Library ------

  library: {
    // item
    item: {
      title: string,
      body: string,
      activeBody: string,
    },

    // info graph selection btn
    infoGraphBtn: {
      btnBase: string,
      btnRoll: string,
      btnSelected: string,
      btnRadioBase: string,
      btnRadioSelected: string,
    },

    //text box
    textbox: {
      base: string,
    },
  };

  // Builder -----------------------------

  builder: {
    // tab area
    tabs: {
      background: string,
      tabActive: string,
      tabTopRibbon: string,
      tabInactive: string,
      tabTopRibbonInactive: string,
    },

    // deck
    deck: {
      background: string,
    },

    // deck cards --temporary values, colors will be grouped. Inactive on deck all cards are at 70% opacity. Bullet circle is 100% Opacity. When rolled over Opacity is 90%.
    cards: {

      cardBgOpacity: number,

      cardBase: string,

      // card theme colors

      //by category
      categories: {
        primary: string,
        control: string,
        sort: string,
        filter: string,
        match: string,
        score: string,
        script: string,
        compound: string,
        join: string,
        geo: string,
        parameter: string,
      };

      //by clause type
      anyClause: string,
      arrayClause: string,
      baseClause: string,
      booleanClause: string,
      enumClause: string,
      fieldClause: string,
      indexClause: string,
      mapClause: string,
      nullClause: string,
      numberClause: string,
      objectClause: string,
      stringClause: string,
      structureClause: string,
      typeClause: string,
      inputParameter: string,

      // DO NOT USE -- Saving for reference, remove soon
      card1: string,
      card2: string,
      card3: string,
      card4: string,
      card5: string,
      card6: string,
      card7: string,
      card8: string,
      card9: string,
      card10: string,
      card11: string,
      card12: string,
      card13: string,
      card14: string,
      card15: string,
      card16: string,
      card17: string,
      card18: string,
      card19: string,
      card20: string,
      card21: string,

      card1BG: string,
      card2BG: string,
      card3BG: string,
      card4BG: string,
      card5BG: string,
      card6BG: string,
      card7BG: string,
      card8BG: string,
      card9BG: string,
      card10BG: string,
      card11BG: string,
      card12BG: string,
      card13BG: string,
      card14BG: string,
      card15BG: string,
      card16BG: string,
      card17BG: string,
      card18BG: string,
      card19BG: string,
      card20BG: string,
      card21BG: string,
    },

    //builder column
    builderColumn: {
      background: string,
    },

    results: {
      background: string,
      lines: string,
    },

    inputs: {
      background: string,
    },
  };

  // File Import -----------------------------

  fileimport: {
    preview: {
      column: {
        base: string,
        typeDropdown: string,
        transform: string,
      };
      cell: string;
    },
  };
}

const darkActive = '#1eb4fa';

const code =
  {
    numberClause: '#1eb4fa',
    nullClause: '#d14f42', // code mirror marks nulls as numbers

    booleanClause: '#b161bc',
    baseClause: '#f99c49',

    anyClause: '#559dce',

    arrayClause: '#b161bc',

    enumClause: 'rgb(255, 189, 86)',
    fieldClause: '#fad14b', // pastel purple: 'rgb(144, 118, 170)',

    structureClause: '#4fc0ba',
    mapClause: '#4fc0ba',
    objectClause: '#4fc0ba',

    stringClause: '#f99c49', // string types
    indexClause: '#f99c49',
    typeClause: '#f99c49',

    inputParameter: '#4ef9ab', // '#da62ea',

  };

const DARK: Theme =
  {
    // Use these colors

    bg1: 'rgb(39, 39, 39)',
    bg2: 'rgb(47, 47, 47)',
    bg3: 'rgb(60, 63, 65)',

    emptyBg: 'rgb(21, 21, 21)',

    border1: 'rgb(72,72,72)',
    border2: 'rgb(100,105,107)',
    border3: 'rgb(125,130,139)',

    text1: '#fff',
    text2: 'rgba(255,255,255,0.85)',
    text3: 'rgba(255,255,255,0.5)',

    altBg1: '#fff',
    altBg2: '#EDEFF3',

    altText1: '#000',
    altText2: '#242424',
    altText3: '#424242',

    altHighlight: 'rgba(210,215,219,0.75)',

    highlight: 'rgba(255,255,255,0.15)', // for slight emphasis
    darkerHighlight: 'rgba(255,255,255,0.05)', // to make a depth effect with highlight

    boxShadow: 'rgba(0, 0, 0, 0.39)',

    fadedOutBg: 'rgba(0,0,0,0.75)', // bg to cover up things when they are faded out

    inputBg: 'rgba(0,0,0,0.25)',

    active: darkActive,
    activeText: '#fff',
    inactiveHover: Color(darkActive).fade(0.25).string(),
    inactiveHoverText: '#fff',
    activeHover: Color(darkActive).fade(0.75).string(),

    scrollbarBG: 'rgba(255,255,255,0.15)',
    scrollbarPiece: 'rgba(255,255,255,0.25)',

    altScrollbarPiece: 'rgba(0, 0, 0, 0.15)',

    error: '#d14f42',

    // DO NOT USE these below colors anymore -- these need to be cleaned up

    // text
    text:
    {
      baseDark: '#000000',
      secondaryDark: 'rgba(0,0,0,0.50)',
      baseLight: '#FFFFFF',
      secondaryLight: 'rgba(255,255,255,0.80)',
      thirdLight: 'rgba(255,255,255,0.5)',

      link: Color('#4C7C9C').lighten(0.25).saturate(0.15).string(),
      linkHover: Color('#4C7C9C').lighten(0.5).saturate(0.15).string(),
    },

    button:
    {
      text: '#FFFFFF',
      background: Color('#4C7C9C').lighten(0.15).saturate(0.15).string(),
      backgroundHover: Color('#4C7C9C').saturate(0.15).string(),
    },

    // Library ------

    library:
    {
      // item
      item: {
        title: '#424242',
        body: '#4B4B4B',
        activeBody: '#4C7C9C',
      },

      // info graph selection btn
      infoGraphBtn: {
        btnBase: '#696666',
        btnRoll: '#6E6B6B',
        btnSelected: '#828080',
        btnRadioBase: 'rgba(0,0,0,0.50)',
        btnRadioSelected: '#80CCFF',
      },

      //text box
      textbox: {
        base: '#FFFFFF',
      },
    },

    // Builder -----------------------------

    builder: {
      // tab area
      tabs: {
        background: '#151515',
        tabActive: '#272727',
        tabTopRibbon: '#4C7C9C',
        tabInactive: 'rgba(39,39,39,50)',
        tabTopRibbonInactive: 'rgba(76, 124, 156, 0.5)',
      },

      // deck
      deck: {
        background: '#2B2A2A',
      },

      // deck cards --temporary values, colors will be grouped. Inactive on deck all cards are at 70% opacity. Bullet circle is 100% Opacity. When rolled over Opacity is 90%.
      cards: {

        cardBgOpacity: 0.45,

        cardBase: 'rgba(47, 47, 47, 0)', //'rgb(60, 63, 65)', //'#2F2F2F', // '#424242', // TODO

        // card theme colors

        //by category
        categories: {
          primary: '#4fc0ba',
          control: '#fad14b',
          sort: '#5ed04b',
          filter: '#d14f42',
          match: '#b161bc',
          score: '#1eb4fa',
          script: '#4fc0ba',
          compound: '#fad14b',
          join: '#fad14b',
          geo: '#0ee06b',
          parameter: code.inputParameter,
        },

        //by clause type
        anyClause: code.anyClause,
        arrayClause: code.arrayClause,
        baseClause: code.baseClause,
        booleanClause: code.booleanClause,
        enumClause: code.enumClause,
        fieldClause: code.fieldClause,
        indexClause: code.indexClause,
        mapClause: code.mapClause,
        nullClause: code.nullClause,
        numberClause: code.numberClause,
        objectClause: code.objectClause,
        stringClause: code.stringClause,
        structureClause: code.structureClause,
        typeClause: code.typeClause,
        inputParameter: code.inputParameter,

        card1: '#559DCE',
        card2: '#397DD0',
        card3: '#D14F42',
        card4: '#D55A44',
        card5: '#DA6846',
        card6: '#DD7547',
        card7: '#DD8846',
        card8: '#DAA043',
        card9: '#D9B540',
        card10: '#86A760',
        card11: '#659F72',
        card12: '#4B977F',
        card13: '#39908B',
        card14: '#2E8C9A',
        card15: '#2589AA',
        card16: '#466AA3',
        card17: '#824BA0',
        card18: '#B161BC',
        card19: '#319AA9',
        card20: '#4A979A',
        card21: '#3A91A5',

        card1BG: Color('#559DCE').alpha(.2).string(),
        card2BG: Color('#397DD0').alpha(0.2).string(),
        card3BG: Color('#D14F42').alpha(0.2).string(),
        card4BG: Color('#D55A44').alpha(0.2).string(),
        card5BG: Color('#DA6846').alpha(0.2).string(),
        card6BG: Color('#DD7547').alpha(0.2).string(),
        card7BG: Color('#DD8846').alpha(0.2).string(),
        card8BG: Color('#DAA043').alpha(0.2).string(),
        card9BG: Color('#D9B540').alpha(0.2).string(),
        card10BG: Color('#86A760').alpha(0.2).string(),
        card11BG: Color('#659F72').alpha(0.2).string(),
        card12BG: Color('#4B977F').alpha(0.2).string(),
        card13BG: Color('#39908B').alpha(0.2).string(),
        card14BG: Color('#2E8C9A').alpha(0.2).string(),
        card15BG: Color('#2589AA').alpha(0.2).string(),
        card16BG: Color('#466AA3').alpha(0.2).string(),
        card17BG: Color('#824BA0').alpha(0.2).string(),
        card18BG: Color('#B161BC').alpha(0.2).string(),
        card19BG: Color('#319AA9').alpha(0.2).string(),
        card20BG: Color('#4A979A').alpha(0.2).string(),
        card21BG: Color('#3A91A5').alpha(0.2).string(),
      },

      //builder column
      builderColumn: {
        background: 'rgba(0,0,0,0)', // 'rgb(47, 47, 47)', //'rgb(60, 63, 65)',
      },

      results:
      {
        background: '#151515',
        lines: 'rgba(255,255,255,0.25)',
      },

      inputs:
      {
        background: '#626262',
      },
    },

    // File import -----------------------------

    fileimport: {
      preview: {
        column: {
          base: '#00a0f4',
          typeDropdown: '#005d69',
          transform: '#a2af93',
        },
        cell: '#f1d7d7',
      },
    },
  };

const Themes: { [name: string]: Theme } =
  {
    DARK,
  };

const curTheme = 'DARK';

export function Colors()
{
  // in the future, you will switch out the theme here.
  return Themes[curTheme];
}

const dynamicMap: any = {
  DARK: {},
};

export function backgroundColor(color: string, hoverColor?: string)
{
  return getStyle('backgroundColor', color, hoverColor);
}

export function fontColor(color: string, hoverColor?: string)
{
  return getStyle('color', color, hoverColor);
}

export function borderColor(color: string, hoverColor?: string)
{
  return getStyle('borderColor', color, hoverColor);
}

export function link()
{
  return fontColor(Colors().inactiveHover, Colors().active);
}

const CACHE: any = {};

export function altStyle()
{
  if (!CACHE['altStyle' + curTheme])
  {
    CACHE['altStyle' + curTheme] = extend({},
      backgroundColor(Colors().altBg1),
      fontColor(Colors().altText1),
    );
  }

  return CACHE['altStyle' + curTheme];
}

export function cardStyle(strongColor, bgColor, hoverBg?: string, small?: boolean)
{
  const key = 'card-' + strongColor + bgColor + hoverBg + small;

  if (!CACHE[key])
  {
    CACHE[key] = {
      background: bgColor,
      color: strongColor,

      boxShadow: small ? 'rgba(0, 0, 0, 0.39) 2px 2px 4px 1px' :
        '3px 3px 5px 2px rgba(0,0,0,.39)',
      borderWidth: 1,
      borderStyle: 'solid',
      borderLeftWidth: '3px',
      borderLeftColor: strongColor,

      borderTopColor: Colors().highlight,
      borderRightColor: Colors().darkerHighlight,
      borderBottomColor: Colors().darkerHighlight,

      [hoverBg && ':hover']: {
        background: hoverBg,
      },
    };
  }

  return CACHE[key];
}

export function couldHover(isFocused?: boolean)
{
  if (!CACHE['couldHover'])
  {
    CACHE['couldHover'] = {
      ':hover': {
        backgroundColor: Colors().inactiveHover,
        color: Colors().inactiveHoverText,
      },
    };
  }
  if (!CACHE['couldHoverFocused'])
  {
    CACHE['couldHoverFocused'] = {
      backgroundColor: Colors().inactiveHover,
      color: Colors().inactiveHoverText,
    };
  }

  return CACHE[isFocused ? 'couldHoverFocused' : 'couldHover'];
}

export function buttonColors()
{
  if (!CACHE['buttonColors' + curTheme])
  {
    CACHE['buttonColors' + curTheme] = extend({},
      backgroundColor(Colors().inactiveHover, Colors().active),
      fontColor(Colors().text1),
    );
  }

  return CACHE['buttonColors' + curTheme];
}

export function disabledButtonColors()
{
  if (!CACHE['disabledButtonColors' + curTheme])
  {
    CACHE['disabledButtonColors' + curTheme] = extend({},
      backgroundColor(Colors().altBg2),
      fontColor(Colors().altText3),
    );
  }
  return CACHE['disabledButtonColors' + curTheme];
}

export function getStyle(style: string, color: string, hoverColor?: string): object
{
  if (!dynamicMap[curTheme])
  {
    dynamicMap[curTheme] = {};
  }
  if (!dynamicMap[curTheme][color])
  {
    dynamicMap[curTheme][color] = {};
  }
  if (!dynamicMap[curTheme][color][style])
  {
    dynamicMap[curTheme][color][style] = {};
  }
  if (!dynamicMap[curTheme][color][style][hoverColor])
  {
    dynamicMap[curTheme][color][style][hoverColor] = {
      [style]: color,
    };
    if (hoverColor)
    {
      dynamicMap[curTheme][color][style][hoverColor][':hover'] = {
        [style]: hoverColor,
      };
    }
  }

  return dynamicMap[curTheme][color][style][hoverColor];
}

export function getCardColors(category: string | undefined, typeColor: string): string[]
{
  const colors = Colors();

  let color: string = typeColor;

  if (category !== undefined)
  {
    color = colors.builder.cards.categories[category];
    if (color === undefined)
    {
      color = typeColor;
    }
  }

  return [color, Color(color).alpha(colors.builder.cards.cardBgOpacity).string()];
}

export default Colors;
