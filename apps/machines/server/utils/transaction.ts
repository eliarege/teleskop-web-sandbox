import type { Knex } from 'knex'
import type { Connection as TediousConnection } from 'tedious'

/**
 * Executes a database transaction that can be aborted via an AbortSignal.
 *
 * TODO: Should move this to core utils
 *
 * @example
 *
 * ```ts
 * const controller = new AbortController()
 *
 * try {
 *   await transactionWithAbort(knex, controller.signal, async (trx, signal) => {
 *     // Your transactional operations here
 *     // Check signal.aborted if needed
 *   })
 * } catch (err) {
 *   if (controller.signal.aborted) {
 *     console.log('Transaction was aborted')
 *   } else {
 *     console.error('Transaction failed:', err)
 *   }
 * }
 * ```
 */
export async function transactionWithAbort(
  db: Knex,
  signal: AbortSignal,
  transactionScope: (trx: Knex.Transaction, signal: AbortSignal) => Promise<void>,
  transactionOptions?: {
    isolationLevel?: Knex.TransactionConfig['isolationLevel']
    readOnly?: boolean
  },
): Promise<void> {
  if (signal.aborted) {
    throw new Error('Operation aborted before starting transaction')
  }

  const connection = await db.client.acquireConnection() as TediousConnection
  let active = true

  if (signal.aborted) {
    active = false
    await db.client.releaseConnection(connection)
    throw new Error('Operation aborted before starting transaction')
  }

  const onAbort = () => {
    if (!active)
      return
    connection.cancel()
  }

  signal.addEventListener('abort', onAbort)

  try {
    return await db.transaction(async (trx) => {
      if (signal.aborted) {
        throw new Error('Operation aborted')
      }
      await transactionScope(trx, signal)
    }, { ...transactionOptions, connection })
  } finally {
    active = false
    signal.removeEventListener('abort', onAbort)
    await db.client.releaseConnection(connection)
  }
}
