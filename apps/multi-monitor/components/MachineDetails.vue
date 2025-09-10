<script setup lang="ts">
import { format } from 'date-fns'
import type { PropType } from 'vue'
import type { QTableColumn } from 'quasar'
import { textTruncate } from '@teleskop/utils'
import type {
  MachineDataRaw,
  NewBatchLogs,
  NewInterventions,
} from '~/shared/types'
import { useDataStore } from '~~/store/Datas'

const props = defineProps({
  currentMachine: {
    type: Object as PropType<MachineDataRaw>,
    required: true,
  },
  maxValue: {
    type: Number,
    default: 140,
  },
  intervents: {
    type: Array as PropType<NewInterventions[]> | null,
    required: true,
  },
})

const { mt } = useProjectTranslations()
const store = useDataStore()
const { t, locale } = useI18n()
const tableShow = ref(false)

const { data: recipe, status: recipeStatus } = useFetch('/api/recipe', {
  query: {
    recipeJB: props.currentMachine.runningJobOrder,
    recipeID: props.currentMachine.id,
    teleskopType: store.isWashing ? 'washing' : 'normal',
  },
  default: () => [],
})
const { data: batchLogs, status: batchLogStatus } = useFetch('/api/machine_logs', {
  query: { machineId: props.currentMachine.id },
  default: () => [],
})
const { data: currentRunningIndex } = useFetch('/api/recipeRunningIndex', {
  method: 'GET',
  query: {
    batchKey: props.currentMachine.runningBatchKey,
  },
})
const refactoredBatchLogs = computed(() => {
  return batchLogs.value
    .filter(machine => machine.planKey)
    .map((logs) => {
      return {
        ...logs,
        newTime: logs.eventTime
          ? format(new Date(logs.eventTime), 'yyyy-MM-dd HH:mm:ss')
          : logs.eventTime,
      }
    }) as NewBatchLogs[] || []
})

const checkedNames = ref()
const sortedLogs = computed(() => {
  const activeLogs = refactoredBatchLogs.value.filter(a => a.planKey)
  if (checkedNames.value === 'Plan Key') {
    return activeLogs.sort((c, d) => (c.planKey < d.planKey ? -1 : 1))
  } else if (checkedNames.value === 'ID') {
    return activeLogs.sort((c, d) => (c.id < d.id ? -1 : 1))
  } else if (checkedNames.value === 'Event Time') {
    return activeLogs.sort((c, d) => (c.newTime < d.newTime ? -1 : 1))
  } else {
    return activeLogs
  }
})
const logTableFilter = ref()
const deg = (value: number) => (value / 180) * Math.PI

const columns = controlledComputed(locale, () => [
  { label: t('details.index'), name: 'recIndex', align: 'center' },
  { label: t('details.program'), name: 'program', align: 'center' },
  { label: t('details.number'), name: 'reqNumber', align: 'center' },
  { label: t('details.main-step'), name: 'mainStep', align: 'center' },
  { label: t('details.chem-code'), name: 'chemCode', align: 'center' },
  { label: t('details.material-name'), name: 'materialName', align: 'center' },
  { label: t('details.amount'), name: 'newAmount', align: 'center' },
  { label: t('details.recipeAmount'), name: 'newRecipeAmount', align: 'recipeAmount' },
] as QTableColumn[])

function unitFunc(param: number) {
  if (param === 3) {
    return 'GR'
  } else if (param === 5) {
    return 'KG'
  } else if (param === 6) {
    return 'LT'
  } else {
    return 'unknown'
  }
}
const autoRecipe = computed(() => {
  return recipe.value.map((val) => {
    return {
      ...val,
      recIndex: val.recIndex,
      program: `${val.recNo} - ${val.name}`,
      amount: Math.round(val.amount || 0),
      recipeAmount: Math.round(val.recipeAmount || 0),
      newAmount: `${val.amount?.toFixed(2).replace(/\.?0+$/, '')} ${unitFunc(val.unit)}`,
      newRecipeAmount: `${val.recipeAmount ? val.recipeAmount.toFixed(2).replace(/\.?0+$/, '') + unitFunc(val.unit) : ''}`,
    }
  })
})
const manuelRecipe = computed(() => {
  return recipe.value.map((val) => {
    return {
      ...val,
      recIndex: currentRunningIndex.value?.currentRunningPrgIndex === val.recIndex ? `> ${val.recIndex}` : val.recIndex,
      program: `${val.recNo} - ${val.name}`,
      amount: Math.round(val.amount || 0),
      newAmount: `${val.amount?.toFixed(2).replace(/\.?0+$/, '')} ${unitFunc(val.unit)}`,
      newRecipeAmount: `${val.recipeAmount ? val.recipeAmount.toFixed(2).replace(/\.?0+$/, '') + unitFunc(val.unit) : ''}`,
    }
  })
})

