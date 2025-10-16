import { createRouter, useBase } from 'h3'
import { filtersToKnex } from '@teleskop/utils'
import { knex } from '~/server/connectionPool'
import { PRIMARY_KEY_VIOLATION, isMssqlError } from '~/server/lib/error'

const router = createRouter()
export default useBase('/api/settings', router.handler)

/**
 * Dispenser settings
 */

router.get('/dispenser-type', defineAuthEventHandler(async () => {
  const types = await knex('DYTFDISPENSERTYPE')
    .select({
      type: 'DISPENSERTYPENO',
      name: 'NAME',
    })
  return types
}))

router.get('/check-is-dispenser-exist/:dispenserId', defineAuthEventHandler(async (event) => {
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const dispenserId = event.context.params.dispenserId
  const isThereDispenser = await knex('DYTFDISPENSERSETTINGS')
    .where('DISPENSERID', dispenserId)
  if (isThereDispenser.length > 0)
    return true
  else return false
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
  exportUnrelatedConsumptions: 'EXPORTIRRELEVANTCONSUMPTION',
  exportFileName: 'EXPORTFILENAME',
  connectionControlDate: 'CONNECTIONCONTROLDATE',
  connectionStatus: 'CONNECTIONSTATUS',
  vncPort: 'VNCPORT',
  vncPassword: 'VNCPASSWORD',
}

router.get('/dispenser', defineAuthEventHandler(async () => {
  const dispensers = await knex('DYTFDISPENSERSETTINGS')
    .select(dispenserParameters)
    .orderBy('DISPENSERID', 'asc')
  return dispensers
}))

router.get('/dispenser/:dispNo', defineAuthEventHandler(async (event) => {
  const { dispNo } = getRouterParams(event)
  return (await knex('DYTFDISPENSERSETTINGS')
    .select(dispenserParameters)
    .where('DISPENSERID', dispNo)).at(0)
}))

// router.get('/ping/:dispNo', defineAuthEventHandler(async (event) => {
//   const { dispNo } = getRouterParams(event)
//   const dispenser = await knex('DYTFDISPENSERSETTINGS')
//     .first({
//       dispNo: 'DISPENSERID',
//       fileSystem: 'BDYREQUESTPATH',
//       dispIP: 'IP',
//     })
//     .where('DISPENSERID', dispNo)
//   if (dispenser)
//     const { stdout } = await execa('ping', [host, '-c', '4']) // Ping command for UNIX-based systems
//   return dispenser
// }))

router.get('/dispenser-connection-status', defineAuthEventHandler(async (event) => {
  const dispensers = await knex('DYTFDISPENSERSETTINGS')
    .select({
      dispNo: 'DISPENSERID',
      fileSystem: 'BDYREQUESTPATH',
      dispIP: 'IP',
      name: 'NAME',
      connectionControlDate: 'CONNECTIONCONTROLDATE',
      connectionStatus: 'CONNECTIONSTATUS',
    })
  const now = new Date()
  return dispensers.map((disp) => {
    if ((now.getTime() - new Date(disp.connectionControlDate).getTime()) > 120000) {
      return {
        ...disp,
        connectionStatus: 3,
      }
    } else return disp
  })
  // const statusPromises = dispensers.map((dispenser) => {
  //   return execa('ping', ['-c', '1', '-W', '1', dispenser.dispIP])
  //     .then(() => ({
  //       ...dispenser,
  //       status: true,
  //     }))
  //     .catch(() => ({
  //       ...dispenser,
  //       status: false,
  //     }))
  // })
  // return await Promise.all(statusPromises)
}))

router.post('/filtered-dispenser', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  const dispensers = knex('DYTFDISPENSERSETTINGS')
    .select(dispenserParameters)
    .orderBy('DISPENSERID', 'asc')
  filtersToKnex(body, dispenserParameters, dispensers)
  return await dispensers
}))

router.post('/dispenser/:dispNo', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
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
        EXPORTIRRELEVANTCONSUMPTION: body?.exportUnrelatedConsumptions,
        EXPORTFILENAME: body?.exportFileName,
        VNCPORT: body?.vncPort,
        VNCPASSWORD: body?.vncPassword,
      })
    return dispenser
  },
}))

