<script setup lang="ts">
import { QForm } from 'quasar'
import LoadingSpinner from '../../../../packages/ui/components/LoadingSpinner.vue'
import ProgramEditor from '~/components/ProgramEditor.vue'
import { useEditorStore } from '~/composables/editor'
import { useContextBar } from '~/composables/useContextBar'
import type { ContextBarButtons } from '~/shared/types'

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
  // {
  //   label: t('menu.print'),
  //   originalLabel: t('menu.print'),
  //   tooltip: t('menu.print'),
  //   shortcut: 'Ctrl+P',
  //   icon: 'print',
  //   disable: editor.isLoading,
  //   onClick() {
  //     $commandManager.executeCommand('printProgram', { $q })
  //   },
  // },
  {
    label: t('menu.save'),
    originalLabel: t('menu.save'),
    tooltip: t('menu.save'),
    shortcut: 'Ctrl+S',
    icon: 'save',
    disable: editor.isLoading,
    onClick: async () => {
      await editor.onSubmit()
    },
  },
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
  {
    label: t('menu.reset'),
    originalLabel: t('menu.reset'),
    tooltip: t('menu.reset'),
    shortcut: 'Ctrl+R',
    icon: 'refresh',
    disable: !editor.hasProgramChanged() || editor.isLoading,
    onClick() {
      const hasChanged = editor.hasProgramChanged()
      if (hasChanged)
        $commandManager.executeCommand('discardChanges', { $q })
    },
  },
  {
    label: t('menu.newStep'),
    originalLabel: t('menu.newStep'),
    tooltip: t('menu.newStep'),
    shortcut: 'F2',
    icon: 'add_circle_outline',
    disable: editor.isLoading,
    onClick() {
      editor.addStep()
    },
  },
  {
    label: t('menu.newParallelStep'),
    originalLabel: t('menu.newParallelStep'),
    tooltip: t('menu.newParallelStep'),
    shortcut: 'F3',
    icon: 'add_circle_outline',
    disable: editor.isLoading,
    onClick() {
      editor.newParallelStep()
    },
  },
  {
    label: t('menu.deleteStep'),
    originalLabel: t('menu.deleteStep'),
    tooltip: t('menu.deleteStep'),
    shortcut: 'Del',
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
    label: editor.allStepExpanded ? t('menu.collapseAll') : t('menu.expandAll'),
    originalLabel: editor.allStepExpanded ? t('menu.collapseAll') : t('menu.expandAll'),
    tooltip: editor.allStepExpanded ? t('menu.collapseAll') : t('menu.expandAll'),
    shortcut: '',
    icon: editor.allStepExpanded ? 'expand_less' : 'expand_more',
    disable: editor.isLoading,
    onClick() {
      editor.allStepExpanded = !editor.allStepExpanded
    },
  },
])
useContextBar(buttons)

onKeyStroke('F2', (event: KeyboardEvent) => {
  event.preventDefault()
  editor.addStep()
})

onKeyStroke('F3', (event: KeyboardEvent) => {
  if (route.params.program_no) {
    event.preventDefault()
    editor.newParallelStep()
  }
})

onKeyStroke(['F7'], (event: KeyboardEvent) => {
  event.preventDefault()
  $commandManager.executeCommand('stepCommandGraph', { $q })
})

onKeyStroke(['F8'], (event: KeyboardEvent) => {
  event.preventDefault()
  $commandManager.executeCommand('tempTimeGraph', { $q })
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
  if (isActiveElementEditable())
    return

  event.preventDefault()

  const currentIndex = editor.program.steps.findIndex(x => x.stepId === editor.selectedSteps[0]?.stepId)
  const stepIndex = currentIndex > 0 ? currentIndex - 1 : editor.program.steps.length - 1
  editor.selectedSteps = [editor.program.steps[stepIndex]]

  editor.scrollPage(editor.selectedSteps[0].stepId)
})

onKeyStroke(['ArrowDown'], (event: KeyboardEvent) => {
  if (isActiveElementEditable())
    return

  event.preventDefault()

  const currentIndex = editor.program.steps.findIndex(x => x.stepId === editor.selectedSteps[0]?.stepId)
  const stepIndex = between(currentIndex + 1, 0, editor.program.steps.length - 1) ? currentIndex + 1 : currentIndex
  editor.selectedSteps = [editor.program.steps[stepIndex]]

  editor.scrollPage(editor.selectedSteps[0].stepId)
})

onKeyStroke('Escape', (event: KeyboardEvent) => {
  event.preventDefault()
  editor.selectedSteps = []
})

onKeyStroke(['S', 's'], async (event: KeyboardEvent) => {
  if (event.ctrlKey && !isActiveElementEditable()) {
    event.preventDefault()
    await editor.onSubmit()
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

onKeyStroke(['R', 'r'], (event: KeyboardEvent) => {
  if (ctrl.value) {
    event.preventDefault()

    const hasChanged = editor.hasProgramChanged()
    if (hasChanged)
      $commandManager.executeCommand('discardChanges', { $q })
  }
})

watch(locale, () => {
  form.value?.validate()
})

editor.isLoading = true
await editor.fetchTeleskopSettings()
if (editor.machine.id !== machineId)
  await editor.fetchMachine(machineId)
await editor.fetchCommandTypes(machineId)
await editor.fetchAllProcessTypes()
await editor.fetchProgram(machineId, programNo)
editor.isLoading = false

onBeforeRouteLeave(() => {
  const hasChanged = editor.hasProgramChanged()
  if (hasChanged) {
    $commandManager.executeCommand('discardChanges', { $q })
    return false
  } else {
    return true
  }
})
</script>

<template>
  <div class="q-pa-md select-none">
    <div v-if="editor.isLoading" class="loading-container bg-gray-3 bg-opacity-10 dark:bg-dark-2 dark:bg-opacity-10">
      <LoadingSpinner :has-background="false" />
    </div>
    <QForm ref="form">
      <DevOnly>
        <div class="flex flex-col color-gray-5 text-3">
          <span> {{ `selectedStep: ${editor.selectedSteps.map(x => x?.stepId)}` }} </span>
          <span> {{ `copiedSteps: ${contextMenuStore.getCopiedStepsValues(editor.machine.id, editor.program.programNo)?.steps.map(x => x?.stepId) || ''}` }} </span>
          <span> {{ `errorIds: ${Array.from(editor.errorIds)}` }} </span>
        </div>
      </DevOnly>
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
