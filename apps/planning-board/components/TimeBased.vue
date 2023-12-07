<!-- eslint-disable no-new -->
<script setup lang="ts">
import type { DragHelperConfig, GridConfig, SchedulerPro, SchedulerProConfig } from '@bryntum/schedulerpro-trial'
import { DateField, DateHelper, DatePicker, Label, PanelCollapser, Splitter, Toast } from '@bryntum/schedulerpro-trial'
import { EliarModal } from 'ui'
import { Drag, Schedule, Task, UnplannedGrid } from '~/lib/bryntum'
import type { UnplannedEvents, UnplannedEventsRaw } from '~/shared/types'

const currentTime = useNow({ interval: 1000 })
const router = useRouter()

const startDate = ref('2022/07/01')
const endDate = ref('2022/07/07')

const schedulerDateModel = ref({
  from: startDate.value,
  to: endDate.value,
})
const showModal = reactive({
  planParameters: {
    show: false,
    unit: { name: '' },
  },
  recipe: {
    show: false,
    unit: { name: '' },
  },
  process: {
    show: false,
    unit: { name: '' },
  },
  theoreticalProgram: {
    show: false,
    unit: { name: '' },
  },
  notes: {
    show: false,
    unit: { name: '' },
  },
  datePicker: false,
  settings: false,
})
const tab = ref('mails')
const splitterModel = ref(20)

