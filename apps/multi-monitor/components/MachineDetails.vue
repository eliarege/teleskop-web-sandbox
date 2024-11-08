<script setup lang="ts">
import type { PropType } from 'vue'
import { LoadingSpinner } from '@teleskop/ui'
import type {
  MachineDataRaw,
  NewBatchLogs,
  NewInterventions,
  NewRecipe,
  Recipe,
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

const router = useRouter()
const store = useDataStore()
const { t, locale } = useI18n()
const tableShow = ref(false)

const { data: recipe } = useFetch('/api/recipe', {
  query: {
    recipeJB: props.currentMachine.runningJobOrder,
    recipeID: props.currentMachine.id,
    teleskopType: store.settings?.washing ? 'washing' : 'normal',
  },
})
const { data: batchLogs } = useFetch('/api/machine_logs', {
  query: { machineId: props.currentMachine.id },
})
const refactoredBatchLogs = computed(() => {
  return batchLogs.value
    ?.filter(machine => machine.planKey)
    .map((logs) => {
      return {
        ...logs,
        newTime: logs.eventTime
          ? logs.eventTime.toString().slice(0, -5).replace('T', ' ')
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
const groupables = [
  { key: 'recIndex', index: 0 },
  { key: 'program', index: 1 },
  { key: 'reqNumber', index: 2 },
  { key: 'mainStep', index: 3 },
] as { key: keyof Recipe, index: number }[]
const columns = controlledComputed(locale, () => [
  { label: t('details.index'), prop: 'recIndex', align: 'center', showOverflowTooltip: true },
  { label: t('details.program'), prop: 'program', align: 'center', showOverflowTooltip: true },
  { label: t('details.number'), prop: 'reqNumber', align: 'center', showOverflowTooltip: true },
  { label: t('details.main-step'), prop: 'mainStep', align: 'center', showOverflowTooltip: true },
  { label: t('details.chem-code'), prop: 'chemCode', align: 'center', showOverflowTooltip: true },
  { label: t('details.material-name'), prop: 'materialName', align: 'center', showOverflowTooltip: true },
  { label: t('details.amount'), prop: 'newAmount', align: 'center', showOverflowTooltip: true },
] as { label: string, prop: string, align: 'left' | 'right' | 'start' | 'end' | 'center', showOverflowTooltip: boolean }[])

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
  return recipe.value?.map((val) => {
    return {
      ...val,
      phaseIndex: val.phaseIndex! + 1,
      program: `${val.recNo} - ${val.name}`,
      amount: val.amount,
      newAmount: `${val.amount} ${unitFunc(val.unit)}`,
    } as NewRecipe
  })
})

const manuelRecipe = computed(() => {
  return recipe.value?.map((val) => {
    return {
      ...val,
      program: `${val.recNo} - ${val.name}`,
      amount: Math.round(val.amount || 0),
      newAmount: `${val.amount} ${unitFunc(val.unit)}`,
    } as NewRecipe
  })
})

const erpVal = computed(() => {
  return props.currentMachine.erp
})
function closeModal() {
  tableShow.value = false
}

const { width: windowWidth } = useWindowSize()
</script>

<template>
  <div class="wrapper">
    <ElScrollbar class="table-wrapper e-border">
      <div class="table-body">
        <RecipeTable
          show
          :title="t('details.recipe-t-auto')"
          is-first
          has-object-span-method
          :full-screen="true"
          :full-screen-button-props="{
            buttonText: t('details.btn-open'),
            plain: true,
            color: '#0d94fc',
          }"
          :groupables="groupables"
          :rows="autoRecipe || []"
          :columns="columns"
          :empty-text="t('details.empty-text')"
          chem-class="green-class"
          dyeing-class="normal-class"
          @fullscreen="tableShow = !tableShow"
        />
        <div v-if="recipe?.length">
          <RecipeTable
            show
            :title="t('details.recipe-t-manuel')"
            :is-first="false"
            has-object-span-method
            :full-screen="false"
            :full-screen-button-props="{
              buttonText: t('details.btn-open'),
              plain: true,
              color: '#0d94fc',
            }"
            :groupables="groupables"
            :rows="manuelRecipe || []"
            :columns="columns"
            :empty-text="t('details.empty-text')"
            chem-class="green-class"
            dyeing-class="normal-class"
          />
        </div>
      </div>
    </ElScrollbar>
    <ElScrollbar class="chart-wrapper e-border">
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
    </ElScrollbar>

    <ElScrollbar class="info-wrapper e-border">
      <div class="info">
        <div class="title">
          {{ t("details.info") }}
        </div>
        <div class="info-body">
          <div class="info-col">
            <span>
              {{ t("details.name") }}:
              {{ currentMachine.name }}
            </span>
          </div>
          <div class="info-col">
            <span>
              {{ t("details.machine-cap") }}:
              {{ currentMachine.machineCapacity }} (KG)
            </span>
          </div>
          <div class="info-col">
            <span>
              {{ t("details.order-no") }}:
              {{ currentMachine.reqProgramNo }}
            </span>
          </div>
          <div
            v-for="(val, idx) in erpVal"
            :key="idx"
            class="info-col"
          >
            {{ idx }}: {{ val }}
          </div>
        </div>
      </div>
    </ElScrollbar>
    <ElScrollbar class="command-wrapper relative">
      <div v-if="!intervents" class="absolute w-full h-full top-1/2 left-1/2 transform -translate-1/2">
        <LoadingSpinner />
      </div>
      <div class="op-commands">
        <div class="title">
          {{ t("details.op-intervents") }}
        </div>
        <div
          v-for="(item, idx) in intervents"
          :key="idx"
          class="flex flex-col w-full h-full"
        >
          <div class="command-items">
            <span>
              {{ item.newTime }}
            </span>
            <span class="flex justify-center w-full">
              {{ item.explanation }}
            </span>
          </div>
        </div>
      </div>
    </ElScrollbar>
    <div class="log-wrapper">
      <div class="log__item e-border">
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
        </QTable>
      </div>
    </div>
  </div>
  <Teleport to="body">
    <div v-if="tableShow">
      <div class="modal-mask cursor-pointer" @click.stop="closeModal">
        <div class="modal-wrapper">
          <div class="modal-container cursor-default" @click.stop.prevent>
            <div class="bg-white flex flex-col w-full h-full">
              <RecipeTable
                show
                :title="t('details.recipe-t-auto')"
                is-first
                has-object-span-method
                full-screen
                :full-screen-button-props="{
                  buttonText: t('details.btn-close'),
                  plain: true,
                  color: '#0d94fc',
                }"
                :groupables="groupables"
                :rows="autoRecipe || []"
                :columns="columns"
                :empty-text="t('details.empty-text')"
                chem-class="green-class"
                dyeing-class="normal-class"
                @fullscreen="tableShow = false"
              />
              <RecipeTable
                show
                :title="t('details.recipe-t-manuel')"
                :is-first="false"
                has-object-span-method
                :full-screen="false"
                :groupables="groupables"
                :rows="manuelRecipe || []"
                :columns="columns"
                :empty-text="t('details.empty-text')"
                chem-class="green-class"
                dyeing-class="normal-class"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="postcss">
.normal-class {
  background: scroll !important;
}

.green-class {
  background: rgba(40, 220, 40, 0.6) !important;
}

.wrapper {
  height: calc(100vh - 65px);
  display: grid;
  grid-template-columns: 0.5fr 1fr 1fr 0.5fr;
  grid-template-rows: repeat(3, 1fr);
  grid-template-areas:
    'operator table table info'
    'operator table table info'
    'operator logs logs chart';
  @apply grid gap-x-3 gap-y-1 w-full text-center max-w-1920px px-2 pb-1 text-black;
}

.table-wrapper {
  grid-area: table;
  height: -webkit-fill-available;
  @apply rounded-2xl shadow shadow-gray-700/50 shadow-lg;
}

.info-wrapper {
  grid-area: info;
  height: -webkit-fill-available;
  @apply rounded-2xl overflow-auto shadow shadow-gray-700/50 shadow-lg shadow;

  .info {
    @apply text-lg;

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
  @apply w-full h-full rounded-2xl shadow shadow-gray-700/50 shadow-lg;

  .chart-body {
    @apply w-full h-full;
  }
}

.command-wrapper {
  grid-area: operator;
  @apply e-border rounded-2xl shadow shadow-gray-700/50 shadow-lg overflow-auto relative;

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
  @apply rounded-2xl border border-gray-500 flex justify-between w-full  shadow shadow-gray-700/50 shadow-lg overflow-auto;

  ::slotted(.content) {
    background-color: rgb(48, 76, 76);
  }

  .log__item {
    @apply w-full h-full;
  }
}

.title {
  @apply text-black font-extrabold w-full rounded-2xl;
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
      'chart operator operator'
      'info operator operator'
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

    .command-wrapper {
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

    .command-wrapper {
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
