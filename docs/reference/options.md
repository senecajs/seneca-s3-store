# Options

Options are given to `seneca.use('@seneca/s3-store', options)` or as
`options.plugin['s3-store']`. Source: `s3_store.defaults` in
[src/s3-store.ts](../../src/s3-store.ts).

| Option | Type | Default | Effect |
| ------ | ---- | ------- | ------ |
| `debug` | boolean | `false` | Print save and load paths in local mode to the console. |
| `prefix` | string | `'seneca/db01/'` | Key prefix, followed by the entity canon (for example `-/-/foo`). Ignored when `folder` is set. |
| `suffix` | string | `'.json'` | Key suffix for JSON and JSONL objects. Not used for binary objects. |
| `folder` | any | unset | When set, replaces `prefix` plus canon: key is `<folder>/<id><suffix>`. With `''` the key is `<id><suffix>`. |
| `s3` | object | `{}` | Passed to the AWS SDK v3 `S3Client` constructor (`region`, `endpoint`, `credentials`, `forcePathStyle`, ...). The plugin adds `s3ForcePathStyle: true`, an AWS SDK v2 name that SDK v3 ignores; set `forcePathStyle` yourself for path style endpoints. |
| `shared` | object | `{}` | Merged into every Put, Get, Head and Delete command. Set `Bucket` here. |
| `map` | object | `{}` | Entity canons this store handles, as for any seneca-entity store (for example `{ 'foo': '*' }`). |
| `local.active` | boolean | `false` | Use files under `local.folder` instead of S3. |
| `local.folder` | string | `''` | Folder for local mode. |
| `local.watch` | boolean | `false` | Watch `local.folder` and send `local.onObjectCreated` messages. |
| `local.suffixMode` | `'none'` or `'genid'` | `'none'` | `'genid'` appends `-<random id>` to the folder name at start. |
| `local.onObjectCreated` | object | unset | `{ <key prefix>: <message string or object> }` sent when a watched file is added. |
| `ent.<canon>.jsonl` | string | unset | Store this array field as JSONL. Other fields are lost. |
| `ent.<canon>.bin` | string | unset | Store this field as binary. Other fields are lost. |

## Entity directives

| Directive | Operations | Effect |
| --------- | ---------- | ------ |
| `jsonl$` | save (in `directive$`), load (in query) | As `ent.<canon>.jsonl` for one call. |
| `bin$` | save (in `directive$`), load (in query) | As `ent.<canon>.bin` for one call. |
| `exists$` | load (in query) | Only check existence (`HeadObject`); reply with `{ id }` or `null`. |

See [How-to: store JSONL and binary data](../how-to/store-jsonl-and-binary-data.md).
