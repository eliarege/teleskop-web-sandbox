import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'
import { filtersToKnex } from '~/shared/functions'

const router = createRouter()
export default useBase('/api/settings', router.handler)

/**
 * Dispenser settings
 */
router.get('/dispenser-type', defineEventHandler(async () => {
  const types = await knex('DYTFDISPENSERTYPE')
    .select({
      type: 'DISPENSERTYPENO',
      name: 'NAME',
    })
  return types
}))

router.get('/dispenser', defineEventHandler(async () => {
  const dispensers = await knex('DYTFDISPENSERSETTINGS')
    .select({
      dispNo: 'DISPENSERID',
      name: 'NAME',
      dispType: 'DISPENSERTYPENO',
      fileName: 'BDYREQUESTNAME',
      fileSystem: 'BDYREQUESTPATH',
      protocol: 'PROTOCOL',
      dispIP: 'IP',
      dispConsumptionFileName: 'CONSUMPTIONFILENAME',
      dms: 'READCONSUMPTIONFROMDMS',
    })
    .orderBy('DISPENSERID', 'asc')
  return dispensers
}))

const dispenserParameters = {
  dispNo: 'DISPENSERID',
  name: 'NAME',
  dispType: 'DISPENSERTYPENO',
  fileName: 'BDYREQUESTNAME',
  fileSystem: 'BDYREQUESTPATH',
  protocol: 'PROTOCOL',
  dispIP: 'IP',
  dispConsumptionFileName: 'CONSUMPTIONFILENAME',
  dms: 'READCONSUMPTIONFROMDMS',
}

router.post('/filtered-dispenser', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const dispensers = knex('DYTFDISPENSERSETTINGS')
    .select(dispenserParameters)
    .orderBy('DISPENSERID', 'asc')
  return await filtersToKnex(body, dispenserParameters, dispensers)
}))

router.post('/dispenser/:dispNo', defineEventHandler(async (event) => {
  try {
    let dispenser
    const body = await readBody(event)
    if (!event.context.params) {
      throw new Error('URL parameters are undefined')
    }
    const dispNo = event.context.params.dispNo
    dispenser = await knex('DYTFDISPENSERSETTINGS')
      .where('DISPENSERID', dispNo)
      .select('DISPENSERID')
    if (dispenser.length)
      return { code: 400, error: 'Dispenser with given dispenser ID is already exist.' }
    dispenser = await knex('DYTFDISPENSERSETTINGS')
      .where('DISPENSERID', dispNo)
      .insert({
        DISPENSERID: dispNo,
        NAME: body?.name,
        DISPENSERTYPENO: body?.dispType,
        BDYREQUESTNAME: body?.fileName,
        BDYREQUESTPATH: body?.fileSystem,
        PROTOCOL: body?.protocol,
        IP: body?.dispIP,
        CONSUMPTIONFILENAME: body?.dispConsumptionFileName,
        READCONSUMPTIONFROMDMS: body?.dms,
      })
    return dispenser
  } catch (e) {
    return e
  }
}))

router.put('/dispenser/:dispNo', defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    if (!event.context.params) {
      throw new Error('URL parameters are undefined')
    }
    const dispNo = event.context.params.dispNo

    const dispenser = await knex('DYTFDISPENSERSETTINGS')
      .where('DISPENSERID', dispNo)
      .update({
        NAME: body?.name,
        DISPENSERTYPENO: body?.dispType,
        BDYREQUESTNAME: body?.fileName,
        BDYREQUESTPATH: body?.fileSystem,
        PROTOCOL: body?.protocol,
        IP: body?.dispIP,
        CONSUMPTIONFILENAME: body?.dispConsumptionFileName,
        READCONSUMPTIONFROMDMS: body?.dms,
      })
    return dispenser
  } catch (e) {
    return e
  }
}))

router.delete('/dispenser/:dispNo', defineEventHandler(async (event) => {
  try {
    if (!event.context.params) {
      throw new Error('URL parameters are undefined')
    }
    const dispNo = event.context.params.dispNo
    const conenctedMachines = await knex('DYTFMACHDISPCONNECTION')
      .where('DISPENSERID', dispNo)
    const connectedMaterials = await knex('DYTFCHEMDISPCONNECTION')
      .where('DISPENSERID', dispNo)
    if (conenctedMachines.length || connectedMaterials.length) {
      return { isConnectedMaterialExist: !!connectedMaterials.length, isConnectedMachineExist: !!conenctedMachines.length }
    }
    await knex('DYTFDISPENSERSETTINGS')
      .where('DISPENSERID', dispNo)
      .del()
    return 1
  } catch (e) {
    return e
  }
}))

