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

// tslint:disable:no-var-requires variable-name no-shadowed-variable

import * as React from 'react';
import TerrainComponent from './../../common/components/TerrainComponent';
import PasswordMeter from './PasswordMeter';
import './Settings.less';
const zxcvbn = require('zxcvbn');

export interface Props
{
  onChange: (ev: any) => void;
  value: string;
  type: string;
}

class PasswordStrengthInput extends TerrainComponent<Props>
{
  constructor(Props)
  {
    super(Props);
    this.state = {
      score: -1,
    };
  }

  public handleInput(event)
  {
    event.preventDefault();
    const password = event.target.value;
    if (password.length === 0)
    {
      this.setState({
        score: -1,
      });
      return;
    }
    const result = zxcvbn(password);
    const crack_time = result.crack_times_seconds.online_no_throttling_10_per_second;
    let score;
    if (crack_time <= Math.pow(10, 2))
    {
      score = 0;
    }
    else if (crack_time <= Math.pow(10, 4))
    {
      score = 1;
    }
    else if (crack_time <= Math.pow(10, 6))
    {
      score = 2;
    }
    else if (crack_time <= Math.pow(10, 8))
    {
      score = 3;
    }
    else if (crack_time <= Math.pow(10, 10))
    {
      score = 4;
    }
    else
    {
      score = 5;
    }

    this.setState({
      score,
    });
  }

  public render()
  {
    return (
      <div>
        <input
          type={this.props.type}
          value={this.props.value}
          onChange={this.props.onChange}
          onInput={this.handleInput}
          className='settings-input password-input'
        />
        <PasswordMeter value={this.state.score} />
      </div>
    );
  }
}

export default PasswordStrengthInput;
