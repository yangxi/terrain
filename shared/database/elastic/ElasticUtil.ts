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

import ESJSONParser from '../../database/elastic/parser/ESJSONParser';
import ESParser from '../../database/elastic/parser/ESParser';
import MidwayErrorItem from '../../error/MidwayErrorItem';

/* returns an error message if there are any; else returns empty string */
export function isValidIndexName(name: string): string
{
  if (name === '')
  {
    return 'Index name cannot be an empty string.';
  }
  if (name !== name.toLowerCase())
  {
    return 'Index name may not contain uppercase letters.';
  }
  if (!/^[a-z\d].*$/.test(name))
  {
    return 'Index name must start with a lowercase letter or digit.';
  }
  if (!/^[a-z\d][a-z\d\._\+-]*$/.test(name))
  {
    return 'Index name may only contain lowercase letters, digits, periods, underscores, dashes, and pluses.';
  }
  return '';
}

/* returns an error message if there are any; else returns empty string */
export function isValidTypeName(name: string): string
{
  if (name === '')
  {
    return 'Document type cannot be an empty string.';
  }
  if (/^_.*/.test(name))
  {
    return 'Document type may not start with an underscore.';
  }
  return '';
}

/* returns an error message if there are any; else returns empty string */
export function isValidFieldName(name: string): string
{
  if (name === '')
  {
    return 'Field name cannot be an empty string.';
  }
  if (/^_.*/.test(name))
  {
    return 'Field name may not start with an underscore.';
  }
  if (name.indexOf('.') !== -1)
  {
    return 'Field name may not contain periods.';
  }
  return '';
}

export function getParsedQuery(body: string): ESParser
{
  const parser = new ESJSONParser(body, true);
  if (parser.hasError())
  {
    const es = parser.getErrors();
    const errors: MidwayErrorItem[] = [];

    es.forEach((e) =>
    {
      const row = (e.token !== null) ? e.token.row : 0;
      const col = (e.token !== null) ? e.token.col : 0;
      const pos = (e.token !== null) ? e.token.charNumber : 0;
      const title: string = String(row) + ':' + String(col) + ':' + String(pos) + ' ' + String(e.message);
      errors.push({ status: -1, title, detail: '', source: {} });
    });

    if (errors.length === 0)
    {
      errors.push({ status: -1, title: '0:0:0 Syntax Error', detail: '', source: {} });
    }

    throw errors;
  }

  return parser;
}