router.put('/dispenser/:dispNo', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const body = await readBody(event)
    if (!event.context.params) {
      throw new Error('URL parameters are undefined')
    }
    const { dispNo } = getRouterParams(event)
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
        EXPORTIRRELEVANTCONSUMPTION: body?.exportUnrelatedConsumptions,
        EXPORTFILENAME: body?.exportFileName,
        VNCPORT: body?.vncPort,
        VNCPASSWORD: body?.vncPassword,
      })
    return dispenser
  },
}))

router.delete('/dispenser/:dispNo', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
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
  },
}))

router.get('/check-is-machine-exist/:machineId', defineAuthEventHandler(async (event) => {
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const machineId = event.context.params.machineId
  const isThereMachine = await knex('DYTFMACHINES')
    .where('MACHINEID', machineId)
  if (isThereMachine.length > 0)
    return true
  else return false
}))

/**
 * Machine Dispenser Connections settings
 */

const machineParameters = {
  machineid: 'N.MACHINEID',
  dispNo: 'M.DISPENSERID',
  machinename: 'N.MACHINENAME',
  controlDevice: 'N.CONTROLLERTYPE',
}

router.post('/machine-dispenser-connection-filtered', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  let machines: any = knex('DYTFMACHINES as N')
    .select(machineParameters)
    .leftJoin('DYTFMACHDISPCONNECTION as M', 'N.MACHINEID', 'M.MACHINEID')
    .orderBy(['N.MACHINEID', 'M.DISPENSERID'])
  if (body?.length > 0) {
    filtersToKnex(body, machineParameters, machines)
  }
  machines = await machines
  const result: Array<{ machineid: number, disps: number[], machinename: string, controlDevice: number }> = []
  let lastID = 0
  machines.forEach((log) => {
    if (lastID === log.machineid)
      result[result.length - 1].disps.push(log.dispNo)
    else {
      result.push({
        machineid: log.machineid,
        disps: [log.dispNo],
        machinename: log.machinename,
        controlDevice: log.controlDevice,
      })
      lastID = log.machineid
    }
  })
  return result
}))

router.post('/machine-dispenser-connection/:machineid', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
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
    if (body.disps)
      body.disps.forEach(async (disp) => {
        await knex('DYTFMACHDISPCONNECTION').insert({
          DISPENSERID: disp,
          MACHINEID: machineid,
        })
      })
    return 1 // return 200
  },
}))

router.put('/machine-dispenser-connection/:machineid', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
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
          DISPENSERID: disp,
          MACHINEID: machineid,
        })
    // .update({
    // DISPENSERID: disp.dispNo,
    // MACHINEID: body.machineid,
    // })
    })
    return 1
  },
}))

router.post('/add-machine-dispenser-connection', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const body = await readBody(event)
    if (!body || !body.machineList || !body.dispenserList) {
      throw new Error('Machines and dispensers are required!')
    }
    const insertArray = []
    for (const machineid of body.machineList)
      for (const dispNo of body.dispenserList) {
        if (!(await knex('DYTFMACHDISPCONNECTION').where('DISPENSERID', dispNo).andWhere('MACHINEID', machineid)).length) {
          insertArray.push({
            DISPENSERID: dispNo,
            MACHINEID: machineid,
          })
        }
      }
    if (insertArray.length)
      await knex('DYTFMACHDISPCONNECTION')
        .insert(insertArray)
    return 1
  },
}))

router.post('/replace-machine-dispenser-connection', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const body = await readBody(event)
    if (!body || !body.machineList || !body.dispenserList) {
      throw new Error('Machines and dispensers are required!')
    }
    const insertArray = []
    for (const machineid of body.machineList) {
      await knex('DYTFMACHDISPCONNECTION').delete().where('MACHINEID', machineid)
      for (const dispNo of body.dispenserList) {
        insertArray.push({
          DISPENSERID: dispNo,
          MACHINEID: machineid,
        })
      }
    }
    if (insertArray.length)
      await knex('DYTFMACHDISPCONNECTION')
        .insert(insertArray)
    return 1
  },
}))

router.delete('/machine-dispenser-connection/:machineid', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
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
  },
}))

/**
 * Material settings
 */

