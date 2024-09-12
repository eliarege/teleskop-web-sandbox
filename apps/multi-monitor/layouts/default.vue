<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { breakpointsTailwind, useWindowSize } from '@vueuse/core'
import { matSettings } from '@quasar/extras/material-icons'
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

const items = [] as TopbarMenuItem[]
const commonSettingsItems: TopbarMenuItem[] = [
  {
    label: tt('teleskop.settings'),
    icon: matSettings,
    onClick() {
      showSettings.value = !showSettings.value
    },
  },
]
const formatter = ref('YYYY-MM-DD HH:mm:ss')
const formatted = useDateFormat(useNow(), formatter)
const machineData = computed(() => {
  return store.machines.map((machine) => {
    return {
      ...machine,
      runningStartTime: machine.runningStartTime
        ? new Date(machine.runningStartTime)
        : null,
      stopReasonDateTime: new Date(machine.stopReasonDateTime),
      manualReasonDateTime: new Date(machine.stopReasonDateTime),
      runningStartHour:
        machine.runningStartTime === null
          ? '-'
          : `${machine.runningStartTime?.slice(
              5,
              -14,
            )} ${machine.runningStartTime?.slice(11, -5)}` || null,
      loggedInOperatorName: machine.loggedInOperatorName
        ? machine.loggedInOperatorName
        : tt('teleskop.machine-stop-notification'),
      runningJobOrder: machine.runningJobOrder ? machine.runningJobOrder : ' ',
      runningProgramName: machine.runningProgramName
        ? machine.runningProgramName
        : ' ',
      runningProgramList: machine.runningProgramList
        ? machine.runningProgramList
        : ' ',
      runningCommandName: machine.runningCommandName
        ? machine.runningCommandName
        : ' ',
      runningAlarmName: machine.runningAlarmName
        ? machine.runningAlarmName
        : ' ',
      runningPhaseName: machine.runningPhaseName
        ? machine.runningPhaseName
        : ' ',
      newTheoreticalDuration: machine.theoreticalDuration
        ? machine.theoreticalDuration
        : 1,
      stopReason: machine.stopReason ? machine.stopReason : ' ',
      manualReason: machine.manualReason ? machine.manualReason : ' ',
      runningAlarmNo: machine.runningAlarmNo ? machine.runningAlarmNo : ' ',
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
            <NuxtLink to="/">
              <Icon
                name="tw:eliar"
                size="3rem"
                class="p-1"
              />
            </NuxtLink>
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
          <NuxtLink to="/">
            <Icon
              name="tw:eliar"
              size="2rem"
              class="mr-2"
            />
          </NuxtLink>
        </div>
        <QSpace />
        <div class="flex-shrink-0">
          <TopbarAppGrid />
          <TopbarAuthenticatedUser disable-theme :extra-items="commonSettingsItems" />
          <TopbarUnauthenticatedUser disable-theme :extra-items="commonSettingsItems" />
          <TopbarLoginButton />
        </div>
      </QToolbar>
    </QHeader>

    <QPageContainer class="test">
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
.test {
  height: calc(100vh);
  overflow: auto;
}
</style>
