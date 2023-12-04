"use strict";
/* Copyright (c) 2020-2023 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const gubu_1 = require("gubu");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, } = require('@aws-sdk/client-s3');
// TODO: ent fields as dot paths
s3_store.defaults = {
    prefix: 'seneca/db01/',
    folder: (0, gubu_1.Any)(),
    s3: {},
    // keys are canon strings
    map: (0, gubu_1.Skip)({}),
    shared: (0, gubu_1.Skip)({}),
    local: (0, gubu_1.Skip)({
        active: (0, gubu_1.Default)(false, Boolean),
        folder: (0, gubu_1.Skip)(String),
        folderSuffix: (0, gubu_1.Default)('none', String)
    }),
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
    let local_folder = '';
    let s3_shared_options = {
        Bucket: '!not-a-bucket!',
        ...options.shared,
    };
    seneca.init(function (reply) {
        // AWS SDK setup
        var _a, _b;
        const s3_opts = {
            s3ForcePathStyle: true,
            ...options.s3,
        };
        // aws_s3 = new AWS.S3(s3_opts)
        aws_s3 = !((_a = options === null || options === void 0 ? void 0 : options.local) === null || _a === void 0 ? void 0 : _a.active) ? new S3Client(s3_opts) : null;
        if ((_b = options === null || options === void 0 ? void 0 : options.local) === null || _b === void 0 ? void 0 : _b.active) {
            let folder = options.local.folder;
            local_folder = 'genid' == options.local.folderSuffix ?
                folder + '-' + seneca.util.Nid() : folder;
        }
        reply();
    });
    let store = {
        name: 's3-store',
        save: function (msg, reply) {
            // console.log('MSG', msg)
            var _a;
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
                if ('string' === typeof jsonl && '' !== jsonl) {
                    let arr = msg.ent[jsonl];
                    if (!Array.isArray(arr)) {
                        throw new Error('s3-store: option ent.jsonl array field not found: ' + jsonl);
                    }
                    let content = arr.map((n) => JSON.stringify(n)).join('\n') + '\n';
                    Body = Buffer.from(content);
                }
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
            if ((_a = options === null || options === void 0 ? void 0 : options.local) === null || _a === void 0 ? void 0 : _a.active) {
                let full = path_1.default.join(local_folder, s3id || id);
                let path = path_1.default.dirname(full);
                // console.log('dirname: ', path )
                promises_1.default.mkdir(path, { recursive: true })
                    .then((out) => {
                    Body && promises_1.default.writeFile(full, Body)
                        .then((_res) => {
                        let ento = msg.ent.make$().data$(d);
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
            else {
                const s3cmd = new PutObjectCommand({
                    ...s3_shared_options,
                    Key: s3id,
                    Body,
                });
                aws_s3
                    .send(s3cmd)
                    .then((_res) => {
                    let ento = msg.ent.make$().data$(d);
                    reply(null, ento);
                })
                    .catch((err) => {
                    reply(err);
                });
            }
        },
        load: function (msg, reply) {
            // console.log('MSG', msg)
            var _a;
            let canon = msg.ent.entity$;
            let qent = msg.qent;
            let id = '' + msg.q.id;
            let s3id = make_s3id(id, msg.ent, options);
            let entSpec = options.ent[canon];
            let output = 'ent';
            let jsonl = (entSpec === null || entSpec === void 0 ? void 0 : entSpec.jsonl) || msg.jsonl$ || msg.q.jsonl$;
            let bin = (entSpec === null || entSpec === void 0 ? void 0 : entSpec.bin) || msg.bin$ || msg.q.bin$;
            output = jsonl && '' != jsonl ? 'jsonl' : bin && '' != bin ? 'bin' : 'ent';
            if ((_a = options === null || options === void 0 ? void 0 : options.local) === null || _a === void 0 ? void 0 : _a.active) {
                let full = path_1.default.join(local_folder, s3id || id);
                promises_1.default.readFile(full)
                    .then((body) => {
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
                })
                    .catch((err) => {
                    if ('ENOENT' == err.code) {
                        return reply();
                    }
                    reply(err);
                });
            }
            else {
                const s3cmd = new GetObjectCommand({
                    ...s3_shared_options,
                    Key: s3id,
                });
                aws_s3
                    .send(s3cmd)
                    .then((res) => {
                    // console.log(res)
                    destream(output, res.Body)
                        .then((body) => {
                        let entdata = {};
                        // console.log('DES', output, body)
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
        list: function (_msg, reply) {
            reply([]);
        },
        remove: function (msg, reply) {
            var _a;
            // let qent = msg.qent
            let id = '' + msg.q.id;
            let s3id = make_s3id(id, msg.ent, options);
            if ((_a = options === null || options === void 0 ? void 0 : options.local) === null || _a === void 0 ? void 0 : _a.active) {
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
                const s3cmd = new DeleteObjectCommand({
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
            reply();
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
    return null == id
        ? null
        : (null == options.folder ? options.prefix + ent.entity$ : options.folder) +
            '/' +
            id +
            '.json';
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