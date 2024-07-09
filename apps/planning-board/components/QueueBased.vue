<!-- eslint-disable no-new -->
<script setup lang="ts">
import type { DragHelperConfig, Grid, GridConfig, SchedulerPro, SchedulerProConfig } from '@bryntum/schedulerpro-trial'
import { LocaleManager, Splitter, Store, Toast } from '@bryntum/schedulerpro-trial'
import { useDocumentVisibility } from '@vueuse/core'
import { addDays, addHours } from 'date-fns'
import { EliarModal, LoadingSpinner } from '@teleskop/ui'
import { useDocumentVisibility, useStorage } from '@vueuse/core'
import { QueueDrag, QueueSchedule, QueueTask, QueueUnplannedGrid, TaskStore } from '~/lib/queueBased'
import type { QueueBasedEvents } from '~/shared/queueBased'
import type { MachineStatus, PtLocaleSettings, UnplannedEvents } from '~/shared/types'
import { eventTooltip } from '~/composables/helper'
import { QueueDrag, QueueSchedule, QueueTask, QueueUnplannedGrid, TaskStore } from '~/lib/queueBased'
import type { QueueBasedAnyEvent } from '~/shared/queueBased'
import type { MachineStatus, UnplannedEvents } from '~/shared/types'
import { useSettingStore } from '~/store/settings'

const { t, locale, d } = useI18n()
const visibility = useDocumentVisibility()
const config = useRuntimeConfig()
const refreshInterval = 60_000
const today = new Date()
const startDate = ref(today.toISOString())
const endDate = ref(addDays(today, 3).toISOString())
const schedulerDateModel = ref({
  from: startDate.value,
  to: endDate.value,
})
const store = useSettingStore()
const { data: machines, refresh: machineRefresh, pending: machinesPending } = await useFetch<MachineStatus[]>('/api/machineList', {
  lazy: true,
  default: () => [],
  transform: unsortedMachines => sortMachines(unsortedMachines),
})
const { data: unScheduledEvents, refresh: unScheduledRefresh } = await useFetch('/api/unplannedEvents')
const { data: events, refresh: eventRefresh, pending: eventsPending } = await useFetch<QueueBasedAnyEvent[]>('/api/queueBased/schedulerEvents', {
  immediate: false,
  default: () => [],
  query: {
    startDate,
    endDate,
    includeStops: store.settings.showStops.show,
  },
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
    unit: { machineId: 0, jobOrder: '', planKey: 0, fabricWeight: 0, theoreticalDuration: 0 },
  },
  vnc: {
    show: false,
    currentMachine: {
      id: 0,
      name: '',
    },
  },
  machineSort: {
    show: false,
  },
  machineRule: {
    show: false,
  },
  datePicker: false,
  rule: false,
  settings: false,
})
const sortIndex = Symbol('sortIndex')

type MachineStatusWithSortIndex = MachineStatus & { [sortIndex]?: number }

function sortMachines(machines: MachineStatusWithSortIndex[]): MachineStatusWithSortIndex[] {
  for (const machine of machines) {
    machine[sortIndex] = store.machineOrdering.indexOf(machine.id)
  }
  return machines.sort((a, b) => {
    const aIndex = a[sortIndex]!
    const bIndex = b[sortIndex]!
    if (aIndex === bIndex)
      return 0
    if (aIndex === -1)
      return 1
    if (bIndex === -1)
      return -1

    return aIndex - bIndex
  })
}
function setFabricColor(event: QueueBasedAnyEvent) {
  const {
    plannedBatchFabricColor,
    ongoingBatchFabricColor,
    completedBatchFabricColor,
    plannedBatchColor,
    ongoingBatchColor,
    completedBatchColor,
    showStops,
  } = store.settings
  if (event.eventType === 'planned') {
    return plannedBatchFabricColor ? integerToHex(event.fabricColor) : plannedBatchColor
  }
  if (event.eventType === 'finished') {
    if (event.isRunning) {
      return ongoingBatchFabricColor ? integerToHex(event.fabricColor) : ongoingBatchColor
    } return completedBatchFabricColor ? integerToHex(event.fabricColor) : completedBatchColor
  }
  return showStops.color
}

