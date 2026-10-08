# Store JSONL and binary data

Goal: store an array field as a JSONL file, or a buffer field as a raw
binary object, instead of a JSON document.

1. Per entity type, with the `ent` option, keyed by entity canon:

   ```js
   ent: {
     '-/-/log': { jsonl: 'lines' }, // lines: array of objects
     '-/-/img': { bin: 'data' },    // data: Buffer, string or function returning one
   }
   ```

2. Or per call, with directives:

   ```js
   await seneca.entity('log').save$({ directive$: { jsonl$: 'lines' }, lines: [{ a: 1 }] })
   await seneca.entity('log').load$({ id, jsonl$: 'lines' })
   ```

Only the named field is stored. **Other fields are lost**: a load returns
the id and the named field only. Binary objects have no suffix. If the
named field is missing on save, the action fails with
`s3-store: option ent.jsonl array field not found: <field>` or
`s3-store: option ent.bin data field not found: <field>`.

See [examples/local-folder.js](../examples/local-folder.js) for a run.
