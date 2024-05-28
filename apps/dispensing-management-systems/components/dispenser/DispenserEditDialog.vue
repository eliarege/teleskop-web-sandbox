<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import { useDataStore } from '~/store/DataStore'
import type { Dispenser, DispenserBrand, DispenserType, Protocol } from '~/shared/types'
import ipformat from '~/shared/utils'
import { useStateStore } from '~/store/State'

const props = defineProps({
  dispenser: {
    type: Object as PropType<Dispenser>,
  },
})
const { t } = useI18n()
const q = useQuasar()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { notifySuccess, notifyFail } = useNotify()
const dataStore = useDataStore()
const stateStore = useStateStore()
const dispenser = toRef(props, 'dispenser')
const defaultDispenser: Dispenser = {
  dispenserId: -1,
  dispenserName: '',
  dispenserIP: '',
  dispenserType: 1,
  dispenserBrandId: 1,
  dispenserBrandName: 'Eliar',
  vncUser: '',
  vncPassword: '',
  vncPort: 5900,
  protocol: '7',
  protocolFields: null,
  JDMConnections: [],
}
const editedDispenser = ref(JSON.parse(JSON.stringify(dispenser.value ? dispenser.value : defaultDispenser)))
const dispenserBrands = ref<DispenserBrand[]>([])
const dispenserTypes = ref<DispenserType[]>([])
const brandDispenserTypes = ref<DispenserType[]>([])
const protocols = ref<Protocol[]>([])
const brandProtocols = ref<Protocol[]>([])
const protocolFields = ref<string[]>([])
const passwordVisible = ref(false)

getDispenserBrands()
getDispenserTypes()
getProtocols()

async function getDispenserBrands() {
  dispenserBrands.value = await $fetch('/api/dispensers/brands')
}
async function getDispenserTypes() {
  dispenserTypes.value = await $fetch('/api/dispensers/types')
}
async function getProtocols() {
  protocols.value = await $fetch(`/api/protocols`)
  onBrandSelected()
  onProtocolSelected()
}

function onBrandSelected() {
  const dispenserVal = editedDispenser.value
  brandDispenserTypes.value = dispenserTypes.value.filter((val) => {
    return val.dispenserBrandId === dispenserVal.dispenserBrandId
  })
  if (dispenser.value && dispenserVal.dispenserBrandId === dispenser.value.dispenserBrandId)
    editedDispenser.value.dispenserType = dispenser.value.dispenserType
  else if (brandDispenserTypes.value.length > 0)
    editedDispenser.value.dispenserType = brandDispenserTypes.value[0].dispenserTypeId
  else
    editedDispenser.value.dispenserType = null

  brandProtocols.value = protocols.value.filter((val) => {
    return val.dispenserBrandId === dispenserVal.dispenserBrandId
  })
  if (dispenser.value && dispenserVal.dispenserBrandId === dispenser.value.dispenserBrandId) {
    editedDispenser.value.protocol = dispenser.value.protocol
    onProtocolSelected()
  } else if (brandProtocols.value.length > 0) {
    editedDispenser.value.protocol = brandProtocols.value[0].protocol
    onProtocolSelected()
  } else {
    editedDispenser.value.protocol = ''
    protocolFields.value = []
  }
}
function onProtocolSelected() {
  const selectedProtocol = brandProtocols.value.find(protocol => protocol.protocol === String(editedDispenser.value.protocol))
  protocolFields.value = selectedProtocol!.fields
  if (dispenser.value && editedDispenser.value.dispenserBrandId === dispenser.value.dispenserBrandId && editedDispenser.value.protocol === dispenser.value.protocol)
    editedDispenser.value.protocolFields = dispenser.value.protocolFields
  else {
    const emptyProtocolFields = Object.fromEntries(protocolFields.value.map((field: string) => [field, '']))
    editedDispenser.value.protocolFields = emptyProtocolFields
  }
}
async function onSave() {
  if (dispenser.value)
    await $fetch(`/api/dispensers/${dispenser.value.dispenserId}`, { method: 'PUT', body: editedDispenser.value })
  else
    await $fetch(`/api/dispensers`, { method: 'POST', body: editedDispenser.value })
  dataStore.refreshDispensers++
  onDialogOK(editedDispenser.value)
}

