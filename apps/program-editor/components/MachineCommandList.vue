<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import type { SortableEvent, SortableOptions } from 'sortablejs'
import { isDef } from '@teleskop/utils'
import { useEditorStore } from '~/composables/editor'
import type { MachineCommand, ProgramStepCommand } from '~/shared/types'

const $q = useQuasar()
const { t } = useI18n()
const editor = useEditorStore()
const machine = useMachineStore()
const { mt } = useProjectTranslations()
const { $commandManager } = useNuxtApp()

const sortableOptions = computed<SortableOptions>(() => ({
  sort: false,
  forceFallback: true,
  fallbackClass: 'sortable-fallback',
  group: {
    name: 'machine-command-list',
    pull: 'clone',
    put: false,
  },
}))

const route = useRoute()
const isProgramPage = computed(() => route.path.includes('program'))
const searchQuery = ref('')
const { notifyError } = useNotify()

const translatedCommands = computed(() => {
  const commandsArray: MachineCommand[] = Array.from(machine.currentMachine.commands.values())
  return commandsArray.map(command => ({
    ...command,
    name: mt(command.name, machine.currentMachine.id),
    icon: machine.getCommandIcon(command.commandNo),
  }))
})

const filteredCommands = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return translatedCommands.value
    .filter(({ commandNo, name }) => (
      commandNo.toString().includes(query)
      || name.toLowerCase().includes(query)
    ),
      // && command.commandType === 0,
    )
})

let draggedCommand: any = null

function onDragStart(event: SortableEvent) {
  if (isDef(event.oldIndex)) {
    draggedCommand = filteredCommands.value[event.oldIndex]
  }
}

function onDragEnd(event: SortableEvent) {
  if (event.pullMode === 'clone' && isDef(event.newIndex) && event.to !== event.from && draggedCommand) {
    // Remove cloned element from target
    event.to.removeChild(event.item)

    const isParallelCommand = event.to.classList.contains('parallel-commands')
    if (isParallelCommand) {
      const stepIndex = Number.parseInt(event.to.getAttribute('data-index') || '-1')
      if (stepIndex > -1) {
        const isDuplicate = validateParallelCommands(stepIndex)
        if (!isDuplicate) {
          editor.newParallelStepCommand(draggedCommand.commandNo, stepIndex, event.newIndex)
          $commandManager.executeCommand('applyParallelCommand', { $q }, 'add', draggedCommand.commandNo, stepIndex)
        } else {
          notifyError(t('error.notSameCommand'))
        }
      }
    } else {
      editor.addStep(draggedCommand.commandNo, event.newIndex)
    }

    draggedCommand = null
  }
}

function validateParallelCommands(stepIndex: number): boolean {
  const step = editor.program.steps[stepIndex]
  return step.parallelCommands.some((command: ProgramStepCommand) => command.commandNo === draggedCommand.commandNo)
}
</script>

<template>
  <div class="machine-command-list-container select-none">
    <QInput
      v-if="isProgramPage"
      v-model="searchQuery"
      :label="t('searchCommand')"
      class="px-5 pt-5 pb-5 sticky-input"
      dense
      outlined
    />
    <Sortable
      v-if="isProgramPage"
      :list="filteredCommands"
      class="px-5 pb-10 e-div-y machine-command-list"
      :item-key="item => item.commandNo"
      :options="sortableOptions"
      @start="onDragStart"
      @end="onDragEnd"
    >
      <template #item="{ element: command }: { element: any }">
        <QItem
          class="machine-command"
          dense
          tag="span"
          clickable
          @dblclick="editor.addStepToEnd(command.commandNo)"
        >
          <QItemSection>
            <QItemLabel class="flex items-center gap-2">
              <div v-if="command.icon">
                <UnoIcon
                  class="icon"
                  :class="command.icon.name"
                  :style="{ color: command.icon.color }"
                />
              </div>
              <div v-else class="inline-block w-4 h-4" />
              <span class="font-bold">{{ command.commandNo }}</span>
              <TruncatedText
                :text="`/ ${mt(command.name, machine.currentMachine.id)}`"
                :max-length="24"
              />
            </QItemLabel>
          </QItemSection>
        </QItem>
      </template>
    </Sortable>
  </div>
</template>

<style lang="postcss" scoped>
.machine-command {
  @apply space-y-1 px-4 transition-none;
}
.program-editor .machine-command {
  @apply e-selected py-15px pl-40px;
}
.program-editor .machine-command-icon {
  @apply hidden;
}
.sticky-input {
  @apply sticky;
  top: 0;
  z-index: 10;
  background-color: inherit;
}
.machine-command-list-container {
  @apply h-full;
  @apply flex flex-col;
  @apply relative;
  @apply overflow-auto;
}
.machine-command-list {
  @apply flex-1;
  @apply overflow-auto;
  @apply h-full;
}

/* Drag fallback element (the element being dragged) */
:global(.sortable-fallback) {
  @apply opacity-90 shadow-lg;
}
</style>
