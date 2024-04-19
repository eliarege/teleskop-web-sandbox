<script setup lang="ts">
import { useDataStore } from '../store/Datas'
import type { TableData } from '~/shared/types'

const router = useRouter()
const search = ref('')
const { t } = useI18n()
const store = useDataStore()
const machineTable = computed(() => {
  return store.machines.map((machine) => {
    return {
      ...machine,
      id: machine.id,
      name: machine.name ? machine.name : 'null',
      operator: machine.loggedInOperatorName
        ? machine.loggedInOperatorName
        : '-',
      program: machine.runningProgramName ? machine.runningProgramName : '-',
      batch: machine.runningBatchKey !== -1 ? machine.runningBatchKey : '-',
      alarm: machine.currentAlarmStatus ? machine.currentAlarmStatus : '-',
      starttime: machine.runningStartTime?.slice(11, -5) || '-',
    } as TableData
  })
})

function goTo(event: any) {
  router.push(`/details/${event.id}`)
}
const filterTableData = computed(() =>
  machineTable.value.filter(
    data =>
      !search.value
      || data.name.toLowerCase().includes(search.value.toLowerCase())
      || data.runningProgramName.toLowerCase().includes(search.value.toLowerCase())
      || data.loggedInOperatorName.toLowerCase().includes(search.value.toLowerCase()),
  ),
)
</script>

<template>
  <div>
    <ElTable
      :data="filterTableData"
      table-layout="auto"
      cell-class-name="cursor-pointer"
      @row-click="goTo"
    >
      <ElTableColumn
        :label="t('details.id')"
        prop="id"
        align="center"
      />
      <ElTableColumn align="right">
        <template #header>
          <ElInput
            v-model="search"
            size="small"
            placeholder="Type to search"
          />
        </template>
        <template #default>
          <ElTableColumn
            :label="t('table.label')"
            prop="name"
            align="center"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn
        :label="t('table.op')"
        prop="operator"
        align="center"
      />
      <ElTableColumn
        :label="t('table.batch-start')"
        prop="starttime"
        align="center"
      />
      <ElTableColumn
        :label="t('table.running-batch')"
        prop="batch"
        align="center"
      />
      <ElTableColumn
        :label="t('table.running-prog')"
        prop="program"
        align="center"
      />
      <ElTableColumn
        :label="t('table.alarms')"
        prop="alarm"
        align="center"
      />
    </ElTable>
  </div>
</template>
