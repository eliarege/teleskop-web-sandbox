<script setup lang="ts">
import type { CommandType } from '~/shared/types'

interface commandTypeMap {
  ref: CommandType[]
  value: number
  title: string
}

const { t } = useI18n()

const commandTypeMaps = reactive<commandTypeMap[]>([
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
</script>

<template>
  <QCardSection class="inline-grid grid-cols-5 gap-3 ml-8">
    <div
      v-for="item in commandTypeMaps"
      :key="item.value"
      class="w-2xs box"
    >
      <h3>{{ item.title }}</h3>
      <draggable
        :list="item.ref"
        class="q-list q-list--bordered q-list--separator overflow-y-auto h-42"
        :options="{ group: 'group' }"
      >
        <template #item="{ element }">
          <QItem
            :key="element.commandNo"
            :data-command-no="element.commandNo"
            :data-command-name="element.commandName"
            class="draggable"
          >
            <QItemSection>
              {{ `${element.commandNo} ${element.commandName}` }}
            </QItemSection>
          </QItem>
        </template>
      </draggable>
    </div>
  </QCardSection>
</template>
