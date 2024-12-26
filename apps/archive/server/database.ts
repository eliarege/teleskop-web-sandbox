import Knex from 'knex'

const config = useRuntimeConfig()
const knexConfig: Knex.Knex.Config = {
  client: 'mssql',
}

function tryJsonParse(str: string): any {
  try {
    return JSON.parse(str)
  } catch {
    return str
  }
}

function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .split(/[\s_\-]+/)
    .map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

/**
 * Drizzle style connection URL
 *
 * `mssql://user:password@host:port/database?instanceName=MSSQLSERVER&encrypt=false`
 */
function parseTeleskopConnectionURL(urlString: string): Knex.Knex.Config['connection'] {
  const url = new URL(urlString)
  return {
    host: url.hostname,
    port: Number(url.port || 1433),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    options: {
      trustServerCertificate: true,
      ...Object.fromEntries([
        ...url.searchParams.entries(),
      ].map(([k, v]) => [toCamelCase(k), tryJsonParse(v)])),
    },
  }
}

if (config.teleskopDatabaseUrl) {
  knexConfig.connection = parseTeleskopConnectionURL(config.teleskopDatabaseUrl)
} else {
  knexConfig.connection = {
    host: config.teleskopHost,
    port: Number.parseInt(config.teleskopPort),
    user: config.teleskopUser,
    password: String(config.teleskopPassword),
    database: config.teleskopDatabase,
    options: {
      instanceName: config.teleskopInstanceName,
      trustServerCertificate: true,
    },
  }
}

export const db = Knex(knexConfig)
