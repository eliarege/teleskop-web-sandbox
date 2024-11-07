<script setup lang="ts">
const editor = useEditorStore()
const { t } = useI18n()
const temperature = ref(editor.selectedCommand?.isTemperature)
const unload = ref(editor.selectedCommand?.isUnload)
</script>

<template>
  <q-tab-panel
    class="tab-panel-class"
    name="name"
  >
    <table>
      <tbody>
        <tr>
          <td>{{ t('command.graphic.x') }}</td>
          <td>{{ editor.selectedCommand?.x }}</td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.y') }}</td>
          <td>{{ editor.selectedCommand?.y }}</td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.a') }}</td>
          <td>{{ editor.selectedCommand?.a }}</td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.maxA') }}</td>
          <td>{{ editor.selectedCommand?.maxA }}</td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.b') }}</td>
          <td>{{ editor.selectedCommand?.b }}</td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.isTemperature') }}</td>
          <td>
            <q-checkbox
              v-model="temperature"
              disable
              dense
            />
          </td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.isUnload') }}</td>
          <td>
            <q-checkbox
              v-model="unload"
              disable
              dense
            />
          </td>
        </tr>
      </tbody>
    </table>
  </q-tab-panel>
</template>
