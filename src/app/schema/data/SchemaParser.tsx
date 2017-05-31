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

import * as _ from 'underscore';
import * as Immutable from 'immutable';
import SchemaTypes from '../SchemaTypes';
const {Map, List} = Immutable;

type Database = SchemaTypes.Database;
type Table = SchemaTypes.Table;
type Column = SchemaTypes.Column;
type Index = SchemaTypes.Index;

export module SchemaParser
{
  export function parseMySQLDb(
    db: object,
    colsData: object,
    setDbAction: (payload: SchemaTypes.SetDbActionPayload) => void,
  ) {
    let database = SchemaTypes._Database({
      name: db['name'],
    });
    const databaseId = database.id;

    let tables: IMMap<string, Table> = Map<string, Table>({});
    let columns: IMMap<string, Column> =  Map<string, Column>({});
    const indexes: IMMap<string, Index> =  Map<string, Index>({});

    let tableNames = List<string>([]);
    let columnNamesByTable = Map<string, List<string>>([]);

    _.map((colsData as any),
      (
        col: {
          TABLE_CATALOG: string,
          TABLE_SCHEMA: string,
          TABLE_NAME: string,
          COLUMN_NAME: string,
          ORDINAL_POSITION: number,
          COLUMN_DEFAULT: string,
          IS_NULLABLE: string,
          DATA_TYPE: string,
          CHARACTER_MAXIMUM_LENGTH: number,
          CHARACTER_OCTET_LENGTH: number,
          NUMERIC_PRECISION: number,
          NUMERIC_SCALE: number,
          DATETIME_PRECISION: number,
          CHARACTER_SET_NAME: string,
          COLLATION_NAME: string,
          COLUMN_TYPE: string,
          COLUMN_KEY: string,
          EXTRA: string,
          PRIVILEGES: string,
          COLUMN_COMMENT: string,
          GENERATION_EXPRESSION: string,
        },
      ) =>
      {
        const tableId = SchemaTypes.tableId(db['name'], col.TABLE_NAME);
        let table = tables.get(tableId);

        if (!table)
        {
          table = SchemaTypes._Table({
            name: col.TABLE_NAME,
            databaseId,
          });
          tables = tables.set(tableId, table);
          tableNames = tableNames.push(table.name);
          database = database.set(
            'tableIds', database.tableIds.push(tableId),
          );
        }

        const column = SchemaTypes._Column({
          name: col.COLUMN_NAME,
          databaseId,
          tableId,
          defaultValue: col.COLUMN_DEFAULT,
          datatype: col.DATA_TYPE,
          isNullable: col.IS_NULLABLE === 'YES',
          isPrimaryKey: col.COLUMN_KEY === 'PRI',
        });

        columns = columns.set(column.id, column);

        if (!columnNamesByTable.get(table.id))
        {
          columnNamesByTable = columnNamesByTable.set(table.id, List([]));
        }
        columnNamesByTable = columnNamesByTable.update(table.id,
          (list) => list.push(column.name),
        );

        tables = tables.setIn(
          [tableId, 'columnIds'],
          table.columnIds.push(column.id),
        );
      });

    setDbAction({
      database,
      tables,
      columns,
      indexes,
      tableNames,
      columnNames: columnNamesByTable,
    });
  }

  export function parseElasticDb(
    db: object,
    colsData: object,
    setDbAction: (payload: SchemaTypes.SetDbActionPayload) => void,
  ) {
    let database = SchemaTypes._Database({
      name: db['name'],
    });
    const databaseId = database.id;

    let tables: IMMap<string, Table> = Map<string, Table>({});
    let columns: IMMap<string, Column> = Map<string, Column>({});
    const indexes: IMMap<string, Index> = Map<string, Index>({});

    let tableNames = List<string>([]);
    let columnIds = List<string>([]);
    let columnNamesByTable = Map<string, List<string>>([]);

    _.each((colsData as any),
      (tableFields, tableName, tableList) =>
      {
        const tableId = SchemaTypes.tableId(db['name'], (tableName as any) as string);
        let table = tables.get(tableId);

        if (!table)
        {
          table = SchemaTypes._Table({
            name: (tableName as any) as string,
            databaseId,
          });
          tables = tables.set(tableId, table);
          tableNames = tableNames.push(table.name);
          database = database.set(
            'tableIds', database.tableIds.push(tableId),
          );
          database = database.set(
            'databaseType', 'elastic',
          );
        }

        _.each(tableFields['data'], (fieldProperties, fieldName, fieldList) =>
        {
          const column = SchemaTypes._Column({
            name: (fieldName as any) as string,
            databaseId,
            tableId,
            datatype: fieldProperties['type'],
          });

          columns = columns.set(column.id, column);

          if (!columnNamesByTable.get(table.id))
          {
            columnNamesByTable = columnNamesByTable.set(table.id, List([]));
          }
          columnNamesByTable = columnNamesByTable.update(table.id,
            (list) => list.push(column.name),
          );

          columnIds = columnIds.push(column.id);
        });

        tables = tables.setIn(
          [tableId, 'columnIds'],
          columnIds,
        );
      });

    setDbAction({
      database,
      tables,
      columns,
      indexes,
      tableNames,
      columnNames: columnNamesByTable,
    });
  }
}

export default SchemaParser;
