import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'

const router = createRouter()
export default useBase('/api/setting', router.handler)


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
    })
    .orderBy('DISPENSERID', 'asc')
  return dispensers
}))

router.post('/create-dispenser', defineEventHandler(async (event) => {
  try {
    let dispenser
    const body = await readBody(event)
    if (!body.dispNo) {
      return 'DispenserID is required'
    }
    dispenser = await knex('DYTFDISPENSERSETTINGS')
      .where('DISPENSERID', body.dispNo)
      .select('DISPENSERID')
    console.log(dispenser)
    if (dispenser.length)
      return 'Error Message there already are dispenser with given id'
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
      })
    return dispenser
  } catch (e) {
    return e
  }
}))

router.put('/update-dispenser', defineEventHandler(async (event) => {
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
      })
    return dispenser
  } catch (e) {
    return e
  }
}))

/**
 * Machine Dispenser Connections settings
 */

router.get('/machine-dispenser-connection', defineEventHandler(async () => {
  const dispensers = await knex('DYTFMACHDISPCONNECTION as M')
    .select({
      machineid: 'M.MACHINEID',
      dispNo: 'M.DISPENSERID',
      dispName: 'D.NAME',
      machinename: 'N.MACHINENAME',
      controlDevice: 'N.CONTROLLERTYPE',
    })
    .leftJoin('DYTFDISPENSERSETTINGS as D', 'M.DISPENSERID', 'D.DISPENSERID')
    .leftJoin('DYTFMACHINES as N', 'N.MACHINEID', 'M.MACHINEID')
    .orderBy('M.MACHINEID', 'M.DISPENSERID')

  const result: Array<{ machineid: number; disps: Array<{ dispNo: number; name: string }>; machinename: string; controlDevice: number }> = []
  let lastID = 0
  dispensers.forEach((log) => {
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

router.post('/create-machine-dispenser-connection', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const isThereMachine = await knex('DYTFMACHINES')
    .where('MACHINEID', body.machineid)
  if (isThereMachine.length > 0)
    return 'A machine already exists with given ID'
  await knex('DYTFMACHINES')
    .insert({
      MACHINEID: body.machineid,
      MACHINENAME: body.machinename,
      CONTROLLERTYPE: body.controlDevice,
    })
  console.log(body.disps)
  body.disps.forEach(async (disp) => {
    await knex('DYTFMACHDISPCONNECTION').insert({
      DISPENSERID: disp.dispNo,
      MACHINEID: body.machineid,
    })
  })
  return 1 // return 200
}))

router.put('/update-machine-dispenser-connection', defineEventHandler(async (event) => {
  const body = await readBody(event)
  console.log(1)
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


/**
 * Material settings
 */

router.get('/material', defineEventHandler(async () => {
  const dispensers = await knex('DYTFMATERIAL')
    .select({
      materialCode: 'MATERIALCODE',
      materialName: 'MATERIALNAME',
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

router.get('/material-connections', defineEventHandler(async (event) => {
  const { chemCode } = getQuery(event)
  const materials = await knex('DYTFCHEMDISPCONNECTION as C')
    .select({
      materialCode: 'C.CHEMCODE',
      dispNo: 'C.DISPENSERID',
      name: 'D.NAME'
    })
    .where('C.CHEMCODE', chemCode)
    .leftJoin('DYTFDISPENSERSETTINGS as D', 'C.DISPENSERID', 'D.DISPENSERID')
    .orderBy('C.CHEMCODE', 'asc')
  return materials
}))

router.post('/create-material-connection', defineEventHandler(async (event) => {
  const body = await readBody(event)
  const isThereMaterial = await knex('DYTFMATERIAL')
    .where('MATERIALCODE', body.materialCode)
  if (isThereMaterial.length > 0)
    return 'A material already exists with given material code'
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


router.put('/update-material-connection', defineEventHandler(async (event) => {
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


/**
 * Request Mechanism settings
 */

router.get('/request-mechanism-settings', defineEventHandler(async () => {
  const dispensers = await knex('DYTFDYSETTINGS')
  return dispensers
}))
