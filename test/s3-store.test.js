/* MIT License, Copyright (c) 2020, Richard Rodger and other contributors. */
'use strict'

const LOCAL = 'true' !== process.env.SENECA_TEST_LIVE_S3_STORE

const Fs = require('fs')

const S3rver = require('s3rver')

const Seneca = require('seneca')
const Shared = require('seneca-store-test')

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

//const describe = lab.describe
//const it = lab.it

const Plugin = require('..')

const { LocalS3 } = require('./local-s3.js')

const test_opts = {
  name: 's3-store',
}

lab.before(async function () {
  test_opts.options = await makeOptions()

  test_opts.seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
})

lab.test('happy', async function () {
  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use(Plugin, {
      s3: {},
    })

  await s0.ready()
  // console.log(s0.version)
})

Shared.test.init(lab, test_opts)
Shared.test.keyvalue(lab, test_opts)

const local_opts = {
  name: 's3-store',
  options: {
    local: {
      active: true,
      folder: __dirname+'/s3files',
      folderSuffix: 'none'
    }
  }
}

lab.before(async function () {
  local_opts.seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
})

Shared.test.init(lab, local_opts)
Shared.test.keyvalue(lab, local_opts)

lab.test('jsonl', async function () {
  let options = Seneca.util.deep(test_opts.options, {
    ent: {
      '-/optent/color': { jsonl: 'parts' },
    },
    /*
    local: {
      active: true,
      folder: __dirname+'/s3files',
      folderSuffix: 'none'
    }
    */
  })

  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use(Plugin, options)

  let color0 = await s0.entity('optent/color').save$({
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  expect(color0).includes({
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  let color0r = await s0.entity('optent/color').load$(color0.id)
  expect(color0r).includes({
    id: color0.id,
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  let color1 = await s0.entity('directive/color').save$({
    directive$: { jsonl$: 'parts' },
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  expect(color1).includes({
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })

  let color1r = await s0.entity('directive/color').load$({
    id: color1.id,
    jsonl$: 'parts',
  })
  expect(color1r).includes({
    id: color1.id,
    parts: [{ val: 50 }, { val: 100 }, { val: 150 }],
  })
})

lab.test('bin', async function () {
  let options = Seneca.util.deep(test_opts.options, {
    ent: {
      '-/optent/planet': { bin: 'map' },
    },
    /*
    local: {
      active: true,
      folder: __dirname+'/s3files',
      folderSuffix: 'none'
    }
    */
  })

  let s0 = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use(Plugin, options)

  let planet0 = await s0.entity('optent/planet').save$({
    map: Buffer.from([1, 2, 3]),
  })

  expect(planet0).includes({
    map: Buffer.from([1, 2, 3]),
  })

  let planet0r = await s0.entity('optent/planet').load$(planet0.id)
  expect(planet0r).includes({
    id: planet0.id,
    map: Buffer.from([1, 2, 3]),
  })

  let planet1 = await s0.entity('directive/planet').save$({
    directive$: { bin$: 'map' },
    map: Buffer.from([1, 2, 3]),
  })

  expect(planet1).includes({
    map: Buffer.from([1, 2, 3]),
  })

  let planet1r = await s0.entity('directive/planet').load$({
    id: planet1.id,
    bin$: 'map',
  })
  expect(planet1r).includes({
    id: planet1.id,
    map: Buffer.from([1, 2, 3]),
  })
})

async function makeOptions() {
  if (LOCAL) {
    let locals3 = await LocalS3()
    return locals3.config
  } else {
    return require('./aws-s3-opts')
  }
}
