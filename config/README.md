## Development Configuration

- Create a `config/{CONFIG_NAME}.json` file based on the example below.
- Adjust the configuration values as needed for your development environment.
- Run `pnpm run -w generate-env {CONFIG_NAME}` to generate `.env` file for every app.

### Configuration Options

- `teleskop`: Configuration for the Teleskop database connection.
  - `host`: The hostname of the Teleskop database server. (Default: `localhost`)
  - `port`: The port number for the Teleskop database server. (Default: `1433`)
  - `user`: The username for connecting to the Teleskop database. (Default: `sa`)
  - `password`: The password for connecting to the Teleskop database.
  - `database`: The name of the Teleskop database. (Default: `Teleskop`)
  - `connectionOptions`: Additional connection options for the Teleskop database.
  - `timezoneOffset`: The timezone offset in minutes.

- `dmexchange`: Configuration for the DmExchange database connection.
  - `host`: The hostname of the DmExchange database server. (Default: `.teleskop.host`)
  - `port`: The port number for the DmExchange database server. (Default: `.teleskop.port`)
  - `user`: The username for connecting to the DmExchange database. (Default: `.teleskop.user`)
  - `password`: The password for connecting to the DmExchange database. (Default: `.teleskop.password`)
  - `database`: The name of the DmExchange database. (Default: `DmExchange`)
  - `connectionOptions`: Additional connection options for the DmExchange database.

### Per-app environment overrides

In addition to the standard keys above, the config may contain one top-level
key **per app directory** under `apps/` (e.g. `machines`, `root`,
`planning-board`). Keys that do not match an existing app directory are
silently ignored.

For each present app, the value is recursively flattened into `.env` entries
prefixed with `NUXT_` and appended to that app's generated `.env` under an
`# App configuration` block. Keys are converted to UPPER_SNAKE_CASE the way
Nuxt derives env-var names from `runtimeConfig`, so camelCase / PascalCase
keys map to `PARENT_CHILD_...` segments.

- Leaf values may be **string**, **number**, or **boolean**.
- `null` leaves are dropped (ignored).
- **Arrays are invalid** and cause the script to exit with a zod validation
  error pointing at the offending key path.

```json
{
  "machines": {
    "public": { "kcClientId": "machines-x" },
    "someNumber": 5,
    "ignored": null
  },
  "root": { "rootKey": "rv" },
  "nonexistentApp": { "x": 1 }
}
```

The `machines` block above produces, in `apps/machines/.env` only:

```
# App configuration
NUXT_PUBLIC_KC_CLIENT_ID=machines-x
NUXT_SOME_NUMBER=5
```

`ignored` is `null` and is therefore skipped; `nonexistentApp` does not match
any app in `apps/` and is dropped; the `root` block only affects
`apps/root/.env`.

## Example Config

```json
{
  "teleskop": {
    "host": "localhost",
    "port": 1433,
    "user": "sa",
    "password": "<password>",
    "database": "Teleskop",
    "connectionOptions": {},
    "timezoneOffset": -180
  },
  "dmexchange": {
    "database": "DmExchange",
    "connectionOptions": {}
  }
}
```

