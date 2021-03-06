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


const webpack = require('webpack');
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const nodeExternals = require('webpack-node-externals');

module.exports = (env, argv) =>
{
  const mode = argv.mode;
  const isProduction = mode !== 'development';

  const config = {
    entry: './midway/src/Midway.ts',

    output:
    {
      path: __dirname,
      publicPath: '/assets/',
      filename: 'bundle.server.js',
    },
    externals: [
      nodeExternals()
    ],
    target: 'node',

    resolve:
    {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        shared: path.resolve(__dirname, 'shared'),
        database: path.resolve(__dirname, 'midway/src/database'),
      }
    },

    module:
    {
      rules:
      [
        {
          test: /\.ts(x?)$/,
          exclude: [/analytics.js/, /sigint/, /node_modules/, /assets/],
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
              },
            },
            {
              loader: 'thread-loader',
              options: {
                // there should be 1 cpu for the fork-ts-checker-webpack-plugin
                workers: require('os').cpus().length - 1,
              },
            },
            {
              loader: 'ts-loader',
              options: {
                happyPackMode: true,
              }
            }
          ],
        },
      ],
    },

    plugins: [
      new ForkTsCheckerWebpackPlugin({ tslint: true, tsconfig: './midway/tsconfig.json', checkSyntacticErrors: true, workers: 2 }),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(mode),
        },
      }),
      new webpack.NamedModulesPlugin(),
    ],
    optimization: {
      minimizer: [
        new UglifyJSPlugin({
          cache: true,
          parallel: true,
          uglifyOptions: {
            keep_fnames: true,
          },
        }),
      ],
    },
  };

  return config;
};
