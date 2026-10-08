![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/s3-store

An entity store for [Seneca](http://senecajs.org) that keeps each entity as an object in AWS S3 (or any S3 compatible server), or as a file in a local folder. Works with Seneca 4 (tested with the 4.0.0 prerelease) on Node 24 and 22.

[![npm version](https://img.shields.io/npm/v/@seneca/s3-store.svg)](https://npmjs.com/package/@seneca/s3-store)
[![build](https://github.com/senecajs/seneca-s3-store/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-s3-store/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-s3-store/badge.svg)](https://snyk.io/test/github/senecajs/seneca-s3-store)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/26330/branches/835756/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=26330&bid=835756)
[![Maintainability](https://api.codeclimate.com/v1/badges/7e01589345a62da4f444/maintainability)](https://codeclimate.com/github/senecajs/seneca-s3-store/maintainability)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install @seneca/s3-store @aws-sdk/client-s3 @aws-sdk/s3-request-presigner seneca seneca-entity
```

## Quick Example

```js
const Seneca = require('seneca')

const seneca = Seneca()
  .use('entity', { mem_store: false })
  .use('@seneca/s3-store', {
    shared: { Bucket: 'my-aws-bucket-name' }, // added to every S3 command
    s3: { region: 'us-east-1' }, // S3Client settings
  })

// Writes the object seneca/db01/-/-/foo/foo0.json to the bucket.
await seneca.entity('foo').save$({ id$: 'foo0', x: 1 })
```

A complete, runnable program is in [Getting started](docs/tutorials/getting-started.md).

## More Examples

* [Getting started](docs/tutorials/getting-started.md)
* [Use a local folder instead of S3](docs/how-to/use-a-local-folder.md)
* [Store JSONL and binary data](docs/how-to/store-jsonl-and-binary-data.md)
* [Get presigned upload and download URLs](docs/how-to/get-presigned-urls.md)
* [Run the tests locally](docs/how-to/run-the-tests-locally.md)

## Motivation

S3 is a cheap, durable place for documents and files. This plugin lets
Seneca code use it through the normal entity API, and lets you develop
without S3 using a local folder. See [How it works](docs/explanation/how-it-works.md).

## Support

* [GitHub issues](https://github.com/senecajs/seneca-s3-store/issues)
* [Seneca documentation](http://senecajs.org)
* Sponsored by [Voxgig](https://www.voxgig.com)

## API

| Topic | Reference |
| ----- | --------- |
| Options and directives | [docs/reference/options.md](docs/reference/options.md) |
| Store operations and messages | [docs/reference/messages.md](docs/reference/messages.md) |
| Exports and errors | [docs/reference/api.md](docs/reference/api.md) |
| Everything, by feature | [docs/README.md](docs/README.md) |

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open participation.
To run the tests (Node 24 or 22, Seneca 4 prerelease as devDependency):

```sh
npm install
npm run services:up   # S3Mock on port 19100
npm test
npm run services:down
```

See [Run the tests locally](docs/how-to/run-the-tests-locally.md). CI
workflow changes are in [.patches](.patches/README.md); apply them with
`git am .patches/*.patch`.

## Background

Written by Richard Rodger for Voxgig projects that store documents and
files in S3. Uses the AWS SDK v3.

| Version | Seneca | Node |
| ------- | ------ | ---- |
| 2.5.1 | 4 (tested), 3 (peer range, not tested) | 24, 22 |
| 2.5.0 | 3 | 18+ |

License: MIT, see [LICENSE](LICENSE).
