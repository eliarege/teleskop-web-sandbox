<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const { data: trends } = useFetch('/api/trends', {
  default: () => ({
    currentWeekElectricity: 0,
    currentWeekFM: 0,
    currentWeekSalt: 0,
    currentWeekSteam: 0,
    currentWeekTotalWater: 0,
    lastWeekElectricity: 0,
    lastWeekFM: 0,
    lastWeekSalt: 0,
    lastWeekTotalWater: 0,
    lastWeekSteam: 0,
  }),
})
const { t } = useI18n()
const store = useDataStore()
</script>

<template>
  <div class="flex items-center justify-center gap-15 w-full h-full">
    <ConsumptionItem
      v-if="store.electricity"
      :label="t('teleskop.consumption-electricity')"
      icon="ant-design:thunderbolt-twotone"
      unit="kWh"
      :previous-value="trends.lastWeekElectricity"
      :current-value="trends.currentWeekElectricity"
    />
    <ConsumptionItem
      v-if="store.water"
      :label="t('teleskop.consumption-water')"
      icon="ic:baseline-water-drop"
      unit="L"
      :previous-value="trends.lastWeekTotalWater"
      :current-value="trends.currentWeekTotalWater"
    />
    <ConsumptionItem
      v-if="store.salt"
      :label="t('teleskop.consumption-salt')"
      icon="tabler:salt"
      unit="L"
      :previous-value="trends.lastWeekSalt"
      :current-value="trends.currentWeekSalt"
    />
    <ConsumptionItem
      v-if="store.steam"
      :label="t('teleskop.consumption-steam')"
      icon="fluent:building-factory-48-regular"
      unit="kg"
      :previous-value="trends.lastWeekSteam"
      :current-value="trends.currentWeekSteam"
    />
  </div>
</template>

<style scoped lang="postcss">
</style>
