/* MIT License, Copyright (c) 2020, Richard Rodger and other contributors. */
'use strict'

const LOCAL = 'true' !== process.env.SENECA_TEST_LIVE_S3_STORE

const Fs = require('fs')

const S3rver = require('s3rver')

const Seneca = require('seneca')
const Shared = require('seneca-store-test')

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

//const describe = lab.describe
//const it = lab.it

const test_opts = {
  name: 's3-store',
}

lab.before(async function () {
  test_opts.options = await makeOptions()

  test_opts.seneca = Seneca({ require })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
})

Shared.test.init(lab, test_opts)
Shared.test.keyvalue(lab, test_opts)

async function makeOptions() {
  if (LOCAL) {
    return localS3()
  } else {
    return require('./aws-s3-opts')
  }
}

async function localS3() {
  const corsConfig = require.resolve('s3rver/example/cors.xml')
  const websiteConfig = require.resolve('s3rver/example/website.xml')

  const s3rver = new S3rver({
    silent: true,
    configureBuckets: [
      {
        name: 'test-bucket',
        configs: [Fs.readFileSync(corsConfig), Fs.readFileSync(websiteConfig)],
      },
    ],
  })

  const { port } = await s3rver.run()

  return {
    s3: {
      accessKeyId: 'S3RVER',
      secretAccessKey: 'S3RVER',
      endpoint: `http://localhost:${port}`,
      sslEnabled: false,
    },
    shared: {
      Bucket: 'test-bucket',
    },
  }
}
