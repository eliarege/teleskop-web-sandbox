<script setup lang="ts">
import { commandTypeMaps } from '~/shared/constants'

defineEmits([
  ...useDialogPluginComponent.emits,
])
const { t } = useI18n()
const settings = ref(0)
const fullSelect = 8191
const selectAll = ref(false)
const editor = useEditorStore()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

settings.value = Number(editor.teleskopSettings?.find(s => s.id === 12)?.value)

function toggleSelectAll() {
  selectAll.value = !selectAll.value
  settings.value = selectAll.value ? fullSelect : 0
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
        <div class="h-120 overflow-auto border-2 rounded-md  border-solid pl-3">
          <div
            v-for="commandType in commandTypeMaps"
            :key="commandType.index"
          >
            <ChemIconCheckbox
              v-model="settings"
              :command-index="commandType.index"
              :label="commandType.title"
            />
          </div>
        </div>
        <div>
          <q-checkbox
            :model-value="selectAll ? true : settings === fullSelect"
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
          @click="onDialogOK(settings)"
        />
        <q-btn
          :label="t('menu.close')"
          outline
          color="black"
          icon="close"
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
