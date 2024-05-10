import fs from 'node:fs/promises'
import path from 'node:path'
import { createRouter, defineEventHandler, useBase } from 'h3'
import { Mutex, MutexInterface, Semaphore, SemaphoreInterface, withTimeout } from 'async-mutex'
import { knex } from '~/server/connectionPool'

import { sambaClient } from '~/server/sambaClient'
import { StatusCodes } from '~/shared/constants'

const router = createRouter()
export default useBase('/api/file', router.handler)
const config = useRuntimeConfig()
const mutex = new Mutex()

router.post('/write-recipe-step', defineEventHandler(async (event) => {
  // const writePath = path.join(config.writeFilePath, Date.now().toString())
  const body = await readBody(event)
  const materialCodes = body.materials.map(material => material.materialCode)
  const arr = await knex('DYTFMATERIAL')
    .whereIn('MATERIALCODE', materialCodes)
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
      return { error: 1, message: 'Machine is not connected to related dispenser.' }
  }

  if (body.checkMaterialDispenser) {
    const materialConnections = await knex('DYTFCHEMDISPCONNECTION as C')
      .select('D.DISPENSERTYPENO', 'C.CHEMCODE')
      .whereIn('C.CHEMCODE', materialCodes)
      .where('D.DISPENSERTYPENO', body.dispenserType)
      .leftJoin('DYTFDISPENSERSETTINGS as D', 'D.DISPENSERID', 'C.DISPENSERID')
      .leftJoin('DYTFDISPENSERTYPE as T', 'T.DISPENSERTYPENO', 'D.DISPENSERTYPENO')
    if (materialConnections.length !== materialCodes.length)
      return { error: 2, message: 'All the materials on the probram have to be connected to related dispenser.' }
  }

  const query = await knex('DYTFCHEMREQUESTS')
    .where('BATCHNO', body.row.joborder)
    .andWhere('PROGRAMNO', body.row.programNo)
    .andWhere('PROGRAMSTEPNO', body.row.mainStep)
    .andWhere('RECIPETYPE', body.row.recipeType)

  const status = query[0]?.STATUS

  if (status === StatusCodes.canceled || status === StatusCodes.requestCompleted) {
    if (status === StatusCodes.requestCompleted && !check) {
      return { error: 3, message: 'Non-rerequestable material cannot be rerequested.' }
    } else {
      const contentString = `${body.content.join(',')},\n`
      await mutex.runExclusive(async () => {
        const doesTheFileExist = await doesTheFileExistOnSamba(config.reqFilePath, config.writeFilePath)
        if (doesTheFileExist) {
          await fs.appendFile(config.writeFilePath, contentString, 'utf8')
        } else {
          await fs.writeFile(config.writeFilePath, contentString, 'utf8')
        }
        body.materials.forEach(async (material) => {
          await fs.appendFile(config.writeFilePath, `${[material.materialCode, material.amount].join(',')},\n`, 'utf8')
        })
        await sambaClient.sendFile(config.writeFilePath, config.reqFilePath)
      })
      return 1
    }
  } else if (status !== undefined)
    return { error: 4, message: `Status code ${status} cannot be rerequested.`, status }
  else return { error: 5, message: 'Recipe step cannot be found on DYTFCHEMREQUESTS' }
}))

router.post('/write-dispenser-step', defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const contentString = `${body.content.join(',')},\n`
    await mutex.runExclusive(async () => {
      const doesTheFileExist = await doesTheFileExistOnSamba(config.reqFilePath, config.writeFilePath)
      if (doesTheFileExist) {
        await fs.appendFile(config.writeFilePath, contentString, 'utf8')
      } else {
        await fs.writeFile(config.writeFilePath, contentString, 'utf8')
      }
      await sambaClient.sendFile(config.writeFilePath, config.reqFilePath)
    })
    return { code: 200 }
  } catch (e) {
    return e
  }
}))

async function doesTheFileExistOnSamba(reqFilePath: string, writeFilePath: string) {
  try {
    await sambaClient.getFile(reqFilePath, writeFilePath)
    return true
  } catch (e) {
    return false
  }
}
