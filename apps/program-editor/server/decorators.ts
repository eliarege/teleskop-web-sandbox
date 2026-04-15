import type { Knex } from 'knex'
import type { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import { db, dmExchange } from './database'
import type { ProgramClient } from './classes/ProgramClient'

const ftpRefMap = new WeakMap<any, { count: number }>()
const trxRefMap = new WeakMap<any, { count: number, failed: boolean }>()
const dmTrxRefMap = new WeakMap<any, { count: number, failed: boolean }>()

function _withFTP<This extends { ftp: TbbFtpClient }, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext,
) {
  return async function (this: This, ...args: Args): Promise<Awaited<Return>> {
    let ref = ftpRefMap.get(this)
    if (!ref) {
      ref = { count: 1 }
      ftpRefMap.set(this, ref)
    } else {
      ref.count++
    }
    try {
      if (ref.count === 1) {
        await this.ftp.connect()
      }
      return await target.call(this, ...args)
    } finally {
      ref.count--
      if (!ref.count) {
        ftpRefMap.delete(this)
        this.ftp.close()
      }
    }
  }
}

function _withTransaction<This extends { trx: Knex.Transaction }, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext,
) {
  return async function (this: This, ...args: Args): Promise<Awaited<Return>> {
    let ref = trxRefMap.get(this)
    if (!ref) {
      ref = { count: 1, failed: false }
      trxRefMap.set(this, ref)
    } else {
      ref.count++
    }
    try {
      if (ref.count === 1) {
        this.trx = await db.transaction()
      }
      return await target.call(this, ...args)
    } catch (err) {
      ref.failed = true
      throw err
    } finally {
      ref.count--
      if (!ref.count) {
        trxRefMap.delete(this)
        if (!ref.failed) {
          await this.trx.commit()
        } else {
          await this.trx.rollback()
        }
      }
    }
  }
}

export function withFTP<This extends { ftp: TbbFtpClient }>(target: This, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value
  if (typeof method !== 'function')
    throw new TypeError('Decorator should be used on methods')

  descriptor.value = async function (this: This, ...args: any[]) {
    let ref = ftpRefMap.get(this)
    if (!ref) {
      ref = { count: 1 }
      ftpRefMap.set(this, ref)
    } else {
      ref.count++
    }
    try {
      if (ref.count === 1) {
        await this.ftp.connect()
      }
      return await method.call(this, ...args)
    } finally {
      ref.count--
      if (!ref.count) {
        ftpRefMap.delete(this)
        this.ftp.close()
      }
    }
  }
}

export function withProgramClient<This extends { client: ProgramClient }>(target: This, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value
  if (typeof method !== 'function')
    throw new TypeError('Decorator should be used on methods')

  descriptor.value = async function (this: This, ...args: any[]) {
    let ref = ftpRefMap.get(this)
    if (!ref) {
      ref = { count: 1 }
      ftpRefMap.set(this, ref)
    } else {
      ref.count++
    }
    try {
      if (ref.count === 1) {
        await this.client.connect()
      }
      return await method.call(this, ...args)
    } finally {
      ref.count--
      if (!ref.count) {
        ftpRefMap.delete(this)
        await this.client.disconnect()
      }
    }
  }
}

export function withTransaction<This extends { trx: Knex.Transaction }>(target: This, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value
  if (typeof method !== 'function' || typeof target !== 'object')
    throw new TypeError('Decorator should be used on methods')

  descriptor.value = async function (this: This, ...args: any[]) {
    let ref = trxRefMap.get(this)
    if (!ref) {
      ref = { count: 1, failed: false }
      trxRefMap.set(this, ref)
    } else {
      ref.count++
    }
    try {
      if (ref.count === 1) {
        this.trx = await db.transaction()
      }
      return await method.call(this, ...args)
    } catch (err) {
      ref.failed = true
      throw err
    } finally {
      ref.count--
      if (!ref.count) {
        trxRefMap.delete(this)
        if (this.trx.isTransaction && !this.trx.isCompleted()) {
          if (!ref.failed) {
            await this.trx.commit()
          } else {
            await this.trx.rollback()
            this.trx = db as Knex.Transaction
          }
        }
      }
    }
  }
}

export function withDmTransaction<This extends { dmTrx: Knex.Transaction | null }>(target: This, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value
  if (typeof method !== 'function' || typeof target !== 'object')
    throw new TypeError('Decorator should be used on methods')

  descriptor.value = async function (this: This, ...args: any[]) {
    if (!dmExchange) {
      return await method.call(this, ...args)
    }
    let ref = dmTrxRefMap.get(this)
    if (!ref) {
      ref = { count: 1, failed: false }
      dmTrxRefMap.set(this, ref)
    } else {
      ref.count++
    }
    try {
      if (ref.count === 1) {
        this.dmTrx = await dmExchange.transaction()
      }
      return await method.call(this, ...args)
    } catch (err) {
      ref.failed = true
      throw err
    } finally {
      ref.count--
      if (!ref.count) {
        dmTrxRefMap.delete(this)
        if (this.dmTrx?.isTransaction && !this.dmTrx.isCompleted()) {
          if (!ref.failed) {
            await this.dmTrx.commit()
          } else {
            await this.dmTrx.rollback()
            this.dmTrx = dmExchange as Knex.Transaction | null
          }
        }
      }
    }
  }
}
