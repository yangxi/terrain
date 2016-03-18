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

require('./CardField.less');
import * as React from 'react';
import Util from '../../util/Util.tsx';
import PanelMixin from '../layout/PanelMixin.tsx';

var FIELD_HEIGHT = 32;
var STANDARD_MARGIN = 6;

var CardField = React.createClass({
	mixins: [PanelMixin],

	propTypes:
	{
		value: React.PropTypes.string,
		onDelete: React.PropTypes.func,
    removable: React.PropTypes.bool,
    draggable: React.PropTypes.bool,
    onChange: React.PropTypes.func,
    index: React.PropTypes.number,
    height: React.PropTypes.number,
    rightContent: React.PropTypes.node,
	},

	getDefaultProps():any 
	{
		return {
			drag_x: false,
			drag_y: false,
			dragInsideOnly: true,
			reorderOnDrag: true,
			value: '',
			handleRef: 'handle',
		};
	},
  
  componentDidMount()
  {
    // $(this.refs.panel).height(0);
    Util.animateToAutoHeight(this.refs.panel);
  },

	willReceiveNewProps(newProps)
	{
		this.setState({
			value: newProps.value,
		});
	},

	getInitialState()
	{
		return {
			value: this.props.value,
		};
	},

	handleChange(event)
	{
		this.setState({
			value: event.target.value,
		});

		this.props.onChange(event.target.value);
	},

	deleteField(event)
	{
		if(typeof this.props.onDelete === 'function')
		{
      Util.animateToHeight(this.refs.panel, 0, () =>
			  this.props.onDelete(this.props.index));
		}
	},

	render() {
		var leftContent;
		var rightContent;
		if(this.props.draggable)
		{
			leftContent = (
				<div className='card-field-handle' ref='handle'>⋮⋮</div>
			);
		}
    else if(this.props.leftContent)
    {
      leftContent = this.props.leftContent;
    }
    
		if(this.props.removable)
		{
			rightContent = (
				<div className='card-field-delete' onClick={this.deleteField}>&times;</div>
			);
		}
    
    if(this.props.rightContent)
    {
      rightContent = this.props.rightContent;
    }

		return this.renderPanel((
			<div className={Util.objToClassname({
          'card-field': true,
          'card-field-no-left': this.props.noLeft,
        })}
        style={{ height: this.props.height }}
        ref='cardField'
        >
        { leftContent ? (
  				<div className='card-field-tools-left'>
            <div className='card-field-tools-left-inner'>
              { leftContent }
            </div>
          </div>
        ) : null }
				<div className='card-field-inner' >
					{ this.props.children }
				</div>
        { rightContent ? (
				<div className='card-field-tools-right'>
          <div className='card-field-tools-right-inner'>
            { rightContent }
          </div>
        </div>
        ) : null }
			</div>
			), 'card-field-panel-wrapper');
	},
});

export default CardField;