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

import * as Immutable from 'immutable';
const Redux = require('redux');
import * as ReduxActions from 'redux-actions';
import SchemaTypes from '../SchemaTypes';
type SchemaState = SchemaTypes.SchemaState;
import Ajax from './../../util/Ajax';
import SchemaActionTypes from './SchemaActionTypes';
import SchemaParser from './SchemaParser';

type Database = SchemaTypes.Database;
type Table = SchemaTypes.Table;
type Column = SchemaTypes.Column;
type Index = SchemaTypes.Index;

export const SchemaStore: IStore<SchemaState> = 
	Redux.createStore(ReduxActions.handleActions(
		{
			[SchemaActionTypes.fetch]:
				(state: SchemaState) =>
				{
					Ajax.getDbs(
						(dbs: string[]) =>
						{
							SchemaActions.dbCount(dbs.length);
							dbs.map(
								db =>
									Ajax.schema(db, 
										(colsData, error) =>
										{
											if(!error)
											{
												SchemaParser.parseDb(db, colsData, SchemaActions.setDatabase);
											}
										},
										(error) =>
										{
											// TODO consider handling individual DB errors
										})
							);
						},
						(dbError) =>
						{
							SchemaActions.error(JSON.stringify(dbError));
						}
					);
					
					return state
						.set('loading', true);
				},
			
			[SchemaActionTypes.dbCount]:
				(
					state: SchemaState,
					action: Action<{
						dbCount: number,
					}>
				) =>
					state.set('dbCount', action.payload.dbCount),
			
			[SchemaActionTypes.setDatabase]:
				(
					state: SchemaState, 
					action: Action<{
						database: Database;
						tables: Map<ID, Table>;
						columns: Map<ID, Column>;
						indexes: Map<ID, Index>;
					}>
				) =>
				{
					let {database, tables, columns, indexes} = action.payload;
					if(state.databases.size === state.dbCount - 1)
					{
						state = state.set('loading', false).set('loaded', true);
					}
					console.log(state);
					return state
						.setIn(['databases', database.id], database)
						.set('tables', state.tables.merge(tables))
						.set('columns', state.columns.merge(columns))
						.set('indexes', state.indexes.merge(indexes));
				},
		}
	), SchemaTypes._SchemaState());


const $ = (type: string, payload: any) => SchemaStore.dispatch({type, payload})

export const SchemaActions =
{
  fetch:
    () =>
      $(SchemaActionTypes.fetch, {} ),
  
  dbCount:
  	(dbCount: number) =>
  		$(SchemaActionTypes.dbCount, { dbCount }),
  
  error:
  	(error: string) =>
  		$(SchemaActionTypes.error, { error }),
  
  setDatabase:
    (
      database: SchemaTypes.Database, 
      tables: Map<ID, SchemaTypes.Table>, 
      columns: Map<ID, SchemaTypes.Column>, 
      indexes: Map<ID, SchemaTypes.Index>
    ) =>
      $(SchemaActionTypes.setDatabase, {
        database,
        tables,
        columns,
        indexes,
      }),
}


export default SchemaStore;
