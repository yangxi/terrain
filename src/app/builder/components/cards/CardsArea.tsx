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
import * as _ from 'underscore';
import * as $ from 'jquery';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Util from '../../../util/Util.tsx';
import InfoArea from '../../../common/components/InfoArea.tsx';
import Actions from "../../data/BuilderActions.tsx";
import Card from "../cards/Card.tsx";
import LayoutManager from "../layout/LayoutManager.tsx";
import CreateCardTool from "./CreateCardTool.tsx";
import PureClasss from './../../../common/components/PureClasss.tsx';
import { DropTarget } from 'react-dnd';
import BuilderTypes from '../../BuilderTypes.tsx';
type ICard = BuilderTypes.ICard;
type ICards = BuilderTypes.ICards;
let {List} = Immutable;

interface Props
{
  cards: ICards;
  topLevel: boolean;
  keys: List<string>;
  canEdit: boolean;
  keyPath: KeyPath;
  
  queryId?: ID;
  spotlights?: List<any>; // TODO spotlight type
  connectDropTarget?: (el:JSX.Element) => JSX.Element;
}

interface KeyState {
  keys: List<string>;
  keyPath: KeyPath;
}

class CardsArea extends PureClasss<Props>
{
  state: KeyState = {
    keys: List([]),
    keyPath: null,
  };
  
  constructor(props:Props)
  {
    super(props);
    this.state.keys = this.computeKeys(props);
    this.state.keyPath = this.computeKeyPath(props);
  }
  
  componentWillReceiveProps(nextProps:Props)
  {
    if(nextProps.keys !== this.props.keys || nextProps.cards !== this.props.cards)
    {
      this.setState({
        keys: this.computeKeys(nextProps)
      });
    }
    if(nextProps.keyPath !== this.props.keyPath || nextProps.queryId !== this.props.queryId)
    {
      this.setState({
        keyPath: this.computeKeyPath(nextProps)
      });
    }
  }
  
  computeKeyPath(props:Props): KeyPath
  {
    if(props.keyPath)
    {
      return this._ikeyPath(props.keyPath, 'cards');
    }
    if(props.queryId && props.topLevel)
    {
      return List(['queries', props.queryId, 'cards']);
    }
    
    throw new Error("Invalid props combination passed to CardsArea.");
  }
  
  computeKeys(props:Props): List<string>
  {
    let newKeysArr: string[] = props.keys.toJS().concat(
      props.cards.reduce(
        (memo: string[], card): string[] =>
        {
          if(card.type === BuilderTypes.CardTypes.VAR || card.type === BuilderTypes.CardTypes.LET)
          {
            memo.push(
              (card as (BuilderTypes.IVarCard | BuilderTypes.ILetCard)).field
            );
          }
          return memo;
        }
      , [])
    );
    
    if(newKeysArr.some(key => this.state.keys.indexOf(key) === -1))
    {
      // keys have changed
      return List(newKeysArr);
    }
    
    return this.state.keys;
  }
  
       
  
  copy() {}
  
  clear() {}
  
  createFromCard() {
    Actions.cards.create(this.state.keyPath, 'from', 0);
  }
  
  render() {
    let {props} = this;
    let {cards, topLevel, canEdit} = props;
    
    if(!cards.size && topLevel)
    {
      return <InfoArea
        large="No cards have been created, yet."
        small="Most people start with the From card."
        button="Create a From card"
        onClick={this.createFromCard}
        />;
    }
    // TODO add cards
    return this.props.connectDropTarget(
      <div
        className={'cards-area' + (topLevel ? ' cards-area-top-level' : '')}
      >
        {
          cards.map((card:ICard, index:number) =>
            <Card 
              {...this.props}
              cards={null}
              key={card.id}
              singleCard={false}
              topLevel={false}
              index={index}
              card={card}
              dndListener={$({})}
              keys={this.state.keys}
            />
          )
        }
        
        <CreateCardTool
          {...this.props}
          index={props.cards.size}
          open={props.cards.size === 0}
          parentId={props.queryId /* TODO */}
          className={props.topLevel ? 'standard-margin standard-margin-top' : 'nested-create-card-tool-wrapper'}
        />
      </div>
    );
  }
}



const cardTarget = 
{
  canDrop(props, monitor)
  {
    return true;
  },
  
  drop(props, monitor, component)
  {
    if(monitor.isOver({ shallow: true}))
    {
      const card = monitor.getItem();
      Actions.cards.move(card, props.cards.length, props.parentId);
    }
  }
}

const dropCollect = (connect, monitor) =>
({
  connectDropTarget: connect.dropTarget(),
});


export default DropTarget('CARD', cardTarget, dropCollect)(CardsArea);
