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

// tslint:disable:restrict-plus-operands strict-boolean-expressions

import * as Immutable from 'immutable';
import './TransformCardPeriscope.less';
const { Map, List } = Immutable;
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Autocomplete from 'common/components/Autocomplete';
// import BuilderTextbox from '../../../common/components/BuilderTextbox';
import TerrainComponent from '../../../common/components/TerrainComponent';
import Util from '../../../util/Util';
import Actions from '../../data/BuilderActions';
import Periscope from './Periscope';
import { Bar, Bars } from './TransformCard';


export interface Props
{
  barsData: Bars;
  maxDomain: List<number>;
  domain: List<number>;
  range: List<number>;
  onDomainChange: (domain: List<number>) => void;
  keyPath: KeyPath;
  canEdit: boolean;
  width: number;
  language: string;
  colors: [string, string];
}

const MAX_BARS = 100;
const EMPTY_OPTIONS = List([]);

class TransformCardPeriscope extends TerrainComponent<Props>
{
  public state: {
    initialDomain: List<number>,
    chartState: IMMap<string, any>,
    initialVal: number,
    bars: Bars,
    maxDomainLow: number,
    maxDomainHigh: number,
    maxDomainLowErrorText: string,
    maxDomainHighErrorText: string,
  } = {
    chartState: null,
    initialDomain: null,
    initialVal: 0,
    bars: null,
    maxDomainLow: this.props.maxDomain.get(0),
    maxDomainHigh: this.props.maxDomain.get(1),
    maxDomainLowErrorText: '',
    maxDomainHighErrorText: '',
  };

  public refs: {
    [k: string]: Ref;
    chart: Ref;
  };

  constructor(props: Props)
  {
    super(props);
    this.state.bars = this.formatBars(props.barsData);
  }

  public formatBars(bars: Bars): Bars
  {
    if (bars.size > MAX_BARS)
    {
      let newBars: Bars = List([]);
      const min = bars.first().range.min;
      const max = bars.last().range.max;

      bars.map((bar: Bar) =>
      {
        const b = Math.floor((bar.range.min - min) / (max - min) * MAX_BARS);
        const newBar: Bar = newBars.get(b);
        if (!newBar)
        {
          newBars = newBars.push(JSON.parse(JSON.stringify(bar)));
        }
        else
        {
          newBar.count += bar.count;
          newBar.percentage += bar.percentage;
          newBar.range.max = bar.range.max;
          newBars = newBars.set(b, newBar);
        }
      });
      return newBars;
    }
    return bars;
  }

  public componentDidMount()
  {
    const el = ReactDOM.findDOMNode(this.refs.chart);
    const chartState = this.getChartState();

    this.setState({
      chartState,
    });
    Periscope.create(el, chartState.toJS());
  }

  public componentWillReceiveProps(nextProps: Props)
  {
    if (this.shouldComponentUpdate(nextProps, this.state))
    {
      let bars = this.state.bars;
      if (nextProps.barsData !== this.props.barsData)
      {
        bars = this.formatBars(nextProps.barsData);
        this.setState({
          bars,
        });
      }
      this.update(_.extend({}, nextProps, { bars }));
    }
  }

  public update(overrideState?)
  {
    const el = ReactDOM.findDOMNode(this.refs.chart);
    Periscope.update(el, this.getChartState(overrideState).toJS());
  }

  public handleDomainChangeStart(initialVal)
  {
    this.setState({
      initialDomain: this.props.domain,
      initialVal,
    });
  }

  public handleDomainChange(handleIndex, newVal)
  {
    let domain =
      this.state.initialDomain.set(handleIndex,
        this.state.initialDomain.get(handleIndex) + newVal - this.state.initialVal,
      );

    const { maxDomain } = this.props;
    const buffer = (maxDomain.get(1) - maxDomain.get(0)) * 0.01;
    domain = domain.set(0,
      Util.valueMinMax(domain.get(0), maxDomain.get(0), this.state.initialDomain.get(1) - buffer),
    );
    domain = domain.set(1,
      Util.valueMinMax(domain.get(1),
        this.state.initialDomain.get(0) + buffer,
        maxDomain.get(1)),
    );
    this.props.onDomainChange(domain);
    this.update({
      domain,
    });
  }

