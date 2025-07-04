<script setup lang="ts">
const props = defineProps<{
  options: { label: string, value: number }[]
}>()

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const selectedOption = ref(props.options[0].value)
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card style="width: 500px" class="select-none">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('contextMenu.changeProcessTypeDialog.title') }}
          <q-space />
          <q-btn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </q-card-section>

      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.changeProcessTypeDialog.warning') }}</span>
      </q-card-section>

      <q-card-section>
        <div class="flex items-center justify-center">
          <q-select
            v-model="selectedOption"
            :options="options"
            class="w-1/2"
            map-options
            emit-value
            options-dense
            outlined
            dense
          />
        </div>
      </q-card-section>

      <q-card-actions
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
        align="right"
      >
        <q-btn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('apply')"
          class="q-mr-sm bg-primary text-white"
          flat
          @click="onDialogOK(selectedOption)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
