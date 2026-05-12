import process from 'node:process'
import type { Knex as IKnex } from 'knex'
import Knex from 'knex'
import { onExitSignal } from './utils'
import { logger as parentLogger } from './logger'
import { config } from './config'

export interface Machine {
  name: string
  host: string
  port: number
  username?: string
  password: string
}

const logger = parentLogger.child({ name: 'database' })
const knexLogger: IKnex.Logger = {
  debug: logger.debug.bind(logger),
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  deprecate: logger.warn.bind(logger),
}

const knex = Knex({
  client: 'mssql',
  log: knexLogger,
  connection: {
    host: config.teleskopHost,
    port: config.teleskopPort,
    user: config.teleskopUser,
    password: config.teleskopPassword,
    database: config.teleskopDatabase,
    options: {
      appName: config.appName,
      instanceName: config.teleskopInstanceName,
    },
  },
})
const dms = Knex({
  client: 'pg',
  log: knexLogger,
  connection: {
    host: config.dmsHost,
    port: config.dmsPort,
    user: config.dmsUser,
    password: config.dmsPassword,
    database: config.dmsDatabase,
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
              WHEN TBBMODEL != 'Tonello' AND (HardwareModel = 'Atom' OR HardwareModel = 'Giada')
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

    return response[0] ? { ...response[0], password: '123456' } : null
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      if (!config.teleskopUser)
        logger.warn('TELESKOP_USER is not defined')
      if (!config.teleskopPassword)
        logger.warn('TELESKOP_PASSWORD is not defined')
    }
    logger.error((err as NodeJS.ErrnoException).message)
    return null
  }
}
export async function fetchDMSMachine(id: number): Promise<Machine | null> {
  try {
    if (config.dmsEnabled) {
      const response = await dms('DISPENSER')
        .select({
          name: 'dispenser_name',
          host: 'ip_address',
          port: 'vnc_port',
          password: 'vnc_password',
        })
        .where({
          dispenser_id: id,
        }).first()

      return response || null
    } else {
      const teleskopDispenser = await knex
        .from('DYTFDISPENSERSETTINGS')
        .select({
          name: 'NAME',
          host: 'IP',
          port: 'VNCPORT',
          password: 'VNCPASSWORD',
        }).where('DISPENSERID', id).first()
      return teleskopDispenser || null
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      if (!config.dmsUser)
        logger.warn('DMS_USER is not defined')
      if (!config.dmsPassword)
        logger.warn('DMS_PASSWORD is not defined')
    }
    logger.error((err as NodeJS.ErrnoException).message)
    return null
  }
}
onExitSignal(async () => {
  await knex.destroy()
})
