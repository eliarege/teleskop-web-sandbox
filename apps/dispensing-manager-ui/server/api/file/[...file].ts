/* eslint-disable ts/no-invalid-this */
import fs from 'node:fs'
import path from 'node:path'
import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/file', router.handler)

router.post('/read', defineEventHandler(async (event) => {
  let temp = ''
  const filePath = path.join('ozkantest', 'index.txt')
  fs.readFile('ozkantest/index.req', 'utf8', (err, data) => {
    if (err)
      return err
    temp = data
  })
  return temp
}))

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

  const query = await knex('DYTFCHEMREQUESTS')
    .where('BATCHNO', body.row.joborder)
    .andWhere('PROGRAMNO', body.row.programNo)
    .andWhere('PROGRAMSTEPNO', body.row.mainStep)
    .select('STATUS')

  if (query[0].STATUS === 8 || query[0].STATUS === 3) {
    if (query[0].STATUS === 3 && !check) {
      return 'Non-rerequestable material cannot be rerequested.'
    } else {
      const contentString = `${body.content.join(',')},\n`

      fs.appendFile(body.path, contentString, 'utf8', (err) => {
        if (err) {
          return { error: 'Error appending to file' }
        }
        return { message: 'Data appended successfully' }
      })
    }
  } else return `Status code ${query[0].STATUS} cannot be rerequested.`
}))

router.post('/write-dispenser-step', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const contentString = `${body.content.join(',')},\n`

  return new Promise((resolve, reject) => {
    fs.appendFile(body.path, contentString, 'utf8', async (err) => {
      if (err) {
        reject(new Error('Error appending to file'))
      } else {
        try {
          await knex('DYTFCHEMREQUESTS')
            .where('REQNUMBER', body.reqNumber)
            .update({ STATUS: 8 })
          await knex('DYTFREQMATERIALS')
            .where('REQNUMBER', body.reqNumber)
            .update({ STATUS: 8 })
          resolve({ message: 'Data appended and status are set to 8', code: 200 })
        } catch (fetchError) {
          reject(new Error('Error during setting to 8'))
        }
      }
    })
  })
}))
