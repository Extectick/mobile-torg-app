$ErrorActionPreference = "Stop"

docker compose run --rm migrate
docker compose up -d web
