<script setup lang="ts">
import { commandTypeMaps } from '~/shared/constants'

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dark } = useQuasar()
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
    persistent
  >
    <q-card>
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('menu.appSettings') }}
          <q-space />
          <q-btn
            icon="close"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
        <div class="text-h8">
          {{ t('menu.editorIconSettings') }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="text-h8 w-100 mb-2">
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
      <q-separator />

      <q-card-actions align="right">
        <q-btn
          :label="t('apply')"
          outline
          color="primary"
          icon="check"
          @click="onDialogOK(selectedIcons)"
        />
        <q-btn
          :label="t('menu.close')"
          outline
          :color="dark.isActive ? 'grey-3' : 'grey-8'"
          icon="close"
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
