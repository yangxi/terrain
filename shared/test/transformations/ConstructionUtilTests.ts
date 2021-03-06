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

import { List } from 'immutable';
import * as _ from 'lodash';

import TransformationRegistry from 'shared/transformations/TransformationRegistry';
import { TypeTracker } from 'shared/transformations/util/TypeTracker';
import { KeyPath, WayPoint } from 'terrain-keypath';
import * as yadeep from 'yadeep';
import { TransformationEngine } from '../../transformations/TransformationEngine';
import TransformationNodeType from '../../transformations/TransformationNodeType';
import { TestDocs } from './TestDocs';

import ConstructionUtil from 'shared/transformations/util/ConstructionUtil';

import { FieldTypes } from 'shared/etl/types/ETLTypes';

function testHelper(values: any[], interpret = false): FieldTypes
{
  const tracker = new TypeTracker(List(['samplePath']), undefined, interpret);
  for (const val of values)
  {
    tracker.push(val);
  }
  return tracker.getType();
}

// delete these tests if they become inconvenient
describe('simple primitive type tracker tests', () =>
{
  test('all strings test', () =>
  {
    expect(testHelper(['hello', 'there', 'friend'])).toBe(FieldTypes.String);
    expect(testHelper(['whoa!'])).toBe(FieldTypes.String);
  });
  test('all strings with nulls', () =>
  {
    expect(testHelper([null, null, 'friend'])).toBe(FieldTypes.String);
    expect(testHelper(['hello', null, 'friend'])).toBe(FieldTypes.String);
    expect(testHelper(['hello', null])).toBe(FieldTypes.String);
  });
  test('all strings with undefined', () =>
  {
    expect(testHelper([undefined, 'hello', 'friend'])).toBe(FieldTypes.String);
    expect(testHelper(['hello', undefined, 'friend'])).toBe(FieldTypes.String);
    expect(testHelper(['hello', undefined])).toBe(FieldTypes.String);
  });
  test('all strings with empty strings', () =>
  {
    expect(testHelper(['', 'hello', 'friend'])).toBe(FieldTypes.String);
    expect(testHelper(['hello', '', 'friend'])).toBe(FieldTypes.String);
    expect(testHelper(['hello', ''])).toBe(FieldTypes.String);
  });
  test('all numbers', () =>
  {
    expect(testHelper([5, 4.5, 1e5])).toBe(FieldTypes.Number);
    expect(testHelper([0, -1.5])).toBe(FieldTypes.Number);
  });
  test('all integers', () =>
  {
    expect(testHelper([5, 1e5])).toBe(FieldTypes.Integer);
    expect(testHelper([0, -4])).toBe(FieldTypes.Integer);
  });
  test('numbers with nulls', () =>
  {
    expect(testHelper([null, 5.3, 10])).toBe(FieldTypes.Number);
    expect(testHelper([3, null, -1.5])).toBe(FieldTypes.Number);
    expect(testHelper([3, 4, null])).toBe(FieldTypes.Integer);
  });
  test('all booleans', () =>
  {
    expect(testHelper([false])).toBe(FieldTypes.Boolean);
    expect(testHelper([false, true, false])).toBe(FieldTypes.Boolean);
  });
  test('booleans with nulls', () =>
  {
    expect(testHelper([null, false])).toBe(FieldTypes.Boolean);
    expect(testHelper([false, true, null, false])).toBe(FieldTypes.Boolean);
  });
});

describe('special type tracker tests', () =>
{
  test('arrays', () =>
  {
    expect(testHelper([[], [1, 2]])).toBe(FieldTypes.Array);
    expect(testHelper([null, [1, 2]])).toBe(FieldTypes.Array);
  });
  test('objects', () =>
  {
    expect(testHelper([{ hello: 'world' }, {}])).toBe(FieldTypes.Object);
    expect(testHelper([{ hello: 'world' }, null])).toBe(FieldTypes.Object);
  });
  test('dates', () =>
  {
    expect(testHelper([null, '2011-05-11T00:00:00.000Z'])).toBe(FieldTypes.Date);
    expect(testHelper(['2011-05-11T00:00:00.000', null])).toBe(FieldTypes.Date);
    expect(testHelper(['07/04/2018', '2018-07-04'])).toBe(FieldTypes.Date);
  });
  test('geopoints', () =>
  {
    expect(testHelper(['', `{"lat":0.63,"lon":0.43}`])).toBe(FieldTypes.GeoPoint);
  });
});

describe('negative special type tracker tests', () =>
{
  test('incorrect arrays', () =>
  {
    expect(testHelper([[], [1, 2], {}])).toBe(FieldTypes.String);
    expect(testHelper([null, [], '[]'])).toBe(FieldTypes.String);
  });
  test('incorrect objects', () =>
  {
    expect(testHelper([{ hello: 'world' }, 5])).toBe(FieldTypes.String);
    expect(testHelper([{ hello: 'world' }, '{}'])).toBe(FieldTypes.String);
  });
  test('incorrect dates', () =>
  {
    expect(testHelper([123456, '2011-05-11T00:00:00.000Z'])).toBe(FieldTypes.String);
    expect(testHelper(['2011-05-11T00:00:00.000', 'hello'])).toBe(FieldTypes.String);
    expect(testHelper(['07/04/2018', '', 'hmm'])).toBe(FieldTypes.String);
  });
  test('incorrect geopoint', () =>
  {
    expect(testHelper([`{"lat":0.63,"lon":0.43}`, {}])).toBe(FieldTypes.String);
    expect(testHelper([`{"lat":0.63,"lon":0.43}`, 'hello'])).toBe(FieldTypes.String);
  });
  test('nothing special strings', () =>
  {
    expect(testHelper([null, ''])).toBe(FieldTypes.String);
    expect(testHelper(['', '', ''])).toBe(FieldTypes.String);
  });
  test('nothing special numbers', () =>
  {
    expect(testHelper([NaN])).toBe(FieldTypes.Number);
    expect(testHelper([NaN, null])).toBe(FieldTypes.Number);
  });
});

