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

require('./ScoreCard.less');

import * as _ from 'underscore';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Actions from "../../../data/Actions.tsx";
import Util from '../../../util/Util.tsx';
import LayoutManager from "../../layout/LayoutManager.tsx";
import Dropdown from "../../common/Dropdown.tsx";
import CardField from './../CardField.tsx';
import { CardModels } from './../../../models/CardModels.tsx';

import { Weight, Weighter } from '../../../charts/Weighter.tsx';

interface Props {
  card: CardModels.ScoreCard;
  algorithmId: string;
}

var methods = ['weightedSum'];

class ScoreCard extends React.Component<Props, any>
{
  test: string = "abc";
  constructor(props:Props)
  {
    super(props);
    
    Util.bind(this, ['handleWeightsChange', 'renderWeight', 'renderHeader',
      'handleOutputChange', 'handleMethodChange', 'handleWeightKeyChange']);
  }
  
  handleWeightsChange(newWeights)
  {
    Actions.dispatch.cards.score.changeWeights(this.props.card, newWeights);
  }
  
  handleWeightKeyChange(event)
  {
    var key = event.target.value;
    var index = ReactDOM.findDOMNode(event.target).getAttribute('rel');
    
    var newWeights = this.props.card.weights;
    newWeights[index]['key'] = key;
    
    Actions.dispatch.cards.score.changeWeights(this.props.card, newWeights);
  }
  
  renderWeight(weight, index) 
  {
    var layout = 
    {
      colPadding: 12,
      columns:
      [
        {
          content: <input type='text' 
            rel={index}
            defaultValue={weight.key}
            onBlur={this.handleWeightKeyChange}
            placeholder='Variable or field name' />
        },
        {
          content: <Weighter 
            weights={this.props.card.weights} 
            onChange={this.handleWeightsChange}
            weightIndex={index} />  
        }
      ]
    }
    return (
      <CardField key={index}>
        <LayoutManager layout={layout} />
      </CardField>
    );
  }
  
  handleOutputChange(event)
  {
    Actions.dispatch.cards.score.change(this.props.card, this.props.card.method, event.target.value);
  }
  
  handleMethodChange(index: number)
  {
    Actions.dispatch.cards.score.change(this.props.card, methods[index], this.props.card.output); 
  }
  
  renderHeader()
  {
    var headerLayout = 
    {
      colPadding: 12,
      columns: 
      [
        {
          content: <Dropdown 
            onChange={this.handleMethodChange}
            options={methods}
            selectedIndex={methods.indexOf(this.props.card.method)} />
        },
        {
          content: <input type='text' value={this.props.card.output} onChange={this.handleOutputChange} />
        }
      ]
    }
    
    return (
      <CardField>
        <LayoutManager layout={headerLayout} />
      </CardField>
    );
  }

  render()
  {
    return (
      <div>
        {
          this.renderHeader()
        }
        {
          this.props.card.weights.map(this.renderWeight)
        }
      </div>
    );
  }
};

export default ScoreCard;