import fs from 'node:fs'
import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/file', router.handler)
const config = useRuntimeConfig()

router.post('/write-recipe-step', defineEventHandler(async (event) => {
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

      fs.appendFile(config.reqFilePath, contentString, 'utf8', (err) => {
        if (err) {
          return { error: 'Error appending to file' }
        }
        return { message: 'Data appended successfully' }
      })
    }
  } else return `Status code ${query[0]?.STATUS} cannot be rerequested.`
}))

router.post('/write-dispenser-step', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const contentString = `${body.content.join(',')},\n`

  return new Promise((resolve, reject) => {
    fs.appendFile(config.reqFilePath, contentString, 'utf8', async (err) => {
      if (err) {
        reject(new Error('Error appending to file (main page request).'))
      } else {
        return { message: 'Data appended successfully' }

        // try {
        //   await knex('DYTFCHEMREQUESTS')
        //     .where('REQNUMBER', body.reqNumber)
        //     .update({ STATUS: 8 })
        //   await knex('DYTFREQMATERIALS')
        //     .where('REQNUMBER', body.reqNumber)
        //     .update({ STATUS: 8 })
        //   resolve({ message: 'Data appended and status are set to 8', code: 200 })
        // } catch (fetchError) {
        //   reject(new Error('Error during setting to 8'))
        // }
      }
    })
  })
}))