type Values<T> = T[keyof T]

function isDate(value: any): boolean | any {
  if (/^\d+$/.test(value)) {
    return false
  }
  if (typeof value === 'string') {
    const date = new Date(value)
    return !Number.isNaN(date.getTime())
  }
  return value instanceof Date && !Number.isNaN(value.getTime())
}

function setEventName(event: QueueBasedAnyEvent): Values<QueueBasedAnyEvent> {
  const plannedBatchText = store.settings.plannedBatchText || 'jobOrder'
  const completedBatchText = store.settings.completedBatchText || 'jobOrder'
  const ongoingBatchText = store.settings.ongoingBatchText || 'jobOrder'

  if (event.eventType === 'planned') {
    const formattedText = isDate(event[plannedBatchText]) ? d(event[plannedBatchText], 'datetime') : event[plannedBatchText]
    return formattedText
  }
  if (event.eventType === 'finished') {
    if (event.isStarted && !event.isFinished) {
      const formattedText = isDate(event[ongoingBatchText]) ? d(event[ongoingBatchText], 'datetime') : event[ongoingBatchText]
      return formattedText
    } else {
      const formattedText = isDate(event[completedBatchText]) ? d(event[completedBatchText], 'datetime') : event[completedBatchText]
      return formattedText
    }
  } else {
    return ' '
  }
}
function setId(event: QueueBasedAnyEvent) {
  switch (event.eventType) {
    case 'finished':
      return event.batchKey
    case 'planned':
      return event.planKey
    case 'stop':
      return `stop-${event.stopNumber}`
  }
}
const modifiedEvents = computed(() => {
  return events.value.map((ev) => {
    return {
      ...ev,
      startDate: ev.startTime,
      endDate: ev.endTime,
      resourceId: ev.machineId,
      resizable: false,
      draggable: ev.eventType === 'planned' && !ev.pinned,
      editable: false,
      name: setEventName(ev),
      id: setId(ev),
      eventColor: setFabricColor(ev),
    }
  })
})

const scrollStore = new Store({
  data: modifiedEvents.value,
})
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

async function scheduleDataRefresh() {
  await until(visibility).toBe('visible')
  try {
    await refreshScheduler()
  } catch (err) {
    Toast.show('Failed to Refresh')
  }

  setTimeout(scheduleDataRefresh, refreshInterval)
}

async function refreshScheduler() {
  await Promise.all([
    machineRefresh(),
    unScheduledRefresh(),
    eventRefresh(),
  ])
  try {
    // FIX: Cycle during synchronous computation
    scheduler.refreshRows()
  } catch (err) {
    console.error(err)
  }
}

async function machineReload() {
  sortMachines(machines.value)
  scheduler.resourceStore.loadDataAsync(machines.value)
  await eventRefresh()
  scheduler.refreshRows()
}

