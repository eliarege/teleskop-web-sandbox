<script setup lang="ts">
import { times } from 'lodash-es'
import type { Command } from '~/shared/types'

const props = defineProps<{ commands: Command[], activeMachine: number }>()
const emit = defineEmits(['close'])
const { t } = useI18n()
const commandSearch = ref('' as string)

const onlyShowDisabledAlarms = ref(0) // 0: hepsini, 1: showOnScreen = true, 2: showOnScreen = false

const filteredCommands = computed(() => {
  let commands = props.commands

  if (onlyShowDisabledAlarms.value === 1) {
    commands = commands.map(command => ({
      ...command,
      alarms: command.alarms.filter(alarm => alarm.showOnScreen),
    })).filter(command => command.alarms.length > 0)
  } else if (onlyShowDisabledAlarms.value === 2) {
    commands = commands.map(command => ({
      ...command,
      alarms: command.alarms.filter(alarm => !alarm.showOnScreen),
    })).filter(command => command.alarms.length > 0)
  }

  if (commandSearch.value !== '') {
    commands = commands.filter(a =>
      a.commandName.toLowerCase().includes(commandSearch.value.toLowerCase())
      || a.commandNo.toString().includes(commandSearch.value),
    )
  }

  return commands
})

const columnsLength = ref(3)

const commandColumns = computed(() => filteredCommands.value.reduce((a, b, i) => {
  a[i % a.length].push(b)
  return a
}, [...times(columnsLength.value, () => [] as Command[])]))

const filterLabel = computed(() => {
  switch (onlyShowDisabledAlarms.value) {
    case 0:
      return t('alarm.filter.showAll') // 'Tümünü Göster'
    case 1:
      return t('alarm.filter.active') // 'Sadece Aktifler'
    case 2:
      return t('alarm.filter.inactive') // 'Sadece Pasifler'
    default:
      return t('alarm.filter.showAll') // 'Tümünü Göster'
  }
})

const filterIcon = computed(() => {
  switch (onlyShowDisabledAlarms.value) {
    case 0:
      return 'filter_list'
    case 1:
      return 'check_circle'
    case 2:
      return 'cancel'
    default:
      return 'filter_list'
  }
})
</script>

<template>
  <div class="alarm-container-height">
    <div class="grid grid-cols-[1fr_0.1fr_0.2fr] px-5">
      <q-input
        v-model="commandSearch"
        :label="t('alarm.commandSearch')"
        dense
        flat
        class="px-3"
      >
        <template #append>
          <q-icon
            v-if="commandSearch !== ''"
            name="close"
            class="cursor-pointer"
            @click="commandSearch = ''"
          />
          <q-icon name="search" />
        </template>
      </q-input>
      <q-space />
      <div class="flex-center">
        <q-btn
          no-caps
          dense
          outline
          :icon="filterIcon"
          :label="filterLabel"
          class="w-full!"
          @click="onlyShowDisabledAlarms = (onlyShowDisabledAlarms + 1) % 3"
        />
        <q-btn
          icon="close"
          flat
          dense
          max-w-10
          rounded
          @click="emit('close')"
        />
      </div>
    </div>

    <q-list class="command-columns">
      <div
        v-for="(column, index) in commandColumns"
        :key="index"
        class="space-y-3"
      >
        <q-expansion-item
          v-for="item in column"
          :key="`${index}-${item.commandNo}`"
          default-opened
          switch-toggle-side
          :label="`${item.commandNo} - ${item.commandName}`"
          class="border-1 rounded-2xl font-bold h-min overflow-hidden"
        >
          <AlarmFilterCardContent
            :active-machine
            :alarms="item.alarms || []"
            :command-no="item.commandNo"
          />
        </q-expansion-item>
      </div>
    </q-list>
  </div>
</template>

<style scoped lang="postcss">
.command-columns {
  display: grid;
  grid-template-columns: repeat(v-bind(columnsLength), 1fr);
  @apply gap-3 p-2;
}
</style>
