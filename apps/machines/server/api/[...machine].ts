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

router.post('/machine-edit', defineEventHandler(async (event) => {
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

router.post('/machine-delete', defineEventHandler(async (event) => {
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

        manualReason: 'manualString',
        reportToERP: 'ReportToERP',
      },
      )
    return manualReasons
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

router.get('/user-definitions', defineEventHandler(async () => {
  try {
    const machines = await knex('BFUSERS')
      .select({
        userId: 'userID',
        userName: 'userName',
        userSurname: 'userSurname',
        userPass: 'userPass',
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
      userId: user.userId,
      userName: user.userName,
      userSurname: user.userSurname,
      userPass: user.userPass,
      userActive: user.userActive,
      userType: user.userType,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
}))

router.post('/user-edit', defineEventHandler(async (event) => {
  try {
    const user: User = await readBody(event)
    const res = await knex('BFUSERS').where({
      userId: user.userId,
    }).insert({
      userName: user.userName,
      userSurname: user.userSurname,
      userPass: user.userPass,
      userActive: user.userActive,
      userType: user.userType,
    })
    return res
  } catch (e) {
    console.error(e)
    return e
  }
}))

router.post('/user-delete', defineEventHandler(async (event) => {
  try {
    const { userIds } = await readBody(event)
    const res = await knex('BFUSERS').whereIn('userId', userIds).del()
    return res
  } catch (e) {
    return e
  }
}))
