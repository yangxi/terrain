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

// tslint:disable:no-var-requires restrict-plus-operands strict-boolean-expressions

import * as classNames from 'classnames';
import * as Immutable from 'immutable';
import * as $ from 'jquery';
import * as _ from 'lodash';
import * as React from 'react';
import Actions from '../../data/BuilderActions';
import { scrollAction } from '../../data/BuilderScrollStore';
import Switch from './../../../common/components/Switch';
import TerrainComponent from './../../../common/components/TerrainComponent';
import CardDropArea from './CardDropArea';
import CardsArea from './CardsArea';
import './CardsColumn.less';
import CardsDeck from './CardsDeck';
const Dimensions = require('react-dimensions');
import { AllBackendsMap } from '../../../../database/AllBackends';
import { altStyle, backgroundColor, Colors, fontColor } from '../../../common/Colors';
import Util from '../../../util/Util';
import { BuilderState, BuilderStore } from '../../data/BuilderStore';

import { Cards } from '../../../../blocks/types/Card';
const { List, Map } = Immutable;

export interface Props
{
  language: string;
  queryId: ID;
  canEdit: boolean;
  addColumn: (number, string?) => void;
  columnIndex: number;

  containerWidth?: number;
  containerHeight?: number;
  tuning?: boolean;
}

class TuningColumn extends TerrainComponent<Props>
{
  public state: {
    keyPath: KeyPath;
    allCards: Cards,
    tuningOrder: List<string>,
  } = {
    keyPath: this.computeKeyPath(this.props),
    allCards: List([]),
    tuningOrder: List([]),
  };

  public tuningCards: Cards = List([]);
  public prevTuningCards: Cards = List([]);

  public innerHeight: number = -1;

  public constructor(props: Props)
  {
    super(props);
    this._subscribe(BuilderStore, {
      updater: (state: BuilderState) =>
      {
        if (!_.isEqual(this.state.allCards, state.query.cards))
        {
          this.prevTuningCards = this.tuningCards;
          this.tuningCards = List([]);
          this.updateTuningCards(state.query.cards);
          this.checkForRemovedCards();
          this.setState({
            allCards: state.query.cards,
          });
        }
      },
    });
  }

  public componentWillMount()
  {
    const order = BuilderStore.getState().query.tuningOrder;
    this.setState({
      tuningOrder: order !== undefined ? List(order) : List([]),
    });
  }

  public componentWillUnmount()
  {
    Actions.change(List(this._keyPath('query', 'tuningOrder')), this.state.tuningOrder);
  }

  public sortTuningCards()
  {
    this.tuningCards = this.tuningCards.sortBy((card) =>
      this.state.tuningOrder.indexOf(card.id),
    ) as any;
  }

  public handleCardAdded(card)
  {
    const x = this.state.tuningOrder.push(card.id);
    this.setState({
      tuningOrder: this.state.tuningOrder.push(card.id),
    });
  }

  public handleCardRemove(card)
  {
    const index = this.state.tuningOrder.indexOf(card.id);
    this.setState({
      tuningOrder: this.state.tuningOrder.remove(index),
    });
  }

  public checkForRemovedCards()
  {
    this.prevTuningCards.forEach((card) =>
    {
      if (this.tuningCards.indexOf(card) === -1)
      {
        this.handleCardRemove(card);
      }
    });
  }

  public updateTuningCards(cards)
  {
    cards.forEach((card) =>
    {
      if (card.tuning)
      {
        this.tuningCards = this.tuningCards.push(card);
        if (this.prevTuningCards.indexOf(card) === -1)
        {
          // new card added
          this.handleCardAdded(card);
        }
      }
      if (card.key.tuning) // for transform cards
      {
        this.tuningCards = this.tuningCards.push(card.key);
        if (this.prevTuningCards.indexOf(card.key) === -1)
        {
          // new card added
          this.handleCardAdded(card.key);
        }
      }
      if (card.cards !== undefined && card.cards.size > 0)
      {
        this.updateTuningCards(card.cards);
      }
      if (card.weights !== undefined && card.weights.size > 0)
      {
        this.updateTuningCards(card.weights);
      }
    });
  }

  public computeKeyPath(props: Props): KeyPath
  {
    return List(this._keyPath('query', 'cards'));
  }

  public componentWillReceiveProps(nextProps: Props)
  {
    if (nextProps.queryId !== this.props.queryId)
    {
      this.setState({
        keyPath: this.computeKeyPath(nextProps),
      });
    }
  }

  public afterDrop(item, targetProps)
  {
    // console.log('card drop boooom');
  }

  public handleCardReorder(card, siblings)
  {
    const cardsArea = Util.children(this.refs['cardsArea'])[0];
    const children = cardsArea.childNodes;
    let cards = List([]);
    for (let i = 0; i < children.length; ++i)
    {
      if (children[i].childNodes.length > 1)
      {
        cards = cards.push((children[i].childNodes[1] as any).id);
      }
    }
  }

  public render()
  {
    const { canEdit, language, addColumn, columnIndex } = this.props;
    const { keyPath } = this.state;
    this.sortTuningCards();
    return (
      <div
        className='cards-column'
      >
        <div
          className='cards-column-cards-area'

          id='cards-column'
        >
          <div
            id='cards-column-inner'
          >
            <CardsArea
              cards={this.tuningCards}
              language={language}
              keyPath={keyPath}
              canEdit={canEdit}
              addColumn={addColumn}
              columnIndex={columnIndex}
              noCardTool={true}
              accepts={this.getPossibleCards()}
              tuningMode={true}
              handleCardReorder={this.handleCardReorder}
              ref='cardsArea'
            />
          </div>
        </div>
      </div>
    );
  }

  private getPossibleCards()
  {
    return AllBackendsMap[this.props.language].cardsList;
  }
}

export default Dimensions()(TuningColumn);
