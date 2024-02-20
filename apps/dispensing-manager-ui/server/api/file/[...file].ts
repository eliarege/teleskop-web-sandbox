import fs from 'node:fs/promises'
import path from 'node:path'
import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'
import { sambaClient } from '~/server/sambaClient'

const router = createRouter()
export default useBase('/api/file', router.handler)
const config = useRuntimeConfig()

router.post('/write-recipe-step', defineEventHandler(async (event) => {
  // const writePath = path.join(config.writeFilePath, Date.now().toString())
  const body = await readBody(event)
  const arr = await knex('DYTFMATERIAL')
    .whereIn('MATERIALCODE', body.materialCodes)
    .select('MATERIALCODE', 'ReRequestable')
  let check = true
  arr.forEach((a) => {
    if (!a.ReRequestable)
      check = false
  })

  if (body.checkMachineDispenser) {
    const dispensers = await knex('DYTFMACHDISPCONNECTION as M')
      .where('M.MACHINEID', body.machineid)
      .andWhere('D.DISPENSERTYPENO', body.dispenserType)
      .leftJoin('DYTFDISPENSERSETTINGS as D', 'M.DISPENSERID', 'D.DISPENSERID')
    if (!dispensers.length)
      return 'Machine is not connected to related dispenser.'
  }

  if (body.checkMaterialDispenser) {
    const materialConnections = await knex('DYTFCHEMDISPCONNECTION as C')
      .select('D.DISPENSERTYPENO', 'C.CHEMCODE')
      .whereIn('C.CHEMCODE', body.materialCodes)
      .where('D.DISPENSERTYPENO', body.dispenserType)
      .leftJoin('DYTFDISPENSERSETTINGS as D', 'D.DISPENSERID', 'C.DISPENSERID')
      .leftJoin('DYTFDISPENSERTYPE as T', 'T.DISPENSERTYPENO', 'D.DISPENSERTYPENO')
    if (materialConnections.length !== body.materialCodes.length)
      return 'All the materials on the probram have to be connected to related dispenser.'
  }

  const query = await knex('DYTFCHEMREQUESTS')
    .where('BATCHNO', body.row.joborder)
    .andWhere('PROGRAMNO', body.row.programNo)
    .andWhere('PROGRAMSTEPNO', body.row.mainStep)
    .select('STATUS')

  if (query[0]?.STATUS === 8 || query[0]?.STATUS === 3) {
    if (query[0]?.STATUS === 3 && !check) {
      return 'Non-rerequestable material cannot be rerequested.'
    } else {
      const contentString = `${body.content.join(',')},\n`
      await sambaClient.getFile(config.reqFilePath, config.writeFilePath)
      await fs.appendFile(config.writeFilePath, contentString, 'utf8')
      await sambaClient.sendFile(config.writeFilePath, config.reqFilePath)
    }
  } else return `Status code ${query[0]?.STATUS} cannot be rerequested.`
}))

router.post('/write-dispenser-step', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const contentString = `${body.content.join(',')},\n`

  await sambaClient.getFile(config.reqFilePath, config.writeFilePath)
  await fs.appendFile(config.writeFilePath, contentString, 'utf8')
  await sambaClient.sendFile(config.writeFilePath, config.reqFilePath)
}))
