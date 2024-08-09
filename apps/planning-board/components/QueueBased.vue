<!-- eslint-disable no-new -->
<script setup lang="ts">
import type { DragHelperConfig, EventModel, Grid, GridConfig, SchedulerPro, SchedulerProConfig } from '@bryntum/schedulerpro-trial'
import { LocaleManager, Splitter, Store, Toast } from '@bryntum/schedulerpro-trial'
import { EliarModal, LoadingSpinner } from '@teleskop/ui'
import { determineTextColor } from '@teleskop/utils'
import { useDocumentVisibility } from '@vueuse/core'
import { useFuse } from '@vueuse/integrations/useFuse'
import { addDays, addHours } from 'date-fns'
import { eventTooltip } from '~/composables/helper'
import { QueueDrag, QueueSchedule, QueueTask, QueueUnplannedGrid, TaskStore } from '~/lib/queueBased'
import type { QueueBasedEvent, QueueBasedNonActualEvent } from '~/shared/queueBased'
import type { MachineStatus, PlanParameters } from '~/shared/types'
import { useSettingStore } from '~/store/settings'

const { t, locale, d } = useI18n()
const visibility = useDocumentVisibility()
const config = useRuntimeConfig()

defineExpose({
  scrollToDate,
  refreshScheduler,
  addGridColumn,
  removeGridColumn,
  dateRangeEnd,
  zoomIn,
  zoomOut,
  resetZoom: zoomReset,
  unplannedSearch,
})

let scheduler: SchedulerPro
let grid: Grid

const refreshInterval = 60_000
const today = new Date()
const startDate = ref(today.toISOString())
const endDate = ref(addDays(today, 3).toISOString())
const jobOrderUploadLoading = ref(false)

const refreshingScheduler = ref(false)
const store = useSettingStore()

