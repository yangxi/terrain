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

import * as Immutable from 'immutable';
import * as React from 'react';
import PureClasss from './../common/components/PureClasss.tsx';
import {Operators, Combinators} from './BuilderTypes.tsx';
var ManualConfig = require('./../manual/ManualConfig.json');

var ManualConfig = require('./../manual/ManualConfig.json');


export enum DisplayType
{
  TEXT,
  CARDTEXT, // textbox that can be cards, must be coupled with:
  CARDSFORTEXT, // cards that are associated with a textbox
  NUM,
  ROWS,
  CARDS,
  DROPDOWN,
  FLEX, // a single row, doesn't require a key
  COMPONENT,
  LABEL, // strict text to paste in to HTML
}

let {TEXT, NUM, ROWS, CARDS, CARDTEXT, CARDSFORTEXT, DROPDOWN, LABEL, FLEX, COMPONENT} = DisplayType;

export interface Display
{
  displayType: DisplayType;
  key: string;
  // key can be null for FLEX but nothing else
  
  //Manual information
  help?: string | string[];

  className?: string | ((data: any) => string);
  
  header?: string;
  headerClassName?: string;
  
  // for dropdown
  options?: List<(string | El)>;
  
  // for labels
  label?: string;
  
  // for textboxes
  placeholder?: string;
  // for textboxes with cards
  top?: boolean;
  getAutoTerms?: () => List<string>; // overrides standard terms
  autoDisabled?: boolean;
  showWhenCards?: boolean;
  
  // for rows and FLEX, content to display above/below,   
  above?: Display;
  below?: Display;
  
  // for rows:
  english?: string; // English term defining each row
  factoryType?: string; // string referencing which BLOCK to create
  row?: { // this defines each row
    inner: Display | Display[];
    above?: Display | Display[];
    below?: Display | Display[];
    hideToolsWhenNotString?: boolean;
  };
  
  // for FLEX, its content
  flex?: Display | Display[];
  
  // for components
  component?: (typeof PureClasss);
  
  // for cards areas
  singleChild?: boolean;
  
  provideParentData?: boolean;
  // if true, it passes the parent data down
  // this will cause unnecessary re-rendering, so avoid if possible
}

// Section: Re-useable displays

export const valueDisplay =
{
  displayType: NUM,
  help: ManualConfig.help["value"],
  key: 'value',
}

export const stringValueDisplay =
  {
    displayType: TEXT,
    key: 'value',
  };

export const textDisplay =
{
  displayType: TEXT,
  key: [],
}

export const firstSecondDisplay = (middle:Display): Display =>
({
  displayType: FLEX,
  key: null,
  
  above:
  {
    displayType: CARDSFORTEXT,
    key: 'first',
    className: 'card-double-first',
  },
  
  below:
  {
    displayType: CARDSFORTEXT,
    key: 'second',
  },
  
  flex:
  [
    {
      displayType: CARDTEXT,
      key: 'first',
      top: true,
      showWhenCards: true,
      help: ManualConfig.help["first"],
    },
    
    middle,
    
    {
      displayType: CARDTEXT,
      key: 'second',
      showWhenCards: true,
      help: ManualConfig.help["second"],
    },
  ],
});

export const wrapperDisplay: Display =
{
  displayType: CARDS,
  key: 'cards',
  className: 'wrapper-cards-content',
};

export const wrapperSingleChildDisplay: Display =
{
  displayType: CARDS,
  key: 'cards',
  className: 'wrapper-cards-content',
  singleChild: true,
};

export const letVarDisplay =
{
  displayType: FLEX,
  key: null,
  flex:
  [
    {
      displayType: TEXT,
      help: ManualConfig.help["let-var-field"],
      key: 'field',
    },
    {
      displayType: LABEL,
      label: '=',
      key: null,
    },
    {
      displayType: CARDTEXT,
      help: ManualConfig.help["expression"],
      key: 'expression',
    },
  ],
  below:
  {
    key: 'expression',
    displayType: CARDSFORTEXT,
  },
};