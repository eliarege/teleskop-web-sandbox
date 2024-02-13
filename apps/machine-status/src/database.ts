import * as tedious from 'tedious'
import * as tarn from 'tarn'
import { DummyDriver, Kysely, MssqlAdapter, MssqlDialect, MssqlIntrospector, MssqlQueryCompiler, ParseJSONResultsPlugin } from 'kysely'
import { parseConnectionString } from '@tediousjs/connection-string'
import type { DmExchangeDatabase, TeleskopDatabase } from './types'
import { config } from './config'
import { logger } from './logger'

function createKyselyInstance<T>(connectionString: string) {
  const connectionParams = parseConnectionString(connectionString) as Record<string, string>
  let server = connectionParams.server
  let port = '1433'
  let instanceName: string | undefined
  // https://www.connectionstrings.com/microsoft-data-sqlclient/using-a-non-standard-port/
  if (server.includes(',')) {
    ([server, port] = server.split(',') as [string, string])
  } else if (server.includes('\\')) {
    ([server, instanceName] = server.split('\\') as [string, string])
  }

  const dialect = new MssqlDialect({
    tarn: {
      ...tarn,
      options: {
        min: 0,
        max: 10,
      },
    },
    tedious: {
      ...tedious,
      connectionFactory: () => new tedious.Connection({
        authentication: {
          options: {
            password: connectionParams.password,
            userName: connectionParams['user id'],
          },
          type: 'default',
        },
        options: {
          database: connectionParams.database,
          ...(
            instanceName
              ? { instanceName }
              : { port: Number.parseInt(port, 10) }
          ),
          trustServerCertificate: true,
        },
        server: connectionParams.server,
      }),
    },
  })

  return new Kysely<T>({
    dialect,
    plugins: [new ParseJSONResultsPlugin()],
  })
}

function createDummyKyselyInstance<T>() {
  return new Kysely<T>({
    dialect: {
      createAdapter: () => new MssqlAdapter(),
      createIntrospector: db => new MssqlIntrospector(db),
      createDriver: () => new DummyDriver(),
      createQueryCompiler: () => new MssqlQueryCompiler(),
    },
  })
}

export async function getTeleskopDetails(db: Kysely<TeleskopDatabase>) {
  const tables = await db.introspection.getTables()
  const erpParameterDefinitionsMeta = tables
    .find(t => t.schema === 'dbo' && t.name === 'BFERPPARAMETERDEFINITIONS')
  if (erpParameterDefinitionsMeta) {
    const erpParameterDefinitionsHasMachineId = erpParameterDefinitionsMeta.columns.some(col => col.name === 'MACHINEID')
    console.log(erpParameterDefinitionsHasMachineId)
  } else {
    throw new Error('fatal wtf')
  }
}

if (!config.dmExchangeUrl) {
  logger.info(`DMEXCHANGE_URL not configured`)
}

export const teleskop = createKyselyInstance<TeleskopDatabase>(config.teleskopUrl)

export const dmExchange = config.dmExchangeUrl
  ? createKyselyInstance<DmExchangeDatabase>(config.dmExchangeUrl)
  : createDummyKyselyInstance<DmExchangeDatabase>()
