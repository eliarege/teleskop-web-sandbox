import {
  AjaxHelper,
  DateHelper,
  DomHelper,
  DragHelper,
  EventModel,
  Grid,
  LocaleHelper,
  LocaleManager,
  SchedulerPro,
  StringHelper,
  Toast,
  Tooltip,

} from '@bryntum/schedulerpro-trial'
import { io } from 'socket.io-client'

const trLocalization = {
  Object: {
    planparam: 'Plan Parametreleri',
    recipe: 'Reçete',
    process: 'Prosess Bilgileri',
    theoretical: 'Teorik Program',
    settings: 'Ayarlar',
    note: 'Notlar',
    datepicker: 'Tarih',
    rules: 'Kurallar',
    zoomin: 'Yakınlaştır',
    zoomout: 'Uzaklaştır',
    search: 'İş Emri Arama',
    overlap: 'Etkinlik, bu kaynaktaki başka bir Etkinlikle çakışıyor!',
    beforeNow: 'İş emrini güncel zamandan önceye planlayamazsın!',
    program: 'Programlar eşleşmiyor!',
    unassign: 'Planlanmamış İş Emirleri',
    machine: 'Makine İsmi',
    unassign: 'Planlanmamış İş Emirleri',
  },
}
const enLocalization = {
  Object: {
    planparam: 'Plan Parameters',
    recipe: 'Recipe',
    process: 'Process Information',
    theoretical: 'Theoretical Program',
    settings: 'Settings',
    note: 'Notes',
    datepicker: 'Date Picker',
    rules: 'Rules',
    zoomin: 'Zoom in',
    zoomout: 'Zoom Out',
    search: 'Job Order Search',
    overlap: 'Event overlaps existing event for this resource!',
    beforeNow: 'You can not schedule this event before current time!',
    program: 'Programs does not match',
    unassign: 'Unassigned Job Orders',
    machine: 'Machine Name',
    unassign: 'Unassigned Job Orders',
  },
}
LocaleHelper.publishLocale('Tr', trLocalization)
LocaleHelper.publishLocale('En', enLocalization)
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
export class TimeDrag extends DragHelper {
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
    theoreticalDuration = await $fetch('api/timeBased/theoreticalDuration', {
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
        if (isValid[i].programs) {
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
      && (isValid.length > 0 ? isValid.find(a => a.machineId === machine.id).programs : true)

    if (this.tip) {
      const startMonth = DateHelper.format(startDate, 'MMM')
      const startDay = DateHelper.format(startDate, 'D')

      const endMonth = DateHelper.format(endDate, 'MM')
      const endDay = DateHelper.format(endDate, 'D')

      const startMinuteRotation = (startDate.getMinutes() + startDate.getSeconds() / 60) * 6
      const startHourRotation = (startDate.getHours() % 12 + startDate.getMinutes() / 60) * 30

      const endMinuteRotation = (endDate.getMinutes() + endDate.getSeconds() / 60) * 6
      const endHourRotation = (endDate.getHours() % 12 + endDate.getMinutes() / 60) * 30

      const timeDisplay = text => `
      <div class="b-sch-clockwrap b-sch-clock-hour b-sch-tooltip-startdate">
                <div class="b-sch-clock">
                    <div class="b-sch-hour-indicator" style="transform: rotate(${startHourRotation}deg);">${startMonth}</div>
                    <div class="b-sch-minute-indicator" style="transform: rotate(${startMinuteRotation}deg);">${startDay}</div>
                    <div class="b-sch-clock-dot"></div>
                </div>
                <span class="b-sch-clock-text">${DateHelper.format(startDate, schedule.displayDateFormat)}</span>
            </div>
            <div class="b-sch-clockwrap b-sch-clock-hour b-sch-tooltip-enddate">
                <div class="b-sch-clock">
                    <div class="b-sch-hour-indicator" style="transform: rotate(${endHourRotation}deg);">${endMonth}</div>
                    <div class="b-sch-minute-indicator" style="transform: rotate(${endMinuteRotation}deg);">${endDay}</div>
                    <div class="b-sch-clock-dot"></div>
                </div>
                <span class="b-sch-clock-text">${DateHelper.format(endDate, schedule.displayDateFormat)}</span>
            </div>
            <div class="b-sch-event-title" style="color: #E07D80 !important">
          ${this.tip.L(text)}
        </div>
            `
      if (!context.valid) {
        if (!schedule.isDateRangeAvailable(startDate, endDate, null, machine)) {
          this.tip.html = timeDisplay('overlap')
          this.tip.showBy(context.element)
        } else if (!isValid.find(a => a.machineId === machine.id).valid) {
          this.tip.html = timeDisplay('program')
        } else {
          this.tip.html = timeDisplay('beforeNow')
          this.tip.showBy(context.element)
        }
      }
      if (context.valid) {
        this.tip.html = timeDisplay('')
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
      AjaxHelper.post('/api/timeBased/planningBoardPost', newEvent, { credentials: 'omit' })
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
export class TimeTask extends EventModel {
  static $name = 'Task'

  get eventColor() {
    const ptSettings = JSON.parse(localStorage.getItem('pt-settings'))
    const completedBatchSettings = ptSettings.completedBatch
    const ongoingBatchBatchSettings = ptSettings.ongoingBatch
    const plannedBatchBatchSettings = ptSettings.plannedBatch
    switch (true) {
      case (!completedBatchSettings.isBatchFabricColor && this.originalData.isFinished && this.originalData.deviation > 0):
        return completedBatchSettings.deviationBatchFabricColor
      case (!completedBatchSettings.isBatchFabricColor && this.originalData.isFinished):
        return completedBatchSettings.actualBatchFabricColor

      case (!plannedBatchBatchSettings.isBatchFabricColor && !this.originalData.isRunning && this.originalData.deviation > 0):
        return plannedBatchBatchSettings.deviationBatchFabricColor
      case (!plannedBatchBatchSettings.isBatchFabricColor && !this.originalData.isRunning):
        return plannedBatchBatchSettings.actualBatchFabricColor

      case (!ongoingBatchBatchSettings.isBatchFabricColor && this.originalData.isRunning && this.originalData.deviation > 0):
        return ongoingBatchBatchSettings.deviationBatchFabricColor
      case (!ongoingBatchBatchSettings.isBatchFabricColor && this.originalData.isRunning):
        return ongoingBatchBatchSettings.actualBatchFabricColor

      case this.isAlarm:
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
export class TimeSchedule extends SchedulerPro {
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
        AjaxHelper.post('/api/timeBased/planningBoardUpdate', updatedEvent, { credentials: 'omit' })
          .then(() => this.renderRows())
      },
      rowHeight: 50,
      barMargin: 4,
      columns: [
        {
          type: 'resourceInfo',
          text: 'L{machine}',
          flex: 1,
          width: 250,
          showEventCount: false,
          showRole: true,
          field: 'name',
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
export class TimeUnplannedGrid extends Grid {
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
          type: 'resourceInfo',
          text: 'L{unassign}',
          flex: 1,
          field: 'name',
          htmlEncode: false,
          minWidth: 200,
          renderer: data =>
            StringHelper.xss`<i class="${data.record.iconCls}"></i>${data.record.name}`,
        },
        {
          type: 'duration',
          width: 100,
          align: 'right',
        },
      ],
      rowHeight: 50,
      disableGridRowModelWarning: true,
    }
  }
}
