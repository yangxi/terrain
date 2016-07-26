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

require('./VariantVersions.less');
import * as React from 'react';
import Classs from './../../common/components/Classs.tsx';
import BrowserTypes from './../BrowserTypes.tsx';
import UserThumbnail from './../../users/components/UserThumbnail.tsx';
import UserTypes from './../../users/UserTypes.tsx';
import UserStore from './../../users/data/UserStore.tsx';


type Variant = BrowserTypes.Variant;
type User = UserTypes.User;
type UserMap = UserTypes.UserMap;


interface Props
{
  variant: Variant;
}

class VariantVersions extends Classs<Props>
{
  state: {
    users: UserMap,
    me: User,
  } = {
    users: null,
    me: null,
  }
  
  constructor(props:Props)
  {
    super(props);
    
    this._subscribe(UserStore, {
      stateKey: 'users', 
      storeKeyPath: ['users'],
    });
    this._subscribe(UserStore, {
      stateKey: 'me', 
      storeKeyPath: ['currentUser'],
    });
  }

  renderVersion(version) {
    return (
      <div 
        className="versions-table-row"
        key={version.index}
      >
        <div className="versions-table-element">
          <UserThumbnail username={version.user} medium={false}/>
        </div>
        <div className="versions-table-element versions-table-text-element">
          {version.time}
        </div>
        <div className="versions-table-right-align">
          {version.index === 0 ? "Current Version" : null}
        </div>
      </div>
    );
  }
  
  render()
  {
    var versions = [
      {
        user: "luser",
        time: "12 hours ago",
        index: 0,
      },
      {
        user: "luser",
        time: "18 hours ago",
        index: 1,
      },
            {
        user: "test",
        time: "3 days ago",
        index: 2,
      },
    ];

    return(
      <div className="versions-table-wrapper">
        <div className="versions-table-title">
          Version History
        </div>
      <div className="versions-table">
        {versions.map(this.renderVersion)}
      </div>
      </div>
    );
  }
}

export default VariantVersions;