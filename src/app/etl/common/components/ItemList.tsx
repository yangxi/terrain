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
// tslint:disable:strict-boolean-expressions

import { List } from 'immutable';
import * as _ from 'lodash';
import memoizeOne from 'memoize-one';
import * as React from 'react';

import PathfinderCreateLine from 'app/builder/components/pathfinder/PathfinderCreateLine';
import { backgroundColor, borderColor, Colors, fontColor } from 'app/colors/Colors';
import { Menu } from 'common/components/Menu';
import TerrainComponent from 'common/components/TerrainComponent';
import { instanceFnDecorator } from 'shared/util/Classes';
import Quarantine from 'util/RadiumQuarantine';
import './ItemList.less';

// configure each column
export interface HeaderConfigItem<T>
{
  name: string;
  render: (rowElem: T, index) => any;
  style?: object;
}
export type HeaderConfig<T> = Array<HeaderConfigItem<T>>;

export interface Props<T>
{
  items: List<T>;
  columnConfig: HeaderConfig<T>;
  onRowClicked?: (index) => void; // callback for when a row is clicked
  getMenuOptions?: (item, index) => any; // passed to <Menu/> for each item if a context menu is desired
  getActions?: (index: number, item: T) => El;
  itemsName?: string;
  canCreate?: boolean;
  onCreate?: () => void;
  loading?: boolean;
  loadingMessage?: string;
  canSearch?: boolean;
  searchFunction?: (searchText: string, item: T) => boolean;
}

const memoize = _.memoize;

export class ItemList<T> extends TerrainComponent<Props<T>>
{
  public static defaultProps = {
    loading: false,
    loadingMessage: null,
  };

  public state: {
    searchQuery: string,
    searchedItems: List<T>,
  } = {
      searchQuery: '',
      searchedItems: List(),
    };

  constructor(props)
  {
    super(props);
  }

  @instanceFnDecorator(memoizeOne)
  public rowClickedMemoized(onRowClicked)
  {
    return _.memoize((index) => () => { onRowClicked(index); });
  }

  public getRowClickedFn(index): () => void
  {
    if (this.props.onRowClicked === undefined)
    {
      return undefined;
    }
    return this.rowClickedMemoized(this.props.onRowClicked)(index);
  }

  public renderRow(item: T, index: number)
  {
    const onClick = this.getRowClickedFn(index);
    const style = [backgroundColor(Colors().fontWhite, Colors().blockBg), borderColor(Colors().blockBg)];
    const { columnConfig } = this.props;
    return (
      <Quarantine key={index}>
        <div
          className='row-info'
          onClick={onClick}
          style={style}
        >
          {
            columnConfig.map((headerItem: HeaderConfigItem<T>, i: number) =>
            {
              return (
                <div
                  className='row-info-data'
                  key={i}
                  style={_.extend(
                    {},
                    headerItem.style || { width: `${100 / columnConfig.length}%` },
                    fontColor(Colors().active),
                  )}
                >
                  {headerItem.render(item, index)}
                </div>
              );
            })
          }
          {
            this.props.getMenuOptions !== undefined ?
              <div className='row-info-data row-info-data-menu' key='context-menu'>
                <div className='item-list-menu-options-wrapper'>
                  <Menu
                    options={this.props.getMenuOptions(item, index)}
                    overrideMultiplier={8}
                  />
                </div>
              </div>
              : undefined
          }
          {
            this.props.getActions !== undefined ?
              <div className='row-info-actions'>
                {this.props.getActions(index, item)}
              </div>
              :
              null
          }
        </div>
      </Quarantine>
    );
  }

  public getEmptyItemsListMessage()
  {
    const { loading, loadingMessage } = this.props;

    let message = '';

    if (loading)
    {
      if (loadingMessage !== null)
      {
        message = loadingMessage;
      }
      else
      {
        message = `Loading ${this.props.itemsName || 'item'}s...`;
      }
    }
    else
    {
      message = `There aren't any ${this.props.itemsName || 'item'}s yet`;
    }

    return message;
  }

  public handleSearchQuery(e)
  {
    this.setState(
      {
        searchQuery: e.target.value,
        searchedItems: this.props.items.filter((item) => this.props.searchFunction(e.target.value, item)),
      },
    );
  }

  public renderSearchBar()
  {
    return (
      <div className='item-list-search-bar'>
        <input
          type='text'
          className='search-bar-input'
          placeholder='Search...'
          value={this.state.searchQuery}
          onChange={this.handleSearchQuery}
        />
      </div>
    );
  }

  public render()
  {
    const { columnConfig, getMenuOptions, loading } = this.props;
    const items = (this.state.searchQuery.length === 0) ? this.props.items : this.state.searchedItems;

    return (
      <div className='search-bar-and-table'>
        {this.props.canSearch && this.renderSearchBar()}
        <div
          className='item-list-table'
          style={backgroundColor(Colors().blockBg)}
        >
          <div
            className='row-info-header'
            key='header'
          >
            {
              columnConfig.map((headerItem: HeaderConfigItem<T>, i: number) =>
              {
                return (
                  <div
                    className='row-info-data'
                    key={i}
                    style={_.extend(
                      {},
                      headerItem.style || { width: `${100 / columnConfig.length}%` },
                    )}
                  >
                    {headerItem.name}
                  </div>
                );
              })
            }
            {
              getMenuOptions !== undefined ?
                <div className='row-info-data' key='context-menu' />
                : undefined
            }
          </div>

          {
            items.size > 0 && !loading ?
              items.map(this.renderRow).toList()
              :
              <div className='item-list-message'>
                {this.getEmptyItemsListMessage()}
              </div>
          }

          {
            this.props.canCreate &&
            <PathfinderCreateLine
              text={'Create ' + this.props.itemsName}
              canEdit={true}
              onCreate={this.props.onCreate}
              showText={true}
            />
          }
        </div>
      </div>
    );
  }
}
