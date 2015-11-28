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

// Style
require("./GeneralStyle.less");

// Libraries
var React = require("react");
var ReactDOM = require("react-dom");

// Data
var Store = require("./data/Store.js");
var Actions = require("./data/Actions.js");

// Components
var LayoutManager = require("./components/layout/LayoutManager.js");
var PanelPlaceholder = require("./components/layout/PanelPlaceholder.js");
var Card = require("./components/cards/Card.js");
var Input = require("./components/inputs/Input.js");
var Result = require("./components/results/Result.js");


var App = React.createClass({

  getInitialState () {
    Store.subscribe(() => {
      this.setState(Store.getState());
    });

    return Store.getState();
  },

  render () {
    var cards = this.state.cards;
    var inputs = this.state.inputs;
    var results = this.state.results;

  	var layout = {
  		stackAt: 650,
  		columns: [
  			{
  				reorderable: true,
  				rows: inputs.map((input) => 
            ({
              content: <Input data={input} />
            })),
          moveTo: (curIndex, newIndex) =>
          {
            Actions.dispatch.moveInput(curIndex, newIndex);
          }
  			},
  			{
  				colSpan: 2,
  				reorderable: true,
  				rows: cards.map((card) =>
            ({
              content: <Card name={card.name} data={card} />
            })),
          moveTo: (curIndex, newIndex) =>
          {
            Actions.dispatch.cards.move(curIndex, newIndex);
          }
  			},
  			{
  				reorderable: true,
  				cellHeight: 150,
  				cellWidth: {
  					0: 1,
  					300: 2,
  					650: 1,
  					1200: 2,
  					1850: 3,
  					2400: 4,
  				},
  				cells: results.map((result) => ({
              content: <Result data={result} />
            })),
          moveTo: (curIndex, newIndex) =>
          {
            Actions.dispatch.moveResult(curIndex, newIndex);
          }
  			},
  		]
  	};

    return (
      <LayoutManager layout={layout} />
    );
  }

});

ReactDOM.render(<App />, document.getElementById('app'), function () {
  // require('./tests').run(this);
  // TODO: tests here.
});