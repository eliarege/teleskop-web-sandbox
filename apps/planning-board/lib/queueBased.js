import {
  DateHelper,
  DomHelper,
  DragHelper,
  EventModel,
  EventStore,
  Grid,
  LocaleHelper,
  SchedulerPro,
  StringHelper,
  Toast,
  Tooltip,
} from '@bryntum/schedulerpro-trial'
import { addMinutes, addSeconds } from 'date-fns'
import { io } from 'socket.io-client'
import { integerToHex } from '~/composables/helper'

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
    resetZoom: 'Yakınlaştırmayı sıfırla',
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
    resetZoom: 'Reset Zoom',
    search: 'Job Order Search',
    overlap: 'Event overlaps existing event for this resource!',
    beforeNow: 'You can not schedule this event before current time!',
    program: 'Programs does not match',
    unassign: 'Unassigned Job Orders',
    machine: 'Machine Name',
    unassign: 'Unassigned Job Orders',
  },
}
function archiveEvents(events) {
  return events.filter(ev => ev.originalData.isArchive !== true)
}
function sortEventsByDateDesc(events) {
  return archiveEvents(events).sort((a, b) => a.startDate < b.startDate ? -1 : 1)
}
function sortEventsByDateAsc(events) {
  return archiveEvents(events).sort((a, b) => a.startDate < b.startDate ? 1 : -1)
}
// allEvents on target machine
function generateQueueNumber(ev) {
  const modifiedEvents = sortEventsByDateDesc(ev)
  modifiedEvents.forEach((e, i) => {
    e.originalData.queueNumber = i + 1
  })
  return modifiedEvents
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
export class QueueDrag extends DragHelper {
  static get configurable() {
    return {
      callOnFunctions: true,
      cloneTarget: true,
      autoSizeClonedTarget: false,
      dropTargetSelector: '.b-grid-row:not(.b-group-row)',
      targetSelector: '.b-grid-row:not(.b-group-row, timerange)',
      testConfig: {
        transitionDuration: 0,
      },
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
    // set grabbed status to false if needed
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
    task.startDate = startDate

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
    const { schedule, grid } = this
    const { task, valid, target, machine } = context
    schedule.disableScrollingCloseToEdges(schedule.timeAxisSubGrid)
    const targetEventRecord = schedule.resolveEventRecord(target)
    if (target) {
      const nonStartedEvents = machine.events.filter(a => !a.originalData.isArchive)
      task.originalData.machineId = machine.id
      if (targetEventRecord) {
        task.startDate = addMinutes(targetEventRecord.endDate, 5)
        task.endDate = addSeconds(task.startDate, task.theoreticalDuration)
        const futureEvents = nonStartedEvents.filter(a => a.startDate >= task.startDate)
        futureEvents.forEach((ev, i) => {
          const prevEvent = futureEvents[i - 1] || task
          ev.startDate = addMinutes(prevEvent.endDate, 5)
          ev.endDate = addSeconds(ev.startDate, ev.theoreticalDuration)
        })
      } else {
        const sortedEvents = sortEventsByDateDesc(nonStartedEvents).map(a => a.originalData)
        const lastEvent = sortedEvents[sortedEvents.length - 1]
        if (lastEvent) {
          task.startDate = addMinutes(lastEvent.endDate, 5)
          task.endDate = addSeconds(task.startDate, task.originalData.theoreticalDuration)
        } else {
          task.startDate = new Date()
          task.endDate = addSeconds(task.startDate, task.originalData.theoreticalDuration)
        }
      }
      await schedule.scheduleEvent({
        eventRecord: task,
        startDate: task.startDate,
        resourceRecord: machine,
      })
        .then(async () => {
          grid.store.remove(task)
          task.assign(machine)
          // we need to reassign machine events to a variable after assigning the task with task.assign(machine)
          const machineEvents = machine.events.filter(a => !a.originalData.isArchive)
          const allTasks = generateQueueNumber(machineEvents)
          const body = allTasks.map((ev) => {
            return {
              planKey: ev.originalData.planKey,
              machineId: ev.originalData.machineId,
              queueNumber: ev.originalData.queueNumber,
            }
          })
          await $fetch('/api/planningBoardUpdate', {
            method: 'PUT',
            body,
          }).then(() => schedule.renderRows())
        }).catch(err => Toast.show(`Scheduling Failed: ${err}`))
    }
    schedule.features.eventTooltip.disabled = true

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
export class QueueTask extends EventModel {
  static $name = 'Task'

  get eventColor() {
    const ptSettings = JSON.parse(localStorage.getItem('pt-settings'))
    const completedBatchSettings = ptSettings.completedBatch
    const ongoingBatchBatchSettings = ptSettings.ongoingBatch
    const plannedBatchBatchSettings = ptSettings.plannedBatch
    switch (true) {
      case (!completedBatchSettings.isBatchFabricColor && this.originalData.isFinished && this.originalData.isDeviation):
        return completedBatchSettings.deviationBatchFabricColor
      case (!completedBatchSettings.isBatchFabricColor && this.originalData.isFinished):
        return completedBatchSettings.actualBatchFabricColor

      case (!plannedBatchBatchSettings.isBatchFabricColor && !this.originalData.isRunning && this.originalData.isDeviation):
        return plannedBatchBatchSettings.deviationBatchFabricColor
      case (!plannedBatchBatchSettings.isBatchFabricColor && !this.originalData.isRunning):
        return plannedBatchBatchSettings.actualBatchFabricColor

      case (!ongoingBatchBatchSettings.isBatchFabricColor && this.originalData.isRunning && this.originalData.isDeviation):
        return ongoingBatchBatchSettings.deviationBatchFabricColor
      case (!ongoingBatchBatchSettings.isBatchFabricColor && this.originalData.isRunning):
        return ongoingBatchBatchSettings.actualBatchFabricColor

      default:
        return integerToHex(this.originalData.color)
    }
  }

  static get defaults() {
    return {
      durationUnit: 'h',
    }
  }
}
export class TaskStore extends EventStore {
  static $name = 'TaskStore'

  static get defaultConfig() {
    return {
      modelClass: QueueTask,
    }
  }

  // use this if you want to re-schedule a first event
  async scheduleFirstEvent(previousResource, targetResource) {
    if (previousResource !== targetResource) {
      if (archiveEvents(previousResource.events).length > 1) {
        const previousResourceEvents = sortEventsByDateDesc(previousResource.events)
        const previousFirstEvent = previousResourceEvents[0]
        if (!previousFirstEvent.originalData.isStarted) {
          previousFirstEvent.startDate = new Date()
          previousFirstEvent.endDate = addSeconds(previousFirstEvent.startDate, previousFirstEvent.theoreticalDuration)
        } else {
          previousFirstEvent.startDate = previousFirstEvent.originalData.startDate
          previousFirstEvent.endDate = previousFirstEvent.originalData.endDate
        }
        const previousFutureEvents = []
        previousResourceEvents.forEach((event) => {
          if (event !== previousFirstEvent) {
            if (event.startDate >= previousFirstEvent.startDate) {
              previousFutureEvents.push(event)
            }
          }
        })
        previousFutureEvents.forEach((ev, i, all) => {
          const prev = all[i - 1] || previousFirstEvent
          ev.startDate = addMinutes(prev.endDate, 5)
          ev.endDate = addSeconds(ev.startDate, ev.theoreticalDuration)
        })
      }
      const targetResourceEvents = sortEventsByDateDesc(targetResource.events)
      const targetFirstEvent = targetResourceEvents[0]
      if (!targetFirstEvent.originalData.isStarted) {
        targetFirstEvent.startDate = new Date()
        targetFirstEvent.endDate = addSeconds(targetFirstEvent.startDate, targetFirstEvent.theoreticalDuration)
      } else {
        targetFirstEvent.startDate = targetFirstEvent.originalData.startDate
        targetFirstEvent.endDate = targetFirstEvent.originalData.endDate
      }

      const targetFutureEvents = []

      targetResourceEvents.forEach((event) => {
        if (event !== targetFirstEvent) {
          if (event.startDate >= targetFirstEvent.startDate) {
            targetFutureEvents.push(event)
          }
        }
      })

      targetFutureEvents.forEach((ev, i, all) => {
        const prev = all[i - 1] || targetFirstEvent
        ev.startDate = addMinutes(prev.endDate, 5)
        ev.endDate = addSeconds(ev.startDate, ev.theoreticalDuration)
      })
    } else {
      const resourceEvents = sortEventsByDateDesc(targetResource.events)
      const firstEvent = resourceEvents[0]
      firstEvent.startDate = new Date()
      firstEvent.endDate = addSeconds(firstEvent.startDate, firstEvent.theoreticalDuration)
      const futureEvents = []
      resourceEvents.forEach((event) => {
        if (event !== firstEvent) {
          if (event.startDate >= firstEvent.startDate) {
            futureEvents.push(event)
          }
        }
      })
      futureEvents.forEach((ev, i, all) => {
        const prev = all[i - 1] || firstEvent
        ev.startDate = addMinutes(prev.endDate, 5)
        ev.endDate = addSeconds(ev.startDate, ev.theoreticalDuration)
      })
    }
    await this.finalizeRescheduling(targetResource, previousResource)
  }

  // TODO: don't touch started events!
  // use this if you want to re-schedule any event
  async rescheduleEvents(eventRecord, previousResource, targetResource) {
    const futureEvents = []
    const firstEvent = sortEventsByDateDesc(eventRecord.resource.events)[0]
    if (firstEvent.originalData.isStarted) {
      firstEvent.startDate = firstEvent.originalData.startDate
      firstEvent.endDate = firstEvent.originalData.endDate
    } else {
      firstEvent.startDate = new Date()
      firstEvent.endDate = addSeconds(firstEvent.startDate, firstEvent.theoreticalDuration)
    }
    eventRecord.resource.events.forEach((event) => {
      if (event !== firstEvent) {
        if (event.startDate >= firstEvent.startDate) {
          futureEvents.push(event)
        }
      }
    })
    sortEventsByDateDesc(futureEvents)
    futureEvents.forEach((ev, i, all) => {
      const prev = all[i - 1] || firstEvent
      ev.startDate = addMinutes(prev.endDate, 5)
      ev.endDate = addSeconds(ev.startDate, ev.theoreticalDuration)
    })
    await this.finalizeRescheduling(targetResource, previousResource)
  }

  async finalizeRescheduling(targetResource, previousResource) {
    const targetResourceEvents = sortEventsByDateDesc(targetResource.events)
    const previousResourceEvents = sortEventsByDateDesc(previousResource.events)

    targetResourceEvents.forEach((event, i) => {
      event.originalData.queueNumber = i + 1
      event.resource = targetResource
      event.resourceId = targetResource.id
      event.originalData.resourceId = targetResource.id
    })
    previousResourceEvents.forEach((event, i) => {
      event.originalData.queueNumber = i + 1
    })
    const updatedEvents = targetResourceEvents.concat(previousResourceEvents).map(a => ({
      queueNumber: a.originalData.queueNumber,
      machineId: a.originalData.resourceId,
      planKey: a.originalData.id,
      plannedStartTime: a.startDate,
    }))
    await $fetch('/api/planningBoardUpdate', {
      method: 'PUT',
      body: updatedEvents,
    })
  }

  async rescheduleOverlappingTasks(eventRecord, targetResource, previousResource) {
    if (this.autoRescheduleTasks && !this.isRescheduling) {
      const isFirstEvent = eventRecord.resource.events[eventRecord.resource.events.length - 1] === eventRecord
      if (eventRecord.resource) {
        this.isRescheduling = true
        this.beginBatch()
        if (isFirstEvent) {
          await this.scheduleFirstEvent(previousResource, targetResource)
        } else {
          await this.rescheduleEvents(eventRecord, previousResource, targetResource)
        }
        this.isRescheduling = false
        this.endBatch()
      }
    }
  }
}

export class QueueSchedule extends SchedulerPro {
  static get $name() {
    return 'Schedule'
  }

  static get type() {
    return 'schedule'
  }

  static get configurable() {
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
      autoRescheduleTasks: true,
      useInitialAnimation: false,
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
      },
      async onEventDragStart({ context }) {
        context.task = context.eventRecord.originalData
        const planKey = context.task.id
        theoreticalDuration = await $fetch('api/theoreticalDuration', {
          query: { planKey },
        })
        const isValid = await $fetch('/api/isValid', {
          query: { planKey },
        })
        context.isValid = isValid
        context.theoreticalDuration = theoreticalDuration
        if (context.context.grabbed) {
          for (let i = 0; i < isValid.length; i++) {
            const currentRow = document.querySelector(`div[data-id="${isValid[i].machineId}"]`)
            if (isValid[i].programs) {
              currentRow?.setAttribute('bgGreen', '')
            } else {
              currentRow?.setAttribute('bgRed', '')
            }
          }
        }
      },
      onEventDrag({ context, event }) {
        const { startDate } = context
        const machine = context.context.target && this.resolveResourceRecord(context.context.target, [
          event.offsetX,
          event.offsetY,
        ])
        if (machine) {
          const currentMachineId = machine.id
          prevMachineId = currentMachineId
          endDate = addSeconds(startDate, context.theoreticalDuration?.find(a => a.machineId === currentMachineId).theoreticalDuration || 0)
        }
        const isValid = context.isValid
        context.valid = Boolean(startDate && machine)
        && !(startDate < new Date())
        && (this.allowOverlap || this.isDateRangeAvailable(startDate, endDate, null, machine))
        && (isValid?.length > 0 ? isValid.find(a => a.machineId === machine.id).programs : true)
      },
      onEventDrop({ resourceRecord, targetResourceRecord, eventRecords, context }) {
        const { valid } = context
        const { target } = context.context
        if (valid && target) {
          this.project.eventStore.rescheduleOverlappingTasks(eventRecords[0], targetResourceRecord, resourceRecord)
        }
        for (let i = 0; i < this.resources.length; i++) {
          const element = this.resources[i]
          const currentRow = getResourceRow(element)
          removeAttributes(currentRow, /^bg/)
        }
      },
      rowHeight: 50,
      barMargin: 4,
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
      // allowOverlap: false,
    }
  }

  updateAutoRescheduleTasks(autoRescheduleTasks) {
    this.eventStore.autoRescheduleTasks = autoRescheduleTasks
  }
}
export class QueueUnplannedGrid extends Grid {
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
      rowHeight: 50,
      disableGridRowModelWarning: true,
      transitionDuration: 0,
      testConfig: {
        transitionDuration: 0,
      },
    }
  }
}
