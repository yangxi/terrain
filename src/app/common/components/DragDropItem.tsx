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

import { Colors } from 'app/colors/Colors';
import TerrainComponent from 'app/common/components/TerrainComponent';
import * as classNames from 'classnames';
import { List } from 'immutable';
import * as _ from 'lodash';
import * as React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import './DragDropStyle.less';

interface ItemProps
{
  // data: string;
  keyPath: KeyPath;
  canDrop?: boolean;
  canDrag?: boolean;
  hoverHeader?: El;
  children?: El | string | ((connectDragSource: (e: El) => El) => El);
  connectsOwnDragHandle?: boolean;
  // ^ if this is true, pass in the function ((connectDragSource: (e: El) => El) => El)
  // to children, and connect the drag source yourself.
  data?: any;
  onDrop: (dropIndex: List<number>, dragIndex: List<number>) => void;
  onDragStart?: () => void;
  onDragStop?: () => void;
  style?: any;
  dropZoneStyle?: any;
  useCustomDragLayer?: boolean;
  // injected props
  connectDragSource: (El) => El;
  isDragging: boolean;
  neighborIsBeingDragged: boolean;
  isOver: boolean;
  connectDropTarget: (El) => El;
  connectDragPreview: (El, options) => El;
}

const itemSource = {
  beginDrag(props, monitor, component)
  {
    if (props.onDragStart !== undefined)
    {
      props.onDragStart();
    }
    const boundingRect = component.refs['item']['getBoundingClientRect']();
    return { keyPath: props.keyPath, data: props.data, width: boundingRect.width };
  },
  endDrag(props, monitor, component)
  {
    if (props.onDragStop !== undefined)
    {
      props.onDragStop();
    }
  },
};

function itemDragCollect(connect, monitor)
{
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
    neighborIsBeingDragged: !monitor.isDragging() && monitor.getItem() !== null,
    connectDragPreview: connect.dragPreview(),
  };
}

const itemDropTarget = {
  drop(props, monitor)
  {
    props.onDrop(props.keyPath, monitor.getItem().keyPath);
  },
  canDrop(props, monitor)
  {
    return !props.keyPath.equals(monitor.getItem().keyPath);
  },
};

function itemDropCollect(connect, monitor)
{
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver() && monitor.canDrop(),
  };
}

class ItemComponent extends TerrainComponent<ItemProps>
{
  public componentDidMount()
  {
    if (this.props.useCustomDragLayer)
    {
      // Use empty image as a drag preview so browsers don't draw it
      // and we can draw whatever we want on the custom drag layer instead.
      this.props.connectDragPreview(getEmptyImage(), {
        captureDraggingState: true,
      });
    }
  }

  public renderItemDropZone()
  {
    return this.props.connectDropTarget(
      <div
        className='drag-drop-item-drop-zone'
        style={this.props.dropZoneStyle}
      />,
    );
  }

  public render()
  {
    const { connectDragSource, isDragging, isOver, hoverHeader, neighborIsBeingDragged,
      canDrag, canDrop, connectsOwnDragHandle } = this.props;

    let { children } = this.props;

    if (connectsOwnDragHandle)
    {
      if (typeof children !== 'function')
      {
        throw new Error('Child function not provided to DragDropItem, even though connectsOwnDragHandle was set');
      }
      children = children(canDrag ? connectDragSource : IDENTITY_FUNCTION);
    }

    const el = (
      <div
        style={_.extend({},
          { opacity: isDragging ? 0.3 : 1 },
          isOver ? { borderColor: Colors().active } : {},
          this.props.style,
        )}
        className={classNames({
          'drag-drop-item': true,
          'drag-drop-item-dragging': isDragging,
          'drag-drop-item-neighbor-dragging': neighborIsBeingDragged,
          'drag-drop-item-is-over': isOver,
        })}>
        <div
          ref='item'
        >
          {
            hoverHeader !== undefined &&
            <div
              className={classNames({
                'drag-drop-item-header': true,
                'drag-drop-item-header-visible': isOver,
              })}
            >
              {hoverHeader}
            </div>
          }
          {
            children
          }
          {
            canDrop && neighborIsBeingDragged && this.renderItemDropZone()
          }
        </div>
      </div>
    );

    if (connectsOwnDragHandle)
    {
      // No need to connect drag source, as parent will do that.
      return this.props.connectDragPreview(el, {});

    }

    return canDrag ? this.props.connectDragSource(el) : el;
  }
}

const IDENTITY_FUNCTION = (v) => v;

const DragDropItem = DropTarget(['ITEM', 'GROUP'], itemDropTarget, itemDropCollect)(
  DragSource('ITEM', itemSource, itemDragCollect)
    (ItemComponent));

export default DragDropItem;
