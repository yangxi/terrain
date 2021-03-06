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
// tslint:disable:no-var-requires

import Modal from 'common/components/Modal';
import TerrainComponent from 'common/components/TerrainComponent';
import * as Radium from 'radium';
import * as React from 'react';
import { backgroundColor, Colors, fontColor } from 'src/app/colors/Colors';
import Util from 'util/Util';

import { ETLActions } from 'etl/ETLRedux';
import ETLRouteUtil from 'etl/ETLRouteUtil';
import { ETLState } from 'etl/ETLTypes';
import ExecutionHelpers from 'etl/helpers/ExecutionHelpers';
import Initializers from 'etl/helpers/TemplateInitializers';
import TemplateEditor from 'etl/templates/components/TemplateEditor';
import { TemplateEditorActions } from 'etl/templates/TemplateEditorRedux';
import { WalkthroughState } from 'etl/walkthrough/ETLWalkthroughTypes';
import { SchemaActions } from 'schema/data/SchemaRedux';
import { ETLTemplate, getSourceFiles, restoreSourceFiles } from 'shared/etl/immutable/TemplateRecords';
import { notificationManager } from './../../common/components/InAppNotification';

import { List } from 'immutable';
import './ETLEditorPage.less';

export interface Props
{
  // injected
  location?: any;
  match: {
    params?: {
      algorithmId?: number,
      templateId?: number;
    };
  };
  walkthrough?: WalkthroughState;
  etl?: ETLState;
  editorAct?: typeof TemplateEditorActions;
  etlAct?: typeof ETLActions;
  schemaAct?: typeof SchemaActions;
  isDirty?: boolean;
  template?: ETLTemplate;
}

function getAlgorithmId(params): number
{
  const asNumber = (params != null && params.algorithmId != null) ? Number(params.algorithmId) : NaN;
  return Number.isNaN(asNumber) ? -1 : asNumber;
}

function getTemplateId(params): number
{
  const asNumber = (params != null && params.templateId != null) ? Number(params.templateId) : NaN;
  return Number.isNaN(asNumber) ? -1 : asNumber;
}

@Radium
class ETLEditorPage extends TerrainComponent<Props>
{
  public state: {
    leaving: boolean;
    switchingTemplate: boolean;
    nextLocation: string,
  } = {
      leaving: false,
      nextLocation: '',
      switchingTemplate: false,
    };

  public confirmedLeave: boolean = false;
  public unregisterHook = () => null;

  public saveTemplate(template: ETLTemplate, isSaveAs: boolean, onSuccess?: () => void)
  {
    const { etlAct, editorAct } = this.props;

    // important for user-uploaded files
    const fileCache = getSourceFiles(template);

    const handleLoad = (savedTemplates: List<ETLTemplate>) =>
    {
      if (savedTemplates.size > 0)
      {
        const savedTemplate = restoreSourceFiles(savedTemplates.get(0), fileCache);
        editorAct({
          actionType: 'setTemplate',
          template: savedTemplate,
          history: 'void',
        });
        editorAct({
          actionType: 'rebuildFieldMap',
        });
        editorAct({ // todo need to lock the ui during a save
          actionType: 'setIsDirty',
          isDirty: false,
        });
        if (savedTemplate.id !== template.id) // check if its a save
        {
          ETLRouteUtil.gotoEditTemplate(savedTemplate.id);
        }

        notificationManager.addNotification(
          'Template saved',
          savedTemplate.templateName,
          'info',
          4,
        );
      }
      else
      {
        // todo handle error
      }

      if (onSuccess !== undefined)
      {
        onSuccess();
      }
    };
    const handleError = (ev) =>
    {
      this.props.editorAct({
        actionType: 'addModal',
        props: {
          title: 'Error',
          message: String(ev),
          error: true,
        },
      });
    };

    if (isSaveAs)
    {
      etlAct({
        actionType: 'saveAsTemplate',
        template,
        onLoad: handleLoad,
        onError: handleError,
      });
    }
    else if (template.id === -1) // then its a new template
    {
      etlAct({
        actionType: 'createTemplate',
        template,
        onLoad: handleLoad,
        onError: handleError,
      });
    }
    else
    {
      etlAct({
        actionType: 'saveTemplate',
        template,
        onLoad: handleLoad,
        onError: handleError,
      });
    }
  }

  public switchTemplate(template: ETLTemplate)
  {
    if (template.id !== this.props.template.id)
    {
      this.setState({
        switchingTemplate: true,
      });
    }
    ETLRouteUtil.gotoEditTemplate(template.id);
  }

  public executeTemplate(template: ETLTemplate)
  {
    ExecutionHelpers.runInlineTemplate(template);
  }

