import { klona } from 'klona/lite'
import { isDef } from '@teleskop/utils'
import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import { useProgramWriteSettings } from './settings'
import type { CommandTypes, Machine, MachineCommand, MachineGroup, ParameterItem, ProcessType, Program, ProgramItem, ProgramStep, ProgramStepCommand, ProgramTableRow, StepError, StepIcon, TeleskopSettings, ioListItem } from '~/shared/types'
import { capitalize } from '~/shared/utils'
import { CommandEligibility, CommandIconMapping, MoveParallel, TeleskopSettingsIds, commandTypeMaps } from '~/shared/constants'

export type EditorStore = ReturnType<typeof useEditorStore>

export const useEditorStore = defineStore('editor', () => {
  const program = ref<Program>(createEmptyProgram())
  const originalProgram = ref<Program>(createEmptyProgram())
  const machine = ref<Machine>(createMachine())
  const selectedPrograms = ref<ProgramTableRow[]>([])
  const allProcessTypes = ref<ProcessType[]>([])
  const allPrograms = ref<ProgramTableRow[]>([])
  const selectedSteps = ref<ProgramStep[]>([])
  const isLoading = ref<boolean>(false)
  const popupVersionDialog = ref(false)
  const leftDrawerOpen = ref(true)
  const rightDrawerOpen = ref(false)
  let lastStepId = 0
  let lastCommandId = 0
  const allStepExpanded = ref<boolean>(false)
  const programErrors = ref<StepError[]>()

  const { $i18n } = useNuxtApp()
  const { t } = $i18n
  const route = useRoute()
  const errorIds = ref(new Set<string>())
  const { notifySuccess, notifyError } = useNotify()
  const kc = useKeycloak()

  const teleskopSettings = ref<TeleskopSettings>({
    initialTemperature: 25,
    selectedIcons: 0,
    treatmentSettings: {
      optimizedEnable: false,
      optimizedLimit: 10,
    },
  })

  /**
   * Teleskop ayarlarını alır ve teleskopSettings değişkenine atar.
   *
   * Bu fonksiyon, sunucudan teleskop ayarlarını almak için bir API çağrısı yapar ve
   * alınan ayarları `teleskopSettings` reaktif değişkenine atar.
   * API yanıtı alındıktan sonra, bu ayarlar bileşen içinde kullanılabilir hale gelir.
   *
   * @returns {Promise<void>} Promise döner ve asenkron bir işlem olduğunu belirtir.
   */
  async function fetchTeleskopSettings(): Promise<void> {
    teleskopSettings.value = await kc.fetch('/api/teleskop-settings', { method: 'GET' })
  }

  /**
   * Seçili makineyi değiştirir ve ilgili makine sayfasına yönlendirir.
   *
   * Bu fonksiyon, geçerli makineyi değiştirir ve yeni bir makine ID'si ile yönlendirme işlemi
   * gerçekleştirir. Eğer mevcut makine ID'si, parametre olarak verilen ID ile farklıysa,
   * mevcut makine sıfırlanır ve yeni bir makine nesnesi oluşturulur. Sayfada yönlendirme yapılırken
   * mevcut rota `/machine/:id` formatında ise, sayfa yeniden yüklenmeden yalnızca URL değiştirilir.
   *
   * @param {number} id - Değiştirilecek makinenin ID'si.
   *
   * @returns {Promise<void>} Promise döner ve asenkron bir işlem olduğunu belirtir.
   */
  async function changeMachine(id: number): Promise<void> {
    if (isLoading.value)
      return

    selectedPrograms.value = []
    selectedSteps.value = []

    const MACHINE_PATH_RE = /^\/machine\/\d+$/
    if (machine.value.id !== id) {
      machine.value = createMachine()
    }
    // Replace only if navigating from /machine/:id
    const replace = MACHINE_PATH_RE.test(route.path)

    await navigateTo({
      path: `/machine/${id}`,
      replace,
    })

    program.value = createEmptyProgram()
  }

  /**
   * Yeni bir boş adım oluşturur.
   *
   * Bu fonksiyon, bir `ProgramStep` nesnesi döndürür. Adım, benzersiz bir `stepId` değeri ile
   * başlatılır, ancak ana komut (`mainCommand`) boş bir komut nesnesi olarak atanır ve paralel komutlar
   * (`parallelCommands`) boş bir dizi olarak başlatılır.
   *
   * @returns {ProgramStep} Boş bir adım nesnesi.
   *
   * @description Bu fonksiyon, yeni bir boş adım (ProgramStep) oluşturur. Adımın `stepId` değeri artan
   * bir sayıya sahip olur, `mainCommand` ise boş bir komut nesnesi olur. Paralel komutlar listesi ise
   * boş bir dizi olarak başlatılır.
   */
  function createEmptyStep(): ProgramStep {
    return {
      stepId: lastStepId++,
      mainCommand: createEmptyCommand(),
      parallelCommands: [] as ProgramStepCommand[],
    }
  }

  /**
   * Yeni bir boş komut oluşturur.
   *
   * Bu fonksiyon, bir `ProgramStepCommand` nesnesi döndürür. Komut, benzersiz bir `commandId` değeri ile
   * başlatılır, ancak komut numarası (`commandNo`), parametreler (`parameters`) ve IO listesi (`ioList`) boş olur.
   *
   * @returns {ProgramStepCommand} Boş bir komut nesnesi.
   *
   * @description Bu fonksiyon, yeni bir adım komutu (ProgramStepCommand) oluşturur. Komutun `commandId`
   * değeri artan bir değere sahiptir, ancak `commandNo` ve parametre listeleri boş başlatılır. IO listesi de boş olur.
   */
  function createEmptyCommand(): ProgramStepCommand {
    return {
      commandId: lastCommandId++,
      commandNo: null!,
      parameters: [] as ParameterItem[],
      ioList: [] as ioListItem[],
    }
  }

  /**
   * Yeni bir adım ekler.
   *
   * Bu fonksiyon, yeni bir adım oluşturur, komut numarası verilmişse ilgili komutu kullanarak günceller.
   * Eğer komut paralel türde ise hata mesajı gösterir. Aksi takdirde yeni adımı belirtilen konuma ekler
   * ve paralel komutları kopyalar. Yeni adım eklendikten sonra sayfayı kaydırarak, yeni adımı görünür yapar.
   *
   * @param {number | undefined} commandNo - Kullanılacak komutun numarası. Eğer `undefined` ise boş bir adım ekler.
   * @param {number | undefined} stepIndex - Yeni adımın ekleneceği mevcut adımın indeksini belirtir.
   *
   * @returns {void}
   */
  function addStep(commandNo?: number, stepIndex?: number): void {
    const newStep = createEmptyStep()

    // Belirli bir komut numarası verilmişse, komut bilgilerini al ve kontrol et
    if (isDef(commandNo)) {
      const machineCommand = machine.value?.commands.get(commandNo)

      if (!isDef(machineCommand)) {
        return notifyError(t('error.machineCommandNotFound', { commandNo }))
      }

      // Komut tipi paralel ise hata ver
      if (machineCommand.commandType === CommandEligibility.PARALLEL_ONLY) {
        return notifyError(t('error.cannotMainCommand', { commandNo }))
      }

      // Komut bilgilerini güncelle
      updateCommand(commandNo, newStep.mainCommand)
    }

    const targetIndex = stepIndex ?? getStepIndex()

    // Paralel komutları kopyala (eğer varsa)
    if (program.value.steps[targetIndex]) {
      const parallelCommands = program.value.steps[targetIndex]?.parallelCommands || []
      const settings = useProgramWriteSettings()

      for (const command of parallelCommands) {
        const machineCommand = machine.value.commands.get(command.commandNo)

        if (!machineCommand)
          continue

        switch (machineCommand.moveParallel) {
          case MoveParallel.MOVE: {
            if (settings.value.addParallelCommandsFromPreviousStep) {
              newStep.parallelCommands.push(klona(command))
            }
            break
          }
          case MoveParallel.MOVE_UNTIL_DISABLED: {
            const dontUseList = machineCommand.dontUseList || []
            if (!dontUseList.includes(command.commandNo) && settings.value.addParallelCommandsFromPreviousStep) {
              newStep.parallelCommands.push(klona(command))
            }
            break
          }
          case MoveParallel.STOP:
            // TODO
            break
          default:
            console.warn(`Invalid moveParallel value: ${machineCommand.moveParallel}`)
            break
        }
      }
    }

    // Paralel komutların ID'sini güncelle
    lastCommandId = 0
    newStep.mainCommand.commandId = lastCommandId++
    newStep.parallelCommands.forEach(command => command.commandId = lastCommandId++)

    // Yeni adımı belirtilen konuma ekle
    program.value.steps.splice(targetIndex + 1, 0, newStep)

    // Seçim ve kaydırma işlemleri
    selectedSteps.value = [program.value.steps[targetIndex + 1]]
    nextTick(() => {
      scrollPage(targetIndex + 1, true)
    })
  }

  /**
   * Belirtilen veya seçilen adımın indeksini döndürür.
   *
   * Bu fonksiyon, opsiyonel olarak verilen bir `stepId` değerine göre programın adımlarında arama yapar
   * ve eşleşen adımın indeksini döndürür. Eğer `stepId` verilmemişse, seçilen adım (`selectedSteps`) kullanılır.
   * Hiçbir adım bulunamazsa, programdaki son adımın indeksini döndürür.
   *
   * @param {number} [stepId] - İsteğe bağlı olarak kontrol edilecek adım kimliği.
   * @returns {number} Adımın indeksini veya programdaki son adımın indeksini döndürür.
   */
  function getStepIndex(stepId?: number): number {
    const selectedStepId = stepId ?? selectedSteps.value[0]?.stepId
    const mainIndex = program.value.steps.findIndex(step => step.stepId === selectedStepId)
    const targetIndex = mainIndex >= 0 ? mainIndex : program.value.steps.length - 1

    return targetIndex
  }

  /**
   * Sayfada belirtilen adımın görünür olmasını sağlar ve isteğe bağlı olarak adımın genişletilmesini sağlar.
   *
   * Bu fonksiyon, belirtilen `stepIndex` ile adımın sayfadaki doğru konumda görünür olmasını sağlamak için
   * sayfayı kaydırır. Ayrıca, adımın genişletilmesi gerekiyorsa, genişleme butonuna tıklayarak adımın içeriğini açar.
   *
   * @param {number} stepIndex - Görünür yapmak istenen adımın indeksini belirtir.
   * @param {boolean} [isExpanded] - Eğer adımın genişletilmesi isteniyorsa `true` olmalıdır. Varsayılan değer `undefined` olup, genişletme işlemi yapılmaz.
   *
   * @returns {void}
   *
   * @description Bu fonksiyon, belirtilen adımın sayfadaki görünür olmasını sağlar ve gerektiğinde o adımın
   * genişletilmesini sağlar. Genişletilmek istenen adımda expand butonunu bulunur ve butona tıklanır.
   */
  function scrollPage(stepIndex: number, isExpanded?: boolean): void {
    const el = document.getElementById(`step-${stepIndex}`)
    if (!el)
      return

    setTimeout(() => {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    }, 100)

    const button = el.querySelector('.expand-btn') as HTMLElement | null
    if (!button)
      return

    const icon = button.querySelector('.material-icons')
    if (isExpanded && icon && icon.textContent === 'expand_more') {
      button.click()
    }
  }

  /**
   * Yeni bir paralel adım ekler.
   *
   * Bu fonksiyon, seçilen adımın paralel komutlar listesine yeni bir paralel komut ekler.
   * Eğer adım mevcut değilse, yeni bir paralel komut programın sonuna eklenir.
   *
   * Yeni paralel komut, `createEmptyCommand` fonksiyonu ile oluşturulur ve eklenir.
   * Ayrıca, ekleme işleminden sonra sayfa, yeni paralel komutun bulunduğu adımda kaydırılır.
   *
   * @returns {void}
   *
   * @description Bu fonksiyon, seçilen adımın paralel komutlar listesine yeni bir paralel komut ekler.
   * Eğer seçilen adım yoksa, paralel komut programın sonuna eklenir.
   */
  function newParallelStep(): void {
    const targetIndex = getStepIndex()

    // Eğer adım yoksa, işlem yapılmaz
    if (targetIndex < 0) {
      notifyError(t('error.mainStepNotFound'))
      return
    }

    const parallelCommands = program.value.steps[targetIndex].parallelCommands
    const emptyCommand = createEmptyCommand()
    emptyCommand.commandId = generateParallelStepId(targetIndex)
    parallelCommands.push(emptyCommand)

    nextTick(() => {
      scrollPage(targetIndex, true)
    })
  }

  /**
   * Yeni bir paralel adım komutu oluşturur ve belirtilen adımın paralel komutlar listesine ekler.
   *
   * Bu fonksiyon, `commandNo` kullanarak makine komutunu alır ve eğer komut bulunursa, yeni bir komut oluşturur.
   * Ardından, bu yeni komut, belirtilen `stepIndex`'teki adımın paralel komutlar listesine eklenir.
   *
   * Eğer makine komutu bulunamazsa, kullanıcıya bir hata mesajı gösterilir.
   *
   * @param {number} commandNo - Kullanılacak makine komutunun numarası.
   * @param {number} stepIndex - Paralel komutun ekleneceği adımın indeksi.
   *
   * @returns {void}
   *
   * @description Bu fonksiyon, belirtilen adımın paralel komutlar listesine yeni bir komut ekler.
   * Yeni komut, `createEmptyCommand` fonksiyonu ile oluşturulur ve `updateCommand` fonksiyonu ile güncellenir.
   */
  function newParallelStepCommand(commandNo: number, stepIndex: number): void {
    const machineCommand = machine.value?.commands.get(commandNo)
    if (!machineCommand) {
      return notifyError(t('error.machineCommandNotFound', { commandNo }))
    }

    const newCommand = createEmptyCommand()
    newCommand.commandId = generateParallelStepId(stepIndex)
    updateCommand(commandNo, newCommand)
    program.value?.steps[stepIndex].parallelCommands.push(newCommand)
  }

  /**
   * Parallel adımlar için komut id'si oluşturur.
   *
   * @param {number} stepIndex - Paralel adımın indeksi
   *
   * @returns {number} Oluşturulan id
   */
  function generateParallelStepId(stepIndex: number): number {
    const parallelCommands = program.value.steps[stepIndex].parallelCommands
    const existingIds = new Set(parallelCommands.map(command => command.commandId))
    return Array.from({ length: 100 }, (_, i) => i + 1).find(id => !existingIds.has(id))!
  }

  /**
   * Mevcut bir komutu, sağlanan komut numarasına göre günceller.
   *
   * Bu fonksiyon, `newCommandNo` kullanarak makine komutunu alır ve eğer bulunursa, verilen `command` parametresi
   * ile makine komutunun parametrelerini ve IO listesini günceller. Sadece düzenlenebilir veya formül kullanan parametreler
   * dahil edilir, seçilebilir IO'lar ise IO listesine eklenir.
   *
   * Eğer makine komutu bulunamazsa, kullanıcıya bir hata mesajı gösterilir.
   *
   * @param {number} newCommandNo - Makine komutunu almak için kullanılan yeni komut numarası.
   * @param {ProgramStepCommand} step - Güncellenmesi gereken program adımı komutu.
   *
   * @returns {void}
   *
   * @description Bu fonksiyon, verilen komutu, makinenin mevcut komutlarından alınan verilerle günceller.
   * Parametreler, yalnızca düzenlenebilir veya formül kullananlar ile güncellenir ve IO listesi, yalnızca seçilebilir
   * IO'larla doldurulur.
   */
  function updateCommand(newCommandNo: number, step: ProgramStepCommand): void {
    const machineCommand = machine.value.commands.get(newCommandNo)
    if (!machineCommand) {
      return notifyError(t('error.machineCommandNotFound', { commandNo: newCommandNo }))
    }

    step.commandNo = newCommandNo

    step.parameters = machineCommand.parameters
      .filter(parameter => parameter.editable || parameter.useFormula)
      .map(parameter => ({
        index: parameter.index,
        value: parameter.value,
        optimized: false,
      }))

    step.ioList = machineCommand.ioList
      .filter(io => io.selectable)
      .map(io => ({
        ioId: io.physicalId,
        ioIndex: io.index,
        value: io.selections
          .filter(selection => selection.defaultValue)
          .map(selection => [selection.type, selection.physicalId]),
      }))
  }

  /**
   * Program verilerini kaydeder. Yeni bir program ekler veya mevcut programı günceller.
   *
   * - Eğer `newProgram` parametresi sağlanırsa, yeni bir program eklenir.
   * - Eğer `newProgram` sağlanmazsa, mevcut program güncellenir.
   *
   * Eğer herhangi bir hata varsa, hatalı alan kullanıcıya bildirilir.
   *
   * @param {Program} [newProgram] - Yeni program verisi (isteğe bağlı).
   *
   * @returns {Promise<boolean>} Program kaydedildi mi? `true` veya `false` döner.
   *
   * @description Bu fonksiyon, önce program formunda herhangi bir hata olup olmadığını kontrol eder.
   * Eğer hata varsa, kullanıcıyı hatalı alana yönlendirir ve hata mesajı gösterir.
   * Eğer hata yoksa, yeni program eklenir veya mevcut program güncellenir. İşlem sonucunda başarılı
   * veya başarısız bildirimleri yapılır.
   */
  async function onSubmit(newProgram?: Program): Promise<boolean> {
    const firstId = errorIds.value.values().next().value
    if (firstId) {
      const stepId = firstId.split('-')[0]
      const stepIndex = getStepIndex(Number(stepId))

      scrollPage(Number(stepIndex), true)
      notifyError(t('saveProgram.incorrect'))
      return false
    } else {
      isLoading.value = true
      if (newProgram) {
        if (allPrograms.value.some(p => p.programNo === newProgram.programNo)) {
          notifyError(t('input.unique', { field: t('program.programNo') }))
          isLoading.value = false
          return false
        } else {
          if (await insertProgram(newProgram)) {
            originalProgram.value = newProgram
            notifySuccess(t('saveProgram.success'))
          } else {
            notifyError(t('saveProgram.fail'))
            isLoading.value = false
            return false
          }
        }
      } else {
        if (await updateProgram()) {
          originalProgram.value = klona(program.value)
          notifySuccess(t('saveProgram.success'))
        } else {
          notifyError(t('saveProgram.fail'))
          return false
        }
      }
      isLoading.value = false
      return true
    }
  }

  /**
   * Mevcut programda herhangi bir değişiklik olup olmadığını belirler.
   *
   * @returns {boolean} Programda değişiklik yapılmışsa `true`, yapılmamışsa `false` döner.
   *
   * @description
   * Bu fonksiyon, mevcut program (`program.value`) ve orijinal program (`originalProgram.value`)
   * arasında bir karşılaştırma yaparak değişiklik olup olmadığını kontrol eder. Eğer `program_no`
   * route parametresi eksikse `false` döner.
   * `compareProgram` fonksiyonu kullanılarak karşılaştırma yapılır.
   */
  function hasProgramChanged(): boolean {
    const route = useRoute()

    if (!isDef(route.params.program_no))
      return false

    return !compareProgram(program.value, originalProgram.value, true)
  }

  /**
   * Verilen makine ID'si ve program numarasına göre programı veritabanından siler.
   *
   * @param {number} machineId - Silinecek programın ait olduğu makinenin ID'si.
   * @param {number} programNo - Silinecek programın numarası.
   *
   * @returns {Promise<void>} Fonksiyon bir `Promise` döner ve işlemi tamamlar.
   *
   * @description Bu fonksiyon, belirtilen makine ID'si ve program numarasına göre,
   * ilgili programı API üzerinden siler. Program silme işlemi başarılı olduğunda
   * fonksiyon hiçbir değer döndürmez.
   */
  async function deleteProgram(machineId: number, programNo: number): Promise<void> {
    await kc.fetch(`/api/machine/${machineId}/program/${programNo}`, {
      method: 'DELETE',
      body: {
        programNo,
      },
    })
  }

  /**
   * Belirtilen adım indeksine göre adımı siler.
   * Eğer indeks belirtilmezse, seçili adımlar üzerinden silme işlemi yapılır.
   *
   * @param {number} [stepId] - (İsteğe bağlı) Silinecek adımın ID'sidir.
   *
   * @returns {void} Fonksiyon herhangi bir değer döndürmez.
   */
  function deleteStep(stepId?: number): void {
  // Tek bir adımı sil
    if (isDef(stepId)) {
      removeStepById(stepId)
    } else {
    // Seçili adımları sil (sondan başa doğru iterasyon)
      const stepsToDelete = [...selectedSteps.value]
      for (let i = stepsToDelete.length - 1; i >= 0; i--) {
        removeStepById(stepsToDelete[i].stepId)
      }
      selectedSteps.value = []
    }
  }

  /**
   * Belirtilen stepId'ye göre adımı ve ilgili hataları siler.
   *
   * @param {number} stepId - Silinecek adımın ID'sidir.
   */
  function removeStepById(stepId: number): void {
    const stepIndex = program.value.steps.findIndex(step => step.stepId === stepId)
    if (stepIndex === -1)
      return // Eğer adım bulunamazsa çık

    deleteError(stepId) // Hataları temizle
    nextTick(() => {
      program.value.steps.splice(stepIndex, 1)
    })
  }

  /**
   * Belirtilen adımın hatalarını siler.
   *
   * @param {number} stepId - Hataları silinecek adımın ID'si.
   */
  function deleteError(stepId: number): void {
    const step = program.value.steps.find(step => step.stepId === stepId)
    if (!isDef(step))
      return // Eğer adım bulunamazsa çık

    // Ana komut hatasını sil
    const errorId = `${step.stepId}-${step.mainCommand.commandId}`
    errorIds.value.delete(errorId)

    // Paralel komut hatalarını sil
    step.parallelCommands.forEach((command) => {
      errorIds.value.delete(`${step.stepId}-${command.commandId}`)
    })
  }

  /**
   * Belirtilen adım ve paralel komut indekslerine göre paralel adımı siler.
   *
   * @param {number} [stepIndex] - (İsteğe bağlı) Silinecek paralel adımın bulunduğu adımın indeksi.
   * @param {number} [parallelIndex] - (İsteğe bağlı) Silinecek paralel komutun indeksi.
   *
   * @returns {void} Fonksiyon herhangi bir değer döndürmez.
   *
   * @description Bu fonksiyon, bir adım ve paralel komut indeksine göre paralel komutları siler. Eğer indeksler belirtilmezse,
   * seçili adım ve paralel komut üzerinden işlem yapılır. Paralel komutlar silindikten sonra, seçilen paralel adımın
   * geçerli bir indekse sahip olması sağlanır.
   */
  function deleteParallelStep(stepIndex: number, parallelIndex: number): void {
    if (isDef(stepIndex) && isDef(parallelIndex)) {
      program.value.steps[stepIndex].parallelCommands.splice(parallelIndex, 1)
    }
  }

  /**
   * Belirtilen makine ID'si ve program numarasına göre program verisini getirir.
   *
   * @param {number} machineId - Programın ait olduğu makinenin ID'si.
   * @param {number} programNo - Getirilecek programın numarası.
   * @param {number} [version] - (İsteğe bağlı) Getirilecek programın versiyonu. Eğer sağlanmazsa en son sürüm getirilir.
   *
   * @returns {Promise<void>} Program verisi başarıyla getirildikten sonra `Promise` döner.
   *
   * @description Bu fonksiyon, belirtilen makine ID'si ve program numarasına göre program verilerini API'den çeker.
   * Programın versiyonu sağlanmışsa, belirtilen versiyon getirilir; aksi takdirde en son sürüm getirilir.
   * Veriler çekildikten sonra, programın her bir adımı (`step`) ve paralel komutları (`parallelCommands`) işlenir.
   * Her bir adım ve komut için benzersiz ID'ler atanır.
   */
  async function fetchProgram(machineId: number, programNo: number, version?: number): Promise<Program> {
    selectedSteps.value = []
    lastStepId = 0
    lastCommandId = 0

    if (isDef(version))
      program.value = await kc.fetch<Program>(`/api/machine/${machineId}/program/${programNo}/version/${version}`)
    else {
      const response = await kc.fetch<{ program: Program, programErrors: StepError[] }>(`/api/machine/${machineId}/program/${programNo}`)
      program.value = response.program
      programErrors.value = response.programErrors
      errorIds.value.clear()

      programErrors.value.forEach((step) => {
        step.commands.forEach((command) => {
          errorIds.value.add(`${step.stepId}-${command.commandId}`)
        })
      })
    }

    for (const step of program.value.steps) {
      step.stepId = lastStepId++
      step.mainCommand.commandId = lastCommandId++
      for (const command of step.parallelCommands) {
        command.commandId = lastCommandId++
      }
      lastCommandId = 0
    }

    originalProgram.value = klona(program.value)

    return program.value
  }

  /**
   * Belirtilen makine ID'sine göre makine verilerini getirir.
   *
   * @param {number} machineId - Getirilecek makinenin ID'si.
   *
   * @returns {Promise<void>} Makine verileri başarıyla getirildikten sonra `Promise` döner.
   *
   * @description Bu fonksiyon, API üzerinden belirtilen makine ID'sine sahip makine verilerini çeker.
   * Veriler, `Machine` ve `MachineCommand` türlerini içeren bir nesne olarak döner.
   * Elde edilen makine komutları, bir `Map` yapısına dönüştürülerek `machine` değişkenine atanır.
   */
  async function fetchMachine(machineId: number): Promise<void> {
    const machineData = await kc.fetch<Machine & { commands: MachineCommand[] }>(`/api/machine/${machineId}`)

    machine.value = {
      ...machineData,
      commands: new Map((machineData.commands).map(command => [command.commandNo, command])),
    }
  }

  /**
   * Tüm makineleri getirir.
   *
   * @returns {Promise<Machine[]>} Makineleri içeren bir `Promise` döner.
   *
   * @description Bu fonksiyon, API üzerinden tüm makineleri çeker ve bir dizi olarak döner.
   * Elde edilen makineler, `Machine` türünde nesneler içerir.
   */
  async function fetchAllMachine(): Promise<Machine[]> {
    return await kc.fetch('/api/machine')
  }

  /**
   * Makine gruplarını getirir.
   *
   * @returns {Promise<MachineGroup[]>} Makine gruplarını içeren bir `Promise` döner.
   *
   * @description Bu fonksiyon, API üzerinden makine gruplarını çeker ve bir dizi olarak döner.
   * Elde edilen makine grupları, `MachineGroup` türünde nesneler içerir.
   */
  async function fetchMachineGroup(): Promise<MachineGroup[]> {
    return await kc.fetch('/api/machine-group')
  }

  /**
   * Tüm programları getirir ve isteğe bağlı olarak filtreler uygular.
   *
   * @returns {Promise<void>} Programlar başarıyla getirildikten sonra `Promise` döner.
   *
   * @description Bu fonksiyon, API üzerinden tüm programları çeker. Eğer filtre parametreleri verilmişse, yalnızca verilen filtrelere uyan programlar getirilir.
   * Filtre parametreleri, program numarası (programNo), program adı (programName) ve işlem tipi (processType) gibi alanları içerebilir.
   * Filtre verilmediği takdirde tüm programlar getirilir ve `allPrograms` değişkenine atanır.
   */
  async function fetchAllPrograms(): Promise<void> {
    const filter = useProgramFilterStore()
    const query = filter.hasFilter()
      ? {
          programNo: filter.existingFilter.programNo,
          programName: filter.existingFilter.programName,
          processType: filter.existingFilter.processType?.value,
        }
      : undefined

    allPrograms.value = await kc.fetch<ProgramTableRow[]>(
      `/api/machine/${machine.value.id}/program`,
      { query },
    )
  }

  /**
   * Tüm işlem türlerini getirir ve her birine etiket (label) ekler.
   *
   * @returns {Promise<void>} İşlem türlerini başarıyla getirdikten sonra `Promise` döner.
   *
   * @description Bu fonksiyon, API üzerinden tüm işlem türlerini çeker ve her işlem türünün etiketini (label) `capitalize` fonksiyonu ile büyük harf yaparak günceller.
   * Güncellenmiş işlem türleri, `allProcessType` değişkenine atanır.
   */
  async function fetchAllProcessTypes(): Promise<void> {
    allProcessTypes.value = (await kc.fetch<ProcessType[]>('/api/process')).map(type => ({
      ...type,
      label: capitalize(type.label),
    }))
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
      tbbModel: '',
      commands: new Map<number, MachineCommand>(),
      batchParameters: [],
      commandFormulas: [],
      constants: [],
      treatmentParameters: [],
      commandTypes: [],
    }
  }

  /**
   * Yeni bir program nesnesi oluşturur ve başlangıç değerleriyle döner.
   *
   * @returns {Program} Yeni oluşturulmuş, varsayılan değerlerle doldurulmuş program nesnesi.
   *
   * @description Bu fonksiyon, yeni bir program nesnesi oluşturur ve içerisinde gerekli tüm alanları varsayılan değerlerle (örneğin: boş string, 0, `new Date()` vb.) başlatır.
   * Elde edilen program nesnesi, programla ilgili temel bilgileri tutacak şekilde yapılandırılmıştır.
   */
  function createEmptyProgram(): Program {
    return {
      name: '',
      icon: '',
      programNo: 0,
      duration: 0,
      author: '',
      comment: '',
      typeId: 0,
      typeName: '',
      machineId: 0,
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isChanged: false,
      tbbProgramChangedEvent: 0,
      prgState: 1,
      updatedAtTBB: null,
      totalChemReq: 0,
      totalDyeReq: 0,
      manChemReq: 0,
      autoChemReq: 0,
      autoDyeReq: 0,
      manDyeReq: 0,
    }
  }

  /**
   * Programı veritabanında günceller ve başarı durumuna göre `true` veya `false` döner.
   *
   * @returns {Promise<boolean>} Program güncelleme işleminin sonucunu belirten bir `Promise`.
   * Başarılı olursa `true`, hata durumunda `false` döner.
   *
   * @description Bu fonksiyon, mevcut programı belirtilen API'ye gönderir ve güncelleme işlemini yapar.
   * Özellikle `PROGRAM_TREATMENT_COMMAND_LIMIT` hatası durumunda, ilgili limitin aşıldığına dair bir bildirim gösterilir.
   * Eğer işlem sırasında bir hata oluşursa, hata mesajına göre uygun bir bildirim gösterilir ve `false` döner.
   */
  async function updateProgram(newProgram?: Program): Promise<boolean> {
    const updatedProgram = newProgram || program.value
    try {
      await kc.fetch(`/api/machine/${route.params.machine_id}/program`, {
        method: 'PUT',
        body: {
          program: updatedProgram,
        },
      })
      return true
    } catch (error: any) {
      if (error.statusCode === 400) {
        if (error.data.data.code === 'PROGRAM_TREATMENT_COMMAND_LIMIT') {
          notifyError(t('treatmentParameterLimitReached', {
            limit: error.data.data.detail.limit,
            commandNo: error.data.data.detail.commandNo,
          }))
        }
      }
      return false
    }
  }

  /**
   * Yeni bir program ekler ve başarı durumuna göre yönlendirme yapar.
   *
   * @param {Program} newProgram - Eklenecek yeni program.
   * @param {boolean} redirect - Ekleme sonrası kullanıcıyı programa yönlendirme yapılacaksa `true`, aksi halde `false`.
   *                             Varsayılan deger `true`.
   *
   * @returns {Promise<boolean>} Programın eklenip eklenmediğine dair bir `Promise`.
   * Eğer program başarılı bir şekilde eklenirse `true`, hata durumunda `false` döner.
   *
   * @description Bu fonksiyon, verilen programı belirtilen API'ye gönderir ve başarılı olursa kullanıcıyı yönlendirir.
   * Eğer işlem sırasında bir hata oluşursa, hata mesajına göre uygun bir bildirim gösterilir.
   * Özellikle `PROGRAM_TREATMENT_COMMAND_LIMIT` hatası durumunda, ilgili limitin aşıldığına dair bir bildirim gösterilir.
   */
  async function insertProgram(newProgram: Program, redirect: boolean = true): Promise<boolean> {
    try {
      await kc.fetch(`/api/machine/${newProgram.machineId}/program`, {
        method: 'POST',
        body: {
          program: newProgram,
        },
      })

      const hasChanged = hasProgramChanged()
      if (hasChanged)
        return false

      if (redirect)
        navigateTo(`/machine/${newProgram.machineId}/program/${newProgram.programNo}`)

      return true
    } catch (error: any) {
      if (error.statusCode === 400) {
        if (error.data.data.code === 'PROGRAM_TREATMENT_COMMAND_LIMIT') {
          notifyError(t('treatmentParameterLimitReached', {
            limit: error.data.detail.limit,
            commandNo: error.data.data.detail.commandNo,
          }))
        }
      }
      return false
    }
  }

  /**
   * Verilen adımı programın belirtilen indexine ekler.
   *
   * @param {Program} program - Eklenecek program.
   * @param {number} index - Adımın ekleneceği indeks.
   * @param {ProgramStep} step - Eklenecek yeni adım.
   *
   * @returns {void} Fonksiyon herhangi bir değer döndürmez.
   *
   * @description Bu fonksiyon, belirtilen programın adımlar listesine verilen indekste yeni bir adım ekler.
   * Adım eklenmeden önce, belirtilen indeksin geçerli olup olmadığı `assertIndex` fonksiyonu ile kontrol edilir.
   */
  function insertStep(program: Program, index: number, step: ProgramStep): void {
    assertIndex(index, program.steps.length + 1)
    program.steps.splice(index, 0, step)
  }

  /**
   * Programda adım seçme işlemini gerçekleştirir ve seçilen adımları günceller.
   *
   * Adım, `ctrl` tuşu ile çoklu seçim yapılabilmesini sağlar. Eğer `ctrl` tuşu basılıysa, adım daha önce seçilmişse seçim kaldırılır, seçilmemişse seçim yapılır.
   * Eğer `ctrl` tuşu basılı değilse, yalnızca bir adım seçilir.
   *
   * @param {boolean} ctrlKey - `ctrl` tuşu basılmış mı?.
   * @param {number} stepIndex - Seçilen adımın indexi.
   *
   * @returns {void} Fonksiyon herhangi bir değer döndürmez.
   *
   * @description Bu fonksiyon, verilen adım indeksine göre ilgili adımı seçer veya seçimden çıkarır. Seçilen adımlar `selectedSteps` dizisinde saklanır ve sıralanır.
   */
  function selectStep(ctrlKey: boolean, stepIndex: number): void {
    const stepId = program.value.steps[stepIndex].stepId

    if (ctrlKey && !isStepSelected(stepId)) {
      selectedSteps.value.push(program.value.steps.find(step => step.stepId === stepId)!)

      selectedSteps.value.sort((a, b) => {
        const indexA = program.value.steps.findIndex(x => x.stepId === a.stepId)
        const indexB = program.value.steps.findIndex(x => x.stepId === b.stepId)
        return indexA - indexB
      })
    } else if (ctrlKey && isStepSelected(stepId))
      selectedSteps.value = selectedSteps.value.filter(step => step.stepId !== stepId)
    else
      selectedSteps.value = [program.value.steps.find(step => step.stepId === stepId)!]
  }

  function isStepSelected(stepId: number): boolean {
    return selectedSteps.value.some(step => step && step.stepId === stepId)
  }

  /**
   * Verilen yol (path) üzerinden programın bir öğesini getirir.
   *
   * Yol yapısı şu şekildedir:
   * 1. Step index
   * 2. Main Komut (mainCommand), Parallel Komut (parallelCommands)
   * 3. Komut index (main ise 0)
   * 4. Parametre (parameters), IO (ioList)
   * 5. IO index
   * 6. IO value index
   *
   * @param {string} path - Elde edilmek istenen öğenin nokta ile ayrılmış yoludur.
   *
   * @returns {any} Yolun sonundaki öğe. Eğer yol geçersizse `undefined` döner.
   *
   * @description Bu fonksiyon, verilen yol (örneğin: `program.steps.step1`) üzerinden ilgili öğeyi arar ve bulur. Eğer yol geçersizse, `undefined` döner.
   */
  function getPathElement(path: string): any {
    const pathParts = path.split('.')
    let currentElement = program.value as any
    for (const part of pathParts) {
      if (isDef(currentElement)) {
        currentElement = currentElement[part]
      } else {
        return
      }
    }
    return currentElement
  }

  /**
   * Teleskop ayarlarını günceller ve API'ye gönderir.
   *
   * @param {TeleskopSettingsIds} id - Güncellenmek istenen ayarın ID'si.
   * @param {string} value - Ayar için yeni değer. Değer türüne bağlı olarak uygun şekilde işlenir.
   *
   * @returns {Promise<void>} Güncelleme işlemi tamamlandığında çözümlenen bir promise döner.
   *
   * @description Bu fonksiyon, verilen ayar kimliğine göre teleskop ayarlarını günceller ve yapılan değişikliği API'ye gönderir.
   */
  async function updateTeleskopSettings(id: TeleskopSettingsIds, value: string): Promise<void> {
    switch (id) {
      case TeleskopSettingsIds.OPTIMIZED_ENABLE:
        teleskopSettings.value.treatmentSettings.optimizedEnable = value === 'true'
        break
      case TeleskopSettingsIds.OPTIMIZED_LIMIT:
        teleskopSettings.value.treatmentSettings.optimizedLimit = Number(value)
        break
      case TeleskopSettingsIds.SELECTED_ICONS:
        teleskopSettings.value.selectedIcons = Number(value)
        break
      case TeleskopSettingsIds.INITIAL_TEMPERATURE:
        teleskopSettings.value.initialTemperature = Number(value)
        break
    }

    await kc.fetch('/api/teleskop-settings', {
      method: 'PUT',
      body: { id, value },
    })
  }

  /**
   * Verilen makine ID'sine göre makine komut tiplerini getirir.
   *
   * @param {number} machineId - Makine ID
   *
   * @returns {Promise<void>} - Komut tipleri başarıyla getirildiğinde çözümlenen bir promise döner.
   *
   * @description Bu fonksiyon, belirtilen makine ID'sine göre komut tiplerini getirir.
   */
  async function fetchCommandTypes(machineId: number): Promise<void> {
    machine.value.commandTypes = await kc.fetch<CommandTypes[]>(`/api/machine/${machineId}/command-types`)
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
  function getStepIcon(commandNo: number): StepIcon | undefined {
    if (!isDef(commandNo))
      return

    const machineCommand = machine.value.commands.get(commandNo)
    if (!machineCommand)
      return

    const machineCommandType = machine.value.commandTypes.find(commandType => commandType.commandNo === commandNo)
    if (!machineCommandType)
      return

    const commandType = commandTypeMaps.find(map => map.value === machineCommandType?.commandType)
    if (!commandType)
      return

    const iconSetting = teleskopSettings.value.selectedIcons
    const isSelected = (Number(iconSetting) & (1 << Number(commandType.index))) > 0

    if (!isSelected || !machineCommand)
      return

    return CommandIconMapping[machineCommand.icon]
  }

  function isTonello(): boolean {
    return machine.value.tbbModel === 'Tonello'
  }

  return {
    program,
    originalProgram,
    machine,
    selectedPrograms,
    selectedSteps,
    isLoading,
    errorIds,
    popupVersionDialog,
    allProcessTypes,
    allPrograms,
    lastStepId,
    lastCommandId,
    leftDrawerOpen,
    rightDrawerOpen,
    teleskopSettings,
    programErrors,
    createEmptyStep,
    createEmptyCommand,
    changeMachine,
    fetchProgram,
    fetchMachine,
    fetchAllMachine,
    fetchMachineGroup,
    fetchAllPrograms,
    createMachine,
    createEmptyProgram,
    updateProgram,
    onSubmit,
    insertProgram,
    insertStep,
    addStep,
    newParallelStep,
    newParallelStepCommand,
    updateCommand,
    deleteProgram,
    deleteStep,
    deleteParallelStep,
    selectStep,
    getPathElement,
    fetchAllProcessTypes,
    scrollPage,
    getStepIcon,
    fetchTeleskopSettings,
    updateTeleskopSettings,
    fetchCommandTypes,
    allStepExpanded,
    hasProgramChanged,
    isStepSelected,
    isTonello,
  }
})
