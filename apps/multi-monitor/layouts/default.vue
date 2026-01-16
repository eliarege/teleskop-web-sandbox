<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { breakpointsTailwind, useWindowSize } from '@vueuse/core'
import { matAlarm, matSettings } from '@quasar/extras/material-icons'
import { format } from 'date-fns'
import { toValue } from 'vue'
import { useDataStore } from '~/store/Datas'
import type { MachineData } from '~/shared/types'

const { t } = useI18n()
const breakpoints = useBreakpoints({
  lg: '1200px',
  sm: '768px',
  md: '768px',
})
const sm = breakpoints.greaterOrEqual('sm')
const store = useDataStore()
const showSettings = ref(false)
const burgerMenu = ref(false)

const { width } = useWindowSize()
const isMobile = computed(() => width.value <= 767)
const tt = (key: string) => () => t(key)

const router = useRouter()
const items = [] as TopbarMenuItem[]
const commonSettingsItems: TopbarMenuItem[] = [
  {
    label: tt('teleskop.settings'),
    icon: matSettings,
    onClick() {
      showSettings.value = !showSettings.value
    },
  },
  {
    label: tt('teleskop.alarm'),
    icon: matAlarm,
    onClick() {
      navigateTo('/alarm')
    },
  },
]

const { d } = useI18n()
const now = useNow()
const formatted = computed(() => {
  return d(now.value, 'datetime')
})
const machineData = computed(() => {
  return store.machines.map((machine) => {
    return {
      ...machine,
      runningStartTime: machine.runningStartTime
        ? new Date(machine.runningStartTime)
        : null,
      stopReasonDateTime: new Date(machine.stopReasonDateTime),
      manualReasonDateTime: new Date(machine.stopReasonDateTime),
      runningStartHour: machine.runningStartTime
        ? format(new Date(machine.runningStartTime), 'MM-dd HH:mm:ss')
        : '-',
      loggedInOperatorName: machine.loggedInOperatorName
        ? machine.loggedInOperatorName
        : '',
      runningJobOrder: machine.runningJobOrder ? machine.runningJobOrder : '',
      runningProgramName: machine.runningProgramName
        ? machine.runningProgramName
        : '',
      runningProgramList: machine.runningProgramList
        ? machine.runningProgramList
        : '',
      runningCommandName: machine.runningCommandName
        ? machine.runningCommandName
        : '',
      runningAlarmName: machine.runningAlarmName
        ? machine.runningAlarmName
        : '',
      runningPhaseName: machine.runningPhaseName
        ? machine.runningPhaseName
        : '',
      newTheoreticalDuration: machine.theoreticalDuration
        ? machine.theoreticalDuration
        : 1,
      stopReason: machine.stopReason ? machine.stopReason : '',
      manualReason: machine.manualReason ? machine.manualReason : '',
      runningAlarmNo: machine.runningAlarmNo ? machine.runningAlarmNo : '',
    } as MachineData
  })
})
</script>

<template>
  <QLayout view="hhh lpr fff">
    <QHeader
      bordered
      class="bg-white text-black select-none border-b-3"
    >
      <QToolbar class="min-h-unset">
        <template v-if="sm">
          <QToolbarTitle class="text-clip" shrink>
            <TopbarHomeButton />
          </QToolbarTitle>
          <TopbarButton
            v-for="(item, index) in items"
            :key="index"
            :label="toValue(item.label)"
            :disable="toValue(item.disabled)"
          >
            <TopbarMenu
              v-if="item.subMenu"
              v-bind="item.subMenu"
            />
          </TopbarButton>
        </template>
        <NavBar
          v-if="!isMobile"
          :formatted
          :machine-data
        />
        <TopbarButton
          v-else
          icon="menu"
          @click="burgerMenu = !burgerMenu"
        />
        <div
          v-if="isMobile"
          class="flex-center w-full"
        >
          <TopbarHomeButton />
        </div>
        <QSpace />
        <div class="flex-shrink-0">
          <TopbarAppGrid />
          <TopbarUser>
            <TopbarCommonSettings disable-theme :extra-items="commonSettingsItems" />
          </TopbarUser>
          <TopbarLoginButton />
        </div>
      </QToolbar>
    </QHeader>

    <QPageContainer class="page-container">
      <slot />
      <q-dialog
        v-if="showSettings"
        v-model="showSettings"
        :position="isMobile ? 'top' : 'standard' "
      >
        <Settings @close="showSettings = false" />
      </q-dialog>
      <q-dialog
        v-if="isMobile"
        v-model="burgerMenu"
        position="top"
      >
        <NavBarHamburger :machine-data @close="burgerMenu = false" />
      </q-dialog>
    </QPageContainer>
  </QLayout>
</template>

<style scoped lang="postcss">
.page-container {
  height: calc(100vh);
  overflow: auto;
}
</style>
