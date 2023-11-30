/* MIT License, Copyright (c) 2020-2023, Richard Rodger and other contributors. */
'use strict'

const Fs = require('fs')

const S3rver = require('s3rver')


async function LocalS3() {
  const corsConfig = require.resolve('s3rver/example/cors.xml')
  const websiteConfig = require.resolve('s3rver/example/website.xml')

  const s3rver = new S3rver({
    silent: true,
    directory: __dirname+'/s3data/'+(Date.now()%1e8),
    configureBuckets: [
      {
        name: 'test-bucket.localhost',
        configs: [Fs.readFileSync(corsConfig), Fs.readFileSync(websiteConfig)],
      },
    ],
  })

  const { port } = await s3rver.run()

  return {
    s3rver,
    config: {
      s3: {
        credentials: {
          accessKeyId: 'S3RVER',
          secretAccessKey: 'S3RVER',
        },
        endpoint: `http://localhost:${port}`,
        sslEnabled: false,
      },
      shared: {
        Bucket: 'test-bucket',
      }
    }
  }
}

module.exports = {
  LocalS3
}
