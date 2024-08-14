<script setup lang="ts">
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { t } = useI18n()
const settings = ref(0)
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const commandTypeMaps = [
  { index: 0, ref: [], value: 100, title: t('chemIcons.chemicalRequestCommands') },
  { index: 1, ref: [], value: 101, title: t('chemIcons.manualChemicalRequestCommands') },
  { index: 2, ref: [], value: 200, title: t('chemIcons.paintRequestCommands') },
  { index: 3, ref: [], value: 201, title: t('chemIcons.manualPaintRequestCommands') },
  { index: 4, ref: [], value: 300, title: t('chemIcons.chemicalTankTransferCommands') },
  { index: 5, ref: [], value: 400, title: t('chemIcons.paintTankTransferCommands') },
  { index: 6, ref: [], value: 500, title: t('chemIcons.reserveTankTransferCommands') },
  { index: 7, ref: [], value: 600, title: t('chemIcons.pHControl') },
  { index: 8, ref: [], value: 700, title: t('chemIcons.takeSample') },
  { index: 9, ref: [], value: 800, title: t('chemIcons.saltRequestCommands') },
  { index: 10, ref: [], value: 810, title: t('chemIcons.genericMaterial1Request') },
  { index: 11, ref: [], value: 820, title: t('chemIcons.genericMaterial2Request') },
  { index: 12, ref: [], value: 1000, title: t('chemIcons.manualMeasurementCommands') },
]

onMounted(() => {
  fetchSettings()
})

async function fetchSettings() {
  // Number 12 for icon settings
  const { data } = await useAuthFetch<string>('/api/teleskop-settings', {
    method: 'GET',
    query: { id: 12 },
  })

  settings.value = Number(data.value)
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
        <div class="h-120 overflow-auto">
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
