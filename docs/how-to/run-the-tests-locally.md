# Run the tests locally

Goal: run `npm test` against a local S3 compatible server.

1. Use Node 24 (or 22) and install: `npm install`.
2. Start the server: `npm run services:up`. This runs
   `docker compose up -d --wait` with [docker-compose.yml](../../docker-compose.yml):
   container `seneca-s3-store-s3`, image `adobe/s3mock:5.2`, host port
   19100, bucket `test-bucket` created on start.
3. Run `npm test`.
4. Stop and remove the server: `npm run services:down`.

To test against the unreleased Seneca build, run
`npm install --no-save <path>/seneca-4.0.0.tgz`, then `npm test`, then
`npm install` to restore the devDependency.

## Environment variables

| Variable | Default | Use |
| -------- | ------- | --- |
| `SENECA_TEST_S3_ENDPOINT` | `http://127.0.0.1:19100` | S3 endpoint |
| `SENECA_TEST_S3_BUCKET` | `test-bucket` | Bucket |
| `SENECA_TEST_S3_REGION` | `eu-west-1` | Region |
| `SENECA_TEST_S3_ACCESS_KEY` | `test` | Access key id |
| `SENECA_TEST_S3_SECRET_KEY` | `test` | Secret key |
| `SENECA_TEST_LIVE_S3_STORE` | unset | `true` loads options from `test/aws-s3-opts.json` (git ignored) to test against real AWS |

The local folder tests write to `test/s3files/` (git ignored).
