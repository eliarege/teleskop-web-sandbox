<!-- eslint-disable no-new -->
<script setup lang="ts">
import type { DragHelperConfig, GridConfig, SchedulerPro, SchedulerProConfig } from '@bryntum/schedulerpro-trial'
import { Splitter } from '@bryntum/schedulerpro-trial'
import { Drag, Schedule, Task, UnplannedGrid } from '~/lib/bryntum'
import type { UnplannedEvents, UnplannedEventsRaw } from '~/shared/types'

const currentTime = useNow({ interval: 1000 })

const { data: machines } = await useFetch('/api/machineList')
const { data: events } = await useFetch('/api/plannedEvents', {
  query: { from: '2023-07-01', to: '2023-07-07' },
})
const { data: unScheduledEvents } = await useFetch('/api/unplannedEvents', {
  query: { from: '2023-07-01', to: '2023-07-07' },
})
const modifiedMachines = computed(() => machines.value?.map((m) => {
  return {
    ...m,
    // TODO: machine icons?
    iconCls: 'b-fa b-fa-solid b-fa-play',
    color: 'red',
  }
}))
const modifiedEvents = computed(() => events.value?.map((ev) => {
  return {
    id: ev.planKey,
    name: ev.jobOrder,
    resourceId: ev.machineId,
    startDate: new Date(ev.plannedStartTime),
    endDate: new Date(ev.plannedEndTime),
    resizable: false,
    draggable: true,
    editable: false,
    ...ev,
  }
}))
const modifiedUnscheduledEvents = computed(() => unScheduledEvents.value?.map((unp: UnplannedEventsRaw) => {
  return {
    ...unp,
    id: unp.planKey,
    name: unp.jobOrder,
    duration: unp.theoricalDuration ? (unp.theoricalDuration / 60) / 60 : Math.round(Math.random() * 10) + 1,
    durationUnit: 'hour',
    constraintDate: new Date(),
  } as UnplannedEvents
}))
let schedule: SchedulerPro | null = null
onMounted(() => {
  const _schedule: SchedulerPro = schedule = new Schedule({
    ref: 'schedule',
    appendTo: 'main',
    multiEventSelect: false,
    createEventOnDblClick: false,
    startDate: new Date(),
    startDateField: {
      label: 'test',
      flex: '1 0 50%',
      min: currentTime.value,
    },
    getDateConstraints() {
      return {
        start: currentTime.value,
      }
    },
    flex: 1,
    project: {
      eventStore: {
        removeUnassignedEvent: false,
      },
      eventModelClass: Task,
    },
    eventColor: 'blue',
    resources: modifiedMachines.value,
    events: modifiedEvents.value,
    eventRenderer({ eventRecord }) {
      const icons: string[] = []
      // if (eventRecord.originalData.notStarted) {
      // icons.push('b-fa b-fa-solid b-fa-list-check')
      // }
      if (eventRecord.originalData.isDeviation) {
        icons.push('b-fa b-fa-solid b-fa-clock')
      }
      if (eventRecord.originalData.isFinished) {
        icons.push('b-fa b-fa-solid b-fa-flag-checkered')
      }
      // if (eventRecord.originalData.isLocked) {
      //   icons.push('b-fa b-fa-lock')
      // }
      if (eventRecord.originalData.isRunning) {
        icons.push('b-fa b-fa-solid b-fa-play')
      }
      if (eventRecord.originalData.hasAlarm) {
        icons.push('b-fa b-fa-solid b-fa-bell')
      }
      if (eventRecord.originalData.isStopped) {
        icons.push('b-fa b-fa-solid b-fa-stop')
      }
      if (eventRecord.originalData.isDeleted) {
        icons.push('b-fa b-fa-solid b-fa-ban')
      }

      const iconClass = icons.map(icon => `<i class="${icon}"></i>`).join('')
      return `
      ${iconClass}
      ${eventRecord.originalData.name}
  `
    },
    timeResolution: {
      unit: 'minute',
      increment: 5,
    },
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
    ],
  } as Partial<SchedulerProConfig>)
  new Splitter({
    appendTo: 'main',
  })
  const unplannedGrid = new UnplannedGrid({
    ref: 'unplanned',
    appendTo: 'main',
    multiEventSelect: false,
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
.b-timeline-subgrid .b-sch-current-time {
  border: 1px solid red !important
}
</style>
