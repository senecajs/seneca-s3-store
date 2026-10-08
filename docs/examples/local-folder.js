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