const { data: machines } = await useFetch('/api/machineList')
const { data: events } = await useFetch('/api/plannedEvents', {
  query: { from: schedulerDateModel.value.from, to: schedulerDateModel.value.to },
})
const { data: unScheduledEvents } = await useFetch('/api/unplannedEvents', {
  query: { from: schedulerDateModel.value.from, to: schedulerDateModel.value.to },
})
const modifiedMachines = computed(() => machines.value?.map((m) => {
  return {
    ...m,
    // TODO: machine icons?
    // iconCls: 'b-fa b-fa-solid b-fa-play',
    color: 'red',
  }
}))
const modifiedEvents = computed(() => events.value?.map((ev) => {
  return {
    id: ev.planKey,
    name: ev.jobOrder,
    resourceId: ev.machineId,
    startDate: new Date(ev.plannedStartTime),
    endDate: new Date(ev.plannedEndTime),
    resizable: false,
    draggable: true,
    editable: false,
    ...ev,
  }
}))
const modifiedUnscheduledEvents = computed(() => unScheduledEvents.value?.map((unp: UnplannedEventsRaw) => {
  return {
    ...unp,
    id: unp.planKey,
    name: unp.jobOrder,
    duration: unp.theoricalDuration ? (unp.theoricalDuration / 60) / 60 : Math.round(Math.random() * 10) + 1,
    durationUnit: 'hour',
    constraintDate: new Date(),
  } as UnplannedEvents
}))
let schedule: SchedulerPro | null = null
onMounted(() => {
  const _schedule: SchedulerPro = schedule = new Schedule({
    ref: 'schedule',
    appendTo: 'main',
    multiEventSelect: false,
    createEventOnDblClick: false,
    startDate: new Date(),
    startDateField: {
      label: 'test',
      flex: '1 0 50%',
      min: currentTime.value,
    },
    getDateConstraints() {
      return {
        start: currentTime.value,
      }
    },
    flex: 1,
    project: {
      eventStore: {
        removeUnassignedEvent: false,
      },
      eventModelClass: Task,
    },
    eventColor: 'blue',
    resources: modifiedMachines.value,
    events: modifiedEvents.value,
    listeners: {
      eventSelectionChange({ action }: any) {
        if (action === 'select' || action === 'update') {
          _schedule.widgetMap.parameterButton.disabled = false
          _schedule.widgetMap.recipeButton.disabled = false
          _schedule.widgetMap.processButton.disabled = false
          _schedule.widgetMap.theoreticalButton.disabled = false
          _schedule.widgetMap.noteButton.disabled = false
        } else {
          _schedule.widgetMap.parameterButton.disabled = true
          _schedule.widgetMap.recipeButton.disabled = true
          _schedule.widgetMap.processButton.disabled = true
          _schedule.widgetMap.theoreticalButton.disabled = true
          _schedule.widgetMap.noteButton.disabled = true
        }
      },
    },
    eventRenderer({ eventRecord }: any) {
      const icons: string[] = []
      if (eventRecord.originalData.notStarted) {
        icons.push('b-fa b-fa-solid b-fa-list-check')
      }
      if (eventRecord.originalData.isDeviation) {
        icons.push('b-fa b-fa-solid b-fa-clock')
      }
      if (eventRecord.originalData.isFinished) {
        icons.push('b-fa b-fa-solid b-fa-flag-checkered')
      }
      // if (eventRecord.originalData.isLocked) {
      //   icons.push('b-fa b-fa-lock')
      // }
      if (eventRecord.originalData.isRunning) {
        if (eventRecord.originalData.isStopped) {
          icons.push('b-fa b-fa-solid b-fa-stop')
        } else {
          icons.push('b-fa b-fa-solid b-fa-play')
        }
      }
      if (eventRecord.originalData.hasAlarm) {
        icons.push('b-fa b-fa-solid b-fa-bell')
      }

      if (eventRecord.originalData.isDeleted) {
        icons.push('b-fa b-fa-solid b-fa-ban')
      }

      const iconClass = icons.map(icon => `<i class="${icon}"></i>`).join('')
      return `
      ${iconClass}
      ${eventRecord.originalData.name}
  `
    },
    timeResolution: {
      unit: 'minute',
      increment: 5,
    },
    features: {
      scheduleContext: {
        disabled: true,
      },
      eventDragSelect: false,
      eventDragCreate: false,
      cellMenu: {
        items: {
          addEvent: {
            hidden: true,
          },
          copyEvent: {
            hidden: true,
          },
          cutEvent: {
            hidden: true,
          },
          deleteEvent: {
            hidden: true,
          },
          splitEvent: {
            hidden: true,
          },
        },
      },
      taskEdit: false,
      headerZoom: true,
      scheduleTooltip: {
        hideForNonWorkingTime: true,
      },
      timeRanges: {
        showCurrentTimeLine: true,
      },
    },
    tbar: [
      {
        type: 'button',
        disabled: true,
        ref: 'parameterButton',
        tooltip: 'Hello World',
        text: 'Plan Parametreleri',
        icon: 'b-fa b-fa-solid b-fa-sliders',
        color: 'toolbar-buttons',
        onClick() {
          showModal.planParameters.show = true
          showModal.planParameters.unit.name = _schedule.selectedEvents[0].name
        },
      },
      {
        type: 'button',
        disabled: true,
        ref: 'recipeButton',
        text: 'Reçete',
        icon: 'b-fa b-fa-solid b-fa-flask-vial',
        color: 'toolbar-buttons',
        onClick() {
          showModal.recipe.show = true
          showModal.recipe.unit.name = _schedule.selectedEvents[0].name
        },
      },
      {
        type: 'button',
        disabled: true,
        ref: 'processButton',
        text: 'Prosess Bilgileri',
        icon: 'b-fa b-fa-solid b-fa-receipt',
        color: 'toolbar-buttons',
        onClick() {
          showModal.process.show = true
          showModal.process.unit.name = _schedule.selectedEvents[0].name
        },
      },
      {
        type: 'button',
        disabled: true,
        ref: 'theoreticalButton',
        text: 'Teorik Program',
        icon: 'b-fa b-fa-solid b-fa-file-zipper',
        color: 'toolbar-buttons',
        onClick() {
          showModal.theoreticalProgram.show = true
          showModal.theoreticalProgram.unit.name = _schedule.selectedEvents[0].name
        },
      },
      {
        type: 'button',
        disabled: true,
        ref: 'noteButton',
        text: 'Notlar',
        icon: 'b-fa b-fa-solid b-fa-note-sticky',
        color: 'toolbar-buttons',
        onClick() {
          showModal.notes.show = true
          showModal.notes.unit.name = _schedule.selectedEvents[0].name
        },
      },
      {
        type: 'button',
        text: 'Ayarlar',
        icon: 'b-fa b-fa-solid b-fa-gear',
        color: 'toolbar-buttons',
        onClick() {
          showModal.settings = true
        },
      },
      {
        type: 'button',
        text: 'Date Picker',
        icon: 'b-fa b-fa-solid b-fa-calendar-days',
        color: 'toolbar-buttons',
        onClick() {
          showModal.datePicker = true
        },
      },
      {
        type: 'button',
        icon: 'b-icon-search-plus',
        tooltip: 'Yakınlaştır',
        color: 'toolbar-buttons',
        onAction: () => _schedule.zoomIn(),
      },
      {
        type: 'button',
        icon: 'b-icon b-icon-search-minus',
        tooltip: 'Uzaklaştır',
        color: 'toolbar-buttons',
        onAction: () => _schedule.zoomOut(),
      },
    ],
  } as Partial<SchedulerProConfig>)
  new Splitter({
    appendTo: 'main',
  })
  const unplannedGrid = new UnplannedGrid({
    ref: 'unplanned',
    appendTo: 'main',
    ui: 'toolbar',
    multiEventSelect: false,
    features: {
      cellEdit: false,
    },
    collapsible: false,
    tbar: [
      {
        type: 'textfield',
        label: 'İş Emri Arama',
        inputType: 'text',
        clearable: true,
        cls: 'flex justify-center items-center',
        onChange({ value }: any) {
          if (value === '') {
            // @ts-expect-error type error
            unplannedGrid.data = modifiedUnscheduledEvents.value
          } else {
            // @ts-expect-error type error
            unplannedGrid.data = unplannedGrid.data.filter(a => a.originalData.name.includes(value))
          }
        },
      },
    ],
    flex: '0 1 300px',
    project: _schedule.project,
    store: {
      data: modifiedUnscheduledEvents.value,
      modelClass: Task,
      autoLoad: true,
    },
  } as Partial<GridConfig>)
  new Drag({
    grid: unplannedGrid,
    schedule: _schedule,
    constrain: false,
    outerElement: unplannedGrid.element,
  } as Partial<DragHelperConfig>)
})
</script>

