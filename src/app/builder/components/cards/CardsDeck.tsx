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

require('./CardsDeck.less');
import * as classNames from 'classnames';
import * as Immutable from 'immutable';
import * as _ from 'underscore';
import * as $ from 'jquery';
import * as React from 'react';
import Util from '../../../util/Util.tsx';
import Actions from "../../data/BuilderActions.tsx";
import PureClasss from './../../../common/components/PureClasss.tsx';
import BuilderTypes from '../../BuilderTypes.tsx';
import Switch from './../../../common/components/Switch.tsx';
type ICard = BuilderTypes.ICard;
type ICards = BuilderTypes.ICards;
let {List, Map} = Immutable;
let ExpandIcon = require("./../../../../images/icon_expand_12x12.svg?name=ExpandIcon");
import { DragSource } from 'react-dnd';

interface Props
{
  open: boolean;
}

class CardsDeck extends PureClasss<Props>
{
  state: {
    search: string;
  } = {
    search: "",
  };
  
  componentWillReceiveProps(nextProps:Props)
  {
    if(!this.props.open && nextProps.open)
    {
      this.refs['search']['focus']();
    }
  }
  
  handleSearchChange(evt)
  {
    this.setState({
      search: evt.target.value,
    });
  }
  
  render()
  {
    return (
      <div>
        <div
          className='cards-deck-search-wrapper'
        >
          <input 
            type='text' 
            ref='search' 
            className='cards-deck-search' 
            placeholder='Filter Cards'
            value={this.state.search}
            onChange={this.handleSearchChange}
          />
        </div>
        <div
          className='cards-deck-inner'
        >
          {
            BuilderTypes.CardTypes.map(type =>
              <CardDeckCard
                type={type}
                search={this.state.search}
                key={type}
              />
            )
          }
        </div>
      </div>
    );
  }
}

interface CardProps
{
  type: string;
  search: string;
  key: string;
  
  isDragging?: boolean;
  connectDragPreview?: (a?:any) => void;
  connectDragSource?: (el: El) => El;
}

class _CardDeckCard extends PureClasss<CardProps>
{
  render()
  {
    let {type} = this.props;
    let card = BuilderTypes.Blocks[type].static;
    let search = this.props.search.toLowerCase();
    
    if(card.title.toLowerCase().indexOf(search) !== 0) // && type.indexOf(search) !== 0)
    {
      var hidden = true;
    }
    
    return this.props.connectDragSource(
      <div
        className={classNames({
          'cards-deck-card': true,
          'cards-deck-card-hidden': hidden,
        })}
        style={{
          background: card.colors[0],
        }}
      >
        {
          card.title
        }
      </div>
    );
  }
}

// Drag and Drop (the bass)

export interface CardItem
{
  type: string;
  new: boolean;
}

const cardSource = 
{
  canDrag: (props) => true,
  
  beginDrag: (props: CardProps): CardItem =>
  {
    setTimeout(() => $('body').addClass('body-card-is-dragging'), 100);
    // TODO unselect cards?
    
    return {
      type: props.type,
      new: true,
    };
  },
  
  endDrag: () =>
  {
    $('body').removeClass('body-card-is-dragging');
  }
}

const dragCollect = (connect, monitor) =>
({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
  connectDragPreview: connect.dragPreview()
});

let CardDeckCard = DragSource('CARD', cardSource, dragCollect)(_CardDeckCard);


export default CardsDeck;