import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import CMDeleteProgramDialog from '~/components/CMDeleteProgramDialog.vue'
import CMChangeProgramNoOnPasteDialog from '~/components/CMChangeProgramNoOnPasteDialog.vue'
import CMMachineListDialog from '~/components/CMMachineListDialog.vue'
import CMProgramOrdersOnConcatenationDialog from '~/components/CMProgramOrdersOnConcatenationDialog.vue'
import CMConcatenateProgramDetails from '~/components/CMConcatenateProgramDetails.vue'
import CMChangeProcessTypeDialog from '~/components/CMChangeProcessTypeDialog.vue'
import { contextMenuStore } from '~/utils/context-menu'
import type { Program, ProgramHeader, ProgramTable } from '~/shared/types'
import TBPrintProgramDialog from '~/components/TBPrintProgramDialog.vue'
import TBPrintProgramListDialog from '~/components/TBPrintProgramListDialog.vue'
import TBEditProgramTypes from '~/components/TBEditProgramTypes.vue'
import TBApplicationSettingsDialog from '~/components/TBApplicationSettingsDialog.vue'
import TBExportExcelDialog from '~/components/TBExportExcelDialog.vue'
import hooks from '~/utils/hooks'
import CMTempTimeGraphDialog from '~/components/CMTempTimeGraphDialog.vue'
import CMStepCommandGraphDialog from '~/components/CMStepCommandGraphDialog.vue'
import { TeleskopSettingsIds } from '~/shared/constants'
import CMNewProgramDialog from '~/components/CMNewProgramDialog.vue'

type CommandFunction = (ctx?: Function, ...args: any) => Promise<boolean | void> | boolean | void

// const { $commandManager } = useNuxtApp()
export interface AppCommand {
  name: string
  keybind?: string
  label?: MaybeRefOrGetter<string>
  category?: MaybeRefOrGetter<string>
  description?: MaybeRefOrGetter<string>
  icon?: MaybeRefOrGetter<string>
  disabled?: MaybeRefOrGetter<boolean>
  visible?: MaybeRefOrGetter<boolean>
  execute: CommandFunction
  undo?: CommandFunction
}

export function defineAppCommand(setup: () => AppCommand): AppCommand {
  const command = setup()
  return command
}
export function registerCommand(command: () => AppCommand) {
  hooks.hook('register', (ctx: any) => {
    ctx.register(command)
  })
}
export interface RegisteredCommands {
  deleteProgram: [ctx: any, selectedRows: Array<any>, machineId: number]
  pasteProgram: [ctx: any, machineId: number, remains?: any]
  deleteProgramFromMultiMachine: [ctx: any, selectedRows: Array<any>]
  concatenatePrograms: [ctx: any, selectedRows: Array<any>, machineId: number]
  changeName: [ctx: any, selectedRows: Array<any>, machineId: number]
  changeProcessType: [ctx: any, selectedRows: Array<any>, machineId: number]
  sendProgram: [ctx: any, selectedRows: Array<any>, machineId: number]
  copyAndSend: [ctx: any, selectedRows: Array<any>, machineId: number]
  fetchProgram: [ctx: any, selectedRows: Array<any>, machineId: number]
  printProgram: [ctx: any]
  printProgramList: [ctx: any]
  editProgramTypes: [ctx: any]
  editProgramIcons: [ctx: any]
  exportToExcel: [ctx: any]
  refresh: [ctx: any, machineId: number]
  tempTimeGraph: [ctx: any]
  stepCommandGraph: [ctx: any]
  newProgram: [ctx: any]
  saveAsProgram: [ctx: any]
}

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'newProgram',
    execute(ctx: any) {
      ctx.$q.dialog({
        component: CMNewProgramDialog,
        componentProps: {
          header: 'newProgram',
        },
      }).onOk(async (newProgram: Program) => {
        await editor.onSubmit(newProgram)
        setTimeout(() => {
          editor.newStep()
        }, 1000)
        return true
      }).onCancel(() => {
        return false
      })

      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'saveAsProgram',
    execute(ctx: any) {
      ctx.$q.dialog({
        component: CMNewProgramDialog,
        componentProps: {
          header: 'saveAs',
          programNo: editor.program.programNo,
        },
      }).onOk(async (newProgram: Program) => {
        await editor.onSubmit(newProgram)
        return true
      }).onCancel(() => {
        return false
      })

      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'tempTimeGraph',
    execute(ctx: any) {
      const editor = useEditorStore()
      if (!editor.popupTempTimeGraphVisible) {
        ctx.$q.dialog({
          component: CMTempTimeGraphDialog,
        })
        editor.popupTempTimeGraphVisible = true
        return true
      }
    },
  }
})