describe('mix and match', () =>
{
  test('strings and numbers', () =>
  {
    expect(testHelper(['hi', 5])).toBe(FieldTypes.String);
    expect(testHelper([null, 1.5, '5'])).toBe(FieldTypes.String);
  });
  test('geopoints and dates', () =>
  {
    expect(testHelper([`{"lat":0.63,"lon":0.43}`, '2011-05-11T00:00:00.000'])).toBe(FieldTypes.String);
  });
  test('bools and things', () =>
  {
    expect(testHelper([true, 'false'])).toBe(FieldTypes.String);
    expect(testHelper([false, 0])).toBe(FieldTypes.String);
    expect(testHelper([true, NaN, true])).toBe(FieldTypes.String);
  });
});

describe('interpret strings', () =>
{
  test('interpret numbers', () =>
  {
    expect(testHelper(['5', '1e3', '2'], true)).toBe(FieldTypes.Integer);
    expect(testHelper([null, '100.5'], true)).toBe(FieldTypes.Number);
  });
  test('interpret numbers with NaN', () =>
  {
    expect(testHelper(['NaN', '100.5'], true)).toBe(FieldTypes.Number);
    expect(testHelper(['NaN'], true)).toBe(FieldTypes.Number);
    expect(testHelper(['NaN', '5'], true)).toBe(FieldTypes.Integer);
    expect(testHelper(['5', null, 'NaN'], true)).toBe(FieldTypes.Integer);
    expect(testHelper(['5.5', 'NaN'], true)).toBe(FieldTypes.Number);
  });
  test('interpret numbers with decoy real numbers', () =>
  {
    expect(testHelper(['5', 15, '2'], true)).toBe(FieldTypes.String);
    expect(testHelper([NaN, '5'], true)).toBe(FieldTypes.String);
    expect(testHelper(['NaN', NaN], true)).toBe(FieldTypes.String);
  });
  test('interpret booleans', () =>
  {
    expect(testHelper(['true', 'false'], true)).toBe(FieldTypes.Boolean);
    expect(testHelper([null, 'true', ''], true)).toBe(FieldTypes.Boolean);
    expect(testHelper([false, true, 'true'], true)).toBe(FieldTypes.String);
    expect(testHelper(['{}', 'true'], true)).toBe(FieldTypes.String);
  });
});

describe('weird cases with no meaningful types', () =>
{
  test('check nulls', () =>
  {
    expect(testHelper([null, null])).toBe(FieldTypes.String);
  });
  test('no values pushed', () =>
  {
    expect(testHelper([], true)).toBe(FieldTypes.String);
  });
});

describe('check coersion callback', () =>
{
  const messageHelper = (values: any[]): string =>
  {
    let cbCall = null;
    const tracker = new TypeTracker(List(['samplePath']), (msg) => { cbCall = msg; });
    for (const val of values)
    {
      tracker.push(val);
    }
    return cbCall;
  };

  test('coersion check 1', () =>
  {
    const msg = messageHelper(['hello', 5]);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  test('coersion check 2', () =>
  {
    const msg = messageHelper([5, 'hello']);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  test('coersion check 3', () =>
  {
    const msg = messageHelper([null, 5]);
    expect(msg).toBe(null);
  });

  test('coersion check 4', () =>
  {
    const msg = messageHelper([{}, []]);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});

describe('create engine test', () =>
{
  const docs = List([
    {
      foo: 'bar',
      someArr: [1, 2, 3],
      nestedArr: [
        { strField: 'hello', numField: 5 },
      ],
      coercedField1: 'hello',
      coercedField2: {
        baz: 'hello',
      },
    },
    {
      foo: 'car',
      someArr: [10, 3, 2],
      nestedArr: [],
      coercedField1: ['blah'],
      coercedField2: 3.5,
    },
    {
      foo: 'hmm',
      someArr: [5, 4, 3],
      nestedArr: [
        { strField: 'world', numField: 0 },
      ],
    },
  ]);
  const { engine, errors } = ConstructionUtil.createEngineFromDocuments(docs);

  test('test identity transformation', () =>
  {
    expect(engine.transform(docs.get(2))).toEqual(docs.get(2));
  });

  test('test existence of fields', () =>
  {
    expect(engine.getFieldID(KeyPath(['foo']))).toBeDefined();
    expect(engine.getFieldID(KeyPath(['someArr']))).toBeDefined();
    expect(engine.getFieldID(KeyPath(['someArr', -1]))).toBeDefined();
    expect(engine.getFieldID(KeyPath(['nestedArr', -1, 'numField']))).toBeDefined();
    expect(engine.getFieldID(KeyPath(['nestedArr']))).toBeDefined();
    expect(engine.getFieldID(KeyPath(['coercedField1']))).toBeDefined();
    expect(engine.getFieldID(KeyPath(['coercedField2']))).toBeDefined();
  });

  test('nonexistence of fields', () =>
  {
    expect(engine.getFieldID(KeyPath(['someArr', 0]))).toBeUndefined();
    expect(engine.getFieldID(KeyPath(['nestedArr', 0]))).toBeUndefined();
    expect(engine.getFieldID(KeyPath(['coercedField1', -1]))).toBeUndefined();
    expect(engine.getFieldID(KeyPath(['coercedField2', 'baz']))).toBeUndefined();
  });

  test('check coersion errors', () =>
  {
    expect(errors.length).toBeGreaterThan(0);
  });
});
