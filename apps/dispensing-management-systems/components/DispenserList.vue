<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useDataStore } from '~/store/DataStore'
import type { Dispenser } from '~/shared/types'

const emit = defineEmits(['logout'])
const { t } = useI18n()
const q = useQuasar()
const dataStore = useDataStore()
const shouldFetch = !dataStore.dispensers
const { data } = shouldFetch
  ? await useFetch<Dispenser[]>(`/api/dispensers`)
  : { data: dataStore.dispensers }
dataStore.dispensers = data

async function selectItem(selection: Dispenser) {
  dataStore.$patch({ selectedDispenser: selection })
  await navigateTo({
    path: `/dispenser/${selection.dispenserId}`,
  })
}

function onClickDetails(dispenser: Dispenser) {
  q.dialog({
    title: t('Details'),
    message: `<ul> <li>${t('ID')}: ${dispenser.dispenserId}</li> <li>${t('Name')}: ${dispenser.dispenserName}</li> </ul>`,
    html: true,
  }).onOk(() => {
    console.log(dispenser.dispenserId)
  }).onCancel(() => {
    console.log('Cancel')
  }).onDismiss(() => {
    console.log('I am triggered on both OK and Cancel')
  })
}

async function onClickVnc(dispenser: Dispenser) {
  dataStore.selectedDispenser = dispenser
  await navigateTo({
    path: `/vnc/${dispenser.dispenserId}`,
  })
}
function onLogout() {
  emit('logout')
}
</script>

<template>
  <div>
    <QList
      bordered
      separator
      dense
      no-transition
      no-selection-unset
      default-expand-all
    >
      <QItem
        v-for="item in dataStore.dispensers"
        :key="item.dispenserId"
        clickable
        :active="dataStore.selectedDispenser?.dispenserId === item.dispenserId"
        :active-class="q.dark.isActive ? 'text-white opacity-50' : 'text-black opacity-50'"
        @click="selectItem(item)"
      >
        <QMenu
          touch-position
          context-menu
        >
          <QList>
            <QItem
              v-close-popup
              clickable
              @click="onClickDetails(item)"
            >
              <QItemSection>{{ t('Details') }}</QItemSection>
            </QItem>
            <QItem
              v-close-popup
              clickable
              @click="onClickVnc(item)"
            >
              <QItemSection>{{ t('Screen') }}</QItemSection>
            </QItem>
          </QList>
        </QMenu>
        <QItemSection avatar>
          <QAvatar
            icon="check"
          />
        </QItemSection>
        <QItemSection>
          <QItemLabel>{{ item.dispenserName }}</QItemLabel>
        </QItemSection>
      </QItem>
    </QList>
    <LoginInfo
      absolute
      bottom-0
      left-0
      right-0
      mx-auto
      @logout="onLogout"
    />
  </div>
</template>
