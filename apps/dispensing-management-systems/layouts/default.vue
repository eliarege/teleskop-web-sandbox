<script lang="ts" setup>
import { LoadingSpinner } from 'ui'
import { useStateStore } from '~/store/State'
import { useDataStore } from '~/store/DataStore'

const q = useQuasar()
const { t } = useI18n()
const stateStore = useStateStore()
const dataStore = useDataStore()
const route = useRoute()
const isLoading = ref(false)
const drawer = ref(true)
const user = ref(dataStore.user)
stateStore.$subscribe((_, state) => {
  isLoading.value = state.isLoading
})
dataStore.$subscribe((_, store) => {
  user.value = store.user
  if (!user.value)
    goToHomepage()
})
function goToHomepage() {
  navigateTo({
    path: `/`,
  })
}
function onLogout() {
  onRefresh()
  q.notify({
    position: 'top',
    color: 'red-4',
    textColor: 'white',
    icon: 'cloud_done',
    message: t('LoggedOut'),
    timeout: 3000,
  })
  goToHomepage()
}
function onRefresh() {
  dataStore.$patch({
    user: undefined,
    title: '',
    selectedDispenser: undefined,
    dispensers: undefined,
  })
}
const DISPENSER_PATH_RE = /^\/dispenser\/\d+$/
watch(() => route.params, () => {
  if (route.path === '/')
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
function stickyHeight() {
  const percentage = 45
  return (window.innerHeight * (percentage / 100))
}

onMounted(() => {
  window.addEventListener('resize', () => {
    stickyHeight()
  })
})
</script>

<template>
  <QLayout view="hHh LpR fFf">
    <LoadingSpinner v-if="isLoading" />
    <Appbar />
    <QDrawer
      v-if="drawer && user"
      show-if-above
      bordered
      persistent
      behavior="desktop"
    >
      <QScrollArea
        class="px-1"
        style="height: calc(100vh - 51px);"
      >
        <Menubar
          mt-1
          @refresh="onRefresh"
        />
        <DispenserList
          class="my-1"
          @logout="onLogout"
        />
      </QScrollArea>
    </QDrawer>
    <QPageSticky
      v-if="user"
      position="top-left"
      :offset="[5, stickyHeight()]"
      style="z-index: 100;"
    >
      <QBtn
        round
        color="primary"
        :icon="drawer ? 'chevron_left' : 'chevron_right'"
        @click="() => { drawer = !drawer }"
      >
        <QTooltip
          :offset="[10, 10]"
          anchor="center right"
          self="center left"
          text-center
        >
          {{ drawer ? t('HideDispenserList') : t('ShowDispenserList') }}
        </QTooltip>
      </QBtn>
    </QPageSticky>
    <QPageContainer>
      <div class="row">
        <div class="col-auto">
          <NavigationButton class="mt-5 ml-5" />
        </div>
        <div class="col">
          <slot />
        </div>
      </div>
    </QPageContainer>
  </QLayout>
</template>
