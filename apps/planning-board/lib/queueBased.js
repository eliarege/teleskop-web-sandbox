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
} from '@bryntum/schedulerpro'
import { addMinutes, addSeconds } from 'date-fns'
import { io } from 'socket.io-client'
import { setTargetEvent } from '../composables/helper'
import { enLocalization, trLocalization } from './localization'

const nuxtApp = useNuxtApp()

export function sortEventsByDateDesc(events) {
  return [...events].sort((a, b) => a.startDate < b.startDate ? -1 : 1)
}
export function sortEventsByDateAsc(events) {
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

let prevMachineId
export function removeAttributes(element, pattern) {
  if (element) {
    for (const attr of element.attributes) {
      if (pattern.test(attr.name)) {
        element.removeAttribute(attr.name)
      }
    }
  }
}
export function getResourceRow(resource) {
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
    const isValid = await nuxtApp.$keycloak.fetch('/api/isValid', {
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

        cls: 'b-popup b-sch-event-tooltip noClick',
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
    const { schedule } = this
    const { task, isValidating, validation } = context
    const coordinate = DomHelper[`getTranslate${schedule.isHorizontal ? 'X' : 'Y'}`](context.element)
    const machine = context.target && schedule.resolveResourceRecord(context.target, [
      event.offsetX,
      event.offsetY,
    ])

    // used in onDrop
    context.machine = machine
    const startDate = schedule.getDateFromCoordinate(
      coordinate,
      'round',
      false,
    )

    if (machine) {
      const currentMachineId = machine.id
      prevMachineId = currentMachineId
      endDate = startDate && DateHelper.add(startDate, task.originalData.theoreticalDuration, 'seconds')
    } else return

    const eventStartDate = schedule.getDateFromCoordinate(context.clientX, 'round', false)
    const targetMachineEvents = machine && machine.events
      ? machine.events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      : []

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
    if (targetMachineEvents.length > 0) {
      if (!previousEvent && !nextEvent) {
        if (new Date(eventStartDate) < new Date(targetMachineEvents[0].startDate)) {
          nextEvent = targetMachineEvents[0]
        } else if (new Date(eventStartDate) >= new Date(targetMachineEvents[targetMachineEvents.length - 1].startDate)) {
          previousEvent = targetMachineEvents[targetMachineEvents.length - 1]
        }
      }
    }

    // add fabric weight
    context.isValid = !isValidating
    && Boolean(startDate && machine)
    && validation.find(a => a.machineId === machine.id)?.valid === true

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
      const valid = context.isValid
      const timeDisplay = tipMsg => `
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
          ${this.tip.L(tipMsg)}
        </div>
            `
      if (!valid) {
        if (!validation.find(a => a.machineId === machine.id).valid) {
          this.tip.html = timeDisplay('program')
          this.tip.showBy(context.element)
        } else if (startDate < new Date()) {
          this.tip.html = timeDisplay('beforeNow')
          this.tip.showBy(context.element)
        } else {
          this.tip.html = timeDisplay('scheduleConflict')
          this.tip.showBy(context.element)
        }
      } else {
        this.tip.html = timeDisplay('')
        this.tip.showBy(context.element)
      }
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

  async scheduleEventOnTarget(grabbedEvent, targetEvent, previousMachine, targetMachine, isAfter) {
    const oldQueueNumber = grabbedEvent.queueNumber

    const newQueueNumber = isAfter
      ? targetEvent.eventType === 'planned'
        ? targetEvent.queueNumber + 1
        : 1
      : targetEvent.eventType === 'planned'
        ? targetEvent.queueNumber
        : 1

    if (previousMachine.id !== targetMachine.id) {
      await this.reorderEventsForMachine(previousMachine)
    }

    const affectedEvents = this.getEventsForMachine(targetMachine).filter(
      event => event.queueNumber >= newQueueNumber,
    )

    affectedEvents.forEach((event) => {
      event.queueNumber += 1
    })

    grabbedEvent.resourceId = targetMachine.id
    grabbedEvent.queueNumber = newQueueNumber

    await this.reorderEventsForMachine(targetMachine)

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

    await this.commitChanges(previousEventData, newEventData)
  }

  async scheduleEventOnEmptyRow(grabbedEvent, previousMachine, targetMachine) {
    const oldQueueNumber = grabbedEvent.queueNumber
    if (targetMachine.events.length === 0) {
      const newEvent = {
        planKey: grabbedEvent.id,
        machineId: targetMachine.id,
      }
      await nuxtApp.$keycloak.fetch('/api/queueBased/scheduleUnplannedFutureEvents', {
        method: 'POST',
        body: { newEvent },
      })
    }
    if (previousMachine.id !== targetMachine.id) {
      await this.reorderEventsForMachine(previousMachine)
    }
    const hasOngoingEvent = targetMachine.events.some(e =>
      e.eventType === 'ongoing' || e.eventType === 'manual',
    )
    const newStartDate = hasOngoingEvent ? addMinutes(new Date(), 5) : new Date()
    const newEndDate = addSeconds(newStartDate, grabbedEvent.theoreticalDuration)

    grabbedEvent.startDate = newStartDate
    grabbedEvent.endDate = newEndDate
    grabbedEvent.queueNumber = 1

    await this.reorderEventsForMachine(targetMachine)
    const previousEventData = {
      planKey: grabbedEvent.id,
      machineId: previousMachine.id,
      queueNumber: oldQueueNumber,
    }

    const newEventData = {
      planKey: grabbedEvent.id,
      machineId: targetMachine.id,
      queueNumber: grabbedEvent.queueNumber,
    }
    await this.commitChanges(previousEventData, newEventData)
  }

  async reorderEventsForMachine(machine) {
    const events = this.getEventsForMachine(machine)
      .filter(event => event.eventType === 'planned')
      .sort((a, b) => a.queueNumber - b.queueNumber)

    let currentDate = new Date()

    const hasUnfinishedEvent = machine.events.some(event =>
      event.eventType === 'ongoing' || event.eventType === 'manual',
    )

    if (hasUnfinishedEvent) {
      currentDate = addMinutes(new Date(), 5)
    }

    let queueIndex = 1
    events.forEach((event) => {
      event.queueNumber = queueIndex++
      event.startDate = currentDate
      event.endDate = addSeconds(event.startDate, event.theoreticalDuration)
      currentDate = addMinutes(event.endDate, 5)
    })
  }

  getEventsForMachine(machine) {
    return this.records.filter(event => event.resourceId === machine.id)
  }

  async commitChanges(previousEventData, newEventData) {
    await nuxtApp.$keycloak.fetch('/api/queueBased/scheduleEvents', {
      method: 'PUT',
      body: { previousEventData, newEventData },
    })
  }

  async rescheduleOverlappingTasks(grabbedEvent, targetEvent, previousMachine, targetMachine, isAfter) {
    this.isRescheduling = true
    this.beginBatch()

    if (grabbedEvent.isRemoved) {
      const createdEvent = grabbedEvent.originalData
      createdEvent.isRemoved = true
      createdEvent.machineId = targetMachine.id
      createdEvent.resourceId = targetMachine.id
      grabbedEvent = createdEvent
    }
    await this.scheduleEventOnTarget(grabbedEvent, targetEvent, previousMachine, targetMachine, isAfter)

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
        const isValid = await nuxtApp.$keycloak.fetch('/api/isValid', {
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
      onEventDrag({ context, domEvent }) {
        const { startDate, validation, isValidating } = context
        const machine = context.context.target && this.resolveResourceRecord(context.context.target, [
          domEvent.offsetX,
          domEvent.offsetY,
        ])
        let previousEvent = null
        let nextEvent = null

        const targetMachineEvents = machine && machine.events
          ? machine.events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          : []

        const eventStartDate = this.getDateFromCoordinate(context.clientX, 'round', false)
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
        if (targetMachineEvents.length > 0) {
          if (!previousEvent && !nextEvent) {
            if (new Date(eventStartDate) < new Date(targetMachineEvents[0].startDate)) {
              nextEvent = targetMachineEvents[0]
            } else if (new Date(eventStartDate) >= new Date(targetMachineEvents[targetMachineEvents.length - 1].startDate)) {
              previousEvent = targetMachineEvents[targetMachineEvents.length - 1]
            }
          }
        }
        if (machine) {
          const currentMachineId = machine.id
          const theoreticalDuration = context.theoreticalDuration?.find(a => a.machineId === currentMachineId.theoreticalDuration) || 28800
          prevMachineId = currentMachineId
          endDate = addSeconds(startDate, theoreticalDuration || 28800)
        }
        context.valid = !isValidating
        && Boolean(startDate && machine)
        && validation.find(a => a.machineId === machine.id)?.valid === true
      },
      async onEventDrop({ domEvent, resourceRecord, targetResourceRecord, eventRecords, context }) {
        let mouseX
        let eventTarget = domEvent.target

        const task = eventRecords[0]
        const previousMachine = resourceRecord
        const targetMachine = targetResourceRecord

        while (eventTarget && !eventTarget.classList.contains('b-sch-event-wrap')) {
          eventTarget = eventTarget.parentElement
        }
        if (eventTarget) {
          const eventRect = eventTarget.getBoundingClientRect()
          mouseX = domEvent.offsetX + this.scrollLeft + eventRect.left - (this.subGrids.locked.width + this.subGrids.locked.splitterElement.offsetWidth)
        } else {
          mouseX = domEvent.offsetX
        }
        const mousePosDate = this.getDateFromCoordinate(mouseX)

        const { valid } = context
        const { target } = context.context

        if (valid && target) {
          const targetEvent = setTargetEvent(mouseX, this, targetResourceRecord, eventRecords[0])
          if (targetEvent) {
            const targetMiddle = addSeconds(targetEvent.startDate, targetEvent.theoreticalDuration / 2)
            const isAfter = mousePosDate > targetMiddle

            context.isDrag = false
            context.isOld = new Date(context.origStart) <= new Date(this.timeAxis.endDate)

            await this.project.eventStore.rescheduleOverlappingTasks(task, targetEvent, previousMachine, targetMachine, isAfter)
          } else {
            await this.project.eventStore.scheduleEventOnEmptyRow(task, previousMachine, targetMachine)
          }
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
