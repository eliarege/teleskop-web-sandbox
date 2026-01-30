<script setup lang="ts">
import { QForm } from 'quasar'
import CMCopyStepDialog from '~/components/CMCopyStepDialog.vue'
import ProgramEditor from '~/components/ProgramEditor.vue'
import TBUnsavedChangesDialog from '~/components/TBUnsavedChangesDialog.vue'
import { useEditorStore } from '~/composables/editor'
import { useContextBar } from '~/composables/useContextBar'
import { contextMenuStore } from '~/utils/context-menu'
import type { ContextBarButtons, ProgramStep } from '~/shared/types'
import ProgramContextMenu from '~/components/ProgramContextMenu.vue'

const $q = useQuasar()
const route = useRoute()
const form = ref<QForm>()
const { t, locale } = useI18n()
const { notifyError } = useNotify()
const { $commandManager } = useNuxtApp()

const editor = useEditorStore()
const machine = useMachineStore()
const teleskopSettings = useTeleskopSettingsStore()

const machineId = Number(route.params.machine_id)
const programNo = Number(route.params.program_no)

if (!machineId || !machine.hasMachine(machineId)) {
  if (machineId) {
    notifyError(t('machineNotFound', { machineId }))
  }

  const redirected = await machine.selectFirstUsableMachine()
  if (!redirected) {
    notifyError(t('noUsableMachineFound'))
  }
}

const ctrl = useKeyModifier('Control')
const alt = useKeyModifier('Alt')

definePageMeta({
  path: '/machine/:machine_id/program/:program_no',
  roles: ['program-view'],
})

onBeforeRouteLeave((to, from, next) => {
  if (!editor.hasProgramChanged()) {
    next()
    return
  }

  $q.dialog({
    component: TBUnsavedChangesDialog,
  }).onOk(async (type: 'save' | 'discard') => {
    if (type === 'save') {
      const saved = await editor.onSubmit()

      if (!saved) {
        return
      }
    }
    next()
  })
})

const buttons = computed<ContextBarButtons[]>(() => [
  {
    label: t('menu.print'),
    originalLabel: t('menu.print'),
    tooltip: t('menu.print'),
    shortcut: 'Ctrl+P',
    icon: 'print',
    disable: editor.isLoading,
    onClick: async () => {
      await editor.printProgram()
    },
  },
  {
    label: t('menu.save'),
    originalLabel: t('menu.save'),
    tooltip: t('menu.save'),
    shortcut: 'Ctrl+S',
    icon: 'save',
    disable: editor.isLoading,
    onClick: async () => {
      await editor.onSubmit(undefined, true)
    },
  },
  // {
  //   label: t('menu.saveWithoutVersion'),
  //   originalLabel: t('menu.saveWithoutVersion'),
  //   tooltip: t('menu.saveWithoutVersion'),
  //   shortcut: 'Ctrl+Shift+S',
  //   icon: 'save',
  //   disable: editor.isLoading,
  //   onClick: async () => {
  //     await editor.onSubmit(undefined, false)
  //   },
  // },
  {
    label: t('menu.saveAs'),
    originalLabel: t('menu.saveAs'),
    tooltip: t('menu.saveAs'),
    shortcut: 'Ctrl+A',
    icon: 'save_as',
    disable: editor.isLoading,
    onClick() {
      $commandManager.executeCommand('saveAsProgram', { $q })
    },
  },
  // {
  //   label: t('menu.reset'),
  //   originalLabel: t('menu.reset'),
  //   tooltip: t('menu.reset'),
  //   shortcut: 'Ctrl+R',
  //   icon: 'refresh',
  //   disable: !editor.hasProgramChanged() || editor.isLoading,
  //   onClick() {
  //     const hasChanged = editor.hasProgramChanged()
  //     if (hasChanged)
  //       $commandManager.executeCommand('discardChanges', { $q })
  //   },
  // },
  {
    label: t('menu.newStep'),
    originalLabel: t('menu.newStep'),
    tooltip: t('menu.newStep'),
    shortcut: 'F2',
    icon: 'add_box',
    disable: editor.isLoading,
    onClick() {
      editor.addStepToEnd(null)
    },
  },
  {
    label: t('menu.newStepBetween'),
    originalLabel: t('menu.newStepBetween'),
    tooltip: t('menu.newStepBetween'),
    shortcut: 'Insert',
    icon: 'vertical_align_center',
    disable: editor.isLoading || !editor.selectedSteps.length,
    onClick() {
      editor.addStepBeforeSelection(null)
    },
  },
  {
    label: t('menu.newParallelStep'),
    originalLabel: t('menu.newParallelStep'),
    tooltip: t('menu.newParallelStep'),
    shortcut: 'F3',
    icon: 'queue',
    disable: editor.isLoading,
    visible: !machine.isTonello,
    onClick() {
      editor.newParallelStep()
    },
  },
  {
    label: t('menu.deleteStep'),
    originalLabel: t('menu.deleteStep'),
    tooltip: t('menu.deleteStep'),
    shortcut: 'Del', // Browser bookmark shortcut conflict with 'Ctrl+D'
    icon: 'delete',
    disable: editor.isLoading || !editor.selectedSteps.length,
    onClick() {
      editor.deleteStep()
    },
  },
  // {
  //   label: t('menu.deleteParallelStep'),
  //   originalLabel: t('menu.deleteParallelStep'),
  //   tooltip: t('menu.deleteParallelStep'),
  //   shortcut: ' ',
  //   icon: 'delete',
  //   disable: (editor.isLoading || editor.selectedSteps || editor.selectedParallelStep === -1),
  //   onClick() {
  //     editor.deleteParallelStep()
  //   },
  // },
  {
    label: t('menu.commandDetails'),
    originalLabel: t('menu.commandDetails'),
    tooltip: t('menu.commandDetails'),
    shortcut: '',
    icon: 'info',
    disable: editor.isLoading
    || !editor.selectedSteps[0]?.mainCommand.commandNo
    || !machine.currentMachine.commands.has(editor.selectedSteps[0]?.mainCommand.commandNo),
    onClick() {
      const command = editor.selectedSteps[0]?.mainCommand
      if (command.commandNo && machine.currentMachine.commands.has(command.commandNo)) {
        $commandManager.executeCommand('commandDetails', { $q }, command.commandNo)
      }
    },
  },
  {
    label: editor.allStepExpanded ? t('menu.collapseAll') : t('menu.expandAll'),
    originalLabel: editor.allStepExpanded ? t('menu.collapseAll') : t('menu.expandAll'),
    tooltip: editor.allStepExpanded ? t('menu.collapseAll') : t('menu.expandAll'),
    shortcut: 'Ctrl+Alt+E',
    icon: editor.allStepExpanded ? 'expand_less' : 'expand_more',
    disable: editor.isLoading,
    visible: !machine.isTonello,
    onClick() {
      editor.toggleAllStepsExpanded()
    },
  },
])
useContextBar(buttons)

