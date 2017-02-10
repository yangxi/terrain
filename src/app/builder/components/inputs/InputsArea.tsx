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

import * as _ from 'underscore';
import * as React from 'react';
import * as Immutable from 'immutable';
import Util from '../../../util/Util';
import PanelMixin from '../layout/PanelMixin';
import Actions from "../../data/BuilderActions";
import Input from "../inputs/Input";
import LayoutManager from "../layout/LayoutManager";
import CreateLine from '../../../common/components/CreateLine';
import InfoArea from '../../../common/components/InfoArea';
import PureClasss from '../../../common/components/PureClasss';
import BuilderTypes from '../../BuilderTypes';
type IInput = BuilderTypes.IInput;

interface Props
{
  inputs: List<IInput>;
  canEdit: boolean;
}

class InputsArea extends PureClasss<Props>
{
  createInput()
  {
    Actions.create(Immutable.List(['query', 'inputs']), -1, 'input');
  }
  
  renderNoInputs()
  {
    var large = ""; // "No inputs have been added, yet."
    var button =  this.props.canEdit ? "Add an Input" : null;
    var onClick = this.createInput;
    
    return (
      <InfoArea 
        large={large} 
        button={button} 
        onClick={onClick} 
      />
    );
  }
  
  render()
  {
    if(this.props.inputs.size === 0)
    {
      return this.renderNoInputs();
    }
    
    return (
      <div className='inputs-area'>
        {
          this.props.inputs.map((input, index) =>
            <Input
              input={input}
              index={index}
              canEdit={this.props.canEdit}
              key={input.id}
            />
          )
        }
        
        <div className='standard-margin'>
          {
            this.props.canEdit &&
              <CreateLine 
                open={false} 
                onClick={this.createInput}
              />
          }
        </div>
      </div>
    );
  }
}

export default InputsArea;