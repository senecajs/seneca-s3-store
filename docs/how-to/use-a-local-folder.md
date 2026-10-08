# Use a local folder instead of S3

Goal: run your application without S3 (for local development), with each
entity stored as a file under a folder.

1. Set `local.active` to `true` and `local.folder` to a folder path.
   The S3 client is not created in this mode.
2. Optionally set `local.suffixMode: 'genid'` to append `-<random id>` to
   the folder name on each start (useful for isolated test runs).
3. Optionally set `local.watch: true` and `local.onObjectCreated` to
   simulate S3 object created events (see below).

Example ([examples/local-folder.js](../examples/local-folder.js)):

```js
// Store entities as files in a local folder instead of S3 (no server needed).
const Os = require('os')
const Path = require('path')
const Fs = require('fs')
const Seneca = require('seneca')
const S3Store = require('../..') // in your project: require('@seneca/s3-store')

async function main() {
  const folder = Fs.mkdtempSync(Path.join(Os.tmpdir(), 's3-store-'))

  const seneca = Seneca({ legacy: false })
    .test()
    .use('entity', { mem_store: false })
    .use(S3Store, {
      local: { active: true, folder },
      ent: {
        '-/-/log': { jsonl: 'lines' },
        '-/-/img': { bin: 'data' },
      },
    })

  await new Promise((resolve) => seneca.ready(resolve))

  await seneca.entity('foo').save$({ id$: 'foo0', x: 1 })
  await seneca.entity('log').save$({ id$: 'log0', lines: [{ a: 1 }, { a: 2 }] })
  await seneca.entity('img').save$({ id$: 'img0', data: Buffer.from([1, 2, 3]) })

  const files = Fs.readdirSync(folder, { recursive: true })
    .filter((f) => Fs.statSync(Path.join(folder, f)).isFile())
    .sort()
  for (const f of files) {
    console.log(f, '=>', JSON.stringify(Fs.readFileSync(Path.join(folder, f), 'utf8')))
  }

  console.log('log0:', (await seneca.entity('log').load$('log0')).lines)
  console.log('img0:', (await seneca.entity('img').load$('img0')).data)

  await seneca.close()
  Fs.rmSync(folder, { recursive: true })
}

main()
```

Output (the folder is a temporary folder):

```
seneca/db01/-/-/foo/foo0.json => "{\"entity$\":{\"name\":\"foo\"},\"x\":1,\"id\":\"foo0\"}"
seneca/db01/-/-/img/img0 => "\u0001\u0002\u0003"
seneca/db01/-/-/log/log0.json => "{\"a\":1}\n{\"a\":2}\n"
log0: [ { a: 1 }, { a: 2 } ]
img0: <Buffer 01 02 03>
```

## Simulate S3 object created events

With `local.watch: true`, the plugin watches `local.folder` with chokidar.
When a file is added whose path relative to the folder starts with a key of
`local.onObjectCreated`, the plugin sends the message given as the value of
that key, with an `event` property shaped like an S3 notification:

```js
local: {
  active: true,
  folder: './data',
  watch: true,
  onObjectCreated: { 'uploads/': 'aim:app,on:upload' },
}
// sends: { aim:'app', on:'upload', event: { Records: [ { s3: { object: { key: 'uploads/a.png' } } } ] } }
```

The watcher watches `local.folder` itself, not the `genid` folder.
