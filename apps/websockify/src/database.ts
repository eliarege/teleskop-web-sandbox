import process from 'node:process'
import Knex from 'knex'
import { destruct } from './utils'
import { logger as parentLogger } from './logger'

export interface Machine {
  name: string
  host: string
  port: number
}

const {
  TELESKOP_HOST = '127.0.0.1',
  TELESKOP_PORT = '1433',
  TELESKOP_DATABASE = 'Teleskop',
  TELESKOP_USER,
  TELESKOP_PASSWORD,
  TELESKOP_INSTANCE_NAME,
} = destruct(process.env)

const logger = parentLogger.child({ name: 'database' })

if (process.env.NODE_ENV === 'production') {
  if (!TELESKOP_USER)
    throw new Error('TELESKOP_USER must be defined')
  if (!TELESKOP_PASSWORD)
    throw new Error('TELESKOP_PASSWORD must be defined')
}

const knex = Knex({
  client: 'mssql',
  log: logger,
  connection: {
    host: TELESKOP_HOST,
    port: Number.parseInt(TELESKOP_PORT),
    user: TELESKOP_USER,
    password: TELESKOP_PASSWORD,
    database: TELESKOP_DATABASE,
    options: {
      appName: process.env.APP_NAME,
      instanceName: TELESKOP_INSTANCE_NAME,
    },
  },
})

export async function fetchTeleskopMachine(id: number): Promise<Machine | null> {
  try {
    const response = await knex
      .from('BFMACHINES')
      .select({
        name: 'MACHINECODE',
        host: 'IP',
        port: knex.raw(`
            CASE
              WHEN HardwareModel = 'Atom' OR HardwareModel = 'Giada'
                THEN 5901
                ELSE 5900
            END`,
        ),
      })
      .where({
        INUSE: 1,
        USEINTELESKOP: 1,
        MACHINEID: id,
      })

    return response[0] || null
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      if (!TELESKOP_USER)
        logger.warn('TELESKOP_USER is not defined')
      if (!TELESKOP_PASSWORD)
        logger.warn('TELESKOP_PASSWORD is not defined')
    }
    logger.error((err as NodeJS.ErrnoException).message)
    return null
  }
}
