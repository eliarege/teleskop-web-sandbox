<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '~/store/Datas'
import type { MachineData, Trends } from '~/shared/types'

const props = defineProps({
  formatted: String,
  machineData: {
    type: Array as PropType<MachineData[]>,
    required: true,
  },
})
const { t } = useI18n()
const store = useDataStore()
// layout
const layoutSide = ref('layoutContainerSide')
const layoutTop = ref('layoutContainerTop')

// trends
const { data: trendData } = await useFetch('/api/trends')

function textFormatter(text: number) {
  return Math.round(text)
    .toString()
    .replace(/(\d)(?=(\d{3})+$)/g, '$1' + '.')
}
const trends = computed(() => {
  if (!trendData.value) return []
  return trendData.value.map((trend) => {
    return {
      currentWeekElectricity: trend.currentWeekElectricity
        ? trend.currentWeekElectricity
        : 0,
      currentWeekFM: trend.currentWeekFM ? trend.currentWeekFM : 0,
      currentWeekSalt: trend.currentWeekSalt ? trend.currentWeekSalt : 0,
      currentWeekSteam: trend.currentWeekSteam ? trend.currentWeekSteam : 0,
      currentWeekTotalWater: trend.currentWeekTotalWater
        ? trend.currentWeekTotalWater
        : 0,
      lastWeekElectricity: trend.lastWeekElectricity
        ? trend.lastWeekElectricity
        : 0,
      lastWeekFM: trend.lastWeekFM ? trend.lastWeekFM : 0,
      lastWeekSalt: trend.lastWeekSalt ? trend.lastWeekSalt : 0,
      lastWeekTotalWater: trend.lastWeekTotalWater
        ? trend.lastWeekTotalWater
        : 0,
      lastWeekSteam: trend.lastWeekSteam ? trend.lastWeekSteam : 0,
    } as Trends
  })
})
const textGreen = 'text-green-500'
const textRed = 'text-red-500'
// pie charts
const passiveMachines = computed(
  () => props.machineData.filter(item => item.runningBatchStatus === 0).length,
)
const activeMachines = computed(
  () => props.machineData.length - passiveMachines.value,
)
const inUse = computed(() => {
  return props.machineData
    .map(machine => machine.runningMachineCapacity)
    .reduce((sum, val) => Math.round(sum) + Math.round(val), 0)
})
const inactive = computed(() => {
  return props.machineData
    .map(machine => machine.machineCapacity - machine.runningMachineCapacity)
    .reduce((sum, val) => Math.round(sum) + Math.round(val), 0)
})

const showSettings = ref(false)
const options = {
  cornerRadius: 0,
  startAngle: 0,
  padAngle: 0.1,
  innerRadius: 0.5,
  outerRadius: 10,
  endAngle: 10,
  width: 70,
  height: 70,
}
</script>

