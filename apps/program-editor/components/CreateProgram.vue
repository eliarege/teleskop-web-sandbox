<script setup lang="ts">
import { useEditorStore } from '~/composables/editor'

const { t } = useI18n()
const editor = useEditorStore()
</script>

<template>
  <QDialog
    v-model="editor.program"
    persistent
  >
    <QCard>
      <QCardSection>
        <div class="text-h6">
          {{ t('createProgram') }}
        </div>
      </QCardSection>

      <QCardSection class="q-pt-none">
        <QInput
          v-model="editor.program.name"
          :label="t('name')"
          autofocus
        />
      </QCardSection>

      <QCardActions align="right">
        <QBtn
          flat
          :label="t('cancel')"
        />
        <QBtn
          flat
          :label="t('create')"
          color="primary"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<style lang="postcss" scoped>
</style>
