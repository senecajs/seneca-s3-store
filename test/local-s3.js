/* MIT License, Copyright (c) 2020-2023, Richard Rodger and other contributors. */
'use strict'

// Connection settings for the S3 compatible test server started by
// `npm run services:up` (see docker-compose.yml). Override with env vars.
function LocalS3() {
  const endpoint =
    process.env.SENECA_TEST_S3_ENDPOINT || 'http://127.0.0.1:19100'
  const bucket = process.env.SENECA_TEST_S3_BUCKET || 'test-bucket'

  return {
    config: {
      s3: {
        region: process.env.SENECA_TEST_S3_REGION || 'eu-west-1',
        credentials: {
          accessKeyId: process.env.SENECA_TEST_S3_ACCESS_KEY || 'test',
          secretAccessKey: process.env.SENECA_TEST_S3_SECRET_KEY || 'test',
        },
        endpoint,
        forcePathStyle: true,
      },
      shared: {
        Bucket: bucket,
      },
    },
  }
}

module.exports = {
  LocalS3,
}
