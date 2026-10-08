# Patches

Changes under `.github/workflows/` cannot be pushed from the session that
prepared this branch, so they are delivered as patches. Apply them with:

```sh
git am .patches/*.patch
```

| Patch | Change |
| ----- | ------ |
| `0001-ci-s3mock-service.patch` | `build.yml`: triggers on `master` and `main`, Node 24.x and 22.x on `ubuntu-latest`, and an `adobe/s3mock:5.2` service container on port 19100 with a `wget` health check, matching `docker-compose.yml`. |

The `minio/minio` image is no longer published on Docker Hub, so S3Mock is
used as the S3 compatible test server. After the patch is applied this
folder can be deleted.
