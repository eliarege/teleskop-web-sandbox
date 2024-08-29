import type { SchedulerPro } from '@bryntum/schedulerpro'
import { DateHelper } from '@bryntum/schedulerpro'
import type { UnplannedEventsRaw } from '~/shared/types'

export function decompressJson(data: { columns: string[], values: any[][] }) {
  const { columns, values } = data
  return values.map(v =>
    Object.fromEntries(v.map((value, i) => [columns[i], value])))
}
export function integerToHex(int: number) {
  if (int === 0 || int === null) {
    return '#69DB7C'
  }
  let hex = int.toString(16)
  while (hex.length < 6) {
    hex = `0${hex}`
  }
  return `#${hex}`
}
export async function eventTooltip(eventRecord: any, scheduler: SchedulerPro) {
  const { $i18n } = useNuxtApp()
  const startMonth = DateHelper.format(eventRecord.startDate, 'MMM')
  const startDay = DateHelper.format(eventRecord.startDate, 'D')

  const endMonth = DateHelper.format(eventRecord.endDate, 'MM')
  const endDay = DateHelper.format(eventRecord.endDate, 'D')

  const startMinuteRotation = (eventRecord.startDate.getMinutes() + eventRecord.startDate.getSeconds() / 60) * 6
  const startHourRotation = (eventRecord.startDate.getHours() % 12 + eventRecord.startDate.getMinutes() / 60) * 30

  const endMinuteRotation = (eventRecord.endDate.getMinutes() + eventRecord.endDate.getSeconds() / 60) * 6
  const endHourRotation = (eventRecord.endDate.getHours() % 12 + eventRecord.endDate.getMinutes() / 60) * 30
  if (eventRecord.eventType !== 'stop') {
    const parameters: any[] = await $fetch('/api/tootlipParameters', {
      query: { machineId: eventRecord.originalData.machineId, planKey: eventRecord.originalData.planKey },
    })
    const parameterValues = parameters.map(param => `${param.paramName}: ${param.value}`).join('<br>')
    const notes = await $fetch('/api/note/getNote', {
      query: { jobOrder: eventRecord.originalData.jobOrder },
    })
    const screenNotes = notes.filter(n => n.showOnScreen === true).map(a => a.note)
    return `
        <div>
          ${screenNotes.length !== 0 ? `<div class="b-sch-event-title">${$i18n.t('tooltip.note')}: ${screenNotes}</div>` : ''}
          <div class="b-sch-event-title">${eventRecord.originalData.name}</div>
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
