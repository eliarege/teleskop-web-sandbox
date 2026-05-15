<script lang="ts" setup>
import { withBase } from 'ufo'
import { QTree, useQuasar } from 'quasar'
import JobOrderBatchCreateDialog from './job-order/JobOrderBatchCreateDialog.vue'
import JobOrderContinueCreateDialog from './job-order/JobOrderContinueCreateDialog.vue'
import { useDataStore } from '~/store/DataStore'
import type { Dispenser, DispenserType } from '~/shared/types'

const emit = defineEmits(['logout'])
const { t } = useI18n()
const q = useQuasar()
const dataStore = useDataStore()
const { notifySuccess } = useNotify()

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
watch(() => dataStore.refreshDispensers, () => {
  dataStore.dispensers = undefined
  generateTreeNodes()
})
function onExpand(nodes: any) {
  expanded.value = nodes
}

// Unusued code, but keeping for now as it might be useful in the future
// onMounted(() => {
//   generateTreeNodes()
// })

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
  dataStore.selectedDispenser = selection
  await navigateTo({
    path: `/dispenser/${selection.dispenserId}`,
  })
}

function onClickDetails(dispenser: Dispenser) {
  q.dialog({
    title: t('Details'),
    message: `<ul> <li>ID: ${dispenser.dispenserId}</li> <li>${t('Name')}: ${dispenser.dispenserName}</li> </ul>`,
    html: true,
  })
}
async function onClickVnc(dispenser: Dispenser) {
  dataStore.selectedDispenser = dispenser
  await navigateTo({
    path: `/vnc/${dispenser.dispenserId}`,
  })
}
function openNewBatchJobOrderDialog() {
  q.dialog({
    component: JobOrderBatchCreateDialog,
  }).onOk(async (payload: any) => {
    if (payload.print && payload.batchNo) {
      const jobOrderPrintPath = withBase('/jobOrders/print', useRuntimeConfig().app.baseURL)
      await navigateTo({
        path: jobOrderPrintPath,
        query: { batchNo: String(payload.batchNo) },
      }, {
        open: {
          target: '_blank',
        },
      })
    }
    notifySuccess(t('Success'), { redirect: '/jobOrders' })
  })
}
function openNewContinueJobOrderDialog() {
  q.dialog({
    component: JobOrderContinueCreateDialog,
  }).onOk(() => {
    notifySuccess(t('Success'), { redirect: '/jobOrders' })
  })
}
</script>

<template>
  <div>
    <div v-show="false">
      <div class="px-3 text-h6">
        {{ t('Dispensers') }}
      </div>
      <QTree
        :nodes="treeNodes"
        dense
        label-key="label"
        node-key="id"
        no-connectors
        no-nodes-label=" "
        :expanded
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
            class="item"
            clickable
            :active="dataStore.selectedDispenser?.dispenserId === node.dispenserId"
            active-class="active-item"
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
      <QBtn
        :label="t('AddNewDispenser')"
        w-full
        rounded
        mt-2
        icon="add"
        no-caps
        @click="navigateTo(`/machines`)"
      />
    </div>
    <QList separator>
      <QItem clickable to="/jobOrders">
        <QItemSection avatar>
          <QIcon name="assignment" />
        </QItemSection>
        <QItemSection>
          <QItemLabel>{{ t('JobOrders') }}</QItemLabel>
        </QItemSection>
      </QItem>
      <QItem clickable to="/recipes/batch">
        <QItemSection avatar>
          <QIcon name="science" />
        </QItemSection>
        <QItemSection>
          <QItemLabel>{{ t('BatchRecipes') }}</QItemLabel>
        </QItemSection>
      </QItem>
      <QItem clickable to="/programs">
        <QItemSection avatar>
          <QIcon name="settings_applications" />
        </QItemSection>
        <QItemSection>
          <QItemLabel>{{ t('Programs') }}</QItemLabel>
        </QItemSection>
      </QItem>
      <QItem clickable @click="openNewBatchJobOrderDialog">
        <QItemSection avatar>
          <QIcon name="add" />
        </QItemSection>
        <QItemSection>
          <QItemLabel>{{ t('NewBatchJobOrder') }}</QItemLabel>
        </QItemSection>
      </QItem>
      <QItem v-show="false" clickable @click="navigateTo(`/recipes/continue`)">
        <QItemSection avatar>
          <QIcon name="arrow_right" />
        </QItemSection>
        <QItemSection>
          <QItemLabel>{{ t('ShowContinueRecipes') }}</QItemLabel>
        </QItemSection>
      </QItem>
      <QItem v-show="false" clickable @click="openNewContinueJobOrderDialog">
        <QItemSection avatar>
          <QIcon name="add" />
        </QItemSection>
        <QItemSection>
          <QItemLabel>{{ t('NewContinueJobOrder') }}</QItemLabel>
        </QItemSection>
      </QItem>
    </QList>
  </div>
</template>

<style scoped>
.item {
  border-style: solid;
  border-width: 1px;
  border-radius: 0.5rem;
  border-color: black;
  color: black;
}
.body--dark .item {
  border-color: grey;
  color: white;
}
.active-item {
  color: dark;
  opacity: 0.5;
}

.body--dark .active-item {
  color: white;
}
</style>
