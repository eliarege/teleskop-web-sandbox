<script setup lang="ts">
import { times } from 'lodash-es'
import { mdiMenu } from '@quasar/extras/mdi-v7'
import type { Command } from '~/shared/types'

const props = defineProps<{ commands: Command[], activeMachine: number, machines: { name: string, id: number }[] }>()
const emit = defineEmits(['close'])
const selectedMachine = defineModel({ required: true })
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

const breakpoints = useBreakpoints({
  sm: 900,
  md: 1350,
  lg: 1800,
  xl: 2150,
})
const sm = breakpoints.smallerOrEqual('sm')
const md = breakpoints.smallerOrEqual('md')
const lg = breakpoints.smallerOrEqual('lg')

const columnsLength = computed(() => {
  if (sm.value)
    return 1
  if (md.value)
    return 2
  if (lg.value)
    return 3
  return 4
})

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
const { width } = useWindowSize()
const isMobile = computed(() => width.value <= 767)
const machineModal = ref(false)
</script>

<template>
  <div class="alarm-container-height w-full">
    <div :class="isMobile ? 'flex-center' : 'grid grid-cols-[1fr_0.3fr] px-5'">
      <q-btn
        v-if="isMobile"
        no-caps
        dense
        flat
        :icon="mdiMenu"
        @click="machineModal = !machineModal"
      />
      <QDialog
        v-model="machineModal"
        full-height
      >
        <AlarmFilterSidebar
          v-model="selectedMachine"
          class="bg-white"
          :machines
        />
      </QDialog>
      <div>
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
      </div>

      <div class="flex-center whitespace-nowrap gap-3">
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
