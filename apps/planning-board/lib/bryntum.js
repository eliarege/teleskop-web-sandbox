import {
  AjaxHelper,
  DateHelper,
  DomHelper,
  DragHelper,
  EventModel,
  Grid,
  SchedulerPro,
  StringHelper,
  Toast,
  Tooltip,
} from '@bryntum/schedulerpro-trial'
import { io } from 'socket.io-client'

const serverUrl = `ws://$192.168.18.240:3500`
const socket = io(serverUrl)
socket.on('connection', (data) => {
  console.log('connection:', data)
})
function onDragStartSocket(task) {
  socket.emit('onDragStart', task)
}
socket.on('onDragStartResponse', async (res) => {
  console.log('onDragStartResponse:', res)
})
function onDropSocket() {
  socket.emit('onDrop')
}
socket.on('dropResponse', async (res) => {
  console.log('dropResponse:', res)
})
let prevMachineId
let theoreticalDuration
let endDate
function removeAttributes(element, pattern) {
  if (element) {
    for (const attr of element.attributes) {
      if (pattern.test(attr.name)) {
        element.removeAttribute(attr.name)
      }
    }
  }
}
function getResourceRow(resource) {
  return document.querySelector(`div[data-id="${resource.id}"]`)
}
export class Drag extends DragHelper {
  static get configurable() {
    return {
      callOnFunctions: true,
      cloneTarget: true,
      autoSizeClonedTarget: false,
      dropTargetSelector: '.b-grid-row:not(.b-group-row)',
      targetSelector: '.b-grid-row:not(.b-group-row, timerange)',
    }
  }

  afterConstruct() {
    this.scrollManager = this.schedule.scrollManager
  }

  createProxy(grabbedElement) {
    const { context, schedule, grid } = this
    const task = grid.getRecordFromElement(grabbedElement)
    const durationInPixels = schedule.timeAxisViewModel.getDistanceForDuration(task.durationMS)
    const proxy = document.createElement('div')
    proxy.style.cssText = ''

    proxy.style.width = `${durationInPixels}px`
    proxy.style.height = `${schedule.rowHeight - 2 * schedule.resourceMargin}px`
    proxy.classList.add(
      'b-sch-event-wrap',
      'b-sch-style-border',
      'b-unassigned-class',
      'b-sch-horizontal',
    )
    proxy.innerHTML = StringHelper.xss`
        <div class="b-sch-event b-has-content b-sch-event-withicon">
            <div class="b-sch-event-content">
                <i class="b-icon b-${task.iconCls}"></i>
                <div>
                    <div>${task.name}</div>
                </div>
            </div>
        </div>
    `

    let totalDuration = 0
    grid.selectedRecords.forEach(task => (totalDuration += task.duration))
    context.totalDuration = totalDuration
    return proxy
  }

  async onDragStart({ context }) {
    // TODO: Lock context.grabbed
    // set grabbed status to false if needed (figure out wtf is needed)
    const { schedule, grid } = this
    const { eventTooltip, eventDrag } = schedule.features
    const { selectedRecords, store } = grid
    onDragStartSocket(selectedRecords[0].originalData.id)
    context.task = grid.getRecordFromElement(context.grabbed)
    theoreticalDuration = await $fetch('api/theoreticalDuration', {
      query: { planKey: context.task.originalData.id },
    })
    const isValid = await $fetch('/api/isValid', {
      query: { planKey: context.task.originalData.id },
    })
    context.isValid = isValid
    context.relatedElements = selectedRecords
      .sort((r1, r2) => store.indexOf(r1) - store.indexOf(r2))
      .map(
        rec => rec !== context.task && grid.rowManager.getRowFor(rec).element,
      )
      .filter(el => el)

    eventTooltip.disabled = true
    schedule.enableScrollingCloseToEdges(schedule.timeAxisSubGrid)
    if (eventDrag.showTooltip && !this.tip) {
      this.tip = new Tooltip({
        align: 'b-t',
        clippedBy: [schedule.timeAxisSubGridElement, schedule.bodyContainer],
        forElement: context.element,

        cls: 'b-popup b-sch-event-tooltip',
      })
    }
    if (context.grabbed) {
      for (let i = 0; i < isValid.length; i++) {
        const currentRow = document.querySelector(`div[data-id="${isValid[i].machineId}"]`)
        if (isValid[i].valid) {
          currentRow?.setAttribute('bgGreen', '')
        } else {
          currentRow?.setAttribute('bgRed', '')
        }
      }
    }
  }

