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

// tslint:disable:restrict-plus-operands

import * as Immutable from 'immutable';
import * as _ from 'underscore';
const { List, Map } = Immutable;
const L = () => List([]);
import * as CommonElastic from '../../../../shared/database/elastic/syntax/CommonElastic';
import * as BlockUtils from '../../../blocks/BlockUtils';
import * as CommonBlocks from '../../../blocks/CommonBlocks';
import { Display, DisplayType } from '../../../blocks/displays/Display';
import { _block, Block, TQLTranslationFn } from '../../../blocks/types/Block';
import { _card, Card, CardString } from '../../../blocks/types/Card';
import { Input, InputType } from '../../../blocks/types/Input';
const { _wrapperCard, _aggregateCard, _valueCard, _aggregateNestedCard } = CommonBlocks;

export const elasticValue = _card({
  key: '',
  value: '',
  valueType: CommonElastic.valueTypes[0],

  static: {
    language: 'elastic',
    tql: '"$value"',
    title: 'Value',
    colors: ['#798', '#acb'],
    preview: '[value]',
    display:
    {
      displayType: DisplayType.TEXT,
      key: 'value',
    },
  },
});

export const elasticObject = _wrapperCard({
  language: 'elastic',
  tql: (block: Block, tqlTranslationFn: TQLTranslationFn, tqlConfig: object) =>
  {
    const obj: object = {};

    block['cards'].map(
      (card) =>
        _.extend(obj, tqlTranslationFn(card, tqlConfig)),
    );

    return obj;
  },
  title: 'Object',
  colors: ['#123', '#456'],
  accepts: List(['elasticKeyValueWrap']),
});

export const elasticArray = _wrapperCard({
  title: 'Array',
  language: 'elastic',
  tql: (block: Block, tqlTranslationFn: TQLTranslationFn, tqlConfig: object) =>
  {
    const arr: any[] = [];

    block['cards'].map(
      (card) =>
        arr.push(tqlTranslationFn(card, tqlConfig)),
    );

    return arr;
  },
  colors: ['#123', '#456'],
  accepts: CommonElastic.acceptsValues,
});

// section: each value type has its own card

export const elasticKeyValueWrap = _card({
  key: '',
  cards: L(),

  static:
  {
    language: 'elastic',
    tql: (block: Block, tqlTranslationFn: TQLTranslationFn, tqlConfig: object) =>
    {
      return {
        [block['key']]: tqlTranslationFn(block['cards'].get(0), tqlConfig),
      };
    },
    title: 'Property W',
    colors: ['#789', '#abc'],
    preview: (c: Card) =>
    {
      const prefix = c['key'] + ': ';

      if (c['cards'].size)
      {
        const card = c['cards'].get(0);
        return prefix + BlockUtils.getPreview(card);
      }
      return prefix + 'Nothing';
    },

    accepts: CommonElastic.acceptsValues,
    display:
    [
      {
        displayType: DisplayType.TEXT,
        key: 'key',
        autoDisabled: true,
      },

      {
        displayType: DisplayType.CARDS,
        key: 'cards',
        // className: 'nested-cards-content',
        singleChild: true,
        accepts: CommonElastic.acceptsValues,
      },
    ],
  },
});

export const elasticText = _valueCard({
  language: 'elastic',
  title: 'Text',
  colors: ['#798', '#acb'],
  defaultValue: '',
  tql: (block: Block) => block['value'],
  string: true,
});

export const elasticNumber = _valueCard({
  language: 'elastic',
  title: 'Number',
  colors: ['#798', '#acb'],
  defaultValue: 0,
  tql: (block: Block) => + block['value'] as any,
  string: true,
});

export const elasticBool = _card({
  value: 1,

  static:
  {
    language: 'elastic',
    title: 'True / False',
    preview: (card: Card) => card['value'] ? 'True' : 'False',
    tql: (block: Block) => !!block['value'] as any,
    colors: ['#798', '#acb'],
    display:
    {
      displayType: DisplayType.DROPDOWN,
      options: Immutable.List(['false', 'true']),
      key: 'value',
    },
  },
});

export const elasticNull = _card({
  static:
  {
    language: 'elastic',
    title: 'Null',
    preview: 'Null',
    tql: () => null,
    colors: ['#798', '#acb'],
    display: [],
  },
});