  // is there a better pattern for this?
  public componentWillReceiveProps(nextProps)
  {
    if (this.props.match === undefined || nextProps.match === undefined)
    {
      return;
    }
    const params = this.props.match.params;
    const nextParams = nextProps.match.params;

    if (params == null || nextParams == null)
    {
      return;
    }
    if (
      ETLRouteUtil.isRouteNewTemplate(this.props.location) &&
      getTemplateId(nextParams) !== -1
    )
    {
      // then we went from new template to saved template
      if (this.state.switchingTemplate)
      {
        this.initFromRoute(nextProps);
      }
    }
    else if (
      getAlgorithmId(params) !== -1 &&
      getTemplateId(nextParams) !== -1
    )
    {
      // then we went from an algorithm export to saved template
      if (this.state.switchingTemplate)
      {
        this.initFromRoute(nextProps);
      }
    }
    else if (params.algorithmId !== nextParams.algorithmId)
    {
      this.initFromRoute(nextProps);
    }
    else if (params.templateId !== nextParams.templateId)
    {
      this.initFromRoute(nextProps);
    }
    else if (ETLRouteUtil.isRouteNewTemplate(this.props.location) !==
      ETLRouteUtil.isRouteNewTemplate(nextProps.location))
    {
      this.initFromRoute(nextProps);
    }
  }

  public initFromRoute(props: Props)
  {
    const { match: { params }, editorAct, walkthrough } = props;
    editorAct({
      actionType: 'resetState',
    });

    if (params.algorithmId !== undefined)
    {
      Initializers.initNewFromAlgorithm(getAlgorithmId(params));
    }
    else if (params.templateId !== undefined)
    {
      const templateId = getTemplateId(params);
      Initializers.loadExistingTemplate(templateId);
    }
    else if (ETLRouteUtil.isRouteNewTemplate(props.location) &&
      props.walkthrough.source.type != null)
    {
      Initializers.initNewFromWalkthrough();
    }
    else
    {
      ETLRouteUtil.gotoWalkthroughStep(0);
    }
  }

  public componentDidMount()
  {
    this.initFromRoute(this.props);
    this.unregisterHook = this.browserHistory.block(this.routerWillLeave as any);
  }

  public componentWillUnmount()
  {
    this.unregisterHook();
  }

  public routerWillLeave(nextLocation): boolean
  {
    if (this.confirmedLeave)
    {
      this.confirmedLeave = false;
      return true;
    }

    if (this.shouldSave())
    {
      this.setState({
        leaving: true,
        nextLocation,
      });
      return false;
    }
    return true;
  }

  public shouldSave()
  {
    return this.props.isDirty;
  }

  public render()
  {
    const { template } = this.props;
    return (
      <div
        className='template-display-wrapper'
        style={[
          fontColor(Colors().text1),
          backgroundColor(Colors().blockBg),
        ]}
      >
        <TemplateEditor
          onSave={this.saveTemplate}
          onSwitchTemplate={this.switchTemplate}
          onExecuteTemplate={this.executeTemplate}
        />
        <Modal
          open={this.state.leaving}
          message={'Save changes' + (template.templateName !== '' ? ' to ' + template.templateName : '') + ' before leaving?'}
          title='Unsaved Changes'
          confirmButtonText='Save'
          confirm={true}
          onClose={this.handleModalCancel}
          onConfirm={this.handleModalSave}
          thirdButtonText="Don't Save"
          onThirdButton={this.handleModalDontSave}
        />
      </div>
    );
  }

  public handleModalCancel()
  {
    this.setState({
      leaving: false,
      switchingTemplate: false,
    });
  }

  public handleModalDontSave()
  {
    this.confirmedLeave = true;
    this.browserHistory.push(this.state.nextLocation);
    this.setState({
      leaving: false,
      switchingTemplate: false,
    });
  }

  public handleModalSave()
  {
    const { template } = this.props;

    const onSaveSuccess = () =>
    {
      this.confirmedLeave = true;
      this.setState({
        leaving: false,
        switchingTemplate: false,
      });
      this.browserHistory.push(this.state.nextLocation);
    };

    if (template.id !== -1)
    {
      this.saveTemplate(this.props.template, false, onSaveSuccess);
    }
    else
    {
      this.saveTemplate(this.props.template.set('templateName', 'New Template'), false, onSaveSuccess);
    }

  }
}

export default Util.createContainer(
  ETLEditorPage,
  [
    ['walkthrough'],
    ['etl'],
    ['templateEditor', 'isDirty'],
    ['templateEditor', 'template'],
  ],
  { editorAct: TemplateEditorActions, etlAct: ETLActions, schemaAct: SchemaActions },
);
