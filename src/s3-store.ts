/* Copyright (c) 2020-2023 Richard Rodger, MIT License */

import { Default, Skip, Any, Child } from 'gubu'

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3")


// TODO: ent fields as dot paths


s3_store.defaults = {
  prefix: 'seneca/db01/',
  folder: Any(),
  s3: {},

  // keys are canon strings
  map: Skip({}),

  shared: Skip({}),

  // keys are canon strings
  ent: Default({}, Child({
    // Save a sub array as JSONL. NOTE: Other fields are LOST!
    jsonl: Skip(String),

    // Save a sub field as binary. NOTE: Other fields are LOST!
    bin: Skip(String),
  }))
}

async function s3_store(this: any, options: any) {
  const seneca = this
  const init = seneca.export('entity/init')

  let generate_id = options.generate_id || seneca.export('entity/generate_id')
  let aws_s3: any = null
  let s3_shared_options = {
    Bucket: '!not-a-bucket!',
    ...options.shared,
  }

  seneca.init(function(reply: () => void) {
    // AWS SDK setup

    const s3_opts = {
      s3ForcePathStyle: true,
      ...options.s3,
    }

    // aws_s3 = new AWS.S3(s3_opts)
    aws_s3 = new S3Client(s3_opts)

    reply()
  })


  let store = {
    name: 's3-store',
    save: function(msg: any, reply: any) {
      // console.log('MSG', msg)

      let canon = msg.ent.entity$
      let id = '' + (msg.ent.id || msg.ent.id$ || generate_id(msg.ent))
      let d = msg.ent.data$()
      d.id = id

      let s3id = make_s3id(id, msg.ent, options)
      let Body: Buffer | undefined = undefined
      let entSpec = options.ent[canon]

      if (entSpec || msg.jsonl$ || msg.bin$) {
        let jsonl = entSpec?.jsonl || msg.jsonl$
        let bin = entSpec?.bin || msg.bin$

        if ('string' === typeof jsonl && '' !== jsonl) {
          let arr = msg.ent[jsonl]
          if (!Array.isArray(arr)) {
            throw new Error('s3-store: option ent.jsonl array field not found: ' + jsonl)
          }

          let content = arr.map((n: any) => JSON.stringify(n)).join('\n') + '\n'
          Body = Buffer.from(content)
        }
        else if ('string' === typeof bin && '' !== bin) {
          let data = msg.ent[bin]
          if (null == data) {
            throw new Error('s3-store: option ent.bin data field not found: ' + bin)
          }

          Body = Buffer.from(data)
        }
      }

      if (null == Body) {
        let dj = JSON.stringify(d)
        Body = Buffer.from(dj)
      }

      // console.log('BODY', Body, entSpec?.bin ? '' : '<' + Body.toString() + '>')

      const s3cmd = new PutObjectCommand({
        ...s3_shared_options,
        Key: s3id,
        Body
      })

      aws_s3
        .send(s3cmd)
        .then((_res: any) => {
          let ento = msg.ent.make$().data$(d)
          reply(null, ento)
        })
        .catch((err: any) => {
          reply(err)
        })
    },

    load: function(msg: any, reply: any) {
      // console.log('MSG', msg)

      let canon = msg.ent.entity$
      let qent = msg.qent
      let id = '' + msg.q.id
      let s3id = make_s3id(id, msg.ent, options)
      let entSpec = options.ent[canon]
      let output: 'ent' | 'jsonl' | 'bin' = 'ent'

      let jsonl = entSpec?.jsonl || msg.jsonl$ || msg.q.jsonl$
      let bin = entSpec?.bin || msg.bin$ || msg.q.bin$

      output = (jsonl && '' != jsonl) ? 'jsonl' :
        (bin && '' != bin) ? 'bin' :
          'ent'

      const s3cmd = new GetObjectCommand({
        ...s3_shared_options,
        Key: s3id,
      })

      aws_s3
        .send(s3cmd)
        .then((res: any) => {
          // console.log(res)

          destream(output, res.Body)
            .then((body: any) => {
              let entdata: any = {}

              // console.log('DES', output, body)

              if ('jsonl' === output) {
                entdata[jsonl] = body.split('\n')
                  .filter((n: string) => '' !== n)
                  .map((n: string) => JSON.parse(n))
              }
              else if ('bin' === output) {
                entdata[bin] = body
              }
              else {
                entdata = JSON.parse(body)
              }

              entdata.id = id

              let ento = qent.make$().data$(entdata)
              reply(null, ento)
            })
            .catch((err) => reply(err))
        })
        .catch((err: any) => {
          if ('NoSuchKey' === err.Code) {
            return reply()
          }

          reply(err)
        })
    },
    list: function(_msg: any, reply: any) {
      reply([])
    },

    remove: function(msg: any, reply: any) {
      // let qent = msg.qent
      let id = '' + msg.q.id

      let s3id = make_s3id(id, msg.ent, options)

      const s3cmd = new DeleteObjectCommand({
        ...s3_shared_options,
        Key: s3id,
      })


      aws_s3
        .send(s3cmd)
        .then((_res: any) => {
          reply()
        })
        .catch((err: any) => {
          if ('NoSuchKey' === err.Code) {
            return reply()
          }

          reply(err)
        })
    },
    close: function(_msg: any, reply: () => void) {
      reply()
    },
    native: function(_msg: any, reply: () => void) {
      reply()
    },
  }

  let meta = init(seneca, options, store)

  return {
    name: store.name,
    tag: meta.tag,
    exportmap: {
      native: aws_s3,
    },
  }
}

function make_s3id(id: string, ent: any, options: any) {
  return null == id
    ? null
    : (null == options.folder ? options.prefix + ent.entity$ : options.folder) +
    '/' +
    id +
    '.json'
}


async function destream(output: 'ent' | 'jsonl' | 'bin', stream: any) {
  return new Promise((resolve, reject) => {
    const chunks: any = [];
    stream.on('data', (chunk: any) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => {
      let buffer = Buffer.concat(chunks)
      if ('bin' === output) {
        resolve(buffer)
      }
      else {
        resolve(buffer.toString('utf-8'))
      }
    })
  })
}

Object.defineProperty(s3_store, 'name', { value: 's3-store' })
module.exports = s3_store
