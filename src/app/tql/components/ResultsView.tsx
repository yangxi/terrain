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

import * as _ from 'underscore';
import * as React from 'react';
import * as classNames from 'classnames';
import Util from '../../util/Util.tsx';
import Ajax from '../../util/Ajax.tsx';
import Actions from "../../builder/data/BuilderActions.tsx";
import TQLConverter from "../../tql/TQLConverter.tsx";
import Classs from './../../common/components/Classs.tsx';

interface Props 
{
  tql: string;
}

class ResultsView extends Classs<Props>
{
  xhr = null;
  allXhr = null;
  
  state: {
    results: any[];
    resultsWithAllFields: any[];
    resultText: string;
    resultType: string;
    error: any;
    
    resultFormat: string;
    expanded: boolean;
    expandedResultIndex: number;
    
    resultsPages: number;
    loadedResultsPages: number;
    onResultsLoaded: (unchanged?: boolean) => void;
  } = {
    results: null,
    resultsWithAllFields: null,
    resultText: null,
    expanded: false,
    expandedResultIndex: null,
    error: null,
    resultType: null,
    resultsPages: 1,
    loadedResultsPages: 1,
    onResultsLoaded: null,
    resultFormat: 'icon',
  };

  //If the component updates and the tql command has been changed, then query results
  componentDidUpdate(prevProps, prevState) {
    if(prevProps.tql != this.props.tql) 
    {
      this.queryResults();
    } 
  }

  componentWillUnmount()
  {
    this.xhr && this.xhr.abort();
    this.allXhr && this.allXhr.abort();
    this.xhr = false;
    this.allXhr = false;
  }
    
  resultsFodderRange = _.range(0, 25);
  
  renderResults()
  {
      console.log("Rendering results");
    if(this.state.error)
    {
      return <div>ERROR</div>
    }
    
    if(!this.state.results)
    {
      return <div>Querying Results</div>
    }
    
    if(this.state.resultType !== 'rel')
    {
      return(
        <div>
          {this.state.results.toString()}
        </div>
      );
    }
    
    if(!this.state.results.length)
    {
      return <div>"There are no results for your query."</div>;
    }
     return(
        <div>
          {this.state.results.toString()}
        </div>
      );
  }
  
  handleAllFieldsResponse(response)
  {
    this.handleResultsChange(response, true);
  }
  
  handleResultsChange(response, isAllFields?: boolean)
  {
    let xhrKey = isAllFields ? 'allXhr' : 'xhr';
    if(!this[xhrKey]) return;
    this[xhrKey] = null;
    
    var result;
    try {
      var result = JSON.parse(response).result;
    } catch(e) {
      this.setState({
        error: "No response was returned from the server.",
        // TODO add error
      });
      return; 
    }
    
    if(result)
    {
      if(result.error)
      {
        this.setState({
          error: "Error on line " + result.line+ ": " + result.error,
          querying: false,
          results: null,
          resultType: null,
        });
      }
      else if(result.raw_result)
      {
        this.setState({
          error: "Error with query: " + result.raw_result,
          querying: false,
          results: null,
          resultType: null,
        }); 
      }
      else
      {
        if(isAllFields)
        {
          this.setState({
            resultsWithAllFields: result.value,
          });
        } else {
          if(this.state.onResultsLoaded && this.state.resultsPages !== this.state.loadedResultsPages)
          {
            this.setState({
              loadedResultsPages: this.state.resultsPages,
            });
            console.log(result.value.length, this.state.results.length);
            this.state.onResultsLoaded(result.value.length === this.state.results.length);
          }
          
          this.setState({
            results: result.value,
            resultType: result.type,
            querying: false,
            error: false,
          });
        }
      }
    }
    else
    {
      this.setState({
        error: "No response was returned from the server.",
        xhr: null,
        // TODO add error
      });
    }
  }
  
  handleError(ev)
  {
    this.setState({
      error: true,
    })
  }
  
  queryResults(pages?: number)
  {
    if(!pages)
    {
      pages = this.state.resultsPages;
    }
    var tql = this.props.tql;
    if(tql) 
    {
      this.setState({
        querying: true,
      });
      this.xhr = Ajax.query(tql, this.handleResultsChange, this.handleError);
      this.allXhr = Ajax.query(tql, this.handleAllFieldsResponse, this.handleError);
    }
  }
  
	render()
  {
    return (
      <div>
        { this.renderResults() }
      </div>
    );
	}
}

export default ResultsView;