  public handleDomainTextChange()
  {
    Actions.change(this._ikeyPath(this.props.keyPath, 'hasCustomDomain'), true);
  }

  public handleDomainLowChange(value)
  {
    this.setState({
      maxDomainLow: value,
    });
    Actions.change(this._ikeyPath(this.props.keyPath, 'domain', 0), value);
    this.handleDomainTextChange();
  }

  public handleDomainHighChange(value)
  {
    this.setState({
      maxDomainHigh: value
    });
    Actions.change(this._ikeyPath(this.props.keyPath, 'domain', 1), value);
    this.handleDomainTextChange();
  }

  public validateDomainLowValue(value)
  {
    if (isNaN(value))
    {
     this.setState({
       maxDomainLowErrorText: 'Must be a number',
     });
     return false;
    }
    else if (value >= this.props.maxDomain.get(1))
    {
      this.setState({
        maxDomainLowErrorText: 'Must be less than the maximum view range',
      });
      return false;
    }
    else
    {
      this.setState({
        maxDomainLowErrorText: '',
      });
      return true;
    }
  }

  public validateDomainHighValue(value)
  {
    if (isNaN(value))
    {
     this.setState({
       maxDomainHighErrorText: 'Must be a number',
     });
     return false;
    }
    else if (value <= this.props.maxDomain.get(0))
    {
      this.setState({
        maxDomainHighErrorText: 'Must be greater than the minimum view range',
      });
      return false;
    }
    else
    {
      this.setState({
        maxDomainHighErrorText: '',
      });
      return true;
    }
  }

  public getChartState(overrideState = {}): IMMap<string, any>
  {
    const chartState = Map<string, any>({
      barsData: (overrideState['bars'] || this.state.bars).toJS(),
      maxDomain: (overrideState['maxDomain'] || this.props.maxDomain).toJS(),
      domain: {
        x: (overrideState['domain'] || this.props.domain).toJS(),
        y: (overrideState['range'] || this.props.range).toJS(),
      },
      onDomainChange: this.handleDomainChange,
      onDomainChangeStart: this.handleDomainChangeStart,
      width: (overrideState && overrideState['width']) || this.props.width,
      height: 40,
      colors: this.props.colors,
    });

    return chartState;
  }

  public componentWillUnmount()
  {
    const el = ReactDOM.findDOMNode(this.refs.chart);
    Periscope.destroy(el);
  }

  public render()
  {
    return (
      <div className='transform-periscope-wrapper'>
        <div ref='chart' />

        <div className='tp-text-wrapper'>
          <div className= 'tp-tb-left'>
            <Autocomplete
              // value={this.props.maxDomain.get(0)}
              value={this.state.maxDomainLow.toString()}
              options={EMPTY_OPTIONS}
              // validateValue={this.validateDomainLowValue}
              // typeErrorMessage={this.state.maxDomainLowErrorText}
              // help={'Edit the chart view range'}
              disabled={!this.props.canEdit}
              onChange={this.handleDomainLowChange}
            />
          </div>
          <div className='tp-tb-right'>
            <Autocomplete
              // value={this.props.maxDomain.get(1)}
              value={this.state.maxDomainHigh.toString()}
              options={EMPTY_OPTIONS}
              // validateValue={this.validateDomainHighValue}
              // typeErrorMessage={this.state.maxDomainHighErrorText}
              disabled={!this.props.canEdit}
              onChange={this.handleDomainHighChange}
            />
          </div>
        </div>

      </div>
    );
  }
}
export default TransformCardPeriscope;
