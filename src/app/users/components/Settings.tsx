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

import * as Immutable from 'immutable';
import { List } from 'immutable';
import * as React from 'react';

import { AuthState } from 'auth/AuthTypes';
import CheckBox from 'common/components/CheckBox';
import Dropdown from 'common/components/Dropdown';
import { notificationManager } from 'common/components/InAppNotification';
import Modal from 'common/components/Modal';
import Switch from 'common/components/Switch';
import TerrainComponent from 'common/components/TerrainComponent';
import { errorToReadable } from 'etl/ETLAjax';
import * as momentZon from 'moment-timezone';
import { MidwayError } from 'shared/error/MidwayError';
import Util from 'util/Util';
import { Colors, OldThemesArray } from '../../colors/Colors';
import TerrainTools from '../../util/TerrainTools';
import { UserActions as Actions } from '../data/UserRedux';
import * as UserTypes from '../UserTypes';
import Section from './AccountSection';
import PasswordStrengthInput from './PasswordStrengthInput';
const moment = require('moment-timezone');

import './Settings.less';
type User = UserTypes.User;

const Select = require('react-select').default;
const TimeZones = require('./timezones.json');
const LogoutIcon = require('./../../../images/icon_logout.svg');

const timeZonesList: List<string> = TimeZones.map((tz, i) => tz.DisplayName);
const timeZonesImmu = Immutable.List(timeZonesList);

export interface Props
{
  params?: any;
  history?: any;
  children?: any;
  auth?: AuthState;
  users?: UserTypes.UserState;
  userActions?: typeof Actions;
  canEdit: boolean;
}

class Settings extends TerrainComponent<Props>
{
  public cancelSubscription = null;

