"use strict";
/* Copyright (c) 2020 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gubu_1 = require("gubu");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
s3_store.defaults = {
    prefix: 'seneca/db01/',
    folder: (0, gubu_1.Any)(null, ''),
    s3: (0, gubu_1.Skip)({}),
    map: (0, gubu_1.Skip)({}),
    shared: (0, gubu_1.Skip)({}),
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
    seneca.init(function (reply) {
        // AWS SDK setup
        const s3_opts = {
            s3ForcePathStyle: true,
            ...options.s3,
        };
        aws_s3 = new aws_sdk_1.default.S3(s3_opts);
        reply();
    });
    let store = {
        name: 's3-store',
        save: function (msg, reply) {
            let id = '' + (msg.ent.id || msg.ent.id$ || generate_id(msg.ent));
            let d = msg.ent.data$();
            d.id = id;
            let dj = JSON.stringify(d);
            let s3id = make_s3id(id, msg.ent, options);
            aws_s3.putObject({
                ...s3_shared_options,
                Key: s3id,
                Body: new Buffer(dj),
            }, (err) => {
                let ento = msg.ent.make$().data$(d);
                reply(err, ento);
            });
        },
        load: function (msg, reply) {
            let qent = msg.qent;
            let id = '' + msg.q.id;
            let s3id = make_s3id(id, msg.ent, options);
            aws_s3.getObject({
                ...s3_shared_options,
                Key: s3id,
            }, (err, res) => {
                if (err && 'NoSuchKey' === err.code) {
                    return reply();
                }
                let ento = null == res
                    ? null
                    : qent.make$().data$(JSON.parse(res.Body.toString()));
                reply(err, ento);
            });
        },
        list: function (msg, reply) {
            reply([]);
        },
        remove: function (msg, reply) {
            let qent = msg.qent;
            let id = '' + msg.q.id;
            let s3id = make_s3id(id, msg.ent, options);
            aws_s3.deleteObject({
                ...s3_shared_options,
                Key: s3id,
            }, (err, res) => {
                if (err && 'NoSuchKey' === err.code) {
                    return reply();
                }
                reply(err);
            });
        },
        close: function (msg, reply) {
            reply();
        },
        native: function (msg, reply) {
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
Object.defineProperty(s3_store, 'name', { value: 's3-store' });
module.exports = s3_store;
//# sourceMappingURL=s3-store.js.map