router.get('/material', defineAuthEventHandler(async () => {
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

router.get('/check-is-material-exist/:materialCode', defineAuthEventHandler(async (event) => {
  if (!event.context.params) {
    throw new Error('URL parameters are undefined')
  }
  const materialCode = event.context.params.materialCode
  const isThereMaterial = await knex('DYTFMATERIAL')
    .where('MATERIALCODE', materialCode)
  if (isThereMaterial.length > 0)
    return true
  else return false
}))

const selectParametersMaterials = {
  materialCode: 'M.MATERIALCODE',
  materialName: 'M.MATERIALNAME',
  materialLabel: knex.raw('CONCAT(\'(\', M.MATERIALCODE, \') \', M.MATERIALNAME)'),
  materialGroup: 'M.MADDEGRUPNO',
  density: 'M.YOGUNLUK',
  ph: 'M.PH',
  source: 'M.SOURCE',
  cost: 'M.BIRIMMALIYET',
  rerequestable: 'M.ReRequestable',
  directTransfer: 'M.DirectTransfer',
  dispNo: 'C.DISPENSERID',
}

router.get('/materials-key-value', defineAuthEventHandler(async (event) => {
  return await knex('DYTFMATERIAL as M')
    .select({ materialCode: 'M.MATERIALCODE', materialLabel: knex.raw('CONCAT(\'(\', M.MATERIALCODE, \') \', M.MATERIALNAME)') })
    .orderBy('M.MATERIALCODE')
}))

router.post('/add-material-dispenser-connection', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const body = await readBody(event)
    if (!body || !body.materialList || !body.dispenserList) {
      throw new Error('Materials and dispensers are required!')
    }
    const insertArray = []
    for (const materialCode of body.materialList)
      for (const dispNo of body.dispenserList) {
        if (!(await knex('DYTFCHEMDISPCONNECTION').where('DISPENSERID', dispNo).andWhere('CHEMCODE', materialCode)).length) {
          insertArray.push({
            DISPENSERID: dispNo,
            CHEMCODE: materialCode,
          })
        }
      }
    if (insertArray.length)
      await knex('DYTFCHEMDISPCONNECTION')
        .insert(insertArray)
    return 1
  },
}))

router.post('/replace-material-dispenser-connection', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const body = await readBody(event)
    if (!body || !body.materialList || !body.dispenserList) {
      throw new Error('Materials and dispensers are required!')
    }
    const insertArray = []
    for (const materialCode of body.materialList) {
      await knex('DYTFCHEMDISPCONNECTION').delete().where('CHEMCODE', materialCode)
      for (const dispNo of body.dispenserList) {
        insertArray.push({
          DISPENSERID: dispNo,
          CHEMCODE: materialCode,
        })
      }
    }
    if (insertArray.length)
      await knex('DYTFCHEMDISPCONNECTION')
        .insert(insertArray)
    return 1
  },
}))

router.post('/material-dispenser-connection-filtered', defineAuthEventHandler(async (event) => {
  const body = await readBody(event)
  let materials: any = knex('DYTFMATERIAL as M')
    .select(selectParametersMaterials)
    .leftJoin('DYTFCHEMDISPCONNECTION as C', 'C.CHEMCODE', 'M.MATERIALCODE')
    .orderBy(['M.MATERIALCODE', 'C.DISPENSERID'])
  if (body?.length > 0) {
    filtersToKnex(body, selectParametersMaterials, materials)
  }
  materials = await materials

  const result: Array<any> = []
  let lastCode = 0
  materials.forEach((log) => {
    if (lastCode === log.materialCode)
      result[result.length - 1].disps.push(log.dispNo)
    else {
      log.disps = [log.dispNo]
      result.push(log)
      lastCode = log.materialCode
    }
  })
  return result
}))

interface MaterialRequestBody {
  materialCode: string
  materialName: string
  materialGroup: number
  density: number
  ph: number
  source: string
  cost: number
  rerequestable: boolean
  directTransfer: boolean
  connectedDisps: number[]
}

