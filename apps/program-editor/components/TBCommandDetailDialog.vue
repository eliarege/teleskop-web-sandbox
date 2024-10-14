<script setup lang="ts">
const editor = useEditorStore()
const { t } = useI18n()
const tab = ref('general')

if (editor.selectedSteps.length) {
  const firstCommandNo = editor.selectedSteps[0].mainCommand.commandNo!
  editor.selectedCommand = editor.machine.commands.get(firstCommandNo)!
} else {
  const firstCommand = editor.machine.commands.entries().next().value
  editor.selectedCommand = firstCommand[1]
}
</script>

<template>
  <div>
    <QCard>
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('menu.commandInfo') }}
          <q-space />
          <q-btn
            icon="close"
            flat
            round
            dense
            @click="editor.popupCommandDetailVisible = false"
          />
        </div>
        <div class="text-h8">
          {{ editor.machine.id }} - {{ editor.machine.name }}
        </div>
        <div class="text-h8">
          {{ editor.selectedCommand?.commandNo }} - {{ editor.selectedCommand?.name }}
        </div>
      </QCardSection>
      <QCardSection>
        <div class="w-250 min-h-135">
          <q-card>
            <q-tabs
              v-model="tab"
              dense
              active-color="primary"
              indicator-color="primary"
              align="justify"
              narrow-indicator
            >
              <q-tab name="general" :label="t('menu.general')" />
              <q-tab name="parameter" :label="t('menu.parameter')" />
              <q-tab name="io" :label="t('menu.io')" />
              <q-tab name="graphic" :label="t('menu.graphic')" />
              <q-tab name="formula" :label="t('menu.formula')" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab" animated>
              <q-tab-panel name="general">
                <LazyTBCommandTabGeneral />
              </q-tab-panel>

              <q-tab-panel name="parameter">
                <LazyTBCommandTabParameter />
              </q-tab-panel>

              <q-tab-panel name="io">
                <LazyTBCommandTabIO />
              </q-tab-panel>

              <q-tab-panel name="graphic">
                <LazyTBCommandTabGraphic />
              </q-tab-panel>

              <q-tab-panel name="formula">
                <LazyTBCommandTabFormula />
              </q-tab-panel>
            </q-tab-panels>
          </q-card>
        </div>
      </QCardSection>
      <q-separator />
      <QCardActions align="right">
        <QBtn
          :label="t('menu.close')"
          outline
          color="primary"
          icon="close"
          @click="editor.popupCommandDetailVisible = false"
        />
      </QCardActions>
    </QCard>
  </div>
</template>
