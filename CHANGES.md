# Changes

## 3.0.0 2026-11-21

2.5.1 was never published. Its changes are part of this release.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was
  `>=3||>=4.0.0-rc2`). Seneca 3 users stay on `@seneca/s3-store@2`.
* Node.js 24 or later (`engines.node` `>=24`).
* Seneca 4 validates plugin options with
  [shape](https://github.com/rjrodger/shape), the renamed successor of
  Gubu, and rejects option defaults built with Gubu, so 2.5.0 stops the
  process at startup there (`plugin_gubu_shape`). `defaults` is now a
  function of `{ valid }`, the builders Seneca passes to it (B1). The
  options are unchanged. The `ent` entries are now validated: a `jsonl`
  or `bin` value that is not a string fails the plugin load
  (`invalid_plugin_option`).
* The gubu dependency is removed (2.5.0 imported gubu without declaring
  it). The plugin has one dependency, chokidar.
* The entity peer dependency is `@seneca/entity` `^29.0.0`, the new
  package name; it was `seneca-entity >=26`. seneca-entity 28.1.0, the
  last version under the old name, does not load on Seneca 4. Load the
  entity plugin by package name, `.use('@seneca/entity')`.
* The peer dependency `seneca-promisify` is removed. Seneca 4 has
  promises built in and deprecates the promisify plugin (D4). Do not
  load it.
* Tests: `npm test` runs the lab suite again (it was a placeholder)
  against an S3 compatible server (Adobe S3Mock) started by
  `docker-compose.yml` (`npm run services:up` / `services:down`),
  configured with `SENECA_TEST_S3_*` env variables. s3rver, coveralls
  and lab-transform-typescript removed. The tests use
  `@seneca/store-test` 7 and run on Seneca 4.0.0.
* CI workflow update delivered in `.patches/`.
* Documentation reorganized into `docs/` (tutorials, how-to, reference,
  explanation).
