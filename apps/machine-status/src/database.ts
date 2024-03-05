import * as tedious from 'tedious'
import * as tarn from 'tarn'
import { Kysely, MssqlDialect, ParseJSONResultsPlugin } from 'kysely'
import { parseConnectionString } from '@tediousjs/connection-string'
import { inferBoolean } from 'utils'
import { logger } from './logger'

export function createKyselyInstance<T>(connectionString: string) {
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

  const trustServerCertificate = connectionParams.trustservercertificate
    ? inferBoolean(connectionParams.trustservercertificate)
    : true

  const encrypt = connectionParams.encrypt
    ? inferBoolean(connectionParams.encrypt)
    : false

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
          trustServerCertificate,
          encrypt,
        },
        server,
      }).on('error', err => logger.error(`${err.message} [${server}/${connectionParams.database}]`)),
    },
  })

  return new Kysely<T>({
    dialect,
    plugins: [new ParseJSONResultsPlugin()],
  })
}
