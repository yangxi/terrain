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
// tslint:disable:import-spacing
import * as _ from 'lodash';

import
{
  _TemplateEditorState,
  EditorDisplayState,
  FetchStatus,
  FieldMap,
  TempCallback,
  TemplateEditorHistory,
  TemplateEditorState,
} from 'etl/templates/TemplateEditorTypes';
import { ETLTemplate } from 'shared/etl/immutable/TemplateRecords';

import { HistoryStack } from 'etl/common/HistoryStack';
import { ConstrainedMap, GetType, TerrainRedux, Unroll } from 'src/app/store/TerrainRedux';

import { createFieldMap, updateFieldFromEngine } from 'etl/templates/SyncUtil';

import { List } from 'immutable';

import { ModalProps, MultiModal } from 'common/components/overlay/MultiModal';

export interface TemplateEditorActionTypes
{
  setIsDirty: {
    actionType: 'setIsDirty';
    isDirty: boolean;
  };
  setTemplate: { // this should be the only way to mutate the template graph
    actionType: 'setTemplate';
    template: ETLTemplate;
    // push adds the template to the history, clear clears the history, void replaces the current value
    history: 'push' | 'clear' | 'void';
  };
  undoHistory: { // undo/redo
    actionType: 'undoHistory';
  };
  redoHistory: {
    actionType: 'redoHistory';
  };
  clearHistory: {
    actionType: 'clearHistory';
  };
  rebuildFieldMap: {
    actionType: 'rebuildFieldMap';
  };
  rebuildField: {
    actionType: 'rebuildField';
    fieldId: number;
  };
  setFieldMap: { // this should be the only way to mutate the template tree
    actionType: 'setFieldMap';
    fieldMap: FieldMap;
  };
  addModal: {
    actionType: 'addModal';
    props: ModalProps;
  };
  setModalRequests: {
    actionType: 'setModalRequests';
    requests: List<ModalProps>;
  };
  setDisplayState: {
    actionType: 'setDisplayState';
    state: Partial<{
      [k in keyof EditorDisplayState]: EditorDisplayState[k];
    }>;
  };
  updateDisplayState: {
    actionType: 'updateDisplayState';
    updaters: Partial<{
      [k in keyof EditorDisplayState]: (item: EditorDisplayState[k]) => EditorDisplayState[k];
    }>;
  };
  changeLoadingDocuments: {
    actionType: 'changeLoadingDocuments';
    increment: boolean;
  };
  setInMergeDocuments: {
    actionType: 'setInMergeDocuments';
    key: string;
    documents: List<object>;
  };
  deleteInMergeDocuments: {
    actionType: 'deleteInMergeDocuments';
    key: string;
  };
  openSettings: {
    actionType: 'openSettings';
    fieldId: number;
    dkp: KeyPath;
  };
  registerSettingsCallback: {
    actionType: 'registerSettingsCallback';
    callback: TempCallback;
  };
  closeSettings: {
    actionType: 'closeSettings';
  };
  updateEngineVersion: {
    actionType: 'updateEngineVersion';
  };
  resetState: { // resets the display state. is this prone to race conditions?
    actionType: 'resetState';
  };
  setCurrentEdge: {
    actionType: 'setCurrentEdge';
    edge: number;
  };
}

class TemplateEditorRedux extends TerrainRedux<TemplateEditorActionTypes, TemplateEditorState>
{
  public namespace: string = 'templateEditor';

