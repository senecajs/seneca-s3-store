![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/s3-store

[![npm version](https://img.shields.io/npm/v/@seneca/s3-store.svg)](https://npmjs.com/package/@seneca/s3-store)
[![build](https://github.com/senecajs/seneca-s3-store/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-s3-store/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-s3-store/badge.svg)](https://snyk.io/test/github/senecajs/seneca-s3-store)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-s3-store/badge.svg?branch=main)](https://coveralls.io/github/senecajs/seneca-s3-store?branch=main)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/26330/branches/835756/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=26330&bid=835756)
[![Maintainability](https://api.codeclimate.com/v1/badges/7e01589345a62da4f444/maintainability)](https://codeclimate.com/github/senecajs/seneca-s3-store/maintainability)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
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

## Support

If you're using this module and need help, you can:

- Post a [github issue](https://github.com/senecajs/seneca-s3-store/issues)
- Tweet to [@senecajs](http://twitter.com/senecajs)
- Ask on the [Gitter](https://gitter.im/senecajs/seneca)

## API

### Reference

<!--START:options-->

### Options

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

### Action Patterns

<!--END:action-list-->

<!--START:action-desc-->

### Action Descriptions

<!--END:action-desc-->

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

## Background

