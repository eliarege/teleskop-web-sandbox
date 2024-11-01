import { knex } from '../knexConfig'
import type { MachineAlarm, MachineAlarmList } from '~/shared/types'

export async function getMachineAlarms(): Promise<MachineAlarm[]> {
  return knex.raw(`
    SELECT JSON_QUERY((
        SELECT
            main.MACHINEID AS machineId,
            d.MACHINECODE AS machineName,
            (
                SELECT JSON_QUERY((
                    SELECT
                        commands.COMMANDNO AS commandNo,
                        c.NAME AS commandName,
                        (
                            SELECT JSON_QUERY((
                                SELECT
                                    alarms.ALARMNO AS alarmNo,
                                    alarms.ALARM AS alarmName,
                                    alarms.SHOWONSCREEN AS showOnScreen
                                FROM BFMASTERCOMMANDSALARMS AS alarms
                                WHERE alarms.MACHINEID = main.MACHINEID
                                AND alarms.COMMANDNO = commands.COMMANDNO
                                FOR JSON PATH
                            )) AS alarms
                        ) AS alarms
                    FROM BFMASTERCOMMANDSALARMS AS commands
                    LEFT JOIN BFMASTERCOMMANDS AS c ON commands.MACHINEID = c.MACHINEID AND commands.COMMANDNO = c.COMMANDNO
                    WHERE commands.MACHINEID = main.MACHINEID
                    GROUP BY commands.COMMANDNO, c.NAME
                    FOR JSON PATH
                )) AS commands
            ) AS commands
        FROM BFMASTERCOMMANDSALARMS AS main
        LEFT JOIN BFMACHINES AS d ON d.MACHINEID = main.MACHINEID
        WHERE d.USEINTELESKOP = 1 AND d.INUSE = 1
        GROUP BY main.MACHINEID, d.MACHINECODE
        ORDER BY main.MACHINEID
        FOR JSON PATH
    )) AS result
`)
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
      AND d.ENDTIME IS NULL
      --AND s.currentAlarmStatus <> 2
    ORDER BY m.MACHINEID
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
        if (commandNo !== null && alarmNo !== null && alarmName !== null && showOnScreen !== null) {
          machine.alarmList.push({
            commandNo,
            alarmNo,
            alarmName,
            showOnScreen,
            alarmStatus,
          })
        }
      }
    }
  }

  return Array.from(machinesMap.values()).filter(machine => machine.alarmList.length > 0)
}

export async function updateMachineAlarms(machineId: number, commandNo: number, alarmNo: number) {
  try {
    await knex('BFMASTERCOMMANDSALARMS')
      .where({
        MACHINEID: machineId,
        COMMANDNO: commandNo,
        ALARMNO: alarmNo,
      })
      .update({
        SHOWONSCREEN: knex.raw('CASE WHEN SHOWONSCREEN = 1 THEN 0 ELSE 1 END'),
      })

    return 'Alarm visibility updated successfully.'
  } catch (err) {
    return `Error updating alarm visibility: ${err}`
  }
}
