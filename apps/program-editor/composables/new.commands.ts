import CMDeleteProgramDialog from '~/components/CMDeleteProgramDialog.vue'
import CMChangeProgramNoOnPasteDialog from '~/components/CMChangeProgramNoOnPasteDialog.vue'
import CMMachineListDialog from '~/components/CMMachineListDialog.vue'
import CMProgramOrdersOnConcatenationDialog from '~/components/CMProgramOrdersOnConcatenationDialog.vue'
import CMConcatenateProgramDetails from '~/components/CMConcatenateProgramDetails.vue'
import CMChangeNameDialog from '~/components/CMChangeNameDialog.vue'
import CMChangeProcessTypeDialog from '~/components/CMChangeProcessTypeDialog.vue'
import { commandManager, contextMenuStore } from '~/shared/utils'
import TBProgramFilterDialog from '~/components/TBProgramFilterDialog.vue'
import type { ProgramFilter } from '~/shared/types'
import TBPrintProgramDialog from '~/components/TBPrintProgramDialog.vue'
import TBPrintProgramListDialog from '~/components/TBPrintProgramListDialog.vue'
import TBEditProgramTypes from '~/components/TBEditProgramTypes.vue'

type CommandFunction = (ctx?: Function, ...args: any) => boolean

export interface AppCommand {
  name: string
  keybind?: string
  label?: string | Function
  category?: string | Function
  description?: string | Function
  icon?: string | Function
  disabled?: boolean | Function
  visible?: boolean | Function
  execute: CommandFunction
  undo?: CommandFunction
}

export function defineAppCommand(setup: () => AppCommand): AppCommand {
  return setup()
}

export const deleteProgramCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'deleteProgram',
    execute(ctx: any, selectedRows: Array<any>, machineId: number) {
      ctx.$q.dialog({
        component: CMDeleteProgramDialog,
        componentProps: {
          programNames: selectedRows.map(r => r.name),
        },
      }).onOk(async (option) => {
        await contextMenuStore.deleteProgram(selectedRows, option, machineId)
        await ctx.fetchPrograms()
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})

export const pasteProgramCommand: AppCommand = defineAppCommand(() => {
  let remainsFromPaste = [] as Array<any>
  return {
    name: 'pasteProgram',
    async execute(ctx: any, machineId: number, remains?) {
      if (!remains) {
        remainsFromPaste = await contextMenuStore.paste(machineId)
        await ctx.fetchPrograms()
      }
      if (remainsFromPaste.length) {
        ctx.$q.dialog({
          component: CMChangeProgramNoOnPasteDialog,
          componentProps: {
            remains: remainsFromPaste,
          },
        }).onOk(async (newIds) => {
          remainsFromPaste.forEach((val, index: number) => {
            val.newProgramNo = newIds[index]
          })
          remainsFromPaste = await contextMenuStore.paste(machineId, remainsFromPaste)
          commandManager.executeCommand(pasteProgramCommand, ctx, machineId, remainsFromPaste)
          return true
        }).onCancel(() => {
          return false
        })
      }
      await ctx.fetchPrograms()
      return true
    },
  }
})

export const deleteProgramFromMultiMachineCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'deleteProgramFromMultiMachine',
    execute(ctx: any, selectedRows) {
      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'deleteFromMultiMachine',
        },
      }).onOk(async (machines) => {
        await contextMenuStore.deleteProgramFromMachine(selectedRows, machines)
        await ctx.fetchPrograms()
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})
// // TODO: Make this function that return promise not inline code
export const concatenateProgramsCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'concatenatePrograms',
    async execute(ctx: any, selectedRows, machineId) {
      let programsOnExecute: any
      const processTypes = await contextMenuStore.getProcessTypes()
      await new Promise((resolve, reject) => {
        ctx.$q.dialog({
          component: CMProgramOrdersOnConcatenationDialog,
          componentProps: {
            programs: selectedRows,
          },
        }).onOk(async (programs) => {
          programsOnExecute = programs
          resolve(true)
        }).onCancel(() => {
          reject(false)
        })
      })
      await new Promise((resolve, reject) => {
        ctx.$q.dialog({
          component: CMConcatenateProgramDetails,
          componentProps: {
            processTypes,
            programsOrder: programsOnExecute,
          },
        }).onOk(async (details) => {
          await contextMenuStore.concatenatePrograms(details.programsOrder, details.details, machineId)
          await ctx.fetchPrograms()
          resolve(true)
        }).onCancel(() => {
          reject(false)
        })
      })
      return true
    },
  }
})

export const changeNameCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'changeName',
    execute(ctx: any, selectedRows, machineId) {
      ctx.$q.dialog({
        component: CMChangeNameDialog,
        componentProps: {
          name: selectedRows[0]?.name,
        },
      }).onOk(async (newName: string) => {
        await contextMenuStore.changeName(selectedRows[0], newName, machineId)
        await ctx.fetchPrograms()
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})

export const changeProcessTypeCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'changeProcessType',
    async execute(ctx: any, selectedRows, machineId) {
      const processTypes = await contextMenuStore.getProcessTypes()
      ctx.$q.dialog({
        component: CMChangeProcessTypeDialog,
        componentProps: {
          options: processTypes,
        },
      }).onOk(async (newType) => {
        await contextMenuStore.changeProcessType(selectedRows, newType, machineId)
        await ctx.fetchPrograms()
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})
export const sendProgramCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'sendProgram',
    async execute(ctx: any, selectedRows, machineId) {
      await contextMenuStore.sendProgram(selectedRows, machineId)
      await ctx.fetchPrograms()
      return false // Dont want to add uno redo stack 'cause it cannot be reversible'
    },
  }
})

export const copyAndSendCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'copyAndSend',
    execute(ctx: any, selectedRows, machineId) {
      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'copyAndSend',
        },
      }).onOk(async (machines) => {
        // FIXME: steps null check for on backend
        await contextMenuStore.sendProgramToMachines(selectedRows, machines, machineId)
        await ctx.fetchPrograms()
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})
export const fetchProgramFromMachineCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'fetchProgram',
    async execute(ctx: any, selectedRows, machineId) {
      await contextMenuStore.getRemoteProgram(selectedRows, machineId)
      await ctx.fetchPrograms()
      return false // Dont want to add uno redo stack 'cause it cannot be reversible'
    },
  }
})
export const filterProgramsCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'filterPrograms',
    async execute(ctx: any) {
      const processTypes = await contextMenuStore.getProcessTypes()
      ctx.$q.dialog({
        component: TBProgramFilterDialog,
        componentProps: {
          processTypes,
        },
      }).onOk(async (filter: ProgramFilter) => {
        await ctx.fetchPrograms(filter)
        if (ctx?.isProgramFilterExists)
          ctx.isProgramFilterExists.value = true
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})

export const printProgramCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'printProgram',
    async execute(ctx: any) {
      const machines = await $fetch('/api/machine')
      console.log(machines)
      ctx.$q.dialog({
        component: TBPrintProgramDialog,
        componentProps: {
          machines,
        },
      })
      return true
    },
  }
})

export const printProgramListCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'printProgramList',
    async execute(ctx: any) {
      const machines = await $fetch('/api/machine')
      console.log(machines)
      ctx.$q.dialog({
        component: TBPrintProgramListDialog,
        componentProps: {
          machines,
        },
      })
      return true
    },
  }
})

export const editProgramTypesCommand: AppCommand = defineAppCommand(() => {
  return {
    name: 'editProgramTypes',
    async execute(ctx: any) {
      ctx.$q.dialog({
        component: TBEditProgramTypes,
      })
      return true
    },
  }
})
