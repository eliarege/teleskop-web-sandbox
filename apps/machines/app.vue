<script setup lang="ts">
import '@formkit/themes/genesis'

const { t } = useI18n()

const definitionItems = [
  {
    label: t('machine'),
    to: '/',
  },
  {
    label: t('machineGroup'),
    items: [
      {
        label: t('change'),
        to: '/machine-group-definitions',
      },
    ],
  },
  {
    label: t('settings'),
    items: [
      {
        label: t('machineSettings'),
        items: [
          {
            label: t('controllerOperators'),
            to: '/user-definitions',
          },
          {
            label: t('machineAccessFails'),
            to: '/machine-access-fails',
          },

          {
            label: t('controllerClosedTimes'),
            to: '/controller-closed-times',
          },

          {
            label: t('commandTypeDefinitions'),
            to: '/command-type-definitions',
          },

          {
            label: t('commandTypeParameters'),
            to: '/manual-reasons',
          },

          {
            label: t('machineIdleReasons'),
            to: '/machine-stop-reasons',
          },

          {
            label: t('machineFinishReasons'),
            to: '/machine-finish-reasons',
          },

          {
            label: t('stepSkippingReasons'),
            to: '/step-skipping-reasons',
          },
          {
            label: t('stepSkippingReasonCommands'),
            to: '/step-skipping-reason-commands',
          },

          {
            label: t('smartRequestCommandDefinitions'),
            to: 'smart-request-command-definitions',
          },

          {
            label: t('commandTimeoutReasons'),
            to: 'command-timeout-reasons',
          },

          {
            label: t('otherMachines'),
            to: '/data-collection-devices',
          },
          {
            label: t('operatorMessages'),
            to: '/operator-messages',
          },
        ],
      },
      {
        label: t('tankSettings'),
        items: [
          {
            label: t('tankDefinition'),
            to: 'tank-definitions',
          },
          {
            label: t('tankMaterialPairing'),
            to: '/tank-material-matching',
          },
          {
            label: t('tankMaterialWaterLimitDefinitions'),
            to: '/tank-material-water-limit-definitions',
          },
        ],
      },
      {
        label: t('integrationSettings'),
        items: [
          {
            label: t('erpParameterDefinitions'),
            to: '/erp-parameter-definitions',
          },
          {
            label: t('startingParameterTypes'),
            to: '/starting-parameter-types',
          },
          {
            label: t('recipeTypes'),
            to: '/recipe-types',
          },
          {
            label: t('optimizationParameters'),
            to: '/optimization-parameters',
          },
        ],
      },
      {
        label: t('consumptionSettings'),
        items: [
          {
            label: t('waterTypeDefinitions'),
            to: '/water-type-definitions',
          },
          {
            label: t('consumptionCounterSelection'),
            to: '/consumption-counter-select',
          },
          {
            label: t('theoreticalWaterConsumptions'),
            to: '/theoretical-water-consumptions',
          },
        ],
      },
      {
        label: t('applicationSettings'),
        items: [
          {
            label: t('teleskopSettings'),
            to: '/teleskop-settings',
          },
          {
            label: t('projectViewLanguage'),
          },
        ],
      },
      {
        label: t('notificationSettings'),
        items: [
          {
            label: t('emailNotificationSettings'),
            to: 'email-notification-settings',
          },
        ],
      },
    ],

  },

]
</script>

<template>
  <div>
    <NuxtLayout>
      <div class="relative">
        <div class="flex flex-row">
          <DropdownMenu
            v-for="(item, idx) in definitionItems"
            :key="idx"
            :model="item"
            strategy="fixed"
            placement="bottom"
            second-placement="right-start"
            class="z-10"
          >
            <template #default="{ item, depth, active }">
              <div
                v-if="depth === 0"
                class="cursor-pointer whitespace-nowrap select-none text-black text-center gap-1 hover:(bg-light-400 text-gray-800) rounded p-2 lg:px-3 xl:px-4  transition-all"
                @click="item.onClick"
              >
                {{ item.label }}
              </div>
              <div v-else class="w-full cursor-pointer bg-white text-black border px-3 py-2 flex items-center gap-3 justify-between whitespace-nowrap hover:(important-bg-light-400 important-text-gray-800)">
                {{ item.label }}
                <i v-if="item.items" class="fa fa-chevron-right" />
                <q-btn
                  v-if="item.items"
                  class="text-xs"
                  flat
                  no-caps
                  icon-right="chevron_right"
                />
              </div>
            </template>
          </DropdownMenu>
        </div>
        <NuxtPage />
      </div>
    </NuxtLayout>
  </div>
</template>
