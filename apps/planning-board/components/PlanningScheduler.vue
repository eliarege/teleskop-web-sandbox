<!-- eslint-disable no-new -->
<script setup lang="ts">
import type { DragHelperConfig, GridConfig, SchedulerPro, SchedulerProConfig } from '@bryntum/schedulerpro-trial'
import { Splitter } from '@bryntum/schedulerpro-trial'
import { Drag, Schedule, Task, UnplannedGrid } from '~/lib/bryntum'
import type { PlannedEvents, PlannedEventsRaw, UnplannedEvents, UnplannedEventsRaw } from '~/shared/types'

const { data: machines } = await useFetch('/api/machineList')
const { data: events } = await useFetch('/api/planned/task')
const { data: unScheduledEvents } = await useFetch('/api/non-planned/task')

const currentTime = useNow({ interval: 1000 })
const modifiedEvents = computed(() => events.value?.map((ev: PlannedEventsRaw) => {
  return {
    id: ev.planKey,
    name: ev.jobOrder,
    resourceId: ev.startedMachine,
    startDate: new Date(ev.plannedStartTime),
    endDate: new Date(new Date(ev.plannedStartTime).getTime() + ev.theoricalDuration * 1000),
    isDeleted: ev.isDeleted,
    isStarted: ev.isStarted,
    isStopped: ev.isStopped,
    resizable: false,
    draggable: true,
    editable: false,
    iconCls: 'b-fa b-fa-book',
  } as PlannedEvents
}))
const modifiedUnscheduledEvents = computed(() => unScheduledEvents.value?.map((unp: UnplannedEventsRaw) => {
  return {
    id: unp.planKey,
    name: unp.jobOrder,
    duration: unp.theoricalDuration ? (unp.theoricalDuration / 60) / 60 : Math.round(Math.random() * 10) + 1,
    durationUnit: 'hour',
    constraintDate: new Date(),
    iconCls: 'b-fa b-fa-book',
  } as UnplannedEvents
}))
let schedule: SchedulerPro | null = null

onMounted(() => {
  const _schedule: SchedulerPro = schedule = new Schedule({
    ref: 'schedule',
    appendTo: 'main',
    createEventOnDblClick: false,
    startDate: new Date(2023, 6, 6, 10),
    startDateField: {
      label: 'test',
      flex: '1 0 50%',
      min: currentTime.value,
    },
    flex: 1,
    project: {
      listeners: {
        change() {
          if (schedule) {
            schedule.widgetMap.saveButton.disabled = !schedule.eventStore.changes
          }
        },
      },
      eventStore: {
        removeUnassignedEvent: false,
      },
      eventModelClass: Task,
    },
    eventColor: 'blue',
    resources: machines.value,
    events: modifiedEvents.value,
    timeResolution: {
      unit: 'minute',
      increment: 5,
    },
    // getDateConstraints() {
    //   return {
    //     start: currentTime.value,
    //   }
    // },
    features: {
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
        },
      },
      taskEdit: false,
      headerZoom: true,
      scheduleTooltip: {
        hideForNonWorkingTime: true,
      },
      timeRanges: {
        showCurrentTimeLine: true,
      },
    },
    // timeRanges: [
    //   {
    //     id: 1,
    //     cls: 'shaded',
    //     startDate: '1900-01-01',
    //     endDate: currentTime.value,
    //   },
    // ],
    tbar: [
      '->',
      {
        text: 'Teleskop Planning Board',
        cls: '!text-white !border-none b-raised b-blue',
      },
      '->',
      {
        text: 'Save',
        width: 100,
        cls: 'b-raised b-blue',
        ref: 'saveButton',
        disabled: true,
        onAction: 'up.onSave',
      },
    ],
  } as Partial<SchedulerProConfig>)
  new Splitter({
    appendTo: 'main',
  })
  const unplannedGrid = new UnplannedGrid({
    ref: 'unplanned',
    appendTo: 'main',
    collapsible: true,
    features: {
      cellEdit: false,
    },
    flex: '0 1 300px',
    ui: 'toolbar',
    project: _schedule.project,
    store: {
      data: modifiedUnscheduledEvents.value,
      modelClass: Task,
      autoLoad: true,
    },
  } as Partial<GridConfig>)
  new Drag({
    grid: unplannedGrid,
    schedule: _schedule,
    constrain: false,
    outerElement: unplannedGrid.element,
  } as Partial<DragHelperConfig>)
})
</script>

<template>
  <div class="e-border w-full h-screen">
    <div id="main" class="w-full h-full" />
  </div>
</template>

<style lang="postcss">
.b-resource-info {
  @apply !font-extrabold;
}

.b-timeline-subgrid .b-sch-current-time {
  display: none;
}

.b-sch-event {
  border-radius: 3px;
  box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.25);
}

.b-grid-row .b-hover {
  background-color: inherit;
  opacity: 1;
}

.b-selected {
  background-color: inherit !important;
  opacity: 1 !important;
}

#main {
  display: flex;
  flex-direction: row;
  flex: 1 1 100%;
}

#main .b-resourceheader {
  height: 100%;
}

