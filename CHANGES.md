# Changes

## 3.0.0 2026-10-22

* Seneca 4 support. Seneca 4.0.0 validates plugin options with
  [shape](https://github.com/rjrodger/shape), the renamed successor of
  Gubu, and rejects option defaults built with Gubu, so 2.5.0 stops the
  process at startup there (`plugin_gubu_shape`). `defaults` is now a
  function of `{ valid }`, the builders Seneca passes to it: shape on
  Seneca 4.0.0, Gubu on Seneca 3 and 4.0.0-rc5. The options are
  unchanged. On Seneca 4.0.0 the `ent` entries are also validated: a
  `jsonl` or `bin` value that is not a string fails the plugin load
  (`invalid_plugin_option`); Gubu does not check them.
* The gubu dependency is removed (2.5.0 imported gubu without declaring
  it). The plugin has one dependency, chokidar.
* Breaking: the entity plugin is `@seneca/entity` 29 or later, its new
  package name; the peer dependency was `seneca-entity >=26`.
  seneca-entity 28.1.0, the last version under the old name, does not
  load on Seneca 4.0.0. Load it by package name,
  `.use('@seneca/entity')`: `use('entity')` finds seneca-entity first
  when another package installs it.
* Breaking: Seneca 3 support starts at 3.38. The peer range is
  `>=3.38||>=4.0.0-rc5` (was `>=3||>=4.0.0-rc2`). On Seneca 3, load
  seneca-promisify before this plugin.
* Node 24 and 22.
* Tests: `npm test` runs the lab suite again (it was a placeholder) against
  an S3 compatible server (Adobe S3Mock) started by `docker-compose.yml`
  (`npm run services:up` / `services:down`), configured with
  `SENECA_TEST_S3_*` env variables. s3rver, coveralls and
  lab-transform-typescript removed. The tests run against Seneca 4.0.0,
  4.0.0-rc5 (the development dependency, `^4.0.0-rc5`) and 3.38 (with
  seneca-promisify).
* CI workflow update delivered in `.patches/`.
* Documentation reorganized into `docs/` (tutorials, how-to, reference,
  explanation).
