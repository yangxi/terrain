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

import { ConstrainedMap, GetType, TerrainRedux, Unroll } from 'app/store/TerrainRedux';
import { List } from 'immutable';
import * as _ from 'lodash';
import { _SchemaMetadata, _SchemaState, Column, Database, FieldProperty, Index, SchemaState, Server, Table } from 'schema/SchemaTypes';

import { ModalProps, MultiModal } from 'common/components/overlay/MultiModal';
import BackendInstance from 'database/types/BackendInstance';
import * as SchemaParser from 'schema/data/SchemaParser';
import MidwayError from 'shared/error/MidwayError';
import Ajax from 'util/Ajax';
import AjaxM1 from 'util/AjaxM1';

export interface SchemaActionTypes
{
  fetch: {
    actionType: 'fetch';
  };
  reset: {
    actionType: 'reset';
  };
  setServer: {
    actionType: 'setServer';
    server: Server;
    databases: IMMap<string, Database>;
    tables: IMMap<string, Table>;
    columns: IMMap<string, Column>;
    indexes: IMMap<string, Index>;
    fieldProperties: IMMap<string, FieldProperty>;
    columnNames: IMMap<string, List<string>>;
    tableNames: List<string>;
  };
  addDbToServer: {
    actionType: 'addDbToServer';
    server: Server;
    databases: IMMap<string, Database>;
    tables: IMMap<string, Table>;
    columns: IMMap<string, Column>;
    indexes: IMMap<string, Index>;
    fieldProperties: IMMap<string, FieldProperty>;
    columnNames: IMMap<string, List<string>>;
    tableNames: List<string>;
  };
  error: {
    actionType: 'error';
    error: string;
  };
  serverCount: {
    actionType: 'serverCount';
    serverCount: number;
  };
  highlightId: {
    actionType: 'highlightId';
    id: ID;
    inSearchResults: boolean;
  };
  selectId: {
    actionType: 'selectId';
    id: ID;
  };
  starColumn: {
    actionType: 'starColumn',
    columnId: ID,
    starred: boolean,
  };
  setSchemaMetadata: {
    actionType: 'setSchemaMetadata',
    schemaMetadata: any,
  };
  deleteElasticIndex: {
    actionType: 'deleteElasticIndex';
    dbid: number,
    dbname: string,
  };
  addModal: {
    actionType: 'addModal';
    props: ModalProps;
  };
  setModalRequests: {
    actionType: 'setModalRequests';
    requests: List<ModalProps>;
  };
}

class SchemaRedux extends TerrainRedux<SchemaActionTypes, SchemaState>
{
  public namespace: string = 'schema';

  public reducers: ConstrainedMap<SchemaActionTypes, SchemaState> =
    {
      fetch: (state, action) =>
      {
        // Fetch the schema meta data
        return state
          .set('loading', true);
      },

      setSchemaMetadata: (state, action) =>
      {
        const { schemaMetadata } = action.payload;
        return state
          .set('schemaMetadata', List(schemaMetadata !== null ? schemaMetadata.map((d) => _SchemaMetadata(d)) : []));
      },

      reset: (state, action) =>
      {
        return _SchemaState();
      },

      setServer: (state, action) =>
      {
        const { server, databases, tables, columns, indexes, fieldProperties, tableNames, columnNames } = action.payload;
        if (state.servers.size === state.serverCount - 1)
        {
          state = state.set('loading', false).set('loaded', true);
        }

        return state
          .setIn(['servers', server.id], server)
          .set('databases', state.databases.merge(databases))
          .set('tables', state.tables.merge(tables))
          .set('columns', state.columns.merge(columns))
          .set('indexes', state.indexes.merge(indexes))
          .set('fieldProperties', state.fieldProperties.merge(fieldProperties));
      },

      addDbToServer: (state, action) =>
      {
        const { server, databases, tables, columns, indexes, fieldProperties, tableNames, columnNames } = action.payload;

        let newServer = server;
        if (state.servers.get(server.id) !== undefined)
        {
          newServer = state.servers.get(server.id).set('databaseIds',
            state.servers.get(server.id).databaseIds.concat(server.databaseIds),
          );
        }

        return state
          .setIn(['servers', server.id], newServer)
          .set('databases', state.databases.merge(databases))
          .set('tables', state.tables.merge(tables))
          .set('columns', state.columns.merge(columns))
          .set('indexes', state.indexes.merge(indexes))
          .set('fieldProperties', state.fieldProperties.merge(fieldProperties));
      },

      error: (state, action) =>
      {
        return state; // this does not do anything
      },

      serverCount: (state, action) =>
      {
        return state.set('serverCount', action.payload.serverCount);
      },

      highlightId: (state, action) =>
      {
        return state.set('highlightedId', action.payload.id as string)
          .set('highlightedInSearchResults', action.payload.inSearchResults);
      },

      selectId: (state, action) =>
      {
        return state.set('selectedId', action.payload.id as string);
      },

      starColumn: (state, action) =>
      {
        let id;
        const { columnId, starred } = action.payload;
        // See if information for this column is already in the schema state
        const filtered = state.schemaMetadata.filter((d) => d.columnId === columnId).toList();
        if (filtered.size > 0)
        {
          id = filtered.get(0).id;
          state = state
            .setIn(List(['schemaMetadata', state.schemaMetadata.indexOf(filtered.get(0)), 'starred']), starred);
        }
        // TOOD: NEED TO ACTUALLY JUST SET THE SCHEMA META DATA TO APPEND WHAT IS RETURNED FROM AJAX...
        else
        {
          state = state
            .set('schemaMetadata', state.schemaMetadata.push(_SchemaMetadata({ starred, columnId })));
        }
        Ajax.starColumn(columnId, starred, id);
        return state;
      },

      deleteElasticIndex: (state, action) =>
      {
        return state;
      },

      addModal: (state, action) =>
      {
        return state.set('modalRequests',
          MultiModal.addRequest(state.modalRequests, action.payload.props));
      },

      setModalRequests: (state, action) =>
      {
        return state.set('modalRequests', action.payload.requests);
      },
    };

