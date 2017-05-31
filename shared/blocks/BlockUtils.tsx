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
import Map = Immutable;
import List = Immutable;

import {Block} from './types/Block';
import {Card} from './types/Card';

module BlockUtils
{
  export function getChildIds(_block: Block): IMMap<ID, boolean>
  {
    let map = Map<ID, boolean>({});

    if (Immutable.Iterable.isIterable(_block))
    {
      const block = _block.toMap();
      if (block.get('id'))
      {
        map = map.set(block.get('id'), true);
      }
      block.map((value) => map = map.merge(getChildIds(value)));
    }

    return map;
  }

  export function forAllCards(
    block: Block | List<Block>,
    fn: (card: Card, keyPath: KeyPath) => void,
  ) {
    forAllBlocks(
      block,
      (block: Block, keyPath: KeyPath) =>
      {
        if (block['_isCard'])
        {
          fn(block as any, keyPath);
        }
      },
    );
  }

  export function forAllBlocks(
    block: Block | List<Block>,
    fn: (block: Block, keyPath: KeyPath) => void,
    keyPath: KeyPath = List([]),
    stopAtFirstBlock?: boolean,
    excludeWrappedCards?: boolean,
  )
  {
    if (block)
    {
      if (block['_isBlock'])
      {
        fn(block as Block, keyPath);
      }
      if (
        Immutable.Iterable.isIterable(block)
        && (!stopAtFirstBlock || !block['_isBlock'] || !keyPath.size)
      )
      {
        (block.toMap() as any).map(
          (b, key) =>
          {
            if (!excludeWrappedCards || key !== 'cards')
            {
              forAllBlocks(
                b as Block,
                fn,
                keyPath.push(key),
                stopAtFirstBlock,
                excludeWrappedCards,
              );
            }
          },
        );
      }
    }
  }

  export function transformAlias(transformCard: Card): string
  {
    return 'transform' + transformCard.id.replace(/[^a-zA-Z0-9]/g, '');
  }
}

export default BlockUtils;