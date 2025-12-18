<script setup lang="ts">
import { QForm } from 'quasar'
import ProgramEditor from '~/components/ProgramEditor.vue'
import { useEditorStore } from '~/composables/editor'
import { useContextBar } from '~/composables/useContextBar'
import type { ContextBarButtons, Machine, ProcessType, Program } from '~/shared/types'

const editor = useEditorStore()
const form = ref<QForm>()
const { t, locale } = useI18n()
const route = useRoute()
const $q = useQuasar()
const { $commandManager } = useNuxtApp()

const machineId = Number(route.params.machine_id)
const programNo = Number(route.params.program_no)

const ctrl = useKeyModifier('Control')

definePageMeta({
  path: '/machine/:machine_id/program/:program_no',
  roles: ['program-view'],
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
    visible: !editor.isTonello,
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
    || !editor.machine.commands.has(editor.selectedSteps[0]?.mainCommand.commandNo),
    onClick() {
      const command = editor.selectedSteps[0]?.mainCommand
      if (command.commandNo && editor.machine.commands.has(command.commandNo)) {
        $commandManager.executeCommand('commandDetails', { $q }, command.commandNo)
      }
    },
  },
  {
    label: editor.allStepExpanded ? t('menu.collapseAll') : t('menu.expandAll'),
    originalLabel: editor.allStepExpanded ? t('menu.collapseAll') : t('menu.expandAll'),
    tooltip: editor.allStepExpanded ? t('menu.collapseAll') : t('menu.expandAll'),
    shortcut: '',
    icon: editor.allStepExpanded ? 'expand_less' : 'expand_more',
    disable: editor.isLoading,
    visible: !editor.isTonello,
    onClick() {
      editor.allStepExpanded = !editor.allStepExpanded
    },
  },
])
useContextBar(buttons)

onKeyStroke('F2', (event: KeyboardEvent) => {
  event.preventDefault()
  editor.addStepToEnd(null)
})

onKeyStroke('F3', (event: KeyboardEvent) => {
  if (route.params.program_no && !editor.isTonello) {
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
  const { machine, program } = editor
  $commandManager.executeCommand('stepCommandGraph', { $q }, machine, program)
})

onKeyStroke(['F8'], (event: KeyboardEvent) => {
  event.preventDefault()
  const { machine, program, teleskopSettings } = editor
  const initialTemperature = teleskopSettings.initialTemperature
  $commandManager.executeCommand('tempTimeGraph', { $q }, machine, program, initialTemperature)
})

onKeyStroke(['Enter', 'NumpadEnter'], (event: KeyboardEvent) => {
  if (!isActiveElementEditable()) {
    event.preventDefault()
    editor.scrollPage(editor.selectedSteps[0].stepId, true)
  }
})

onKeyStroke(['Delete'], (event: KeyboardEvent) => {
  if (!isActiveElementEditable()) {
    event.preventDefault()
    editor.deleteStep()
  }
})

onKeyStroke(['ArrowUp'], (event: KeyboardEvent) => {
  if (!isActiveElementEditable()) {
    event.preventDefault()
  }

  const currentIndex = editor.program.steps.findIndex(x => x.stepId === editor.selectedSteps[0]?.stepId)
  if (currentIndex > 0)
    editor.selectStep(false, currentIndex - 1)
})

onKeyStroke(['ArrowDown'], (event: KeyboardEvent) => {
  if (!isActiveElementEditable()) {
    event.preventDefault()
  }

  const currentIndex = editor.program.steps.findIndex(x => x.stepId === editor.selectedSteps[0]?.stepId)
  if (currentIndex < editor.program.steps.length - 1)
    editor.selectStep(false, currentIndex + 1)
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
  if (ctrl.value && !isActiveElementEditable()) {
    event.preventDefault()
    editor.selectedSteps = editor.program.steps
  }
})

onKeyStroke(['C', 'c'], (event: KeyboardEvent) => {
  if (ctrl.value && !isActiveElementEditable()) {
    event.preventDefault()
    contextMenuStore.copyStep()
  }
})

onKeyStroke(['V', 'v'], (event: KeyboardEvent) => {
  if (ctrl.value && !isActiveElementEditable()) {
    event.preventDefault()
    contextMenuStore.pasteStep()
  }
})

// onKeyStroke(['R', 'r'], (event: KeyboardEvent) => {
//   if (ctrl.value) {
//     event.preventDefault()

//     const hasChanged = editor.hasProgramChanged()
//     if (hasChanged)
//       $commandManager.executeCommand('discardChanges', { $q })
//   }
// })

watch(locale, () => {
  form.value?.validate()
})

editor.isLoading = true
if (editor.machine.id !== machineId) {
  await editor.loadMachine(machineId)
  await editor.fetchCommandTypes(machineId)
  await editor.refreshAllPrograms()
}
await editor.loadProgram(machineId, programNo)
editor.isLoading = false

onBeforeRouteLeave(() => {
  const hasChanged = editor.hasProgramChanged()
  if (hasChanged) {
    $commandManager.executeCommand('unsavedChanges', { $q })
    return false
  } else {
    editor.errorIds.clear()
    return true
  }
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
