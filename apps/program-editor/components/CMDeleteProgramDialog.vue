<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  programNames: Array,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const { dark } = useQuasar()
const selectedOption = ref('db-machine')
const options = [
  { label: t('contextMenu.deleteProgramDialog.deleteFromBoth'), value: 'db-machine' },
  { label: t('contextMenu.deleteProgramDialog.deleteFromTeleskop'), value: 'db' },
  { label: t('contextMenu.deleteProgramDialog.deleteFromMachine'), value: 'machine' },
]
</script>

<template>
  <QDialog ref="dialogRef">
    <QCard>
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('contextMenu.deleteProgramDialog.title') }}
          <QSpace />
          <QBtn
            icon="close"
            flat
            round
            dense
            color="gray-6"
            @click="onDialogCancel"
          />
        </div>
      </QCardSection>

      <QCardSection>
        <span class="max-w-100"> {{ t('contextMenu.deleteProgramDialog.warning', { name: props.programNames }) }}</span>
        <div class="mt-4 ml-4 flex">
          <QOptionGroup
            v-model="selectedOption"
            class="q-gutter-sm"
            :options="options"
            dense
          />
        </div>
      </QCardSection>

      <QCardActions
        align="right"
        class="q-pa-md"
        :class="dark.isActive ? 'bg-dark-4' : 'bg-gray-1'"
      >
        <QBtn
          :label="t('cancel')"
          class="q-mr-sm"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          :label="t('delete')"
          class="q-mr-sm bg-red-6 text-white"
          icon="delete"
          flat
          @click="onDialogOK(selectedOption)"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
