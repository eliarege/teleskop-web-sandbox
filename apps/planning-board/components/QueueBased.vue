<!-- eslint-disable no-new -->
<script setup lang="ts">
import type { DragHelperConfig, Grid, GridColumnConfig, GridConfig, SchedulerPro, SchedulerProConfig } from '@bryntum/schedulerpro-trial'
import { DateHelper, Splitter, StringHelper, Toast } from '@bryntum/schedulerpro-trial'
import { addDays, addSeconds } from 'date-fns'
import { EliarModal } from 'ui'
import { useDocumentVisibility } from '@vueuse/core'
import { QueueDrag, QueueSchedule, QueueTask, QueueUnplannedGrid, TaskStore } from '~/lib/queueBased'
import type { QueueBasedArchiveEvents, QueueBasedPlannedEvents } from '~/shared/queueBased'
import type { UnplannedEvents } from '~/shared/types'
import { eventTooltip } from '~/composables/helper'

const currentTime = useNow({ interval: 1000 })
const { t } = useI18n()

// TODO (BEFORE PRODUCTION): change start/end date!
const startDate = ref('2022/01/01')
const endDate = ref('2023/07/07')

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
  vnc: {
    show: false,
    currentMachine: {
      id: 0,
    },
  },
  datePicker: false,
  rule: false,
  settings: false,
})

const archiveDays = localStorage.getItem('pt-settings')

const { data: unScheduledEvents, refresh: unScheduledRefresh } = await useFetch('/api/unplannedEvents')
const { data: machines, refresh: machineRefresh } = await useFetch('/api/machineList')
const { data: events, refresh: plannedRefresh } = await useFetch('/api/queueBased/plannedEvents')
const { data: archiveEvents } = await useFetch('/api/queueBased/archiveEvents', {
  query: { archiveDays: JSON.parse(archiveDays || '0').archiveDays ?? 0 },
})
const modifiedEvents = computed(() => events.value?.map((ev: any) => {
  return {
    id: ev.planKey,
    name: ev.jobOrder,
    resourceId: ev.machineId,
    resizable: false,
    draggable: !ev.isStarted && !ev.pinned,
    editable: false,
    endDate: addSeconds(ev.startDate, ev.theoreticalDuration),
    ...ev,
  } as QueueBasedPlannedEvents
}))
const modifiedArchive = computed(() => archiveEvents.value?.map((ev: any) => {
  return {
    id: ev.planKey,
    name: ev.jobOrder,
    resourceId: ev.machineId,
    resizable: false,
    draggable: !ev.isStarted,
    editable: false,
    startDate: ev.startTime,
    endDate: ev.endTime ? ev.endTime : ev.cancelTime,
    ...ev,
  } as QueueBasedArchiveEvents
}))
const mergedEvents = computed(() => modifiedEvents.value?.concat(modifiedArchive.value))
const modifiedUnscheduledEvents = computed(() => unScheduledEvents.value!.map((unp) => {
  return {
    ...unp,
    id: unp.planKey,
    name: unp.jobOrder,
    duration: (unp.theoreticalDuration / 60) / 60,
    durationUnit: 'hour',
    constraintDate: new Date(),
  } as UnplannedEvents
}))

let scheduler: SchedulerPro
let grid: Grid

const visibility = useDocumentVisibility()

async function myInterval(delay: number) {
  await until(visibility).toBe('visible')
  refreshScheduler()
  setTimeout(() => {
    myInterval(delay)
  }, delay)
}

await myInterval(60000)

