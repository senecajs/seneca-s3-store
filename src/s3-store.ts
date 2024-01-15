/* Copyright (c) 2020-2023 Richard Rodger, MIT License */

import Path from 'path'
import Fsp from 'fs/promises'

import chokidar from 'chokidar'

import { Default, Skip, Any, Exact, Child, Empty } from 'gubu'

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

import { getSignedUrl, S3RequestPresigner } from '@aws-sdk/s3-request-presigner'

// TODO: ent fields as dot paths

s3_store.defaults = {
  debug: false,

  prefix: Empty('seneca/db01/'),
  suffix: Empty('.json'),
  folder: Any(),
  s3: {},

  // keys are canon strings
  map: Skip({}),

  shared: Skip({}),

  // Use a local folder to simulate S3 for local dev and testing.
  local: {
    active: false,
    folder: '',
    suffixMode: 'none', // TODO: FIX: Default('none', Exact('none', 'genid')),
    watchPath: '',
  },

  // keys are canon strings
  ent: Default(
    {},
    Child({
      // Save a sub array as JSONL. NOTE: Other fields are LOST!
      jsonl: Skip(String),

      // Save a sub field as binary. NOTE: Other fields are LOST!
      bin: Skip(String),
    }),
  ),
}

const PLUGIN = '@seneca/s3-store'