  async onDrag({ event, context }) {
    const { schedule } = this
    const { task } = context
    const coordinate = DomHelper[`getTranslate${schedule.isHorizontal ? 'X' : 'Y'}`](context.element)
    const machine = context.target && schedule.resolveResourceRecord(context.target, [
      event.offsetX,
      event.offsetY,
    ])
    const startDate = schedule.getDateFromCoordinate(
      coordinate,
      'round',
      false,
    )
    context.machine = machine
    if (machine) {
      const currentMachineId = machine.id
      prevMachineId = currentMachineId
      endDate = startDate && DateHelper.add(startDate, theoreticalDuration.find(a => a.machineId === currentMachineId).theoreticalDuration, 'seconds')
    }
    const isValid = context.isValid
    // TODO: Machine capacity and program comparison for context.valid
    context.valid = Boolean(startDate && machine)
      && !(startDate < new Date())
      && (schedule.allowOverlap || schedule.isDateRangeAvailable(startDate, endDate, null, machine))
      && (isValid.length > 0 ? isValid.find(a => a.machineId === machine.id).valid : true)
    if (this.tip) {
      if (!context.valid) {
        if (!schedule.isDateRangeAvailable(startDate, endDate, null, machine)) {
          this.tip.html = `
            <div class="b-sch-event-title" style="color: #FF2E51 !important">
            You can not overlap events!
            </div>
            `
          this.tip.showBy(context.element)
        } else if (!isValid.find(a => a.machineId === machine.id).valid) {
          this.tip.html = `
              <div class="b-sch-event-title" style="color: #FF2E51 !important">
              Programs does not Match!
              </div>
          `
        } else {
          this.tip.html = `
        <div class="b-sch-event-title" style="color: #FF2E51 !important">
        Event can not be scheduled before current time!
        </div>
        `
          this.tip.showBy(context.element)
        }
      }
      if (context.valid) {
        const dateFormat = schedule.displayDateFormat
        const formattedStartDate = DateHelper.format(startDate, dateFormat)
        const formattedEndDate = DateHelper.format(endDate, dateFormat)

        this.tip.html = `
                <div class="b-sch-tooltip-startdate">Starts: ${formattedStartDate}</div>
                <div class="b-sch-tooltip-enddate">Ends: ${formattedEndDate}</div>
            `
        this.tip.showBy(context.element)
      }
    }
  }

  async onDrop({ context }) {
    /**
     * @type {import('@bryntum/schedulerpro').SchedulerPro}
     */
    // TODO: Remove all locks
    const schedule = this.schedule
    const { task, target, valid, element, machine } = context

    this.tip?.hide()
    schedule.disableScrollingCloseToEdges(this.schedule.timeAxisSubGrid)
    onDropSocket()
    if (valid && target) {
      context.task.originalData.notStarted = true
      const coordinate = DomHelper.getTranslateX(element)
      const startDate = schedule.getDateFromCoordinate(
        coordinate,
        'round',
        false,
      )
      if (!startDate)
        return

      this.grid.store.remove(task)
      task.setStartDate(startDate)
      const machine = schedule.resolveResourceRecord(context.target)
        .originalData.id

      await schedule.scheduleEvent({
        eventRecord: task,
        startDate,
        resourceRecord: machine,
      })
      const newEvent = {
        planKey: task.originalData.id,
        machineId: machine,
        plannedStartTime: startDate,
        theoreticalDuration: task.originalData.theoricalDuration,
      }
      AjaxHelper.post('/api/planningBoardPost', newEvent, { credentials: 'omit' })
        .then(() => schedule.renderRows())
      Toast.show('Event saved')
    }

    if (machine) {
      machine.cls = ''
    }
    schedule.features.eventTooltip.disabled = false
    for (let i = 0; i < schedule.resources.length; i++) {
      const element = schedule.resources[i]
      const currentRow = getResourceRow(element)
      removeAttributes(currentRow, /^bg/)
    }
  }

  set schedule(schedule) {
    this._schedule = schedule
    this.scrollManager = schedule.scrollManager
  }

  get schedule() {
    return this._schedule
  }
}
export class Task extends EventModel {
  static $name = 'Task'

  // case this.isRunning:
  //   return 'green'

  // case this.isStopped:
  //   return 'gray'

  // case this.isDeleted:
  //   return 'orange'

  // default: return 'blue'

