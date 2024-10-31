import { knex } from '../knexConfig'
import type { MachineAlarm } from '~/shared/types'

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
