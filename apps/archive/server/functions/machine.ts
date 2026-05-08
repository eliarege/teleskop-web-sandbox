import { db } from "../database";

export async function getMachineModelByBatchKey(batchKey: number, trx = db): Promise<string> {
  const result = await trx
    .from('BADATA as b')
    .join('BFMACHINES as m', 'b.MACHINEID', 'm.MACHINEID')
    .where('b.BATCHKEY', batchKey)
    .select({ tbbModel: 'm.TBBMODEL' })
    .first()

  if (!result) {
    throw new Error(`Machine model not found for batch key: ${batchKey}`)
  }

  return result.tbbModel
}