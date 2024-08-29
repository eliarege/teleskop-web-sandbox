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
  TimelineDateMapper,
  Toast,
  Tooltip,
} from '@bryntum/schedulerpro'

import { addMinutes, addSeconds } from 'date-fns'
import { io } from 'socket.io-client'
import { enLocalization, trLocalization } from './localization'
import { integerToHex } from '~/composables/helper'

function sortEventsByDateDesc(events) {
  return [...events].sort((a, b) => a.startDate < b.startDate ? -1 : 1)
}
function sortEventsByDateAsc(events) {
  return [...events].sort((a, b) => a.startDate < b.startDate ? 1 : -1)
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
let theoreticalDuration
let endDate

let oldQueueNumber
let newQueueNumber

let prevMachineId
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
    context.isDropped = false
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

    const planKey = context.task.id
    const fabricWeight = context.task.fabricWeight
    context.isValidating = true
    const isValid = await $fetch('/api/isValid', {
      query: { planKey, fabricWeight },
    })

    context.validation = isValid
    context.isValidating = false

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

  onDrag({ event, context }) {
    const { schedule, grid } = this
    const { task, isValidating, validation } = context
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
      endDate = startDate && DateHelper.add(startDate, task.originalData.theoreticalDuration, 'seconds')
    }
    const eventStartDate = schedule.getDateFromCoordinate(context.clientX, 'round', false)
    const targetMachineEvents = machine.events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

    let previousEvent = null
    let nextEvent = null

    for (let i = 0; i < targetMachineEvents.length - 1; i++) {
      const currentEvent = targetMachineEvents[i]
      const nextEventCandidate = targetMachineEvents[i + 1]

      if (new Date(currentEvent.startDate) <= new Date(eventStartDate)
        && new Date(eventStartDate) < new Date(nextEventCandidate.startDate)) {
        previousEvent = currentEvent
        nextEvent = nextEventCandidate
        break
      }
    }
    if (!previousEvent && !nextEvent) {
      if (new Date(eventStartDate) < new Date(targetMachineEvents[0].startDate)) {
        nextEvent = targetMachineEvents[0]
      } else if (new Date(eventStartDate) >= new Date(targetMachineEvents[targetMachineEvents.length - 1].startDate)) {
        previousEvent = targetMachineEvents[targetMachineEvents.length - 1]
      }
    }
    const target = schedule.resolveEventRecord(context.target) || previousEvent

    context.isValid = !isValidating
    && Boolean(startDate && machine)
    && target
    && target !== null
      ? !target.eventType === 'finished'
      : !(startDate < new Date())
      && (validation.length > 0 ? validation.find(a => a.machineId === machine.id).valid : true)

    task.startDate = startDate
    task.endDate = endDate

    if (this.tip) {
      const startMonth = DateHelper.format(startDate, 'MMM')
      const startDay = DateHelper.format(startDate, 'D')

      const endMonth = DateHelper.format(endDate, 'MM')
      const endDay = DateHelper.format(endDate, 'D')

      const startMinuteRotation = (startDate.getMinutes() + startDate.getSeconds() / 60) * 6
      const startHourRotation = (startDate.getHours() % 12 + startDate.getMinutes() / 60) * 30

      const endMinuteRotation = (endDate.getMinutes() + endDate.getSeconds() / 60) * 6
      const endHourRotation = (endDate.getHours() % 12 + endDate.getMinutes() / 60) * 30

      const timeDisplay = () => `
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
          ${this.tip.L(context.isValid ? '' : 'scheduleConflict')}
        </div>
            `
      if (!context.isValid) {
        this.tip.html = timeDisplay()
        // TODO: set schedule conflict messaging
        // if (!schedule.isDateRangeAvailable(startDate, endDate, null, machine)) {
        //   this.tip.html = timeDisplay('overlap')
        //   this.tip.showBy(context.element)
        // } else if (!isValid.find(a => a.machineId === machine.id).valid) {
        //   this.tip.html = timeDisplay('program')
        // } else {
        //   this.tip.html = timeDisplay('beforeNow')
        //   this.tip.showBy(context.element)
        // }
      }
      if (context.valid) {
        this.tip.html = timeDisplay()
        this.tip.showBy(context.element)
      }
    }
  }

  async onDrop({ context }) {
    const { schedule, grid } = this
    const { task, isValid: valid, target, machine } = context
    schedule.disableScrollingCloseToEdges(schedule.timeAxisSubGrid)
    const targetEventRecord = schedule.resolveEventRecord(target)
    let newEvent
    if (target && valid) {
      task.originalData.machineId = machine.id
      const currentEvents = sortEventsByDateDesc(machine.events.filter((ev => ev.eventType === 'planned')))
      if (targetEventRecord) {
        newEvent = {
          planKey: task.id,
          machineId: machine.id,
          queueNumber: targetEventRecord.queueNumber + 1 || 1,
        }
        task.startDate = addMinutes(targetEventRecord.endDate, 5)
        task.endDate = addSeconds(task.startDate, task.theoreticalDuration)
        const futureEvents = currentEvents.filter(a => a.startDate >= targetEventRecord.endDate && a !== task)
        sortEventsByDateDesc(futureEvents).forEach((ev, i, all) => {
          const prevEvent = all[i - 1] || task
          ev.startDate = addMinutes(prevEvent.endDate, 5)
          ev.endDate = addSeconds(ev.startDate, ev.theoreticalDuration)
        })
      } else {
        const targetEvents = sortEventsByDateDesc(currentEvents).filter(a => a.startDate <= task.startDate && a.endDate >= task.startDate)
        if (targetEvents.length > 0) {
          const sideEvents = sortEventsByDateDesc(targetEvents.filter(a =>
            a.startDate <= task.startDate
            && a.endDate >= task.startDate,
          ))
          task.startDate = addMinutes(sideEvents[0].endDate, 5)
          task.endDate = addSeconds(task.startDate, task.originalData.theoreticalDuration)
          newEvent = {
            planKey: task.id,
            machineId: machine.id,
            queueNumber: sideEvents[0].queueNumber + 1 || 1,
          }
          const futureEvents = currentEvents.filter(a => a.startDate >= task.startDate && a !== task)
          futureEvents.forEach((el, i, all) => {
            const prev = all[i - 1] || task
            el.startDate = addMinutes(prev.endDate, 5)
            el.endDate = addSeconds(el.startDate, el.originalData.theoreticalDuration)
          })
        } else {
          if (currentEvents.length > 0) {
            const lastEvent = currentEvents[currentEvents.length - 1]
            task.startDate = addMinutes(lastEvent.endDate, 5)
            task.endDate = addSeconds(task.startDate, task.originalData.theoreticalDuration)
            newEvent = {
              planKey: task.id,
              machineId: machine.id,
              queueNumber: lastEvent.queueNumber + 1 || 1,
            }
          } else {
            task.startDate = new Date()
            task.endDate = addSeconds(task.startDate, task.originalData.theoreticalDuration)
            newEvent = {
              planKey: task.id,
              machineId: machine.id,
              queueNumber: 1,
            }
          }
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
          await $fetch('/api/queueBased/scheduleUnplannedEvents', {
            method: 'POST',
            body: { newEvent },
          }).then(() => schedule.renderRows())
        }).catch(err => Toast.show(`Scheduling Failed: ${err}`))
    }
    schedule.features.eventTooltip.disabled = true
    context.isDropped = true
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

  setQueueNumber(oldQueueNumber, newQueueNumber, targetMachine, previousMachine, grabbedEvent) {
    grabbedEvent.originalData.queueNumber = newQueueNumber
    if (targetMachine.id !== previousMachine.id) {
      previousMachine.events.filter(ev => ev.originalData.queueNumber > oldQueueNumber && ev !== grabbedEvent).forEach((ev) => {
        ev.originalData.queueNumber--
      })

      targetMachine.events.filter(ev => ev.originalData.queueNumber >= newQueueNumber && ev !== grabbedEvent).forEach((ev) => {
        ev.originalData.queueNumber++
      })
    } else {
      if (oldQueueNumber > newQueueNumber) {
        targetMachine.events.filter(ev => ev.originalData.queueNumber >= newQueueNumber && ev.originalData.queueNumber < oldQueueNumber && ev !== grabbedEvent).forEach((ev) => {
          ev.originalData.queueNumber++
        })
      } else {
        targetMachine.events.filter(ev => ev.originalData.queueNumber > oldQueueNumber && ev.originalData.queueNumber <= newQueueNumber && ev !== grabbedEvent).forEach((ev) => {
          ev.originalData.queueNumber--
        })
      }
    }
  }

  async scheduleEventOnTarget(grabbedEvent, targetEvent, previousMachine, targetMachine) {
    const futureEvents = targetMachine.events.filter(ev => ev.eventType === 'planned' && ev.originalData.queueNumber > (targetEvent.originalData.queueNumber || 0) && ev !== grabbedEvent)
    let previousEvents

    if (previousMachine.id !== targetMachine.id) {
      newQueueNumber = targetEvent.originalData.queueNumber + 1 || 1

      previousEvents = previousMachine.events.filter(ev => ev.eventType === 'planned' && ev.originalData.queueNumber >= grabbedEvent.originalData.queueNumber && ev !== grabbedEvent)
      futureEvents.forEach((ev) => {
        this.postponeEvent(ev, (grabbedEvent.theoreticalDuration + 300))
      })
    } else {
      if (grabbedEvent.originalData.queueNumber > targetEvent.originalData.queueNumber || 0) {
        const target = targetMachine.events.filter(ev => ev.originalData.queueNumber > (targetEvent.originalData.queueNumber || 0) && ev.originalData.queueNumber < grabbedEvent.originalData.queueNumber)
        target.forEach((ev) => {
          this.postponeEvent(ev, (grabbedEvent.theoreticalDuration + 300))
        })
        newQueueNumber = targetEvent.originalData.queueNumber + 1 || 1
      } else {
        if (!targetEvent.originalData.queueNumber) {
          const target = targetMachine.events.filter(ev => ev.eventType === 'planned' && ev.originalData.queueNumber < grabbedEvent.originalData.queueNumber)
          target.forEach((ev) => {
            this.postponeEvent(ev, (grabbedEvent.theoreticalDuration + 300))
          })
        }
        newQueueNumber = targetEvent.originalData.queueNumber || 1
      }
      previousEvents = targetMachine.events.filter(ev => ev.eventType === 'planned' && ev.originalData.queueNumber <= targetEvent.originalData.queueNumber && ev !== grabbedEvent && ev.originalData.queueNumber > grabbedEvent.originalData.queueNumber)
    }
    previousEvents.forEach((ev) => {
      this.expediteEvent(ev, (grabbedEvent.theoreticalDuration + 300))
    })

    grabbedEvent.startDate = addMinutes(targetEvent.endDate, 5)
    grabbedEvent.endDate = addSeconds(grabbedEvent.startDate, grabbedEvent.theoreticalDuration)

    oldQueueNumber = grabbedEvent.originalData.queueNumber
    if (grabbedEvent.isRemoved) {
      this.add(grabbedEvent)
    }
    this.setQueueNumber(oldQueueNumber, newQueueNumber, targetMachine, previousMachine, grabbedEvent)
    const previousEventData = {
      planKey: grabbedEvent.id,
      machineId: previousMachine.id,
      queueNumber: oldQueueNumber,
    }
    const newEventData = {
      planKey: grabbedEvent.id,
      machineId: targetMachine.id,
      queueNumber: newQueueNumber,
    }

    await $fetch('/api/queueBased/scheduleEvents', {
      method: 'PUT',
      body: { previousEventData, newEventData },
    })
  }

  createTargetEvent(targetMachine, grabbedEvent) {
    const targetMachineEvents = targetMachine.events.filter(ev => ev.id !== grabbedEvent.id)
    const sortedEvents = targetMachineEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

    let previousEvent = null
    let nextEvent = null

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i]
      const nextEventCandidate = sortedEvents[i + 1]

      if (new Date(currentEvent.startDate) <= new Date(grabbedEvent.startDate)
        && new Date(grabbedEvent.startDate) < new Date(nextEventCandidate.startDate)) {
        previousEvent = currentEvent
        nextEvent = nextEventCandidate
        break
      }
    }

    if (!previousEvent && !nextEvent) {
      if (new Date(grabbedEvent.startDate) < new Date(sortedEvents[0].startDate)) {
        nextEvent = sortedEvents[0]
      } else if (new Date(grabbedEvent.startDate) >= new Date(sortedEvents[sortedEvents.length - 1].startDate)) {
        previousEvent = sortedEvents[sortedEvents.length - 1]
      }
    }

    return { previousEvent, nextEvent }
  }

  expediteEvent(event, duration) {
    event.startDate = addSeconds(event.startDate, -duration)
    event.endDate = addSeconds(event.endDate, -duration)
  }

  postponeEvent(event, duration) {
    event.startDate = addSeconds(event.startDate, duration)
    event.endDate = addSeconds(event.startDate, event.theoreticalDuration)
  }

  async rescheduleOverlappingTasks(grabbedEvent, targetEvent, previousMachine, targetMachine, context) {
    this.isRescheduling = true
    this.beginBatch()
    if (grabbedEvent.isRemoved) {
      const createdEvent = grabbedEvent.originalData
      createdEvent.isRemoved = true
      createdEvent.machineId = targetMachine.id
      createdEvent.resourceId = targetMachine.id
      grabbedEvent = createdEvent
    }
    if (targetEvent) {
      await this.scheduleEventOnTarget(grabbedEvent, targetEvent, previousMachine, targetMachine)
    } else {
      const { previousEvent } = this.createTargetEvent(targetMachine, grabbedEvent)
      await this.scheduleEventOnTarget(grabbedEvent, previousEvent, previousMachine, targetMachine)
    }

    this.isRescheduling = false
    this.endBatch()
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
      onDeleteKey: () => {},
      infiniteScroll: true,
      autoRescheduleTasks: true,
      useInitialAnimation: false,
      features: {
        stripe: true,
      },
      async onEventDragStart({ context, resourceRecord, eventRecords }) {
        context.isDropped = false
        context.isDrag = true
        context.task = context.eventRecord.originalData
        context.originalTaskData = {
          planKey: context.eventRecord.originalData.planKey,
          machineId: context.eventRecord.originalData.machineId,
          queueNumber: context.eventRecord.originalData.queueNumber,
        }

        context.isFirst = resourceRecord.events[0].name === eventRecords[0].name
        const planKey = context.task.id
        const fabricWeight = context.task.fabricWeight

        context.isValidating = true
        const isValid = await $fetch('/api/isValid', {
          query: { planKey, fabricWeight },
        })
        if (context.context.grabbed && !context.isDropped) {
          for (let i = 0; i < isValid.length; i++) {
            const currentRow = document.querySelector(`div[data-id="${isValid[i].machineId}"]`)
            if (isValid[i].valid) {
              currentRow?.setAttribute('bgGreen', '')
            } else {
              currentRow?.setAttribute('bgRed', '')
            }
          }
        }
        context.validation = isValid
        context.isValidating = false
      },
      onEventDrag({ context, event }) {
        const { startDate, validation, isValidating } = context
        const machine = context.context.target && this.resolveResourceRecord(context.context.target, [
          event.offsetX,
          event.offsetY,
        ])
        if (machine) {
          const currentMachineId = machine.id
          const theoreticalDuration = context.theoreticalDuration?.find(a => a.machineId === currentMachineId.theoreticalDuration) || 28800
          prevMachineId = currentMachineId
          endDate = addSeconds(startDate, theoreticalDuration || 28800)
        }
        context.valid = !isValidating
        && Boolean(startDate && machine)
        && (context.targetEventRecord === null ? !(startDate < new Date()) : true)
        && (this.allowOverlap || this.isDateRangeAvailable(startDate, endDate, null, machine))
        && (validation?.length > 0 ? validation.find(a => a.machineId === machine.id).valid : true)
      },
      async onEventDrop({ eventRecords, context, targetEventRecord, resourceRecord, targetResourceRecord }) {
        context.isDrag = false
        context.isOld = new Date(context.origStart) <= new Date(this.timeAxis.endDate)

        const { valid } = context
        const { target } = context.context
        if (valid && target) {
          await this.project.eventStore.rescheduleOverlappingTasks(eventRecords[0], targetEventRecord, resourceRecord, targetResourceRecord, context)
        }
      },
      onAfterEventDrop({ context }) {
        context.isDropped = true
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
      rowHeight: 40,
      disableGridRowModelWarning: true,
      transitionDuration: 0,
      testConfig: {
        transitionDuration: 0,
      },
    }
  }
}
