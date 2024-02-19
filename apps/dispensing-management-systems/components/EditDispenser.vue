<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import type { Dispenser, DispenserBrand, DispenserType, Protocol } from '~/shared/types'
import ipformat from '~/shared/utils'

const props = defineProps({
  dispenser: {
    type: Object as PropType<Dispenser>,
    required: true,
  },
})
const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const dispenser = toRef(props, 'dispenser')
const editedDispenser = ref({ ...dispenser.value })
const dispenserBrands = ref<DispenserBrand[]>([])
const dispenserTypes = ref<DispenserType[]>([])
const brandDispenserTypes = ref<DispenserType[]>([])
const protocols = ref<Protocol[]>([])
const brandProtocols = ref<Protocol[]>([])

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
}

async function onBrandSelected() {
  const dispenser = editedDispenser.value
  let typeValid = false
  brandDispenserTypes.value = dispenserTypes.value.filter((val) => {
    if (val.dispenserBrandId === dispenser.dispenserBrandId)
      typeValid = true
    return val.dispenserBrandId === dispenser.dispenserBrandId
  })

  if (!typeValid)
    editedDispenser.value.dispenserType = null
  let protocolValid = false
  brandProtocols.value = protocols.value.filter((val) => {
    if (val.dispenserBrandId === dispenser.dispenserBrandId)
      protocolValid = true
    return val.dispenserBrandId === dispenser.dispenserBrandId
  })
  if (!protocolValid)
    editedDispenser.value.protocol = ''
}
async function onSave() {
  if (dispenser.value)
    await $fetch(`/api/dispensers/${dispenser.value.dispenserId}`, { method: 'PUT', body: editedDispenser.value })
  else
    await $fetch(`/api/dispensers`, { method: 'POST', body: editedDispenser.value })
  onDialogOK(editedDispenser.value)
}

function onCancel() {
  onDialogCancel()
}

function onReset() {
  editedDispenser.value = { ...dispenser.value }
}

async function onDelete() {
  await $fetch(`/api/dispensers`, { method: 'DELETE', body: dispenser.value.dispenserId })
  onDialogOK(null)
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    @hide="onDialogHide"
  >
    <QCard>
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
                @new-value="onBrandSelected"
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
                option-label="protocol"
                :options="brandProtocols"
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
            <div class="row-item">
              <span class="item-label">
                {{ t('dispenserFields.IP') }}
              </span>
              <QInput
                v-model="editedDispenser.dispenserIP"
                class="item-input"
                dense
                type="text"
                filled
                :placeholder="editedDispenser.dispenserIP"
                :rules="[(val: string) => val !== null && val.match(ipformat) && val !== '' || '']"
              />
            </div>
          </div>
          <div class="flex-center justify-evenly p-10">
            <QBtn
              :label="t('Save')"
              color="primary"
              icon="save"
              @click="onSave"
            />
            <QBtn
              :label="t('Cancel')"
              color="warning"
              icon="cancel"
              @click="onCancel"
            />
            <QBtn
              :label="t('Reset')"
              color="info"
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
        </div>
      </QForm>
    </QCard>
  </QDialog>
</template>

<style scoped>
.row-item {
  gap: 2rem;
  margin: 1.25rem;
  width: 40rem;
}

.item-label {
  width: 6 rem;
}

.item-input {
  width: 27.5 rem;
}
</style>