const { data: events, refresh: eventRefresh, pending: eventPending } = await useFetch<QueueBasedEvent[]>('/api/queueBased/schedulerEvents', {
  immediate: false,
  default: () => [],
  query: {
    startDate,
    endDate,
    includeStops: store.settings.showStops.show,
  },
})
const { data: machines, refresh: machineRefresh, pending: machinesPending } = await useFetch<MachineStatus[]>('/api/machineList', {
  lazy: true,
  default: () => [],
  transform: unsortedMachines => sortMachines(unsortedMachines),
})
const { data: unScheduledEvents, refresh: unScheduledRefresh } = await useFetch('/api/unplannedEvents')
// #region MODALS
async function uploadJobOrder(planKey: number) {
  const event: any = scheduler.events.find(e => e.id === planKey)
  const machine: any = scheduler.resources.find(e => e.id === event.resourceId)

  let program = event.originalData.programNoList
  if (program.endsWith(',')) {
    program = program.slice(0, -1)
  }

  const machineId = machine.originalData.id
  const machineIp = machine.originalData.machineIpAddress
  const jobOrder = event.originalData.jobOrder
  const batchStart = event.originalData.isStarted

  jobOrderUploadLoading.value = true

  const controller = new AbortController()
  const timeout = 5000

  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException(t('upload-joborder.fail'), 'TimeoutError'))
  }, timeout)

  try {
    const res: PlanParameters[] | string = await $fetch('/api/machineUpload', {
      method: 'PUT',
      query: { program, machineId, planKey, machineIp, jobOrder },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (res === 'NO PROGRAM') {
      Toast.show(t('upload-joborder.no-program'))
    } else if (typeof res !== 'string' && res.some(f => f.value === null)) {
      const uploadData = {
        program,
        machineId,
        planKey,
        machineIp,
        jobOrder,
      }

      const missingParams = res.filter(f => f.value === null)
      setPlanParameters(true, planKey, machineId, program, batchStart, missingParams, true, uploadData)
    } else Toast.show(t('job-order.upload-succes'))
  } catch (err) {
    Toast.show(t('upload-joborder.fail'))
  }
  jobOrderUploadLoading.value = false
}
const planParametersModal = reactive({
  show: false,
  planKey: 0,
  machineId: 0,
  progNoList: '',
  isBatchStarted: false,
  missingParams: [] as PlanParameters[],
  isSendMachine: false,
})
function setPlanParameters(show: boolean, planKey: number, machineId: number, progNoList: string, isBatchStarted: boolean, missingParams: PlanParameters[], isSendMachine: boolean, uploadData?: any) {
  planParametersModal.show = show
  planParametersModal.machineId = machineId
  planParametersModal.progNoList = progNoList
  planParametersModal.planKey = planKey
  planParametersModal.isBatchStarted = isBatchStarted
  planParametersModal.missingParams = missingParams
  planParametersModal.isSendMachine = isSendMachine
  if (uploadData) {
    planParametersModal.uploadData = uploadData
  }
}

const propertiesModal = reactive({
  show: false,
  machineId: 0,
  jobOrder: '',
  planKey: 0,
  fabricWeight: 0,
  theoreticalDuration: 0,
  planParameters: {},
})
function setProperties(machineId: number, jobOrder: string, planKey: number, fabricWeight: number, theoreticalDuration: number, program: string, isBatchStarted: boolean) {
  propertiesModal.show = true
  propertiesModal.planKey = planKey
  propertiesModal.jobOrder = jobOrder
  propertiesModal.machineId = machineId
  propertiesModal.fabricWeight = fabricWeight
  propertiesModal.theoreticalDuration = theoreticalDuration

  setPlanParameters(false, planKey, machineId, program, isBatchStarted, [], false)
}
const vncModal = reactive({
  show: false,
  currentMachine: {
    id: 0,
    name: '',
  },
})
function setVnc(id: number, name: string) {
  vncModal.show = true
  vncModal.currentMachine.id = id
  vncModal.currentMachine.name = name
}
const machineSortModal = ref(false)
// #endregion

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

function setFabricColor(event: QueueBasedEvent) {
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
    return plannedBatchFabricColor && event.fabricColor ? integerToHex(event.fabricColor) : plannedBatchColor
  }
  if (event.eventType === 'finished') {
    return completedBatchFabricColor && event.fabricColor ? integerToHex(event.fabricColor) : completedBatchColor
  }
  if (event.eventType === 'ongoing') {
    return ongoingBatchFabricColor && event.fabricColor ? integerToHex(event.fabricColor) : ongoingBatchColor
  }
  if (event.eventType === 'manual') {
    if (new Date(event.endTime) < new Date()) {
      return completedBatchFabricColor && event.fabricColor ? integerToHex(event.fabricColor) : completedBatchColor
    }
    return ongoingBatchFabricColor && event.fabricColor ? integerToHex(event.fabricColor) : ongoingBatchColor
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

function setEventName(event: QueueBasedEvent): Values<QueueBasedEvent> {
  const plannedBatchText = store.settings.plannedBatchText || 'jobOrder'
  const completedBatchText = store.settings.completedBatchText || 'jobOrder'
  const ongoingBatchText = store.settings.ongoingBatchText || 'jobOrder'

  if (event.eventType === 'planned') {
    const formattedText = isDate(event[plannedBatchText]) ? d(event[plannedBatchText], 'datetime') : event[plannedBatchText]
    return formattedText
  }
  if (event.eventType === 'finished' || event.eventType === 'manual') {
    const formattedText = isDate(event[ongoingBatchText]) ? d(event[ongoingBatchText], 'datetime') : event[ongoingBatchText]
    return formattedText
  } else if (event.eventType === 'ongoing') {
    const formattedText = isDate(event[completedBatchText]) ? d(event[completedBatchText], 'datetime') : event[completedBatchText]
    return formattedText
  } else {
    return ' '
  }
}
function setId(event: QueueBasedEvent) {
  switch (event.eventType) {
    case 'finished':
      return event.batchKey
    case 'manual':
      return event.batchKey
    case 'ongoing':
      return event.batchKey
    case 'planned':
      return event.planKey
    case 'unplanned':
      return event.planKey
    case 'stop':
      return `stop-${event.stopNumber}`
  }
}
function setTextColor(bgColor: string): string {
  return determineTextColor(bgColor) === 'black' ? 'text-black' : 'text-white'
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
      cls: setTextColor(setFabricColor(ev)),
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
  }
}))
const exactMatch = ref(false)
const options = computed(() => ({
  fuseOptions: {
    keys: ['jobOrder'],
    isCaseSensitive: false,
    threshold: exactMatch.value ? 0 : undefined,
  },
  matchAllWhenSearchEmpty: true,
}))

