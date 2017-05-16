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

import * as winston from 'winston';
import * as Tasty from '../../tasty/Tasty';
import * as App from '../App';

import DatabaseController from '../../database/DatabaseController';
import * as DBUtil from '../../database/Util';
import DatabaseRegistry from '../../databaseRegistry/DatabaseRegistry';
import { ItemConfig, items } from '../items/ItemRouter';
import { UserConfig } from '../users/UserRouter';
import * as Util from '../Util';

// CREATE TABLE databases (id integer PRIMARY KEY, name text NOT NULL, type text NOT NULL, \
// dsn text NOT NULL, status text);

export interface DatabaseConfig
{
  id?: number;
  name: string;
  type: string;
  dsn: string;
  status?: string;
}

export class Databases
{
  private databaseTable: Tasty.Table;

  constructor()
  {
    this.databaseTable = new Tasty.Table('databases', ['id'], ['name', 'type', 'dsn', 'status']);
  }

  public async delete(id: number): Promise<object[]>
  {
    return App.DB.delete(this.databaseTable, { id } as DatabaseConfig);
  }

  public async select(columns: string[], filter: object): Promise<DatabaseConfig[]>
  {
    return App.DB.select(this.databaseTable, columns, filter) as Promise<DatabaseConfig[]>;
  }

  public async get(id?: number): Promise<DatabaseConfig[]>
  {
    if (id !== undefined)
    {
      return this.select([], { id });
    }
    return this.select([], {});
  }

  public async upsert(user: UserConfig, db: DatabaseConfig): Promise<string>
  {
    return new Promise<string>(async (resolve, reject) =>
    {
      if (db.id !== undefined)
      {
        const results: DatabaseConfig[] = await this.get(db.id);
        // database id specified but database not found
        if (results.length === 0)
        {
          return reject('Invalid db id passed');
        }

        db = Util.updateObject(results[0], db);
      }

      await App.DB.upsert(this.databaseTable, db);
      resolve('Success');
    });
  }

  public async connect(user: UserConfig, id: number): Promise<string>
  {
    return new Promise<string>(async (resolve, reject) =>
    {
      const results: DatabaseConfig[] = await this.get(id);
      if (results.length === 0)
      {
        return reject('Invalid db id passed');
      }

      const db: DatabaseConfig = results[0];
      if (db.id === undefined)
      {
        return reject('Database does not have an ID');
      }

      const controller: DatabaseController = DBUtil.makeDatabaseController(db.type, db.dsn);
      DatabaseRegistry.set(db.id, controller);
      db.status = 'CONNECTED';
      await this.upsert(user, db);
      resolve('Success');
    });
  }

  public async disconnect(user: UserConfig, id: number): Promise<string>
  {
    await DatabaseRegistry.remove(id);
    // TODO: clean up controller?
    await this.upsert(user, { id, status: 'DISCONNECTED' } as DatabaseConfig);
    return Promise.resolve('Success');
  }

  public async schema(id: number): Promise<string>
  {
    const controller = await DatabaseRegistry.get(id);
    if (controller === undefined)
    {
      return Promise.reject('Invalid db id passed');
    }

    const schema: Tasty.Schema = await controller.getTasty().schema();
    return schema.toString();
  }
}

export default Databases;
