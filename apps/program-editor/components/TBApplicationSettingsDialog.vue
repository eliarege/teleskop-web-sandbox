<script setup lang="ts">
import { commandTypeMaps } from '~/shared/constants'

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const editor = useEditorStore()
const selectedIcons = ref(editor.teleskopSettings.selectedIcons)
const fullSelect = Number.parseInt('1'.repeat(commandTypeMaps.length), 2)
const selectAll = ref(selectedIcons.value === fullSelect)
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

function toggleSelectAll() {
  selectAll.value = !selectAll.value
  selectedIcons.value = selectAll.value ? fullSelect : 0
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
  >
    <q-card>
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('menu.appSettings') }}
          <q-space />
          <q-btn
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
        <div class="text-h8 color-gray-6 dark:text-gray-4">
          {{ t('menu.editorIconSettings') }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="text-h8 w-100 mb-2 color-gray-6 dark:text-gray-4">
          {{ t('menu.commandIcons') }}
        </div>
        <div class="h-120 overflow-auto border-2 rounded-md  border-solid pl-3 dark:border-dark-3">
          <div
            v-for="commandType in commandTypeMaps"
            :key="commandType.index"
          >
            <ChemIconCheckbox
              v-model="selectedIcons"
              :command-index="commandType.index"
              :label="commandType.title"
            />
          </div>
        </div>
        <div>
          <q-checkbox
            :model-value="selectedIcons === fullSelect"
            :label="selectAll ? t('dropAll') : t('selectAll')"
            @update:model-value="toggleSelectAll"
          />
        </div>
      </q-card-section>

      <QCardActions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <QBtn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('menu.close')"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          :label="t('apply')"
          class="bg-primary text-white"
          flat
          @click="onDialogOK(selectedIcons)"
        />
      </QCardActions>
    </q-card>
  </q-dialog>
</template>