const { results } = useFuse(() => store.unplannedText, modifiedUnscheduledEvents, options)
async function scheduleDataRefresh() {
  await until(visibility).toBe('visible')
  try {
    await refreshScheduler()
  } catch (err) {
    Toast.show(t('toast.fail.refresh'))
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

watch(modifiedEvents, (newVal: QueueBasedEvent[]) => {
  scheduler.events = newVal
  scrollStore.data = newVal
})
watch(() => results.value, () => {
  grid.store.data = results.value.map(e => e.item)
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
  scheduler.startDate = new Date(store.schedulerDateModel.from)
  scheduler.endDate = new Date(store.schedulerDateModel.to)
  scheduler.zoomLevel = 17
  scheduler.refreshRows()
}
watch(locale, () => {
  document.querySelectorAll('.totalAlarmCount').forEach((ev) => {
    const count = ev.textContent?.split(':')[1]
    ev.textContent = `${t('queue-based.alarm-count')}:${count}`
  })
})
function zoomIn() {
  scheduler.zoomIn()
}
function zoomOut() {
  scheduler.zoomOut()
}
function zoomReset() {
  scheduler.zoomLevel = 17
}
function unplannedSearch(str: string) {
  grid.features.search.search(str)
}
async function scrollToDate(ev: { jobOrder: string, startTime: string }) {
  const event = scheduler.events.find(e => e.jobOrder === ev.jobOrder)
  if (event) {
    event.cls = 'custom-focus'
    scheduler.scrollEventIntoView(event, {
      highlight: true,
      animate: false,
    })
    setTimeout(() => {
      event.cls = ''
    }, 1000)
  } else {
    scheduler.scrollToDate(new Date(ev.startTime))
    if (!refreshingScheduler.value) {
      await until(refreshingScheduler).toBe(true)
    }
    await until(refreshingScheduler).toBe(false)
    const event = scheduler.events.find(e => e.jobOrder === ev.jobOrder)
    if (!event) {
      Toast.show(t('toast.fail.load'))
    } else {
      event.cls = 'custom-focus'
      scheduler.scrollEventIntoView(event, {
        highlight: true,
        animate: false,
      })
      setTimeout(() => {
        event.cls = ''
      }, 1000)
    }
  }
}

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
    eventStyle: null,
    onEventClick({ eventRecord }: EventModel) {
      store.selectedEvent = eventRecord
    },
    onCellClick() {
      store.selectedEvent = {}
    },
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

        if (eventRecord.originalData.eventType === 'finished') {
          icons.push('b-fa b-fa-solid b-fa-flag-checkered')
        } else if (eventRecord.originalData.eventType === 'ongoing') {
          icons.push('b-fa b-fa-solid b-fa-play')
        } else if (eventRecord.originalData.eventType === 'manual') {
          if (eventRecord.originalData.endDate < new Date()) {
            icons.push('b-fa b-fa-solid b-fa-flag-checkered')
          } else {
            icons.push('b-fa b-fa-solid b-fa-play')
          }
          icons.push('b-fa b-fa-solid b-fa-m')
        } else if (eventRecord.originalData.isStopped) {
          icons.push('b-fa b-fa-solid b-fa-stop')
        } else {
          icons.push('b-fa b-fa-solid b-fa-list-check')
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
            onItem: (arg: any) => {
              const id = arg.record.id
              const name = arg.record.name
              setVnc(id, name)
            },
          },
          machineSort: {
            text: 'Machine Sort',
            icon: 'b-fa b-fa-solid b-fa-list',
            onItem: () => {
              machineSortModal.value = !machineSortModal.value
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
              const planKey = eventRecord.originalData.id
              const jobOrder = eventRecord.originalData.name
              const machineId = assignmentRecord.originalData.resourceId
              const fabricWeight = eventRecord.originalData.fabricWeight
              const theoreticalDuration = eventRecord.originalData.theoreticalDuration
              let program: string = eventRecord.originalData.programNoList
              if (program.endsWith(',')) {
                program = program.slice(0, -1)
              }
              const isBatchStarted = eventRecord.originalData.isStarted
              setProperties(machineId, jobOrder, planKey, fabricWeight, theoreticalDuration, program, isBatchStarted)
            },
          },
          sendToMachine: {
            icon: 'b-fa-solid b-fa-calendar-xmark',
            text: t('upload-joborder._'),
            async onItem({ eventRecord, resourceRecord }) {
              const planKey: number = eventRecord.originalData.planKey
              await uploadJobOrder(planKey)
              jobOrderUploadLoading.value = false
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
    flex: '0 1 300px',
    project: schedule.project,
    store: {
      data: results.value.map(e => e.item),
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
      refreshingScheduler.value = true
      if (e.changed) {
        startDate.value = new Date(e.new.startDate).toISOString()
        endDate.value = new Date(e.new.endDate).toISOString()
      }
      refreshingScheduler.value = false
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
  <LoadingSpinner v-if="eventPending" :has-background="false" />
  <LoadingSpinner v-if="jobOrderUploadLoading" :has-background="true" />
  <div>
    <div class="w-full h-screen relative">
      <div id="main" class="w-full h-full" />
    </div>
    <EliarModal v-if="propertiesModal.show" @click.stop="propertiesModal.show = false">
      <template #default>
        <BatchProperties
          :plan-key="propertiesModal.planKey"
          :machine-id="propertiesModal.machineId"
          :job-order="propertiesModal.jobOrder"
          :fabric-weight="propertiesModal.fabricWeight"
          :theoretical-duration="propertiesModal.theoreticalDuration"
          :plan-parameters="planParametersModal"
        />
      </template>
    </EliarModal>
    <EliarModal v-if="planParametersModal.show" @click.stop="planParametersModal.show = false">
      <template #default>
        <div class="w-full h-98vh overflow-auto">
          <PlanParameters v-bind="planParametersModal" @upload-machine="uploadJobOrder" />
        </div>
      </template>
    </EliarModal>
    <EliarModal v-if="vncModal.show" @click.stop="vncModal.show = false">
      <template #default>
        <MachineVnc
          :machine-name="vncModal.currentMachine.name"
          :machine-id="vncModal.currentMachine.id"
          :websockify-url="config.public.websockifyUrl"
        />
      </template>
    </EliarModal>
    <EliarModal v-if="machineSortModal" @click.stop="machineSortModal = false">
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
  background-color: #03a9f4;
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

.b-sch-event {
  @apply !rounded-9px;
}

.b-timeline-subgrid .b-sch-current-time {
  border: 1px solid red !important;
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
