import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import { isDef } from '@teleskop/utils'
import { commandTypeMaps } from '~/shared/constants'
import type { Machine, MachineCommand, MachineGroup, MachineInfo, StepIcon } from '~/shared/types'

export type MachineStatusStore = ReturnType<typeof useMachineStatusStore>

export const useMachineStatusStore = defineStore('machine-status', () => {
  const offlineMachines = ref<Set<number>>(new Set())
  const checkingMachines = ref<Set<number>>(new Set())
  const { notifySuccess, notifyError } = useNotify()
  const { t } = useI18n()

  function setOffline(machineId: number) {
    offlineMachines.value.add(machineId)
  }

  function setOnline(machineId: number) {
    offlineMachines.value.delete(machineId)
  }

  function isOffline(machineId: number): boolean {
    return offlineMachines.value.has(machineId)
  }

  function isChecking(machineId: number): boolean {
    return checkingMachines.value.has(machineId)
  }

  async function checkMachineStatus(
    machineId: number,
    machineName: string,
    options: {
      notifyOnSuccess?: boolean
      notifyOnError?: boolean
    } = {},
  ): Promise<boolean> {
    const { fetch } = useKeycloak()
    const { notifyOnSuccess = false, notifyOnError = true } = options

    checkingMachines.value.add(machineId)

    try {
      const status = await fetch(`/api/machine/${machineId}/status`)

      if (status) {
        setOnline(machineId)
        if (notifyOnSuccess) {
          notifySuccess(t('machine.isOnline', { machineName }))
        }
      } else {
        setOffline(machineId)
        if (notifyOnError) {
          notifyError(t('machine.isOffline', { machineName }))
        }
      }

      return status
    } catch (error) {
      setOffline(machineId)
      if (notifyOnError) {
        notifyError(t('machine.isOffline', { machineName }))
      }
      return false
    } finally {
      checkingMachines.value.delete(machineId)
    }
  }

  return {
    offlineMachines,
    checkingMachines,
    setOffline,
    setOnline,
    isOffline,
    isChecking,
    checkMachineStatus,
  }
})

export type MachineStore = ReturnType<typeof useMachineStore>

