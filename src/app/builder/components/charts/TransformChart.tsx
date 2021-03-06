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

// Copyright 2018 Terrain Data, Inc.

// tslint:disable:no-invalid-this restrict-plus-operands radix strict-boolean-expressions no-var-requires only-arrow-functions no-console variable-name max-line-length no-unused-expression no-shadowed-variable

import './TransformChart.less';

import { Colors } from '../../../colors/Colors';

// consider upgrading to v4 which has types
const d3 = require('d3');
const moment = require('moment');
// import * as d3 from 'd3';
import * as $ from 'jquery';
import * as _ from 'lodash';

import ElasticBlockHelpers from '../../../../database/elastic/blocks/ElasticBlockHelpers';
import MapUtil from '../../../util/MapUtil';
import TransformUtil, { NUM_CURVE_POINTS } from '../../../util/TransformUtil';
import Util from '../../../util/Util';

const xMargin = 45;
const yMargin = 10;

const scaleMin = (scale) => scale.range()[0];
const scaleMax = (scale) => scale.range()[scale.range().length - 1];
const scaleDomainMin = (scale) => scale.domain()[0];
const scaleDomainMax = (scale) => scale.domain()[scale.domain().length - 1];

const TransformChart = {

  create(el, state)
  {
    d3.select(el).attr('class', 'transform-chart-wrapper');

    const svg = d3
      .select(el)
      .append('svg')
      .attr('class', 'transform-chart')
      .attr('width', state.width)
      .attr('height', state.height)
      .attr('viewBox', '0 0 ' + state.width + ' ' + state.height)
      ;

    svg.append('rect')
      .attr('class', 'bg')
      .attr('fill', Colors().blockBg);

    svg.append('g')
      .attr('class', 'yLeftAxis');
    svg.append('g')
      .attr('class', 'yRightAxis');
    svg.append('g')
      .attr('class', 'bottomAxis');

    const innerSvg = svg.append('svg')
      .attr('class', 'inner-svg')
      .attr('x', xMargin)
      .attr('y', yMargin);

    // points can extend beyond the overflow: hidden of the inner-svg
    // so they need their own special svg to match
    const innerSvgPoints = svg.append('svg')
      .attr('class', 'inner-svg-points')
      .attr('x', xMargin)
      .attr('y', yMargin);

    // need a transparent filling background so that the touchmove events on inner-svg register as expected
    innerSvg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('opacity', 0);

    innerSvg.append('g')
      .append('path')
      .attr('class', 'lines-bg')
      .attr('fill', state.colors[0]);
    innerSvg.append('g')
      .attr('class', 'bars');

    innerSvg.append('g')
      .append('path')
      .attr('class', 'lines')
      .attr('style', 'stroke: ' + state.colors[0]);

    innerSvgPoints.append('g')
      .attr('class', 'points');

    innerSvg.append('g')
      .attr('class', 'spotlight-bgs');

    innerSvg.append('g')
      .attr('class', 'spotlights');

    this.update(el, state);

    // apply CSS styles

    const styleCSS = `
    .transform-chart .tick {
      stroke: ${Colors().blockOutline};
    }
    .transform-chart .tick text {
      fill: ${Colors().fontColorLightest} !important;
    }
    `;
    const style = $(el).append(`<style>${styleCSS}</style>`);
  },

  update(el, state)
  {
    d3.select(el)
      .select('.transform-chart')
      .attr('width', state.width)
      .attr('height', state.height)
      .attr('viewBox', '0 0 ' + state.width + ' ' + state.height);

    if (!state._cache)
    {
      state._cache = {};
    }
    if (state._cache.domain !== state.domain
      || state._cache.barsData !== state.barsData)
    {
      // compute barsData and cache
      const computedBarsData = this._precomputeBarsData(state.barsData, state.domain);
      state._cache.domain = state.domain;
      state._cache.barsData = state.barsData;
      state._cache.computedBarsData = computedBarsData;
    }

    const barsData = state._cache.computedBarsData;
    const scales = this._scales(el, state.domain, barsData, state.width, state.height);

    this._draw(el, scales, barsData, state.pointsData, state.onMove, state.onRelease,
      state.spotlights, state.inputKey, state.onLineClick, state.onLineMove, state.onSelect,
      state.onCreate, state.onDelete, state.onPointMoveStart, state.width, state.height,
      state.canEdit, state.domain, state.mode, state.colors, state.schema, state.builder,
      state.index, state.distanceValue, state.inputs);

    d3.select(el).select('.inner-svg').on('mousedown', () =>
    {
      d3.select(el).select('.right-menu').remove();
      d3.select(el).selectAll('.crosshairs').remove();
      d3.select(el).selectAll('.transform-tooltip').remove();
    });

    const drawMenu = this._drawMenu;
    const drawCrossHairs = this._drawCrossHairs;
    if (state.canEdit)
    {
      // Keep track of what element is in focus (for key events)
      let currentObject = this;
      d3.select(el).select('.transform-card').on('mouseover', function() { currentObject = this; });
      d3.select(el).select('.transform-card').on('mouseout', () => { currentObject = null; });

      // Draw Point + menu on double click
      d3.select(el).select('.inner-svg').on('dblclick', function()
      {
        // Only allow point creation in linear mode (other modes have set # of points)
        if (state.mode === 'linear')
        {
          const isvg = d3.select(el).select('.inner-svg');
          state.onCreate(
            scales.x.invert(d3.mouse(this)[0] + parseInt(isvg.attr('x'), 10)),
            scales.realPointY.invert(d3.mouse(this)[1] + parseInt(isvg.attr('y'), 10)),
          );
        }
        else
        {
          const popup = d3.select(el).select('.inner-svg').append('g')
            .attr('class', 'popup');
          const containerWidth = d3.select(el).select('.bg').node().getBBox().width;
          // 195 is the width of the text, used to center it in the contianer
          const x = (containerWidth - 195) / 2;
          popup.append('text')
            .attr('x', x > 0 ? x : 100)
            .attr('y', 15)
            .attr('fill', 'red')
            .text('Cannot add points in this mode')
            ;
          setTimeout(() =>
          {
            d3.select(el).select('.popup').remove();
          }, 1300);
        }
        return false;
      });

      // Draw crosshairs when shift/ctrl is pressed
      d3.select(el).select('.inner-svg').on('mousemove', function()
      {
        if (d3.event['ctrlKey'] || d3.event['shiftKey'])
        {
          drawCrossHairs(el, d3.mouse(this), scales, d3.mouse(this)[0], undefined, state.colors);
        }
        return false;
      });

      d3.select('body').on('keyup', () =>
      {
        // CTRL: 17, SHIFT: 16, ALT: 18, WIN/CMD: 91
        if (currentObject && (d3.event['keyCode'] === 17 || d3.event['keyCode'] === 16))
        {
          d3.select(el).selectAll('.crosshairs').remove();
        }
      });

      d3.select(el).select('.inner-svg').on('contextmenu',
        this._rightClickChartFactory(
          el,
          state.contextOptions,
          scales,
          state.colors,
        ),
      );

      // Delete selected points on del/backspace key press
      const deletePoints = this._deletePoints;
      d3.select('body').on('keydown', () =>
      {
        if (
          currentObject &&
          (d3.event['keyCode'] === 46 || d3.event['keyCode'] === 8) // delete/backspace key
          && !$('input').is(':focus')
          && state.mode === 'linear'
        )
        {
          d3.event['preventDefault']();
          d3.event['stopPropagation']();
          d3.select('.transform-tooltip').remove();
          deletePoints(el, state.onDelete);
        }
        if (
          currentObject &&
          (d3.event['keyCode'] === 46 || d3.event['keyCode'] === 8) // delete/backspace key
          && !$('input').is(':focus')
          && state.mode !== 'linear'
        )
        {
          const popup = d3.select(el).select('.inner-svg').append('g')
            .attr('class', 'popup');
          const containerWidth = d3.select(el).select('.bg').node().getBBox().width;
          // 211 is the width of the text, used to center it in the container
          const x = (containerWidth - 211) / 2;
          popup.append('text')
            .attr('x', x > 0 ? x : 100)
            .attr('y', 15)
            .attr('fill', 'red')
            .text('Cannot delete points in this mode')
            ;
          setTimeout(() =>
          {
            d3.select(el).select('.popup').remove();
          }, 1300);
        }
      });
    }
  },

  destroy(el)
  {
    // cleanup here
  },

  // "private" stuff

  _precomputeBarsData(oBarsData, domain)
  {
    const maxBars = 15;
    const minBars = 8;

    if (oBarsData.length < maxBars)
    {
      return oBarsData;
    }

    const domainWidth = domain.x[1] - domain.x[0];
    // let stepSize = parseFloat(d3.format('.1g')(Math.log(domainWidth / minBars)));
    const stepSize = domainWidth / 12;

    const newBars = oBarsData.reduce((newBars, bar) =>
    {
      if (newBars.length === 0)
      {
        return [bar];
      }

      const lastBar = newBars[newBars.length - 1];
      if (bar.range.min < lastBar.range.min + stepSize)
      {
        newBars[newBars.length - 1] =
          {
            count: lastBar.count + (isNaN(bar.count) ? 0 : bar.count),
            percentage: lastBar.percentage + (isNaN(bar.percentage) ? 0 : bar.percentage),
            id: lastBar.id + bar.id,
            range:
            {
              min: lastBar.range.min,
              max: bar.range.max,
            },
          };

      }
      else
      {
        newBars.push(bar);
      }

      return newBars;
    }, []);

    return newBars;
  },

  _drawBg(el, scales)
  {
    d3.select(el).select('.bg')
      .attr('x', scaleMin(scales.x))
      .attr('width', scaleMax(scales.x) - scaleMin(scales.x))
      .attr('y', scaleMax(scales.pointY))
      .attr('height', scaleMin(scales.pointY) - scaleMax(scales.pointY));
  },

  _drawDisabledOverlay(el, scales)
  {
    d3.select(el).select('.inner-svg').select('.overlay').remove();
    d3.select(el).select('.inner-svg').select('.no-point-overlay').remove();
    const overlay = d3.select(el).select('.inner-svg').append('g')
      .attr('class', 'overlay');

    const width = scaleMax(scales.x) - scaleMin(scales.x);
    const height = scaleMin(scales.pointY) - scaleMax(scales.pointY);
    const containerWidth = d3.select(el).select('.bg').node().getBBox().width;
    const x = (containerWidth - 279) / 2;
    overlay.append('rect')
      .attr('x', 0)
      .attr('width', width)
      .attr('y', 0)
      .attr('height', height)
      .attr('fill', Colors().bg1)
      .attr('opacity', 0.5);

    overlay.append('text')
      .attr('x', x >= 0 ? x : 10)
      .attr('y', height / 2)
      .attr('text-anchor', 'start')
      .attr('fill', Colors().text1)
      .text('Select an input field using the textbox above to begin');
  },

  _overlayMouseoverFactory: (el) => (overlay) =>
  {
    d3.select(el).select('.inner-svg').select('.no-point-overlay').remove();
  },

  _overlayMouseoutFactory: (el, scales, drawNoPointsOverlay) => (overlay) =>
  {
    drawNoPointsOverlay(el, scales);
    return false;
  },

  _drawNoPointsOverlay(el, scales)
  {
    d3.select(el).select('.inner-svg').select('.overlay').remove();
    d3.select(el).select('.inner-svg').select('.no-point-overlay').remove();
    const overlay = d3.select(el).select('.inner-svg').append('g')
      .attr('class', 'no-point-overlay');

    const width = scaleMax(scales.x) - scaleMin(scales.x);
    const height = scaleMin(scales.pointY) - scaleMax(scales.pointY);
    const containerWidth = d3.select(el).select('.bg').node().getBBox().width;
    const x = (containerWidth - 296) / 2;

    overlay.append('rect')
      .attr('x', 0)
      .attr('width', width)
      .attr('y', 0)
      .attr('height', height)
      .attr('fill', Colors().bg1)
      .attr('opacity', 0.5);

    overlay.append('text')
      .attr('x', x >= 0 ? x : 10)
      .attr('y', height / 2)
      .attr('text-anchor', 'start')
      .attr('fill', Colors().text1)
      .text('Double click anywhere on the graph to add a Transform point');

    const self = this;
    overlay.on('mouseout', this._overlayMouseoutFactory(el, scales, self._drawNoPointsOverlay));
    overlay.on('mouseover', this._overlayMouseoverFactory(el));
  },

  _drawAxes(el, scales, width, height, inputKey, isDate, isGeo)
  {
    const numSideTicks = height > 200 ? 10 : 5;
    let numBottomTicks = width > 500 ? 6 : 4;
    let bottomTickFormatFn = Util.formatNumber;
    let bottomAxesName = () => inputKey === '_score' ? 'Match Quality' : inputKey;
    if (isDate)
    {
      numBottomTicks = 3;
      bottomTickFormatFn = (n: number): string => moment(new Date(n)).format('YYYY-MM-DD');
    }

    if (isGeo)
    {
      bottomTickFormatFn = (n: number): string => Util.formatNumber(n) + ' mi';
      bottomAxesName = () => 'Distance from ' + inputKey;
    }

    const yLeftAxis = d3.svg.axis()
      .scale(scales.pointY)
      .ticks(numSideTicks)
      .tickSize(scaleMin(scales.x) - scaleMax(scales.x), scaleMin(scales.x) - scaleMax(scales.x))
      .tickFormat(Util.formatNumber)
      .orient('left');
    d3.select(el).select('.yLeftAxis')
      .attr('transform', 'translate(' + xMargin + ',0)')
      .call(yLeftAxis);

    const yRightAxis = d3.svg.axis()
      .scale(scales.barY)
      .ticks(numSideTicks)
      .tickSize(0, 0)
      .tickFormat(Util.formatNumber) // try '%' if more precision is needed
      // .tickFormat(d3.format(" <-.2p")) // try '%' if more precision is needed
      .orient('right');
    d3.select(el).select('.yRightAxis')
      .attr('transform', 'translate(' + (scaleMax(scales.x)) + ',0)')
      .call(yRightAxis);

    // var bottomAxisTickFn: any = (tick, index: number): string => index == 0 || index == 10 ? "" : tick;
    const bottomAxis = d3.svg.axis()
      .scale(scales.x)
      .ticks(numBottomTicks)
      .tickSize(-1 * scaleMin(scales.pointY) + scaleMax(scales.pointY), -1 * scaleMin(scales.pointY) + scaleMax(scales.pointY))
      .tickFormat(bottomTickFormatFn)
      .orient('bottom');
    d3.select(el).select('.bottomAxis')
      .attr('transform', 'translate(0, ' + scaleMin(scales.pointY) + ')')
      .call(bottomAxis)
      .selectAll('text')
      .style('text-anchor', (d) =>
      {
        if (d === scales.x.domain()[0])
        {
          return 'start';
        }
        if (d === scales.x.domain()[1])
        {
          return 'end';
        }
        return 'middle';
      });

    d3.select(el).select('.bottom-title').remove();
    d3.select(el).select('.left-title').remove();

    d3.select(el).select('.bottomAxis')
      .append('text')
      .attr('class', 'bottom-title')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(' + width / 2 + ',80)')
      .style('fill', Colors().fontColorLightest)
      .text(bottomAxesName);

    d3.select(el).select('.yLeftAxis')
      .append('text')
      .attr('class', 'left-title')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(-30,' + height / 2 + ')rotate(-90)')
      .style('fill', Colors().fontColorLightest)
      .text('Score');

  },

  _roundedRect(x, y, w, h, r)
  {
    let retval;
    retval = 'M' + (x + r) + ',' + y;
    retval += 'h' + (w - 2 * r);
    retval += 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r;
    retval += 'v' + (h - 2 * r);
    retval += 'v' + r; retval += 'h' + -r;
    retval += 'h' + (2 * r - w);
    retval += 'h' + -r; retval += 'v' + -r;
    retval += 'v' + (2 * r - h);
    retval += 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + -r;
    retval += 'z';
    return retval;
  },

  _drawBars(el, scales, barsData, colors)
  {
    const g = d3.select(el).selectAll('.bars');

    const bar = g.selectAll('.bar')
      .data(barsData, (d) => d['id']);

    const xPadding = 5;
    const radius = 3;
    const barEnter = bar.enter()
      .append('g')
      .attr('class', 'bar');

    barEnter.append('path')
      .attr('class', 'bar-path');
    barEnter.append('text')
      .attr('class', 'bar-percentage');

    bar.select('.bar-path')
      .attr('d', function(d)
      {
        return TransformChart._roundedRect
          (scales.realX(d['range']['min']) + xPadding,
          scales.realBarY(d['percentage']),
          Math.max(1, scales.realX(d['range']['max']) - scales.realX(d['range']['min']) - 2 * xPadding),
          scaleMin(scales.realBarY) - scales.realBarY(d['percentage']),
          radius);
      })
      .attr('fill', colors[0])
      ;

    const textX = (d) =>
    {
      let width = scales.realX(d['range']['max']) - scales.realX(d['range']['min']) - 2 * xPadding;
      if (width < 1)
      {
        width = 1;
      }
      let offset = 7;
      if (d['percentage'] * 100 < 10)
      {
        offset = 3;
      }
      return scales.realX(d['range']['min']) + width / 2 - offset;
    };

    const textY = (d) =>
    {
      if (d['percentage'] * 100 >= 5)
      {
        return scales.realBarY(d['percentage']) + 20;
      }
      return scales.realBarY(d['percentage']) - 5;
    };

    const textColor = (d) =>
    {
      if (d['percentage'] * 100 >= 5)
      {
        return Colors().fontWhite;
      }
      return Colors().fontColor2;
    };

    bar.select('.bar-percentage')
      .attr('x', textX)
      .attr('y', textY)
      .attr('fill', textColor)
      .text((d) => Math.round(d['percentage'] * 100) + '%');
    bar.exit().remove();
  },

  _drawSpotlights(el, scales, spotlights, inputKey, pointsData, barsData,
    pointFn, mode, domainMin, domainMax, isDate, isGeo, distanceValue, inputs)
  {
    const g = d3.select(el).selectAll('.spotlights');

    const spotlight = g.selectAll('.spotlight')
      .data(
        spotlights
          .filter((d) => d['fields'][inputKey] !== undefined)
          .sort((d, b) => d['rank'] - b['rank']),
        (d) => d['fields']['_id'],
    );
    const spotlightEnter = spotlight.enter()
      .append('g')
      .attr('class', 'spotlight')
      .attr('id', (d) => d['fields']['_id']);
    spotlightEnter.append('circle');
    spotlightEnter.append('text').attr('class', 'spotlight-rank');
    spotlightEnter.append('rect');
    spotlightEnter.append('text').attr('class', 'spotlight-tooltip');

    const minX = scaleDomainMin(scales.realX);
    const maxX = scaleDomainMax(scales.realX);
    const getSpotlightX = (d) =>
    {
      if (isDate)
      {
        return Util.valueMinMax(Date.parse(d['fields'][inputKey]), minX, maxX);
      }
      else if (isGeo)
      {
        if (!distanceValue)
        {
          return minX;
        }
        const loc = MapUtil.getCoordinatesFromGeopoint(d['fields'][inputKey]);
        if (distanceValue.address && distanceValue.address.charAt(0) === '@')
        {
          if (inputs[distanceValue.address])
          {
            const distance = MapUtil.distance(
              loc,
              MapUtil.getCoordinatesFromGeopoint(inputs[distanceValue.address]),
            );
            return Util.valueMinMax(distance, minX, maxX);
          }
          else
          {
            // Maybe its a parent field, try getting field from parent obj
            const keyPath = distanceValue.address.split('.');
            if (keyPath.length > 1)
            {
              let parentLoc = d['parentHit'];
              for (let i = 1; i < keyPath.length; i++)
              {
                if (!parentLoc)
                {
                  break;
                }
                parentLoc = parentLoc[keyPath[i]];
              }
              if (parentLoc !== null && parentLoc !== undefined)
              {
                const distance = MapUtil.distance(
                  loc,
                  MapUtil.getCoordinatesFromGeopoint(parentLoc),
                );
                return Util.valueMinMax(distance, minX, maxX);
              }
            }
          }
        }
        if (distanceValue.location)
        {
          const distance = MapUtil.distance(loc, distanceValue.location);
          return Util.valueMinMax(distance, minX, maxX);
        }
        return minX;
      }
      return Util.valueMinMax(d['fields'][inputKey], minX, maxX);
    };

    const SPOTLIGHT_SIZE = 12;
    const SPOTLIGHT_PADDING = 6;
    const INITIAL_OFFSET = 27;
    const OFFSET = SPOTLIGHT_SIZE + SPOTLIGHT_PADDING;
    const TOOLTIP_BG_PADDING = 6;

    const SPOTLIGHT_SPACING = SPOTLIGHT_SIZE + SPOTLIGHT_PADDING * 2;

    const ys: _.Dictionary<{ y: number, offset: number, x: number }> = {};
    const textYs: _.Dictionary<{ y: number, offset: number, x: number }> = {};
    const idToY = {};
    const xToBucket = {};
    const getBucket = (d) =>
    {
      const x = getSpotlightX(d);
      if (xToBucket[x] === undefined)
      {
        const rx = scales.realX(getSpotlightX(d));
        let bucket = null;
        _.map(ys, (g, b) =>
        {
          if (Math.abs(scales.realX(g.x) - rx) < SPOTLIGHT_SPACING)
          {
            bucket = b;
          }
        });

        if (bucket !== null)
        {
          xToBucket[x] = bucket;
        }
        else
        {
          return x;
        }
      }
      return xToBucket[x];
    };

    const getSpotlightY = (d, text = false) =>
    {
      const x = getSpotlightX(d);
      const bucket = getBucket(d);

      if (!text && ys[bucket])
      {
        ys[bucket].offset += OFFSET;
      }
      else if (text && textYs[bucket])
      {
        textYs[bucket].offset += OFFSET;
      }
      else
      {
        // Consider using Binary Search to speed this up
        let i = 1;
        while (pointsData[i] && pointsData[i]['x'] < x)
        {
          i++;
        }

        let yVal = 0;
        if (mode === 'linear')
        {
          const first = pointsData[i - 1];
          const second = pointsData[i];
          if (first && second)
          {
            const distanceRatio = (x - first['x']) / (second['x'] - first['x']);
            yVal = first['y'] * (1 - distanceRatio) + second['y'] * distanceRatio;
          }
          else if (first || second)
          {
            yVal = (first || second)['y'];
          }
        }
        else
        {
          yVal = pointFn(x, pointsData, domainMin, domainMax);
        }
        const y = scales.realPointY(yVal);
        if (text)
        {
          textYs[bucket] =
            {
              y,
              offset: INITIAL_OFFSET,
              x,
            };
        }
        else
        {
          ys[bucket] =
            {
              y,
              offset: INITIAL_OFFSET,
              x,
            };
        }
      }

      const finalY = text ? textYs[bucket].y - textYs[bucket].offset : ys[bucket].y - ys[bucket].offset;
      idToY[d['id']] = finalY;
      return finalY;
    };

    const fontSize = (d) =>
    {
      if (d['rank'] + 1 < 10)
      {
        return 'font-size: 10px;';
      }
      else if (d['rank'] + 1 < 100)
      {
        return 'font-size: 8px';
      }
      return 'font-size: 6px';
    };

    const getTextOffset = (d) =>
    {
      if (d['rank'] + 1 < 10)
      {
        return 3;
      }
      else if (d['rank'] + 1 < 100)
      {
        return 4;
      }
      return 5;
    };

    const isvg = d3.select(el).select('.inner-svg');

    const getFinalX = (d, offset = false) =>
    {
      if (!offset)
      {
        return scales.realX(ys[getBucket(d)].x);
      }
      const shift = getTextOffset(d);
      return scales.realX(ys[getBucket(d)].x) - shift;
    };

    spotlight
      .select('circle')
      .attr('cy', (d) => getSpotlightY(d))
      .attr('cx', (d) => getFinalX(d))
      .attr('fill', (d) => d['color'])
      .attr('r', (d) => SPOTLIGHT_SIZE / 2)
      ;

    spotlight.select('.spotlight-rank')
      .attr('x', (d) => getFinalX(d, true))
      .attr('y', (d) => getSpotlightY(d, true) + 4)
      .attr('fill', '#fff')
      .attr('style', fontSize)
      .text((d) => d['rank'] + 1);

    spotlight
      .select('.spotlight-tooltip')
      .text((d) => d['name'])
      .attr('class', (d) => 'spotlight-tooltip spotlight-tooltip-' + d['id'])
      .attr('y', (d) => idToY[d['id']] + 5)
      .attr('x', (d) => getFinalX(d) + SPOTLIGHT_SIZE / 2 + SPOTLIGHT_PADDING + 3)
      .attr('fill', (d) => Colors().fontColor2)
      .attr('style', 'font-size: 12px')
      ;

    spotlight
      .select('rect')
      .attr('class', (d) => 'spotlight-tooltip-bg spotlight-tooltip-bg-' + d['id'])
      .attr('y', (d) => idToY[d['id']] + 5 - 11 - TOOLTIP_BG_PADDING)
      .attr('height', TOOLTIP_BG_PADDING * 2 + 11)
      .attr('x', (d) => getFinalX(d) + SPOTLIGHT_SIZE / 2 + SPOTLIGHT_PADDING - TOOLTIP_BG_PADDING + 3)
      .attr('width', (d) => TOOLTIP_BG_PADDING * 2 + g.select('.spotlight-tooltip-' + d['id'])['node']()['getBBox']()['width'])
      .attr('fill', 'rgba(255,255,255,0.95)')
      .attr('rx', 6)
      .attr('ry', 6)
      ;

    const g2 = d3.select(el).selectAll('.spotlight-bgs');

    const bgData = _.map(ys, (y, k) =>
    {
      y['key'] = k;
      return y;
    });

    const spotlightBg = g2.selectAll('.spotlight-bg')
      .data(bgData, (d) => d['key']);

    spotlightBg.enter()
      .append('path')
      .attr('class', 'spotlight-bg');

    spotlightBg
      .attr('d', (d) => 'M' + scales.realX(d['x']) + ' ' + d['y'])
      .attr('fill', '#fff')
      .attr('stroke', '#ccc')
      .attr('stroke-width', '1px')
      .attr('d', (d) =>
      {
        const x = scales.realX(d['x']);
        const y = d['y'];
        const offset = d['offset'];
        const radius = SPOTLIGHT_SIZE / 2 + SPOTLIGHT_PADDING;
        let straightHeight = offset - radius * 2 - 2;
        if (straightHeight < 0)
        {
          straightHeight = 0;
        }
        const pinR = 5;

        let str = 'Mx y l -p -15 ' +
          'a r r 0 0 1 -' + (radius - pinR) + ' -r ' +
          'l 0 -h ' +
          'a r r 0 0 1 r -r ' +
          'a r r 0 0 1 r r ' +
          'l 0 h ' +
          'a r r 0 0 1 -' + (radius - pinR) + ' r ' +
          'l -p 15';

        str = str.replace(/x/g, x + '');
        str = str.replace(/y/g, y + '');
        str = str.replace(/h/g, straightHeight + '');
        str = str.replace(/r/g, radius + '');
        str = str.replace(/p/g, pinR + '');
        return str;
      })
      .attr('transform', (d) =>
      {
        const x = scales.realX(d['x']);
        const y = d['y'];
        const offset = d['offset'];
        if (y - offset < 10)
        {
          return 'rotate(180,' + x + ',' + y + ')';
        }
        return '';
      })
      ;

    spotlight
      .attr('transform', (d) =>
      {
        const bg = ys[getBucket(d)];
        const x = scales.realX(bg['x']);
        const y = bg['y'];
        const offset = bg['offset'];
        if (y - offset < 10)
        {
          return 'rotate(180,' + x + ',' + y + ')';
        }
        return '';
      });

    spotlight.selectAll('.spotlight-tooltip, rect')
      .attr('transform', (d) =>
      {
        let rotate = '0';
        let translateY = 0;
        let translateX = 0;

        const bg = ys[getBucket(d)];
        const x = scales.realX(bg['x']);
        const y = bg['y'];
        const offset = bg['offset'];

        if (y - offset < 10)
        {
          translateY = 2 * (y - idToY[d['id']]);
          rotate = '180,' + x + ',' + y;
        }

        const width = g.select('.spotlight-tooltip-bg-' + d['id'])['node']()['getBBox']()['width'];
        if (x + width > parseInt(isvg.attr('width'), 10))
        {
          translateX = -1 * width - SPOTLIGHT_SIZE - 2 * SPOTLIGHT_PADDING;
        }
        return 'rotate(' + rotate + ')translate(' + translateX + ',' + translateY + ')';
      });

    spotlight.selectAll('.spotlight-rank')
      .attr('transform', (d) =>
      {
        let rotate = '0';
        let translateY = 0;

        const bg = ys[getBucket(d)];
        const x = scales.realX(bg['x']);
        const y = bg['y'];
        const offset = bg['offset'];

        if (y - offset < 10)
        {
          translateY = 2 * (y - idToY[d['id']]);
          rotate = '180,' + x + ',' + y;
        }
        return 'rotate(' + rotate + ')translate(0,' + translateY + ')';
      });

    spotlight.exit().remove();
    spotlightBg.exit().remove();
  },

  // needs to be "function" for d3.mouse(this)
  _lineMousedownFactory: (el, onClick, scales, onMove, onRelease) => function(event)
  {
    const m = d3.mouse(this);
    const x = scales.realX.invert(m[0]);
    const y = scales.realPointY.invert(m[1]);
    onClick(x, y);

    const line = d3.select(this);
    const initialClasses = line.attr('class');
    line.attr('class', initialClasses + ' line-active');

    const t = this;
    const del = d3.select(el);

    const move = (event) =>
    {
      onMove(x, scales.realPointY.invert(d3.mouse(t)[1]));
    };
    del.on('mousemove', move);
    del.on('touchmove', move);

    const offFn = () =>
    {
      del.on('mousemove', null);
      del.on('touchmove', null);
      del.on('mouseup', null);
      del.on('touchend', null);
      del.on('mouseleave', null);
      line.attr('class', initialClasses);
      onRelease && onRelease();
    };

    del.on('mouseup', offFn);
    del.on('touchend', offFn);
    del.on('mouseleave', offFn);
  },

  _getLinesData(pointsData, scales, isFill)
  {
    const linesPointsData = _.clone(pointsData);
    if (linesPointsData.length)
    {
      const range = (scaleMax(scales.x) - scaleMin(scales.x));
      linesPointsData.unshift({
        x: scaleMin(scales.x) - range,
        y: linesPointsData[0].y,
        id: '*%*-first',
        dontScale: true,
      });
      if (isFill)
      {
        linesPointsData.unshift({
          x: scaleMin(scales.x) - range,
          y: -1,
          id: '*%*-first-anchor',
          dontScale: true,
        });
      }

      linesPointsData.push({
        x: scaleMax(scales.x) + range,
        y: linesPointsData[linesPointsData.length - 1].y,
        id: '*%*-last',
        dontScale: true,
      });
      if (isFill)
      {
        linesPointsData.push({
          x: scaleMax(scales.x) + range,
          y: -1,
          id: '*%*-last-anchor',
          dontScale: true,
        });
      }
    }
    return linesPointsData;
  },

  _drawParameterizedLines(el, scales, pointsData, onLineClick, onLineMove, onRelease, canEdit, domainMin, domainMax, getData)
  {
    const { ranges, outputs } = getData(100, pointsData, domainMin, domainMax);
    let data = ranges.map((x, i) =>
    {
      return { x, y: outputs[i], id: i, selected: false };
    });
    data = this._getLinesData(data, scales, true);

    const line = d3.svg.line()
      .x((d) =>
      {
        return d['dontScale'] ? d['x'] : scales.realX(d['x']);
      })
      .y((d) =>
      {
        return scales.realPointY(d['y']);
      });

    const lines = d3.select(el).select('.lines')
      .attr('d', line(data))
      .attr('class', canEdit ? 'lines' : 'lines lines-disabled');

    d3.select(el).select('.lines-bg')
      .attr('d', line(data));
  },

  _sigmoid(x, a, k, x0, L)
  {
    return L / (1 + Math.exp(-1 * k * (x - x0))) + a;
  },

  _drawLines(el, scales, pointsData, onClick, onMove, onRelease, canEdit)
  {
    const lineFunction = d3.svg.line()
      .x((d) => d['dontScale'] ? d['x'] : scales.realX(d['x']))
      .y((d) => scales.realPointY(d['y']));

    const lines = d3.select(el).select('.lines')
      .attr('d', lineFunction(this._getLinesData(pointsData, scales)))
      .attr('class', canEdit ? 'lines' : 'lines lines-disabled');

    if (canEdit)
    {
      lines.on('mousedown', this._lineMousedownFactory(el, onClick, scales, onMove, onRelease));
    }

    d3.select(el).select('.lines-bg')
      .attr('d', lineFunction(this._getLinesData(pointsData, scales, true)));
  },

  _deletePoints(el, onDelete)
  {
    d3.select(el).select('.point-edit-menu').remove();
    const selectedIds = d3.select(el).selectAll('.point-selected')[0].map((point: any) =>
    {
      return point.getAttribute('_id');
    });
    selectedIds.map((id) =>
    {
      onDelete(id);
    });
  },

  // needs to be "function" for d3.mouse(this)
  _mousedownFactory: (el, onMove, onRelease, scales, onSelect, onPointMoveStart, drawCrossHairs, point, colors) => function(d)
  {
    if (d3.event['shiftKey'] || d3.event['altKey'])
    {
      onSelect(d.id, d3.event['shiftKey']);
    }
    else if (!d.selected)
    {
      onSelect(null);
      onSelect(d.id);
    }
    d3.event['pointClicked'] = true;
    const del = d3.select(el);
    const point = d3.select(this);
    const startY = scales.realPointY.invert(parseFloat(point.attr('cy')));
    const startX = scales.realX.invert(parseFloat(point.attr('cx')));
    onPointMoveStart(startY, startX);
    const t = this;

    point.attr('active', '1');

    const move = function(event)
    {
      let newY = scales.realPointY.invert(d3.mouse(t)[1]);
      newY = Util.valueMinMax(newY, 0, 1);
      const newX = scales.realX.invert(d3.mouse(t)[0]);
      const cx = scales.realX.invert(parseFloat(point.attr('cx')));
      const pointValues = d3.select(el).selectAll('.point')[0].map((point: any) =>
      {
        return scales.realX.invert(parseFloat(point.getAttribute('cx')));
      });
      const pointScores = d3.select(el).selectAll('.point')[0].map((point: any) =>
      {
        return scales.realPointY.invert(parseFloat(point.getAttribute('cy')));
      });
      onMove(point.attr('_name'), point.attr('_id'), newY, newX, pointValues, pointScores, cx, d3.event['altKey']);
      drawCrossHairs(el, d3.mouse(this), scales, parseFloat(point.attr('cx')), newY, colors);
    };

    del.on('mousemove', move);
    del.on('touchmove', move);

    const deselectPoints = () =>
    {
      if (!el.contains(d3.event.target) ||
        (
          !d3.event['shiftKey'] &&
          !d3.event['altKey'] &&
          d3.event['target'].tagName !== 'LABEL' &&
          d3.event['target'].tagName !== 'DIV' &&
          d3.event['target'].tagName !== 'INPUT' &&
          !d3.event['pointClicked']
        )
      )
      {
        onSelect(null);
        d3.select(el).select('.point-edit-menu').remove();
        d3.select('body').on('mousedown', null);
      }
    };

    const offFn = () =>
    {
      d3.select(el).selectAll('.crosshairs').remove();
      del.on('mousemove', null);
      del.on('touchmove', null);
      del.on('mouseup', null);
      del.on('touchend', null);
      del.on('mouseleave', null);
      point.attr('active', '0');
      onRelease && onRelease();
      d3.select('body').on('mousedown', deselectPoints);
    };
    del.on('mouseup', offFn);
    del.on('touchend', offFn);
    del.on('mouseleave', offFn);
  },

  _drawCrossHairs(el, mouse, scales, x, newY, colors)
  {
    if (!x)
    {
      return;
    }
    d3.select(el).selectAll('.crosshairs').remove();
    d3.select(el).select('.transform-tooltip').remove();
    d3.select(el).select('.point-edit-menu').remove();
    const y = newY || scales.realPointY.invert(mouse[1]);
    const pos_y = scales.realPointY(y);
    const text_x = 'X:  ' + Util.formatNumber(scales.realX.invert(x));
    const text_y = 'Y:  ' + Util.formatNumber(y);
    const w = 75;
    const h = 35;
    const containerWidth = parseInt(d3.select(el).select('.inner-svg').attr('width'));
    const containerHeight = parseInt(d3.select(el).select('.inner-svg').attr('height'));
    const menuX = (x + w) > containerWidth ? x - w - 5 : x + 5;
    const menuY = (pos_y + h) > containerHeight ? pos_y - h - 14 : pos_y + 14;

    const crosshairs = d3.select(el).select('.inner-svg').append('g')
      .attr('class', 'crosshairs');
    crosshairs.append('rect')
      .attr('x', menuX)
      .attr('y', menuY)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('width', w)
      .attr('height', h)
      .attr('fill', colors[0]);

    crosshairs.append('text')
      .attr('x', menuX + 6)
      .attr('y', menuY + 14)
      .attr('text-anchor', 'start')
      .attr('fill', '#fff')
      .text(text_x);

    crosshairs.append('text')
      .attr('x', menuX + 6)
      .attr('y', menuY + 14 * 2)
      .attr('text-anchor', 'start')
      .attr('fill', '#fff')
      .text(text_y);

    const crosshairLines = d3.select(el).select('.inner-svg').insert('g', '.points').attr('class', 'crosshairs');

    crosshairLines.append('line')
      .attr('class', 'crosshairs-line')
      .attr('x1', x)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', containerHeight)
      .attr('style', 'stroke: ' + colors[0]);

    crosshairLines.append('line')
      .attr('class', 'crosshairs-line')
      .attr('x1', 0)
      .attr('y1', pos_y)
      .attr('x2', containerWidth)
      .attr('y2', pos_y)
      .attr('style', 'stroke: ' + colors[0]);

    // When mouse leaves transform area, remove, the crosshairs
    d3.select(el).select('.inner-svg').on('mouseleave', () =>
    {
      crosshairs.on('mousemove', null);
      crosshairs.attr('visibility', 'hidden');
      crosshairLines.on('mousemove', null);
      crosshairLines.attr('visibility', 'hidden');
    });
  },

  _drawToolTip(el, mouse, scales, point, colors)
  {
    d3.select(el).selectAll('.transform-tooltip').remove();

    // var f = d3.format(".2f")
    const xVal = scales.realX.invert(point.cx.baseVal.value);
    const yVal = scales.realPointY.invert(point.cy.baseVal.value);
    const text_x = 'X: ' + Util.formatNumber(xVal);
    const text_y = 'Y: ' + Util.formatNumber(yVal);
    const containerWidth = parseInt(d3.select(el).select('.inner-svg').attr('width'));
    const containerHeight = parseInt(d3.select(el).select('.inner-svg').attr('height'));
    const w = 75;
    const h = 35;
    const x = (mouse[0] + w) > containerWidth ? mouse[0] - w - 5 : mouse[0] + 5;
    const y = (mouse[1] + h) > containerHeight ? mouse[1] - h - 14 : mouse[1] + 14;

    const tooltip = d3.select(el).select('.inner-svg').append('g')
      .attr('class', 'transform-tooltip');

    tooltip.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('width', w)
      .attr('height', h)
      .attr('fill', colors[0]);

    tooltip.append('text')
      .attr('x', x + 6)
      .attr('y', y + 14)
      .attr('text-anchor', 'start')
      .attr('fill', '#fff')
      .text(text_x);

    tooltip.append('text')
      .attr('x', x + 6)
      .attr('y', y + 14 * 2)
      .attr('text-anchor', 'start')
      .attr('fill', '#fff')
      .text(text_y);

  },

  _editPointPosition(el, scales, onMove, onRelease, containerInfo)
  {
    const point = d3.select(el).select('.point-selected');
    if (!point[0][0])
    {
      return;
    }
    const inputX = d3.select(el).select('#xVal');
    const inputY = d3.select(el).select('#yVal');

    const pointValues = d3.select(el).selectAll('.point')[0].map((p: any) =>
    {
      return scales.realX.invert(parseFloat(p.getAttribute('cx')));
    });
    const pointScores = d3.select(el).selectAll('.point')[0].map((point: any) =>
    {
      return scales.realPointY.invert(parseFloat(point.getAttribute('cy')));
    });
    const xValueNode: any = inputX.node();
    const yValueNode: any = inputY.node();
    const x = parseFloat(xValueNode.value) || 0;
    const y = parseFloat(yValueNode.value) || 0;
    const x_raw = parseFloat(inputX.attr('raw_value')) + (x - parseFloat(inputX.attr('value')));
    const y_raw = parseFloat(inputY.attr('raw_value')) + (y - parseFloat(inputY.attr('value')));
    onMove(
      point.attr('_name'),
      point.attr('_id'),
      y_raw,
      x_raw,
      pointValues,
      pointScores,
      scales.realX.invert(parseFloat(point.attr('cx'))),
      d3.event['altKey'],
    );
    onRelease && onRelease();
    TransformChart._movePointEditMenu(el);
  },

  _drawPointEditMenu(el, scales, onMove, onRelease, colors, editPointPosition)
  {
    const point = d3.select(el).select('.point-selected');
    if (!point[0][0] || d3.select(el).selectAll('.point-selected')[0].length > 1)
    {
      return;
    }
    d3.select(el).selectAll('.transform-tooltip').remove();

    const cCr = d3.select(el)[0][0]['getBoundingClientRect']();
    const cr = point[0][0]['getBoundingClientRect']();

    const containerWidth = parseFloat(d3.select(el).select('.inner-svg').attr('width'));
    const containerHeight = parseFloat(d3.select(el).select('.inner-svg').attr('height'));
    const w = 70;
    const h = 38;
    const cx = parseFloat(point.attr('cx'));
    const cy = parseFloat(point.attr('cy'));
    const f = d3.format('.2f');
    const value = scales.realX.invert(cx);
    const score = scales.realPointY.invert(cy);

    // Get the max and min X values for the point
    const pointValues = d3.select(el).selectAll('.point')[0].map((p: any) =>
    {
      return scales.realX.invert(parseFloat(p.getAttribute('cx')));
    }).sort((a, b) => a - b);
    const index = pointValues.indexOf(scales.realX.invert(cx));
    let min: number;
    let max: number;

    if (index < 0)
    {
      max = 100;
      min = 0;
    }
    else
    {
      min = (index - 1) >= 0 ? Math.max(0, pointValues[index - 1]) : 0;
      max = (index + 1) < pointValues.length ? Math.min(100, pointValues[index + 1]) : 100;
    }
    const menu = d3.select(el)
      .append('div')
      .attr('width', w)
      .attr('height', h)
      .attr('class', 'point-edit-menu')
      .attr('style', 'background: ' + colors[0])
      .on('keydown', () =>
      {
        if (d3.event['keyCode'] === 46 || d3.event['keyCode'] === 8) // delete/backspace key
        {
          d3.event['stopPropagation']();
        }
      })
      .on('dblclick', () =>
      {
        d3.event['preventDefault']();
        d3.event['stopPropagation']();
      });

    const div1 = menu.append('div')
      .attr('style', 'display: inline-flex');
    const div2 = menu.append('div')
      .attr('style', 'display: inline-flex');

    div1.append('label')
      .text('X: ')
      .attr('style', 'color: ' + '#fff');

    div1.append('input')
      .attr('type', 'number')
      .attr('min', f(min))
      .attr('max', f(max))
      .attr('step', .1)
      .attr('value', f(value))
      .attr('raw_value', value)
      .attr('id', 'xVal')
      .attr('style', 'background-color: ' + '#fff' + '; color: ' + colors[0])
      .on('change', function()
      {
        editPointPosition(el, scales, onMove, onRelease, { containerWidth, containerHeight, w, h });
      }.bind(this))
      .on('input', function()
      {
        editPointPosition(el, scales, onMove, onRelease, { containerWidth, containerHeight, w, h });
      }.bind(this))
      .on('keydown', () =>
      {
        const xNode: any = d3.select(el).select('#xVal').node();
        const val = String(xNode.value).match(/\d/g);
        const len = (val && val.length) || 0;
        const keyCode = d3.event['keyCode'];
        if (len >= 5 && [46, 8, 37, 39].indexOf(keyCode) < 0)
        {
          d3.event['stopPropagation']();
        }
      });

    div2.append('label')
      .text('Y: ')
      .attr('style', 'color: ' + '#fff');

    div2.append('input')
      .attr('type', 'number')
      .attr('min', 0)
      .attr('max', 1)
      .attr('step', .01)
      .attr('value', f(score))
      .attr('raw_value', score)
      .attr('id', 'yVal')
      .attr('style', 'background-color: ' + '#fff' + '; color: ' + colors[0])
      .on('change', (value) =>
      {
        editPointPosition(el, scales, onMove, onRelease, { containerWidth, containerHeight, w, h });
      })
      .on('input', function()
      {
        editPointPosition(el, scales, onMove, onRelease, { containerWidth, containerHeight, w, h });
      })
      .on('keydown', () =>
      {
        const yNode: any = d3.select(el).select('#yVal').node();
        const val = String(yNode.value).match(/\d/g);
        const len = (val && val.length) || 0;
        if (len >= 5 && [46, 8, 37, 38, 39, 40].indexOf(d3.event['keyCode']) < 0)
        {
          d3.event['preventDefault']();
        }
      });

    TransformChart._movePointEditMenu(el);
  },

  _movePointEditMenu(el)
  {
    if (d3.select(el).select('.point-edit-menu')[0][0])
    {
      const point = d3.select(el).select('.point-selected');
      if (point[0][0])
      {
        const cCr = d3.select(el)[0][0]['getBoundingClientRect']();
        const cr = point[0][0]['getBoundingClientRect']();
        let left = (cr.left - cCr.left) + 20;
        const top = Util.valueMinMax((cr.top - cCr.top) - 15, 15, cCr.height - 60);
        if (left + 85 > cCr.width - xMargin)
        {
          left -= 90 + 20;
        }

        d3.select(el).selectAll('.point-edit-menu').style('left', left + 'px')
          .style('top', top + 'px');
      }
    }
  },

  _drawMenu(el, mouse, text, fn, scales, colors)
  {
    d3.select(el).select('.right-menu').remove();
    d3.select(el).selectAll('.transform-tooltip').remove();
    d3.select(el).select('.point-edit-menu').remove();
    const menu = d3.select(el).select('.inner-svg').append('g')
      .attr('class', 'right-menu');

    const containerWidth = parseFloat(d3.select(el).select('.inner-svg').attr('width'));
    const w = 85;
    const h = 20;

    const x = ((mouse[0] + w) > containerWidth) ? mouse[0] - w + 10 : mouse[0] - 10;

    menu.append('rect')
      .attr('x', x)
      .attr('y', mouse[1] - 10)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('width', 0)
      .attr('height', 0)
      .transition()
      .duration(50)
      .attr('width', w)
      .attr('height', h)
      .attr('fill', colors[0]);

    menu.append('text')
      .attr('x', x + w / 2)
      .attr('y', mouse[1] + h - 16)
      .attr('text-anchor', 'middle')
      .text(text)
      .attr('opacity', 0)
      .transition()
      .delay(100)
      .duration(50)
      .attr('opacity', 1)
      .attr('fill', '#fff');

    menu.append('circle')
      .attr('cx', mouse[0])
      .attr('cy', mouse[1])
      .attr('r', 3)
      .attr('fill', Colors().altHighlight)
      .transition()
      .duration(50);

    menu.append('rect')
      .attr('x', x)
      .attr('y', mouse[1] - 10)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('width', 0)
      .attr('height', 0)
      .transition()
      .duration(50)
      .attr('width', w)
      .attr('height', h)
      .attr('fill', 'rgba(0,0,0,0)')
      .attr('class', 'menu-hover-rect');

    const isvg = d3.select(el).select('.inner-svg');
    menu.on('mousedown', () =>
    {
      fn(
        scales.x.invert(mouse[0] + parseInt(isvg.attr('x'), 10)),
        scales.realPointY.invert(mouse[1] + parseInt(isvg.attr('y'), 10)),
      );
      if (text === 'Delete')
      {
        d3.select(el).select('.transform-tooltip').remove();
      }
    });
  },

  _rightClickFactory: (el, onDelete, scales, colors, drawMenu) => function(point)
  {
    drawMenu(el, d3.mouse(this), 'Delete', () => onDelete(point.id), scales, colors);
    return false;
  },

  // menuOptions maps menu text to click handlers
  _rightClickChartFactory: (el, menuOptions, scales, colors) => function(chart)
  {
    // Stop normal right click functioning from happening
    d3.event['preventDefault']();
    if (d3.event.target.classList.contains('point'))
    {
      return;
    }

    const mouse = d3.mouse(this);
    d3.select(el).select('.right-menu').remove();
    d3.select(el).selectAll('.transform-tooltip').remove();
    d3.select(el).select('.point-edit-menu').remove();

    const menu = d3.select(el)
      .append('div')
      .attr('width', 0)
      .attr('height', 0)
      .attr('class', 'right-menu context-menu')
      .attr('style', 'background: ' + colors[0]);

    const bounds = d3.select(el)[0][0]['getBoundingClientRect']();
    const containerWidth = parseFloat(d3.select(el).select('.inner-svg').attr('width'));
    const containerHeight = parseFloat(d3.select(el).select('.inner-svg').attr('height'));
    const dx = (bounds.width - containerWidth) / 2;
    const dy = (bounds.height - containerHeight) / 2;

    const clipAllowanceWidth = 140 - dx; // should approximately match context-menu max-width
    const clipAllowanceHeight = 20 * Object.keys(menuOptions).length - dy; // should approximately match context-menu-item height

    if (mouse[0] + clipAllowanceWidth < containerWidth)
    {
      menu.style('left', `${mouse[0] + dx + 2}px`);
    }
    else
    {
      menu.style('right', `${(containerWidth - mouse[0]) + dx}px`);
    }

    if (mouse[1] + clipAllowanceHeight < containerHeight)
    {
      menu.style('top', `${mouse[1] + dy - 2}px`);
    }
    else
    {
      menu.style('bottom', `${(containerHeight - mouse[1]) + dy + 2}px`);
    }

    menu.on('mousedown', () =>
    {
      d3.select(el).select('.right-menu').remove();
    });

    for (const menuText of Object.keys(menuOptions))
    {
      const item = menu.append('div');
      item.attr('style', `display: block; color: ${Colors().activeText}`)
        .attr('class', 'chart-context-menu-item')
        .text(menuText);
      item.on('mousedown', () => { menuOptions[menuText](d3.select(el), d3.mouse(this)); });
    }
  },

  _mouseoverFactory: (el, scales, colors, drawToolTip) => function(point)
  {
    drawToolTip(el, d3.mouse(this), scales, this, colors);
    return false;
  },

  _mouseClickFactory: (el, scales, onMove, onRelease, colors, editPointPosition, drawPointEditMenu) => function(point)
  {
    if (!d3.event['shiftKey'] && !d3.event['altKey'])
    {
      drawPointEditMenu(el, scales, onMove, onRelease, colors, editPointPosition);
    }
    return false;
  }.bind(this),

  _mouseoutFactory: (el) => (point) =>
  {
    d3.select(el).select('.transform-tooltip').remove();
  },

  _doubleclickFactory: (el) => (point) =>
  {
    d3.event['stopPropagation']();
  },

  _drawPoints(el, scales, pointsData, onMove, onRelease, onSelect, onDelete, onPointMoveStart, canEdit, colors, mode, domain)
  {
    const g = d3.select(el).selectAll('.points');

    const point = g.selectAll('circle')
      .data(pointsData, (d) => d['id']);

    point.enter()
      .append('circle');

    const pointYValue = (d, i) =>
    {
      // constrain y values of normal points so that they remain on the line
      if (mode === 'normal')
      {
        const average = pointsData[1].x;
        const stdDev = i === 0 ? Math.abs(pointsData[1].x - pointsData[0].x)
          : Math.abs(pointsData[2].x - pointsData[1].x);
        const maxY = TransformUtil._normal(average, average, stdDev);
        const scaleFactor = pointsData[1].y / maxY;
        const y = TransformUtil._normal(d['x'], average, stdDev) * scaleFactor;
        return scales.realPointY(y);
      }
      // Constrain all y values so that poitns remain on the sigmoid line
      if (mode === 'sigmoid')
      {
        const a = pointsData[0].y;
        const L = pointsData[3].y - pointsData[0].y;
        if (i === 2)
        {
          return scales.realPointY(L / 2 + a);
        }
        if (i === 3 || i === 0)
        {
          const x0 = pointsData[2].x;
          const x = pointsData[1].x;
          const y = pointsData[1].y;
          let k = (-1 * Math.log(L / (y - a) - 1)) / (x - x0);
          if (k === 0)
          {
            k = 0.001;
          }
          const xVal = i === 3 ? Math.log(L / (L - 0.01) - 1) / (-1 * k) + x0 :
            Math.log(L / (0.01) - 1) / (-1 * k) + x0;
          if (xVal < domain[0])
          {
            return scales.realPointY(TransformUtil._sigmoid(domain[0], a, k, x0, L));
          }
          if (xVal > domain[1])
          {
            return scales.realPointY(TransformUtil._sigmoid(domain[1], a, k, x0, L));
          }
        }
      }
      return scales.realPointY(d['y']);
    };

    const pointXValue = (d, i) =>
    {
      // Constrain x values for sigmoid so that points remain on lines
      if (mode === 'sigmoid' && (i === 3 || i === 0))
      {
        const L = pointsData[3].y - pointsData[0].y;
        const x0 = pointsData[2].x;
        const a = pointsData[0].y;
        const x = pointsData[1].x;
        const y = pointsData[1].y;
        const k = (-1 * Math.log(L / (y - a) - 1)) / (x - x0);
        const xVal = i === 3 ? Math.log(L / (L - 0.01) - 1) / (-1 * k) + x0 :
          Math.log(L / (0.01) - 1) / (-1 * k) + x0;
        return scales.realX(Util.valueMinMax(xVal, domain[0], domain[1]));
      }
      return scales.realX(d['x']);
    };

    const pointName = (d, i) =>
    {
      if (mode === 'normal')
      {
        switch (i)
        {
          case 0:
            return 'Standard Deviation 1';
          case 1:
            return 'Average';
          case 2:
            return 'Standard Deviation 2';
          default:
            return '';
        }
      }
      else if (mode === 'sigmoid')
      {
        switch (i)
        {
          case 0:
            return 'a';
          case 1:
            return 'k';
          case 2:
            return 'x0';
          case 3:
            return 'L';
          default:
            return '';
        }
      }
      return d['id'];
    };

    point
      .attr('cx', pointXValue)
      .attr('cy', pointYValue)
      .attr('fill', Colors().transformChartBg)
      .attr('style', (d) => 'stroke: ' + (d['selected'] ? Colors().error : colors[0]))
      .attr('class', (d) =>
        'point' + (d['selected'] ? ' point-selected' : '')
        + (canEdit ? '' : ' point-disabled'))
      .attr('r', 10);

    point
      .attr('_id', (d) => d['id'])
      .attr('_name', pointName);

    if (canEdit)
    {
      point.on('mousedown', this._mousedownFactory(el, onMove, onRelease, scales, onSelect, onPointMoveStart, this._drawCrossHairs, point, colors));
      point.on('touchstart', this._mousedownFactory(el, onMove, onRelease, scales, onSelect, onPointMoveStart, this._drawCrossHairs, point, colors));
      point.on('mouseover', this._mouseoverFactory(el, scales, colors, this._drawToolTip));
      if (mode === 'linear')
      {
        point.on('contextmenu', this._rightClickFactory(el, onDelete, scales, colors, this._drawMenu));
      }
      else
      {
        point.on('contextmenu', null);
      }
      point.on('click', this._mouseClickFactory(el, scales, onMove, onRelease, colors, this._editPointPosition, this._drawPointEditMenu));
      point.on('mouseout', this._mouseoutFactory(el));
      point.on('dblclick', this._doubleclickFactory(el));
    }

    point.exit().remove();
  },

  _draw(el, scales, barsData, pointsData, onMove,
    onRelease, spotlights, inputKey, onLineClick,
    onLineMove, onSelect, onCreate, onDelete, onPointMoveStart,
    width, height, canEdit, domain, mode, colors, schema, builder,
    index, distanceValue, inputs)
  {
    d3.select(el).select('.inner-svg')
      .attr('width', scaleMax(scales.realX))
      .attr('height', scaleMin(scales.realBarY));

    this._drawBg(el, scales);
    const fieldType = ElasticBlockHelpers.getTypeOfField(schema, builder, inputKey, true, index);
    const isDate = fieldType === 'date';
    const isGeo = fieldType === 'geo_point';
    this._drawAxes(el, scales, width, height, inputKey, isDate, isGeo);

    if (inputKey === '' || inputKey === undefined)
    {
      this._drawDisabledOverlay(el, scales);
      return;
    }
    d3.select(el).select('.inner-svg').select('.overlay').remove();
    this._drawBars(el, scales, barsData, colors);
    const numPoints = pointsData.length;
    let curveFn;
    let pointFn;
    if (mode === 'normal' && numPoints === NUM_CURVE_POINTS.normal)
    {
      curveFn = TransformUtil.getNormalData;
      pointFn = TransformUtil.getNormalY;
    }
    else if (mode === 'exponential' && numPoints === NUM_CURVE_POINTS.exponential
      && Math.abs(pointsData[1].x - pointsData[0].x) > (domain.x[1] - domain.x[0]) / 900) // points can't be too close horiz.
    {
      curveFn = TransformUtil.getExponentialData;
      pointFn = TransformUtil.getExponentialY;
    }
    else if (mode === 'logarithmic' && numPoints === NUM_CURVE_POINTS.logarithmic)
    {
      curveFn = TransformUtil.getLogarithmicData;
      pointFn = TransformUtil.getLogarithmicY;
    }
    else if (mode === 'sigmoid' && numPoints === NUM_CURVE_POINTS.sigmoid)
    {
      curveFn = TransformUtil.getSigmoidData;
      pointFn = TransformUtil.getSigmoidY;

    }

    if (curveFn !== undefined)
    {
      this._drawParameterizedLines(el, scales, pointsData, onLineClick, onLineMove, onRelease, canEdit, domain.x[0], domain.x[1], curveFn);
    }
    else
    {
      this._drawLines(el, scales, pointsData, onLineClick, onLineMove, canEdit);
    }
    this._drawSpotlights(el, scales, spotlights, inputKey, pointsData, barsData,
      pointFn, mode, domain.x[0], domain.x[1], isDate, isGeo, distanceValue, inputs);

    if (mode === 'linear'
      || (mode === 'exponential' && numPoints === NUM_CURVE_POINTS.exponential)
      || (mode === 'logarithmic' && numPoints === NUM_CURVE_POINTS.logarithmic)
      || (mode === 'normal' && numPoints === NUM_CURVE_POINTS.normal)
      || (mode === 'sigmoid' && numPoints === NUM_CURVE_POINTS.sigmoid))
    {
      this._drawPoints(el, scales, pointsData, onMove, onRelease, onSelect, onDelete, onPointMoveStart, canEdit, colors, mode, domain.x);
    }
    if (!pointsData.length)
    {
      this._drawNoPointsOverlay(el, scales);
    }
    else
    {
      d3.select(el).select('.inner-svg').select('.no-point-overlay').remove();
    }
    this._movePointEditMenu(el, height);
  },

  _scales(el, domain, barsData, stateWidth, stateHeight)
  {
    if (!domain)
    {
      return null;
    }
    const width = stateWidth - xMargin;
    const height = stateHeight - 2 * yMargin;

    const x = d3.scale.linear()
      .range([xMargin, width])
      .domain(domain.x);

    const realX = d3.scale.linear()
      .range([0, width - xMargin])
      .domain(domain.x);

    const pointY = d3.scale.linear()
      .range([height, yMargin])
      .domain(domain.y);

    const realPointY = d3.scale.linear()
      .range([height - yMargin, 0])
      .domain(domain.y);

    let barsMax = barsData.reduce((max, bar) =>
      (
        (max === false || bar.percentage > max) && (bar.range.max >= domain.x[0] && bar.range.min <= domain.x[1])
          ? bar.percentage : max
      )
      , false);
    barsMax = barsMax * 1.1;

    const barY = d3.scale.linear()
      .range([height, yMargin])
      .domain([0, barsMax]);

    const realBarY = d3.scale.linear()
      .range([height - yMargin, 0])
      .domain([0, barsMax]);

    return {
      x,
      pointY,
      barY,
      realX,
      realPointY,
      realBarY,
    };
  },

};

// function formatNumber(n:number):string
// {
//   var s = n + "";
//   if(s.length > 8)
//   {
//     s = n.toPrecision(3);
//   }
//   if(s.length > 8)
//   {
//     return s.substr(0, 5) + '...';
//   }
//   return s;
// }

export default TransformChart;
