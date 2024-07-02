<script setup lang="ts">
import { determineTextColor } from '@teleskop/utils'
import type { MachineData } from '~/shared/types'

interface MachineCardProps {
  colors: {
    backGround: string
    activeBackGround: string
    idleBackGround: string
    itemBackGround: string
  }
  machine: MachineData
  isGroupVisible: boolean
  isScreenViable: boolean
  machineSort: number
  washing?: boolean
  linksActive?: boolean
}
withDefaults(defineProps<MachineCardProps>(), {
  washing: false,
})
</script>

<template>
  <div
    class="card-container"
    :style="{ background: colors.backGround, color: determineTextColor(colors.backGround) }"
  >
    <MachineCardTitle
      :colors
      :machine
      :is-group-visible
      :is-screen-viable
    />
    <MachineCardStatus :colors :machine />
    <MachineCardInfo
      :colors
      :machine
      :machine-sort
      :washing
    />
  </div>
</template>

<style lang="postcss">
  .card-container {
    border-radius: 20px;
    @apply flex flex-col e-border border-dark-900/10 w-full h-full;
    .icons {
      @apply w-7 h-7 p-3px;
    }
    .command-title {
      border-radius: 15px 15px 0 0;
      @apply h-5 flex flex-row-reverse justify-evenly px-3 text-center items-center;
    }
    .card-items {
      @apply flex flex-row-reverse justify-evenly text-center;
      .card-items__item {
        @apply e-border border-black w-full;
      }
    }
    .machine-info {
      grid-template-columns: repeat(3, minmax(100px, 1fr));
      grid-template-rows: 1fr;
      @apply relative grid w-full px-2 items-center justify-center content-center justify-items-stretch;
      .machine-icons {
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
        grid-template-rows: 1fr;
        @apply grid self-center justify-evenly gap-2px;
        :is(img) {
          @apply w-10 h-10;
        }
      }
      .thermometer {
        border-radius: 25px;
        @apply relative w-auto bg-black h-full max-w-25 max-h-35px flex  items-center justify-center text-2xl;
      }
    }

    .machine-commands {
      @apply relative flex flex-col gap-2px h-full justify-end mb-1 mx-1;
      .explanation {
        @apply ml-2 w-25 min-w-25;
      }
      .machine-commands_items {
        @apply w-full h-7 flex text-center items-center rounded-2xl overflow-hidden whitespace-nowrap text-white;
      }
    }
  }

.alarm {
  animation: alarm 10s ease-out infinite;
  transform: translate3d(0);
}
@keyframes alarm {
  0%,
  1%,
  2%,
  3%,
  4% {
    color: rgba(255, 255, 255, 0);
  }
  1.5%,
  2.5%,
  3.5%,
  4.5%,
  100% {
    color: rgba(255, 255, 255, 1);
  }
}
</style>
