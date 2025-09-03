import type { SchedulerPro, SchedulerResourceModel } from '@bryntum/schedulerpro'
import { DateHelper, Toast } from '@bryntum/schedulerpro'
import { addMinutes, addSeconds, differenceInMilliseconds, differenceInSeconds } from 'date-fns'

export function decompressJson(data: { columns: string[], values: any[][] }) {
  const { columns, values } = data
  return values.map(v =>
    Object.fromEntries(v.map((value, i) => [columns[i], value])))
}
export function integerToHex(int?: number): string {
  if (int == null || int === 0) {
    return '#69DB7C'
  }

  const hex = int.toString(16).padStart(6, '0')
  return `#${hex}`
}

export async function eventTooltip(eventRecord: any, scheduler: SchedulerPro) {
  const { $i18n, $keycloak } = useNuxtApp()
  const startMonth = DateHelper.format(eventRecord.originalData.startDate, 'MMM')
  const startDay = DateHelper.format(eventRecord.originalData.startDate, 'D')

  const endMonth = DateHelper.format(eventRecord.originalData.endDate, 'MM')
  const endDay = DateHelper.format(eventRecord.originalData.endDate, 'D')

  const startMinuteRotation = (new Date(eventRecord.originalData.startDate).getMinutes() + new Date(eventRecord.originalData.startDate).getSeconds() / 60) * 6
  const startHourRotation = (new Date(eventRecord.originalData.startDate).getHours() % 12 + new Date(eventRecord.originalData.startDate).getMinutes() / 60) * 30

  const endMinuteRotation = (new Date(eventRecord.originalData.endDate).getMinutes() + new Date(eventRecord.originalData.endDate).getSeconds() / 60) * 6
  const endHourRotation = (new Date(eventRecord.originalData.endDate).getHours() % 12 + new Date(eventRecord.originalData.endDate).getMinutes() / 60) * 30

  const theoreticalDurationValue = eventRecord.originalData.theoreticalDuration
  const theoreticalDuration = formatSeconds(theoreticalDurationValue)
  const isEventFinishedorOngoing = eventRecord.originalData.eventType === 'finished' || eventRecord.originalData.eventType === 'ongoing' || eventRecord.originalData.eventType === 'manual'
  const actualDurationValue = isEventFinishedorOngoing
    ? Math.floor(
      differenceInMilliseconds(
        new Date(eventRecord.endDate).getTime(),
        new Date(eventRecord.startDate).getTime(),
      ) / 1000,
    )
    : 0
  const actualDuration = formatSeconds(actualDurationValue)
  const deviation = formatSeconds(actualDurationValue - theoreticalDurationValue)
  const stopDuration = formatSeconds(differenceInMilliseconds(
    new Date(eventRecord.endDate).getTime(),
    new Date(eventRecord.startDate).getTime(),
  ) / 1000)
  function renderDurationInfo() {
    if (isEventFinishedorOngoing)
      return `
        <div class="b-sch-event-title">
          ${$i18n.t('tooltip.theoretical-duration')}: ${theoreticalDuration}
        </div>
        <div class="b-sch-event-title">
          ${$i18n.t('tooltip.actual-duration')}: ${actualDuration}
        </div>
        <div class="b-sch-event-title">
          ${$i18n.t('tooltip.deviation')}: ${deviation}
        </div>
        `
    else return `
          <div class="b-sch-event-title">
            ${$i18n.t('tooltip.theoretical-duration')}: ${theoreticalDuration}
          </div>
          `
  }
  if (eventRecord.eventType !== 'stop') {
    const parameters: any[] = await $keycloak.fetch('/api/tootlipParameters', {
      query: { machineId: eventRecord.originalData.machineId, planKey: eventRecord.originalData.planKey },
    })
    const parameterValues = parameters.map(param => `${param.paramName}: ${param.value}`).join('<br>')
    const notes = await $keycloak.fetch('/api/note/getNote', {
      query: { jobOrder: eventRecord.originalData.jobOrder },
    })
    const screenNotes = notes.filter(n => n.showOnScreen === true).map(a => a.note)
    return `
        <div>
          ${screenNotes.length !== 0 ? `<div class="b-sch-event-title">${$i18n.t('tooltip.note')}: ${screenNotes}</div>` : ''}
          <div class="b-sch-event-title">${eventRecord.originalData.name}</div>
          <div class="b-sch-clockwrap b-sch-clock-hour b-sch-tooltip-startdate">
            <div class="whitespace-nowrap">
              ${renderDurationInfo()}
            </div>
          </div>
          <div class="b-sch-clockwrap b-sch-clock-hour b-sch-tooltip-startdate">
            <div class="b-sch-clock">
              <div class="b-sch-hour-indicator" style="transform: rotate(${startHourRotation}deg);">
                ${startMonth}
              </div>
              <div class="b-sch-minute-indicator" style="transform: rotate(${startMinuteRotation}deg);">
                ${startDay}
              </div>
              <div class="b-sch-clock-dot"></div>
            </div>
            <span class="b-sch-clock-text">${DateHelper.format(eventRecord.startDate, scheduler.displayDateFormat)}</span>
          </div>
          <div class="b-sch-clockwrap b-sch-clock-hour b-sch-tooltip-enddate">
            <div class="b-sch-clock">
              <div class="b-sch-hour-indicator" style="transform: rotate(${endHourRotation}deg);">
                ${endMonth}
              </div>
              <div class="b-sch-minute-indicator" style="transform: rotate(${endMinuteRotation}deg);">
                ${endDay}
              </div>
              <div class="b-sch-clock-dot"></div>
            </div>
            <span class="b-sch-clock-text">${DateHelper.format(eventRecord.endDate, scheduler.displayDateFormat)}</span>
            </div>
          <div class="b-sch-event-title">
            <div class="b-sch-event-title">
              ${parameterValues}
            </div>
          </div>
        </div>
`
  } else return `
  <div>
    <div class="b-sch-event-title">${$i18n.t('tooltip.note')}: ${eventRecord.note === 'auto-generated' ? $i18n.t('tooltip.auto-message') : eventRecord.note}</div>
    <div class="b-sch-clockwrap b-sch-clock-hour b-sch-tooltip-startdate">
      <div class="b-sch-clock">
        <div class="b-sch-hour-indicator" style="transform: rotate(${startHourRotation}deg);">
          ${startMonth}
        </div>
        <div class="b-sch-minute-indicator" style="transform: rotate(${startMinuteRotation}deg);">
          ${startDay}
        </div>
        <div class="b-sch-clock-dot"></div>
      </div>
      <span class="b-sch-clock-text">${DateHelper.format(eventRecord.startDate, scheduler.displayDateFormat)}</span>
    </div>
    <div class="b-sch-clockwrap b-sch-clock-hour b-sch-tooltip-enddate">
      <div class="b-sch-clock">
        <div class="b-sch-hour-indicator" style="transform: rotate(${endHourRotation}deg);">
          ${endMonth}
        </div>
        <div class="b-sch-minute-indicator" style="transform: rotate(${endMinuteRotation}deg);">
          ${endDay}
        </div>
        <div class="b-sch-clock-dot"></div>
      </div>
      <span class="b-sch-clock-text">${DateHelper.format(eventRecord.endDate, scheduler.displayDateFormat)}</span>
      </div>
      <div>
        ${$i18n.t('tooltip.duration')}: ${stopDuration}
      </div>
  </div>
`
}
export function darkenColor(color: string, percent: number): string {
  const num = Number.parseInt(color.slice(1), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) - amt
  const G = ((num >> 8) & 0x00FF) - amt
  const B = (num & 0x0000FF) - amt
  return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16)
    .slice(1).toUpperCase()}`
}

// Mouse pozisyonuna en yakın olan event targetEvent olarak alınır.
// Eğer scheduler.events.filter(ev => ev.resourceId === machine.id).length 0 ise
// task.startDate = new Date()
// task.endDate = addSeconds(task.startDate, task.theoreticalDuration)
// task.queueNumber = 1

export function setTargetEvent(mouseX: number, schedule: SchedulerPro, machine: SchedulerResourceModel, grabbedEvent?) {
  let events
  if (grabbedEvent) {
    events = schedule.events.filter(ev =>
      ev.resourceId === machine.id
      && (ev.eventType === 'planned' || ev.eventType === 'ongoing')
      && ev !== grabbedEvent,
    )
  } else {
    events = schedule.events.filter(ev =>
      ev.resourceId === machine.id
      && (ev.eventType === 'planned' || ev.eventType === 'ongoing'),
    )
  }
  if (events.length === 0) {
    return null
  }

  const mousePosDate = schedule.getDateFromCoordinate(mouseX)

  let closestEvent = null
  let smallestDiff = Number.POSITIVE_INFINITY

  events.forEach((ev) => {
    const middleDate = addSeconds(ev.startDate, ev.theoreticalDuration / 2)
    const dateDiff = Math.abs(differenceInSeconds(middleDate, mousePosDate))

    if (dateDiff < smallestDiff) {
      smallestDiff = dateDiff
      closestEvent = ev
    }
  })

  return closestEvent
}

export function postponeEvent(event: any, duration: number) {
  event.startDate = addSeconds(event.startDate, duration + 300)
  event.endDate = addSeconds(event.startDate, event.theoreticalDuration)
  event.queueNumber++
}
export function expediteEvents(event: any, duration: number) {
  event.startDate = addSeconds(event.startDate, -(duration + 360))
  event.endDate = addSeconds(event.startDate, event.theoreticalDuration)
  event.queueNumber--
}
export function setDropLocation(mouseX, targetEvent, schedule, task, events) {
  const mousePosDate = schedule.getDateFromCoordinate(mouseX)
  const targetMiddle = addSeconds(targetEvent.originalData.startDate, targetEvent.originalData.theoreticalDuration / 2)
  const isAfter = mousePosDate > targetMiddle
  if (isAfter) {
    task.startDate = addMinutes(targetEvent.originalData.endDate, 5)
    task.endDate = addSeconds(task.startDate, task.theoreticalDuration)
    task.queueNumber = targetEvent.originalData.queueNumber + 1
    const futureEvents = events.filter(e => e.queueNumber >= task.queueNumber)
    futureEvents.forEach((e) => {
      postponeEvent(e, task.theoreticalDuration)
    })
  } else {
    task.startDate = targetEvent.originalData.startDate
    task.endDate = addSeconds(task.startDate, task.theoreticalDuration)
    task.queueNumber = targetEvent.originalData.queueNumber
    const futureEvents = events.filter(e => e.queueNumber >= task.queueNumber)
    futureEvents.forEach((e) => {
      postponeEvent(e, task.theoreticalDuration)
    })
  }
}

export async function handleSchedule(schedule: SchedulerPro, task, machine, grid, refreshScheduler: Function) {
  const { $keycloak } = useNuxtApp()
  const machineEvents = machine.events.filter(e => e.resourceId === machine.id)

  await schedule.scheduleEvent({
    eventRecord: task,
    startDate: task.startDate,
    resourceRecord: machine,
  }).catch(err => Toast.show(`Scheduling Failed: ${err}`))

  grid.store.remove(task)
  task.assign(machine)

  if (machineEvents.length === 0) {
    const newEvent = {
      planKey: task.id,
      machineId: machine.id,
    }
    await $keycloak.fetch('/api/queueBased/scheduleUnplannedFutureEvents', {
      method: 'POST',
      body: { newEvent },
    })
  } else {
    const newEvent = {
      planKey: task.id,
      machineId: machine.id,
      queueNumber: task.queueNumber || 1,
    }
    await $keycloak.fetch('/api/queueBased/scheduleUnplannedEvents', {
      method: 'POST',
      body: { newEvent },
    })
  }
  refreshScheduler()
  schedule.renderRows()
}

export function formatSeconds(second: number): string {
  const sign = second < 0 ? '-' : ''
  const absSec = Math.abs(second)
  const hours = Math.floor(absSec / 3600)
  const minutes = Math.floor((absSec % 3600) / 60)
  const seconds = absSec % 60

  const pad = (num: number) => String(num).padStart(2, '0')

  return `${sign}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
