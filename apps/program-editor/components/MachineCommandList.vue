<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import type { SortableEvent, SortableOptions } from 'sortablejs'
import { isDef } from 'utils'
import { PRG_STATE_COLORS } from '~/shared/constants'
import { useEditorStore } from '~/composables/editor'
import type { MachineCommand } from '~/shared/types'

const editor = useEditorStore()
const { t } = useI18n()
const { dark } = useQuasar()

const sortableOptions = computed<SortableOptions>(() => ({
  disabled: !editor.isDragging,
  sort: false,
  group: {
    name: 'machine-command-list',
    pull: 'clone',
    put: false,
  },
}))

const searchQuery = ref('')
const filteredCommands = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const commandsArray = Array.from(editor.machineCommands.values())
  return commandsArray.filter(command =>
    command.commandNo.toString().includes(query)
    || command.name.toLowerCase().includes(query),
  ) as MachineCommand[]
})

const programStatus = [
  { label: t('programStatusInfo.noChanges'), color: PRG_STATE_COLORS.NO_CHANGES },
  { label: t('programStatusInfo.onlyOnTeleskop'), color: PRG_STATE_COLORS.EXISTS_ONLY_ON_DATABASE },
  { label: t('programStatusInfo.onlyOnController'), color: PRG_STATE_COLORS.EXISTS_ONLY_ON_CONTROLLER },
  { label: t('programStatusInfo.changedOnTeleskop'), color: PRG_STATE_COLORS.CHANGED_ON_TELESKOP },
  { label: t('programStatusInfo.changedOnMachine'), color: PRG_STATE_COLORS.CHANGED_ON_MACHINE },
]

let draggedCommand: any = null

function onDragStart(event: SortableEvent) {
  if (isDef(event.oldIndex)) {
    draggedCommand = editor.machineCommands.get(event.oldIndex + 1)
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
  <div class="machine-command-list-container">
    <QInput
      v-if="editor.machineCommands.size"
      v-model="searchQuery"
      :label="t('searchCommand')"
      class="px-5 pt-5 pb-5 sticky-input"
      dense
      outlined
    />
    <Sortable
      :list="filteredCommands"
      class="px-5 e-div-y machine-command-list"
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
      v-if="!editor.machineCommands.size"
      class="w-full bottom-0 p-3"
      :class="dark.isActive ? 'bg-dark-1' : 'bg-white'"
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
}
.machine-command-list {
  @apply flex-1;
  @apply overflow-auto;
  @apply h-full;
}
</style>
