import { createRouter, defineEventHandler, useBase } from 'h3'
import { knex } from '~/server/connectionPool'
import type { User } from '~/types'

const router = createRouter()
export default useBase('/api/machine', router.handler)

router.get('/machines', defineEventHandler(async () => {
  try {
    const machines = await knex('BFMACHINES')
      .select({
        id: 'MACHINEID',
        code: 'MACHINECODE',
        tbbModel: 'TBBMODEL',
        version: 'VERSION',
        machineCapacity: 'MACHINECAPACITY',
        ip: 'IP',
        inUse: 'INUSE',
        plcModel: 'PlcModel',
        nozzleCount: 'NOZZLECOUNT',
        groupName: 'GROUPNAME',
      },
      )
      .leftJoin('BFMACHGROUP', 'BFMACHINES.GRUPNO', 'BFMACHGROUP.GROUPID')
      .where('GRUPNO', '!=', -1)
      .orderBy('MACHINEID')
    return machines
  } catch (e) {
    return e
  }
}))

router.get('/machine-group', defineEventHandler(async () => {
  try {
    const machineGroups = await knex('BFMACHGROUP').select({
      groupName: 'GROUPNAME',
      groupId: 'GROUPID',
    })
    return machineGroups
  } catch (e) {
    return e
  }
}))

