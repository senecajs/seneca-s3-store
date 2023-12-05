"use strict";
/* Copyright (c) 2020-2023 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const gubu_1 = require("gubu");
const client_s3_1 = require("@aws-sdk/client-s3");
// TODO: ent fields as dot paths
s3_store.defaults = {
    prefix: (0, gubu_1.Empty)('seneca/db01/'),
    suffix: (0, gubu_1.Empty)('.json'),
    folder: (0, gubu_1.Any)(),
    s3: {},
    // keys are canon strings
    map: (0, gubu_1.Skip)({}),
    shared: (0, gubu_1.Skip)({}),
    // Use a local folder to simulate S3 for local dev and testing.
    local: {
        active: false,
        folder: '',
        suffixMode: 'none', // TODO: FIX: Default('none', Exact('none', 'genid'))
    },
    // keys are canon strings
    ent: (0, gubu_1.Default)({}, (0, gubu_1.Child)({
        // Save a sub array as JSONL. NOTE: Other fields are LOST!
        jsonl: (0, gubu_1.Skip)(String),
        // Save a sub field as binary. NOTE: Other fields are LOST!
        bin: (0, gubu_1.Skip)(String),
    })),
};
async function s3_store(options) {
    const seneca = this;
    const init = seneca.export('entity/init');
    let generate_id = options.generate_id || seneca.export('entity/generate_id');
    let aws_s3 = null;
    let s3_shared_options = {
        Bucket: '!not-a-bucket!',
        ...options.shared,
    };
    let local_folder = '';
    seneca.init(function (reply) {
        if (options.local.active) {
            let folder = options.local.folder;
            local_folder =
                'genid' == options.local.suffixMode
                    ? folder + '-' + seneca.util.Nid()
                    : folder;
        }
        else {
            const s3_opts = {
                s3ForcePathStyle: true,
                ...options.s3,
            };
            aws_s3 = new client_s3_1.S3Client(s3_opts);
        }
        reply();
    });
    let store = {
        name: 's3-store',
        save: function (msg, reply) {
            // console.log('MSG', msg)
            let canon = msg.ent.entity$;
            let id = '' + (msg.ent.id || msg.ent.id$ || generate_id(msg.ent));
            let d = msg.ent.data$();
            d.id = id;
            let s3id = make_s3id(id, msg.ent, options);
            let Body = undefined;
            let entSpec = options.ent[canon];
            if (entSpec || msg.jsonl$ || msg.bin$) {
                let jsonl = (entSpec === null || entSpec === void 0 ? void 0 : entSpec.jsonl) || msg.jsonl$;
                let bin = (entSpec === null || entSpec === void 0 ? void 0 : entSpec.bin) || msg.bin$;
                // JSONL files
                if ('string' === typeof jsonl && '' !== jsonl) {
                    let arr = msg.ent[jsonl];
                    if (!Array.isArray(arr)) {
                        throw new Error('s3-store: option ent.jsonl array field not found: ' + jsonl);
                    }
                    let content = arr.map((n) => JSON.stringify(n)).join('\n') + '\n';
                    Body = Buffer.from(content);
                }
                // Binary files
                else if ('string' === typeof bin && '' !== bin) {
                    let data = msg.ent[bin];
                    if (null == data) {
                        throw new Error('s3-store: option ent.bin data field not found: ' + bin);
                    }
                    Body = Buffer.from(data);
                }
            }
            if (null == Body) {
                let dj = JSON.stringify(d);
                Body = Buffer.from(dj);
            }
            // console.log('BODY', Body, entSpec?.bin ? '' : '<' + Body.toString() + '>')
            // console.log('options:: ', options, seneca.util.Nid() )
            let ento = msg.ent.make$().data$(d);
            // Local file
            if (options.local.active) {
                let full = path_1.default.join(local_folder, s3id || id);
                let path = path_1.default.dirname(full);
                promises_1.default.mkdir(path, { recursive: true })
                    .then(() => {
                    promises_1.default.writeFile(full, Body)
                        .then((_res) => {
                        reply(null, ento);
                    })
                        .catch((err) => {
                        reply(err);
                    });
                })
                    .catch((err) => {
                    reply(err);
                });
            }
            // AWS S3
            else {
                const s3cmd = new client_s3_1.PutObjectCommand({
                    ...s3_shared_options,
                    Key: s3id,
                    Body,
                });
                aws_s3
                    .send(s3cmd)
                    .then((_res) => {
                    reply(null, ento);
                })
                    .catch((err) => {
                    reply(err);
                });
            }
        },
        load: function (msg, reply) {
            let canon = msg.ent.entity$;
            let qent = msg.qent;
            let id = '' + msg.q.id;
            let s3id = make_s3id(id, msg.ent, options);
            let entSpec = options.ent[canon];
            let output = 'ent';
            let jsonl = (entSpec === null || entSpec === void 0 ? void 0 : entSpec.jsonl) || msg.jsonl$ || msg.q.jsonl$;
            let bin = (entSpec === null || entSpec === void 0 ? void 0 : entSpec.bin) || msg.bin$ || msg.q.bin$;
            output = jsonl && '' != jsonl ? 'jsonl' : bin && '' != bin ? 'bin' : 'ent';
            function replyEnt(body) {
                let entdata = {};
                // console.log('DES', output, body)
                if ('bin' !== output) {
                    body = body.toString('utf-8');
                }
                if ('jsonl' === output) {
                    entdata[jsonl] = body
                        .split('\n')
                        .filter((n) => '' !== n)
                        .map((n) => JSON.parse(n));
                }
                else if ('bin' === output) {
                    entdata[bin] = body;
                }
                else {
                    entdata = JSON.parse(body);
                }
                entdata.id = id;
                let ento = qent.make$().data$(entdata);
                reply(null, ento);
            }
            // Local file
            if (options.local.active) {
                let full = path_1.default.join(local_folder, s3id || id);
                // console.log('FULL', full)
                promises_1.default.readFile(full)
                    .then((body) => {
                    replyEnt(body);
                })
                    .catch((err) => {
                    if ('ENOENT' == err.code) {
                        return reply();
                    }
                    reply(err);
                });
            }
            // AWS S3
            else {
                const s3cmd = new client_s3_1.GetObjectCommand({
                    ...s3_shared_options,
                    Key: s3id,
                });
                aws_s3
                    .send(s3cmd)
                    .then((res) => {
                    // console.log(res)
                    destream(output, res.Body)
                        .then((body) => {
                        replyEnt(body);
                    })
                        .catch((err) => reply(err));
                })
                    .catch((err) => {
                    if ('NoSuchKey' === err.Code) {
                        return reply();
                    }
                    reply(err);
                });
            }
        },
        // NOTE: S3 folder listing not supported yet.
        list: function (_msg, reply) {
            reply([]);
        },
        remove: function (msg, reply) {
            // let qent = msg.qent
            let id = '' + msg.q.id;
            let s3id = make_s3id(id, msg.ent, options);
            // Local file
            if (options.local.active) {
                let full = path_1.default.join(local_folder, s3id || id);
                promises_1.default.unlink(full)
                    .then((_res) => {
                    reply();
                })
                    .catch((err) => {
                    if ('ENOENT' == err.code) {
                        return reply();
                    }
                    reply(err);
                });
            }
            else {
                const s3cmd = new client_s3_1.DeleteObjectCommand({
                    ...s3_shared_options,
                    Key: s3id,
                });
                aws_s3
                    .send(s3cmd)
                    .then((_res) => {
                    reply();
                })
                    .catch((err) => {
                    if ('NoSuchKey' === err.Code) {
                        return reply();
                    }
                    reply(err);
                });
            }
        },
        close: function (_msg, reply) {
            reply();
        },
        native: function (_msg, reply) {
            reply({ client: aws_s3, local: { ...options.local } });
        },
    };
    let meta = init(seneca, options, store);
    return {
        name: store.name,
        tag: meta.tag,
        exportmap: {
            native: aws_s3,
        },
    };
}
function make_s3id(id, ent, options) {
    let s3id = null == id
        ? null
        : (null == options.folder
            ? options.prefix + ent.entity$
            : options.folder) +
            ('' == options.folder ? '' : '/') +
            id +
            options.suffix;
    // console.log('make_s3id', s3id, id, ent, options)
    return s3id;
}
async function destream(output, stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => {
            let buffer = Buffer.concat(chunks);
            if ('bin' === output) {
                resolve(buffer);
            }
            else {
                resolve(buffer.toString('utf-8'));
            }
        });
    });
}
Object.defineProperty(s3_store, 'name', { value: 's3-store' });
module.exports = s3_store;
//# sourceMappingURL=s3-store.js.map