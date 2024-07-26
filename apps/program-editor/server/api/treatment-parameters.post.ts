import { dmExchange as knex } from '../database'
import type { TreatmentParams } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  console.log(body)
  if (body.optimized) {
    console.log('ADD TREATMENT PARAM')
  } else {
    console.log('REMOVE TREATMENT PARAM')
  }
  /*
  TreatmentNo => programNo
  TreatmentParaCounter => aynı commandNo ve parameterIndexin kaçıncı treatmentParametresi olduğu
  TreatmentParaNo => Programın tüm parametreler içinde kaçıncısının optimize edileceği ?
  */

  //  await knex({ t: 'Treatment_Parameter_Ref' })
  // .insert({
  //   TreatmentNo: 0,
  //   TreatmentParaCounter: 0,
  //   TreatmentParaNo: 0,
  //   ImportState: 1,
  // })
})
