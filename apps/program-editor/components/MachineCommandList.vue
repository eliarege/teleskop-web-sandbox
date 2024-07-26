<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import { useQuasar } from 'quasar'
import type { SortableEvent, SortableOptions } from 'sortablejs'
import { isDef } from 'utils'
import { ProgramStateColors } from '~/shared/constants'
import { useEditorStore } from '~/composables/editor'
import type { MachineCommand } from '~/shared/types'

const editor = useEditorStore()
const { t } = useI18n()
const { dark } = useQuasar()

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
const filteredCommands = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const commandsArray: MachineCommand[] = editor.machine?.commands ? Array.from(editor.machine?.commands.values()) : []
  return commandsArray.filter(command => (
    command.commandNo.toString().includes(query)
    || command.name.toLowerCase().includes(query)
  ),
  // && command.commandType === 0,
  )
})

const programStatus = computed(() => [
  { label: t('programStatusInfo.noChanges'), color: dark.isActive ? ProgramStateColors.NO_CHANGES_DARK : ProgramStateColors.NO_CHANGES },
  { label: t('programStatusInfo.onlyOnTeleskop'), color: ProgramStateColors.EXISTS_ONLY_ON_DATABASE },
  { label: t('programStatusInfo.onlyOnController'), color: ProgramStateColors.EXISTS_ONLY_ON_CONTROLLER },
  { label: t('programStatusInfo.changedOnTeleskop'), color: ProgramStateColors.CHANGED_ON_TELESKOP },
  { label: t('programStatusInfo.changedOnMachine'), color: ProgramStateColors.CHANGED_ON_MACHINE },
])

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
        editor.newParallelStepCommand(draggedCommand.commandNo, index)
      }
    } else {
      editor.newStepCommand(draggedCommand.commandNo, event.newIndex - 1)
    }

    draggedCommand = null
  }
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
          @dblclick="editor.newStepCommand(command.commandNo, editor.program.steps.length - 1)"
        >
          <QItemSection>
            <QItemLabel>
              <span class="font-bold">{{ command.commandNo }}</span> / {{ command.name }}
            </QItemLabel>
          </QItemSection>
        </QItem>
      </template>
    </Sortable>
    <div
      v-if="!isProgramPage"
      class="w-full bottom-0 p-3 absolute"
      :class="dark.isActive ? 'bg-dark-2' : 'bg-white'"
    >
      <div v-for="stat in programStatus" :key="stat.color">
        <div :style="{ color: stat.color }">
          {{ stat.label }}
        </div>
      </div>
    </div>
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
