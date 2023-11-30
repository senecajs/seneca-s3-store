const Seneca = require('seneca')

const { LocalS3 } = require('./local-s3.js')

run()

async function run() {
  const locals3 = await LocalS3()
  /*
        {
          s3: {
            credentials: { accessKeyId: 'S3RVER', secretAccessKey: 'S3RVER' },
            endpoint: 'http://localhost:4568',
            sslEnabled: false
          },
          shared: { Bucket: 'test-bucket' }
        }
  */

  let opts = locals3.config
  opts.ent = {
    '-/-/bar': {
      jsonl: 'x'
    },
    '-/-/zed': {
      bin: 'y'
    },
  }
  
  console.log(locals3.config)
  
  let s0 = Seneca({ legacy: false })
  // .test('print')
  .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use('..', opts)

  await s0.ready()
  console.log(s0.version)

  let none = await s0.entity('foo').load$('not-a-file')
  console.log(none)

  
  let foo0 = await s0.entity('foo').save$({x:1})
  console.log(foo0)

  let bar0 = await s0.entity('bar').save$({x:[{x:1},{x:2}]})
  console.log(bar0)

  let zed0 = await s0.entity('zed').save$({y:Buffer.from([0,1,2])})
  console.log(zed0)

  let foo0r = await s0.entity('foo').load$(foo0.id)
  console.log(foo0r)
  
  await foo0.remove$()
  await foo0.remove$()
  
  let foo0d = await s0.entity('foo').load$(foo0.id)
  console.log('foo0r',foo0d)

  let bar0r = await s0.entity('bar').load$(bar0.id)
  console.log('bar0r',bar0r)

  let zed0r = await s0.entity('zed').load$(zed0.id)
  console.log('zed0r',zed0r)


  await s0.close()
  await locals3.s3rver.close()
  
}
