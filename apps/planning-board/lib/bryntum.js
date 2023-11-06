import { DateHelper, DomHelper, DragHelper, EventModel, EventStore, Grid, SchedulerPro, StringHelper, Toast, Tooltip } from '@bryntum/schedulerpro-trial'

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
    proxy.style.height = `${schedule.rowHeight - (2 * schedule.resourceMargin)}px`
    proxy.classList.add('b-sch-event-wrap', 'b-sch-style-border', 'b-unassigned-class', 'b-sch-horizontal')
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
    grid.selectedRecords.forEach(task => totalDuration += task.duration)
    context.totalDuration = totalDuration

    return proxy
  }

  async onDragStart({ context }) {
    const { schedule, grid } = this
    const { eventTooltip, eventDrag } = schedule.features
    const { selectedRecords, store } = grid

    context.task = grid.getRecordFromElement(context.grabbed)
    context.relatedElements = selectedRecords
      .sort((r1, r2) => store.indexOf(r1) - store.indexOf(r2))
      .map(rec => rec !== context.task && grid.rowManager.getRowFor(rec).element)
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
    const machine = context.target && schedule.resolveResourceRecord(context.target, [event.offsetX, event.offsetY])
    const startDate = schedule.getDateFromCoordinate(coordinate, 'round', false)
    const endDate = startDate && DateHelper.add(startDate, task.duration, task.durationUnit)
    context.machine = machine
    context.valid = Boolean(startDate && machine)
      && (schedule.allowOverlap || schedule.isDateRangeAvailable(startDate, endDate, null, machine))

    if (this.tip && context.valid) {
      const dateFormat = schedule.displayDateFormat
      const formattedStartDate = DateHelper.format(startDate, dateFormat)
      const formattedEndDate = DateHelper.format(endDate, dateFormat)

      this.tip.html = `
                <div class="b-sch-event-title">${task.name}</div>
                <div class="b-sch-tooltip-startdate">Starts: ${formattedStartDate}</div>
                <div class="b-sch-tooltip-enddate">Ends: ${formattedEndDate}</div>
            `
      this.tip.showBy(context.element)
    } else {
      this.tip?.hide()
    }
  }

  async onDrop({ context }) {
    // TODO: onDrop not working because context.task on line 51 is somehow not correct
    /**
     * @type {import('@bryntum/schedulerpro').SchedulerPro}
     */
    const schedule = this.schedule
    const { task, target, valid, element, machine } = context
    this.tip?.hide()
    schedule.disableScrollingCloseToEdges(this.schedule.timeAxisSubGrid)
    console.log('valid:', valid)
    if (valid && target) {
      const coordinate = DomHelper.getTranslateX(element)
      const startDate = schedule.getDateFromCoordinate(coordinate, 'round', false)
      if (!startDate)
        return

      this.grid.store.remove(task)
      task.setStartDate(startDate)
      const machine = schedule.resolveResourceRecord(context.target).originalData.id

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
};
export class Task extends EventModel {
  static $name = 'Task'

  static get defaults() {
    return {
      durationUnit: 'h',

      name: 'New event',

      iconCls: 'b-fa b-fa-asterisk',
    }
  }
}
export class TaskStore extends EventStore {
  static $name = 'TaskStore'

  static get defaultConfig() {
    return {
      modelClass: Task,
    }
  }

  add(records, silent = false) {
    const me = this

    if (me.autoRescheduleTasks) {
      me.isRescheduling = true
      me.beginBatch()
    }

    if (!Array.isArray(records)) {
      records = [records]
    }

    super.add(records, silent)

    if (me.autoRescheduleTasks) {
      me.endBatch()
      me.isRescheduling = false
    }
  }

  onUpdate({ record }) {
    if (this.autoRescheduleTasks && !this.isRescheduling) {
      this.rescheduleOverlappingTasks(record)
    }
  }

  rescheduleOverlappingTasks(eventRecord) {
    if (eventRecord.resource) {
      const futureEvents = []
      const earlierEvents = []

      eventRecord.resource.events.forEach((event) => {
        if (event !== eventRecord) {
          if (event.startDate >= eventRecord.startDate) {
            futureEvents.push(event)
          } else {
            earlierEvents.push(event)
          }
        }
      })

      if (futureEvents.length || earlierEvents.length) {
        futureEvents.sort((a, b) => (a.startDate > b.startDate ? 1 : -1))
        earlierEvents.sort((a, b) => (a.startDate > b.startDate ? -1 : 1))

        futureEvents.forEach((ev, i) => {
          const prev = futureEvents[i - 1] || eventRecord

          ev.startDate = DateHelper.max(prev.endDate, ev.startDate)
        });

        [eventRecord, ...earlierEvents].forEach((ev, i, all) => {
          const prev = all[i - 1]

          if (ev.endDate > Date.now() && ev !== eventRecord && prev) {
            ev.setEndDate(DateHelper.min(prev.startDate, ev.endDate), true)
          }
        })

        this.isRescheduling = false
      }
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
            return scheduler.resourceStore.query(resourceRecord => resourceRecord.processes.map(a => a.id).includes(draggedTask.process) || !draggedTask.process)
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
      rowHeight: 50,
      barMargin: 4,
      allowOverlap: false,
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
