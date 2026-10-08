# @seneca/s3-store documentation

## Tutorials

| Page | Description |
| ---- | ----------- |
| [Getting started](tutorials/getting-started.md) | Save, load and remove an entity in S3. |

## How-to guides

| Page | Description |
| ---- | ----------- |
| [Use a local folder](how-to/use-a-local-folder.md) | Run without S3; simulate object created events. |
| [Store JSONL and binary data](how-to/store-jsonl-and-binary-data.md) | `jsonl` and `bin` options and directives. |
| [Get presigned URLs](how-to/get-presigned-urls.md) | Upload and download URL messages. |
| [Run the tests locally](how-to/run-the-tests-locally.md) | Docker S3 server and env variables. |

## Reference

| Page | Description |
| ---- | ----------- |
| [Options](reference/options.md) | Every option and entity directive. |
| [Messages](reference/messages.md) | Store operations and action patterns. |
| [Exports and errors](reference/api.md) | Exports and error behaviour. |

## Explanation

| Page | Description |
| ---- | ----------- |
| [How it works](explanation/how-it-works.md) | Keys, lifecycle, local mode, Seneca 3 and 4. |

## Feature index

| Feature | Kind | Page |
| ------- | ---- | ---- |
| `debug` | option | [options](reference/options.md) |
| `prefix` | option | [options](reference/options.md) |
| `suffix` | option | [options](reference/options.md) |
| `folder` | option | [options](reference/options.md) |
| `s3` | option | [options](reference/options.md) |
| `shared` | option | [options](reference/options.md) |
| `map` | option | [options](reference/options.md) |
| `local.active`, `local.folder` | option | [options](reference/options.md), [local folder](how-to/use-a-local-folder.md) |
| `local.watch`, `local.onObjectCreated` | option | [local folder](how-to/use-a-local-folder.md) |
| `local.suffixMode` | option | [options](reference/options.md) |
| `ent.<canon>.jsonl`, `ent.<canon>.bin` | option | [JSONL and binary](how-to/store-jsonl-and-binary-data.md) |
| `jsonl$`, `bin$`, `exists$` | directive | [options](reference/options.md) |
| save, load, list, remove, close, native | store operation | [messages](reference/messages.md) |
| `cloud:aws,service:store,get:url,kind:upload` | action | [messages](reference/messages.md) |
| `cloud:aws,service:store,get:url,kind:download` | action | [messages](reference/messages.md) |
| `native` | export | [api](reference/api.md) |
| `makeGatewayHandler` | export | [api](reference/api.md) |
| JSONL/bin field not found | error | [api](reference/api.md) |
