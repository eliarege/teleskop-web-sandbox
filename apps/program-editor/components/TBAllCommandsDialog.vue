<script setup lang="ts">
import type { MachineCommand } from '~/shared/types'

const { t } = useI18n()
const editor = useEditorStore()

function selectCommand(command: MachineCommand) {
  editor.selectedCommand = command
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="text-h6 flex">
        {{ t('menu.commandList') }}
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          @click="editor.popupCommandListVisible = false"
        />
      </div>
      <div class="text-h8">
        {{ editor.machine.id }} - {{ editor.machine.name }}
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <div class="w-100 h-140 overflow-auto">
        <q-list
          dense
        >
          <q-item
            v-for="command in editor.machine.commands"
            :key="command[0]"
            v-ripple
            clickable
            :class="{ 'selected-item': editor.selectedCommand?.commandNo === command[0] }"
            @click="selectCommand(command[1])"
            @dblclick="editor.popupCommandDetailVisible = true"
          >
            <q-item-section>
              {{ command[1].commandNo }} - {{ command[1].name }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card-section>
    <q-separator />

    <q-card-actions align="right">
      <q-btn
        :label="t('menu.show')"
        outline
        color="primary"
        icon="open_in_new"
        @click="editor.popupCommandDetailVisible = true"
      />
      <q-btn
        :label="t('menu.close')"
        outline
        color="black"
        icon="close"
        @click="editor.popupCommandListVisible = false"
      />
    </q-card-actions>
  </q-card>
</template>

<style lang="postcss" scoped>
.selected-item {
  @apply bg-blue-3 text-black;
  @apply dark:bg-blue text-black;
}
</style>
