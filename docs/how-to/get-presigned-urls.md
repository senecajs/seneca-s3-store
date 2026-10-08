# Get presigned upload and download URLs

Goal: let a client upload or download a file directly from S3.

1. Send `cloud:aws,service:store,get:url,kind:upload` (or `kind:download`)
   with `bucket`, `filepath` (the object key) and `expire` (seconds).
2. Use the returned `url` with HTTP `PUT` (upload) or `GET` (download).

Example ([examples/signed-urls.js](../examples/signed-urls.js)):

```js
// Get presigned upload and download URLs, then use them with fetch.
// Start the test S3 server first: npm run services:up
const Seneca = require('seneca')
const S3Store = require('../..') // in your project: require('@seneca/s3-store')

async function main() {
  const bucket = process.env.SENECA_TEST_S3_BUCKET || 'test-bucket'
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
    })

  await new Promise((resolve) => seneca.ready(resolve))

  const up = await seneca.post('cloud:aws,service:store,get:url,kind:upload', {
    bucket,
    filepath: 'docs/hello.txt',
    expire: 60,
  })
  console.log('upload url starts with:', up.url.split('?')[0])

  const put = await fetch(up.url, { method: 'PUT', body: 'hello' })
  console.log('PUT status:', put.status)

  const down = await seneca.post('cloud:aws,service:store,get:url,kind:download', {
    bucket,
    filepath: 'docs/hello.txt',
    expire: 60,
  })
  const got = await fetch(down.url)
  console.log('GET status:', got.status, 'body:', await got.text())

  await seneca.close()
}

main()
```

Output:

```
upload url starts with: http://127.0.0.1:19100/test-bucket/docs/hello.txt
PUT status: 200
GET status: 200 body: hello
```

These messages need the S3 client, so they do not work with `local.active`.
