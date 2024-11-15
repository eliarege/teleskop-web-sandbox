import { knex } from '../knexConfig'
import type { MachineAlarm, MachineAlarmList, MachineAlarmStats } from '~/shared/types'

export async function getMachineAlarms(): Promise<MachineAlarm[]> {
  const machineCommandAlarms = await knex.raw(/* sql */`
    SELECT
      m.MACHINEID AS machineId,
      m.MACHINECODE AS machineName,
      commands = (
        SELECT
          c.COMMANDNO AS commandNo,
          c.NAME AS commandName,
          alarms = (
            SELECT
              a.ALARMNO AS alarmNo,
              a.ALARM AS alarmName,
              a.SHOWONSCREEN AS showOnScreen
            FROM BFMASTERCOMMANDSALARMS AS a
            WHERE a.MACHINEID = m.MACHINEID
              AND a.COMMANDNO = c.COMMANDNO
            ORDER BY a.ALARMNO
            FOR JSON PATH
          )
        FROM BFMASTERCOMMANDS AS c
        WHERE c.MACHINEID = m.MACHINEID
        ORDER BY c.COMMANDNO
        FOR JSON PATH
    )
    FROM BFMACHINES AS m
    WHERE m.USEINTELESKOP = 1 AND m.INUSE = 1
    ORDER BY m.MACHINEID
  `)

  for (const machine of machineCommandAlarms) {
    machine.commands = JSON.parse(machine.commands)
  }

  return machineCommandAlarms
}

export async function getMachineAlarmList(): Promise<MachineAlarmList[]> {
  const queryResults = await knex.raw(`
    SELECT
      m.MACHINEID AS machineId,
      m.MACHINECODE AS machineName,
      m.IP as machineIpAddress,
      s.RUNNING_OPRNAME AS loggedInOperatorName,
      s.RUNNING_JOBORDER AS jobOrder,
      s.RUNNING_BATCHKEY AS batchKey,
      s.RUNNING_CMDNO AS runningCommandNo,
      s.currentTemp as currentTemperature,
      s.currentAlarmStatus,
      d.COMMANDNO as commandNo,
      d.EXPLANATION as alarmName,
      d.ALARMNO as alarmNo,
      d.STARTTIME as alarmStartTime,
      f.SHOWONSCREEN as showOnScreen,
      CASE
        WHEN d.CONFIRMTIME IS NOT NULL THEN 1
        ELSE 0
      END AS alarmStatus
    FROM BFMACHINES m
    LEFT JOIN TFMACHINESTATUS s ON m.MACHINEID = s.MACHINEID
    LEFT JOIN BFMACHGROUP g ON m.GRUPNO = g.GROUPID
    LEFT JOIN BADATA b ON b.BATCHKEY = s.RUNNING_BATCHKEY
    LEFT JOIN BAALARM d ON d.BATCHKEY = s.RUNNING_BATCHKEY
    LEFT JOIN BFMASTERCOMMANDSALARMS f ON f.COMMANDNO = d.COMMANDNO AND d.ALARMNO = f.ALARMNO AND f.MACHINEID = s.MACHINEID
    WHERE m.INUSE = 1
      AND m.USEINTELESKOP = 1
      AND (d.ENDTIME IS NULL OR d.ENDTIME > GETUTCDATE())
      AND (s.currentAlarmStatus = 0 OR s.currentAlarmStatus = 1)
    ORDER BY d.STARTTIME
  `)
  const machinesMap = new Map<number, MachineAlarmList>()

  for (const row of queryResults) {
    const {
      machineName,
      machineId,
      batchKey,
      jobOrder,
      loggedInOperatorName,
      currentTemperature,
      commandNo,
      alarmNo,
      alarmName,
      alarmStartTime,
      showOnScreen,
      alarmStatus,
    } = row

    if (!machinesMap.has(machineId)) {
      machinesMap.set(machineId, {
        machineId,
        machineName,
        batchKey,
        jobOrder,
        operatorName: loggedInOperatorName,
        currentTemperature,
        alarmList: [],
      })
    }

    if (commandNo !== null) {
      const machine = machinesMap.get(machineId)
      if (machine) {
        machine.alarmList.push({
          commandNo,
          alarmNo,
          alarmName,
          alarmStartTime,
          showOnScreen,
          alarmStatus,
        })
      }
    }
  }

  return (Array.from(machinesMap.values())
    .filter(machine => machine.alarmList.length > 0)).sort((a, b) => a.machineId > b.machineId ? 1 : -1)
}

export async function updateMachineAlarmVisibility(machineId: number, commandNo: number, alarmNo: number, showOnScreen: boolean) {
  await knex('BFMASTERCOMMANDSALARMS')
    .where({
      MACHINEID: machineId,
      COMMANDNO: commandNo,
      ALARMNO: alarmNo,
    })
    .update({
      SHOWONSCREEN: showOnScreen,
    })
}

export async function getLastDayAlarmCount(): Promise<MachineAlarmStats> {
  const result = await knex({ b: 'BAALARM' })
    .count('* as alarmsInLast24Hours')
    .where('b.STARTTIME', knex.raw('DATEADD(DAY, -1, GETUTCDATE())'))
    .first()

  return { alarmsInLast24Hours: result?.alarmsInLast24Hours as number }
}
