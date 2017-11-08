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

//  tslint:disable:no-bitwise no-console

// This file contains all the functionality for getting points data for the parameterized transform curves
// It is used by the TransformChart to draw lines and the Elastic Transform Card to pass data into the PWL script
'use strict';

import Util from './Util';

const TransformUtil = {
  getLogarithmicData()
  {

  },

  getExponentialData(numPoints, pointsData, domainMin?, domainMax?)
  { 
    const x1 = pointsData[0].x || pointsData[0].value;
    let y1 = pointsData[0].y || pointsData[0].score;
    const x2 = pointsData[1].x || pointsData[1].value;
    let y2 = pointsData[1].y || pointsData[1].score;
    const shift = y2 < y1 ? y2 - 0.001 : y1 - 0.001;
    y1 -= shift;
    y2 -= shift;
    let xData = [];
    let yData = [];
    let x = x1;
    const stepSize = (x2 - x1) / numPoints;
    const lambda = (Math.log(y2) / x1 - Math.log(y1) / x1) / (1 - x2 / x1);
    const a = y2 / Math.exp(-1 * lambda * x2);
    for (let i = 0; i <= numPoints; i++)
    {
      const y = TransformUtil._exponential(x, lambda, a);
      yData.push(y + shift);
      xData.push(x);
      x += stepSize;
    }
    return {xData, yData};
  },

  _exponential(x, lambda, A)
  {
    return A * Math.exp(-1 * lambda * x);
  },


  getNormalData()
  {

  },

  getSigmoidData()
  {

  },

};
export default TransformUtil;
