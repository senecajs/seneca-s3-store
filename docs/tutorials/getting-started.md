# Getting started

In this tutorial you save, load and remove an entity in an S3 bucket.
You use a local S3 compatible server, so no AWS account is needed.

## 1. Install

```sh
npm install seneca seneca-entity @seneca/s3-store @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

The AWS SDK packages are peer dependencies: your application provides them.

## 2. Start an S3 server

From a clone of this repository:

```sh
npm run services:up
```

This starts Adobe S3Mock on `http://127.0.0.1:19100` with a bucket called
`test-bucket` (see [Run the tests locally](../how-to/run-the-tests-locally.md)).

## 3. Write the program

The program is [examples/getting-started.js](../examples/getting-started.js):

```js
// Save, load and remove an entity in an S3 bucket.
// Start the test S3 server first: npm run services:up
const Seneca = require('seneca')
const S3Store = require('../..') // in your project: require('@seneca/s3-store')

async function main() {
  const seneca = Seneca({ legacy: false })
    .test()
    .use('entity', { mem_store: false })
    .use(S3Store, {
      s3: {
        region: 'eu-west-1',
        endpoint: process.env.SENECA_TEST_S3_ENDPOINT || 'http://127.0.0.1:19100',
        forcePathStyle: true,
        credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
      },
      shared: { Bucket: process.env.SENECA_TEST_S3_BUCKET || 'test-bucket' },
    })

  await new Promise((resolve) => seneca.ready(resolve))

  const saved = await seneca.entity('foo').save$({ id$: 'foo0', x: 1 })
  console.log('saved:', saved.data$(false))

  const loaded = await seneca.entity('foo').load$('foo0')
  console.log('loaded:', loaded.data$(false))

  const exists = await seneca.entity('foo').load$({ id: 'foo0', exists$: true })
  console.log('exists:', exists.data$(false))

  await loaded.remove$()
  const gone = await seneca.entity('foo').load$('foo0')
  console.log('after remove:', gone)

  await seneca.close()
}

main()
```

## 4. Run it

```sh
node docs/examples/getting-started.js
```

Output:

```
saved: { x: 1, id: 'foo0' }
loaded: { x: 1, id: 'foo0' }
exists: { id: 'foo0' }
after remove: null
```

## What happened

* `s3` options went to the AWS SDK `S3Client` constructor.
* `shared.Bucket` was added to every S3 command.
* `save$` wrote the object `seneca/db01/-/-/foo/foo0.json` (default
  `prefix`, the entity canon, the id and the default `suffix`).
* `load$` with `exists$: true` sent a `HeadObject` request and returned
  only the id.
* After `remove$`, `load$` returned `null`.

## Next steps

* [Store entities in a local folder](../how-to/use-a-local-folder.md).
* [Store JSONL and binary data](../how-to/store-jsonl-and-binary-data.md).
* [All options](../reference/options.md).