onKeyStroke('F2', (event: KeyboardEvent) => {
  event.preventDefault()
  editor.addStepToEnd(null)
})

onKeyStroke('F3', (event: KeyboardEvent) => {
  if (route.params.program_no && !machine.isTonello) {
    event.preventDefault()
    editor.newParallelStep()
  }
})

onKeyStroke('Insert', (event: KeyboardEvent) => {
  if (route.params.program_no && editor.selectedSteps.length) {
    event.preventDefault()
    editor.addStepBeforeSelection(null)
  }
})

onKeyStroke(['F7'], (event: KeyboardEvent) => {
  event.preventDefault()
  $commandManager.executeCommand('stepCommandGraph', { $q }, machine.currentMachine, editor.program)
})

onKeyStroke(['F8'], (event: KeyboardEvent) => {
  event.preventDefault()
  const initialTemp = teleskopSettings.initialTemperature
  $commandManager.executeCommand('tempTimeGraph', { $q }, machine.currentMachine, editor.program, initialTemp)
})

onKeyStroke(['Enter', 'NumpadEnter'], (event: KeyboardEvent) => {
  if (!isActiveElementEditable()) {
    event.preventDefault()
    editor.scrollPage(editor.selectedSteps[0].stepId, true)
  }
})

onKeyStroke(['Delete'], (event: KeyboardEvent) => {
  event.preventDefault()

  editor.deleteStep()
})

onKeyStroke(['ArrowUp'], (event: KeyboardEvent) => {
  if (!isActiveElementEditable()) {
    event.preventDefault()
  }

  const selectedStep = editor.selectedSteps[0]
  if (!selectedStep)
    return

  const steps = editor.program.steps
  const currentIndex = steps.findIndex(s => s.stepId === selectedStep.stepId)
  if (currentIndex <= 0)
    return

  const previousStep = steps[currentIndex - 1]
  if (!previousStep)
    return

  editor.selectStep(false, previousStep.stepId)
})

