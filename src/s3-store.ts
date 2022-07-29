/* Copyright (c) 2020 Richard Rodger, MIT License */

import AWS from 'aws-sdk'

s3_store.defaults = {
  prefix: 'seneca/db01/',
  folder: null,
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

    aws_s3 = new AWS.S3(s3_opts)

    reply()
  })

  let store = {
    name: 's3-store',
    save: function(msg: any, reply: any) {
      let id = '' + (msg.ent.id || msg.ent.id$ || generate_id(msg.ent))
      let d = msg.ent.data$()
      d.id = id
      let dj = JSON.stringify(d)

      let s3id = make_s3id(id, msg.ent, options)

      aws_s3.putObject(
        {
          ...s3_shared_options,
          Key: s3id,
          Body: new Buffer(dj),
        },
        (err: Error) => {
          let ento = msg.ent.make$().data$(d)

          reply(err, ento)
        }
      )
    },
    load: function(msg: any, reply: any) {
      let qent = msg.qent
      let id = '' + msg.q.id

      let s3id = make_s3id(id, msg.ent, options)

      aws_s3.getObject(
        {
          ...s3_shared_options,
          Key: s3id,
        },
        (err: any, res: any) => {
          if (err && 'NoSuchKey' === err.code) {
            return reply()
          }

          let ento =
            null == res
              ? null
              : qent.make$().data$(JSON.parse(res.Body.toString()))

          reply(err, ento)
        }
      )
    },
    list: function(msg: any, reply: any) {
      reply([])
    },
    remove: function(msg: any, reply: any) {
      let qent = msg.qent
      let id = '' + msg.q.id

      let s3id = make_s3id(id, msg.ent, options)

      aws_s3.deleteObject(
        {
          ...s3_shared_options,
          Key: s3id,
        },
        (err: any, res: any) => {
          if (err && 'NoSuchKey' === err.code) {
            return reply()
          }

          reply(err)
        }
      )
    },
    close: function(msg: any, reply: () => void) {
      reply()
    },
    native: function(msg: any, reply: () => void) {
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

Object.defineProperty(s3_store, 'name', { value: 's3-store' })
module.exports = s3_store
