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

// tslint:disable:no-var-requires restrict-plus-operands strict-boolean-expressions

import TerrainComponent from 'app/common/components/TerrainComponent';
import * as classNames from 'classnames';
import * as Immutable from 'immutable';
import * as $ from 'jquery';
import * as React from 'react';
import { altStyle, backgroundColor, borderColor, Colors, fontColor, getStyle } from '../../../colors/Colors';
const { List, Map } = Immutable;
import DragHandle from 'app/common/components/DragHandle';
import FadeInOut from 'app/common/components/FadeInOut';
const RemoveIcon = require('images/icon_close_8x8.svg?name=RemoveIcon');
import { tooltip } from 'app/common/components/tooltip/Tooltips';

export interface Props
{
  index?: number;
  canDrag: boolean;
  canDelete: boolean;
  canEdit: boolean;
  children?: any;
  onDelete?: (index: number) => void;
  depth?: number;
  pieces?: List<PathfinderPiece>;
  // For expandable section, like transform chart
  expanded?: boolean;
  expandableContent?: any;
  onExpand?: (index: number, expanded: boolean) => void;
  expandButton?: any; // What the user presses to expand the section
  expandOnLeft?: boolean;
}

export type PathfinderPiece = El |
  {
    content: El,
    visible: boolean,
  };

export class PathfinderLine extends TerrainComponent<Props>
{
  public state: {
  } = {
  };

  public render()
  {
    const { canDrag, canDelete, canEdit, children, pieces } = this.props;
    return (
      <div className='pf-line-wrapper'>
        <div
          className={classNames({
            'pf-line': true,
            'pf-line-draggable': canDrag,
            'pf-line-deletable': canDelete,
          })}
        >
          {
            this.renderLeft()
          }
          {
            this.renderPieces()
          }
          {
            children
          }
          {
            this.renderRight()
          }
        </div>
        {this.props.expandableContent !== undefined &&
          <FadeInOut
            open={this.props.expanded}
          >
            {this.props.expandableContent}
          </FadeInOut>
        }
      </div>
    );
  }

  private renderPieces(): El[]
  {
    const { pieces } = this.props;
    if (pieces === undefined || pieces === null)
    {
      return null;
    }

    return pieces.map((piece, index) =>
    {
      let content = piece as El;
      let showing = true;

      if (piece['showing'] !== undefined && piece['content'] !== undefined)
      {
        // it is the interface version
        content = piece['content'] as El;
        showing = piece['showing'] as boolean;
      }

      return (
        <div
          className={classNames({
            'pf-piece': true,
            'pf-piece-hidden': !showing,
          })}
          key={index}
        >
          {
            content
          }
        </div>
      );
    }).toArray();
  }

  private renderLeft(): El
  {
    if (this.props.expandableContent === undefined || !this.props.expandOnLeft)
    {
      return null;
    }

    return (
      <div
        className='pf-line-left expand'
        onClick={this._fn(this.props.onExpand, !this.props.expanded)}
      >
        {this.props.expandButton}
      </div>
    );
  }

  private renderRight(): El
  {
    if ((!this.props.canEdit || !this.props.canDelete) && this.props.expandableContent === undefined)
    {
      return null;
    }

    return (
      <div className='pf-line-right'>
        {
          this.props.expandableContent !== undefined && !this.props.expandOnLeft &&
          <div
            className='expand'
            onClick={this._fn(this.props.onExpand, !this.props.expanded)}
          >
            {this.props.expandButton}
          </div>
        }
        {
          this.props.canEdit && this.props.canDelete &&
          tooltip(<div
            className='close'
            onClick={this._fn(this.props.onDelete, this.props.index)}
          >
            <RemoveIcon />
          </div>, 'Delete')
        }
      </div>
    );
  }
}

export default PathfinderLine;
