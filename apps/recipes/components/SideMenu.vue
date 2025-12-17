<script lang="ts" setup>
import { withBase} from 'ufo'
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
const expandedButtons = ref<boolean[]>([false, false, false])

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
function openNewBatchJobOrderDialog() {
  q.dialog({
    component: JobOrderBatchCreateDialog,
  }).onOk(async (payload: any) => {
    if (payload.print) {
      sessionStorage.setItem('jobOrderMaterials', JSON.stringify(payload.materials))
      sessionStorage.setItem('jobOrderParams', JSON.stringify(payload.params))
      sessionStorage.setItem('jobOrderMachines', JSON.stringify(payload.machines))
      sessionStorage.setItem('jobOrderRecipeParams', JSON.stringify(payload.recipeParams))
      const correctPath = withBase('/jobOrders/print', useRuntimeConfig().app.baseURL)
      await navigateTo({
        path: correctPath,
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
    <QBtn
      v-show="false"
      :label="t('Dispensers')"
      size="20px"
      w-full
      flat
      align="left"
      no-caps
      bold
      @click="expandedButtons[0] = !expandedButtons[0]"
    >
      <template #default>
        <QIcon
          name="expand_more"
          size="24px"
          class="rotate-transition"
          :class="{ rotated: expandedButtons[0] }"
        />
      </template>
    </QBtn>
    <QSlideTransition>
      <div v-show="expandedButtons[0]">
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
          w-full
          rounded
          mt-2
          icon="add"
          @click="navigateTo(`/machines`)"
        >
          <QTooltip :offset="[0, 5]">
            {{ t('AddNewDispenser') }}
          </QTooltip>
        </QBtn>
      </div>
    </QSlideTransition>
    <QSeparator class="flex-grow my-2" />
    <QBtn
      :label="t('Programs')"
      size="20px"
      align="left"
      w-full
      flat
      no-caps
      @click="expandedButtons[1] = !expandedButtons[1]"
    >
      <template #default>
        <QIcon
          name="expand_more"
          size="24px"
          class="rotate-transition"
          :class="{ rotated: expandedButtons[1] }"
        />
      </template>
    </QBtn>
    <QSlideTransition>
      <div v-show="expandedButtons[1]">
        <div>
          <QBtn
            key="programs"
            :label="t('Programs')"
            icon="list"
            align="left"
            no-caps
            flat
            w-full
            mt-2
            @click="navigateTo(`/programs`)"
          />
        </div>
      </div>
    </QSlideTransition>
    <QSeparator class="flex-grow my-2" />
    <QBtn
      :label="t('Recipes')"
      size="20px"
      align="left"
      w-full
      flat
      no-caps
      @click="expandedButtons[2] = !expandedButtons[2]"
    >
      <template #default>
        <QIcon
          name="expand_more"
          size="24px"
          class="rotate-transition"
          :class="{ rotated: expandedButtons[2] }"
        />
      </template>
    </QBtn>
    <QSlideTransition>
      <div v-show="expandedButtons[2]">
        <div>
          <QBtn
            key="show_recipes"
            :label="t('BatchRecipes')"
            icon="list"
            align="left"
            no-caps
            flat
            w-full
            mt-2
            @click="navigateTo(`/recipes/batch`)"
          />
          <QBtn
            key="new_job_order"
            :label="t('NewBatchJobOrder')"
            icon="add"
            align="left"
            no-caps
            flat
            w-full
            mt-2
            @click="openNewBatchJobOrderDialog"
          />
        </div>
        <div v-show="false">
          <h3 class="text-center text-5">
            {{ t('ContinueRecipes') }}
          </h3>
          <QBtn
            key="show_recipes"
            :label="t('ShowContinueRecipes')"
            icon="arrow_right"
            align="left"
            no-caps
            flat
            w-full
            mt-2
            @click="navigateTo(`/recipes/continue`)"
          />
          <QBtn
            key="new_job_order"
            :label="t('NewContinueJobOrder')"
            icon="add"
            align="left"
            no-caps
            flat
            w-full
            mt-2
            @click="openNewContinueJobOrderDialog"
          />
        </div>
      </div>
    </QSlideTransition>
    <QSeparator class="flex-grow my-2" />
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

.rotate-transition {
  transition: transform 0.3s ease;
}

.rotated {
  transform: rotate(180deg);
}
</style>
