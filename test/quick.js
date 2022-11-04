const Seneca = require('seneca')

run()

async function run() {
  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use('..', {
      s3: {},
    })

  await s0.ready()
  console.log(s0.version)
}
