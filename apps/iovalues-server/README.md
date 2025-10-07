# IO Values Server

## Commands

```sh
# Development
pnpm run dev

# Typecheck
pnpm run typecheck

# Lint
pnpm run lint
pnpm run lint:fix

# Build
pnpm run build

# Build Preview
pnpm run preview

# Production
pnpm run start
```

## Configuration Options

The following environment variables can be used to configure the iovalues-server:

- `SERVER_HOST` (default: `0.0.0.0`)
- `SERVER_PORT` (default: `8080`)
- `ARCHIVE_DIR` (**required**)
- `TELESKOP_HOST` or `NUXT_TELESKOP_HOST` (**required**)
- `TELESKOP_PORT` or `NUXT_TELESKOP_PORT` (default: `1433`)
- `TELESKOP_USER` or `NUXT_TELESKOP_USER` (**required**)
- `TELESKOP_PASSWORD` or `NUXT_TELESKOP_PASSWORD` (**required**)
- `TELESKOP_DATABASE` or `NUXT_TELESKOP_DATABASE` (**required**)
- `TELESKOP_INSTANCE_NAME` or `NUXT_TELESKOP_INSTANCE_NAME` (optional)
- `TELESKOP_CONNECTION_OPTIONS` or `NUXT_TELESKOP_CONNECTION_OPTIONS` (optional, type: querystring)
- `TELESKOP_TIMEZONE_OFFSET` or `NUXT_TELESKOP_TIMEZONE_OFFSET` (default: `-180`)
- `LOG_LEVEL` or `NUXT_LOG_LEVEL` (default: `info`)
