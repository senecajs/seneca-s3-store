"use strict";
/* Copyright (c) 2020 Richard Rodger, MIT License */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
function s3_store(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const seneca = this;
        const init = seneca.export('entity/init');
        let generate_id = options.generate_id || seneca.export('entity/generate_id');
        let aws_s3 = null;
        seneca.init(function (reply) {
            // AWS SDK setup
            const s3_opts = Object.assign({ s3ForcePathStyle: true }, options.s3);
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
                aws_s3.putObject({
                    Bucket: 'test-bucket',
                    Key: id,
                    Body: new Buffer(dj)
                }, (err) => {
                    let ento = msg.ent.make$().data$(d);
                    reply(err, ento);
                });
            },
            load: function (msg, reply) {
                let qent = msg.qent;
                let id = '' + msg.q.id;
                aws_s3.getObject({
                    Key: id,
                    Bucket: 'test-bucket'
                }, (err, res) => {
                    if (err && 'NoSuchKey' === err.code) {
                        return reply();
                    }
                    let ento = null == res ? null :
                        qent.make$().data$(JSON.parse(res.Body.toString()));
                    reply(err, ento);
                });
            },
            list: function (msg, reply) {
                reply([]);
            },
            remove: function (msg, reply) {
                let qent = msg.qent;
                let id = '' + msg.q.id;
                aws_s3.deleteObject({
                    Key: id,
                    Bucket: 'test-bucket'
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
    });
}
Object.defineProperty(s3_store, 'name', { value: 's3-store' });
module.exports = s3_store;
//# sourceMappingURL=s3-store.js.map