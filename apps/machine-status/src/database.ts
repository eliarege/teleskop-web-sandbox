import * as tedious from 'tedious'
import * as tarn from 'tarn'
import { Kysely, MssqlDialect, ParseJSONResultsPlugin } from 'kysely'
import { parseConnectionString } from '@tediousjs/connection-string'
import { inferBoolean } from '@teleskop/utils'
import { logger } from './logger'

interface DatabaseConfig {
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
  instanceName?: string
  options?: tedious.ConnectionOptions
}

export function createKyselyInstance<T>(connectionStringOrOptions: string | DatabaseConfig) {
  let server = '127.0.0.1'
  const auth: tedious.ConnectionAuthentication = {
    type: 'default',
    options: {},
  }
  const connOptions: tedious.ConnectionOptions = {
    trustServerCertificate: true,
    encrypt: false,
  }

  if (typeof connectionStringOrOptions === 'string') {
    const connParams = parseConnectionString(connectionStringOrOptions) as Record<string, string>
    server = connParams.server
    if (!server) {
      throw new Error(`Connection string is missing 'server' property`)
    }
    auth.options.userName = connParams['user id']
    auth.options.password = connParams.password
    connOptions.database = connParams.database
    connOptions.trustServerCertificate = connParams.trustservercertificate
      ? inferBoolean(connParams.trustservercertificate)
      : connOptions.trustServerCertificate
    connOptions.encrypt = connParams.encrypt
      ? inferBoolean(connParams.encrypt)
      : false

    if (server.includes(',')) {
      const seg = server.split(',')
      server = seg[0]
      connOptions.port = Number(seg[1])
    } else if (server.includes('\\')) {
      const seg = server.split('\\')
      server = seg[0]
      connOptions.instanceName = seg[1]
    }
  } else {
    const opt = connectionStringOrOptions
    server = opt.host || server
    auth.options.userName = opt.user
    auth.options.password = opt.password
    connOptions.database = opt.database
    connOptions.port = opt.port
    connOptions.instanceName = opt.instanceName
    Object.assign(connOptions, opt.options)
  }

  const dialect = new MssqlDialect({
    tarn: {
      ...tarn,
      options: {
        min: 0,
        max: 1,
      },
    },
    tedious: {
      ...tedious,
      connectionFactory: () => new tedious.Connection({
        authentication: auth,
        options: connOptions,
        server,
      }).on('error', err => logger.error(`${err.message} [${server}/${connOptions.database}]`)),
    },
  })

  return new Kysely<T>({
    dialect,
    plugins: [new ParseJSONResultsPlugin()],
  })
}