registerCommand(() => {
  return {
    name: 'stepCommandGraph',
    execute(ctx: any) {
      const editor = useEditorStore()
      if (!editor.popupStepCommandGraphVisible) {
        ctx.$q.dialog({
          component: CMStepCommandGraphDialog,
        })
        editor.popupStepCommandGraphVisible = true
        return true
      }
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  const { fetch } = useKeycloak()
  return {
    name: 'deleteProgram',
    execute(ctx: any, selectedRows: Array<any>, machineId: number) {
      ctx.$q.dialog({
        component: CMDeleteProgramDialog,
        componentProps: {
          programNames: selectedRows.map(r => r.name),
        },
      }).onOk(async (option: string) => {
        const query = `source=${option}`
        for (const program of selectedRows)
          await fetch(`/api/machine/${machineId}/program/${program.programNo}?${query}`, {
            method: 'DELETE',
          })
        // await contextMenuStore.deleteProgram(selectedRows, option, machineId)
        await editor.fetchAllPrograms()
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})

async function openDialogonPaste(ctx: any, remainsFromPaste: any, machineId: number) {
  const editor = useEditorStore()
  let remains = remainsFromPaste
  if (remains.length) {
    ctx.$q.dialog({
      component: CMChangeProgramNoOnPasteDialog,
      componentProps: {
        remains,
      },
    }).onOk(async (newIds) => {
      remains.forEach((val, index: number) => {
        val.newProgramNo = newIds[index]
      })
      remains = await contextMenuStore.paste(machineId, remains)
      await openDialogonPaste(ctx, remains, machineId)
      await editor.fetchAllPrograms()
      /**
     TODO: This has to be done through commandManager.executeCommand 'cause
      commandManager will handle undo redo operations and paste is not a single paste operation
      it can be done in multiple steps and each ctrl+z should go back to previous step
      not cancel the whole paste operation
      // $commandManager.executeCommand('pasteProgram', ctx, machineId, remainsFromPaste)
       */
      return true
    }).onCancel(() => {
      return false
    })
  }
}

registerCommand(() => {
  const editor = useEditorStore()
  let remainsFromPaste = [] as Array<any>

  return {
    name: 'pasteProgram',
    async execute(ctx: any, machineId: number, remains?) {
      if (!remains) {
        remainsFromPaste = await contextMenuStore.paste(machineId)
        await editor.fetchAllPrograms()
      }
      if (remainsFromPaste.length)
        await openDialogonPaste(ctx, remainsFromPaste, machineId)
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'deleteProgramFromMultiMachine',
    execute(ctx: any, selectedRows) {
      ctx.$q.dialog({
        component: CMMachineListDialog,
        componentProps: {
          type: 'deleteFromMultiMachine',
        },
      }).onOk(async (machines) => {
        ctx.$q.dialog({
          component: CMDeleteProgramDialog,
          componentProps: {
            programNames: selectedRows.map(r => r.name),
          },
        }).onOk(async (option: string) => {
          await contextMenuStore.deleteProgramFromMachine(selectedRows, machines, option)
          await editor.fetchAllPrograms()
          return true
        }).onCancel(() => {
          return false
        })
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})
// // TODO: Make this function that return promise not inline code
registerCommand(() => {
  const editor = useEditorStore()
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
          await editor.fetchAllPrograms()
          resolve(true)
        }).onCancel(() => {
          reject(false)
        })
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'changeName',
    execute(ctx: any, selectedPrograms: ProgramTable[], machineId) {
      ctx.$q.dialog({
        component: CMNewProgramDialog,
        componentProps: {
          header: 'rename',
        },
      }).onOk(async (program: ProgramHeader) => {
        const editor = useEditorStore()
        await contextMenuStore.updateProgramHeader(program, machineId)
        await editor.fetchAllPrograms()
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
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
        await editor.fetchAllPrograms()
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})
registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'sendProgram',
    async execute(ctx: any, selectedRows, machineId) {
      await contextMenuStore.sendProgram(selectedRows, machineId)
      await editor.fetchAllPrograms()
      return false // Dont want to add uno redo stack 'cause it cannot be reversible'
    },
  }
})

registerCommand(() => {
  const editor = useEditorStore()
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
        await editor.fetchAllPrograms()
        return true
      }).onCancel(() => {
        return false
      })
      return true
    },
  }
})
registerCommand(() => {
  const editor = useEditorStore()
  return {
    name: 'fetchProgram',
    async execute(ctx: any, selectedRows, machineId) {
      await contextMenuStore.getRemoteProgram(selectedRows, machineId)
      await editor.fetchAllPrograms()
      return false // Dont want to add uno redo stack 'cause it cannot be reversible'
    },
  }
})

registerCommand(() => {
  const { fetch } = useKeycloak()
  return {
    name: 'printProgram',
    async execute(ctx: any) {
      const machines = await fetch('/api/machine')
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

registerCommand(() => {
  const { fetch } = useKeycloak()
  return {
    name: 'printProgramList',
    async execute(ctx: any) {
      const machines = await fetch('/api/machine')
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

registerCommand(() => {
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

registerCommand(() => {
  return {
    name: 'editProgramIcons',
    async execute(ctx: any) {
      const editor = useEditorStore()
      ctx.$q.dialog({
        component: TBApplicationSettingsDialog,
      }).onOk(async (value: string) => {
        await editor.updateTeleskopSettings(TeleskopSettingsIds.SELECTED_ICONS, value)
      })
      return true
    },
  }
})

registerCommand(() => {
  return {
    name: 'exportToExcel',
    async execute(ctx: any) {
      const machines = await fetch('/api/machine?asList=true')
      ctx.$q.dialog({
        component: TBExportExcelDialog,
        componentProps: {
          machines,
        },
      })
      return true
    },
  }
})

registerCommand(() => {
  const { fetch } = useKeycloak()
  return {
    name: 'refresh',
    async execute(ctx: any, machineId: number) {
      const editor = useEditorStore()

      editor.isLoading = true
      await fetch(`/api/machine/${machineId}/refresh`, {
        method: 'POST',
      })
      await editor.fetchAllPrograms()
      editor.isLoading = false
      return true
    },
  }
})
