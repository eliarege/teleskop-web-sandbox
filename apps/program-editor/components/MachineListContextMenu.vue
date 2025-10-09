<script setup lang="ts">
import type { TopbarMenuItem } from '@teleskop/nuxt-base'
import type { ProgramTableRow } from '~/shared/types'

const props = defineProps<{
  machineId: number
}>()

const { $commandManager } = useNuxtApp()
const { fetch } = useNuxtApp().$keycloak
const $q = useQuasar()
const { t } = useI18n()
const editor = useEditorStore()
const { notifySuccess, notifyError } = useNotify()

const items = computed(() => [[
  {
    label: t('machineContextMenu.uploadAllPrograms'),
    disabled: false,
    onClick: async () => {
      const programs = await fetch(`/api/machine/${props.machineId}/program`)
      $commandManager.executeCommand(
        'sendProgram',
        { $q, fetchPrograms: navigateTo(`/machine/${props.machineId}`) },
        programs,
        props.machineId!,
      )
    },
  },
  {
    label: t('machineContextMenu.downloadAllPrograms'),
    disabled: false,
    onClick: async () => {
      try {
        editor.isLoading = true

        const response = await fetch(`/api/machine/${props.machineId}/download-all-programs`, {
          method: 'POST',
        })

        if (response.success) {
          notifySuccess(t('machineContextMenu.downloadSuccess', { count: response.count }))

          // Sayfa yenilenerek güncel program listesi gösterilsin
          await editor.fetchAllPrograms()
        } else {
          // Backend'den gelen error mesajını direkt kullan
          throw new Error(response.message || 'Download failed')
        }
      } catch (error) {
        notifyError(t('machineContextMenu.downloadError', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      } finally {
        editor.isLoading = false
      }
    },
  },
  {
    label: t('machineContextMenu.copy'),
    disabled: false,
    onClick: async () => {
      const programs = await fetch<ProgramTableRow[]>(`/api/machine/${props.machineId}/program`)
      contextMenuStore.copy(props.machineId, programs)
    },
  },
  {
    label: t('machineContextMenu.paste'),
    disabled: !contextMenuStore.isThereCopiedValue.value,
    onClick: () => {
      $commandManager.executeCommand(
        'pasteProgram',
        { $q, fetchPrograms: () => {} },
        props.machineId,
      )
    },
  },
  {
    label: t('machineContextMenu.findChange'),
    disabled: true,
  },
  {
    label: t('machineContextMenu.compareAllPrograms'),
    disabled: true,
  },
]] as TopbarMenuItem[][])
</script>

<template>
  <TopbarMenuGroup v-slot="{ item }" :items="items">
    <TopbarMenuItem :item="item" />
  </TopbarMenuGroup>
</template>