router.post('/material-connection', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const body = await readBody(event) as MaterialRequestBody
    const materialCode = body.materialCode

    try {
      await knex.transaction(async (trx) => {
        await trx('DYTFMATERIAL')
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

        for (const disp of body.connectedDisps) {
          await trx('DYTFCHEMDISPCONNECTION').insert({
            CHEMCODE: materialCode,
            DISPENSERID: disp,
          })
        }
      })
    } catch (error) {
      if (isMssqlError(error, PRIMARY_KEY_VIOLATION)) { // Violation of primary key (material code)
        return { code: 400, error: 'Material with given material code already exists' }
      } else {
        throw error
      }
    }

    return 1 // return 200
  },
}))

router.put('/material-connection/:materialCode', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const prevMaterialCode = event.context.params?.materialCode
    if (!prevMaterialCode) {
      throw new Error(`URL parameter "materialCode" is empty or undefined`)
    }
    const body = await readBody(event) as MaterialRequestBody
    const newMaterialCode = body.materialCode
    try {
      await knex.transaction(async (trx) => {
        await trx('DYTFCHEMDISPCONNECTION')
          .where('CHEMCODE', prevMaterialCode)
          .delete()

        await trx('DYTFMATERIAL')
          .where('MATERIALCODE', prevMaterialCode)
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

        for (const disp of body.connectedDisps) {
          await trx('DYTFCHEMDISPCONNECTION')
            .insert({
              CHEMCODE: newMaterialCode,
              DISPENSERID: disp,
            })
        }
      })
    } catch (error) {
      if (isMssqlError(error, PRIMARY_KEY_VIOLATION)) { // Violation of primary key (material code)
        return { code: 400, error: 'Material with given material code already exists' }
      } else {
        throw error
      }
    }

    return 1
  },
}))

router.delete('/material/:materialCode', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    if (!event.context.params) {
      throw new Error('URL parameters are undefined')
    }
    const materialCode = event.context.params.materialCode
    await knex('DYTFMATERIAL')
      .where('MATERIALCODE', materialCode)
      .delete()
    return 1
  },
}))

/**
 * Request Mechanism settings
 */

router.get('/request-mechanism-setting', defineAuthEventHandler(async () => {
  const sett = await knex('DYTFDYSETTINGS')
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
      showRecipeAmount: 'SHOWRECIPEAMOUNT',
    })
  return sett[0]
}))

router.put('/request-mechanism-setting', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
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
        SHOWRECIPEAMOUNT: body.showRecipeAmount,
      })

    // reqMechanismAnswerOptions: '',
    // saltText: '',
    // genericMaterialOneText: '',
    // genericMaterialTwoText: '',
    return 1
  },
}))

router.get('/delete-old-batch-time', defineAuthEventHandler(async (event) => {
  const days = await knex('DYTFDYSETTINGS')
    .first('DELETEOLDBATCHES')
  return days.DELETEOLDBATCHES
}))

router.put('/delete-old-batch-time', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const body = await readBody(event)
    await knex('DYTFDYSETTINGS')
      .update({
        DELETEOLDBATCHES: body.days,
      })
    return 1
  },
}))

router.get('/file-system', defineAuthEventHandler(async () => {
  const result = await knex('DYTFELIARSETTINGS')
    .select('BDYREQSEARCHPATH')
  return result[0].BDYREQSEARCHPATH
}))

router.put('/file-system', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const body = await readBody(event)
    await knex('DYTFELIARSETTINGS')
      .update({ BDYREQSEARCHPATH: body.path })
    return 1
  },
}))

router.get('/driver', defineAuthEventHandler(async () => {
  const result = await knex('DYTFCOMDRIVERS')
  return result
}))

router.post('/driver/:DRIVERID', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
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
  },
}))

router.put('/driver/:DRIVERID', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    const body = await readBody(event)
    if (!event.context.params) {
      throw new Error('URL parameters are undefined')
    }
    const DRIVERID = event.context.params.DRIVERID
    await knex('DYTFCOMDRIVERs')
      .update(body)
      .where('DRIVERID', DRIVERID)
    return 1
  },
}))

router.delete('/driver/:DRIVERID', defineAuthEventHandler({
  roles: ['manage'],
  async handler(event) {
    if (!event.context.params) {
      throw new Error('URL parameters are undefined')
    }
    const DRIVERID = event.context.params.DRIVERID
    await knex('DYTFCOMDRIVERs')
      .where('DRIVERID', DRIVERID)
      .delete()
    return 1
  },
}))
