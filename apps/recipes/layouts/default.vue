<script lang="ts" setup>
import LoadingSpinner from '@teleskop/nuxt-base/components/LoadingSpinner.vue'
import { useStateStore } from '~/store/State'
import { useDataStore } from '~/store/DataStore'

const { didInitialise } = useKeycloak()
const { t } = useI18n()
const { notifySuccess } = useNotify()
const stateStore = useStateStore()
const dataStore = useDataStore()
const route = useRoute()
const stickyUnavailablePaths = ['/settings']
const selectedDispenserUndefinedPaths = ['/', '/machines', '/settings']
const showDrawer = ref(true)
const showSticky = ref(!stickyUnavailablePaths.includes(route.path))
const { height } = useWindowSize()
const refreshKey = ref(0)

function goToHomepage() {
  navigateTo({
    path: `/`,
  })
}
function onLogout() {
  onReset()
  notifySuccess(t('Success'))
  goToHomepage()
}
function onReset() {
  dataStore.$patch({
    title: '',
    selectedDispenser: undefined,
    dispensers: undefined,
  })
}
async function onRefresh() {
  dataStore.selectedDispenser = undefined
  dataStore.dispensers = undefined
  dataStore.getDispensers()
  refreshKey.value += 1
  navigateTo({
    path: '/',
  })
}
const DISPENSER_PATH_RE = /^\/dispenser\/\d+$/
watch(() => route.params, () => {
  showSticky.value = !stickyUnavailablePaths.includes(route.path)
  if (selectedDispenserUndefinedPaths.includes(route.path))
    dataStore.selectedDispenser = undefined
  else if (DISPENSER_PATH_RE.test(route.path)) {
    const id = Number.parseInt(route.params.id as string)
    const dispenser = dataStore.dispensers?.find(val => val.dispenserId === id)
    dataStore.$patch({
      selectedDispenser: dispenser,
      title: dispenser?.dispenserName,
    })
  }
})
</script>

<template>
  <QLayout v-show="didInitialise" view="hHh LpR fFf">
    <LoadingSpinner v-if="stateStore.isLoading" />
    <NavigationBar />
    <QDrawer
      v-if="route.path !== '/settings'"
      v-model="showDrawer"
      show-if-above
      bordered
      persistent
      behavior="desktop"
    >
      <SideMenu
        :key="refreshKey"
        class="my-1"
        @logout="onLogout"
      />
    </QDrawer>
    <!-- <QPageSticky
      v-if="showSticky"
      position="top-left"
      :offset="[5, height * (9 / 20)]"
      style="z-index: 100;"
    >
      <QBtn
        round
        color="primary"
        :icon="showDrawer ? 'chevron_left' : 'chevron_right'"
        @click="showDrawer = !showDrawer"
      >
        <QTooltip
          :offset="[10, 10]"
          anchor="center right"
          self="center left"
          text-center
        >
          {{ showDrawer ? t('HideMenu') : t('ShowMenu') }}
        </QTooltip>
      </QBtn>
    </QPageSticky> -->
    <QPageContainer class="relative">
      <NavigationButton class="absolute z-1 mt-2 ml-2" />
      <QPage>
        <slot />
      </QPage>
    </QPageContainer>
  </QLayout>
</template>