async function s3_store(this: any, options: any) {
  const seneca = this
  const init = seneca.export('entity/init')

  let generate_id = options.generate_id || seneca.export('entity/generate_id')
  let aws_s3: any = null
  let s3_shared_options = {
    Bucket: '!not-a-bucket!',
    ...options.shared,
  }

  let local_folder: string = ''

  seneca.init(function (reply: () => void) {
    if (options.local.active) {
      let folder: string = options.local.folder
      local_folder =
        'genid' == options.local.suffixMode
          ? folder + '-' + seneca.util.Nid()
          : folder
  
      const watcher = chokidar.watch(Path.resolve(options.local.watchPath), {
        ignoreInitial: true,
        persistent: true
      })
  
      watcher
        .on('add', (path: string) => {
          const keyPath = path.split(Path.sep).slice(path.split(Path.sep).indexOf('folder01')).join(Path.sep);
          console.log(`WATCH path: ${keyPath}`);
          const event = {
            'Records': [
              {
                s3: {
                  object: {
                    key: keyPath,
                  },
                },
              },
            ]
          };
          seneca.post('aim:upload,handle:file', { event });
        })
        .on('error', error => console.log(`WATCH error: ${error}`))
        .on('ready', () => console.log('WATCH initial scan complete. ready for changes'));
    } else {
      const s3_opts = {
        s3ForcePathStyle: true,
        ...options.s3,
      }
      aws_s3 = new S3Client(s3_opts)
    }

    reply()
  })

  let store = {
    name: 's3-store',
    save: function (msg: any, reply: any) {
      // console.log('MSG', msg)

      let canon = msg.ent.entity$
      let id = '' + (msg.ent.id || msg.ent.id$ || generate_id(msg.ent))
      let d = msg.ent.data$()
      d.id = id

      let entSpec = options.ent[canon]
      let jsonl = entSpec?.jsonl || msg.jsonl$ || msg.q.jsonl$
      let bin = entSpec?.bin || msg.bin$ || msg.q.bin$

      let s3id = make_s3id(id, msg.ent, options, bin)
      let Body: Buffer | undefined = undefined

      if (entSpec || jsonl || bin) {
        // JSONL files
        if ('string' === typeof jsonl && '' !== jsonl) {
          let arr = msg.ent[jsonl]
          if (!Array.isArray(arr)) {
            throw new Error(
              's3-store: option ent.jsonl array field not found: ' + jsonl,
            )
          }

          let content = arr.map((n: any) => JSON.stringify(n)).join('\n') + '\n'
          Body = Buffer.from(content)
        }

        // Binary files
        else if ('string' === typeof bin && '' !== bin) {
          let data = msg.ent[bin]
          if (null == data) {
            throw new Error(
              's3-store: option ent.bin data field not found: ' + bin,
            )
          }

          Body = Buffer.from(data)
        }
      }

      if (null == Body) {
        let dj = JSON.stringify(d)
        Body = Buffer.from(dj)
      }

      // console.log('BODY', Body, entSpec?.bin ? '' : '<' + Body.toString() + '>')
      // console.log('options:: ', options, seneca.util.Nid() )

      let ento = msg.ent.make$().data$(d)

      // Local file
      if (options.local.active) {
        let full: string = Path.join(local_folder, s3id || id)
        let path: string = Path.dirname(full)

        if (options.debug) {
          console.log(PLUGIN, 'save', path, Body.length)
        }

        Fsp.mkdir(path, { recursive: true })
          .then(() => {
            Fsp.writeFile(full, Body as any)
              .then((_res: any) => {
                reply(null, ento)
              })
              .catch((err: any) => {
                reply(err)
              })
          })
          .catch((err: any) => {
            reply(err)
          })
      }

      // AWS S3
      else {
        const s3cmd = new PutObjectCommand({
          ...s3_shared_options,
          Key: s3id,
          Body,
        })

        aws_s3
          .send(s3cmd)
          .then((_res: any) => {
            reply(null, ento)
          })
          .catch((err: any) => {
            reply(err)
          })
      }
    },

    load: function (msg: any, reply: any) {
      let canon = msg.ent.entity$
      let qent = msg.qent
      let id = '' + msg.q.id
      let entSpec = options.ent[canon]
      let output: 'ent' | 'jsonl' | 'bin' = 'ent'
      let jsonl = entSpec?.jsonl || msg.jsonl$ || msg.q.jsonl$
      let bin = entSpec?.bin || msg.bin$ || msg.q.bin$

      let s3id = make_s3id(id, msg.ent, options, bin)

      output = jsonl && '' != jsonl ? 'jsonl' : bin && '' != bin ? 'bin' : 'ent'

      function replyEnt(body: any) {
        let entdata: any = {}

        // console.log('DES', output, body)
        if ('bin' !== output) {
          body = body.toString('utf-8')
        }

        if ('jsonl' === output) {
          entdata[jsonl] = body
            .split('\n')
            .filter((n: string) => '' !== n)
            .map((n: string) => JSON.parse(n))
        } else if ('bin' === output) {
          entdata[bin] = body
        } else {
          entdata = JSON.parse(body)
        }

        entdata.id = id

        let ento = qent.make$().data$(entdata)
        reply(null, ento)
      }

      // Local file
      if (options.local.active) {
        let full: string = Path.join(local_folder, s3id || id)
        // console.log('FULL', full)

        if (options.debug) {
          console.log(PLUGIN, 'load', full)
        }

        Fsp.readFile(full)
          .then((body: any) => {
            replyEnt(body)
          })
          .catch((err: any) => {
            if ('ENOENT' == err.code) {
              return reply()
            }
            reply(err)
          })
      }

      // AWS S3
      else {
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
                replyEnt(body)
              })
              .catch((err) => reply(err))
          })
          .catch((err: any) => {
            if ('NoSuchKey' === err.Code) {
              return reply()
            }

            reply(err)
          })
      }
    },

    // NOTE: S3 folder listing not supported yet.
    list: function (_msg: any, reply: any) {
      reply([])
    },

    remove: function (msg: any, reply: any) {
      let canon = (msg.ent || msg.qent).entity$
      let id = '' + msg.q.id
      let entSpec = options.ent[canon]
      let bin = entSpec?.bin || msg.bin$ || msg.q.bin$

      let s3id = make_s3id(id, msg.ent, options, bin)

      // Local file
      if (options.local.active) {
        let full: string = Path.join(local_folder, s3id || id)

        Fsp.unlink(full)
          .then((_res: any) => {
            reply()
          })
          .catch((err: any) => {
            if ('ENOENT' == err.code) {
              return reply()
            }
            reply(err)
          })
      } else {
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
      }
    },

    close: function (_msg: any, reply: () => void) {
      reply()
    },

    native: function (_msg: any, reply: any) {
      reply({ client: aws_s3, local: { ...options.local } })
    },
  }

  let meta = init(seneca, options, store)

  seneca.message(
    'cloud:aws,service:store,get:url,kind:upload',
    {
      bucket: String,
      filepath: String,
      expire: Number,
    },
    get_upload_url,
  )

  seneca.message(
    'cloud:aws,service:store,get:url,kind:download',
    {
      bucket: String,
      filepath: String,
      expire: Number,
    },
    get_download_url,
  )

  async function get_upload_url(msg: any) {
    const bucket = msg.bucket
    const filepath = msg.filepath
    const expire = msg.expire

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filepath,
    })
    const url: string = await getSignedUrl(aws_s3, command, {
      expiresIn: expire,
    })

    return {
      url,
      bucket,
      filepath,
      expire,
    }
  }

  async function get_download_url(msg: any) {
    const bucket = msg.bucket
    const filepath = msg.filepath
    const expire = msg.expire

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: filepath,
    })
    const url: string = await getSignedUrl(aws_s3, command, {
      expiresIn: expire,
    })
    return {
      url,
      bucket,
      filepath,
      expire,
    }
  }

  return {
    name: store.name,
    tag: meta.tag,
    exportmap: {
      native: aws_s3,
    },
  }
}

function make_s3id(id: string, ent: any, options: any, bin: boolean) {
  let s3id =
    null == id
      ? null
      : (null == options.folder
          ? options.prefix + ent.entity$
          : options.folder) +
        ('' == options.folder ? '' : '/') +
        id +
        (bin ? '' : options.suffix)

  // console.log('make_s3id', s3id, id, ent, options)
  return s3id
}

async function destream(output: 'ent' | 'jsonl' | 'bin', stream: any) {
  return new Promise((resolve, reject) => {
    const chunks: any = []
    stream.on('data', (chunk: any) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => {
      let buffer = Buffer.concat(chunks)
      if ('bin' === output) {
        resolve(buffer)
      } else {
        resolve(buffer.toString('utf-8'))
      }
    })
  })
}

Object.defineProperty(s3_store, 'name', { value: 's3-store' })
module.exports = s3_store
