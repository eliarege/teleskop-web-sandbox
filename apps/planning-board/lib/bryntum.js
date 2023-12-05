import {
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

const serverUrl = 'ws://192.168.19.240:3500'
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
  }

  onDrag({ event, context }) {
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
    const endDate = startDate && DateHelper.add(startDate, task.originalData.duration, 'h')
    context.machine = machine
    // TODO: Machine capacity and program comparison for context.valid
    context.valid = Boolean(startDate && machine)
      && !(startDate < new Date())
      && (schedule.allowOverlap || schedule.isDateRangeAvailable(startDate, endDate, null, machine))
    if (this.tip) {
      if (!context.valid) {
        if (!schedule.isDateRangeAvailable(startDate, endDate, null, machine)) {
          this.tip.html = `
                <div class="b-sch-event-title" style="color: #FF2E51 !important">
                You can not overlap events!
                </div>
            `
          this.tip.showBy(context.element)
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
                <div class="b-sch-event-title">${task.name}</div>
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

      Toast.show('Event saved')
    }

    if (machine) {
      machine.cls = ''
    }
    schedule.features.eventTooltip.disabled = false
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

  get eventColor() {
    switch (true) {
      // case this.notStarted:
      //   return 'gray'

      case this.isDeviation:
        return 'red'

      case this.isFinished:
        return 'pink'

      case this.hasAlarm:
        return 'red'

        // case this.isLocked:
        //   return 'yellow'

      case this.isRunning:
        return 'green'

      case this.isStopped:
        return 'gray'

      case this.isDeleted:
        return 'orange'

      default: return 'blue'
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
      // onEventDrop(arg) {
      //   // console.log('arg:', arg)
      // },
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