onKeyStroke(['ArrowDown'], (event: KeyboardEvent) => {
  if (!isActiveElementEditable()) {
    event.preventDefault()
  }

  const selectedStep = editor.selectedSteps[0]
  if (!selectedStep)
    return

  const steps = editor.program.steps
  const currentIndex = steps.findIndex(s => s.stepId === selectedStep.stepId)
  if (currentIndex === -1 || currentIndex >= steps.length - 1)
    return

  const nextStep = steps[currentIndex + 1]
  if (!nextStep)
    return

  editor.selectStep(false, nextStep.stepId)
})

onKeyStroke(['E', 'e'], (event: KeyboardEvent) => {
  if (ctrl.value && alt.value) {
    event.preventDefault()
    editor.toggleAllStepsExpanded()
    return
  }

  if (ctrl.value) {
    event.preventDefault()
    editor.selectedSteps.forEach((step) => {
      step.expanded = !step.expanded
    })
  }
})

onKeyStroke(['S', 's'], async (event: KeyboardEvent) => {
  if (event.ctrlKey && event.shiftKey) {
    event.preventDefault()
    await editor.onSubmit(undefined, false)
  } else if (event.ctrlKey) {
    event.preventDefault()
    await editor.onSubmit(undefined, true)
  }
})

onKeyStroke(['A', 'a'], (event: KeyboardEvent) => {
  if (ctrl.value) {
    event.preventDefault()
    editor.selectedSteps = editor.program.steps
  }
})

onKeyStroke(['C', 'c'], (event: KeyboardEvent) => {
  if (ctrl.value) {
    event.preventDefault()

    const { program, selectedSteps } = editor

    $q.dialog({
      component: CMCopyStepDialog,
      componentProps: {
        machine: {
          id: machine.currentMachine.id,
          name: machine.currentMachine.name,
          commands: machine.currentMachine.commands,
        },
        program: {
          programNo: program.programNo,
          name: program.name,
        },
        selectedSteps,
      },
    }).onOk((chosenProgramSteps: ProgramStep[]) => {
      contextMenuStore.copyStep(machine.currentMachine, chosenProgramSteps)
    })
  }
})

onKeyStroke(['V', 'v'], (event: KeyboardEvent) => {
  if (ctrl.value) {
    event.preventDefault()
    contextMenuStore.pasteStep()
  }
})

/**
 * Seçili komutun commandNo'sunu döndürür.
 * Eğer paralel adım seçiliyse paralel komutun commandNo'sunu,
 * değilse ana komutun commandNo'sunu döndürür.
 */
const selectedCommandNo = computed(() => {
  const selectedStep = editor.selectedSteps[0]
  if (!selectedStep)
    return null

  // Paralel adım seçiliyse paralel komutun commandNo'sunu döndür
  if (editor.selectedParallelStep) {
    const { commandId } = editor.selectedParallelStep
    const parallelCommand = selectedStep.parallelCommands.find(cmd => cmd.commandId === commandId)
    if (parallelCommand)
      return parallelCommand.commandNo
  }

  // Ana komutun commandNo'sunu döndür
  return selectedStep.mainCommand.commandNo
})

// onKeyStroke(['R', 'r'], (event: KeyboardEvent) => {
//   if (ctrl.value) {
//     event.preventDefault()

//     const hasChanged = editor.hasProgramChanged()
//     if (hasChanged)
//       $commandManager.executeCommand('discardChanges', { $q })
//   }
// })