  public reducers: ConstrainedMap<TemplateEditorActionTypes, TemplateEditorState> =
    {
      setIsDirty: (state, action) =>
      {
        return state.set('isDirty', action.payload.isDirty);
      },
      setTemplate: (state, action) =>
      {
        // A bit tricky. Whenever we push, undo, or redo, we actually
        // set the current history item's uiState to be the current uiState.
        // This basically makes sure that the uiState is always the last
        // uiState associated with each unique template

        let newState = state;

        const newItem = {
          template: action.payload.template,
          uiState: state.uiState,
        };
        switch (action.payload.history)
        {
          case 'push':
            newState = state.update('history', (history: History) =>
              history.updateItem(
                (item) => _.defaults({ uiState: state.uiState }, item),
              ));
            newState = newState.update('history',
              (history: History) => history.pushItem(newItem),
            );
            break;
          case 'clear':
            newState = newState.update('history',
              (history: History) => history.clearHistory().pushItem(newItem),
            );
            break;
          case 'void':
            newState = newState.update('history',
              (history: History) => history.setItem(newItem),
            );
            break;
          default:
            break; // todo throw error?
        }
        const newTemplate = newState.history.getCurrentItem().template;
        return newState.set('template', newTemplate);
      },
      undoHistory: (state, action) =>
      {
        // undo and redo are a bit tricky too.
        // the currentItem in the history stack is not necessarily equivalent to the current template
        // the current template always attempts to preserve the template name & id in the following situation
        // - Create a new Template, then save it, then hit "undo". Since the template had no name and no id before,
        // the item in the history stack has no name and no id. However this information should be 'sticky' and not be
        // allowed to be undone

        const currentId = state.template.id;
        const currentName = state.template.templateName;

        let newState = state.update('history',
          (history: History) => history.updateItem(
            (item) => _.defaults({ uiState: state.uiState }, item),
          ).undoHistory(),
        );
        const { template, uiState } = newState.history.getCurrentItem();
        newState = newState.set('template', template).set('uiState', uiState);
        if (currentId !== -1 && currentId !== template.id)
        {
          newState = newState.update('template', (tmpl) => tmpl.set('id', currentId));
        }
        if (currentName !== '' && currentName !== template.templateName)
        {
          newState = newState.update('template', (tmpl) => tmpl.set('templateName', currentName));
        }
        return newState;
      },
      redoHistory: (state, action) =>
      {
        const currentId = state.template.id;
        const currentName = state.template.templateName;

        let newState = state.update('history',
          (history: History) => history.updateItem(
            (item) => _.defaults({ uiState: state.uiState }, item),
          ).redoHistory(),
        );
        const { template, uiState } = newState.history.getCurrentItem();
        newState = newState.set('template', template).set('uiState', uiState);
        if (currentId !== -1 && currentId !== template.id)
        {
          newState = newState.update('template', (tmpl) => tmpl.set('id', currentId));
        }
        if (currentName !== '' && currentName !== template.templateName)
        {
          newState = newState.update('template', (tmpl) => tmpl.set('templateName', currentName));
        }
        return newState;
      },
      clearHistory: (state, action) =>
      {
        const newState = state.update('history',
          (history: History) => history.clearHistory(),
        );
        const currentItem = newState.history.getCurrentItem();
        if (currentItem == null)
        {
          return newState;
        }
        const { template, uiState } = currentItem;
        return newState.set('template', template).set('uiState', uiState);
      },
      rebuildFieldMap: (state, action) =>
      {
        const engine = state.getCurrentEngine();
        const newFieldMap = createFieldMap(engine);

        return state.set('fieldMap', newFieldMap);
      },
      rebuildField: (state, action) =>
      {
        const engine = state.getCurrentEngine();
        const fieldId = action.payload.fieldId;
        const oldField = state.fieldMap.get(fieldId);
        const newField = updateFieldFromEngine(engine, fieldId, oldField);
        return state.update('fieldMap', (fieldMap) => fieldMap.set(fieldId, newField));
      },
      setFieldMap: (state, action) =>
      {
        return state.set('fieldMap', action.payload.fieldMap);
      },
      addModal: (state, action) =>
      {
        return state.setIn(['uiState', 'modalRequests'],
          MultiModal.addRequest(state.uiState.modalRequests, action.payload.props));
      },
      setModalRequests: (state, action) =>
      {
        return state.setIn(['uiState', 'modalRequests'], action.payload.requests);
      },
      setDisplayState: (state, action) =>
      {
        let newState = state.uiState;
        const toUpdate = action.payload.state;
        for (const k of Object.keys(toUpdate))
        {
          newState = newState.set(k, toUpdate[k]);
        }
        return state.set('uiState', newState);
      },
      updateDisplayState: (state, action) =>
      {
        let newState = state.uiState;
        const updaters = action.payload.updaters;
        for (const k of Object.keys(updaters))
        {
          newState = newState.update(k, updaters[k]);
        }
        return state.set('uiState', newState);
      },
      changeLoadingDocuments: (state, action) =>
      {
        let value = state.loadingDocuments;
        if (action.payload.increment)
        {
          value++;
        }
        else
        {
          value--;
        }
        return state.set('loadingDocuments', value);
      },
      setInMergeDocuments: (state, action) =>
      {
        return state.setIn(['uiState', 'mergeDocuments', action.payload.key], action.payload.documents);
      },
      deleteInMergeDocuments: (state, action) =>
      {
        return state.deleteIn(['uiState', 'mergeDocuments', action.payload.key])
          .setIn(['uiState', 'fetchStatuses', action.payload.key], FetchStatus.Unloaded);
      },
      closeSettings: (state, action) =>
      {
        const newSettingsState = {
          fieldId: null,
          dkp: null,
          closeCallback: null,
        };
        return state.setIn(['uiState', 'settingsState'], newSettingsState);
      },
      openSettings: (state, action) =>
      {
        const settingsState = {
          fieldId: action.payload.fieldId,
          dkp: action.payload.dkp,
        };
        return state.setIn(['uiState', 'settingsState'], settingsState);
      },
      registerSettingsCallback: (state, action) =>
      {
        const settingsState = _.extend({}, state.uiState.settingsState, {
          closeCallback: action.payload.callback,
        });
        return state.setIn(['uiState', 'settingsState'], settingsState);
      },
      updateEngineVersion: (state, action) =>
      {
        const oldVersion = state.uiState.engineVersion;
        return state.setIn(['uiState', 'engineVersion'], oldVersion + 1)
          .set('isDirty', true);
      },
      resetState: (state, action) =>
      {
        return _TemplateEditorState();
      },
      setCurrentEdge: (state, action) =>
      {
        return state.setIn(['uiState', 'currentEdge'], action.payload.edge);
      },
    };

