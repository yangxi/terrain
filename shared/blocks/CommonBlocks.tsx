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

import {Card, Cards, _card} from './types/Card';
import {Block, TQLFn} from './types/Block';
import {Display} from './displays/Display';

export module CommonBlocks
{
  // a card that contains other cards
  export interface IWrapperCard extends Card
  {
    cards: Cards;
  }

  // config to define such a card
  interface IWrapperCardConfig
  {
    colors: string[];
    title: string;
    // manualEntry: IManualEntry;
    getChildTerms?: (card: Card) => List<string>;
    getNeighborTerms?: (card: Card) => List<string>;
    display?: Display | Display[];
    tql: TQLFn;
    tqlGlue?: string;
    accepts: List<string>;
    singleChild?: boolean;
    isAggregate?: boolean;
    language: string;
  }

  const _wrapperCard = (config: IWrapperCardConfig) =>
  {
    return _card({
      cards: L(),

      static: {
        title: config.title,
        colors: config.colors,
        accepts: config.accepts,
        language: config.language,

        // manualEntry: config.manualEntry,

        getChildTerms: config.getChildTerms,
        getNeighborTerms: config.getNeighborTerms,

        preview: (c: IWrapperCard) => {
          // var prefix = config.title + ': ';
          // if(c.type === 'parentheses')
          // {
          //   prefix = '';
          // }
          if (c.cards.size)
          {
            const card = c.cards.get(0);
            return getPreview(card);
          }
          return 'Nothing';
        },

        display: config.display || (
          config.singleChild ? wrapperSingleChildDisplay : wrapperDisplay
        ),

        tql: config.tql,
        tqlGlue: config.tqlGlue,
      },
    });
  };

  const _aggregateCard = (config: {
    colors: string[];
    title: string;
    // manualEntry: IManualEntry;
    tql: string;
    defaultValue?: string;
    language: string;
      language: config.language;
  }) => _card({
    value: '',

    static: {
      title: config.title,
      colors: config.colors,
      // manualEntry: config.manualEntry,
      preview: '[value]',
      tql: config.tql,
      isAggregate: true,

      display:
        config.defaultValue === undefined
          ? stringValueDisplay
          : _.extend({},
              stringValueDisplay,
              {
                defaultValue: config.defaultValue,
              },
            )
      ,
    },
  });

  const _aggregateNestedCard = (config: {
    colors: string[],
    title: string,
    // manualEntry: IManualEntry,
    tql: string,
    accepts: List<string>,
    init?: () => any,
  }) => _card({
    value: '',

    static: {
      title: config.title,
      colors: config.colors,
      // manualEntry: config.manualEntry,
      preview: '[value]',
      tql: config.tql,
      init: config.init,
      isAggregate: true,

      display: getCardStringDisplay({
        accepts: config.accepts,
      }),
    },
  });

  const _andOrCard = (config: { title: string, english: string, factoryType: string, tqlGlue: string, colors: string[], manualEntry: any }) => _card({
      clauses: L(),

      static: {
        title: config.title,
        preview: '[clauses.length] ' + config.english + ' clauses',
        colors: config.colors,
        tql: '(\n$clauses\n)',
        tqlGlue: config.tqlGlue,
        // manualEntry: config.manualEntry,

        init: () => ({
          clauses: List([
            make(Blocks[config.factoryType]),
            make(Blocks[config.factoryType]),
          ]),
        }),

        display: {
          displayType: DisplayType.ROWS,
          key: 'clauses',
          english: "'" + config.english + "'",
          factoryType: config.factoryType,
          // className: (card) => {
          //   if(card['clauses'].size && typeof card['clauses'].get(0) !== 'string')
          //   {
          //     return 'multi-field-card-padding';
          //   }
          //   return '';
          // },

          row: {
            below:
            {
              displayType: DisplayType.CARDSFORTEXT,
              key: 'clause',
            },

            inner:
            {
              displayType: DisplayType.CARDTEXT,
              key: 'clause',
              top: false,
            },

            hideToolsWhenNotString: true,
          },
        },
      },
    });

  const _valueCard = (config: { 
    title: string, 
    colors: string[], 
    // manualEntry: IManualEntry, 
    tql: string, 
    defaultValue: number 
  }) => (
    _card({
      value: config.defaultValue,

      static: {
        title: config.title,
        colors: config.colors,
        preview: '[value]',
        display: valueDisplay,
        // manualEntry: config.manualEntry,
        tql: config.tql,
      },
    })
  );
  
}