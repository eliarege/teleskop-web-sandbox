<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { breakpointsTailwind } from '@vueuse/core'
import { useSettingStore } from '~/store/settings'

const store = useSettingStore()
const { t } = useI18n()
const breakpoints = useBreakpoints(breakpointsTailwind)
const sm = breakpoints.greaterOrEqual('sm')
const queueBasedRef = ref()
function scrollToDate(event: any) {
  queueBasedRef.value.scrollToDate(event)
}
function refreshScheduler() {
  queueBasedRef.value.refreshScheduler()
}
function addGridColumn(args: any) {
  queueBasedRef.value.addGridColumn(args)
}
function removeGridColumn(args: any) {
  queueBasedRef.value.removeGridColumn(args)
}
function dateRangeEnd() {
  queueBasedRef.value.dateRangeEnd()
}
function zoomIn() {
  queueBasedRef.value.zoomIn()
}
function zoomOut() {
  queueBasedRef.value.zoomOut()
}
function resetZoom() {
  queueBasedRef.value.resetZoom()
}

function getBatchTextInfo(batchText: string[], translationKey: string) {
  return computed(() => batchText.map(item => t(`${translationKey}.${item}`)))
}

const plannedEventTextInfo = getBatchTextInfo(store.settings.plannedBatchText, 'settings.plan-area.dropDown').value.join(', ')
const completedEventTextInfo = getBatchTextInfo(store.settings.completedBatchText, 'settings.plan-area.dropDown').value.join(', ')
const ongoingTextInfo = getBatchTextInfo(store.settings.ongoingBatchText, 'settings.plan-area.dropDown').value.join(', ')

const tt = (key: string) => () => t(key)

const items = [] as TopbarMenuItem[]

const itemsMobile = [
  [
    {
      label: tt('menu.home'),
      icon: 'home',
      to: '/',
    },
  ],
  items,
] as TopbarMenuItem[][]

const { data: state } = useAuthFetch('/api/ptStatus')
</script>

<template>
  <QLayout view="hhh lpR fFf">
    <QHeader
      bordered
      class="text-white bryntum-tbar-bg select-none border-b-3 !h-53px"
    >
      <QToolbar class="min-h-unset">
        <template v-if="sm">
          <QToolbarTitle shrink class="text-clip">
            <TopbarHomeButton />
          </QToolbarTitle>
          <NavbarJobOrderSearch @scroll-to-event=" (e) => scrollToDate(e)" />

          <NavbarButtonGroup
            @refresh-scheduler="refreshScheduler()"
            @add-grid-column="(e) => addGridColumn(e)"
            @remove-grid-column="(e) => removeGridColumn(e)"
            @date-range-end="dateRangeEnd()"
            @zoom-in="zoomIn()"
            @zoom-out="zoomOut()"
            @reset-zoom="resetZoom()"
          />
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
          <q-space />
          <div class="mr-5">
            <TwIcon name="i-material-symbols:info" size="30px" />
            <QTooltip>
              <div class="flex-center flex-col text-sm">
                <span>{{ t('plannedEventTextInfo') }}: {{ plannedEventTextInfo }}</span>
                <span>{{ t('completedEventTextInfo') }}: {{ completedEventTextInfo }}</span>
                <span>{{ t('ongoingTextInfo') }}: {{ ongoingTextInfo }}</span>
              </div>
            </QTooltip>
          </div>

          <NavbarUnplannedJobOrderSearch class="w-auto" />
        </template>
        <TopbarButton
          v-else
          icon="menu"
        >
          <TopbarMenu :items="itemsMobile" />
        </TopbarButton>
        <div class="space-x-1">
          <TopbarAppGrid />
          <TopbarUser>
            <TopbarPtCommonSettings disable-theme />
          </TopbarUser>
          <TopbarLoginButton />
        </div>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <QPage class="w-full h-99vh content-height">
        <TimeBased v-if="Number.parseInt(state || '0') === 1" />
        <QueueBased v-else ref="queueBasedRef" />
      </QPage>
    </QPageContainer>
  </QLayout>
</template>

<style>
.bryntum-tbar-bg {
  background-color: #686872;
}
.content-height {
  height: calc(100vh - 53px);
  max-height: calc(100vh - 53px);
}
</style>
