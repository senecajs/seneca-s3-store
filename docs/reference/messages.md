# Messages and store operations

## Store operations

The plugin is a seneca-entity store (`name: 's3-store'`). Use it through the
entity API.

| Operation | Behaviour |
| --------- | --------- |
| `save$` | Writes the object (`PutObject`, or a file in local mode). Id from `id`, `id$` or the entity `generate_id` export. Replies with the saved entity. |
| `load$` | Reads the object (`GetObject`). Replies `null` when the key does not exist. With `exists$: true`, uses `HeadObject` and replies `{ id }`. |
| `list$` | Not implemented: always replies with an empty list. |
| `remove$` | Deletes the object (`DeleteObject`). Missing keys are not an error. |
| `close$` | No action. |
| `native$` | Replies `{ client, local }`: the `S3Client` (null in local mode) and a copy of `local` options. |

## `cloud:aws,service:store,get:url,kind:upload`

Parameters: `bucket` (string), `filepath` (string, object key), `expire`
(number, seconds). Reply: `{ url, bucket, filepath, expire }`, where `url` is
a presigned `PutObject` URL.

## `cloud:aws,service:store,get:url,kind:download`

Same parameters and reply, with a presigned `GetObject` URL.

Both need the S3 client, so they fail in local mode. See
[How-to: get presigned URLs](../how-to/get-presigned-urls.md).
