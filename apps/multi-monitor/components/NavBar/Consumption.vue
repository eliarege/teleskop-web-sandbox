<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const { data: trends } = useFetch('/api/trends', {
  default: () => ({
    currentWeekElectricity: 0,
    currentWeekFM: 0,
    currentWeekSalt: 0,
    currentWeekSteam: 0,
    currentWeekTotalWater: 0,
    currentWeekProduction: 0,
    lastWeekElectricity: 0,
    lastWeekFM: 0,
    lastWeekSalt: 0,
    lastWeekTotalWater: 0,
    lastWeekSteam: 0,
    lastWeekProduction: 0,
    currentPeriodStart: '',
    currentPeriodEnd: '',
    previousPeriodStart: '',
    previousPeriodEnd: '',
  }),
})

const { t } = useI18n()
const store = useDataStore()

const items = computed(() => [
  {
    key: 'electricity',
    label: t('teleskop.consumption-electricity'),
    icon: 'i-ant-design:thunderbolt-twotone',
    unit: 'kWh',
    visible: store.electricity,
    current: trends.value.currentWeekElectricity,
    previous: trends.value.lastWeekElectricity,
    currentPeriodStart: trends.value.currentPeriodStart,
    currentPeriodEnd: trends.value.currentPeriodEnd,
    previousPeriodStart: trends.value.previousPeriodStart,
    previousPeriodEnd: trends.value.previousPeriodEnd,
  },
  {
    key: 'water',
    label: t('teleskop.consumption-water'),
    icon: 'i-ic:baseline-water-drop',
    unit: 'L',
    visible: store.water,
    current: trends.value.currentWeekTotalWater,
    previous: trends.value.lastWeekTotalWater,
    currentPeriodStart: trends.value.currentPeriodStart,
    currentPeriodEnd: trends.value.currentPeriodEnd,
    previousPeriodStart: trends.value.previousPeriodStart,
    previousPeriodEnd: trends.value.previousPeriodEnd,
  },
  {
    key: 'salt',
    label: t('teleskop.consumption-salt'),
    icon: 'i-tabler:salt',
    unit: 'L',
    visible: store.salt,
    current: trends.value.currentWeekSalt,
    previous: trends.value.lastWeekSalt,
    currentPeriodStart: trends.value.currentPeriodStart,
    currentPeriodEnd: trends.value.currentPeriodEnd,
    previousPeriodStart: trends.value.previousPeriodStart,
    previousPeriodEnd: trends.value.previousPeriodEnd,
  },
  {
    key: 'steam',
    label: t('teleskop.consumption-steam'),
    icon: 'i-mdi:smoke',
    unit: 'kg',
    visible: store.steam,
    current: trends.value.currentWeekSteam,
    previous: trends.value.lastWeekSteam,
    currentPeriodStart: trends.value.currentPeriodStart,
    currentPeriodEnd: trends.value.currentPeriodEnd,
    previousPeriodStart: trends.value.previousPeriodStart,
    previousPeriodEnd: trends.value.previousPeriodEnd,
  },
  {
    key: 'production',
    label: t('teleskop.consumption-production'),
    icon: 'i-material-symbols:factory',
    unit: 'pcs',
    visible: store.production,
    current: trends.value.currentWeekProduction,
    previous: trends.value.lastWeekProduction,
    currentPeriodStart: trends.value.currentPeriodStart,
    currentPeriodEnd: trends.value.currentPeriodEnd,
    previousPeriodStart: trends.value.previousPeriodStart,
    previousPeriodEnd: trends.value.previousPeriodEnd,
  },
])
const visibleItems = computed(() =>
  items.value.filter(item => item.visible),
)
</script>

<template>
  <div class="lg:(flex items-center justify-center gap-15) md:(grid grid-cols-2 grid-rows-2 gap-4) <sm:(flex-center gap-3) text-center w-full">
    <NavBarConsumptionItem
      v-for="item in visibleItems"
      :key="item.key"
      :label="item.label"
      :icon="item.icon"
      :unit="item.unit"
      :previous-value="item.previous"
      :current-value="item.current"
      :current-period-start="item.currentPeriodStart"
      :current-period-end="item.currentPeriodEnd"
      :previous-period-start="item.previousPeriodStart"
      :previous-period-end="item.previousPeriodEnd"
    />
  </div>
</template>

<style scoped lang="postcss">
</style>
