<script setup lang="ts">
const props = defineProps({
  toEdit: {
    type: String as PropType<'machines' | 'materials'>,
    required: false,
    default: 'machines',
  },
  objectList: {
    type: Array as PropType<any[]>,
    required: true,
  },
  objectKey: {
    type: String,
    required: false,
    default: 'label',
  },
  objectValue: {
    type: String,
    required: false,
    default: 'value',
  },
  dispensers: {
    type: Array as PropType<any[]>,
    required: true,
  },
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const dispenser = []
const selectedObjects = ref([])
const selectedDispensers = ref([])

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('multiEditDialog._') }}</span>
      </q-card-section>
      <q-card-section class="px-8">
        <div class="flex">
          <span> {{ t('multiEditDialog.selectObjectsWantToChange', { type: t(`multiEditDialog.${toEdit}`) }) }}</span>
          <q-space />
          <span class="text-gray cursor-pointer underline" @click="selectedObjects = objectList">{{ t('selectAll') }}</span>
        </div>
        <q-select
          v-model="selectedObjects"
          :options="objectList"
          :option-label="objectKey"
          :option-value="objectValue"
          multiple
          dense
          outlined
          clearable
          use-chips
          class="mt-5 px-5 w-100 max-h-50 overflow-y-scroll"
        />
      </q-card-section>
      <q-card-section class="px-8">
        <span> {{ t('multiEditDialog.selectDispensers') }}</span>
        <q-option-group
          v-model="selectedDispensers"
          :options="dispensers"
          dense
          type="checkbox"
          class="mt-5 px-5 max-h-60 overflow-y-scroll"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          :label="t('cancel')"
          outline
          color="black"
          icon="close"
          @click="onDialogCancel"
        />
        <q-btn
          outline
          :label="t('replace')"
          :disable="!selectedObjects.length"
          @click="onDialogOK({ isReplace: true, selectedObjects, selectedDispensers })"
        />
        <q-btn
          outline
          :label="t('add')"
          :disable="!selectedObjects.length"
          @click="onDialogOK({ isReplace: false, selectedObjects, selectedDispensers })"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