const contextMenuOptions = computed(() => [
  [
    {
      label: t('contextMenu.addMainStep'),
      shortcut: 'F2',
      icon: 'add_box',
      disabled: false,
      onClick: () => {
        editor.addStepToEnd(null)
      },
    },
    {
      label: t('contextMenu.addParallelStep'),
      shortcut: 'Insert',
      icon: 'vertical_align_center',
      disabled: !editor.selectedSteps.length,
      onClick: () => {
        editor.newParallelStep()
      },
    },
    {
      label: t('contextMenu.newStepBetween'),
      shortcut: 'F3',
      icon: 'queue',
      disabled: editor.isLoading,
      visible: !machine.isTonello,
      onClick: () => {
        editor.addStepBeforeSelection(null)
      },
    },
    {
      label: t('contextMenu.deleteStep'),
      shortcut: 'Del',
      icon: 'delete',
      disabled: editor.isLoading || !editor.selectedSteps.length,
      onClick: () => {
        editor.deleteStep()
      },
    },
  ],
  [
    { // ana adım yap
      label: t('contextMenu.makeMainStep'),
      // icon: 'subdirectory_arrow_right',
      disabled: !editor.selectedParallelStep,
      subMenu: {
        items: [
          [
            {
              label: t('contextMenu.makeMainStepAtBeginning'),
              shortcut: '',
              icon: 'first_page',
              onClick: () => {
                editor.makeMainStep(true)
              },
            },
            {
              label: t('contextMenu.makeMainStepAtEnd'),
              shortcut: '',
              icon: 'last_page',
              onClick: () => {
                editor.makeMainStep(false)
                // paralel adımlar eklenecek
              },
            },
          ],
        ],
      },
    },
  ],
  [
    {
      label: t('contextMenu.copyStep'),
      shortcut: 'Ctrl+C',
      icon: 'content_copy',
      disabled: !editor.selectedSteps.length,
      onClick: () => {
        const { program, selectedSteps } = editor

        $q.dialog({
          component: CMCopyStepDialog,
          componentProps: {
            machine: {
              id: machine.currentMachine.id,
              name: machine.currentMachine.name,
              commands: machine.currentMachine.commands,
            },
            program: {
              programNo: program.programNo,
              name: program.name,
            },
            selectedSteps,
          },
        }).onOk((chosenProgramSteps: ProgramStep[]) => {
          contextMenuStore.copyStep(machine.currentMachine, chosenProgramSteps)
        })
      },
    },
    {
      label: t('contextMenu.pasteStep'),
      shortcut: 'Ctrl+V',
      icon: 'content_paste',
      disabled: !contextMenuStore.getCopiedStepsValues()?.length,
      onClick: () => {
        contextMenuStore.pasteStep()
      },
    },
  ],
  [
    {
      label: t('contextMenu.moveParallelStep'),
      shortcut: '',
      icon: 'open_with',
      disabled: !selectedCommandNo.value,
      onClick: () => {
        if (selectedCommandNo.value)
          $commandManager.executeCommand('applyParallelCommand', { $q }, 'add', selectedCommandNo.value, editor.program.steps.indexOf(editor.selectedSteps[0]))
      },
    },
    {
      label: t('contextMenu.deleteParallelStep'),
      shortcut: '',
      icon: 'delete',
      disabled: !selectedCommandNo.value,
      onClick: () => {
        if (selectedCommandNo.value)
          $commandManager.executeCommand('applyParallelCommand', { $q }, 'remove', selectedCommandNo.value, editor.program.steps.indexOf(editor.selectedSteps[0]))
      },
    },
  ],
  [
    {
      label: t('contextMenu.programDetails'),
      shortcut: '',
      icon: 'info',
      disabled: false,
      onClick: () => {
        $commandManager.executeCommand('renameProgram', { $q }, machine.currentMachine.id, editor.program.programNo)
      },
    },
    {
      label: t('contextMenu.versionDetails'),
      shortcut: '',
      icon: 'info',
      disabled: false,
      onClick: () => {
        $commandManager.executeCommand('programVersionInfo', { $q }, {
          programNo: editor.program.programNo,
          name: editor.program.name,
        })
      },
    },
    {
      label: t('contextMenu.commandDetails'),
      shortcut: '',
      icon: 'info',
      disabled: !selectedCommandNo.value,
      onClick: () => {
        if (selectedCommandNo.value) {
          $commandManager.executeCommand('commandDetails', { $q }, selectedCommandNo.value)
        }
      },
    },
  ],
])

watch(locale, () => {
  form.value?.validate()
})

onBeforeMount(async () => {
  editor.isLoading = true

  if (machine.isMachineDisabled(machineId)) {
    await machine.selectFirstUsableMachine()
    notifyError(t('machineNotUsable', { machineId }))
    editor.isLoading = false
    return
  }

  await machine.loadMachine(machineId)
  await editor.fetchCommandTypes(machineId)
  await editor.refreshAllPrograms()

  if (!programNo || !editor.hasProgram(programNo)) {
    await machine.changeMachine(machineId)
    notifyError(t('programNotFound', { machineId, programNo }))
  }

  await editor.loadProgram(machineId, programNo)
  editor.isLoading = false
})
</script>

<template>
  <div class="q-pa-md select-none">
    <div v-if="editor.isLoading" class="loading-container bg-gray-3 bg-opacity-10 dark:bg-dark-2 dark:bg-opacity-10">
      <LoadingSpinner />
    </div>
    <QForm ref="form">
      <ProgramEditor />
    </QForm>

    <q-menu
      touch-position
      context-menu
      :transition-duration="0"
    >
      <ProgramContextMenu :items="contextMenuOptions" />
    </q-menu>
  </div>
</template>

<style scoped>
.loading-container {
  position: fixed;
  width: 100vw;
  height: 100vh;
  z-index: 50;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