export const useMachineStore = defineStore('machine', () => {
  const machines = ref(new Map<number, Machine>())
  const currentMachine = ref<Machine>(createMachine())
  const machineGroups = ref<MachineGroup[]>([])
  const selectedMachines = ref<MachineInfo[]>([])

  const allMachines = computed(() => machineGroups.value.flatMap(group => group.machines))

  const isTonello = computed(() => currentMachine.value?.tbbModel === 'Tonello')

  const kc = useKeycloak()

  /**
   * Belirtilen makinenin mevcut olup olmadığını kontrol eder.
   *
   * @param {number} machineId - Kontrol edilecek makinenin ID'si.
   * @returns {boolean} Makine mevcut ise true, değilse false döner.
   */
  function hasMachine(machineId: number): boolean {
    return allMachines.value.find(machine => machine.id === machineId) !== undefined
  }

  /**
   * Belirtilen makinenin kullanılamaz (disabled) durumda olup olmadığını kontrol eder.
   *
   * @param {number} machineId - Kontrol edilecek makinenin ID'si.
   * @returns {boolean} Makine kullanılamaz ise true, kullanılabilir ise false döner.
   */
  function isMachineDisabled(machineId: number): boolean {
    return allMachines.value.find(machine => machine.id === machineId)?.disabled ?? false
  }

  /**
   * Yeni bir makine nesnesi oluşturur ve başlangıç değerleriyle döner.
   *
   * @returns {Machine} Yeni oluşturulmuş, varsayılan değerlerle doldurulmuş makine nesnesi.
   *
   * @description Bu fonksiyon, yeni bir makine nesnesi oluşturur ve içerisinde gerekli tüm alanları varsayılan değerlerle (örneğin: 0, boş string, yeni bir `Map` nesnesi vb.) başlatır.
   * Elde edilen makine nesnesi, makineyle ilgili temel bilgileri tutacak şekilde yapılandırılmıştır.
   */
  function createMachine(): Machine {
    return {
      id: 0,
      name: '',
      groupId: 0,
      tbbModel: 'T7700',
      commands: new Map<number, MachineCommand>(),
      batchParameters: [],
      commandFormulas: [],
      constants: [],
      treatmentParameters: [],
      commandTypes: [],
    }
  }

  /**
   * Belirtilen makine ID'sine göre makine verilerini getirir.
   *
   * @param {number} machineId - Getirilecek makinenin ID'si.
   *
   * @returns {Promise<Machine>} Makine verileri başarıyla getirildikten sonra `Promise` döner.
   *
   * @description Bu fonksiyon, API üzerinden belirtilen makine ID'sine sahip makine verilerini çeker.
   * Veriler, `Machine` ve `MachineCommand` türlerini içeren bir nesne olarak döner.
   * Elde edilen makine komutları, bir `Map` yapısına dönüştürülerek `machine` değişkenine atanır.
   */
  async function fetchMachine(machineId: number): Promise<Machine & { commands: Map<number, MachineCommand> }> {
    const machineData = await kc.fetch(`/api/machine/${machineId}`)

    return {
      ...machineData,
      commands: new Map((machineData.commands).map(command => [command.commandNo, command])),
    }
  }

  /**
   * Belirtilen makine ID'sine göre makine verilerini yükler.
   *
   * @param {number} machineId - Yüklenecek makinenin ID'si.
   *
   * @returns {Promise<void>} Makine verileri başarıyla yüklendikten sonra `Promise` döner.
   *
   * @description Bu fonksiyon, `fetchMachine` fonksiyonunu kullanarak belirtilen makine ID'sine sahip makine verilerini çeker ve `machine` değişkenine atar.
   */
  async function loadMachine(machineId: number): Promise<void> {
    const cached = machines.value.get(machineId)

    if (cached) {
      currentMachine.value = cached
      return
    }

    const machine = await fetchMachine(machineId)
    machines.value.set(machineId, machine)
    currentMachine.value = machine
  }

  /**
   * Makine gruplarını getirir.
   *
   * @returns {Promise<MachineGroup[]>} Makine gruplarını içeren bir `Promise` döner.
   *
   * @description Bu fonksiyon, API üzerinden makine gruplarını çeker ve bir dizi olarak döner.
   * Elde edilen makine grupları, `MachineGroup` türünde nesneler içerir.
   */
  async function fetchMachineGroups(): Promise<void> {
    machineGroups.value = await kc.fetch<MachineGroup[]>('/api/machine-group')
  }

  /**
   * Verilen bir komut numarası ile ilişkili ikonu döndürür.
   *
   * @param {number} commandNo - İkonun alınacağı komut numarası.
   *
   * @returns {StepIcon | undefined} Komutla ilişkili ikon veya eğer ikon bulunamazsa ya da seçim koşulları sağlanmazsa `undefined`.
   *
   * @description Bu fonksiyon, bir komut numarasının tanımlı olup olmadığını kontrol eder ve ilgili komutu ve komut tipini alır.
   * Ardından, komut tipinin bilinen bir eşlemeyle uyumlu olup olmadığını ve `teleskopSettings` içindeki ikon ayarlarına göre
   * ikonun gösterilip gösterilmeyeceğini belirler. Tüm koşullar sağlanırsa, uygun `StepIcon` döner; aksi takdirde `undefined` döner.
   */
  function getCommandIcon(commandNo: number): StepIcon | undefined {
    const teleskopSettings = useTeleskopSettingsStore()

    if (!isDef(commandNo))
      return

    const machineCommand = currentMachine.value.commands.get(commandNo)
    if (!machineCommand)
      return

    const machineCommandType = currentMachine.value.commandTypes.find(commandType => commandType.commandNo === commandNo)
    if (!machineCommandType)
      return

    const commandType = commandTypeMaps.find(map => map.value === machineCommandType.commandType)
    if (!commandType)
      return

    const iconSetting = teleskopSettings.selectedIcons
    const isSelected = (Number(iconSetting) & (1 << Number(commandType.index))) > 0

    if (!isSelected)
      return

    return { name: commandType.icon, label: commandType.title, color: commandType.color }
  }

  /**
   * Seçili makineyi değiştirir ve ilgili makine sayfasına yönlendirir.
   *
   * @param {number} id - Değiştirilecek makinenin ID'si.
   * @returns {Promise<void>} Promise döner ve asenkron bir işlem olduğunu belirtir.
   */
  async function changeMachine(id: number): Promise<void> {
    const route = useRoute()
    const MACHINE_PATH_RE = /^\/machine\/\d+$/
    // Replace only if navigating from /machine/:id
    const replace = MACHINE_PATH_RE.test(route.path)

    await navigateTo({
      path: `/machine/${id}`,
      replace,
    })
  }

  /**
   * İlk kullanılabilir makineyi seçer ve o makineye yönlendirir.
   *
   * @returns {Promise<boolean>} Kullanılabilir makine bulunup seçildiyse true, bulunamadıysa false döner.
   */
  async function selectFirstUsableMachine(): Promise<boolean> {
    const firstUsableMachine = machineGroups.value
      .flatMap(group => group.machines)
      .find(machine => !machine.disabled)

    if (firstUsableMachine) {
      await changeMachine(firstUsableMachine.id)
      return true
    }

    return false
  }

  return {
    currentMachine,
    machines,
    machineGroups,
    selectedMachines,
    allMachines,
    isTonello,
    hasMachine,
    isMachineDisabled,
    fetchMachine,
    loadMachine,
    fetchMachineGroups,
    getCommandIcon,
    changeMachine,
    selectFirstUsableMachine,
  }
})
