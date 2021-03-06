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

// Copyright 2018 Terrain Data, Inc.
// tslint:disable:no-var-requires max-classes-per-file no-console

import * as React from 'react';

import './Walkthrough.less';

export interface WalkthroughProps<ViewEnum, Context>
{
  context?: Context; // passed to custom components
  style?: any;
  stepIndex: number; // current position in the step history
  stepHistory: List<ViewEnum>;
  transitionParams?: object;
  setSteps: (newStep: number, newHistory: List<ViewEnum>) => void;
}

export interface ComponentProps<Context = any>
{
  context?: Context;
  onDone: () => void;
  [k: string]: any; // for compatibility
}

export type WalkthroughComponentClass<Context = any> = React.ComponentClass<ComponentProps<Context>>;

export interface WalkthroughNodeOption<ViewEnum, Context>
{
  link: ViewEnum; // What ViewEnum to go to next
  buttonText?: string; // if it's a simple button, what does it say?
  component?: WalkthroughComponentClass<Context>; // if it's a custom ui interaction, what component to use
  extraProps?: () => object;
  onRevert?: (params: object) => void; // called when the step gets reverted (if a user goes to a previous crumb and changes the path)
  onArrive?: (params: object) => void;
  // called when we arrive at the step containing this option (only when it is a new step, not a revisit)
  default?: boolean; // TODO
}

export interface WalkthroughGraphNode<ViewEnum, Context>
{
  prompt: string; // the main prompt to give to the user
  crumbText?: string; // the text that shows up in the breadcrumbs
  additionalText?: string; // a subtitle for the prompt
  options: Array<WalkthroughNodeOption<ViewEnum, Context>>;
}

export interface WalkthroughGraphType<ViewEnum, Context = any>
{
  [kS: string]: WalkthroughGraphNode<ViewEnum, Context>; // for string enums
  [kN: number]: WalkthroughGraphNode<ViewEnum, Context>; // for traditional enums
}