  public fetchAction(dispatch)
  {
    const directDispatch = this._dispatchReducerFactory(dispatch);
    directDispatch({
      actionType: 'reset',
    });
    directDispatch({
      actionType: 'fetch',
    });
    // Fetch the schema
    Ajax.schemaMetadata(undefined,
      (resp) =>
      {
        directDispatch({
          actionType: 'setSchemaMetadata',
          schemaMetadata: resp,
        });
      },
      (error) =>
      {
        // console.log(error);
      });
    Ajax.getDbs(
      (dbs: object) =>
      {
        const m1Dbs: BackendInstance[] = [];
        const m2Dbs: BackendInstance[] = [];
        _.map((dbs as any),
          (db: BackendInstance) =>
          {
            if (db.source === 'm1')
            {
              m1Dbs.push(db);
            }
            else
            {
              m2Dbs.push(db);
            }
          },
        );
        // Group all m1Dbs under a server e.g. "Other Databases"
        // The m2Dbs are servers, so need to do parsing differently
        directDispatch({
          actionType: 'serverCount',
          serverCount: Object.keys(m2Dbs).length,
        });
        _.map((dbs as any),
          (db: BackendInstance) =>
            (db.source === 'm1' ? AjaxM1.schema_m1 : Ajax.schema)(
              db['id'],
              (schemaData, error) =>
              {
                if (!error)
                {
                  if (db.source === 'm2')
                  {
                    if (db['type'] === 'mysql')
                    {
                      // Don't support MySQL for now
                      // SchemaParser.parseMySQLDb(db, schemaData, SchemaActions.setServer);
                    }
                    else if (db['type'] === 'elastic')
                    {
                      SchemaParser.parseElasticDb(db, schemaData, directDispatch);
                    }
                  }
                  else
                  {
                    // Don't support old midway for now
                    // SchemaParser.parseMySQLDbs_m1(db, schemaData, SchemaActions.addDbToServer);
                  }
                }
              },
              (error) =>
              {
                // TODO consider handling individual DB errors
              }),
        );
      },
      (dbError) =>
      {
        directDispatch({
          actionType: 'error',
          error: JSON.stringify(dbError),
        });
      },
    );
  }

  public deleteElasticIndexAction(action: SchemaActionType<'deleteElasticIndex'>, dispatch)
  {
    const directDispatch = this._dispatchReducerFactory(dispatch);

    Ajax.deleteDatabase(
      action.dbid,
      action.dbname,
      'elastic',
    ).then((result: any) =>
    {
      this.fetchAction(dispatch);
    }).catch((err) =>
    {
      let errMessage = '';
      try
      {
        errMessage = MidwayError.fromJSON(err).getDetail();
      }
      catch (e)
      {
        errMessage = String(err);
      }
      directDispatch({
        actionType: 'addModal',
        props: {
          title: 'Error',
          message: `Error attempting to delete index: ${errMessage}`,
          error: true,
        },
      });
    });
  }

  public overrideAct(action: Unroll<SchemaActionTypes>)
  {
    if (action.actionType === 'fetch')
    {
      return this.fetchAction.bind(this);
    }
    else if (action.actionType === 'deleteElasticIndex')
    {
      return this.deleteElasticIndexAction.bind(this, action);
    }
  }
}

const ReduxInstance = new SchemaRedux();
export const SchemaActions = ReduxInstance._actionsForExport();
export const SchemaReducers = ReduxInstance._reducersForExport(_SchemaState);
export declare type SchemaActionType<K extends keyof SchemaActionTypes> = GetType<K, SchemaActionTypes>;
