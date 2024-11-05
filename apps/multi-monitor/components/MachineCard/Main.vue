<script setup lang="ts">
import type { PropType } from 'vue'
import { withBase } from 'ufo'
import type { MachineData } from '~/shared/types'
import { useColorStore } from '~/store/Colors'
import { useDataStore } from '~/store/Datas'

const props = defineProps({
  machineData: {
    type: Array as PropType<MachineData[]>,
    required: true,
  },
})

const { t } = useI18n()
const store = useDataStore()
const colors = useColorStore()

const baseURL = useRuntimeConfig().app.baseURL
const withBaseURL = (input: string) => withBase(input, baseURL)

const sortedMachines = computed(() => {
  const filteredGroups = props.machineData.filter(group => !store.filteredGroups.has(group.groupName))
  const filteredMachines = filteredGroups.filter(item => !store.filteredMachines.has(item.id))
  const activeSort = filteredMachines.filter(
    machine => machine.runningBatchStatus !== 0,
  )
  const inactiveSort = filteredMachines.filter(
    machine => machine.runningBatchStatus === 0,
  )
  if (store.sortMachines === 3) {
    return [
      ...inactiveSort.sort((a, b) => (a.id < b.id ? -1 : 1)),
      ...activeSort.sort((a, b) => (a.id < b.id ? -1 : 1)),
    ]
  } else if (store.sortMachines === 2) {
    return [
      ...activeSort.sort((a, b) => (a.id < b.id ? -1 : 1)),
      ...inactiveSort.sort((a, b) => (a.id < b.id ? -1 : 1)),
    ]
  } else if (store.sortMachines === 4) {
    return [...filteredMachines].sort((a, b) => a.groupName < b.groupName ? -1 : 1,
    )
  } else {
    return [...filteredMachines].sort((a, b) => (a.id < b.id ? -1 : 1))
  }
})
// #region FUNCTIONS
function connectionStatus(params: number) {
  if (params === 1) {
    return withBaseURL('/icons/baglanti-var.png')
  } else if (params === 2) {
    return withBaseURL('/icons/baglanti-yok.png')
  } else if (params === 5) {
    return withBaseURL('/icons/batarya.png')
  } else {
    return withBaseURL('/icons/baglanti-sorunlu.png')
  }
}
function reqStatus(params: number) {
  if (params === 0) {
    return t('teleskop.status-new')
  } else if (params === 1) {
    return t('teleskop.status-sent')
  } else if (params === 2) {
    return t('teleskop.status-finished')
  } else if (params === 4) {
    return t('teleskop.status-prio')
  } else return t('teleskop.status-cancelled')
}

const { width: screenWidth } = useWindowSize()

function cardBackgroundColor(currentAlarmStatus: number, runningBatchStatus: number) {
  if (store.sortMachines === 5) {
    if (currentAlarmStatus === 0) {
      return '#FF3030'
    } else if (currentAlarmStatus === 1) {
      return '#FFA730'
    }
  }
  if (runningBatchStatus !== 2) {
    return colors.cardIdleBg
  } else return colors.cardActiveBg
}

function isScreenViable(screen: number) {
  return !(screen < 900)
}
// #endregion
</script>

<template>
  <div
    v-if="store.sortMachines !== 5"
    class="card-wrapper lt-sm:(px-2)"
    :style="{ zoom: store.zoomLevel }"
  >
    <div
      v-for="element in sortedMachines"
      :key="element.id"
    >
      <div class="w-full h-full">
        <MachineCardLayout
          :colors="{
            backGround: cardBackgroundColor(element.currentAlarmStatus, element.runningBatchStatus),
            itemBackGround: colors.cardItemBg,
            activeBackGround: colors.cardActiveBg,
            idleBackGround: colors.cardIdleBg,
          }"
          :washing="store.settings?.washing"
          :machine="element"
          :is-group-visible="store.group"
          :is-screen-viable="isScreenViable(screenWidth)"
          :connection-status="connectionStatus(element.connectionStatus)"
          :req-status="reqStatus(element.reqStatus)"
          :machine-sort="store.sortMachines"
          :links-active="true"
        />
      </div>
    </div>
  </div>
  <div v-else>
    <MachineCardAlarm />
  </div>
</template>

<style scoped lang="postcss">
.card-wrapper {
  grid-template-columns: repeat(auto-fill, minmax(370px, 1fr));
  @apply grid gap-x-3 gap-y-2 mt-1 overflow-x-hidden font-extrabold pb-3 px-3;
  .card-container {
    border-radius: 20px;
    @apply flex flex-col e-border border-dark-900/10;
  }
}
@media screen and (max-width: 735px) {
  .card-wrapper {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    @apply;
  }
}
.alarm {
  animation: alarm 10s ease-out infinite;
  transform: translate3d(0);
}
@keyframes alarm {
  0%,
  1%,
  2%,
  3%,
  4% {
    color: rgba(255, 255, 255, 0);
  }
  1.5%,
  2.5%,
  3.5%,
  4.5%,
  100% {
    color: rgba(255, 255, 255, 1);
  }
}
</style>
