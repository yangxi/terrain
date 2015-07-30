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

function getTQL(dataArray) {
	
	var strQuery = new String("db");
	
	var arrayLength = dataArray.length;
	for (var i = 0; i < arrayLength; i++){
		switch(dataArray[i].type) {
			case 'from':
				strQuery += doFrom(dataArray[i].table);
				break;
			case 'filter':
				strQuery += doFilter(dataArray[i].args);
				break;
			case 'sort' :
				strQuery += doSort(dataArray[i].args);
				break;
			case 'slice' :
				strQuery += doSlice(dataArray[i].low, dataArray[i].high);
				break;
			case 'select' :
				strQuery += doSelect(dataArray[i].args);
				break;
			case 'equijoin' :
				strQuery += doEquijoin(dataArray[i].colname, dataArray[i].jointable, dataArray[i].joincolname);
				break;
		}
	}
	alert(strQuery);
}

function testGetTQL() {
	
	var objCards = [
		{
			type: 'from',
			table: '\'products\''
		},
		{
			type: 'equijoin',
			colname: '\'OwnerID\'',
			jointable: '\'owners\'',
			joincolname: '\'ID\''
		},
		{
			type: 'select',
			args : [
				{
					term : '\'rating\''
				},{
					term : '\'price\''
				},{
					term : '\'city\''
				}	
			]
		},
		{
			type: 'filter',
			args : [
				{
					combinator : 'none',
					term : '\'rating\' >= \'input.rating\''
				},
				{
					combinator : 'and',
					term : '\'price\' < 400'
				},
				{
					combinator : 'or',
					term : '\'city\' == \'San Francisco\''
				}
			]
		},
		{
			type: 'sort',
			args: [
				{
					//true is ascending, false is descending
					direction: 'true',
					term: '\'rating\''		
				},
				{
					direction: 'false',
					term: 'year + day / 365'
				}
			]
		},
		{
			type: 'slice',
			low: 5,
			high: 25
		}
	]
	getTQL(objCards);
	
	
}

function doFrom(strTable) {
	
	var strTQL = new String("");
	strTQL += ".from(" + strTable + ")";
	return strTQL;
}

function doFilter(arrFilters) {
	var strTQL = new String("");
	strTQL += ".filter(";
	for (var i = 0; i < arrFilters.length; i++){
		
		//First handle the combinator if it exists
		switch(arrFilters[i].combinator) {
			case 'and':
				strTQL += " && ";
				break;
			case 'or' :
				strTQL += " || ";
				break;
		}		

		strTQL += arrFilters[i].term;			
	}
	strTQL += ")";
	return strTQL;
}

function doSort(arrSorts) {
	var strTQL = new String("");
	strTQL += ".sort(";
	// For each sort, write out the argument and the sort direction
	for (var i = 0; i < arrSorts.length; i++){
		if (i > 0) strTQL += ",";
		strTQL += arrSorts[i].term + "," + arrSorts[i].direction;
	}
	strTQL += ")";
	return strTQL;
}

function doSlice(low, high) {
	var strTQL = new String("");
	strTQL += ".slice(" + low + "," + high + ")";
	
	return strTQL;	
}

function doSelect(arrSelect) {
	var strTQL = new String("");
	strTQL += ".select(";
	
	for (var i = 0; i < arrSelect.length; i++){
		if (i > 0) strTQL += ",";
		strTQL += arrSelect[i].term;
	}
	strTQL += ")";
	return strTQL;
}

function doEquijoin(colname, jointable, joincolname)
{
	var strTQL = new String("");
	strTQL += ".equijoin(" + colname + "," + jointable + "," + joincolname + ")";
	return strTQL;
}
