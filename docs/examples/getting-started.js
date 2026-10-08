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
