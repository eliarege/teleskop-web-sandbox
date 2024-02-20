<script lang="ts" setup>
import { QTree, useQuasar } from 'quasar'
import { useDataStore } from '~/store/DataStore'
import type { Dispenser, DispenserType } from '~/shared/types'

const emit = defineEmits(['logout'])
const { t } = useI18n()
const q = useQuasar()
const dataStore = useDataStore()

dataStore.dispensers = await getDispensers()
dataStore.dispenserTypes = await getDispenserTypes()

const tree = ref<QTree>()
const treeNodes = ref<any[]>([])
// TODO: Expand selected dispenser initially
/*
onMounted(() => {
  if (dataStore.selectedDispenser) {
    const selected = dataStore.selectedDispenser
    tree.value?.setExpanded(`${selected.dispenserBrand},${selected.dispenserType},${selected.dispenserId}`, true)
  }
})
*/
async function getDispensers() {
  if (dataStore.dispensers)
    return dataStore.dispensers
  const dispensers = await $fetch<Dispenser[]>(`/api/dispensers`)
  return dispensers
}
async function getDispenserTypes() {
  if (dataStore.dispenserTypes)
    return dataStore.dispenserTypes
  const types = await $fetch<DispenserType[]>(`/api/dispensers/types`)
  return types
}
generateTreeNodes()

function generateTreeNodes() {
  const dispensers = dataStore.dispensers!
  const types = dataStore.dispenserTypes!

  const brandMap = new Map()
  const typeMap = new Map()

  types.forEach((type) => {
    brandMap.set(type.dispenserBrandId, type.dispenserBrandName)
    if (!typeMap.has(type.dispenserBrandId)) {
      typeMap.set(type.dispenserBrandId, [])
    }
    typeMap.get(type.dispenserBrandId)?.push(type)
  })

  treeNodes.value = Array.from(brandMap.keys()).map((brandId) => {
    const brandName = brandMap.get(brandId)
    const brandTypes = typeMap.get(brandId) || []
    const children = brandTypes.flatMap((type: DispenserType) => {
      const typeDispensers = dispensers.filter(
        dispenser => dispenser.dispenserType === type.dispenserTypeId,
      )
      const dispenserNodes = typeDispensers.map(dispenser => ({
        ...dispenser,
        id: `${brandId},${type.dispenserTypeId},${dispenser.dispenserId}`,
        label: dispenser.dispenserName,
      }))
      if (dispenserNodes.length === 0) {
        return null
      }
      return [{
        id: `${brandId},${type.dispenserTypeId}`,
        label: type.dispenserTypeName,
        children: dispenserNodes,
      }]
    })

    const filteredChildren = children.filter((child: any) => child !== null)
    if (filteredChildren.length === 0) {
      return null
    }

    return {
      id: `${brandId}`,
      label: brandName,
      children: filteredChildren,
    }
  }).filter(node => node !== null)
}

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
    <QTree
      ref="tree"
      :nodes="treeNodes"
      dense
      label-key="label"
      node-key="id"
      accordion
      no-connectors
      :default-expand-all="dataStore.selectedDispenser !== undefined"
      @select="selectItem"
    >
      <template #default-header=" { node }">
        <span v-if="node.children">
          {{ node.label }}
        </span>
      </template>
      <template #default-body="{ node }">
        <QItem
          v-if="!node.children"
          :class="q.dark.isActive ? 'border-solid border-1 b-rd-2' : 'border-solid border-1 b-rd-2 border-black text-black'"
          clickable
          :active="dataStore.selectedDispenser?.dispenserId === node.dispenserId"
          :active-class="q.dark.isActive ? 'text-white opacity-50' : 'text-black opacity-50'"
          @click="selectItem(node)"
        >
          <QMenu
            touch-position
            context-menu
          >
            <QList>
              <QItem
                v-close-popup
                clickable
                @click="onClickDetails(node)"
              >
                <QItemSection>{{ t('Details') }}</QItemSection>
              </QItem>
              <QItem
                v-close-popup
                clickable
                @click="onClickVnc(node)"
              >
                <QItemSection>{{ t('Screen') }}</QItemSection>
              </QItem>
            </QList>
          </QMenu>
          <QItemSection avatar>
            <QAvatar
              icon="check_circle"
            />
          </QItemSection>
          <QItemSection>
            <QItemLabel>{{ node.label }}</QItemLabel>
          </QItemSection>
        </QItem>
      </template>
    </QTree>
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
