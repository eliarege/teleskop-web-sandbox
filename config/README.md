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

