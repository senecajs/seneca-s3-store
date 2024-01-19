![Seneca S3 Store](http://senecajs.org/files/assets/seneca-logo.png)

> _Seneca S3 Store_ is a plugin for [Seneca](http://senecajs.org)


Entity store that uses AWS S3. This store can also handle JSONL documents and binary files.
This plugin integrates with 
[Seneca Gateway Lambda](https://github.com/senecajs/seneca-gateway-lambda) to support S3 events.
A local mode can simulate S3 behaviour for local development and testing.


[![npm version](https://img.shields.io/npm/v/@seneca/s3-store.svg)](https://npmjs.com/package/@seneca/s3-store)
[![build](https://github.com/senecajs/seneca-s3-store/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-s3-store/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-s3-store/badge.svg?branch=main)](https://coveralls.io/github/senecajs/seneca-s3-store?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-s3-store/badge.svg)](https://snyk.io/test/github/senecajs/seneca-s3-store)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/19453/branches/505563/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=19453&bid=505563)
[![Maintainability](https://api.codeclimate.com/v1/badges/9d54b38a991fe7b92a43/maintainability)](https://codeclimate.com/github/senecajs/seneca-s3-store/maintainability)

# @seneca/s3-store

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |


## Install

```
$ npm install @seneca/s3-store
```


## Quick Example

```js
const Seneca = require('seneca')
// import Seneca from 'seneca'

let seneca = Seneca()
  .use('entity', { mem_store: false })
  .use('s3-store', {
    map: {
      'foo': '*' // All 'foo' entity operations
    },
    
    // Settings shared by all S3 Operations
    shared: {
      Bucket: 'my-aws-bucket-name'
    },
    
    // S3 client settings
    s3: {
      Region: 'us-east-1'
    }
  })
  
// Saves the file foo0.json to the bucket.
seneca.entity('foo').save$({id$:'foo0', x:1})

// The file contents will be:
// {"id":"foo0","x":1,"entity$":"-/-/foo"}

```


## More Examples

## Motivation

## Reference


<!--START:options-->


## Options

* `debug` : boolean
* `prefix` : string
* `suffix` : string
* `folder` : any
* `s3` : object
* `map` : object
* `shared` : object
* `local` : object
* `ent` : object
* `init$` : boolean


<!--END:options-->

<!--START:action-list-->


## Action Patterns



<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions



<!--END:action-desc-->



## Support

## Contributing

## Background