  constructor(props)
  {
    super(props);

    const authState = props.auth;

    this.state = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showPassword: false,
      saving: false,
      savingReq: null,
      newEmail: '',
      modalOpen: false,
      modalMessage: '',
      errorModal: false,
      advancedResultsEnabled: Number(TerrainTools.isFeatureEnabled(TerrainTools.ADVANCED_RESULTS)),
    };
  }

  public componentWillMount()
  {
    this.props.userActions({
      actionType: 'fetch',
    });
  }

  // public componentDidMount()
  // {
  //   if (localStorage.getItem('theme') === 'Dark')
  //   {
  //     this.setState({
  //       theme: 0
  //     });
  //   }
  //   else
  //   {
  //     this.setState({
  //       theme: 1
  //     });
  //   }
  // }

  public componentWillUnmount()
  {
    this.cancelSubscription && this.cancelSubscription();
  }

  public changeUserField(field: string, value: string)
  {
    // let newUser = this.props.users.currentUser;
    let newUser = this.props.users.users.get(this.props.users.currentUser.id);
    newUser = newUser.set(field, value);
    this.props.userActions({
      actionType: 'change',
      user: newUser as UserTypes.User,
      meta: {},
    });
  }

  public handleCurrentPasswordChange(ev)
  {
    this.setState({
      currentPassword: ev.target.value,
    });
  }

  public handleNewPasswordChange(ev)
  {
    this.setState({
      newPassword: ev.target.value,
    });
  }

  public handleConfirmPasswordChange(ev)
  {
    this.setState({
      confirmPassword: ev.target.value,
    });
  }

  public createNewPassword()
  {
    const userId: number = localStorage['id'];
    const currentPassword: string = this.state.currentPassword;
    const newPassword: string = this.state.newPassword;
    const confirmPassword: string = this.state.confirmPassword;

    if (newPassword.length < 6)
    {
      this.setState({
        modalMessage: 'Passwords should be at least six characters long',
        errorModal: true,
      });
      this.toggleModal();
      return;
    }

    if (newPassword !== confirmPassword)
    {
      this.setState({
        modalMessage: 'You entered two different passwords for your new password. \
        Change one so that they match',
        errorModal: true,
      });
      this.toggleModal();
      return;
    }

    this.setState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    this.props.userActions({
      actionType: 'changePassword',
      userId: +userId,
      currentPassword,
      newPassword,
    })
      .then(() =>
      {
        notificationManager.addNotification('Success', 'Updated password', 'info', 4);
      })
      .catch((error) =>
      {
        this.setState({
          modalMessage: 'Error changing your password: ' + MidwayError.fromJSON(error).getDetail(),
          errorModal: true,
        });
        this.toggleModal();
      });
  }

  public toggleShowPassword()
  {
    this.setState({
      showPassword: !this.state.showPassword,
    });
  }

  public renderPasswordContent()
  {
    return (
      <div className='settings-expand-field'>
        <div className='settings-field-title'>
          Current Password
        </div>
        <input
          type={this.state.showPassword ? 'text' : 'password'}
          onChange={this.handleCurrentPasswordChange}
          className='settings-input password-input'
          value={this.state.currentPassword}
        />
        <div className='settings-field-title'>
          New Password
        </div>
        <div className='settings-row'>
          <div className='settings-password-container'>
            <PasswordStrengthInput
              onChange={this.handleNewPasswordChange}
              value={this.state.newPassword}
              type={this.state.showPassword ? 'text' : 'password'}
            />
          </div>
          <div className='settings-white-space' />
        </div>
        <div className='settings-field-title'>
          Confirm Password
        </div>
        <div className='settings-row'>
          <input
            type={this.state.showPassword ? 'text' : 'password'}
            value={this.state.confirmPassword}
            onChange={this.handleConfirmPasswordChange}
            className='settings-input password-input'
          />
          <div className='settings-white-space' />
        </div>
        <div className='settings-row settings-bottom-margin'>
          <CheckBox checked={this.state.showPassword} onChange={this.toggleShowPassword} className='settings-checkbox' />
          <div className='settings-field-info settings-left-shift' onClick={this.toggleShowPassword}>Show password</div>
        </div>
        <div className='settings-row'>
          <div className='button settings-save-button' onClick={this.createNewPassword} >
            Save
          </div>
          <div className='settings-white-space' />
        </div>
      </div>
    );
  }

  public updateUserPassword(editingSections, onSuccess)
  {
    const userId: number = localStorage['id'];
    const currentPassword: string = editingSections.currentPassword;
    const newPassword: string = editingSections.newPassword;
    const confirmPassword: string = editingSections.confirmPassword;

    if (currentPassword === undefined || newPassword === undefined || confirmPassword === undefined)
    {
      this.setState({
        modalMessage: 'Missing input field',
        errorModal: true,
      });
      this.toggleModal();
      return;
    }

    if (newPassword.length < 6)
    {
      this.setState({
        modalMessage: 'Passwords should be at least six characters long',
        errorModal: true,
      });
      this.toggleModal();
      return;
    }

    if (newPassword !== confirmPassword)
    {
      this.setState({
        modalMessage: 'You entered two different passwords for your new password. \
        Change one so that they match',
        errorModal: true,
      });
      this.toggleModal();
      return;
    }

    this.setState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    this.props.userActions(
      {
        actionType: 'changePassword',
        userId: +userId,
        currentPassword,
        newPassword,
      })
      .then(() =>
      {
        notificationManager.addNotification('Success', 'Updated password', 'info', 4);
        onSuccess();
      })
      .catch((error) =>
      {
        this.setState({
          modalMessage: 'Error changing your password: ' + String(errorToReadable(error)),
          errorModal: true,
        });
        this.toggleModal();
      });
  }

  public setupAuthentication()
  {
    this.setState({
      modalMessage: 'This button has not been implemented yet',
      errorModal: true,
    });
    this.toggleModal();
  }

  public renderAuthenticationDescription()
  {
    return (
      <div>
        Two-Factor authentication is <b>inactive</b> for your account.
      </div>
    );
  }

  public renderAuthenticationContent()
  {
    return (
      <div className='settings-expand-field'>
        <div className='settings-authentication-field'>
          Protect your Terrain account with an extra layer of security by
       requiring access to your phone. Once configured you'll be required
       to enter <b>both your password and an authentication code from your
       mobile phone</b> in order to sign into your Terrain account.
       </div>
        <div className='settings-row'>
          <div className='button settings-gray-button' onClick={this.setupAuthentication}>
            Setup Two-Factor Authentication
        </div>
        </div>
      </div>
    );
  }

  public renderEmailDescription()
  {
    if (this.props.users.currentUser && this.props.users.currentUser.email)
    {
      const email = this.props.users.currentUser.email;
      return (
        <div>
          Your email is <b>{email}</b>.
        </div>
      );
    }
    return <div>Your email adddress has not been set yet.</div>;
  }

  public changeEmail()
  {
    this.changeUserField('email', this.state.newEmail);

    this.setState({
      newEmail: '',
    });
  }

  public onSave()
  {
    this.setState({
      saving: false,
      savingReq: null,
    });
  }

  public onSaveError(response)
  {
    this.setState({
      modalMessage: 'Error saving: ' + JSON.stringify(response),
      errorModal: true,
    });
    this.toggleModal();
  }

  public updateNewEmail(event)
  {
    this.setState({
      newEmail: event.target.value,
    });
  }

  public renderEmailContent()
  {
    return (
      <div className='settings-expand-field'>
        <div className='settings-field-title'>
          New Email Address
        </div>
        <div className='settings-row'>
          <input
            type='text'
            value={this.state.newEmail}
            onChange={this.updateNewEmail}
            className='settings-input password-input'
            onKeyDown={Util.onEnter(this.changeEmail)}
          />
          <div className='settings-white-space' />
        </div>
        <div className='button settings-save-button' onClick={this.changeEmail}>
          Update Email
         </div>
      </div>
    );
  }

  public renderTimeZoneDescription()
  {
    const localZone = momentZon.tz.guess();
    return (
      <div>
        Terrain uses your time zone to send summary and notification emails, for times in your activity feeds, and for reminders.
        Your time zone is currently set to: <b>{localZone}</b>.
      </div>
    );
  }

  public getTimeZonesList()
  {
    const timeZonesListMap = TimeZones.map((tz, i) =>
    {
      return {
        value: i,
        label: tz.DisplayName,
      };
    });
    return timeZonesListMap;
  }

  public changeTimeZone(val)
  {
    this.changeUserField('timeZone', val.value);
    this.setState({
      timeZone: val.value,
    });
  }

  public renderTimeZoneContent()
  {
    const timeZonesListOld = this.getTimeZonesList();
    let timeZone: number;

    if (this.props.users.currentUser)
    {
      timeZone = this.props.users.currentUser.timeZone || 157;
    }
    else
    {
      timeZone = 157;
    }

    return (
      <div className='settings-row'>
        <Select
          clearable={false}
          value={timeZone}
          options={timeZonesListOld}
          onChange={this.changeTimeZone}
          className='settings-timezone-dropdown'
          searchable={false}
          openOuterUp={true}
        />
      </div>
    );
  }

  public obtainCurrentTimeZone()
  {
    let timeZone: number;

    if (this.props.users.currentUser)
    {
      timeZone = this.props.users.currentUser.timeZone || 157;
    }
    else
    {
      timeZone = 157;
    }
    return timeZone;
  }

  public changeTheme(val)
  {
    const theme = OldThemesArray[val];
    if (localStorage.getItem('theme') !== theme)
    {
      localStorage.setItem('theme', theme);
      location.reload();
    }
  }

  public handleAdvancedResultsSwitch(selected)
  {
    this.setState((state) =>
    {
      return { advancedResultsEnabled: selected };
    });

    if (TerrainTools.isFeatureEnabled(TerrainTools.ADVANCED_RESULTS))
    {
      TerrainTools.deactivate(TerrainTools.ADVANCED_RESULTS);
    }
    else
    {
      TerrainTools.activate(TerrainTools.ADVANCED_RESULTS);
    }
  }

  public renderTerrainSettingsContent()
  {
    const terrainSettingsAdvancedResultsContent = TerrainTools.isAdmin() ? (
      <div>
        <div className='settings-field-title'>
          Advanced Results (Aggregations and Raw Results)
        </div>
        <div className='settings-row'>
          <Switch
            medium={true}
            first='On'
            second='Off'
            selected={this.state.advancedResultsEnabled}
            onChange={this.handleAdvancedResultsSwitch}
          />
        </div>
      </div>

    ) : undefined;

    return (
      <div>
        <div className='settings-field-title'>
          Color Theme:
        </div>
        <div className='settings-row'>
          <Dropdown
            options={List(OldThemesArray)}
            selectedIndex={OldThemesArray.indexOf(localStorage.getItem('theme'))}
            onChange={this.changeTheme}
            canEdit={true}
            className='settings-theme-dropdown'
          />
        </div>
        <br />
        {terrainSettingsAdvancedResultsContent}
      </div>
    );
  }

  // <Select
  //    clearable={false}
  //    value={ThemesInt[localStorage.getItem('theme')]}
  //    options={themesList}
  //    onChange={this.changeTheme}
  //    className='settings-timezone-dropdown'
  //    searchable={false}
  //  />

  public renderSignOutDescription()
  {
    return (
      <div className='settings-shifted-text'>
        Lost your computer? Left yourself logged in on a public computer? Need a way to sign out
        everywhere except your current library? This is for you.
      </div>
    );
  }

  public signOut()
  {
    this.setState({
      modalMessage: 'This button has not been implemented.',
      errorModal: true,
    });
    this.toggleModal();
  }

  public renderSignOutButton()
  {
    return (
      <div className='settings-yellow-button button' onClick={this.signOut}>
        <div className='settings-logout-button'>
          <div className='settings-logout-icon'>
            <LogoutIcon />
          </div>
          Sign out all other sessions
          </div>
      </div>
    );
  }

  public renderDeactivateDescription()
  {
    return (
      <div className='settings-shifted-text'>
        If you no longer need your <b>Terrain</b> account you can deactivate it here.
        <br />
        <span className='settings-font-small'>
          <b>Note:</b> Don't deactivate your account if you just want to change your <span className='settings-blue-font'>email
          address </span>.
        </span>
      </div>
    );
  }

  public deactivate()
  {
    this.setState({
      modalMessage: 'This button has not been implemented.',
      errorModal: true,
    });
    this.toggleModal();
  }

  public renderDeactivateButton()
  {
    return (
      <div className='settings-gray-button button' onClick={this.deactivate}>
        Deactivate your account
      </div>
    );
  }

  public toggleModal()
  {
    this.setState({
      modalOpen: !this.state.modalOpen,
    });
  }

  // add these back when ready
  // <AccountEntry
  //   title='UserId'
  //   content= {this.renderUserIdContent()}
  // />
  // <AccountEntry
  //   title='Two-Factor Authentication'
  //   description={this.renderAuthenticationDescription()}
  //   content={this.renderAuthenticationContent()}
  //  />
  // <AccountEntry
  //   title='Sign out all other sessions'
  //   description={this.renderSignOutDescription()}
  //   buttonText={this.renderSignOutButton()}
  //   />
  // <AccountEntry
  //   title='Deactivate your account'
  //   description={this.renderDeactivateDescription()}
  //   buttonText={this.renderDeactivateButton()}
  //   lastEntry={true}
  //   />

  public updateUserInfo(editingSections, onSuccess: () => any = () => { }, onError: (error) => any = () => { })
  {
    let newUser = this.props.users.users.get(this.props.users.currentUser.id);
    const meta = {};
    for (const headerKey of Object.keys(editingSections))
    {
      if (newUser[headerKey] !== undefined)
      {
        newUser = newUser.set(headerKey, editingSections[headerKey]);
      }
      else
      {
        meta[headerKey] = editingSections[headerKey];
      }
    }
    this.props.userActions({
      actionType: 'change',
      user: newUser,
      meta,
    })
      .then(() => onSuccess())
      .catch((error) => onError(error));
    return true;
  }

  public render()
  {
    const currentUser = this.props.users.users.get(this.props.users.currentUser.id);
    return (
      <div className='settings-main-container'>
        <div className='settings-page-title' style={{ color: Colors().mainSectionTitle }}>Account Settings</div>
        <Section
          user={currentUser}
          sectionTitle='Profile'
          sectionType='profile'
          sectionBoxes={
            List([
              { key: 'name', header: 'Name', info: currentUser.name, type: 'Input' },
              { key: 'email', header: 'Email', info: currentUser.email, type: 'Input' },
              { key: 'phone', header: 'Phone', info: currentUser.phone, type: 'Input' },
              { key: 'skype', header: 'Skype', info: currentUser.skype, type: 'Input' },
            ])
          }
          hasPhoto={true}
          columnNum={2}
          onChange={this.updateUserInfo}
          canEdit={true}
          addingUser={false}
        />
        <Section
          user={currentUser}
          sectionTitle='Password'
          sectionType='password'
          sectionBoxes={
            List([
              { key: 'currentPassword', header: 'Enter Current Password', info: '', type: 'Password' },
              { key: 'newPassword', header: 'New Password', info: '', type: 'Password' },
              { key: 'confirmPassword', header: 'Verify Password', info: '', type: 'Password' },

            ])
          }
          hasPhoto={false}
          columnNum={0}
          onChange={this.updateUserPassword}
          canEdit={true}
          addingUser={false}
        />
        <Section
          user={currentUser}
          sectionTitle='Time Zone'
          sectionType='timezone'
          sectionBoxes={
            List([
              {
                key: 'timeZone', header: 'GMT Offset', info: (typeof (currentUser.timeZone) === 'number' ?
                  timeZonesImmu.get(currentUser.timeZone) : currentUser.timeZone), type: 'Dropdown', options: timeZonesImmu,
              },
            ])
          }
          hasPhoto={false}
          columnNum={0}
          onChange={this.updateUserInfo}
          canEdit={true}
          addingUser={false}
        />
        <Modal
          message={this.state.modalMessage}
          onClose={this.toggleModal}
          open={this.state.modalOpen}
          error={this.state.errorModal}
        />
      </div>
    );
    /*return (
      <div>
        <div className='settings-page-title'>Update your settings</div>
        <AccountEntry
          title='Password'
          content={this.renderPasswordContent()}
        />
        <AccountEntry
          title='Email'
          description={this.renderEmailDescription()}
          content={this.renderEmailContent()}
        />
        <AccountEntry
          title='Time Zone'
          description={this.renderTimeZoneDescription()}
          content={this.renderTimeZoneContent()}
        />
        <AccountEntry
          title='Terrain App Settings'
          content={this.renderTerrainSettingsContent()}
        />
        <Modal
          message={this.state.modalMessage}
          onClose={this.toggleModal}
          open={this.state.modalOpen}
          error={this.state.errorModal}
        />
      </div >
    );*/
  }
}

export default Util.createContainer(
  Settings,
  ['auth', 'users'],
  { userActions: Actions },
);