<template>
  <div>
    <EliarModal v-if="showModal.datePicker" @click.stop="showModal.datePicker = false">
      <template #default>
        <div class="flex justify-center w-min m-auto rounded" @click.stop.prevent>
          <QDate
            v-model="schedulerDateModel"
            range
            dark
            landscape
            @click.stop.prevent
          />
        </div>
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.settings" @click.stop="showModal.settings = false">
      <template #default>
        <div class="flex justify-center w-1/3 m-auto rounded bg-white!" @click.stop.prevent>
          <q-splitter
            v-model="splitterModel"
            style="height: 450px"
          >
            <template #before>
              <q-tabs
                v-model="tab"
                vertical
                class="text-teal"
              >
                <q-tab
                  name="mails"
                  icon="mail"
                  label="Mails"
                />
                <q-tab
                  name="alarms"
                  icon="alarm"
                  label="Alarms"
                />
                <q-tab
                  name="movies"
                  icon="movie"
                  label="Movies"
                />
              </q-tabs>
            </template>

            <template #after>
              <q-tab-panels
                v-model="tab"
                animated
                swipeable
                vertical
                transition-prev="jump-up"
                transition-next="jump-up"
              >
                <q-tab-panel name="mails">
                  <div class="text-h4 q-mb-md">
                    Mails
                  </div>
                  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
                  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
                </q-tab-panel>

                <q-tab-panel name="alarms">
                  <div class="text-h4 q-mb-md">
                    Alarms
                  </div>
                  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
                  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
                </q-tab-panel>

                <q-tab-panel name="movies">
                  <div class="text-h4 q-mb-md">
                    Movies
                  </div>
                  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
                  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
                  <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
                </q-tab-panel>
              </q-tab-panels>
            </template>
          </q-splitter>
        </div>
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.planParameters.show" @click.stop="showModal.planParameters.show = false">
      <template #default>
        <div class="w-full bg-white e-border p-3">
          planParameters: {{ showModal.planParameters.unit.name }}
        </div>
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.recipe.show" @click.stop="showModal.recipe.show = false">
      <template #default>
        <div class="w-full bg-white e-border p-3">
          recipe: {{ showModal.recipe.unit.name }}
        </div>
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.process.show" @click.stop="showModal.process.show = false">
      <template #default>
        <div class="w-full bg-white e-border p-3">
          process: {{ showModal.process.unit.name }}
        </div>
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.theoreticalProgram.show" @click.stop="showModal.theoreticalProgram.show = false">
      <template #default>
        <div class="w-full bg-white e-border p-3">
          theoreticalProgram: {{ showModal.theoreticalProgram.unit.name }}
        </div>
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.notes.show" @click.stop="showModal.notes.show = false">
      <template #default>
        <div class="w-full bg-white e-border p-3">
          notes: {{ showModal.notes.unit.name }}
        </div>
      </template>
    </EliarModal>
    <div class="e-border w-full h-screen">
      <div id="main" class="w-full h-full" />
    </div>
  </div>
</template>

<style lang="postcss">
.toolbar-buttons {
  color: white;
  background-color: #03A9F4;
  @apply rounded;
}

.custom-label {
  @apply text-red-500 ! bg-green-500 w-1/3 flex-center;
}

.b-selected {
  background-color: inherit !important;
  opacity: 1 !important;
}

#main {
  display: flex;
  flex-direction: row;
  flex: 1 1 100%;
}

#main .b-resourceheader {
  height: 100%;
}

.b-timeline-subgrid .b-sch-current-time {
  border: 1px solid red !important
}
</style>