<template>
  <div :class="store.mode ? layoutTop : layoutSide">
    <div class="headerwrapper">
      <div class="header">
        <input
          id="menu-btn"
          class="menu-btn"
          type="checkbox"
        >
        <label class="menu-icon" for="menu-btn">
          <span class="navicon" />
        </label>
        <div class="menu">
          <div class="pie">
            <DPie
              v-bind="options"
              :color="['#54C32D', '#F52923']"
              :pie-data="[activeMachines, passiveMachines]"
            />
            <div class="pitem">
              <span> {{ t("teleskop.active") }}: {{ activeMachines }}</span>
              <span>{{ t("teleskop.idle") }}: {{ passiveMachines }}</span>
            </div>
          </div>
          <div class="pie">
            <DPie
              v-bind="options"
              :color="['#1DA7F1', '#8E0000']"
              :pie-data="[inUse, inactive]"
            />
            <div class="pitem">
              <span>{{ t("teleskop.in-use") }}: {{ inUse }} (KG)</span>
              <span>{{ t("teleskop.idle") }}: {{ inactive }} (KG)</span>
            </div>
          </div>
          <div class="date" :class="store.mode ? 'whitespace-nowrap' : ''">
            {{ formatted }}
          </div>
          <div class="items">
            <div v-if="store.electricity" class="icons">
              <QTooltip
                transition-show="scale"
                class="text-black e-border bg-white"
                :offset="[3, 3]"
              >
                {{ t("teleskop.consumption-electricity") }}
                {{ textFormatter(trends[0].lastWeekElectricity!) }}
              </QTooltip>
              <Icon
                icon="ant-design:thunderbolt-twotone"
                width="40"
                height="40"
                color="#2281ae"
              />
              <span
                :class="trends[0].currentWeekElectricity! > trends[0].lastWeekElectricity! ? textRed : textGreen "
              >
                {{ textFormatter(trends[0].currentWeekElectricity!) }} KWH
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
                {{ textFormatter(trends[0].lastWeekTotalWater!) }}
              </QTooltip>
              <Icon
                icon="ic:baseline-water-drop"
                color="#2281ae"
                width="40"
                height="40"
                :horizontal-flip="true"
              />
              <span
                :class="trends[0].currentWeekTotalWater! > trends[0].lastWeekTotalWater! ? textRed : textGreen "
              >
                {{ textFormatter(trends[0].currentWeekTotalWater!) }} L
              </span>
            </div>
            <div v-if="store.salt" class="icons">
              <QTooltip
                transition-show="scale"
                class="text-black e-border bg-white"
                :offset="[3, 3]"
              >
                {{ t("teleskop.consumption-salt") }}
                {{ textFormatter(trends[0].lastWeekSalt!) }}
              </QTooltip>
              <Icon
                icon="tabler:salt"
                color="#2281ae"
                width="40"
                height="40"
              />
              <span
                :class="trends[0].currentWeekSalt! > trends[0].lastWeekSalt! ? textRed : textGreen "
              >
                {{ textFormatter(trends[0].currentWeekSalt!) }} L
              </span>
            </div>
            <div v-if="store.steam" class="icons">
              <QTooltip
                transition-show="scale"
                class="text-black e-border bg-white"
                :offset="[3, 3]"
              >
                {{ t("teleskop.consumption-steam") }}
                {{ textFormatter(trends[0].lastWeekSteam!) }}
              </QTooltip>

              <Icon
                icon="fluent:building-factory-48-regular"
                width="40"
                height="40"
                color="#2281ae"
              />
              <span
                :class="trends[0].currentWeekSteam! > trends[0].lastWeekSteam! ? textRed : textGreen "
              >
                {{ textFormatter(trends[0].currentWeekSteam!) }} KG
              </span>
            </div>
          </div>
          <div class="settings">
            <NuxtLink to="/details" class="icons hover:cursor-pointer">
              <Icon
                icon="dashicons:list-view"
                color="#2281ae"
                width="30"
                height="30"
              />{{ t("teleskop.mode") }}
            </NuxtLink>
            <div
              class="icons hover:cursor-pointer"
              @click="showSettings = true"
            >
              <Icon
                icon="eva:settings-2-outline"
                color="#2281ae"
                width="30"
                height="30"
              />{{ t("teleskop.settings") }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Teleport to="body">
    <TheSettings v-show="showSettings" @close="showSettings = false" />
  </Teleport>
</template>

<style scoped lang="postcss">
@media screen and (min-width: 735px) {
  .menu-btn,
  .menu-icon {
    display: none;
  }
  .layoutContainerSide {
    user-select: none;
    top: 0px;
    gap: 3px;
    @apply w-full h-full;
    .headerwrapper {
      width: fit-content;
      padding: 0;
      @apply fixed left-0 top-0 flex flex-col font-bold w-full max-w-25 text-2xl h-full border border-gray-500 bg-light-50 text-black rounded shadow shadow-dark-900;
      .header {
        @apply w-full h-full;
        .menu {
          @apply pb-3 flex flex-col h-full content-evenly w-full;
          .pie {
            height: fit-content;
            @apply flex flex-col text-center items-center;
            .pitem {
              @apply flex flex-col  text-xs;
            }
          }
          .date {
            @apply flex text-center items-center justify-center m-1 text-base;
          }
          .items {
            @apply flex flex-col text-base justify-evenly h-full text-center text-lg;
            .icons {
              @apply flex flex-col justify-center items-center break-words;
            }
          }
          .settings {
            @apply flex flex-col;
            .icons {
              @apply flex flex-col justify-center text-center items-center p-5;
            }
            .icons:hover {
              @apply bg-gray-800 text-white;
            }
          }
        }
      }
    }
    .cardwrapper {
      @apply ml-37;
    }
  }
  .layoutContainerTop {
    user-select: none;
    overflow: hidden;
    @apply w-full h-full;
    .headerwrapper {
      @apply flex w-full h-20 font-400 font-bold bg-light-50 text-dark-900 rounded shadow shadow-dark-900 mb-1;
      .header {
        @apply flex w-full justify-between;
        .menu {
          @apply flex w-full;
          .pie {
            min-width: fit-content;
            @apply flex text-center items-center px-3 whitespace-nowrap;
            .pitem {
              @apply flex flex-col;
            }
          }
          .date {
            @apply flex text-center items-center justify-center m-1;
          }
          .items {
            width: fit-content;
            @apply grid grid-cols-4 w-full justify-center items-center;
            .icons {
              @apply flex justify-center items-center;
            }
          }
          .settings {
            @apply flex items-center h-full;
            .icons {
              @apply flex flex-col justify-center text-center items-center w-25 h-full;
            }
            .icons:hover {
              @apply bg-gray-800 text-white;
            }
          }
        }
      }
    }
  }
}
@media (min-width: 735px) and (max-width: 1350px) {
  .layoutContainerTop {
    .headerwrapper {
      .header {
        .menu {
          @apply gap-0 justify-between;
          .pie {
            @apply grid justify-center items-center place-items-center break-words;
          }
          .items {
            @apply grid grid-cols-4 p-3px w-full justify-between gap-8;
            .icons {
              @apply flex flex-col gap-1 justify-center;
            }
          }
          .date {
            @apply hidden text-center items-center justify-center text-shadow-lg shadow-none;
          }
        }
      }
    }
  }
}
@media screen and (max-width: 735px) {
  .layoutContainerSide,
  .layoutContainerTop {
    .headerwrapper {
      @apply text-black font-bold fixed flex w-full h-min top-0 right-0 z-10;
      .header {
        @apply w-full;
        .menu {
          @apply m-0 p-0 overflow-hidden bg-light-50 max-h-0 shadow shadow-dark-900;
          .pie {
            min-width: fit-content;
            @apply flex flex-row w-10 m-auto h-full text-center items-center justify-center mb-1;
            .pitem {
              @apply flex flex-col;
            }
          }
          .date {
            @apply flex text-center items-center justify-center m-1 text-shadow-sm text-sky-700;
          }
          .items {
            @apply grid grid-cols-2 grid-rows-2 w-full h-full items-center text-center justify-center border-r-black mb-1 gap-2;
            .icons {
              @apply flex text-center items-center justify-center;
            }
          }
          .settings {
            @apply flex items-center text-center justify-center border-r-black mb-1 mt-3 gap-2;
            .icons {
              @apply flex text-center items-center;
            }
          }
        }
        .menu-btn {
          @apply invisible fixed top-2 left-3px;
        }
        .menu-btn:checked {
          @apply fixed top-2 left-3px;
        }
        .menu-btn:checked ~ .menu {
          max-height: fit-content;
        }
        .menu-btn:checked ~ .menu-icon .navicon {
          background: transparent;
        }
        .menu-btn:checked ~ .menu-icon .navicon:before {
          transform: rotate(-45deg);
        }
        .menu-btn:checked ~ .menu-icon .navicon:after {
          transform: rotate(45deg);
        }
        .menu-btn:checked ~ .menu-icon:not(.steps) .navicon:before,
        .menu-btn:checked ~ .menu-icon:not(.steps) .navicon:after {
          top: 4px;
        }
        .menu-icon {
          .navicon {
            transition: background-color 0.2s ease-out;
            @apply bg-gray-600 block fixed top-3 left-2px w-18px h-2px;
          }
          .navicon:before,
          .navicon:after {
            content: "";
            transition: all 0.2s ease-out;
            @apply bg-gray-600 block absolute h-full w-full;
          }
          .navicon:before {
            top: 5px;
          }
          .navicon:after {
            top: -5px;
          }
        }
      }
    }
  }
}
</style>
