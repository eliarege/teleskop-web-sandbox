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

const textGreen = 'text-green-500'
const textRed = 'text-red-500'

function textFormatter(text: number) {
  return Math.round(text)
    .toString()
    .replace(/(\d)(?=(\d{3})+$)/g, '$1' + '.')
}
</script>

<template>
  <div class="flex items-center justify-center gap-15 w-full h-full">
    <div v-if="store.electricity" class="icons">
      <QTooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("teleskop.consumption-electricity") }}
        {{ textFormatter(trends.lastWeekElectricity) }}
      </QTooltip>
      <Icon
        name="ant-design:thunderbolt-twotone"
        size="40"
        color="#2281ae"
      />
      <span
        :class="trends.currentWeekElectricity > trends.lastWeekElectricity ? textRed : textGreen "
      >
        {{ textFormatter(trends.currentWeekElectricity) }} KWH
      </span>
    </div>
    <div
      v-if="store.water"
      id="water"
      class="icons"
    >
      <QTooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("teleskop.consumption-water") }}
        {{ textFormatter(trends.lastWeekTotalWater) }}
      </QTooltip>
      <Icon
        name="ic:baseline-water-drop"
        color="#2281ae"
        size="40"
        :horizontal-flip="true"
      />
      <span
        :class="trends.currentWeekTotalWater > trends.lastWeekTotalWater ? textRed : textGreen "
      >
        {{ textFormatter(trends.currentWeekTotalWater) }} L
      </span>
    </div>
    <div v-if="store.salt" class="icons">
      <QTooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("teleskop.consumption-salt") }}
        {{ textFormatter(trends.lastWeekSalt) }}
      </QTooltip>
      <Icon
        name="tabler:salt"
        size="40"
        color="#2281ae"
      />
      <span
        :class="trends.currentWeekSalt > trends.lastWeekSalt ? textRed : textGreen "
      >
        {{ textFormatter(trends.currentWeekSalt) }} L
      </span>
    </div>
    <div v-if="store.steam" class="icons">
      <QTooltip
        transition-show="scale"
        class="text-black e-border bg-white"
        :offset="[3, 3]"
      >
        {{ t("teleskop.consumption-steam") }}
        {{ textFormatter(trends.lastWeekSteam) }}
      </QTooltip>

      <Icon
        name="fluent:building-factory-48-regular"
        size="40"
        color="#2281ae"
      />
      <span
        :class="trends.currentWeekSteam > trends.lastWeekSteam ? textRed : textGreen "
      >
        {{ textFormatter(trends.currentWeekSteam) }} KG
      </span>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
