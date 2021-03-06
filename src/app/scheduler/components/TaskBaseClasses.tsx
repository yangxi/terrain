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
// tslint:disable:no-var-requires max-classes-per-file strict-boolean-expressions
import TerrainComponent from 'common/components/TerrainComponent';
import memoizeOne from 'memoize-one';
import * as React from 'react';
import { Colors, fontColor } from 'src/app/colors/Colors';

import { DynamicForm } from 'common/components/DynamicForm';
import { DisplayType, InputDeclarationMap } from 'common/components/DynamicFormTypes';
import { ETLTemplate } from 'shared/etl/immutable/TemplateRecords';

import EndpointForm from 'app/etl/common/components/EndpointForm';
import { ParamConfigType, TaskConfig } from 'app/scheduler/SchedulerTypes';
import FadeInOut from 'common/components/FadeInOut';
import TaskEnum from 'shared/types/jobs/TaskEnum';

import { List, Map } from 'immutable';
import { instanceFnDecorator } from 'shared/util/Classes';

export interface Props
{
  task: TaskConfig;
  onChange: (newTask: TaskConfig) => void;
  templates?: List<ETLTemplate>;
}

abstract class TaskFormBase<FormState, P extends Props = Props> extends TerrainComponent<P>
{
  public abstract inputMap: InputDeclarationMap<FormState>;

  public state = {
    open: Map<string, boolean>(),
  };

  constructor(props)
  {
    super(props);
    this.handleFormChange = this.handleFormChange.bind(this);
  }

  /*
   * Override these converstion methods to customize form behavior / structure
   */
  public configToState(config): FormState
  {
    return config ? config.toObject() : {};
  }

  public stateToConfig(state: FormState)
  {
    return state ? Map(state) : state;
  }

  public toggleState(key: string)
  {
    const toggled = this.state.open.get(key) ? false : true;
    this.setState({
      open: this.state.open.set(key, toggled),
    });
  }

  public render()
  {
    const { params } = this.props.task;
    let state = {};
    if (params !== undefined)
    {
      state = this.configToState(params.get('options'));
    }
    return (
      <div>
        <DynamicForm
          inputMap={this.inputMap}
          inputState={state}
          onStateChange={this.handleFormChange}
        />
      </div>
    );
  }

  protected handleFormChange(state: FormState, apply?: boolean)
  {
    if (apply)
    {
      const { onChange, task } = this.props;
      const newConfig = this.stateToConfig(state);
      onChange(task.setIn(['params', 'options'], newConfig));
    }
  }

  protected handleComponentChange(componentType, key, value)
  {
    const { params } = this.props.task;
    if (params !== undefined)
    {
      const newValue = params.get('options').get(componentType).set(key, value);
      this.props.onChange(this.props.task.setIn(['params', 'options', componentType], newValue));
    }
  }
  protected renderEndpointSection(state, endpointType: string)
  {
    const template = this.props.templates.find((t) => t.id === state.templateId);
    if (!template)
    {
      return null;
    }
    const endpoints = template[endpointType];
    const overrideString = 'override' + endpointType.charAt(0).toUpperCase() + endpointType.slice(1);
    return (
      <div>
        <div
          onClick={this._fn(this.toggleState, endpointType)}
          className='task-item-sub-header'
          style={fontColor(Colors().active)}
        >
          {endpointType}
        </div>
        <FadeInOut
          open={this.state.open.get(endpointType)}
        >
          {
            endpoints.keySeq().map((key) =>
            {
              const endpoint = state[overrideString] && state[overrideString].get(key)
                ? state[overrideString].get(key) : endpoints.get(key);
              return (
                <EndpointForm
                  isSource={endpointType === 'sources'}
                  endpoint={endpoint}
                  onChange={this._fn(this.handleComponentChange, overrideString, key)}
                  isSchedule={true}
                  key={endpoint.name}
                />
              );
            })
          }
        </FadeInOut>
      </div>
    );
  }
}

type DefaultExitParamsT = ParamConfigType<'taskDefaultExit'>;
class DefaultExitForm extends TaskFormBase<DefaultExitParamsT>
{
  public inputMap: InputDeclarationMap<DefaultExitParamsT> = {};
}

type DefaultFailureParamsT = ParamConfigType<'taskDefaultFailure'>;
class DefaultFailureForm extends TaskFormBase<DefaultFailureParamsT>
{
  public inputMap: InputDeclarationMap<DefaultFailureParamsT> = {};
}

type ETLTaskParamsT = ParamConfigType<'taskETL'>;
class ETLTaskForm extends TaskFormBase<ETLTaskParamsT>
{
  public inputMap: InputDeclarationMap<ETLTaskParamsT> = {
    templateId: {
      type: DisplayType.Pick,
      displayName: 'Template',
      options: {
        pickOptions: (state) => this.getAvailableTemplates(this.props.templates)
          .map((t) => t.id).toList(),
        indexResolver: (option) => this.getAvailableTemplates(this.props.templates)
          .findIndex((t) => t.id === option),
        displayNames: (state) =>
        {
          if (!this.props.templates)
          {
            return Map();
          }
          let displayNames: IMMap<number, string> = Map<number, string>();
          this.props.templates.forEach((template) =>
          {
            displayNames = displayNames.set(template.id, template.templateName);
          });
          return displayNames;
        },
      },
    },
    overrideSources: {
      type: DisplayType.Custom,
      displayName: undefined,
      options: {
        render: (state, disabled) =>
        {
          return this.renderEndpointSection(state, 'sources');
        },
      },
    },
    overrideSinks: {
      type: DisplayType.Custom,
      displayName: undefined,
      options: {
        render: (state, disabled) =>
        {
          return this.renderEndpointSection(state, 'sinks');
        },
      },
    },
  };

  @instanceFnDecorator(memoizeOne)
  private getAvailableTemplates(templates: List<ETLTemplate>): List<ETLTemplate>
  {
    return !templates ? List() : templates.filter((t) => t.canSchedule()).toList();
  }
}

interface FormLookupMap
{
  [k: number]: React.ComponentClass<Props>;
}

export const TaskFormMap: FormLookupMap =
{
  [TaskEnum.taskDefaultExit]: DefaultExitForm,
  [TaskEnum.taskDefaultFailure]: DefaultFailureForm,
  [TaskEnum.taskETL]: ETLTaskForm,
};
