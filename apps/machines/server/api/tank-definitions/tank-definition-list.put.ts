import { z } from 'zod'
import { knex } from '~/server/connectionPool'

const updateSchema = z.object({
  machineId: z.number(),
  tankNo: z.number(),
  name: z.string().optional(),
  highLimit: z.number().optional(),
  machineConstantHighLimit: z.number().optional(),
  listOfTransferCommands: z.array(z.number()).default([]),
  listOfRequestCommands: z.array(z.number()).default([]),
  listOfCirculationDosageCommands: z.array(z.number()).default([]),
  listOfCirculationRequestCommands: z.array(z.number()).default([]),
})

export default defineAuthEventHandler(async (event) => {
  try {
    const {
      machineId,
      tankNo,
      name,
      highLimit,
      machineConstantHighLimit,
      listOfTransferCommands,
      listOfRequestCommands,
      listOfCirculationDosageCommands,
      listOfCirculationRequestCommands,
    } = await readBody(event)

    const parsed = updateSchema.safeParse({
      machineId,
      tankNo,
      name,
      highLimit,
      machineConstantHighLimit,
      listOfTransferCommands,
      listOfRequestCommands,
      listOfCirculationDosageCommands,
      listOfCirculationRequestCommands,
    })

    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'INVALID_REQ_BODY',
        data: {
          message: 'INVALID_REQ_BODY',
          errors: parsed.error.errors,
        },
      })
    }

    const record = await knex('BFMACHINETANKS')
      .where('MACHINEID', machineId)
      .andWhere('TANKNO', tankNo)

    if (record.length === 0) {
      await knex('BFMACHINETANKS').insert({
        MACHINEID: machineId,
        TANKNO: tankNo,
        NAME: name,
        HIGHLIMIT: highLimit,
        MACHINECONSTANTHIGHLIMIT: machineConstantHighLimit,
        LISTOFTRASNFERCOMMANDS: listOfTransferCommands.join(','),
        LISTOFREQUESTCOMMANDS: listOfRequestCommands.join(','),
        LISTOFCIRCULATIONDOSAGECOMMANDS: listOfCirculationDosageCommands.join(','),
        LISTOFCIRCULATIONREQUESTCOMMANDS: listOfCirculationRequestCommands.join(','),
      })

      return {
        success: true,
        message: 'TANK_DEFINITION_CREATED',
      }
    } else {
      await knex('BFMACHINETANKS')
        .where('MACHINEID', machineId)
        .andWhere('TANKNO', tankNo)
        .update({
          LISTOFTRASNFERCOMMANDS: listOfTransferCommands.join(','),
          LISTOFREQUESTCOMMANDS: listOfRequestCommands.join(','),
          LISTOFCIRCULATIONDOSAGECOMMANDS: listOfCirculationDosageCommands.join(','),
          LISTOFCIRCULATIONREQUESTCOMMANDS: listOfCirculationRequestCommands.join(','),
        })

      return {
        success: true,
        message: 'TANK_DEFINITION_UPDATED',
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'INTERNAL_SERVER_ERROR',
      data: { message: 'INTERNAL_SERVER_ERROR' },
    })
  }
})
