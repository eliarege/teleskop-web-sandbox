import type { TonelloBatch } from '@teleskop/core'
import type { Program } from './program'
import { transformProgramToTonello } from './program'
import type { MachineCommand } from './command'

export function createTonelloBatch(programs: Program[], commands: MachineCommand[], jobOrder: string, weight: number): TonelloBatch {
  const tonelloPrograms = programs.map(program => transformProgramToTonello(program, commands))
  return {
    code: jobOrder,
    name: jobOrder,
    params: [],
    description: '',
    kg: weight,
    programs: tonelloPrograms.map(p => ({ program: p })),
    programsCount: tonelloPrograms.length,
  }
}
