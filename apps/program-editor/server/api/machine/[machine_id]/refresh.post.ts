import { machineStore } from '~/server/classes/MachineStore'
import type { Program } from '~/shared/types'
import { ProgramStatus } from '~/shared/constants'
import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const { machine_id } = getRouterParams(event)
  const machineId = Number.parseInt(machine_id)
  const machine = await machineStore.get(machineId)
  const body = await readBody(event)
  const remotePrograms = await machine.fetchRemoteProgramList()
  const teleskopPrograms = await db.select('PROGNO', 'PRGSTATE')
    .from('BFMASTERPRGHEADER')
    .where('MACHINEID', machineId)

  for (const remotePrgNo of remotePrograms) {
    try {
      if (!teleskopPrograms.find(teleskopProgram => teleskopProgram.PROGNO === remotePrgNo)) {
        const remoteProgram = await machine.fetchRemoteProgram(remotePrgNo)
        if (remoteProgram) {
          await db('BFMASTERPRGHEADER')
            .insert({
              MACHINEID: machineId,
              PROGNO: remoteProgram.programNo,
              PROCESSCODE: remoteProgram.typeId,
              NAME: '',
              PRGSTATE: ProgramStatus.EXISTS_ONLY_ON_CONTROLLER,
              ISDELETED: 0,
              ISCHANGED: 0,
              CREATIONDATE: remoteProgram.createdAt || new Date(),
              CHANGEDATE: remoteProgram.updatedAt || new Date(),
              DURATION: 0,
              TOTALSTEP: 0,
            })
        }
      } else {
        await db('BFMASTERPRGHEADER')
          .where('MACHINEID', machineId)
          .andWhere('PROGNO', remotePrgNo)
          .update({ PRGSTATE: ProgramStatus.EXISTS_ON_BOTH })
      }
      // maybe update updatedAtTBB
      for (const teleskopProgram of teleskopPrograms) {
        if (!remotePrograms.includes(teleskopProgram.PROGNO)) {
          const query = db('BFMASTERPRGHEADER').where('MACHINEID', machineId).andWhere('PROGNO', teleskopProgram.PROGNO)
          if (teleskopProgram.PRGSTATE === ProgramStatus.EXISTS_ONLY_ON_CONTROLLER) {
            await query.delete()
          } else {
            await query.update('PRGSTATE', ProgramStatus.EXISTS_ONLY_ON_DATABASE)
          }
        }
      }
    } catch (e) {
      console.log(remotePrgNo)
    }
  }

  return 1
})
