import { dmsDB, getTeleskopDB } from '~/server/connectionPool'

const programHeaderParams = {
  machine_id: 'MACHINEID',
  program_no: 'PROGNO',
  program_name: 'NAME',
  chem_requests: 'TotalChemReq',
  dye_requests: 'TotalDyeReq',
  salt_requests: 'TOTALSALTREQ',
}

const programStepParams = {
  machine_id: 'MACHINEID',
  program_no: 'PROGNO',
  main_step: 'MAINSTEP',
  parallel_step: 'PARALELSTEP',
  command_no: 'COMMANDNO',
}

const optimizationParameterParams = {
  param_id: 'ID',
  param_name: 'TREATMENTPARAMETER',
  min_value: 'MINVALUE',
  max_value: 'MAXVALUE',
  unit: 'UNIT',
}

const optimizedParamMapParams = {
  param_id: 'PARAMID',
  group_id: 'GROUPID',
  command_no: 'COMMANDNO',
  parameter_index: 'PARAMETERINDEX',
}

const optimizedStepParameterParams = {
  program_no: 'PROGNO',
  machine_id: 'MACHINEID',
  main_step: 'MAINSTEP',
  parallel_step: 'PARALELSTEP',
  param_index: 'PARAMETERINDEX',
  optimized: 'OPTIMIZED',
  optimized_value: 'OPTIMIZEDVALUE',
}
const unOptimizedStepParameterParams = {
  program_no: 'PROGNO',
  machine_id: 'MACHINEID',
  main_step: 'MAINSTEP',
  parallel_step: 'PARALELSTEP',
  param_index: 'PARAMETERINDEX',
  optimized: 'OPTIMIZED',
  value: 'VALUE',
}
export default defineEventHandler(async () => {
  try {
    const teleskopDB = await getTeleskopDB()

    const programHeaders = await teleskopDB('dbo.BFMASTERPRGHEADER')
      .select(programHeaderParams)
      /*
    const programSteps = await teleskopDB('dbo.BFMASTERSTEPS')
      .select(programStepParams)
    const optimizationParameters = await teleskopDB('dbo.BFTREATMENTPARAMETERS')
      .select(optimizationParameterParams)
    const optimizedParamMaps = await teleskopDB('dbo.BFTREATMENTPARAMGROUPMAP')
      .select(optimizedParamMapParams)
    const optimizedStepParameters = await teleskopDB('dbo.BFMASTERSTEPPARAMS')
      .select(optimizedStepParameterParams).where('OPTIMIZED','=',1)
    const unOptimizedStepParameters = await teleskopDB('dbo.BFMASTERSTEPPARAMS')
      .select(unOptimizedStepParameterParams).where('OPTIMIZED','=',0)
      */
    const batchSize = 3000
    await batchInsert(dmsDB, programHeaders, batchSize, 'PROGRAM_HEADER', ['machine_id', 'program_no'])
    /*
    await batchInsert(dmsDB, programSteps, batchSize, 'PROGRAM_STEP', ['machine_id', 'program_no', 'main_step', 'parallel_step'])
    await batchInsert(dmsDB, optimizationParameters, batchSize, 'OPTIMIZATION_PARAMETER', ['param_id'])
    await batchInsert(dmsDB, optimizedParamMaps, batchSize, 'OPTIMIZATION_PARAMETER_MAP', ['param_id', 'group_id'])
    await batchInsert(dmsDB, optimizedStepParameters, batchSize, 'STEP_PARAMETER', ['machine_id', 'program_no', 'main_step', 'parallel_step', 'param_index'])
    await batchInsert(dmsDB, unOptimizedStepParameters, batchSize, 'STEP_PARAMETER', ['machine_id', 'program_no', 'main_step', 'parallel_step', 'param_index'])
    */
  } catch (e) {
    console.error(e)
    return e
  }
})
