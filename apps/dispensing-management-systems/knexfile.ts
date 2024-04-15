import process from 'node:process'
import type { Knex } from 'knex'

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DMS_HOST,
      port: Number.parseInt(process.env.DMS_PORT!),
      user: process.env.DMS_USER,
      password: process.env.DMS_PASSWORD,
      database: process.env.DMS_DATABASE,
    },
    migrations: {
      directory: 'server/migrations',
      extension: 'ts',
      // loadExtensions: ['.ts'],
      tableName: 'knex_migrations',
      schemaName: 'public',
    },
  },
  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },

}

export default config
