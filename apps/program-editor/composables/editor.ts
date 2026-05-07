import { klona } from 'klona/lite'
import { isDef } from '@teleskop/utils'
import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'
import { useProgramWriteSettings } from './settings'
import { areProgramsEqual, useErrorStore } from './utils'
import { capitalize } from '~/shared/utils'
import type { CommandError, CommandPath, CommandTypes, IoPath, MachineCommand, ParameterItem, ParameterPath, ProcessType, Program, ProgramStep, ProgramStepCommand, ProgramTableRow, ProgramWithErrors, StepError, StepPath, ioListItem } from '~/shared/types'
import { CommandEligibility, MoveParallel, ProgramStatus } from '~/shared/constants'

export type EditorStore = ReturnType<typeof useEditorStore>

export const useEditorStore = defineStore('editor', () => {
  const program = ref<Program>(createEmptyProgram())
  const originalProgram = ref<Program>(createEmptyProgram())

  const selectedPrograms = ref<ProgramTableRow[]>([])
  const allProcessTypes = ref<ProcessType[]>([])
  const allPrograms = ref<ProgramTableRow[]>([])
  const selectedSteps = ref<ProgramStep[]>([])
  const selectedParallelStep = ref<{ stepId: number, commandId: number } | null>(null)
  const isLoading = ref<boolean>(false)
  const leftDrawerOpen = ref(true)
  const rightDrawerOpen = ref(false)
  let lastStepId = 0
  let lastCommandId = 0

  const { $i18n } = useNuxtApp()
  const { t, locale, messages } = $i18n
  const route = useRoute()
  const kc = useKeycloak()
  const machine = useMachineStore()
  const errorIds = ref(new Set<string>())
  const { notifySuccess, notifyError, notifyWarning } = useNotify()

  /**
   * Belirtilen program numarasına sahip bir programın var olup olmadığını kontrol eder.
   *
   * @param {number} programNo - Kontrol edilecek program numarası.
   * @returns {boolean} Program mevcutsa `true`, değilse `false` döner.
   */
  function hasProgram(programNo: number): boolean {
    return allPrograms.value.find(p => p.programNo === programNo) !== undefined
  }

  /**
   * Programı sıfırlar ve boş bir program oluşturur.
   */
  function resetProgram(): void {
    program.value = createEmptyProgram()
    originalProgram.value = createEmptyProgram()
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
      commandId: lastCommandId,
      commandNo: null!,
      parameters: [] as ParameterItem[],
      ioList: [] as ioListItem[],
    }
  }

  /**
   * Yeni bir adım ekler. Steplerin sonuna veya seçili adımın yerine ekler ve bir önceki adımın paralel komutlarını kopyalar.
   *
   * @param {number | null} commandNo - Kullanılacak komutun numarası. Eğer `null` ise boş bir adım ekler.
   * @param {number} stepIndex - Yeni adımın ekleneceği mevcut adımın indeksini belirtir.
   * @returns {void}
   */
  function addStep(commandNo: number | null, stepIndex: number): void {
    const newStep = createEmptyStep()

    // Belirli bir komut numarası verilmişse, komut bilgilerini al ve kontrol et
    if (isDef(commandNo)) {
      const machineCommand = machine.currentMachine.commands.get(commandNo)

      if (!isDef(machineCommand)) {
        return notifyError(t('error.machineCommandNotFound', { commandNo }))
      }

      // Komut tipi paralel ise hata ver
      if (machineCommand.commandType === CommandEligibility.PARALLEL_ONLY) {
        return notifyError(t('error.cannotBeMainStep', { commandNo }))
      }

      // Komut bilgilerini tanıma göre güncelle
      updateStepCommandFromDefinition(machineCommand, newStep.mainCommand)
    }

    // Bir önceki adımın paralel komutlarını kopyala
    const previousIndex = stepIndex - 1
    if (previousIndex >= 0 && program.value.steps[previousIndex]) {
      const parallelCommands = program.value.steps[previousIndex]?.parallelCommands || []
      const settings = useProgramWriteSettings()

      for (const command of parallelCommands) {
        const machineCommand = machine.currentMachine.commands.get(command.commandNo)

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

    // Yeni adımı ekle
    program.value.steps.splice(stepIndex, 0, newStep)

    // Seçim ve kaydırma işlemleri
    const step = program.value.steps[stepIndex]
    selectedSteps.value = [step]
    nextTick(() => {
      scrollPage(step.stepId, true)
    })
  }

  /**
   * Yeni bir adım ekler ve programın sonuna ekler.
   *
   * @param {number | null} commandNo - Kullanılacak komutun numarası. Eğer `null` ise boş bir adım ekler.
   * @returns {void}
   */
  function addStepToEnd(commandNo: number | null): void {
    addStep(commandNo, program.value.steps.length)
  }

  function addStepBeforeSelection(commandNo: number | null): void {
    const stepIndex = selectedSteps.value.length
      ? getStepIndex(selectedSteps.value[0].stepId)
      : program.value.steps.length

    addStep(commandNo, stepIndex)
  }

  /**
   * Belirtilen veya seçilen adımın indeksini döndürür.
   *
   * @param {number} stepId - Aranacak adımın IDsini belirtir.
   * @returns {number} Adımın indeksini döndürür.
   */
  function getStepIndex(stepId: number): number {
    return program.value.steps.findIndex(step => step.stepId === stepId)
  }

  /**
   * Sayfada belirtilen adımın görünür olmasını sağlar ve isteğe bağlı olarak adımın genişletilmesini sağlar.
   *
   * Bu fonksiyon, belirtilen `stepIndex` ile adımın sayfadaki doğru konumda görünür olmasını sağlamak için
   * sayfayı kaydırır. Ayrıca, adımın genişletilmesi gerekiyorsa, genişleme butonuna tıklayarak adımın içeriğini açar.
   *
   * @param {number} stepId - Görünür yapmak istenen adımın idsini belirtir.
   * @param {boolean} [isExpanded] - Eğer adımın genişletilmesi isteniyorsa `true` olmalıdır. Varsayılan değer `undefined` olup, genişletme işlemi yapılmaz.
   *
   * @returns {void}
   *
   * @description Bu fonksiyon, belirtilen adımın sayfadaki görünür olmasını sağlar ve gerektiğinde o adımın
   * genişletilmesini sağlar. Genişletilmek istenen adımda expand butonunu bulunur ve butona tıklanır.
   */
  function scrollPage(stepId: number, isExpanded?: boolean): void {
    const el = document.getElementById(`step-${stepId}`)
    if (!el)
      return

    setTimeout(() => {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
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
    const stepIndex = selectedSteps.value.length
      ? getStepIndex(selectedSteps.value[0].stepId)
      : program.value.steps.length - 1

    const parallelCommands = program.value.steps[stepIndex].parallelCommands
    if (!parallelCommands) {
      notifyWarning(t('warning.mainStepNotFound'))
      return
    }

    const emptyCommand = createEmptyCommand()
    emptyCommand.commandId = generateParallelStepId(stepIndex)
    parallelCommands.push(emptyCommand)

    nextTick(() => {
      scrollPage(program.value.steps[stepIndex].stepId, true)
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
  function newParallelStepCommand(commandNo: number, stepIndex: number, position?: number): void {
    const machineCommand = machine.currentMachine.commands.get(commandNo)
    if (!machineCommand) {
      return notifyError(t('error.machineCommandNotFound', { commandNo }))
    }

    const newCommand = createEmptyCommand()
    newCommand.commandId = generateParallelStepId(stepIndex)
    updateStepCommandFromDefinition(machineCommand, newCommand)

    const parallelCommands = program.value?.steps[stepIndex].parallelCommands
    if (parallelCommands) {
      if (position !== undefined && position >= 0 && position < parallelCommands.length) {
        parallelCommands.splice(position, 0, newCommand)
      } else {
        parallelCommands.push(newCommand)
      }
    }
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
   * @param {MachineCommand} command - Makine komutunu almak için kullanılan yeni komut nesnesi.
   * @param {ProgramStepCommand} step - Güncellenmesi gereken program adımı komutu.
   *
   * @returns {void}
   *
   * @description Bu fonksiyon, verilen komutu, makinenin mevcut komutlarından alınan verilerle günceller.
   * Parametreler, yalnızca düzenlenebilir veya formül kullananlar ile güncellenir ve IO listesi, yalnızca seçilebilir
   * IO'larla doldurulur.
   */
  function updateStepCommandFromDefinition(command: MachineCommand, step: ProgramStepCommand): void {
    step.commandNo = command.commandNo

    step.parameters = command.parameters
      .filter(parameter => parameter.editable || parameter.useFormula)
      .map(parameter => ({
        index: parameter.index,
        value: parameter.value,
        optimized: false,
      }))

    step.ioList = command.ioList
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
  async function onSubmit(newProgram?: Program, isNewVersion?: boolean): Promise<boolean> {
    const firstId = errorIds.value.values().next().value
    if (firstId) {
      const stepId = Number(firstId.split('-')[0])

      scrollPage(stepId, true)
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
        if (await updateProgram(program.value, isNewVersion)) {
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
   * `areProgramsEqual` fonksiyonu kullanılarak karşılaştırma yapılır.
   */
  function hasProgramChanged(): boolean {
    const route = useRoute()

    if (!isDef(route.params.program_no))
      return false

    return !areProgramsEqual(program.value, originalProgram.value)
  }

  /**
   * Belirtilen adım id'ye göre adımı siler.
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
   * Belirtilen makine ID'si ve program numarasına göre program verisini backend'den çeker.
   *
   * @param {number} machineId - Programın ait olduğu makinenin ID'si.
   * @param {number} programNo - Getirilecek programın numarası.
   * @param {number} [version] - (İsteğe bağlı) Getirilecek programın versiyonu. Eğer sağlanmazsa en son sürüm getirilir.
   *
   * @returns {Promise<Program>} Program verisi döner.
   *
   * @description Bu fonksiyon, belirtilen makine ID'si ve program numarasına göre program verilerini API'den çeker.
   * Programın versiyonu sağlanmışsa, belirtilen versiyon getirilir; aksi takdirde en son sürüm getirilir.
   * Veriler çekildikten sonra, programın her bir adımı (`step`) ve paralel komutları (`parallelCommands`) işlenir.
   * Her bir adım ve komut için benzersiz ID'ler atanır. Bu fonksiyon sadece backend'den veriyi çeker,
   * `editor.program`'a atamaz. Program verilerini yüklemek için `loadProgram` fonksiyonunu kullanın.
   */
  async function fetchProgram(machineId: number, programNo: number, version?: number): Promise<Program> {
    const errorStore = useErrorStore()

    lastStepId = 0
    lastCommandId = 0

    let fetchedProgram: Program

    if (isDef(version)) {
      fetchedProgram = await kc.fetch<Program>(`/api/machine/${machineId}/program/${programNo}/version/${version}`)
      errorStore.clearErrors(programNo) // version’lı çağrıda hata listesi temizlenebilir
    } else {
      const response = await kc.fetch<ProgramWithErrors>(`/api/machine/${machineId}/program/${programNo}`)
      fetchedProgram = response.program
      errorStore.setErrors(machineId, programNo, response.programError.steps)

      errorIds.value.clear()
      response.programError.steps.forEach((step: StepError) => {
        step.commands.forEach((command: CommandError) => {
          errorIds.value.add(`${step.stepId}-${command.commandId}`)
        })
      })
    }

    for (const step of fetchedProgram.steps) {
      step.stepId = lastStepId++
      step.mainCommand.commandId = lastCommandId++
      for (const command of step.parallelCommands) {
        command.commandId = lastCommandId++
      }
      lastCommandId = 0
    }

    return fetchedProgram
  }

  /**
   * Belirtilen makine ID'si ve program numaralarına göre birden fazla program verisini backend'den çeker.
   *
   * @param {number} machineId - Programların ait olduğu makinenin ID'si.
   * @param {number[]} programNos - Getirilecek programların numaraları.
   *
   * @returns {Promise<Program[]>} Program verilerini içeren bir dizi döner.
   */
  async function fetchPrograms(machineId: number, programNos: number[]): Promise<Program[]> {
    const errorStore = useErrorStore()

    const response = await kc.fetch<ProgramWithErrors[]>(`/api/machine/${machineId}/programs`, {
      method: 'POST',
      body: { programNos },
    })

    const fetchedPrograms: Program[] = []

    for (const programWithError of response) {
      const { program, programError } = programWithError

      errorStore.setErrors(machineId, program.programNo, programError.steps)

      lastStepId = 0
      lastCommandId = 0

      for (const step of program.steps) {
        step.stepId = lastStepId++
        step.mainCommand.commandId = lastCommandId++
        for (const command of step.parallelCommands) {
          command.commandId = lastCommandId++
        }
        lastCommandId = 0
      }

      fetchedPrograms.push(program)
    }

    return fetchedPrograms
  }

  /**
   * Belirtilen makine ID'si ve program numarasına göre program verilerini yükler.
   *
   * @param {number} machineId - Programın ait olduğu makinenin ID'si.
   * @param {number} programNo - Getirilecek programın numarası.
   * @param {number} [version] - (İsteğe bağlı) Getirilecek programın versiyonu. Eğer sağlanmazsa en son sürüm getirilir.
   *
   * @returns {Promise<void>} Program verisi başarıyla yüklendikten sonra `Promise` döner.
   *
   * @description Bu fonksiyon, `fetchProgram` fonksiyonunu kullanarak program verilerini çeker ve `program` değişkenine atar.
   * Ayrıca seçili adımları temizler ve orijinal program kopyasını saklar.
   */
  async function loadProgram(machineId: number, programNo: number, version?: number): Promise<void> {
    selectedSteps.value = []
    program.value = await fetchProgram(machineId, programNo, version)
    originalProgram.value = klona(program.value)
  }

  /**
   * Tüm programları getirir.
   *
   * @returns {Promise<ProgramTableRow[]>} Programlar başarıyla getirildikten sonra `Promise` döner.
   *
   * @description Bu fonksiyon, API üzerinden tüm programları çeker ve döndürür.
   * Filtreleme işlemi frontend'de yapılır.
   */
  async function fetchAllPrograms(machineId: number): Promise<ProgramTableRow[]> {
    return await kc.fetch<ProgramTableRow[]>(
      `/api/machine/${machineId}/program`,
    )
  }

  /**
   * Tüm programları yeniler.
   *
   * @returns {Promise<void>} Programlar başarıyla yenilendikten sonra `Promise` döner.
   *
   * @description Bu fonksiyon, mevcut makinenin ID'sine göre tüm programları yeniden getirir ve `allPrograms` değişkenine atar.
   */
  async function refreshAllPrograms(): Promise<void> {
    allPrograms.value = await fetchAllPrograms(machine.currentMachine.id)
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
    allProcessTypes.value = (await kc.fetch<ProcessType[]>('/api/process')).map((type) => {
      const rawLabel = type.label
      const label = rawLabel.startsWith('#')
        ? t(`processTypes.${rawLabel.slice(1)}`)
        : capitalize(rawLabel)
      return { ...type, rawLabel, label }
    })
  }

  async function addProcessType(newType: ProcessType): Promise<void> {
    await kc.fetch<void>('/api/process', { method: 'POST', body: { processType: newType } })
    await fetchAllProcessTypes()
  }

  async function deleteProcessType(processCode: number): Promise<void> {
    await kc.fetch<void>(`/api/process`, { method: 'DELETE', body: { processCode } })
    await fetchAllProcessTypes()
  }

  async function updateProcessType(updatedType: ProcessType, originalProcessCode?: number): Promise<void> {
    await kc.fetch<void>('/api/process', { method: 'PUT', body: { processType: updatedType, originalProcessCode } })
    await fetchAllProcessTypes()
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
      stepCount: 0,
      author: '',
      comment: '',
      typeId: 0,
      additionalTypeId: 0,
      typeName: '',
      machineId: 0,
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isChanged: false,
      tbbProgramChangedEvent: 0,
      prgState: ProgramStatus.EXISTS_ONLY_ON_DATABASE,
      updatedAtTBB: null,
      totalChemReq: 0,
      totalDyeReq: 0,
      manChemReq: 0,
      autoChemReq: 0,
      autoDyeReq: 0,
      manDyeReq: 0,
      saltReq: 0,
      genericMat1Req: 0,
      genericMat2Req: 0,
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
  async function updateProgram(program: Program, isNewVersion: boolean = true): Promise<boolean> {
    try {
      return await kc.fetch<boolean>(`/api/machine/${route.params.machine_id}/program/${program.programNo}`, {
        method: 'PUT',
        body: {
          program,
          isNewVersion,
        },
      })
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
      await kc.fetch<{ success: boolean, error?: string }>(`/api/machine/${newProgram.machineId}/program`, {
        method: 'POST',
        body: {
          program: newProgram,
        },
      })

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
   * @param {number} stepId - Seçilen adımın id'si.
   * @param {number} [commandId] - Seçilen paralel komutun id'si (opsiyonel). Eğer belirtilmezse ana adım seçilir.
   *
   * @returns {void} Fonksiyon herhangi bir değer döndürmez.
   *
   * @description Bu fonksiyon, verilen adım indeksine göre ilgili adımı seçer veya seçimden çıkarır. Seçilen adımlar `selectedSteps` dizisinde saklanır ve sıralanır.
   * Eğer commandId belirtilirse paralel adım seçilir ve ana adım da otomatik olarak seçilir.
   */
  function selectStep(ctrlKey: boolean, stepId: number, commandId?: number): void {
    const step = program.value.steps.find(step => step.stepId === stepId)
    if (!step)
      return

    // Paralel adım seçimi
    if (isDef(commandId)) {
      // Paralel komutun var olduğunu kontrol et
      const parallelCommand = step.parallelCommands.find(cmd => cmd.commandId === commandId)
      if (!parallelCommand)
        return

      // Ana adımı seç (paralel adım seçildiğinde ana adım da seçili olmalı)
      selectedSteps.value = [step]
      // Paralel adımı seç
      selectedParallelStep.value = { stepId, commandId }
      focusCommandSelector(stepId)
      return
    }

    // Ana adım seçimi - paralel seçimi sıfırla
    selectedParallelStep.value = null

    if (ctrlKey && !isStepSelected(stepId)) {
      selectedSteps.value.push(step)

      selectedSteps.value.sort((a, b) => {
        const indexA = program.value.steps.findIndex(x => x.stepId === a.stepId)
        const indexB = program.value.steps.findIndex(x => x.stepId === b.stepId)
        return indexA - indexB
      })
    } else if (ctrlKey && isStepSelected(stepId)) {
      selectedSteps.value = selectedSteps.value.filter(step => step.stepId !== stepId)
    } else {
      selectedSteps.value = [step]
    }

    focusCommandSelector(stepId)
  }

  function focusCommandSelector(stepId: number): void {
    const isFocused = document.activeElement?.closest(`#step-${stepId}`)
    if (isFocused)
      return

    const selector = document.querySelector(`#step-${stepId} .command-selector`) as HTMLElement | null
    selector?.focus()
  }

  /**
   * Belirtilen adımın veya paralel adımın seçili olup olmadığını kontrol eder.
   *
   * @param {number} stepId - Kontrol edilecek adımın ID'si.
   * @param {number} [commandId] - Kontrol edilecek paralel komutun ID'si (opsiyonel).
   *
   * @returns {boolean} Adım seçili ise `true`, değilse `false` döner.
   */
  function isStepSelected(stepId: number, commandId?: number): boolean {
    if (!isDef(stepId))
      return false

    // Paralel adım kontrolü
    if (isDef(commandId)) {
      return selectedParallelStep.value !== null
        && selectedParallelStep.value.stepId === stepId
        && selectedParallelStep.value.commandId === commandId
    }

    // Ana adım kontrolü
    return selectedSteps.value.some(step => step && step.stepId === stepId)
  }

  /**
   * Verilen yolun sonundaki öğeyi geri döndürür.
   *
   * @param {StepPath | CommandPath | ParameterPath | IoPath} path - Yol nesnesi.
   *
   * @returns {ProgramStep | ProgramStepCommand | ParameterItem | ioListItem} Yolun sonundaki öğe.
   *
   * @description Bu fonksiyon, verilen yol nesnesi üzerinden ilgili öğeyi arar ve bulur.
   */
  function getPathElement(path: StepPath): ProgramStep
  function getPathElement(path: CommandPath): ProgramStepCommand
  function getPathElement(path: ParameterPath): ParameterItem
  function getPathElement(path: IoPath): ioListItem
  function getPathElement(path: StepPath | CommandPath | ParameterPath | IoPath): ProgramStep | ProgramStepCommand | ParameterItem | ioListItem {
    // Find the step
    const step = program.value.steps.find(s => s.stepId === path.stepId)
    if (!isDef(step)) {
      throw new Error(`Step with stepId ${path.stepId} not found`)
    }

    // If only stepId is present, return the step
    if (!('parallelIndex' in path)) {
      return step
    }

    // Get the command (main or parallel)
    const command = path.parallelIndex === -1
      ? step.mainCommand
      : step.parallelCommands[path.parallelIndex]

    if (!isDef(command)) {
      throw new Error(`Command at parallelIndex ${path.parallelIndex} not found`)
    }

    // If only stepId and parallelIndex are present, return the command
    if (!('parameterIndex' in path) && !('ioIndex' in path)) {
      return command
    }

    // Return parameter or io
    if ('parameterIndex' in path) {
      const parameter = command.parameters[path.parameterIndex]
      if (!isDef(parameter)) {
        throw new Error(`Parameter at index ${path.parameterIndex} not found`)
      }
      return parameter
    }

    if ('ioIndex' in path) {
      const io = command.ioList[path.ioIndex]
      if (!isDef(io)) {
        throw new Error(`IO at index ${path.ioIndex} not found`)
      }
      return io
    }

    throw new Error('Invalid path object')
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
    machine.currentMachine.commandTypes = await kc.fetch<CommandTypes[]>(`/api/machine/${machineId}/command-types`)
  }

  // Tüm adımların expanded olup olmadığını kontrol eden computed
  const allStepExpanded = computed(() => {
    return program.value.steps.length > 0 && program.value.steps.every(step => step.expanded === true)
  })

  // Tüm adımların expanded durumunu toggle et
  function toggleAllStepsExpanded(): void {
    const newValue = !allStepExpanded.value
    program.value.steps.forEach(step => step.expanded = newValue)
  }

  // Tüm adımların expanded durumunu belirli bir değere ayarla
  function setAllStepsExpanded(value: boolean): void {
    program.value.steps.forEach(step => step.expanded = value)
  }

  /**
   * Mevcut programı yazdırır.
   *
   * @returns {Promise<void>} Yazdırma işlemi tamamlandığında çözümlenen bir promise döner.
   *
   * @description Bu fonksiyon, mevcut programın detaylarını içeren bir PDF dosyası oluşturur ve yazdırma işlemini başlatır.
   * Yazdırma işlemi sırasında yükleme durumu güncellenir ve hata durumunda kullanıcıya bildirim gösterilir.
   */
  async function printProgram(): Promise<void> {
    isLoading.value = true

    try {
      const commandList = Array.from(machine.currentMachine.commands.values())

      // Prepare translations for the PDF
      const processed = buildTranslations(messages.value, locale.value, t, 'printProgramListDialog')

      const payload = {
        machine: { id: machine.currentMachine.id, name: machine.currentMachine.name },
        programs: [program.value],
        selectedCommandNos: commandList.map(c => c.commandNo),
        commandList,
        translations: processed,
        locale: locale.value,
        processTypes: allProcessTypes.value,
      }

      const programDetailPdf = await generateProgramPDF('PROGRAM_DETAIL', payload)

      printPDF(programDetailPdf)
    } catch (error) {
      console.error('Print error:', error)
      notifyError(t('printProgramListDialog.printError'))
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Seçili paralel adımı ana adım yapar.
   *
   * @param {boolean} [before] - true ise mevcut adımın öncesine, false ise sonrasına ekler. Varsayılan: false
   */
  function makeMainStep(before: boolean = false): void {
    if (!selectedParallelStep.value) {
      return notifyWarning(t('warning.noParallelStepSelected'))
    }

    const { stepId, commandId } = selectedParallelStep.value
    const currentIdx = program.value.steps.findIndex(s => s.stepId === stepId)
    if (currentIdx === -1) {
      return notifyWarning(t('warning.mainStepNotFound'))
    }

    const step = program.value.steps[currentIdx]
    const parallelIdx = step.parallelCommands.findIndex(cmd => cmd.commandId === commandId)
    if (parallelIdx === -1) {
      return notifyWarning(t('warning.parallelStepNotFound'))
    }

    const parallelCmd = step.parallelCommands[parallelIdx]
    const machineCmd = machine.currentMachine.commands.get(parallelCmd.commandNo)
    if (!machineCmd) {
      return notifyError(t('error.machineCommandNotFound', { machineId: machine.currentMachine.id, commandNo: parallelCmd.commandNo }))
    }

    if (machineCmd.commandType === CommandEligibility.PARALLEL_ONLY) {
      return notifyError(t('error.cannotBeMainStep', { commandNo: parallelCmd.commandNo }))
    }

    // Paralel komutu mevcut step'ten kaldır
    step.parallelCommands.splice(parallelIdx, 1)

    // Yeni adımı oluştur ve bir önceki adımın paralel komutlarını kopyala
    const insertIdx = before ? currentIdx : currentIdx + 1
    const newStep = createEmptyStep()
    newStep.mainCommand = { ...parallelCmd, commandId: 0 }

    // Bir önceki adımın paralel komutlarını kopyala
    const previousIdx = insertIdx - 1
    if (previousIdx >= 0 && program.value.steps[previousIdx]) {
      const parallelCommands = program.value.steps[previousIdx].parallelCommands || []
      const settings = useProgramWriteSettings()

      for (const command of parallelCommands) {
        const cmd = machine.currentMachine.commands.get(command.commandNo)
        if (!cmd)
          continue

        if (cmd.moveParallel === MoveParallel.MOVE && settings.value.addParallelCommandsFromPreviousStep) {
          newStep.parallelCommands.push(klona(command))
        } else if (cmd.moveParallel === MoveParallel.MOVE_UNTIL_DISABLED) {
          const dontUseList = cmd.dontUseList || []
          if (!dontUseList.includes(command.commandNo) && settings.value.addParallelCommandsFromPreviousStep) {
            newStep.parallelCommands.push(klona(command))
          }
        }
      }
    }

    // Paralel komutların ID'sini güncelle
    let cmdId = 1
    newStep.parallelCommands.forEach(command => command.commandId = cmdId++)

    // Yeni step'i ekle
    program.value.steps.splice(insertIdx, 0, newStep)

    // Seçimi güncelle
    selectedParallelStep.value = null
    selectedSteps.value = [newStep]

    nextTick(() => {
      scrollPage(newStep.stepId, true)
    })
  }

  return {
    program,
    originalProgram,
    selectedPrograms,
    selectedSteps,
    selectedParallelStep,
    isLoading,
    errorIds,
    allProcessTypes,
    allPrograms,
    lastStepId,
    lastCommandId,
    leftDrawerOpen,
    rightDrawerOpen,
    allStepExpanded,
    toggleAllStepsExpanded,
    setAllStepsExpanded,
    hasProgram,
    createEmptyStep,
    createEmptyCommand,
    resetProgram,
    fetchProgram,
    fetchPrograms,
    loadProgram,
    fetchAllPrograms,
    refreshAllPrograms,
    createEmptyProgram,
    updateProgram,
    onSubmit,
    insertProgram,
    insertStep,
    addStep,
    addStepToEnd,
    addStepBeforeSelection,
    newParallelStep,
    newParallelStepCommand,
    updateStepCommandFromDefinition,
    deleteStep,
    deleteParallelStep,
    selectStep,
    getPathElement,
    fetchAllProcessTypes,
    addProcessType,
    deleteProcessType,
    updateProcessType,
    scrollPage,
    fetchCommandTypes,
    hasProgramChanged,
    isStepSelected,
    getStepIndex,
    printProgram,
    makeMainStep,
  }
})