  get eventColor() {
    const ptSettings = JSON.parse(localStorage.getItem('pt-settings'))
    const completedBatchSettings = ptSettings.completedBatch
    const ongoingBatchBatchSettings = ptSettings.ongoingBatch
    const plannedBatchBatchSettings = ptSettings.plannedBatch
    switch (true) {
      case (!completedBatchSettings.isBatchFabricColor && this.isFinished && this.deviation > 0):
        return completedBatchSettings.deviationBatchFabricColor
      case (!completedBatchSettings.isBatchFabricColor && this.isFinished):
        return completedBatchSettings.actualBatchFabricColor

      case (!plannedBatchBatchSettings.isBatchFabricColor && !this.isRunning && this.deviation > 0):
        console.log(this)
        return plannedBatchBatchSettings.deviationBatchFabricColor
      case (!plannedBatchBatchSettings.isBatchFabricColor && !this.isRunning):
        return plannedBatchBatchSettings.actualBatchFabricColor

      case (!ongoingBatchBatchSettings.isBatchFabricColor && this.isRunning && this.deviation > 0):
        return ongoingBatchBatchSettings.deviationBatchFabricColor
      case (!ongoingBatchBatchSettings.isBatchFabricColor && this.isRunning):
        return ongoingBatchBatchSettings.actualBatchFabricColor

      case this.hasAlarm:
        return 'red'
      case this.isLocked:
        return 'yellow'
      case this.isStopped:
        return 'gray'
      case this.isDeleted:
        return 'orange'
      default:
        return '#03a9f4'
    }
  }

  static get defaults() {
    return {
      durationUnit: 'h',
    }
  }
}
export class Schedule extends SchedulerPro {
  static get $name() {
    return 'Schedule'
  }

  static get type() {
    return 'schedule'
  }

  static get defaultConfig() {
    return {
      subGridConfigs: {
        locked: {
          maxWidth: 400,
          flex: 1,
        },
        normal: {
          flex: 2,
        },
      },
      features: {
        stripe: true,
        calendarHighlight: {
          calendar: 'resource',
          collectAvailableResources({ scheduler, eventRecords }) {
            const draggedTask = eventRecords[0]
            return scheduler.resourceStore.query(
              resourceRecord =>
                resourceRecord.processes
                  .map(a => a.id)
                  .includes(draggedTask.process) || !draggedTask.process,
            )
          },
        },
        eventMenu: {
          items: {
            unassign: {
              text: 'Unassign',
              icon: 'b-fa b-fa-user-times',
              weight: 200,
              onItem: ({ eventRecord }) => eventRecord.unassign(),
            },
          },
        },
      },
      // onEventDragStart({ context }) {
      //   console.log('arg:', context)
      //   // console.log('this:', this)
      // },
      // onEventDrag(arg) {
      //   // console.log('arg:', arg)
      // },
      onEventDrop({ context }) {
        const { valid, element, target } = context.context
        const updatedEvent = {
          planKey: context.context.grabbed.elementData.eventId,
          machineId: context.newResource.originalData.id,
          plannedStartTime: context.startDate,
        }
        AjaxHelper.post('/api/planningBoardUpdate', updatedEvent, { credentials: 'omit' })
          .then(() => this.renderRows())
      },
      rowHeight: 50,
      barMargin: 4,
      columns: [
        {
          type: 'resourceInfo',
          text: 'Name',
          flex: 1,
          width: 250,
          showEventCount: false,
          showRole: true,
          field: 'name',
        },
        {
          text: 'Tasks',
          editor: true,
          renderer: data => `${data.record.tasks.length || ''}`,
          align: 'center',
          sortable: (a, b) => (a.tasks.length < b.tasks.length ? -1 : 1),
          width: 70,
          hidden: true,
        },
        {
          text: 'Alarms',
          width: 35,
          align: 'center',
          hidden: true,
          field: 'alarm',
        },
      ],
      viewPreset: {
        base: 'hourAndDay',
        columnLinesFor: 0,
        headers: [
          {
            unit: 'd',
            align: 'center',
            dateFormat: 'ddd DD MMM',
          },
          {
            unit: 'h',
            align: 'center',
            dateFormat: 'HH',
          },
        ],
      },
      removeUnassignedEvent: false,
      allowOverlap: false,
    }
  }
}
Schedule.initClass()

export class UnplannedGrid extends Grid {
  /**
   * Original class name getter. See Widget.$name docs for the details.
   * @returns {string}
   */
  static get $name() {
    return 'UnplannedGrid'
  }

  static get type() {
    return 'unplannedgrid'
  }

  static get configurable() {
    return {
      features: {
        stripe: true,
        sort: 'name',
      },

      columns: [
        {
          text: 'Unassigned tasks',
          flex: 1,
          field: 'name',
          htmlEncode: false,
          minWidth: 200,
          renderer: data =>
            StringHelper.xss`<i class="${data.record.iconCls}"></i>${data.record.name}`,
        },
        {
          type: 'duration',
          text: 'Duration',
          width: 100,
          align: 'right',
        },
      ],
      rowHeight: 50,
      disableGridRowModelWarning: true,
    }
  }
}

UnplannedGrid.initClass()