.b-unplannedgrid div[data-column=name] .b-fa {
  margin-inline-end: 0.5em;
}

.b-unplannedgrid {
  border: 1px solid grey;
}

.b-grid-header {
  height: 57px;
}

.b-unassigned-class.b-drag-proxy {
  box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.25);
}

.b-unassigned-class.b-drag-proxy.b-drag-invalid .b-sch-event {
  background: red;
}

.b-unassigned-class.b-drag-proxy.b-horizontal {
  align-items: center;
  padding-inline-start: 0.5em;
  flex-flow: row nowrap;
  justify-content: flex-start;
}

.b-unassigned-class.b-drag-proxy.b-horizontal i {
  margin-inline-end: 0.5em;
}

.b-unassigned-class.b-drag-proxy.b-vertical {
  justify-content: flex-start;
  padding-top: 0.5em;
}

[data-column=duration] div.b-grid-header-text .b-grid-header-text-content {
  text-align: center;
}

[data-column=duration] div.b-grid-header-text .b-grid-header-text-content i {
  font-size: 1.3em;
  margin: 0;
}

.b-sch-tooltip-startdate,
.b-sch-tooltip-enddate {
  margin-top: 0.2em;
}

.b-grid-header .shaded,
.b-timeline-subgrid .shaded {
  z-index: 10 !important;
  pointer-events: auto;
  cursor: default;
}

.b-timeline-subgrid .shaded {
  border-inline-end: 2px solid red;
  background-color: rgba(250, 250, 250, 0.55);
}

.b-grid-header .shaded {
  height: 100% !important;
  top: 0;
  background: rgba(243, 244, 245, 0.7);
}

.b-theme-classic-dark .b-timeline-subgrid .shaded,
.b-theme-classic-dark .b-grid-header .shaded {
  background-color: rgba(68, 68, 74, 0.7019607843);
}

.b-group-row .b-grid-cell {
  background-color: gray;
  color: white !important;
}

.b-buttoncell {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.b-buttoncell .b-fa-chevron-down {
  transition: transform 0.3s;
}

.b-transparent.b-button {
  height: auto;
  width: auto;
  padding: 1em 0.5em;
  background: none !important;
  min-width: 1em;
  min-height: 1em;
}

.b-transparent.b-button,
.b-transparent.b-button.b-pressed {
  color: inherit;
}

.b-transparent.b-button:hover i {
  filter: brightness(80%);
}

.b-row-expanded .b-fa-chevron-down {
  transform: rotate(180deg);
}

.b-customlinechart {
  align-self: flex-end;
}

.b-customprogressbar {
  align-self: flex-end;
}

.b-scale {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 0.6em;
  opacity: 0;
  pointer-events: none;
}

.b-row-expanded .b-scale {
  transition: opacity 0.3s, height 0.3s !important;
  opacity: 1;
  height: 100px;
}

.b-grid-row .b-customlinechart {
  display: none !important;
}

.b-row-expanded .b-customlinechart {
  display: flex !important;
}

.b-labcell {
  flex-direction: column;
}

.b-labcell .b-slidetoggle,
.b-labcell .b-slider {
  display: none;
}

.b-row-expanded .b-labcell .b-slidetoggle,
.b-row-expanded .b-labcell .b-slider {
  display: flex;
}

.b-labcell .b-slidetoggle label,
.b-labcell .b-slider label {
  margin-inline-start: 0;
  width: 8em;
  font-size: 0.8em;
  color: inherit;
  text-transform: none;
  text-align: left;
}

.b-labcell .b-slidetoggle {
  height: 2em;
}

.b-labcell .b-slidetoggle .b-slidetoggle-toggle {
  background: #e0e0e7;
}

.b-labcell .b-slidetoggle input:checked+.b-slidetoggle-toggle {
  background: #3083fe;
}

.b-labcell .b-slidetoggle input,
.b-labcell .b-slidetoggle .b-slidetoggle-toggle {
  margin-top: 0.1em;
}

.b-labcell .b-slider {
  flex-direction: row;
}

.b-labcell .b-slider input {
  width: 60px;
}

.b-labcell .b-slider label {
  order: -1;
}

.b-name {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: auto;
  padding: 1em 0;
}

.b-grid-cell {
  align-items: flex-start;
}

.b-grid-cell .b-name i {
  margin-inline-end: 0.8em;
}

.b-grid-cell,
.b-grid-headers-locked .b-grid-header {
  padding: 1em 1.5em;
}

.b-sch-event-wrap {
  max-height: 40px;
}

.b-sch-background-canvas {
  z-index: 0;
}

.b-chartjslinechart {
  position: absolute;
  bottom: -2px;
  left: 0;
  display: none !important;
}

.b-row-expanded .b-chartjslinechart {
  display: block !important;
}

.b-sch-header-row:first-child .b-sch-header-text {
  color: #888;
}

.b-sch-header-row.b-lowest .b-sch-header-text {
  font-weight: bold;
}

.b-sch-event-wrap:not(.b-milestone-wrap) .b-sch-event .b-sch-event-content {
  font-size: 0.9em;
}
</style>
