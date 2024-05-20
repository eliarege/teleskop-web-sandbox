<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import type { SortableOptions } from 'sortablejs'
import { PRG_STATE_COLORS } from '~/shared/constants'
import { useEditorStore } from '~/composables/editor'
import type { MachineCommand } from '~/shared/types'

const editor: EditorStore = useEditorStore()
const { t } = useI18n()
const { dark } = useQuasar()

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
    <div class="machine-command-list">
      <div class="px-5 e-div-y machine-command-list">
        <QItem
          v-for="command in filteredCommands"
          :key="command.commandNo"
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
      </div>
    </div>
    <div class="w-full bottom-0 p-3" :class="dark.isActive ? 'bg-dark-1' : 'bg-white'">
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