  public undoHistory(action: TemplateEditorActionType<'undoHistory'>, dispatch)
  {
    const directDispatch = this._dispatchReducerFactory(dispatch);
    directDispatch({
      actionType: 'undoHistory',
    });
    directDispatch({
      actionType: 'setIsDirty',
      isDirty: true,
    });
    directDispatch({
      actionType: 'rebuildFieldMap',
    });
  }

  public redoHistory(action: TemplateEditorActionType<'undoHistory'>, dispatch)
  {
    const directDispatch = this._dispatchReducerFactory(dispatch);
    directDispatch({
      actionType: 'redoHistory',
    });
    directDispatch({
      actionType: 'setIsDirty',
      isDirty: true,
    });
    directDispatch({
      actionType: 'rebuildFieldMap',
    });
  }

  public openSettings(action: TemplateEditorActionType<'openSettings'>, dispatch, getState)
  {
    const directDispatch = this._dispatchReducerFactory(dispatch);
    this.closeSettings({ actionType: 'closeSettings' }, dispatch, getState);

    directDispatch({
      actionType: 'openSettings',
      fieldId: action.fieldId,
      dkp: action.dkp,
    });
  }

  public closeSettings(action: TemplateEditorActionType<'closeSettings'>, dispatch, getState)
  {
    const directDispatch = this._dispatchReducerFactory(dispatch);
    const { settingsState } = this._getState(getState).uiState;
    if (settingsState.closeCallback != null)
    {
      settingsState.closeCallback.call();
    }
    directDispatch({
      actionType: 'closeSettings',
    });
  }

  public overrideAct(action: Unroll<TemplateEditorActionTypes>)
  {
    switch (action.actionType)
    {
      case 'undoHistory':
        return this.undoHistory.bind(this, action);
      case 'redoHistory':
        return this.redoHistory.bind(this, action);
      case 'closeSettings':
        return this.closeSettings.bind(this, action);
      case 'openSettings':
        return this.openSettings.bind(this, action);
      default:
        return undefined;
    }
  }
}

// convenience alias
type History = HistoryStack<TemplateEditorHistory>;

const ReduxInstance = new TemplateEditorRedux();
export const TemplateEditorActions = ReduxInstance._actionsForExport();
export const TemplateEditorReducers = ReduxInstance._reducersForExport(_TemplateEditorState);
export declare type TemplateEditorActionType<K extends keyof TemplateEditorActionTypes> =
  GetType<K, TemplateEditorActionTypes>;
