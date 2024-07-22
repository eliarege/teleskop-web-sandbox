<script setup lang="ts">
import type { CommandType } from '~/shared/types'

const props = defineProps({
  recipeName: {
    type: String,
  },
  programNo: {
    type: Number,
    required: true,
  },
})

const { dialogRef, onDialogHide } = useDialogPluginComponent()

interface commandTypeMap {
  ref: CommandType[]
  value: number
  title: string
}

const { t } = useI18n()

const commandTypeMaps = reactive<commandTypeMap[]>([
  { ref: [], value: -1, title: t('Other') },
  { ref: [], value: 100, title: t('commandTypes.ChemicalRequest') },
  { ref: [], value: 101, title: t('commandTypes.ManualChemicalRequest') },
  { ref: [], value: 200, title: t('commandTypes.PaintRequest') },
  { ref: [], value: 201, title: t('commandTypes.ManualPaintRequest') },
  { ref: [], value: 300, title: t('commandTypes.ChemicalTankTransfer') },
  { ref: [], value: 400, title: t('commandTypes.PaintTankTransfer') },
  { ref: [], value: 500, title: t('commandTypes.ReserveTankTransfer') },
  { ref: [], value: 600, title: t('commandTypes.PHControl') },
  { ref: [], value: 700, title: t('commandTypes.TakeSample') },
  { ref: [], value: 800, title: t('commandTypes.SaltRequest') },
  { ref: [], value: 810, title: t('commandTypes.GenericMaterial1Request') },
  { ref: [], value: 820, title: t('commandTypes.GenericMaterial2Request') },
  { ref: [], value: 1000, title: t('commandTypes.ManualMeasurement') },
])

getCommands()

async function getCommands() {
  await $fetch<CommandType[]>('/api/recipes/commands', {
    query: {
      progNo: props.programNo,
      // default machine_id
      machineId: 3,
    },
    onResponse: ({ response }) => {
      const data = response._data

      for (const cmd of commandTypeMaps) {
        cmd.ref = []
      }

      data.forEach((commandType: CommandType) => {
        const mapping = commandTypeMaps.find(m => m.value === commandType.commandType)
        if (mapping)
          mapping?.ref.push(commandType)
        else
        // Other
          commandTypeMaps.at(0)?.ref.push(commandType)
      })
    },
  })
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    @hide="onDialogHide"
  >
    <QCard flex flex-col>
      <div class="text-center pt-5 text-xl">
        <h2>{{ $props.recipeName }}</h2>
      </div>
      <QCardSection class="inline-grid grid-cols-5 gap-3 ml-8">
        <div
          v-for="item in commandTypeMaps"
          :key="item.value"
          class="w-2xs box"
        >
          <h3>{{ item.title }}</h3>
          <QList
            class="q-list q-list--bordered q-list--separator overflow-y-auto h-42"
          >
            <QItem
              v-for="(element) in item.ref"
              :key="element.commandNo"
            >
              <QItemSection>
                {{ `${element.commandNo} - ${element.commandName}` }}
              </QItemSection>
            </QItem>
          </QList>
        </div>
      </QCardSection>
    </QCard>
  </QDialog>
</template>
