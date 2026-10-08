# Changes

## 2.5.1

* Seneca 4 prerelease support: tested with `seneca@4.0.0-rc5` and 4.0.0.
* Node 24 and 22.
* Tests: `npm test` runs the lab suite again (it was a placeholder) against
  an S3 compatible server (Adobe S3Mock) started by `docker-compose.yml`
  (`npm run services:up` / `services:down`), configured with
  `SENECA_TEST_S3_*` env variables. s3rver, coveralls and
  lab-transform-typescript removed.
* `gubu` is now an explicit dependency (it was imported but only
  available transitively).
* CI workflow update delivered in `.patches/`.
* Documentation reorganized into `docs/` (tutorials, how-to, reference,
  explanation).
