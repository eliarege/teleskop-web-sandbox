<script lang="ts" setup>
import { QTree, useQuasar } from 'quasar'
import { useDataStore } from '~/store/DataStore'
import type { Dispenser, DispenserType } from '~/shared/types'

const emit = defineEmits(['logout'])
const { t } = useI18n()
const q = useQuasar()
const dataStore = useDataStore()

const treeNodes = ref<any[]>([])
const expanded = ref<string[]>([])

if (dataStore.selectedDispenser) {
  const selected = dataStore.selectedDispenser
  expanded.value = [`${selected.dispenserBrandId}`, `${selected.dispenserBrandId},${selected.dispenserType}`, `${selected.dispenserBrandId},${selected.dispenserType},${selected.dispenserId}`]
}
watch(() => dataStore.selectedDispenser, (selected) => {
  if (selected) {
    expanded.value = [`${selected.dispenserBrandId}`, `${selected.dispenserBrandId},${selected.dispenserType}`, `${selected.dispenserBrandId},${selected.dispenserType},${selected.dispenserId}`]
  } else {
    expanded.value = []
  }
})

function onExpand(nodes: any) {
  expanded.value = nodes
}

generateTreeNodes()

async function generateTreeNodes() {
  const dispensers = await dataStore.getDispensers()
  const types = await dataStore.getDispenserTypes()

  const brandMap = new Map()
  const typeMap = new Map()

  types.forEach((type) => {
    brandMap.set(type.dispenserBrandId, type.dispenserBrandName)
    if (!typeMap.has(type.dispenserBrandId)) {
      typeMap.set(type.dispenserBrandId, [])
    }
    typeMap.get(type.dispenserBrandId)!.push(type)
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
      :nodes="treeNodes"
      dense
      label-key="label"
      node-key="id"
      no-connectors
      no-nodes-label=" "
      :expanded="expanded"
      style="font-size: 18px;"
      @update:expanded="onExpand"
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
