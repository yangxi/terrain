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

import * as React from 'react';

import { browserHistory } from 'react-router';
import { backgroundColor, Colors, fontColor } from '../../common/Colors';
import InfoArea from './../../common/components/InfoArea';
import TerrainComponent from './../../common/components/TerrainComponent';
import RolesActions from './../../roles/data/RolesActions';
import UserActions from './../../users/data/UserActions';
import Actions from './../data/LibraryActions';
import { LibraryState } from './../data/LibraryStore';
import Store from './../data/LibraryStore';
import * as LibraryTypes from './../LibraryTypes';
import AlgorithmsColumn from './AlgorithmsColumn';
import GroupsColumn from './GroupsColumn';
import './Library.less';
import LibraryInfoColumn from './LibraryInfoColumn';
import VariantsColumn from './VariantsColumn';

export interface Props
{
  params?: any;
  location?: any;
  router?: any;
  route?: any;
  // params?: any;
  // location?: {
  //   pathname: string;
  // };
}

class Library extends TerrainComponent<any>
{
  public static defaultProps: Partial<Props> = {
    params: {},
    location: {},
    router: {},
    route: {},
  };

  public cancelSubscription = null;

  public state: {
    libraryState: LibraryState;
  } = {
    libraryState: null,
  };

  constructor(props)
  {
    super(props);

    this.state.libraryState = props.store ? props.store.getState() : Store.getState();
  }

  public componentWillMount()
  {
    if (!this.props.params || !this.props.params.groupId)
    {
      // no path given, redirect to last library path
      const path = localStorage.getItem('lastLibraryPath');
      if (path != null)
      {
        browserHistory.replace(path);
      }
    }
  }

  public componentDidMount()
  {
    this._subscribe(Store, {
      stateKey: 'libraryState',
      isMounted: true,
    });

    RolesActions.fetch();
    UserActions.fetch();
  }

  public render()
  {
    const { libraryState } = this.state;

    const { groups, algorithms, variants, selectedVariants, groupsOrder } = libraryState;
    const { params } = this.props;
    const groupId = +params.groupId;
    const algorithmId = +params.algorithmId;
    const variantId = +params.variantId;
    const multiselect = false;

    let group: LibraryTypes.Group;
    let algorithm: LibraryTypes.Algorithm;
    let variant: LibraryTypes.Variant;
    let algorithmsOrder: List<ID>;
    let variantsOrder: List<ID>;

    if (groupId != null)
    {
      group = groups.get(groupId);

      if (group != null)
      {
        algorithmsOrder = group.algorithmsOrder;

        if (algorithmId != null)
        {
          algorithm = algorithms.get(algorithmId);

          if (algorithm != null)
          {
            variantsOrder = algorithm.variantsOrder;

            if (variantId != null)
            {
              variant = variants.get(variantId);

              if (variant == null)
              {
                browserHistory.replace(`/library/${groupId}/${algorithmId}`);
              }
            }
          } else
          {
            // !algorithm
            browserHistory.replace(`/library/${groupId}`);
          }
        }
      }
      else
      {
        // !group
        browserHistory.replace('/library');
      }
    }

    if (!!this.props.location.pathname)
    {
      localStorage.setItem('lastLibraryPath', this.props.location.pathname);
    }

    return (
      <div className='library'>
        <GroupsColumn
          {...{
            groups,
            groupsOrder,
            params,
          }}
        />
        <AlgorithmsColumn
          {...{
            algorithms,
            variants,
            algorithmsOrder,
            groupId,
            params,
          }}
        />
        <VariantsColumn
          {...{
            variants,
            selectedVariants,
            variantsOrder,
            groupId,
            algorithmId,
            params,
            multiselect,
          }}
        />
        {!multiselect ?
          <LibraryInfoColumn
            {...{
              group,
              algorithm,
              variant,
            }}
          /> : null
        }
      </div>
    );
  }
}

export default Library;