function onReset() {
  if (!dispenser.value) {
    brandDispenserTypes.value = []
    brandProtocols.value = []
    editedDispenser.value.protocolFields = null
  }
  editedDispenser.value = JSON.parse(JSON.stringify(dispenser.value ? dispenser.value : defaultDispenser))
  onBrandSelected()
  onProtocolSelected()
}
async function onDelete() {
  q.dialog({
    component: ConfirmationDialog,
    componentProps: {
      bodyText: t('confirmationDialogBody.DeleteDispenser'),
      confirmBtn: {
        label: t('Delete'),
        color: 'negative',
        icon: 'delete',
      },
      cancelBtn: {
        label: t('Cancel'),
        icon: 'close',
      },
    },
  }).onOk(async () => {
    await $fetch(`/api/dispensers`, { method: 'DELETE', body: { dispenserId: dispenser.value!.dispenserId } })
    dataStore.refreshDispensers++
    onDialogOK(null)
  })
}
async function pingAddress() {
  try {
    stateStore.isLoading = true
    await $fetch('/api/ping', { method: 'POST', body: { address: editedDispenser.value.dispenserIP }})
    notifySuccess(t('Success'))
  } catch (e) {
    console.error(e)
    notifyFail(t('Failed'))
  } finally {
    stateStore.isLoading = false
  }
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    persistent
    @hide="onDialogHide"
  >
    <QCard class="scroll border-b-solid border-10px border-grey">
      <QForm @submit.prevent>
        <div class="flex flex-col pb-10">
          <div class="text-center pt-5 text-xl">
            <h2>{{ t('Edit') }}</h2>
          </div>
          <div class="flex flex-row flex-wrap justify-center">
            <div v-if="dispenser" class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.ID') }}
              </span>
              <QInput
                v-model="editedDispenser.dispenserId"
                class="item-input"
                dense
                type="text"
                filled
                disable
                :placeholder="editedDispenser.dispenserId"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.Name') }}
              </span>
              <QInput
                v-model="editedDispenser.dispenserName"
                class="item-input"
                dense
                type="text"
                filled
                :placeholder="editedDispenser.dispenserName"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.IP') }}
              </span>
              <QInput
                v-model="editedDispenser.dispenserIP"
                class="item-input"
                dense
                hide-bottom-space
                type="text"
                filled
                :placeholder="editedDispenser.dispenserIP"
                :rules="[(val: string) => val !== null && val.match(ipformat) && val !== '' || '']"
              >
                <template #append>
                  <QBtn
                    round
                    dense
                    flat
                    icon="wifi"
                    @click="pingAddress" />
                </template>
              </QInput>
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.VncUser') }}
              </span>
              <QInput
                v-model="editedDispenser.vncUser"
                class="item-input"
                dense
                type="text"
                filled
                :placeholder="editedDispenser.vncUser"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.VncPort') }}
              </span>
              <QInput
                v-model.number="editedDispenser.vncPort"
                class="item-input"
                dense
                filled
                hide-bottom-space
                type="number"
                :rules="[(val: number) => val >= 0]"
                min="0"
                :placeholder="editedDispenser.vncPort"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.VncPassword') }}
              </span>
              <QInput
                v-model="editedDispenser.vncPassword"
                dense
                :type="passwordVisible ? 'text' : 'password'"
                filled
              >
                <template #append>
                  <QIcon
                    :name="passwordVisible ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="passwordVisible = !passwordVisible"
                  />
                </template>
              </QInput>
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.Brand') }}
              </span>
              <QSelect
                v-model="editedDispenser.dispenserBrandId"
                borderless
                dense
                class="item-input"
                filled
                emit-value
                map-options
                options-dense
                option-value="dispenserBrandId"
                option-label="dispenserBrandName"
                :options="dispenserBrands"
                @update:model-value="onBrandSelected"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.Type') }}
              </span>
              <QSelect
                v-model="editedDispenser.dispenserType"
                borderless
                dense
                class="item-input"
                filled
                emit-value
                map-options
                options-dense
                option-value="dispenserTypeId"
                option-label="dispenserTypeName"
                :options="brandDispenserTypes"
              />
            </div>
            <div v-if="editedDispenser.dispenserType === 5" class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.JDMConnections') }}
              </span>
              <QSelect
                v-model="editedDispenser.JDMConnections"
                dense
                filled
                multiple
                emit-value
                use-chips
                map-options
                options-dense
                option-value="dispenserTypeId"
                option-label="dispenserTypeName"
                :options="dataStore.dispenserTypes?.filter(dispenser => dispenser.dispenserTypeId !== 5)"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.Protocol') }}
              </span>
              <QSelect
                v-model="editedDispenser.protocol"
                borderless
                dense
                class="item-input"
                filled
                options-dense
                emit-value
                option-value="protocol"
                option-label="protocol"
                :options="brandProtocols"
                @update:model-value="onProtocolSelected"
              />
            </div>
            <div v-for="field in protocolFields" :key="field" class="row-item">
              <span class="item-label">{{ t(`protocolParameters.${field}`) }}</span>
              <QInput
                v-model="editedDispenser.protocolFields[field]"
                class="item-input"
                dense
                type="text"
                filled
                :placeholder="t(`protocolParameters.${field}`)"
              />
            </div>
          </div>
        </div>
        <div class="button-section">
          <QBtn
            :label="t('Save')"
            type="submit"
            color="primary"
            icon="save"
            @click="onSave"
          />
          <QBtn
            :label="t('Cancel')"
            color="warning"
            icon="cancel"
            @click="onDialogCancel"
          />
          <QBtn
            :label="t('Reset')"
            type="reset"
            icon="refresh"
            @click="onReset"
          />
          <QBtn
            v-if="dispenser"
            :label="t('Delete')"
            color="negative"
            icon="delete"
            @click="onDelete"
          />
        </div>
      </QForm>
    </QCard>
  </QDialog>
</template>

<style scoped>
.row-item {
  margin: 0.75rem;
  width: 40rem;
}

.item-label {
  width: 6 rem;
}

.item-input {
  width: 27.5 rem;
}
.content-section {
  flex-grow: 1;
  overflow-y: auto;
  max-height: calc(80vh - 150px);
}

.button-section {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-content: space-evenly;
  padding: 0.5rem;
  position: sticky;
  bottom: 0;
  z-index: 1;
  background-color: white;
  box-shadow: 0px -2px 5px rgba(0, 0, 0, 0.2);

}

.body--dark .button-section {
  background-color: var(--q-dark);
  box-shadow: 0px -1px 5px rgba(128, 128, 128, 0.2);
}
</style>
