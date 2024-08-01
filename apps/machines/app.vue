<script setup lang="ts">
import '@formkit/themes/genesis'
import { breakpointsTailwind } from '@vueuse/core'
import type { TopbarMenuItem } from '@teleskop/nuxt-base'

const { t } = useI18n()

const tt = (key: string) => toRef(() => t(key))
const breakpoints = useBreakpoints(breakpointsTailwind)
const sm = breakpoints.greaterOrEqual('sm')

const items = [
  {
    label: tt('machine'),
    to: '/',
  },
  {
    label: tt('machineGroup'),
    subMenu: {
      items: [[
        {
          label: tt('change'),
          to: '/machine-group-definitions',
        },
      ]],
    },
  },
  {
    label: tt('settings'),
    subMenu: {
      items: [[
        {
          label: tt('machineSettings'),
          subMenu: {
            items: [[
              {
                label: tt('updateMachineSystemSettings'),
                to: '/update-machine-system-settings',
              },
              {
                label: tt('controllerOperators'),
                to: '/user-definitions',
              },
              {
                label: tt('machineAccessFails'),
                to: '/machine-access-fails',
              },
              {
                label: tt('controllerClosedTimes'),
                to: '/controller-closed-times',
              },
              {
                label: tt('commandTypeDefinitions'),
                to: '/command-type-definitions',
              },
              {
                label: tt('commandTypeParameters'),
                to: '/manual-reasons',
              },
              {
                label: tt('machineIdleReasons'),
                to: '/machine-stop-reasons',
              },
              {
                label: tt('machineFinishReasons'),
                to: '/machine-finish-reasons',
              },
              {
                label: tt('stepSkippingReasons'),
                to: '/step-skipping-reasons',
              },
              {
                label: tt('stepSkippingReasonCommands'),
                to: '/step-skipping-reason-commands',
              },
              {
                label: tt('smartRequestCommandDefinitions'),
                to: 'smart-request-command-definitions',
              },
              {
                label: tt('commandTimeoutReasons'),
                to: 'command-timeout-reasons',
              },
              {
                label: tt('otherMachines'),
                to: '/data-collection-devices',
              },
              {
                label: tt('operatorMessages'),
                to: '/operator-messages',
              },
            ]],
          },
        },
        {
          label: tt('tankSettings'),
          subMenu: {
            items: [[
              {
                label: tt('tankDefinition'),
                to: 'tank-definitions',
              },
              {
                label: tt('tankMaterialPairing'),
                to: '/tank-material-matching',
              },
              {
                label: tt('tankMaterialWaterLimitDefinitions'),
                to: '/tank-material-water-limit-definitions',
              },
            ]],
          },
        },
        {
          label: tt('integrationSettings'),
          subMenu: {
            items: [[
              {
                label: tt('erpParameterDefinitions'),
                to: '/erp-parameter-definitions',
              },
              {
                label: tt('startingParameterTypes'),
                to: '/starting-parameter-types',
              },
              {
                label: tt('recipeTypes'),
                to: '/recipe-types',
              },
              {
                label: tt('optimizationParameters'),
                to: '/optimization-parameters',
              },
            ]],
          },
        },
        {
          label: tt('consumptionSettings'),
          subMenu: {
            items: [[
              {
                label: tt('waterTypeDefinitions'),
                to: '/water-type-definitions',
              },
              {
                label: tt('consumptionCounterSelection'),
                to: '/consumption-counter-select',
              },
              {
                label: tt('theoreticalWaterConsumptions'),
                to: '/theoretical-water-consumptions',
              },
            ]],
          },
        },
        {
          label: tt('applicationSettings'),
          subMenu: {
            items: [[
              {
                label: tt('projectViewLanguage'),
              },
            ]],
          },
        },
      ]],
    },
  },
] as TopbarMenuItem[]

const itemsMobile = [
  [
    {
      label: tt('menu.home'),
      icon: 'home',
      to: '/',
    },
  ],
  items,
] as TopbarMenuItem[][]
</script>

<template>
  <QLayout view="hHh lpR fFf">
    <QHeader
      bordered
      class="bg-white text-black !dark:(bg-dark text-white) select-none"
    >
      <QToolbar class="min-h-unset">
        <template v-if="sm">
          <QToolbarTitle shrink>
            <NuxtLink to="/">
              <Icon
                name="IconEliar"
                size="2.5rem"
                class="p-1"
              />
            </NuxtLink>
          </QToolbarTitle>
          <TopbarButton
            v-for="(item, index) in items"
            :key="index"
            :label="item.subMenu ? unref(item.label) : ''"
            :disable="unref(item.disabled)"
          >
            <TopbarMenu
              v-if="item.subMenu"
              v-bind="item.subMenu"
            />
            <NuxtLink v-else :to="unref(item.to)">
              {{ unref(item.label) }}
            </NuxtLink>
          </TopbarButton>
        </template>
        <TopbarButton
          v-else
          icon="menu"
        >
          <TopbarMenu :items="itemsMobile" />
        </TopbarButton>
        <QSpace />
        <div class="space-x-1">
          <TopbarAppGrid />
          <TopbarAuthenticatedUser />
          <TopbarUnauthenticatedUser />
          <TopbarLoginButton />
        </div>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <slot>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </slot>
    </QPageContainer>
  </QLayout>
</template>

<style>
input.formkit-input[type="number"]::-webkit-inner-spin-button,
input.formkit-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input.formkit-input[type="number"] {
  -moz-appearance: textfield; /* Firefox */
  appearance: textfield; /* Standard */
}

[data-type="checkbox"].formkit-outer {
  display: grid;
  align-self: center;
}
</style>
