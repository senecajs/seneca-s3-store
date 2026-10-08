# How the S3 store works

## Keys

Each entity is one S3 object. The key is built from the options and the
entity: `<prefix><canon>/<id><suffix>` by default, or `<folder>/<id><suffix>`
when `folder` is set. Binary objects have no suffix. Because a key holds one
entity, the store is a key value store: there is no query support and
`list$` returns an empty list.

## Lifecycle

The plugin registers with seneca-entity during plugin definition. The S3
client (or local mode) is set up in `seneca.init`, so it exists only once
the instance is ready. This is why the `native` export is `null` and why
`native$()` is the way to reach the client.

## Local mode

Local mode writes the same keys as files under a folder. It exists so that
applications and tests can run without S3, and the optional watcher can
simulate S3 object created notifications for code that reacts to uploads.
The watcher is not closed when Seneca closes.

## Seneca 3 and Seneca 4

The plugin uses only APIs present in both: `seneca.init`, `seneca.message`,
`seneca.export('entity/init')`. Seneca 4 does not wrap action errors, so an
S3 error reaches the caller as the original AWS SDK error (with the Seneca
wrapper on `err.meta$.err`). The tests run on Seneca 4 only.
