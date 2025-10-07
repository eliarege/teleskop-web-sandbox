import { withTbbFtpClient } from '@teleskop/tbb-ftp-client'
import { knex } from '~/server/connectionPool'
import { writeCommandAlarmReasons, writeManualReasonsGeneral } from '~/server/utils/updateDatabase'

export default defineAuthEventHandler(async (event) => {
  try {
    const { machineId, options } = await readBody(event)

    if (!machineId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MACHINE_ID_REQUIRED',
      })
    }

    if (!options || typeof options !== 'object') {
      throw createError({
        statusCode: 400,
        statusMessage: 'UPLOAD_OPTIONS_REQUIRED',
      })
    }

    const numMachineId = Number.parseInt(machineId as string)
    if (Number.isNaN(numMachineId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'INVALID_MACHINE_ID',
      })
    }

    const machineData = await knex('BFMACHINES')
      .select('IP')
      .where('MACHINEID', machineId)
      .first()

    if (!machineData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'MACHINE_NOT_FOUND',
      })
    }

    const ip = machineData.IP
    if (!ip) {
      throw createError({
        statusCode: 400,
        statusMessage: 'MACHINE_IP_NOT_CONFIGURED',
      })
    }

    const hasAnyOption = Object.values(options).some(Boolean)
    if (!hasAnyOption) {
      throw createError({
        statusCode: 400,
        statusMessage: 'NO_UPLOAD_OPTIONS_SELECTED',
      })
    }

    await withTbbFtpClient(ip, async (tbb) => {
      await knex.transaction(async (trx) => {
        if (options.machineIdleReasons) {
          await writeStopReasons(tbb, trx)
        }
        if (options.machineFinishReasons) {
          await writeFinishReasons(tbb, trx)
        }
        if (options.users) {
          await writeUsers(tbb, trx)
        }
        if (options.manualReasons) {
          await writeManualReasonsGeneral(tbb, trx)
        }
        if (options.commandTimeoutReasons) {
          await writeCommandAlarmReasons(machineId, tbb, trx)
        }
      })
    })

    return {
      success: true,
      message: 'DEFINITIONS_UPLOADED_SUCCESSFULLY',
      uploadedOptions: Object.keys(options).filter(key => options[key]),
    }
  } catch (error: any) {
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connection refused')) {
      throw createError({
        statusCode: 503,
        statusMessage: 'MACHINE_CONNECTION_REFUSED',
      })
    }

    if (error.message?.includes('ETIMEDOUT') || error.message?.includes('timeout')) {
      throw createError({
        statusCode: 408,
        statusMessage: 'MACHINE_CONNECTION_TIMEOUT',
      })
    }

    if (error.message?.includes('EHOSTUNREACH') || error.message?.includes('unreachable')) {
      throw createError({
        statusCode: 503,
        statusMessage: 'MACHINE_UNREACHABLE',
      })
    }

    if (error.message?.includes('FTP') || error.message?.includes('ftp')) {
      throw createError({
        statusCode: 503,
        statusMessage: 'FTP_CONNECTION_FAILED',
      })
    }

    if (error.statusCode) {
      throw error
    }
    console.error('Error uploading dye house definitions:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'UPLOAD_DEFINITIONS_FAILED',
    })
  }
})