router.post('/machine-add', defineEventHandler(async (event) => {
  try {
    const machine = await readBody(event)
    const res = await knex('BFMACHINES').insert({
      MACHINEID: machine.id,
      MACHINECODE: machine.code,
      GRUPNO: machine.group.groupId,
      TBBMODEL: machine.tbbModel,
      THEORICALCHARGE: machine.theoricalCharge,
      MACHINECAPACITY: machine.machineCapacity,
      IP: machine.ip,
      PORT: -1,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
}))

router.put('/machine-edit', defineEventHandler(async (event) => {
  try {
    const machine = await readBody(event)
    const res = await knex('BFMACHINES').where({
      MACHINEID: machine.id,
    }).update({
      MACHINECODE: machine.code,
      GRUPNO: machine.group.groupId,
      TBBMODEL: machine.tbbModel,
      THEORICALCHARGE: machine.theoricalCharge,
      MACHINECAPACITY: machine.machineCapacity,
      IP: machine.ip,
      PORT: -1,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
}))

router.delete('/machine-delete', defineEventHandler(async (event) => {
  try {
    const { machineIds } = await readBody(event)
    const res = await knex('BFMACHINES').whereIn('MACHINEID', machineIds).del()
    return res
  } catch (e) {
    return e
  }
}))

router.get('/manual-reasons', defineEventHandler(async () => {
  try {
    const manualReasons = await knex('BFMANUALREASONSGENERAL')
      .select({
        manualId: 'manualID',
        manualReason: 'manualString',
        reportToERP: 'ReportToERP',
      },
      )
    return manualReasons
  } catch (e) {
    return e
  }
}))

router.post('/add-manual-reason', defineEventHandler(async (event) => {
  try {
    const { manualId, newManualReason, reportToERP } = await readBody(event)

    const res = await knex('BFMANUALREASONSGENERAL')
      .insert({
        manualID: manualId,
        manualString: newManualReason,
        ReportToERP: reportToERP,
      })

    return res
  } catch (e) {
    return e
  }
}))

router.put('/edit-manual-reason', defineEventHandler(async (event) => {
  try {
    const { oldManualReason, newManualReason, reportToERP } = await readBody(event)

    const res = await knex('BFMANUALREASONSGENERAL').where('manualString', oldManualReason)
      .update({
        manualString: newManualReason,
        ReportToERP: reportToERP,
      })

    return res
  } catch (e) {
    return e
  }
}))

router.delete('/delete-manual-reasons', defineEventHandler(async (event) => {
  try {
    const { manualIds } = await readBody(event)
    const res = await knex('BFMANUALREASONSGENERAL').whereIn('manualID', manualIds).del()
    return res
  } catch (e) {
    return e
  }
}))

router.get('/user-definitions', defineEventHandler(async () => {
  try {
    const machines = await knex('BFUSERS')
      .select({
        userId: 'userID',
        userName: 'userName',
        userSurname: 'userSurname',
        userPass: 'userPass',
        userInfo: 'userInfo',
        userActive: 'userActive',
        userType: 'userType',
      },
      )
      .orderBy('userID')
    return machines
  } catch (e) {
    return e
  }
}))

router.post('/user-add', defineEventHandler(async (event) => {
  try {
    const user: User = await readBody(event)
    const res = await knex('BFUSERS').insert({
      userID: user.userId,
      userName: user.userName,
      userSurname: user.userSurname,
      userPass: user.userPass,
      userInfo: user.userInfo,
      userActive: user.userActive,
      userType: user.userType,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
}))

router.put('/user-edit', defineEventHandler(async (event) => {
  try {
    const user: User = await readBody(event)
    console.log('user = ', user)
    const res = await knex('BFUSERS').where({
      userID: user.userId,
    }).update({
      userName: user.userName,
      userSurname: user.userSurname,
      userPass: user.userPass,
      userInfo: user.userInfo,
      userActive: user.userActive,
      userType: user.userType,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
}))

router.delete('/user-delete', defineEventHandler(async (event) => {
  try {
    const { userIds } = await readBody(event)
    const res = await knex('BFUSERS').whereIn('userID', userIds).del()
    return res
  } catch (e) {
    return e
  }
}))

router.get('/stop-reasons', defineEventHandler(async () => {
  try {
    return await knex('BFSTOPREASONS').select({
      stopCode: 'STOPCODE',
      stopName: 'STOPNAME',
      reportToERP: 'ReportToERP',
    })
  } catch (e) {
    return e
  }
}))

router.post('/add-stop-reason', defineEventHandler(async (event) => {
  try {
    const { stopCode, newStopName, reportToERP } = await readBody(event)

    const res = await knex('BFSTOPREASONS')
      .insert({
        STOPCODE: stopCode,
        STOPNAME: newStopName,
        ReportToERP: reportToERP,
      })

    return res
  } catch (e) {
    return e
  }
}))

router.put('/edit-stop-reason', defineEventHandler(async (event) => {
  try {
    const { oldStopName, newStopName, reportToERP } = await readBody(event)

    const res = await knex('BFSTOPREASONS').where('STOPNAME', oldStopName)
      .update({
        STOPNAME: newStopName,
        ReportToERP: reportToERP,
      })

    return res
  } catch (e) {
    return e
  }
}))

router.delete('/delete-stop-reasons', defineEventHandler(async (event) => {
  try {
    const { stopCodes } = await readBody(event)
    const res = await knex('BFSTOPREASONS').whereIn('STOPCODE', stopCodes).del()
    return res
  } catch (e) {
    return e
  }
}))

router.get('/finish-reasons', defineEventHandler(async () => {
  try {
    return await knex('BFDYLOTFINISHREASONS').select({
      reasonId: 'REASONID',
      typeId: 'TYPEID',
      text: 'TEXT',
      reportToERP: 'ReportToERP',
    })
  } catch (e) {
    return e
  }
}))

router.post('/add-finish-reason', defineEventHandler(async (event) => {
  try {
    const { reasonId, typeId, text } = await readBody(event)
    console.log('reasonId, typeId, text, reportToERP = ', reasonId, typeId, text)
    const res = await knex('BFDYLOTFINISHREASONS')
      .insert({
        REASONID: reasonId,
        TYPEID: typeId,
        TEXT: text,
        ReportToERP: false,
      })

    return res
  } catch (e) {
    return e
  }
}))

router.put('/edit-finish-reason', defineEventHandler(async (event) => {
  try {
    const { reasonId, typeId, text } = await readBody(event)
    console.log('reasonId, typeId, text = ', reasonId, typeId, text)

    const res = await knex('BFDYLOTFINISHREASONS').where('REASONID', reasonId)
      .update({
        TYPEID: typeId.value,
        TEXT: text,
      })

    return res
  } catch (e) {
    return e
  }
}))

router.delete('/delete-finish-reasons', defineEventHandler(async (event) => {
  try {
    const { reasonIds } = await readBody(event)
    console.log('reasonIds = ', reasonIds)
    const res = await knex('BFDYLOTFINISHREASONS').whereIn('REASONID', reasonIds).del()
    return res
  } catch (e) {
    return e
  }
}))
