import type { Knex } from 'knex'
import type { TbbFtpClient } from 'tbb-ftp-client'
import { db } from './database'

const ftpRefMap = new WeakMap<any, { count: number }>()
const trxRefMap = new WeakMap<any, { count: number; failed: boolean }>()

function _withFTP<This extends { ftp: TbbFtpClient }, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext,
) {
  return async function (this: This, ...args: Args): Promise<Awaited<Return>> {
    let ref = ftpRefMap.get(this)
    if (!ref) {
      ref = { count: 1 }
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

  async function wrappedMethod(this: This, ...args: any[]) {
    let ref = ftpRefMap.get(this)
    if (!ref) {
      ref = { count: 1 }
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
  descriptor.value = wrappedMethod.bind(target)
}

export function withTransaction<This extends { trx: Knex.Transaction }>(target: This, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value
  if (typeof method !== 'function' || typeof target !== 'object')
    throw new TypeError('Decorator should be used on methods')

  async function wrappedMethod(this: This, ...args: any[]) {
    let ref = trxRefMap.get(this)
    if (!ref) {
      ref = { count: 1, failed: false }
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
        if (!ref.failed) {
          await this.trx.commit()
        } else {
          await this.trx.rollback()
        }
      }
    }
  }
  descriptor.value = wrappedMethod.bind(target)
}