const erpVal = computed(() => {
  return props.currentMachine.erp
})
function closeModal() {
  tableShow.value = false
}
</script>

<template>
  <div class="wrapper">
    <div class="table-wrapper e-border w-f-o">
      <div v-if="recipeStatus === 'pending'" class="flex-center w-full h-full">
        <LoadingSpinner />
      </div>
      <div v-else class="table-body">
        <TeleskopTable
          :title="t('details.recipe-t-auto')"
          :data="autoRecipe"
          :columns
          align="center"
        >
          <template #columns="{ columns: cols }">
            <tr class="q-tr">
              <th
                v-for="(item, idx) in cols.slice(0, -1)"
                :key="idx"
              >
                {{ item.label }}
              </th>
              <th>
                <div class="w-full h-full flex-center flex-col gap-2">
                  <div>
                    <q-btn
                      outline
                      color="primary"
                      :label="t('details.btn-open')"
                      no-caps
                      @click="tableShow = !tableShow"
                    />
                  </div>
                  <div>
                    {{ cols[cols.length - 1].label }}
                  </div>
                </div>
              </th>
            </tr>
          </template>
        </TeleskopTable>
        <TeleskopTable
          :title="t('details.recipe-t-manuel')"
          :data="manuelRecipe"
          :columns
          align="center"
        />
      </div>
    </div>
    <div class="chart-wrapper e-border w-f-o">
      <div class="chart-body">
        <DGauge
          :model-value="currentMachine.currentTemperature"
          :arc-count="14"
          :min-value="0"
          :max-value="140"
          :min-angle="deg(-120)"
          :max-angle="deg(120)"
          :pad-angle="deg(2)"
          :min-duration="400"
          :max-duration="800"
          :inner-radius="18"
          :outer-radius="23"
          needle-color="red"
        />
      </div>
    </div>
    <div class="info-wrapper e-border w-f-o">
      <div class="title">
        {{ t("details.info") }}
      </div>
      <q-list
        separator
        dense
      >
        <q-item
          dense
          class="w-full h-full text-left"
        >
          <q-item-section no-wrap>
            {{ textTruncate(t("details.name"), 20).content }}
            <q-tooltip v-if="textTruncate(t('details.name'), 20).tooltip">
              {{ t("details.name") }}
            </q-tooltip>
          </q-item-section>
          <q-item-section>
            {{ currentMachine.name }}
          </q-item-section>
        </q-item>

        <q-item
          dense
          class="w-full h-full text-left"
        >
          <q-item-section no-wrap>
            {{ textTruncate(t("details.machine-cap"), 20).content }}
            <q-tooltip v-if="textTruncate(t('details.machine-cap'), 20).tooltip">
              {{ t("details.machine-cap") }}
            </q-tooltip>
          </q-item-section>
          <q-item-section>
            {{ currentMachine.machineCapacity }} (KG)
          </q-item-section>
        </q-item>

        <q-item
          dense
          class="w-full h-full text-left"
        >
          <q-item-section no-wrap>
            {{ textTruncate(t("details.order-no"), 20).content }}
            <q-tooltip v-if="textTruncate(t('details.order-no'), 20).tooltip">
              {{ t("details.order-no") }}
            </q-tooltip>
          </q-item-section>
          <q-item-section>
            {{ currentMachine.reqProgramNo }}
          </q-item-section>
        </q-item>

        <q-item
          v-for="(val, idx) in erpVal"
          :key="idx"
          dense
          class="w-full h-full text-left"
        >
          <q-item-section no-wrap>
            <q-tooltip v-if="textTruncate(mt(idx, currentMachine.id), 15).tooltip">
              {{ mt(idx, currentMachine.id) }}
            </q-tooltip>
            {{ textTruncate(mt(idx, currentMachine.id), 15).content }}
          </q-item-section>
          <q-item-section>
            {{ typeof val === 'number' ? val.toFixed(2).replace(/\.?0+$/, '') : val }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div class="intervention-wrapper e-border w-f-o">
      <div v-if="!intervents" class="absolute w-full h-full top-1/2 left-1/2 transform -translate-1/2">
        <LoadingSpinner />
      </div>
      <div class="title">
        {{ t("details.op-intervents") }}
      </div>
      <q-list separator>
        <q-item
          v-for="(item, idx) in intervents"
          :key="idx"
          dense
          class="w-full h-full text-center"
        >
          <q-item-section avatar>
            {{ item.newTime }}
          </q-item-section>
          <q-item-section>
            {{ item.explanation }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div v-if="batchLogStatus === 'pending'" class="w-full h-full grid-area-[logs] e-border rounded flex-center">
      <LoadingSpinner />
    </div>
    <div v-else class="log-wrapper e-border w-f-o">
      <QTable
        dense
        :columns="[
          { name: 'planKey', label: t('batchLogs.plan-key'), field: 'planKey', align: 'left' },
          { name: 'newTime', label: t('batchLogs.new-time'), field: 'newTime', align: 'left' },
          { name: 'jobOrder', label: t('batchLogs.job-order'), field: 'jobOrder', align: 'left' },
          { name: 'explanation', label: t('batchLogs.explanation'), field: 'explanation', align: 'left' },
          { name: 'programIndex', label: t('batchLogs.program-index'), field: 'programIndex', align: 'left' },
          { name: 'programNo', label: t('batchLogs.program-no'), field: 'programNo', align: 'left' },
          { name: 'recipeType', label: t('batchLogs.recipe-type'), field: 'recipeType', align: 'left' },
          { name: 'requestprogramIndex', label: t('batchLogs.request-program-index'), field: 'requestprogramIndex', align: 'left' },
          { name: 'status', label: t('batchLogs.status'), field: 'status', align: 'left' },
        ]"
        :no-data-label="t('batchLogs.no-data')"
        row-key="name"
        class="h-full w-full"
        :rows-per-page-options="[]"
        :rows="sortedLogs"
        :filter="logTableFilter"
      >
        <template #top>
          <div class="flex w-full">
            <q-input
              v-model="logTableFilter"
              borderless
              dense
              debounce="300"
              :placeholder="t('batchLogs.placeholder')"
            >
              <template #append>
                <div />
                <q-icon name="search" />
              </template>
            </q-input>

            <QSpace />

            <div class="flex gap-3">
              <div class="m-auto">
                {{ t('batchLogs.checked-names') }} {{ checkedNames }}
              </div>
              <div class="flex flex-col-reversed w-auto justify-center items-center">
                <q-radio
                  v-model="checkedNames"
                  val="ID"
                  label="ID"
                />
              </div>
              <div class="flex flex-col-reversed w-auto justify-center items-center">
                <q-radio
                  v-model="checkedNames"
                  val="Plan Key"
                  :label="t('batchLogs.plan-key')"
                />
              </div>
              <div class="flex flex-col-reversed w-auto justify-center items-center">
                <q-radio
                  v-model="checkedNames"
                  val="Event Time"
                  :label="t('batchLogs.new-time')"
                />
              </div>
            </div>
          </div>
        </template>
        <template #body="bodyProps">
          <q-tr :props="bodyProps">
            <q-td
              v-for="col in bodyProps.cols"
              :key="col.name"
              :props="bodyProps"
            >
              <div v-if="col.name === 'explanation'">
                <q-tooltip v-if="textTruncate(col.value, 60).tooltip">
                  {{ col.value }}
                </q-tooltip>
                {{ textTruncate(col.value, 60).content }}
              </div>
              <div v-else>
                {{ col.value }}
              </div>
            </q-td>
          </q-tr>
        </template>
      </QTable>
    </div>
  </div>
  <Teleport to="body">
    <div v-if="tableShow">
      <div class="modal-mask cursor-pointer" @click.stop="closeModal">
        <div class="modal-wrapper">
          <div class="modal-container cursor-default" @click.stop.prevent>
            <div class="bg-white flex flex-col w-full h-full">
              <TeleskopTable
                :title="t('details.recipe-t-auto')"
                :data="autoRecipe"
                :columns
                align="center"
              >
                <template #columns="{ columns: cols }">
                  <tr class="q-tr">
                    <th
                      v-for="(item, idx) in cols.slice(0, -1)"
                      :key="idx"
                    >
                      {{ item.label }}
                    </th>
                    <th>
                      <div class="w-full h-full flex-center flex-col">
                        <div>
                          <q-btn
                            outline
                            color="primary"
                            :label="t('details.btn-close')"
                            no-caps
                            @click="tableShow = !tableShow"
                          />
                        </div>
                        <br>
                        <div>
                          {{ cols[cols.length - 1].label }}
                        </div>
                      </div>
                    </th>
                  </tr>
                </template>
              </TeleskopTable>
              <TeleskopTable
                :title="t('details.recipe-t-manuel')"
                :data="manuelRecipe"
                :columns
                align="center"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="postcss">
th {
  width: 100px;
  border-width: 0 1px 0 1px;
  border-style: solid;
  border-color: #88888857;
}
td {
  width: 100px;
  border-width: 0 1px 0 1px;
  border-style: solid;
  border-color: #88888857;
}
.q-table--dense .q-table th:first-child,
.q-table--dense .q-table td:first-child {
  padding-left: 8px;
}
.q-table--dense .q-table th:last-child,
.q-table--dense .q-table td:last-child {
  padding-right: 8px;
}
.w-f-o {
  @apply w-full h-full overflow-auto;
}

.wrapper {
  height: calc(100vh - 65px);
  display: grid;
  grid-template-columns: 0.5fr 1fr 1fr 0.5fr;
  grid-template-rows: repeat(3, 1fr);
  grid-template-areas:
    'intervention table table info'
    'intervention table table info'
    'intervention logs logs chart';
  @apply grid gap-x-3 gap-y-1 w-full text-center max-w-1920px px-2 pb-1 text-black;
}

.table-wrapper {
  grid-area: table;
  height: -webkit-fill-available;
  @apply rounded;
}

.info-wrapper {
  grid-area: info;
  height: -webkit-fill-available;
  @apply rounded overflow-auto;

  .info {
    @apply;

    .info-body {
      @apply border-t border-white text-left;

      .info-col {
        @apply mt-3 p-3px pl-5;
      }
    }
  }
}

.chart-wrapper {
  grid-area: chart;
  @apply w-full h-full rounded;

  .chart-body {
    @apply w-full h-full;
  }
}

.intervention-wrapper {
  grid-area: intervention;
  @apply rounded overflow-auto relative;

  .command-items {
    @apply flex flex-row justify-center items-center gap-3 w-full h-full;

    :is(span) {
      @apply p-3;
    }
  }
}

.log-wrapper {
  grid-area: logs;
  height: -webkit-fill-available;
  @apply rounded flex justify-between w-full h-full overflow-auto;

  ::slotted(.content) {
    background-color: rgb(48, 76, 76);
  }

  .log__item {
    @apply w-full h-full;
  }
}

.title {
  @apply w-full rounded font-bold;
}

.modal-mask {
  background: rgba(0, 0, 0, 0.7);
  @apply fixed z-2001 justify-center left-0 top-0 w-full h-full;

  .modal-wrapper {
    @apply flex justify-center items-center h-full max-w-1920px w-full overflow-auto;

    .modal-container {
      @apply rounded-l w-95/100 m-auto;
    }
  }
}

@media (min-width: 735px) and (max-width: 1350px) {
  .wrapper {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 15px 100px 1fr;
    grid-template-areas:
      'header header header'
      'table table table'
      'table table table'
      'chart intervention intervention'
      'info intervention intervention'
      'logs logs logs';
    @apply grid w-full h-full max-w-full px-10;

    .table-wrapper {
      @apply h-min;
    }

    .info-wrapper {
      @apply h-full;
    }

    .chart-wrapper {
      @apply h-full;
    }

    .intervention-wrapper {
      @apply h-full;
    }
  }
}

@media screen and (max-width: 735px) {
  .wrapper {
    @apply flex flex-col w-full h-full max-h-full max-w-full;

    .table-wrapper {
      @apply w-full h-full min-h-100;

      .custom-btn {
        @apply hidden;
      }
    }

    .intervention-wrapper {
      .op-commands {
        .command-items {
          @apply flex flex-row justify-center items-center gap-1 w-full h-full;

          :is(span) {
            @apply p-1;
          }
        }
      }
    }
  }
}
</style>
