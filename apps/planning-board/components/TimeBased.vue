<!-- eslint-disable no-new -->
<script setup lang="ts">
import type { DragHelperConfig, GridConfig, SchedulerPro, SchedulerProConfig } from '@bryntum/schedulerpro-trial'
import { Splitter } from '@bryntum/schedulerpro-trial'
import { EliarModal, MachineCard } from 'ui'
import { addDays } from 'date-fns'
import { Drag, Schedule, Task, UnplannedGrid } from '~/lib/bryntum'
import type { UnplannedEvents, UnplannedEventsRaw } from '~/shared/types'

const currentTime = useNow({ interval: 1000 })
const router = useRouter()

// TODO (BEFORE PRODUCTION): change start/end date!
const startDate = ref('2022/07/01')
const endDate = ref('2022/07/07')

const schedulerDateModel = ref({
  from: startDate.value,
  to: endDate.value,
})
const showModal = reactive({
  planParameters: {
    show: false,
    unit: { name: 0 },
  },
  recipe: {
    show: false,
    unit: { machineId: 0, jobOrder: '' },
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
  properties: {
    show: false,
    unit: { machineId: 0, jobOrder: '', planKey: 0 },
  },
  datePicker: false,
  rule: false,
  settings: false,
})

const { data: machines } = await useFetch('/api/machineList')
const { data: events, refresh: plannedRefresh } = await useFetch('/api/plannedEvents', {
  query: { from: schedulerDateModel.value.from, to: schedulerDateModel.value.to },
})
const { data: unScheduledEvents, refresh: unScheduledRefresh } = await useFetch('/api/unplannedEvents', {
  query: { from: schedulerDateModel.value.from, to: schedulerDateModel.value.to },
})
const modifiedMachines = computed(() => machines.value?.map((m) => {
  return {
    ...m,
    // TODO: machine icons?
    // iconCls: 'b-fa b-fa-solid b-fa-play',
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
    duration: (unp.theoreticalDuration / 60) / 60,
    durationUnit: 'hour',
    constraintDate: new Date(),
  } as UnplannedEvents
}))
async function refreshScheduler() {
  await plannedRefresh()
  await unScheduledRefresh()
  // TODO: render grid rows
}
async function unPlanEvent(planKey: number) {
  await $fetch('/api/unplan', {
    method: 'PUT',
    query: { planKey },
  }).then(() => refreshScheduler())
}
async function deleteEvent(planKey: number) {
  await $fetch('api/delete', {
    method: 'PUT',
    query: { planKey },
  })
}
let scheduler: SchedulerPro
function dateRangeEnd() {
  scheduler.startDate = new Date(schedulerDateModel.value.from)
  scheduler.endDate = new Date(schedulerDateModel.value.to)
  scheduler.zoomLevel = 17
}
onMounted(async () => {
  const schedule: SchedulerPro = scheduler = new Schedule({
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
          schedule.widgetMap.parameterButton.disabled = false
          schedule.widgetMap.recipeButton.disabled = false
          // schedule.widgetMap.processButton.disabled = false
          // schedule.widgetMap.theoreticalButton.disabled = false
          schedule.widgetMap.noteButton.disabled = false
        } else {
          schedule.widgetMap.parameterButton.disabled = true
          schedule.widgetMap.recipeButton.disabled = true
          // schedule.widgetMap.processButton.disabled = true
          // schedule.widgetMap.theoreticalButton.disabled = true
          schedule.widgetMap.noteButton.disabled = true
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
    useInitialAnimation: false,
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
      eventMenu: {
        items: {
          taskEdit: {
            icon: 'b-fa-sharp b-fa-light b-fa-pen-to-square',
            text: 'Update Event',
            disabled: true,
            onItem({ eventRecord }: any) {
            },
          },
          delete: {
            icon: 'b-fa-solid b-fa-trash',
            text: 'Delete Event',
            onItem({ eventRecord }: any) {
              deleteEvent(eventRecord.originalData.id)
                .then(() => eventRecord.unassign())
                .catch(err => console.error(err))
            },
          },
          unplan: {
            icon: 'b-fa-solid b-fa-calendar-xmark',
            text: 'Remove from plan',
            onItem({ eventRecord }: any) {
              unPlanEvent(eventRecord.originalData.id)
                .then(() => {
                  eventRecord.unassign()
                })
                .catch(err => console.error(err))
            },
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
          properties: {
            icon: 'b-fa-solid b-fa-calendar-xmark',
            text: 'Job Order Properties',
            onItem({ eventRecord, assignmentRecord }: any) {
              console.log(assignmentRecord.originalData.resourceId)
              showModal.properties.show = true
              showModal.properties.unit.planKey = eventRecord.originalData.id
              showModal.properties.unit.jobOrder = eventRecord.originalData.name
              showModal.properties.unit.machineId = assignmentRecord.originalData.resourceId
            },
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
          // @ts-expect-error type is always number, not string | number
          showModal.planParameters.unit.name = schedule.selectedEvents[0].id
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
          showModal.recipe.unit.jobOrder = schedule.selectedEvents[0].name
          // @ts-expect-error type error
          showModal.recipe.unit.machineId = schedule.selectedEvents[0]._data.resourceId
        },
      },
      {
        type: 'button',
        disabled: true,
        ref: 'processButton',
        text: 'Prosess Bilgileri',
        icon: 'b-fa b-fa-solid b-fa-receipt',
        color: 'toolbar-buttons',
        tooltip: 'Currently under development!',
        onClick() {
          showModal.process.show = true
          showModal.process.unit.name = schedule.selectedEvents[0].name
        },
      },
      {
        type: 'button',
        disabled: true,
        ref: 'theoreticalButton',
        tooltip: 'Currently under development!',
        text: 'Teorik Program',
        icon: 'b-fa b-fa-solid b-fa-file-zipper',
        color: 'toolbar-buttons',
        onClick() {
          showModal.theoreticalProgram.show = true
          showModal.theoreticalProgram.unit.name = schedule.selectedEvents[0].name
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
          showModal.notes.unit.name = schedule.selectedEvents[0].name
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
        text: 'Rules',
        icon: 'b-fa b-fa-solid b-fa-list-check',
        color: 'toolbar-buttons',
        onClick() {
          showModal.rule = true
        },
      },
      {
        type: 'button',
        icon: 'b-icon-search-plus',
        tooltip: 'Yakınlaştır',
        color: 'toolbar-buttons',
        onAction: () => schedule.zoomIn(),
      },
      {
        type: 'button',
        icon: 'b-icon b-icon-search-minus',
        tooltip: 'Uzaklaştır',
        color: 'toolbar-buttons',
        onAction: () => schedule.zoomOut(),
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
    eventMenu: {
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
    project: schedule.project,
    store: {
      data: modifiedUnscheduledEvents.value,
      modelClass: Task,
      autoLoad: true,
    },
  } as Partial<GridConfig>)
  new Drag({
    grid: unplannedGrid,
    schedule,
    constrain: false,
    outerElement: unplannedGrid.element,
  } as Partial<DragHelperConfig>)
})
</script>

<template>
  <div>
    <EliarModal v-if="showModal.properties.show" @click.stop="showModal.properties.show = false">
      <template #default>
        <BatchProperties
          :plan-key="showModal.properties.unit.planKey"
          :machine-id="showModal.properties.unit.machineId"
          :job-order="showModal.properties.unit.jobOrder"
        />
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.datePicker" @click.stop="showModal.datePicker = false">
      <template #default>
        <div class="flex justify-center w-min m-auto rounded" @click.stop.prevent>
          <QDate
            v-model="schedulerDateModel"
            range
            dark
            landscape
            @click.stop.prevent
            @range-end="dateRangeEnd(schedule)"
          />
        </div>
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.settings" @click.stop="showModal.settings = false">
      <template #default>
        <PlanSettings />
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.planParameters.show" @click.stop="showModal.planParameters.show = false">
      <template #default>
        <PlanParameters :plan-key="showModal.planParameters.unit.name" />
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.recipe.show" @click.stop="showModal.recipe.show = false">
      <template #default>
        <div class="!w-80vw !h-full">
          <PlanRecipe :machine-id="showModal.recipe.unit.machineId" :job-order="showModal.recipe.unit.jobOrder" />
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
        <BatchNotes :job-order="showModal.notes.unit.name" />
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.rule" @click.stop="showModal.rule = false">
      <template #default>
        <MachineRuleList />
      </template>
    </EliarModal>
    <div class="w-full h-screen">
      <div id="main" class="w-full h-full" />
    </div>
  </div>
</template>

<style lang="postcss">
div[bgRed] {
  background-color: rgba(237, 16, 16, 0.3) !important;
}

div[bgGreen] {
  background-color: rgba(51, 255, 57, 0.3) !important;
}
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
.b-sch-event-wrap.b-nested-events-parent[data-level="1"] > .b-sch-event:hover > .b-nested-events-container {
  border-color: #555;
  background-color: rgba(0, 0, 0, 0.0666666667);
}

.b-sch-event {
  border-radius: 9px !important;
}

.b-sch-event-content {
  white-space: normal;
}
</style>