async function refreshScheduler() {
  await plannedRefresh()
  await unScheduledRefresh()
  await machineRefresh()
  scheduler.refreshRows()
}
watch(mergedEvents, (newVal: QueueBasedPlannedEvents[]) => {
  scheduler.events = newVal
})
watch(modifiedUnscheduledEvents, (newVal: UnplannedEvents[]) => {
  grid.store.data = newVal
})
function initialGridColumns() {
  const columnNames = Object.keys(modifiedUnscheduledEvents.value[0].erpParameters)
  for (let i = 0; i < columnNames.length; i++) {
    const name = columnNames[i]
    // @ts-expect-error missing type
    grid.columns.add({
      field: `erpParameters.${name}`,
      text: name,
      width: 100,
      align:'center'
    })
  }
  // @ts-expect-error missing type
  grid.flex = `0 1 ${grid.columns.topColumns.length + 1}00px`
}
async function addGridColumn(data: { id: number, parameterId: number, parameterName: string, visible: boolean }) {
  await unScheduledRefresh().then(() => {
    // @ts-expect-error missing type
    grid.columns.add({
      // find field
      field: `erpParameters.${data.parameterName}`,
      text: data.parameterName,
      width: 100,
      align: 'center',
    })
    // @ts-expect-error missing type
    grid.flex = `0 1 ${grid.columns.topColumns.length + 1}00px`
  })
}
async function removeGridColumn(data: { id: number, parameterId: number, parameterName: string, visible: boolean }) {
  await unScheduledRefresh().then(() => {
    if (modifiedUnscheduledEvents.value) {
      // @ts-expect-error missing type
      grid.columns.get(`erpParameters.${data.parameterName}`).remove(data)
      // @ts-expect-error missing type
      grid.flex = `0 1 ${grid.columns.topColumns.length + 1}00px`
    }
  })
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
  }).then(() => refreshScheduler())
}
function dateRangeEnd() {
  scheduler.startDate = new Date(schedulerDateModel.value.from)
  scheduler.endDate = new Date(schedulerDateModel.value.to)
  scheduler.zoomLevel = 17
  scheduler.refreshRows()
}
onMounted(async () => {
  const schedule: SchedulerPro = scheduler = new QueueSchedule({
    ref: 'schedule',
    appendTo: 'main',
    multiEventSelect: false,
    createEventOnDblClick: false,
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
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
        storeClass: TaskStore,
        removeUnassignedEvent: false,
      },
      autoLoad: true,
      eventModelClass: QueueTask,
    },
    resources: machines.value,
    events: mergedEvents.value,
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
      if (eventRecord.originalData.pinned) {
        icons.push('b-fa b-fa-solid b-fa-thumbtack')
      }
      if (eventRecord.originalData.isDeviation) {
        icons.push('b-fa b-fa-solid b-fa-clock')
      }
      if (eventRecord.originalData.isFinished) {
        icons.push('b-fa b-fa-solid b-fa-flag-checkered')
      } else {
        if (eventRecord.originalData.isRunning) {
          icons.push('b-fa b-fa-solid b-fa-play')
        } else if (eventRecord.originalData.isStopped) {
          icons.push('b-fa b-fa-solid b-fa-stop')
        } else {
          icons.push('b-fa b-fa-solid b-fa-list-check')
        }
      }
      if (eventRecord.originalData.isAlarm) {
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
    onEventMenuBeforeShow: (a) => {
      if (a.eventRecord.originalData.pinned) {
        a.items.pin.hidden = true
        a.items.unpin.hidden = false
      } else {
        a.items.pin.hidden = false
        a.items.unpin.hidden = true
      }
    },
    columns: [
      {
        type: 'resourceInfo',
        text: 'L{machine}',
        flex: 1,
        showRole: true,
        showMeta: ({ originalData }) => {
          return `<div>Total Alarm Count: ${originalData.totalAlarmCount}</div>`
        },
        enableCellContextMenu: true,
        cellMenuItems: {
          vnc: {
            text: 'VNC',
            icon: 'b-fa b-fa-solid b-fa-ethernet',
            onItem: (a) => {
              showModal.vnc.show = !showModal.vnc.show
              showModal.vnc.currentMachine.id = a.id
            },
          },
        },
        headerMenuItems: {
          customItem: { text: 'ASD' },
        },
        field: 'name',
      },
    ],
    features: {
      dependencies: false,
      scheduleContext: {
        disabled: true,
      },
      eventDragSelect: false,
      eventDragCreate: false,
      // group: 'groupName',
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
          removeRow: {
            hidden: true,
          },
        },
      },
      eventMenu: {
        items: {
          taskEdit: {
            // icon: 'b-fa-sharp b-fa-light b-fa-pen-to-square',
            // text: t('ctx-menu.task-edit'),
            // disabled: true,
            hidden: true,
          },
          delete: {
            icon: 'b-fa-solid b-fa-trash',
            text: t('ctx-menu.task-delete'),
            onItem({ eventRecord }: any) {
              deleteEvent(eventRecord.originalData.id)
                .then(() => eventRecord.unassign())
                .catch(err => console.error(err))
            },
          },
          unplan: {
            icon: 'b-fa-solid b-fa-calendar-xmark',
            text: t('ctx-menu.remove-plan'),
            onItem({ eventRecord }: any) {
              unPlanEvent(eventRecord.originalData.id)
                .then(() => {
                  eventRecord.unassign()
                })
                .catch(err => console.error(err))
            },
          },
          pin: {
            icon: 'b-fa-solid b-fa-thumbtack',
            text: t('ctx-menu.pin'),
            async onItem({ eventRecord }: any) {
              await $fetch('api/pinEvent', {
                query: { planKey: eventRecord.originalData.id },
                method: 'PUT',
              })
                .then(() => {
                  refreshScheduler()
                  schedule.refreshRows()
                  Toast.show('Event succesfuly pinned!')
                })
                .catch(err => Toast.show(err))
            },
          },
          unpin: {
            icon: 'b-fa-solid b-fa-thumbtack',
            text: t('ctx-menu.unpin'),
            async onItem({ eventRecord }: any) {
              await $fetch('api/unpinEvent', {
                query: { planKey: eventRecord.originalData.id },
                method: 'PUT',
              })
                .then(() => {
                  refreshScheduler()
                  schedule.refreshRows()
                  Toast.show('Event succesfuly pinned!')
                })
                .catch(err => Toast.show(err))
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
            text: t('ctx-menu.properties'),
            onItem({ eventRecord, assignmentRecord }: any) {
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
      eventTooltip: ({ eventRecord }: any) => eventTooltip(eventRecord, scheduler),
    },
    tbar: [
      {
        type: 'button',
        disabled: true,
        ref: 'parameterButton',
        text: 'L{planparam}',
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
        text: 'L{recipe}',
        icon: 'b-fa b-fa-solid b-fa-flask-vial',
        color: 'toolbar-buttons',
        onClick() {
          showModal.recipe.show = true
          showModal.recipe.unit.jobOrder = schedule.selectedEvents[0].name
          // @ts-expect-error type error
          showModal.recipe.unit.machineId = schedule.selectedEvents[0]._data.resourceId
        },
      },
      // {
      //   type: 'button',
      //   disabled: true,
      //   ref: 'processButton',
      //   text: 'L{process}',
      //   icon: 'b-fa b-fa-solid b-fa-receipt',
      //   color: 'toolbar-buttons',
      //   onClick() {
      //     showModal.process.show = true
      //     showModal.process.unit.name = schedule.selectedEvents[0].name
      //   },
      // },
      // {
      //   type: 'button',
      //   disabled: true,
      //   ref: 'theoreticalButton',
      //   text: 'L{theoretical}',
      //   icon: 'b-fa b-fa-solid b-fa-file-zipper',
      //   color: 'toolbar-buttons',
      //   onClick() {
      //     showModal.theoreticalProgram.show = true
      //     showModal.theoreticalProgram.unit.name = schedule.selectedEvents[0].name
      //   },
      // },
      {
        type: 'button',
        disabled: true,
        ref: 'noteButton',
        text: 'L{note}',
        icon: 'b-fa b-fa-solid b-fa-note-sticky',
        color: 'toolbar-buttons',
        onClick() {
          showModal.notes.show = true
          showModal.notes.unit.name = schedule.selectedEvents[0].name
        },
      },
      {
        type: 'button',
        text: 'L{settings}',
        icon: 'b-fa b-fa-solid b-fa-gear',
        color: 'toolbar-buttons',
        onClick() {
          showModal.settings = true
        },
      },
      {
        type: 'button',
        text: 'L{datepicker}',
        icon: 'b-fa b-fa-solid b-fa-calendar-days',
        color: 'toolbar-buttons',
        onClick() {
          showModal.datePicker = true
        },
      },
      // {
      //   type: 'button',
      //   text: 'Operatör Mesajları',
      //   icon: 'b-fa b-fa-solid b-fa-person-walking',
      //   color: 'toolbar-buttons',
      //   onClick() {
      //     console.log('OP MSG')
      //   },
      // },
      // {
      //   type: 'button',
      //   disabled: true,
      //   text: 'L{rules}',
      //   icon: 'b-fa b-fa-solid b-fa-list-check',
      //   color: 'toolbar-buttons',
      //   onClick() {
      //     showModal.rule = true
      //   },
      // },
      {
        type: 'button',
        icon: 'b-icon-search-plus',
        tooltip: 'L{zoomin}',
        color: 'toolbar-buttons',
        onAction: () => schedule.zoomIn(),
      },
      {
        type: 'button',
        icon: 'b-icon b-icon-search-minus',
        tooltip: 'L{zoomout}',
        color: 'toolbar-buttons',
        onAction: () => schedule.zoomOut(),
      },
      {
        type: 'button',
        icon: 'b-fa b-fa-solid b-fa-arrow-rotate-left',
        tooltip: 'L{resetZoom}',
        color: 'toolbar-buttons',
        onAction: () => schedule.zoomLevel = 17,
      },
      {
        type: 'textfield',
        placeholder: 'L{search}',
        inputType: 'text',
        clearable: true,
        onInput({ value }: any) {
          schedule.events.forEach((element) => {
            element.cls = ''
          })
          if (value !== '') {
            const test = schedule.events.filter(a => a.originalData.name.includes(value))
            test.forEach((element) => {
              element.cls = 'custom-focus'
            })
          }
        },
      },
    ],
  } as Partial<SchedulerProConfig>)
  // @ts-expect-error missing type
  window.sch = schedule
  new Splitter({
    appendTo: 'main',
  })
  const unplannedGrid = grid = new QueueUnplannedGrid({
    ref: 'unplanned',
    appendTo: 'main',
    ui: 'toolbar',
    multiEventSelect: false,
    columns: [{
      type: 'resourceInfo',
      text: 'L{unassign}',
      flex: 1,
      align: 'left',
      field: 'name',
      htmlEncode: false,
      minWidth: 200,
      renderer: data => `<i class="${data.record.iconCls}"></i>${data.record.name}`,
    }, {
      type: 'duration',
      minWidth: 100,
      align: 'center',
    }],
    features: {
      cellEdit: false,
      search: {
        label: 'Search',
        icon: 'b-icon b-icon-search',
        value: 'on',
        style: 'margin-bottom: 1em',
        onInput: () => grid.features.search.search(''),
      },
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
      // https://bryntum.com/products/schedulerpro/docs/api/Grid/feature/Search
      {
        type: 'textfield',
        inputType: 'text',
        placeholder: 'L{search}',
        clearable: true,
        cls: 'flex justify-center items-center',
        onInput({ value }: any) {
          grid.features.search.search(value)
        },
      },
    ],
    flex: '0 1 300px',
    project: schedule.project,
    store: {
      data: modifiedUnscheduledEvents.value,
      modelClass: QueueTask,
      autoLoad: true,
    },
  } as Partial<GridConfig>)
initialGridColumns()
  new QueueDrag({
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
            @range-end="dateRangeEnd()"
          />
        </div>
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.settings" @click.stop="showModal.settings = false">
      <template #default>
        <SettingsPlan
          @update-scheduler="refreshScheduler()"
          @add-column="(ev) => addGridColumn(ev)"
          @remove-column="(ev) => removeGridColumn(ev)"
        />
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
        <BatchNotes :job-order="showModal.notes.unit.name" @update-scheduler="plannedRefresh()" />
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.vnc.show" @click.stop="showModal.vnc.show = false">
      <template #default>
        <MachineVnc :current-machine="showModal.vnc.currentMachine" />
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.rule" @click.stop="showModal.rule = false" />
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

.b-sch-event-wrap.b-nested-events-parent[data-level="1"]>.b-sch-event:hover>.b-nested-events-container {
  border-color: #555;
  background-color: rgba(0, 0, 0, 0.0666666667);
}

.b-sch-event {
  border-radius: 9px !important;
}

.b-sch-event-content {
  white-space: normal;
}
.custom-focus {
  filter: invert(60%);
}
</style>

<i18n lang="json">
{
  "en": {
    "ctx-menu": {
      "task-edit": "Update Job Order",
      "task-delete": "Delete Job Order",
      "remove-plan": "Remove From Plan",
      "properties": "Job Order Properties",
      "pin": "Pin Task",
      "unpin": "Unpin Task"
    }
  },
  "tr": {
    "ctx-menu": {
      "task-edit": "İş Emrini Güncelle",
      "task-delete": "İş Emrini Sil",
      "remove-plan": "Plandan kaldır",
      "properties": "İş Emri Özellikleri",
      "pin": "İş Emrini Sabitle",
      "unpin": "İş Emri Sabitlemesini Kaldır"
    }
  }
}
</i18n>{
      text: columnNames.value[i],
      field: `erpParameters.${i}.value`,
      minWidth: 100,
      align: 'center',
      type: ''
    }{
      text: columnNames.value[i],
      field: `erpParameters.${i}.value`,
      minWidth: 100,
      align: 'center',
      type: ''
    }
