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

// tslint:disable:no-var-requires restrict-plus-operands strict-boolean-expressions

import { DateUnitArray, DateUnitMap } from 'app/common/components/DatePicker';
import TerrainDateParameter from 'shared/database/elastic/parser/TerrainDateParameter';
const moment = require('moment-timezone');

const DateUtil =
{
  formatTime(rawTime)
  {
    let unit;
    const parsedTime = rawTime.split(':');
    let hour = parsedTime[0];
    const hourNumber = parseInt(hour, 10);
    const minutes = parsedTime[1];
    if (hourNumber < 12)
    {
      unit = 'am';
      hour = (hourNumber - 0).toString();
      if (hourNumber === 0)
      {
        hour = '12';
      }
    }
    else
    {
      unit = 'pm';
      if (hourNumber !== 12)
      {
        hour = (hourNumber - 12).toString();
      }
    }
    return hour + ':' + minutes + ' ' + unit;
  },

  formatCalendarDate(date)
  {
    let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone === undefined)
    {
      timeZone = 'America/Los_Angeles';
    }
    return moment(date).tz(timeZone).format('MMMM D YYYY, h:mm a');
  },

  formatRelativeDate(date)
  {
    const parsedDate = date.split('.');
    const oneWeekScope = parsedDate[1];
    const rawDay = parsedDate[2];
    const rawTime = parsedDate[3];
    const time = DateUtil.formatTime(rawTime.slice(1));
    const dayDict =
    {
      0: 'Monday',
      1: 'Tuesday',
      2: 'Wednesday',
      3: 'Thursday',
      4: 'Friday',
      5: 'Saturday',
      6: 'Sunday',
    };
    const day = dayDict[rawDay];
    return oneWeekScope.slice(0, 4) + ' ' + day + ', ' + time;
  },

  formatSpecificDate(date)
  {
    if (date.toLowerCase() === 'now')
    {
      return 'now';
    }
    let tense;
    let dateParser;
    let plural;
    const elasticUnit = date.slice(-1);
    if (date.includes('+'))
    {
      tense = 'from now';
      dateParser = '+';
    }
    else
    {
      tense = 'ago';
      dateParser = '-';
    }
    const parsedDate = date.split(dateParser);
    const dateDetails = parsedDate[1];
    const amount = dateDetails.slice(0, -1);
    const unit = (DateUnitMap[elasticUnit].slice(0, -3)).toLowerCase();
    if (amount !== '1')
    {
      plural = 's';
    }
    else
    {
      plural = '';
    }
    return amount + ' ' + unit + plural + ' ' + tense;
  },

  isValidElasticDateParameter(date)
  {
    const properNow = date.slice(0, 3).toLowerCase();
    const properSign = date[3];
    const properUnit = date.slice(-1);
    const properAmount = date.slice(4);
    const properNumber = date.slice(4, -1);
    return ((date.toLowerCase() === 'now') || ((properNow === 'now') &&
      (properSign === '+' || properSign === '-') &&
      (!properAmount.includes('+') && !properAmount.includes('-'))
      && (!isNaN((Number(properNumber))))
      && (DateUnitArray.indexOf(properUnit) !== -1)
    ));
  },

  formatDateValue(date)
  {
    if (date.includes('@TerrainDate') && TerrainDateParameter.isValidTerrainDateParameter(date))
    {
      return DateUtil.formatRelativeDate(date);
    }
    else if (DateUtil.isValidElasticDateParameter(date))
    {
      return DateUtil.formatSpecificDate(date);
    }
    else if (date.charAt(0) === '@')
    {
      return date; // Input
    }
    else
    {
      return DateUtil.formatCalendarDate(date);
    }
  },
};

export default DateUtil;
