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

router.post('/filtered-dispensers', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const dispensers = knex('DYTFDISPENSERSETTINGS')
    .select(dispenserParameters)
    .orderBy('DISPENSERID', 'asc')
  return await filtersToKnex(body, dispenserParameters, dispensers)
}))

router.post('/dispenser', defineEventHandler(async (event) => {
  try {
    let dispenser
    const body = await readBody(event)
    if (!body.dispNo) {
      return 'DispenserID is required'
    }
    dispenser = await knex('DYTFDISPENSERSETTINGS')
      .where('DISPENSERID', body.dispNo)
      .select('DISPENSERID')
    if (dispenser.length)
      return 0
    dispenser = await knex('DYTFDISPENSERSETTINGS')
      .where('DISPENSERID', body.dispNo)
      .insert({
        DISPENSERID: body.dispNo,
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

router.put('/dispenser', defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const dispenser = await knex('DYTFDISPENSERSETTINGS')
      .where('DISPENSERID', body.dispNo)
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

router.delete('/dispenser', defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    await knex('DYTFDISPENSERSETTINGS')
      .where('DISPENSERID', body.dispNo)
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

router.post('/machine-dispenser-connection', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const isThereMachine = await knex('DYTFMACHINES')
    .where('MACHINEID', body.machineid)
  if (isThereMachine.length > 0)
    return 0
  await knex('DYTFMACHINES')
    .insert({
      MACHINEID: body.machineid,
      MACHINENAME: body.machinename,
      CONTROLLERTYPE: body.controlDevice,
    })
  body.disps.forEach(async (disp) => {
    await knex('DYTFMACHDISPCONNECTION').insert({
      DISPENSERID: disp.dispNo,
      MACHINEID: body.machineid,
    })
  })
  return 1 // return 200
}))

router.put('/machine-dispenser-connection', defineEventHandler(async (event) => {
  const body = await readBody(event)
  await knex('DYTFMACHINES')
    .where('MACHINEID', body.machineid)
    .update({
      MACHINEID: body.machineid,
      MACHINENAME: body.machinename,
      CONTROLLERTYPE: body.controlDevice,
    })
  await knex('DYTFMACHDISPCONNECTION')
    .where('MACHINEID', body.machineid)
    .delete()
  body.disps.forEach(async (disp) => {
    await knex('DYTFMACHDISPCONNECTION')
      .insert({
        DISPENSERID: disp.dispNo,
        MACHINEID: body.machineid,
      })
    // .update({
    // DISPENSERID: disp.dispNo,
    // MACHINEID: body.machineid,
    // })
  })
  return 1
}))

router.delete('/machine-dispenser-connection', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = await knex('DYTFMACHINES')
    .where('MACHINEID', body.machineid)
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

router.post('/filtered-materials', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const materials = knex('DYTFMATERIAL')
    .select(selectParametersMaterials)
    .orderBy('MATERIALCODE', 'asc')
  return await filtersToKnex(body, selectParametersMaterials, materials)
}))

router.get('/material-connections', defineEventHandler(async (event) => {
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

router.post('/material-connection', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const isThereMaterial = await knex('DYTFMATERIAL')
    .where('MATERIALCODE', body.materialCode)
  if (isThereMaterial.length > 0)
    return 0
  await knex('DYTFMATERIAL')
    .insert({
      MATERIALCODE: body.materialCode,
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
      CHEMCODE: body.materialCode,
      DISPENSERID: disp.dispNo,
    })
  })
  return 1 // return 200
}))

router.put('/material-connection', defineEventHandler(async (event) => {
  const body = await readBody(event)
  await knex('DYTFMATERIAL')
    .where('MATERIALCODE', body.materialCode)
    .update({
      MATERIALCODE: body.materialCode,
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
    .where('CHEMCODE', body.materialCode)
    .delete()
  body.connectedDisps.forEach(async (disp) => {
    await knex('DYTFCHEMDISPCONNECTION')
      .insert({
        CHEMCODE: body.materialCode,
        DISPENSERID: disp.dispNo,
      })
  })
  return 1
}))

router.delete('/material', defineEventHandler(async (event) => {
  const body = await readBody(event)
  await knex('DYTFMATERIAL')
    .where('MATERIALCODE', body.materialCode)
    .delete()
  return 1
}))

/**
 * Request Mechanism settings
 */

router.get('/request-mechanism-settings', defineEventHandler(async () => {
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

router.put('/request-mechanism-settings', defineEventHandler(async (event) => {
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

router.get('/drivers', defineEventHandler(async () => {
  const result = await knex('DYTFCOMDRIVERS')
  return result
}))

router.post('/driver', defineEventHandler(async (event) => {
  const body = await readBody(event)
  await knex('DYTFCOMDRIVERs')
    .insert(body)
  return 1
}))

router.put('/driver', defineEventHandler(async (event) => {
  const body = await readBody(event)
  await knex('DYTFCOMDRIVERs')
    .update(body)
    .where('DRIVERID', body.DRIVERID)
  return 1
}))

router.delete('/driver', defineEventHandler(async (event) => {
  const body = await readBody(event)
  await knex('DYTFCOMDRIVERs')
    .where('DRIVERID', body.DRIVERID)
    .delete()
  return 1
}))
