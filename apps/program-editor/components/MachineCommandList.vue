<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import type { SortableEvent, SortableOptions } from 'sortablejs'
import { isDef } from '@teleskop/utils'
import { useEditorStore } from '~/composables/editor'
import type { MachineCommand, ProgramStepCommand } from '~/shared/types'

const editor = useEditorStore()
const { mt } = useProjectTranslations()
const { t } = useI18n()
const $q = useQuasar()
const { $commandManager } = useNuxtApp()

const sortableOptions = computed<SortableOptions>(() => ({
  sort: false,
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
  const commandsArray: MachineCommand[] = Array.from(editor.machine.commands.values())
  return commandsArray.map(command => ({
    ...command,
    name: mt(command.name, editor.machine.id),
    icon: editor.getCommandIcon(command.commandNo),
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
    const parent = event.item.parentElement!
    parent.removeChild(event.item)

    const isParallelCommand = parent.classList.contains('parallel-commands') || false
    if (isParallelCommand) {
      const index = Number.parseInt(parent.getAttribute('data-index') || '-1')
      if (index > -1) {
        const res = validateParallelCommands(index)
        if (!res) {
          editor.newParallelStepCommand(draggedCommand.commandNo, index)
          $commandManager.executeCommand('moveParallelStep', { $q }, 'add', draggedCommand.commandNo)
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
                :text="`/ ${mt(command.name, editor.machine.id)}`"
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
.parallel-commands .machine-command {
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
</style>
