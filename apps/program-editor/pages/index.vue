<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import TBProgramListDialog from '~/components/TBProgramListDialog.vue'
import MachineCommandList from '~/components/MachineCommandList.vue'
import MachineList from '~/components/MachineList.vue'
import TBProgramDialog from '~/components/TBProgramDialog.vue'
import MenuProgram from '~/components/MenuProgram.vue'
import MenuBar from '~/components/MenuBar.vue'

const { dark } = useQuasar()
const route = useRoute()
const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)
const printProgramDialog = ref(false)
const printProgramListDialog = ref(false)
// const cookie = useCookie<'auto' | boolean>('dark')

// dark.set(cookie.value ?? 'auto')
// watch(
//   () => dark.mode,
//   mode => cookie.value = mode,
// )

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value
}
</script>

<template>
  <QLayout view="hHh LpR fFf">
    <QHeader :class="dark.isActive ? 'bg-dark-1' : 'bg-white'" class="text-white">
      <MenuBar />
    </QHeader>

    <QDrawer
      v-model="leftDrawerOpen"
      show-if-above
      side="left"
      borderless
      :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'"
    >
      <MachineList />
    </QDrawer>

    <QPageContainer>
      <div :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'" class="flex sticky top-10.5 z-10">
        <QBtn
          dense
          flat
          icon="menu"
          @click="toggleLeftDrawer"
        />
        <MenuProgram :vis="true" :type="route.params.program_no ? 'editor' : 'programs'" />

        <QBtn
          dense
          flat
          icon="menu"
          @click="toggleRightDrawer"
        />
      </div>

      <div :class="dark.isActive ? 'bg-dark-8' : 'bg-white'">
        <NuxtPage />
      </div>
    </QPageContainer>

    <QDrawer
      v-model="rightDrawerOpen"
      show-if-above
      side="right"
      borderless
      :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'"
    >
      <MachineCommandList />
    </QDrawer>
  </QLayout>
  <div>
    <TBProgramListDialog :vis="printProgramListDialog" @update:vis="e => printProgramListDialog = e" />
    <TBProgramDialog :vis="printProgramDialog" @update:vis="e => printProgramDialog = e" />
  </div>
</template>

<style lang="postcss" scoped>
::deep(.q-drawer) {
  z-index: 10 !important;
}
</style>