/**
 * Machine Dispenser Connections settings
 */

const machineParameters = {
  machineid: 'M.MACHINEID',
  dispNo: 'M.DISPENSERID',
  dispName: 'D.NAME',
  machinename: 'N.MACHINENAME',
  controlDevice: 'N.CONTROLLERTYPE',
}

router.post('/machine-dispenser-connection-filtered', defineEventHandler(async (event) => {
  const body = await readBody(event)
  let machines: any = knex('DYTFMACHDISPCONNECTION as M')
    .select(machineParameters)
    .leftJoin('DYTFDISPENSERSETTINGS as D', 'M.DISPENSERID', 'D.DISPENSERID')
    .leftJoin('DYTFMACHINES as N', 'N.MACHINEID', 'M.MACHINEID')
    .orderBy('M.MACHINEID', 'M.DISPENSERID')
  if (body?.length > 0) {
    machines = await filtersToKnex(body, machineParameters, machines)
  } else {
    machines = await machines
  }
  const result: Array<{ machineid: number, disps: Array<{ dispNo: number, name: string }>, machinename: string, controlDevice: number }> = []
  let lastID = 0
  machines.forEach((log) => {
    if (lastID === log.machineid)
      result[result.length - 1].disps.push({ dispNo: log.dispNo, name: log.dispName })
    else {
      result.push({
        machineid: log.machineid,
        disps: [{ dispNo: log.dispNo, name: log.dispName }],
        machinename: log.machinename,
        controlDevice: log.controlDevice,
      })
      lastID = log.machineid
    }
  })
  return result
}))

router.post('/machine-dispenser-connection/:machineid', defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const machineid = event.context.params.machineid
  const isThereMachine = await knex('DYTFMACHINES')
    .where('MACHINEID', machineid)
  if (isThereMachine.length > 0)
    return { code: 400, error: 'Machine with given machine ID is already exist.' }
  await knex('DYTFMACHINES')
    .insert({
      MACHINEID: machineid,
      MACHINENAME: body.machinename,
      CONTROLLERTYPE: body.controlDevice,
    })
  console.log(body.disps)
  if (body.disps)
    body.disps.forEach(async (disp) => {
      await knex('DYTFMACHDISPCONNECTION').insert({
        DISPENSERID: disp.dispNo,
        MACHINEID: machineid,
      })
    })
  return 1 // return 200
}))

router.put('/machine-dispenser-connection/:machineid', defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const machineid = event.context.params.machineid
  await knex('DYTFMACHINES')
    .where('MACHINEID', machineid)
    .update({
      MACHINEID: machineid,
      MACHINENAME: body.machinename,
      CONTROLLERTYPE: body.controlDevice,
    })
  await knex('DYTFMACHDISPCONNECTION')
    .where('MACHINEID', machineid)
    .delete()
  body.disps.forEach(async (disp) => {
    await knex('DYTFMACHDISPCONNECTION')
      .insert({
        DISPENSERID: disp.dispNo,
        MACHINEID: machineid,
      })
    // .update({
    // DISPENSERID: disp.dispNo,
    // MACHINEID: body.machineid,
    // })
  })
  return 1
}))

router.delete('/machine-dispenser-connection/:machineid', defineEventHandler(async (event) => {
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const machineid = event.context.params.machineid
  const query = await knex('DYTFMACHINES')
    .where('MACHINEID', machineid)
    .del()
  // let query = knex('DYTFMACHDISPCONNECTION')
  // body.disps.forEach((disp) => {
  //   query = query.orWhere({ MACHINEID: body.machineid, DISPENSERID: disp.dispNo })
  // })
  // await query.del()
  return 1
  /**
   * I delete the machine and the connection will became deleted
   * TODO: IMMEDIATELY: This part on frontend also creates machine learn the logic
   *  should it creates machine or just the connection? What do I delete what do I create?
   * I think it should not create machine
   */
}))

/**
 * Material settings
 */

router.get('/material', defineEventHandler(async () => {
  const dispensers = await knex('DYTFMATERIAL')
    .select({
      materialCode: 'MATERIALCODE',
      materialName: 'MATERIALNAME',
      materialLabel: knex.raw('CONCAT(\'(\', MATERIALCODE, \') \', MATERIALNAME)'),
      materialGroup: 'MADDEGRUPNO',
      density: 'YOGUNLUK',
      ph: 'PH',
      source: 'SOURCE',
      cost: 'BIRIMMALIYET',
      rerequestable: 'ReRequestable',
      directTransfer: 'DirectTransfer',
    })
    .orderBy('MATERIALCODE', 'asc')
  return dispensers
}))

