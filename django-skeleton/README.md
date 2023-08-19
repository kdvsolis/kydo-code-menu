# ims-service

## Development

Start/remove dev database.

```cli
./scripts/dev-db.sh up -d
```

```cli
./scripts/dev-db.sh down
```

Lint.

```cli
./scripts/lint.sh
```

Format.

```cli
./scripts/format.sh
```

Build app image.

```cli
docker build -t ims-service:latest .
```

Start dev container. Environment variables can be put in a `.env` file (see `.env.sample` for the keys required). Docker compose will then read this file.

Note: An `extra_hosts` mapping is in `docker-compose-app.yml`: `"remote:${EXT2_IMS}"`. Provide an internal IP (from host) that will map to `remote`. You can do this by setting the internal IP to `EXT2_IMS` in the `.env`.

```
docker-compose -f docker-compose-app.yml up
```