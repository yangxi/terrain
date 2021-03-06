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

// tslint:disable:no-var-requires strict-boolean-expressions no-unused-expression

import * as React from 'react';

import { ConnectionConfig, ConnectionState } from 'app/connections/ConnectionTypes';
import { ConnectionsActions } from 'app/connections/data/ConnectionsRedux';
import TerrainTools from 'app/util/TerrainTools';
import { Colors, fontColor } from 'colors/Colors';
import Badge from 'common/components/Badge';
import { MultiModal } from 'common/components/overlay/MultiModal';
import Util from 'util/Util';
import TerrainComponent, { browserHistory } from '../../common/components/TerrainComponent';
import { ItemList } from '../../etl/common/components/ItemList';

const CheckIcon = require('images/icon_checkMark.svg');
const CloseIcon = require('images/icon_close_8x8.svg');

import './Connections.less';

export interface Props
{
  connectionsActions?: typeof ConnectionsActions;
  connections?: ConnectionState;
  params?: any;
}

class Connections extends TerrainComponent<Props>
{
  constructor(props: Props)
  {
    super(props);
  }

  public componentDidMount()
  {
    this.getConnections();
  }

  public createConnection()
  {
    browserHistory.push(`/account/connections/edit`);
  }

  public deleteConnection(connectionId: number, e?)
  {
    if (e !== undefined)
    {
      e.stopPropagation();
    }
    const onConfirm = () =>
    {
      this.props.connectionsActions({
        actionType: 'deleteConnection',
        connectionId,
      });
    };

    this.props.connectionsActions({
      actionType: 'addModal',
      props: {
        title: 'Delete Connection',
        message: 'Are you sure you want to delete this connection?',
        closeOnConfirm: true,
        confirm: true,
        confirmButtonText: 'Delete',
        onConfirm,
      },
    });
  }

  public getConnections()
  {
    this.props.connectionsActions({
      actionType: 'getConnections',
    });
  }

  public setModalRequests(requests)
  {
    this.props.connectionsActions({
      actionType: 'setModalRequests',
      requests,
    });
  }

  public handleRowClick(index: number)
  {
    const { connections } = this.props;
    const keys = connections.connections.keySeq().toList().sort();
    browserHistory.push(`/account/connections/edit/connectionId=${keys.get(index)}`);
  }

  public getConnectionActions(index: number, connection: ConnectionConfig)
  {
    return (
      <CloseIcon
        className='close'
        onClick={this._fn(this.deleteConnection, connection.id)}
      />
    );
  }

  public getStatusColor(status: string)
  {
    return Colors().connectionStatuses[status];
  }

  public renderProperty(propertyName, item: ConnectionConfig, index: number)
  {
    if (propertyName === 'status')
    {
      return (
        <Badge
          label={item.get(propertyName)}
          color={this.getStatusColor(item.get(propertyName))}
        />
      );
    }
    else if (propertyName === 'analytics')
    {
      if (item.get('isAnalytics'))
      {
        return (
          <div
            className='connections-analytics-status'
            style={fontColor(Colors().success)}
          >
            <CheckIcon />
          </div>
        );
      }
    }
    else
    {
      return (
        <div>
          {item.get(propertyName)}
        </div>
      );
    }
  }

  public render()
  {
    const { connections } = this.props;
    const keys = connections.connections.keySeq().toList().sort();
    const connList = keys.map((id) => connections.connections.get(id));

    return (
      <div
        className='connections-page'
      >
        <div className='connections-page-title' style={{ color: Colors().mainSectionTitle }}>Database Connections</div>
        <div
          className='connections-list-wrapper'
        >
          <ItemList
            items={connList.toList()}
            columnConfig={[
              {
                name: 'id',
                render: this._fn(this.renderProperty, 'id'),
                style: { width: `5%` },
              },
              {
                name: 'name',
                render: this._fn(this.renderProperty, 'name'),
                style: { width: `30%` },
              },
              {
                name: 'type',
                render: this._fn(this.renderProperty, 'type'),
                style: { width: `10%` },
              },
              {
                name: 'address',
                render: this._fn(this.renderProperty, 'dsn'),
                style: { width: `20%` },
              },
              {
                name: 'analytics',
                render: this._fn(this.renderProperty, 'analytics'),
                style: { width: `20%` },
              },
              {
                name: 'status',
                render: this._fn(this.renderProperty, 'status'),
                style: { width: `15%` },
              },
            ]}
            onRowClicked={this.handleRowClick}
            getActions={this.getConnectionActions}
            itemsName='connection'
            canCreate={TerrainTools.isAdmin()}
            onCreate={this.createConnection}
            loading={connections.loading}
          />
        </div>
        <MultiModal
          requests={this.props.connections.modalRequests}
          setRequests={this.setModalRequests}
        />
      </div>
    );
  }
}

const ConnectionList = Util.createTypedContainer(
  Connections,
  [
    ['connections'],
  ],
  {
    connectionsActions: ConnectionsActions,
  },
);

export default ConnectionList;
