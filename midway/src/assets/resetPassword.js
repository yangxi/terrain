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
//check that token is valid before sending to reset password page
function checkTokenValidity() 
{
	var fullUrl = window.location + '';
	var splitUrl = fullUrl.split("?=");
	const token = splitUrl[1];
	console.log("token: " + token);

	const newPassword = document.getElementById('reset-password-new-password').value;
	const confirmNewPassword = document.getElementById('reset-password-confirm').value;

	config = {
		route: '/midway/v1/forgotPassword/' + token,
		method: 'GET',
	}
	var xhr = new XMLHttpRequest();

	xhr.open(config.method, config.route, true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	console.log(config.route);

	xhr.onload = function () {
		if (xhr.status != 200)
		{
			document.getElementById('reset-password-area').innerHTML = "Invalid reset url.";
		}
	};
	xhr.send(config.data);

}

function handleResetPasswordSubmit()
{
	var fullUrl = window.location + '';
	var splitUrl = fullUrl.split("?=");
	const token = splitUrl[1];
	const newPassword = document.getElementById('reset-password-new-password').value;
	const confirmNewPassword = document.getElementById('reset-password-confirm').value;

	//check that new password and confirm password are same value
	if (newPassword !== confirmNewPassword)
	{
		document.getElementById('reset-password-mismatch-message').innerHTML = "Passwords don't match.";
	}
	else {
	//POST request to reset password router
		config = {
			route: '/midway/v1/forgotPassword/',
			method: 'POST',
			data: JSON.stringify({
				"newPassword" : newPassword,
				"recoveryToken" : token,
			}),
		}
		var xhr = new XMLHttpRequest();

		xhr.open(config.method, config.route, true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		console.log(config.route);

		xhr.onload = function () {
			document.getElementById('reset-password-area').innerHTML = xhr.responseText;
			if (xhr.status === 200) 
			{
				//redirect to login page
				let host = window.location.protocol + "//" + window.location.hostname;
				if (location.port !== "")
				{
					host += ":" + location.port;
				}
				window.location = host;
			}
		};
		xhr.send(config.data);
	}
}

function handleKeyDown(e)
{
	if (e.keyCode === 13)
	{
		handleResetPasswordSubmit();
	}
}

checkTokenValidity();
document.getElementById("reset-password-submit").onclick = handleResetPasswordSubmit;
document.getElementById("reset-password-confirm").onkeydown = handleKeyDown;


