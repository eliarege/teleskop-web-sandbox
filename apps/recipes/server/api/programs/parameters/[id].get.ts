import { defineEventHandler, getQuery, getRouterParams } from 'h3'
import { dmsDB } from '~/server/connectionPool'
import type { OptimizationParameter } from '~/shared/types'

export default defineEventHandler(async (event): Promise<OptimizationParameter[]> => {
  const { id } = getRouterParams(event)
  const { programNo } = getQuery(event)

  const rows = await dmsDB('OPTIMIZED_STEP_PARAMETER as osp')
    .join('MACHINE_GROUP as mg', 'osp.machine_id', 'mg.machine_id')
    .join('PARAMETER_GROUP as pg', 'mg.group_id', 'pg.group_id')
    .join('PROGRAM_STEP as ps', function () {
      this.on('osp.machine_id', 'ps.machine_id')
        .andOn('osp.program_no', 'ps.program_no')
        .andOn('osp.main_step', 'ps.main_step')
        .andOn('osp.parallel_step', 'ps.parallel_step')
    })
    .join('OPTIMIZATION_PARAMETER_MAP as opm', function () {
      this.on('mg.group_id', 'opm.group_id')
        .andOn('ps.command_no', 'opm.command_no')
        .andOn('osp.param_index', 'opm.parameter_index')
    })
    .join('OPTIMIZATION_PARAMETER as op', 'opm.param_id', 'op.param_id')
    .join('MACHINE_COMMAND as mc', function () {
      this.on('osp.machine_id', 'mc.machine_id')
        .andOn('ps.command_no', 'mc.command_no')
    })
    .where('osp.machine_id', Number(id))
    .andWhere('osp.program_no', Number(programNo))
    .select({
      machineId: 'osp.machine_id',
      programNo: 'osp.program_no',
      machineGroup: 'mg.group_id',
      groupName: 'pg.group_name',
      mainStep: 'osp.main_step',
      parallelStep: 'osp.parallel_step',
      paramIndex: 'osp.param_index',
      optimizedValue: 'osp.optimized_value',
      commandNo: 'ps.command_no',
      commandName: 'mc.command_name',
      paramId: 'opm.param_id',
      paramName: 'op.param_name',
      minValue: 'op.min_value',
      maxValue: 'op.max_value',
      unit: 'op.unit',
    })
    .orderBy('osp.program_no')

  return rows
})