const selectParametersMaterials = {
  materialCode: 'MATERIALCODE',
  materialName: 'MATERIALNAME',
  materialLabel: knex.raw('CONCAT(\'(\', MATERIALCODE, \') \', MATERIALNAME)'),
  materialGroup: 'MADDEGRUPNO',
  density: 'YOGUNLUK',
  ph: 'PH',
  source: 'SOURCE',
  cost: 'BIRIMMALIYET',
  rerequestable: 'ReRequestable',
  directTransfer: 'DirectTransfer',
}

router.post('/filtered-material', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const materials = knex('DYTFMATERIAL')
    .select(selectParametersMaterials)
    .orderBy('MATERIALCODE', 'asc')
  return await filtersToKnex(body, selectParametersMaterials, materials)
}))

router.get('/material-connection', defineEventHandler(async (event) => {
  const { chemCode } = getQuery(event)
  const materials = await knex('DYTFCHEMDISPCONNECTION as C')
    .select({
      materialCode: 'C.CHEMCODE',
      dispNo: 'C.DISPENSERID',
      name: 'D.NAME',
    })
    .where('C.CHEMCODE', chemCode)
    .leftJoin('DYTFDISPENSERSETTINGS as D', 'C.DISPENSERID', 'D.DISPENSERID')
    .orderBy('C.CHEMCODE', 'asc')
  return materials
}))

router.post('/material-connection/:materialCode', defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const materialCode = event.context.params.materialCode
  const isThereMaterial = await knex('DYTFMATERIAL')
    .where('MATERIALCODE', materialCode)
  if (isThereMaterial.length > 0)
    return { code: 400, error: 'Material with given material code is already exist.' }

  await knex('DYTFMATERIAL')
    .insert({
      MATERIALCODE: materialCode,
      MATERIALNAME: body.materialName,
      MADDEGRUPNO: body.materialGroup,
      YOGUNLUK: body.density,
      PH: body.ph,
      SOURCE: body.source,
      BIRIMMALIYET: body.cost,
      ReRequestable: body.rerequestable,
      DirectTransfer: body.directTransfer,
    })
  body.connectedDisps.forEach(async (disp) => {
    await knex('DYTFCHEMDISPCONNECTION').insert({
      CHEMCODE: materialCode,
      DISPENSERID: disp.dispNo,
    })
  })
  return 1 // return 200
}))

router.put('/material-connection/:materialCode', defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const materialCode = event.context.params.materialCode
  await knex('DYTFMATERIAL')
    .where('MATERIALCODE', materialCode)
    .update({
      MATERIALCODE: materialCode,
      MATERIALNAME: body.materialName,
      MADDEGRUPNO: body.materialGroup,
      YOGUNLUK: body.density,
      PH: body.ph,
      SOURCE: body.source,
      BIRIMMALIYET: body.cost,
      ReRequestable: body.rerequestable,
      DirectTransfer: body.directTransfer,
    })
  await knex('DYTFCHEMDISPCONNECTION')
    .where('CHEMCODE', materialCode)
    .delete()
  body.connectedDisps.forEach(async (disp) => {
    await knex('DYTFCHEMDISPCONNECTION')
      .insert({
        CHEMCODE: materialCode,
        DISPENSERID: disp.dispNo,
      })
  })
  return 1
}))

router.delete('/material/:materialCode', defineEventHandler(async (event) => {
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const materialCode = event.context.params.materialCode
  await knex('DYTFMATERIAL')
    .where('MATERIALCODE', materialCode)
    .delete()
  return 1
}))

/**
 * Request Mechanism settings
 */

