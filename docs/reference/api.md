# Exports

| Export | Description |
| ------ | ----------- |
| `s3-store/native` | Intended to be the `S3Client`. It is always `null` because the client is created after exports are read; use `seneca.entity(...).native$()` instead. |
| `s3-store/makeGatewayHandler` | `makeGatewayHandler(msg)` returns a handler `{ name: 's3', match, process }` for an AWS Lambda gateway. `match(trigger)` is true when `trigger.record.eventSource` is `'aws:s3'`; `process(trigger, gateway)` calls `gateway({ ...msg, record, event }, trigger)`. `msg` can be an object or a Jsonic string. |

## Errors

The plugin defines no error codes. Save fails with a plain `Error` when a
configured JSONL or binary field is missing (see
[How-to: store JSONL and binary data](../how-to/store-jsonl-and-binary-data.md)).
AWS SDK errors other than not found are passed to the reply unchanged.