watch(modifiedEvents, (newVal: QueueBasedAnyEvent[]) => {
  scheduler.events = newVal
  scrollStore.data = newVal
})
watch(modifiedUnscheduledEvents, (newVal: UnplannedEvents[]) => {
  grid.store.data = newVal
})
watch(() => store.settings.showStops.show, async (newVal: boolean) => {
  await refreshScheduler()
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
      align: 'center',
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
watch(locale, () => {
  document.querySelectorAll('.totalAlarmCount').forEach((ev) => {
    const count = ev.textContent?.split(':')[1]
    ev.textContent = `${t('queue-based.alarm-count')}:${count}`
  })
})
onMounted(async () => {
  await until(machinesPending).toBe(false)
  const schedule: SchedulerPro = scheduler = new QueueSchedule({
    ref: 'schedule',
    appendTo: 'main',
    multiEventSelect: false,
    createEventOnDblClick: false,
    visibleDate: {
      date: addHours(today, -3),
      block: 'start',
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
    events: modifiedEvents.value,
    listeners: {
      eventSelectionChange({ action }: any) {
        if (action === 'select' || action === 'update') {
          schedule.widgetMap.parameterButton.disabled = false
          schedule.widgetMap.recipeButton.disabled = false
          schedule.widgetMap.noteButton.disabled = false
        } else {
          schedule.widgetMap.parameterButton.disabled = true
          schedule.widgetMap.recipeButton.disabled = true
          schedule.widgetMap.noteButton.disabled = true
        }
      },
    },
    eventRenderer({ eventRecord }: any) {
      const icons: string[] = []
      if (eventRecord.originalData.eventType !== 'stop') {
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
    onEventMenuBeforeShow: (a: any) => {
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
        renderer: (data: any) => `
        <div class="b-resource-info" role="presentation">
          <dl role="presentation">
            <dt role="presentation">${data.record.name}</dt>
            <dd class="b-resource-role" role="presentation"></dd>
            <dd class="b-resource-meta" role="presentation">
              <div class="totalAlarmCount">${t('queue-based.alarm-count')}: ${data.record.totalAlarmCount}</div>
            </dd>
          </dl>
        </div>
        `,
        enableCellContextMenu: true,
        cellMenuItems: {
          vnc: {
            text: 'VNC',
            icon: 'b-fa b-fa-solid b-fa-ethernet',
            onItem: (a: any) => {
              showModal.vnc.show = !showModal.vnc.show
              showModal.vnc.currentMachine.id = a.id
              showModal.vnc.currentMachine.name = a.name
            },
          },
          machineSort: {
            text: 'Machine Sort',
            icon: 'b-fa b-fa-solid b-fa-list',
            onItem: () => {
              showModal.machineSort.show = !showModal.machineSort.show
            },
          },
        },
        field: 'name',
      },
    ],
    features: {
      sort: false,
      stripe: true,
      percentBar: {
        allowResize: false,
        showPercentage: false,
      },
      dependencies: false,
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
          removeRow: {
            hidden: true,
          },
        },
      },
      eventMenu: {
        items: {
          taskEdit: {
            hidden: true,
          },
          delete: {
            icon: 'b-fa-solid b-fa-trash',
            text: t('queue-based.ctx-menu.task-delete'),
            onItem({ eventRecord }: any) {
              deleteEvent(eventRecord.originalData.id)
                .then(() => eventRecord.unassign())
                .catch(err => console.error(err))
            },
          },
          unplan: {
            icon: 'b-fa-solid b-fa-calendar-xmark',
            text: t('queue-based.ctx-menu.remove-plan'),
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
            text: t('queue-based.ctx-menu.pin'),
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
            text: t('queue-based.ctx-menu.unpin'),
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
          changeColor: {
            icon: 'b-fa-solid b-fa-palette',
            text: t('queue-based.ctx-menu.change-color'),
            async onItem() {
              console.log('COLOR PICKER')
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
            text: t('queue-based.ctx-menu.properties'),
            onItem({ eventRecord, assignmentRecord }: any) {
              showModal.properties.show = true
              showModal.properties.unit.planKey = eventRecord.originalData.id
              showModal.properties.unit.jobOrder = eventRecord.originalData.name
              showModal.properties.unit.machineId = assignmentRecord.originalData.resourceId
              showModal.properties.unit.fabricWeight = eventRecord.originalData.fabricWeight
              showModal.properties.unit.theoreticalDuration = eventRecord.originalData.theoreticalDuration
            },
          },
        },
      },
      taskEdit: false,
      headerZoom: true,
      timeRanges: {
        showHeaderElements: true,
        showCurrentTimeLine: true,
      },
      eventTooltip: {
        hoverDelay: 800,
        hideDelay: 500,
        template: (data: any) => eventTooltip(data.eventRecord, scheduler),
      },
    },
    tbar: [
      {
        type: 'combo',
        ref: 'scrollToEvent',
        placeholder: 'L{scrollToEvent}',
        editable: true,
        store: scrollStore,
        displayField: 'jobOrder',
        valueField: 'id',
        onAction: ({ record }: any) => {
          const event: any = schedule.events.find(item => item.id === record.id)
          if (event) {
            event.cls = 'custom-focus'
            setTimeout(() => {
              event.cls = ''
            }, 1000)
            scheduler.scrollEventIntoView(event, {
              highlight: true,
              animate: false,
            })
          }
        },
      },
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
    ],
  } as Partial<SchedulerProConfig>)
  if (import.meta.dev) {
    // @ts-expect-error missing type
    window.sch = schedule
  }
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
      renderer: (data: any) => `${data.record.name}`,
    }, {
      type: 'duration',
      minWidth: 100,
      align: 'center',
    }],
    features: {
      cellEdit: false,
      cellMenu: {
        items: {
          removeRow: false,
          delete: false,
          copy: false,
          cut: false,
          search: false,
          paste: false,
        },
      },
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
          grid.features.search.search(value, false)
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

  startDate.value = schedule.timeAxis.startDate.toISOString()
  endDate.value = schedule.timeAxis.endDate.toISOString()

  schedule.eventStore.on({
    async loadDateRange(e: any) {
      if (e.changed) {
        startDate.value = new Date(e.new.startDate).toISOString()
        endDate.value = new Date(e.new.endDate).toISOString()
      }
    },
  })
  await scheduleDataRefresh()
})
function capitalizeFirstLetter(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
LocaleManager.applyLocale(capitalizeFirstLetter(locale.value))
</script>

<template>
  <LoadingSpinner v-if="eventsPending" :has-background="false" />
  <div>
    <div class="w-full h-screen relative">
      <div id="main" class="w-full h-full" />
    </div>
    <EliarModal v-if="showModal.properties.show" @click.stop="showModal.properties.show = false">
      <template #default>
        <BatchProperties
          :plan-key="showModal.properties.unit.planKey"
          :machine-id="showModal.properties.unit.machineId"
          :job-order="showModal.properties.unit.jobOrder"
          :fabric-weight="showModal.properties.unit.fabricWeight"
          :theoretical-duration="showModal.properties.unit.theoreticalDuration"
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
        <SettingsMain
          @update-scheduler="refreshScheduler()"
          @add-column="(ev: any) => addGridColumn(ev)"
          @remove-column="(ev: any) => removeGridColumn(ev)"
        />
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.planParameters.show" @click.stop="showModal.planParameters.show = false">
      <template #default>
        <div class="w-full h-98vh overflow-auto">
          <PlanParameters :plan-key="showModal.planParameters.unit.name" />
        </div>
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
        <BatchNotes :job-order="showModal.notes.unit.name" @update-scheduler="refreshScheduler()" />
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.vnc.show" @click.stop="showModal.vnc.show = false">
      <template #default>
        <MachineVnc
          :machine-name="showModal.vnc.currentMachine.name"
          :machine-id="showModal.vnc.currentMachine.id"
          :websockify-url="config.public.websockifyUrl"
        />
      </template>
    </EliarModal>
    <EliarModal v-if="showModal.machineSort.show" @click.stop="showModal.machineSort.show = false">
      <template #default>
        <MachineSort :machines="machines" @update-scheduler="machineReload()" />
      </template>
    </EliarModal>
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
  @apply !rounded-9px;
}
#main {
  display: flex;
  flex-direction: row;
  flex: 1 1 100%;
}

#main .b-resourceheader {
  height: 100%;
}
.b-sch-event{
  @apply !rounded-9px;
}
.b-timeline-subgrid .b-sch-current-time {
  border: 1px solid red !important
}
/*.b-sch-event:not(.b-sch-event-selected) .b-sch-event-content{
  filter:brightness(0.8);
}*/
.custom-focus {
  filter: invert(60%);
}
.b-task-percent-bar-outer {
  @apply !rounded-9px !overflow-hidden e-border;
}
</style>
