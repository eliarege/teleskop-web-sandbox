<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import { matAlarm, matSettings } from '@quasar/extras/material-icons'

const { t } = useI18n()
const tt = (key: string) => () => t(key)
const showSettings = ref(false)
const router = useRouter()
const { width } = useWindowSize()
const breakpoints = useBreakpoints({
  lg: '1200px',
  sm: '768px',
  md: '768px',
})
const sm = breakpoints.greaterOrEqual('sm')
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
const isMobile = computed(() => width.value <= 767)
const filterModal = ref(false)
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

        <div
          v-if="isMobile"
          class="flex items-center"
        >
          <TopbarHomeButton />
        </div>
        <AlarmTopbar />
        <QSpace />
        <TopbarFilter @click="filterModal = !filterModal">
          <QDialog
            v-model="filterModal"
            maximized
          >
            <AlarmFilter @close="filterModal = false" />
          </QDialog>
        </TopbarFilter>
        <TopbarAppGrid />
        <TopbarUser>
          <TopbarPtCommonSettings disable-theme :items="commonSettingsItems" />
        </TopbarUser>
        <TopbarLoginButton />
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
    </QPageContainer>
  </QLayout>
</template>

<style scoped lang="postcss">
</style>