router.get('/request-mechanism-setting', defineEventHandler(async () => {
  const sett = await knex('DYTFDYSETTINGS')
  // saltText: '',
  // reqMechanismAnswerOptions: '',
  // genericMaterialTwoText: '',
  // genericMaterialOneText: '',
    .select({
      reqMechanismOption1: 'DYREQMECHANISM',
      reqMechanismOption2: 'repeatRequestIfLastcompleted',
      reqMechanismOption3: 'repeatRequestIfNotCompleted',
      reqMechanismAnswer: 'canceledByRepeatAnswer',
      archiveKeepTime: 'ARCHIVEKEEPTIME',
      archiveDeletionTime: 'REQ_ARCH_KEEPTIME',
      joborderBasedActive: 'FreeDyeRequestActive',
      joborderBasedEqualMachinesRequired: 'ForceProgramsEqual',
      tozBoyaTartim: 'mmForWeigh',
      tozBoyaCozme: 'mmForSolvent',
      tozChemTartim: 'mmForDustChem',
      manuelMateryalTartim: 'mmForManMaterial',
      genericSaltActive: 'SaltRequestActive',
      saltCode: 'saltCode',
      genericMaterialOneActive: 'genericMaterialOneActive',
      genericMaterialOne: 'genericMaterialOne',
      genericMaterialTwoActive: 'genericMaterialTwoActive',
      genericMaterialTwo: 'genericMaterialTwo',
      chemTankLevelControl: 'ChemTankLevelControl',
      manuelOnlineRequestTankNoControl: 'DYMANUALTANKMECH',
      coupleMechanismSplit: 'DYCOUPLEMECHANISM',
      justRunOnPlannedMachine: 'DYMACHCONTROLMECH',
    })
  return sett[0]
}))

// DirectTransferActive
// DirectTransferAllMaterial
// OPTIMIZATIONUSED
// DYREQMECHANISM first on first
// repeatRequestIfLastcompleted //second on first
// no third on first

router.put('/request-mechanism-setting', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const settings = await knex('DYTFDYSETTINGS')
    .update({
      DYREQMECHANISM: body.reqMechanismOption1,
      repeatRequestIfLastcompleted: body.reqMechanismOption2,
      repeatRequestIfNotCompleted: body.reqMechanismOption3,
      canceledByRepeatAnswer: body.reqMechanismAnswer,
      ARCHIVEKEEPTIME: body.archiveKeepTime,
      REQ_ARCH_KEEPTIME: body.archiveDeletionTime,
      FreeDyeRequestActive: body.joborderBasedActive,
      ForceProgramsEqual: body.joborderBasedEqualMachinesRequired,
      mmForWeigh: body.tozBoyaTartim,
      mmForSolvent: body.tozBoyaCozme,
      mmForDustChem: body.tozChemTartim,
      mmForManMaterial: body.manuelMateryalTartim,
      SaltRequestActive: body.genericSaltActive,
      saltCode: body.genericSaltActive ? body.saltCode : '',
      genericMaterialOneActive: body.genericMaterialOneActive,
      genericMaterialOne: body.genericMaterialOneActive ? body.genericMaterialOne : '',
      genericMaterialTwoActive: body.genericMaterialTwoActive,
      genericMaterialTwo: body.genericMaterialTwoActive ? body.genericMaterialTwo : '',
      ChemTankLevelControl: body.chemTankLevelControl,
      DYMANUALTANKMECH: body.manuelOnlineRequestTankNoControl,
      DYCOUPLEMECHANISM: body.coupleMechanismSplit,
      DYMACHCONTROLMECH: body.justRunOnPlannedMachine,
    })

  // reqMechanismAnswerOptions: '',
  // saltText: '',
  // genericMaterialOneText: '',
  // genericMaterialTwoText: '',
  return 1
}))

router.get('/file-system', defineEventHandler(async () => {
  const result = await knex('DYTFELIARSETTINGS')
    .select('BDYREQSEARCHPATH')
  return result[0].BDYREQSEARCHPATH
}))

router.put('/file-system', defineEventHandler(async (event) => {
  const body = await readBody(event)
  await knex('DYTFELIARSETTINGS')
    .update({ BDYREQSEARCHPATH: body.path })
  return 1
}))

router.get('/driver', defineEventHandler(async () => {
  const result = await knex('DYTFCOMDRIVERS')
  return result
}))

router.post('/driver/:DRIVERID', defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const DRIVERID = event.context.params.DRIVERID
  const isThereDriver = await knex('DYTFCOMDRIVERs')
    .where('DRIVERID', DRIVERID)
  if (isThereDriver.length > 0)
    return { code: 400, error: 'Dispenser with given dispenser id is already exist.' }

  await knex('DYTFCOMDRIVERs')
    .insert(body)
  return 1
}))

router.put('/driver/:DRIVERID', defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const DRIVERID = event.context.params.DRIVERID
  await knex('DYTFCOMDRIVERs')
    .update(body)
    .where('DRIVERID', DRIVERID)
  return 1
}))

router.delete('/driver/:DRIVERID', defineEventHandler(async (event) => {
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const DRIVERID = event.context.params.DRIVERID
  await knex('DYTFCOMDRIVERs')
    .where('DRIVERID', DRIVERID)
    .delete()
  return 1
}))
