import { expect, it } from 'vitest'
import { parseCommandsEditing } from '../src/parsers/parseCommandsEditing'
import { parseAnalogInput } from '../src/parsers/parseAnalogInput'
import { parseAnalogOutput } from '../src/parsers/parseAnalogOutput'
import { parseDigitalInput } from '../src/parsers/parseDigitalInput'
import { parseDigitalOutput } from '../src/parsers/parseDigitalOutput'
import { parseCounter } from '../src/parsers/parseCounter'
import { parseCommandAlarms } from '../src/parsers/parseCommandAlarms'
import { parseCommandFeedback } from '../src/parsers/parseCommandFeedback'
import { parseCommandGraphic } from '../src/parsers/parseCommandGraphic'
import { parseCommandGroup } from '../src/parsers/parseCommandGroup'
import { parseCommandIO } from '../src/parsers/parseCommandIO'
import { parseBatchParameters } from '../src/parsers/parseBatchParameters'
import { parseCommandParams } from '../src/parsers/parseCommandParams'
import { parseCommandsGeneral } from '../src/parsers/parseCommandsGeneral'
import { parseConsumption } from '../src/parsers/parseConsumption'
import { parseControllerModel } from '../src/parsers/parseControllerModel'
import { parseCycleControl } from '../src/parsers/parseCycleControl'
import { parseFinishReason } from '../src/parsers/parseFinishReason'
import { parseFunctionAlarms } from '../src/parsers/parseFunctionAlarms'
import { parseGlobalCommandFormulas } from '../src/parsers/parseGlobalCommandFormulas'
import { parseIOChangedEvent } from '../src/parsers/parseIOChangedEvent'
import { parseLockGeneral } from '../src/parsers/parseLockGeneral'
import { parseSeperatedLocks } from '../src/parsers/parseLocksInput'
import { parseLocksOutput } from '../src/parsers/parseLocksOutput'
import { parseMachineParameters } from '../src/parsers/parseMachineParameters'
import { parseMachineParameterValues } from '../src/parsers/parseMachineParameterValues'
import { parseManualReason } from '../src/parsers/parseManualReason'
import { parseStopReason } from '../src/parsers/parseStopReason'
import { parseSystem } from '../src/parsers/parseSystem'
import { parseUser } from '../src/parsers/parseUser'

it('parseCommandsEditing', () => {
  const contents = `
8  12,19,21,23,27,40,60 1,1,1,1,1,1,1
87
47  43,14, 1,1,
32  16 1
`

  const output = parseCommandsEditing(contents)

  const results = [
    { commandNo: 8, adviceList: '-1', dontUseList: '12,19,21,23,27,40,60', dontUseListCounter: '1,1,1,1,1,1,1' },
    { commandNo: 87, adviceList: '-1', dontUseList: null, dontUseListCounter: null },
    { commandNo: 47, adviceList: '-1', dontUseList: '43,14', dontUseListCounter: '1,1' },
    { commandNo: 32, adviceList: '-1', dontUseList: '16', dontUseListCounter: '1' },
  ]

  expect(output).toStrictEqual(results)
})

it('parseAnalogInput', () => {
  const contents = `
0 1 1 "AK Sicakligi" 1 0 "anakazan_sicaklik.gif"
1 1 2 "RK Sicakligi" 1 1 "anakazan_sicaklik.gif"
12 2 5 "pH" 1 12 "Ph_degeri.gif"
13 2 6 "Iletkenlik" 1 13 "Karisimsuyu_Degeri.gif"
`
  const output = parseAnalogInput(contents)

  const results = [
    { id: 0, card: 1, channel: 1, name: 'AK Sicakligi', enabled: 1, plcIO: 0, icon: 'anakazan_sicaklik.gif' },
    { id: 1, card: 1, channel: 2, name: 'RK Sicakligi', enabled: 1, plcIO: 1, icon: 'anakazan_sicaklik.gif' },
    { id: 12, card: 2, channel: 5, name: 'pH', enabled: 1, plcIO: 12, icon: 'Ph_degeri.gif' },
    { id: 13, card: 2, channel: 6, name: 'Iletkenlik', enabled: 1, plcIO: 13, icon: 'Karisimsuyu_Degeri.gif' },
  ]

  expect(output).toStrictEqual(results)
})

it('parseAnalogOutput', () => {
  const contents = `
0 1 1 "Pompa Hizi" 0 1 0
1 1 2 "1. Kule Hizi" 0 1 1
17 3 2 "empty" 0 1 17
`
  const output = parseAnalogOutput(contents)

  const results = [
    { id: 0, card: 1, channel: 1, name: 'Pompa Hizi', defaultValue: 0, enabled: 1, plcIO: 0, icon: '' },
    { id: 1, card: 1, channel: 2, name: '1. Kule Hizi', defaultValue: 0, enabled: 1, plcIO: 1, icon: '' },
    { id: 17, card: 3, channel: 2, name: 'empty', defaultValue: 0, enabled: 1, plcIO: 17, icon: '' },
  ]

  expect(output).toStrictEqual(results)
})

it('parseDigitalInput', () => {
  const contents = `
0 1 1 "Basinc Tahliye Acik" 1 0
1 1 2 "Pompa Calisiyor" 1 1
2 1 3 "Pompa 2 Calisiyor " 1 2
`
  const output = parseDigitalInput(contents)

  const results = [
    { id: 0, card: 1, channel: 1, name: 'Basinc Tahliye Acik', enabled: 1, plcIO: 0, icon: '' },
    { id: 1, card: 1, channel: 2, name: 'Pompa Calisiyor', enabled: 1, plcIO: 1, icon: '' },
    { id: 2, card: 1, channel: 3, name: 'Pompa 2 Calisiyor ', enabled: 1, plcIO: 2, icon: '' },
  ]

  expect(output).toStrictEqual(results)
})

it('parseDigitalOutput', () => {
  const contents = `
0 1 1 "Ana Pompa" 0 1 0
1 1 2 "Karistiri Pompa" 0 1 1
2 1 3 "Alarm Lambasi" 0 1 2
`
  const output = parseDigitalOutput(contents)

  const results = [
    { id: 0, card: 1, channel: 1, name: 'Ana Pompa', defaultValue: 0, enabled: 1, plcIO: 0, icon: '' },
    { id: 1, card: 1, channel: 2, name: 'Karistiri Pompa', defaultValue: 0, enabled: 1, plcIO: 1, icon: '' },
    { id: 2, card: 1, channel: 3, name: 'Alarm Lambasi', defaultValue: 0, enabled: 1, plcIO: 2, icon: '' },
  ]

  expect(output).toStrictEqual(results)
})

it('parseCounter', () => {
  const contents = `
2 1 3 "Elektrik Sayaci" 1 2
3 1 4 "Su Sayaci" 1 3
`
  const output = parseCounter(contents)

  const results = [
    { id: 2, card: 1, channel: 3, name: 'Elektrik Sayaci', enabled: 1, plcIO: 2, icon: '' },
    { id: 3, card: 1, channel: 4, name: 'Su Sayaci', enabled: 1, plcIO: 3, icon: '' },
  ]

  expect(output).toStrictEqual(results)
})

it('parseCommandAlarms', () => {
  const contents = `
5 100 8 -1 "" "Süre Aşıldı"
5 101 8 -1 "" "Sıcaklık Aşıldı"
95 100 10 -1 "" "Oparatör Çağrı"
4 100 8 -1 "" "Süre Aşıldı"
86 106 0 -1 "" "Dozaj Süre Yetersiz"
`
  const output = parseCommandAlarms(contents)

  const results = [
    { commandNo: 5, alarmNo: 100, alarm: 'Süre Aşıldı' },
    { commandNo: 5, alarmNo: 101, alarm: 'Sıcaklık Aşıldı' },
    { commandNo: 95, alarmNo: 100, alarm: 'Oparatör Çağrı' },
    { commandNo: 4, alarmNo: 100, alarm: 'Süre Aşıldı' },
    { commandNo: 86, alarmNo: 106, alarm: 'Dozaj Süre Yetersiz' },
  ]

  expect(output).toStrictEqual(results)
})

it('parseCommandFeedback', () => {
  const contents = `
5 0 "PV 1" "Sıcaklık" 1 3
6 0 "PV 4" "Stabilize Zamanı" 0 11
`

  const output = parseCommandFeedback(contents)

  const results = [
    { commandNo: 5, format: 0, pvNo: 'PV 1', returnValueName: 'Sıcaklık', canShow: 1, SPRelation: 3 },
    { commandNo: 6, format: 0, pvNo: 'PV 4', returnValueName: 'Stabilize Zamanı', canShow: 0, SPRelation: 11 },
  ]

  expect(output).toStrictEqual(results)
})

it('parseCommandGraphic', () => {
  const contents = `
24 2 "Süre" "Sıcaklık" "Gradyan" "5" "Bekleme Zamanı"
30 0 "Süre" "" "" "" ""
31 6 "Süre" "25" "" "" ""
34 2 "Süre" "Sıcaklık" "Kazanç" "5" ""
35 0 "" "" "" "" ""
`

  const output = parseCommandGraphic(contents)

  const results = [
    { commandNo: 24, type: 2, x: 'Süre', y: 'Sıcaklık', a: 'Gradyan', maxA: '5', b: 'Bekleme Zamanı' },
    { commandNo: 30, type: 0, x: 'Süre', y: '', a: '', maxA: '', b: '' },
    { commandNo: 31, type: 6, x: 'Süre', y: '25', a: '', maxA: '', b: '' },
    { commandNo: 34, type: 2, x: 'Süre', y: 'Sıcaklık', a: 'Kazanç', maxA: '5', b: '' },
    { commandNo: 35, type: 0, x: '', y: '', a: '', maxA: '', b: '' },
  ]

  expect(output).toStrictEqual(results)
})

it('parseCommandGroup', () => {
  const contents = `
0 "Komutlar" "grupBoyama.gif"
9 "Diger" "grupBoyama.gif"
`
  const output = parseCommandGroup(contents)

  const results = [
    { commandGroupId: 0, name: 'Komutlar', icon: 'grupBoyama' },
    { commandGroupId: 9, name: 'Diger', icon: 'grupBoyama' },
  ]

  expect(output).toStrictEqual(results)
})

it('parseCommandIO', () => {
  const contents = `
5 "Giriş Seviye" 1,5 1 5,3 0
5 "" 1,1 0
5 "Su Vanası" 4,16 1 4,17 0
4 "" -1,-1 -1
`
  const output = parseCommandIO(contents)

  const results = [
    {
      commandNo: 4,
      chooseList: [
        {
          selectIndex: 0,
          ioType: -1,
          ioId: -1,
          isDefault: -1,
          name: '',
          isChoosableIO: false,
          ioIndex: 0,
        },
      ],
    },
    {
      commandNo: 5,
      chooseList: [
        {
          selectIndex: 0,
          ioType: 1,
          ioId: 5,
          isDefault: 1,
          name: 'Giriş Seviye',
          isChoosableIO: true,
          ioIndex: 0,
        },
        {
          selectIndex: 1,
          ioType: 5,
          ioId: 3,
          isDefault: 0,
          name: 'Giriş Seviye',
          isChoosableIO: true,
          ioIndex: 0,
        },
        {
          selectIndex: 0,
          ioType: 1,
          ioId: 1,
          isDefault: 0,
          name: '',
          isChoosableIO: false,
          ioIndex: 1,
        },
        {
          selectIndex: 0,
          ioType: 4,
          ioId: 16,
          isDefault: 1,
          name: 'Su Vanası',
          isChoosableIO: true,
          ioIndex: 2,
        },
        {
          selectIndex: 1,
          ioType: 4,
          ioId: 17,
          isDefault: 0,
          name: 'Su Vanası',
          isChoosableIO: true,
          ioIndex: 2,
        },
      ],
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseBatchParameters', () => {
  const contents = `
SABIT_0=Kilo, 1, 0, 2000, -9999, 1, 1,9600,[]
SABIT_1=Soda, 0, 0, 3000, 0, 1, 4,9601,[]
SABIT_2=Boya, 0, 0, 3000, 0, 1, 8,9602,[]
SABIT_0=Kilo, 0, 0, 30000, -9999, 1, 1,[]
SABIT_1=Birinci Soda, 0, 0, 5000, 0, 2, 4,[]
SABIT_2=Ikinci Soda, 0, 0, 5000, 0, 2, 4,[]
`

  const output = parseBatchParameters(contents)

  const results = [
    {
      batchParameterId: 0,
      paramString: 'Kilo',
      format: '1',
      min: 0,
      max: 2000,
      default: -9999,
      unitCode: 1,
      unitText: 'Kg',
      parameterId: 1,
      dmArea: 9600,
      selectionList: [],
      selectionValues: [],
      selectionListDefault: [],
    },
    {
      batchParameterId: 1,
      paramString: 'Soda',
      format: '0',
      min: 0,
      max: 3000,
      default: 0,
      unitCode: 1,
      unitText: 'Kg',
      parameterId: 4,
      dmArea: 9601,
      selectionList: [],
      selectionValues: [],
      selectionListDefault: [],
    },
    {
      batchParameterId: 2,
      paramString: 'Boya',
      format: '0',
      min: 0,
      max: 3000,
      default: 0,
      unitCode: 1,
      unitText: 'Kg',
      parameterId: 8,
      dmArea: 9602,
      selectionList: [],
      selectionValues: [],
      selectionListDefault: [],
    },
    {
      batchParameterId: 0,
      paramString: 'Kilo',
      format: '0',
      min: 0,
      max: 30000,
      default: -9999,
      unitCode: 1,
      unitText: 'Kg',
      parameterId: 1,
      dmArea: null,
      selectionList: [],
      selectionValues: [],
      selectionListDefault: [],
    },
    {
      batchParameterId: 1,
      paramString: 'Birinci Soda',
      format: '0',
      min: 0,
      max: 5000,
      default: 0,
      unitCode: 2,
      unitText: 'lt',
      parameterId: 4,
      dmArea: null,
      selectionList: [],
      selectionValues: [],
      selectionListDefault: [],
    },
    {
      batchParameterId: 2,
      paramString: 'Ikinci Soda',
      format: '0',
      min: 0,
      max: 5000,
      default: 0,
      unitCode: 2,
      unitText: 'lt',
      parameterId: 4,
      dmArea: null,
      selectionList: [],
      selectionValues: [],
      selectionListDefault: [],
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseCommandParams', () => {
  const contents = `
5 0 "SP 12" "Pompa Offdelay" "" 3 60 0 600 2
5 0 "SP 13" "Mikser" "" 1 0 0 1 0 ["Calisma","0","Calis","1"]
`
  const output = parseCommandParams(contents)

  const results = [
    {
      commandNo: 5,
      name: 'SP 12',
      paramName: 'Pompa Offdelay',
      paramFormula: '',
      binding: 3,
      defaultValue: 60,
      minValue: 0,
      maxValue: 600,
      graphic: 2,
      selectionList: null,
    },
    {
      commandNo: 5,
      name: 'SP 13',
      paramName: 'Mikser',
      paramFormula: '',
      binding: 1,
      defaultValue: 0,
      minValue: 0,
      maxValue: 1,
      graphic: 0,
      selectionList: [
        {
          name: 'Calisma',
          value: 0,
        },
        {
          name: 'Calis',
          value: 1,
        },
      ],
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseCommandsGeneral', () => {
  const contents = `
5 1 "RK Boya Suyu Al" "f22.3" "RK_Boya_Suyu_Al.gif" 0 1 -1 1 0
68 1 "AK Yikama Suyu Al" "f2" "AK_Boya_Suyu_Al.gif" 0 1 -1 2 0
`
  const output = parseCommandsGeneral(contents)

  const results = [
    {
      commandNo: 5,
      activated: 1,
      name: 'RK Boya Suyu Al',
      tbbFunctionName: 'f22.3',
      icon: 'RK_Boya_Suyu_Al.gif',
      commandType: 0,
      isRunManual: 1,
      moveParallel: 1,
      groupId: 0,
      machineConstantId: -1,
    },
    {
      commandNo: 68,
      activated: 1,
      name: 'AK Yikama Suyu Al',
      tbbFunctionName: 'f2',
      icon: 'AK_Boya_Suyu_Al.gif',
      commandType: 0,
      isRunManual: 1,
      moveParallel: 2,
      groupId: 0,
      machineConstantId: -1,
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseConsumption', () => {
  const contents = `
IP_CONVERTOR=5
HEATING_VALVE=8
PROPORTIONAL=1
STEAM_COEFFICENT=1.00
STEAM_CORRECTION_COEFFICENT=1.00
TANK_0_TEMPERATURE=0
TANK_0_LEVEL=4
TANK_1_TEMPERATURE=1
TANK_1_LEVEL=5
RESERVE_HEATING_VALVE=35
TANK_2_TEMPERATURE=0
TANK_2_LEVEL=0
TANK_3_TEMPERATURE=0
TANK_3_LEVEL=0
TANK_4_TEMPERATURE=0
TANK_4_LEVEL=0
WATERTYPE_0_DO=16
WATERTYPE_1_DO=17
WATERTYPE_2_DO=18
WATERTYPE_3_DO=-1
WATERTYPE_4_DO=-1
WATERTYPE_5_DO=-1
WATERTYPE_6_DO=-1
SU_SAYACI=3
ELEKTRIK_SAYACI=2
BOBIN_CAPACITY=0
DAILYWATERCONS_ENABLED=0
DAILYWATERCONS_EVENT_HOUR=0
DAILYWATERCONS_EVENT_MIN=0
DAILYWATERCONS_PREVIOUS_STATUS=0
DISCHARGE_VALVE_1=-1
DISCHARGE_VALVE_2=-1
DISCHARGE_VALVE_3=-1
DISCHARGE_VALVE_4=-1
BUHAR_SAYACI_REEL=-1
`
  const output = parseConsumption(contents)

  const results = {
    IP_CONVERTOR: 5,
    HEATING_VALVE: 8,
    PROPORTIONAL: 1,
    STEAM_COEFFICENT: 1.00,
    STEAM_CORRECTION_COEFFICENT: 1.00,
    TANK_0_TEMPERATURE: 0,
    TANK_0_LEVEL: 4,
    TANK_1_TEMPERATURE: 1,
    TANK_1_LEVEL: 5,
    RESERVE_HEATING_VALVE: 35,
    TANK_2_TEMPERATURE: 0,
    TANK_2_LEVEL: 0,
    TANK_3_TEMPERATURE: 0,
    TANK_3_LEVEL: 0,
    TANK_4_TEMPERATURE: 0,
    TANK_4_LEVEL: 0,
    WATERTYPE_0_DO: 16,
    WATERTYPE_1_DO: 17,
    WATERTYPE_2_DO: 18,
    WATERTYPE_3_DO: -1,
    WATERTYPE_4_DO: -1,
    WATERTYPE_5_DO: -1,
    WATERTYPE_6_DO: -1,
    SU_SAYACI: 3,
    ELEKTRIK_SAYACI: 2,
    BOBIN_CAPACITY: 0,
    DAILYWATERCONS_ENABLED: 0,
    DAILYWATERCONS_EVENT_HOUR: 0,
    DAILYWATERCONS_EVENT_MIN: 0,
    DAILYWATERCONS_PREVIOUS_STATUS: 0,
    DISCHARGE_VALVE_1: -1,
    DISCHARGE_VALVE_2: -1,
    DISCHARGE_VALVE_3: -1,
    DISCHARGE_VALVE_4: -1,
    BUHAR_SAYACI_REEL: -1,
  }

  expect(output).toStrictEqual(results)
})

it('parseControllerModel', () => {
  const contents = `
T7700-Giada-TBBPLC
`
  const output = parseControllerModel(contents)

  const results = {
    productModel: 'T7700',
    hardwareModel: 'Giada',
    plcModel: 'TBBPLC',
  }

  expect(output).toStrictEqual(results)
})

it('parseCycleControl', () => {
  const contents = `
CYCLE_KONTROLU_YAPILSIN=1
CYCLE_TUR_SURESI=220
CYCLE_GOZ_SAYISI=6
CYCLE_SENSOR_HASSASIYET_SURESI=100
CYCLE_ANA_POMPA_DO=0
CYCLE_ANA_POMPA_AO=0
IP_KONVERTOR_AO=5
CYCLE_UC_BULMA_DI=-1
CYCLE_ANA_POMPA_RUN_AO=0
CYCLE_HASPEL_0_AO_KANAL=1
CYCLE_HASPEL_1_AO_KANAL=2
CYCLE_HASPEL_2_AO_KANAL=6
CYCLE_HASPEL_3_AO_KANAL=9
CYCLE_HASPEL_4_AO_KANAL=10
CYCLE_HASPEL_5_AO_KANAL=11
CYCLE_HASPEL_0_DI_KANAL=39
CYCLE_HASPEL_1_DI_KANAL=42
CYCLE_HASPEL_2_DI_KANAL=45
CYCLE_HASPEL_3_DI_KANAL=48
CYCLE_HASPEL_4_DI_KANAL=51
CYCLE_HASPEL_5_DI_KANAL=54
CYCLE_HASPEL_0_DO_KANAL=6
CYCLE_HASPEL_1_DO_KANAL=6
CYCLE_HASPEL_2_DO_KANAL=6
CYCLE_HASPEL_3_DO_KANAL=6
CYCLE_HASPEL_4_DO_KANAL=6
CYCLE_HASPEL_5_DO_KANAL=6
HAVALI_MAKINE_CMS_AO=-1
PLATER_AO=6
KULE_KONTROL_AKTIF=0
MAL_KURTARMA_AKTIF=0
CYCLE_UC_BULMA_DI=-1
UC_BULMA_GERI_SURESI=5
GERI_ALMA_HIZI=30
UC_BULMA_HIZI=30
UC_BULMA_LAMBASI_DO=-1
KULE_START=5
KULE_START_GECIKME=20
MAL_KURTARMA_GERI_ALMA_SURESI=5
MAL_KURTARMA_GERI_ALMA_SURESI_2=5
MAL_KURTARMA_GERI_ALMA_SURESI_3=5
MAL_KURTARMA_ILERI_ALMA_SURESI=10
MAL_KURTARMA_HIZI=30
MAL_KURTARMA_ARA_BEKLEME_SURESI=15
MAL_KURTARMA_TAKIP_ZAMANI=120
MAL_KOPTU_DEVREDEN_CIKARAN_KOMUT_0=-1
MAL_KOPTU_DEVREDEN_CIKARAN_KOMUT_1=-1
MAL_KOPTU_DEVREDEN_CIKARAN_KOMUT_2=-1
MAL_KOPTU_DEVREDEN_CIKARAN_KOMUT_3=-1
MAL_KOPTU_DEVREDEN_CIKARAN_KOMUT_4=-1
MAL_KOPTU_ALARM_TOLERANSI=2
KLAPE_SAYISI=1
KULE_KONTROL_0=-1
KULE_KONTROL_1=-1
KULE_KONTROL_2=-1
KULE_KONTROL_3=-1
KULE_KONTROL_4=-1
KULE_KONTROL_5=-1
KULE_KONTROL_6=-1
KULE_KONTROL_7=-1
KULE_KONTROL_8=-1
KULE_KONTROL_9=-1
CYCLE_GRAPHIC_0=1
CYCLE_GRAPHIC_1=1
CYCLE_GRAPHIC_2=1
CYCLE_GRAPHIC_3=1
CYCLE_GRAPHIC_4=1
CYCLE_GRAPHIC_5=1
MIN_TUR_SURESI=0
CYCLE_KULE_OTO_MAN_DI=-1
MAL_SARDI_SWITCH_TIPI=0
KULE_INVERTOR_ARIZA_SWITCH_TIPI=0
`
  const output = parseCycleControl(contents)

  const results = [
    {
      reelCount: 6,
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseFinishReason', () => {
  const contents = `
1 "Renk OK" 3 "Bitir"
2 "LaboratuvarÇalışıyor" 3 "Bitir"
`

  const output = parseFinishReason(contents)

  const results = [
    {
      reasonId: '1',
      text: 'Renk OK',
      typeId: 3,
    },
    {
      reasonId: '2',
      text: 'LaboratuvarÇalışıyor',
      typeId: 3,
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseFunctionAlarms', () => {
  const contents = `
f6 S=100 E=101 O=
f7 S= E=100,101,102,103,104,105,106 O=
`

  const output = parseFunctionAlarms(contents)

  const results = [
    { f: 'f6', s: '100', e: '101', o: '', m: '' },
    { f: 'f7', s: '', e: '100,101,102,103,104,105,106', o: '', m: '' },
  ]

  expect(output).toStrictEqual(results)
})

it('parseGlobalCommandFormulas', () => {
  const contents = `
GLOBAL_FORMULA_1=Kilo*(AK Yikama Oran-Kumastaki Su),1,1,0,Yikama Suyu
GLOBAL_FORMULA_2=Kilo*(AK Boya Oran-Kumastaki Su)-(Soda+Tuz+Boya+Sülfat+Alkali),2,1,0,Boya Suyu
`

  const output = parseGlobalCommandFormulas(contents)

  const results = [
    {
      formula: 'Kilo*(AK Yikama Oran-Kumastaki Su)',
      formulaId: 1,
      commandNo: 1,
      commandParameterNo: 0,
      formulaName: 'Yikama Suyu',
    },
    {
      formula: 'Kilo*(AK Boya Oran-Kumastaki Su)-(Soda+Tuz+Boya+Sülfat+Alkali)',
      formulaId: 2,
      commandNo: 1,
      commandParameterNo: 0,
      formulaName: 'Boya Suyu',
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseIOChangedEvent', () => {
  const contents = `
1 13 10 60 60
2 0 10 60
5 2 60
`

  const output = parseIOChangedEvent(contents)

  const results = [
    {
      ioType: 1,
      ioIndex: 13,
      difference: 10,
      period: 60,
      minPeriod: 60,
    },
    {
      ioType: 2,
      ioIndex: 0,
      difference: 10,
      period: 60,
      minPeriod: null,
    },
    {
      ioType: 5,
      ioIndex: 2,
      difference: 60,
      period: null,
      minPeriod: null,
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseLockGeneral', () => {
  const contents = `
0 "Otomatik" 0 0 0 0 "0" "0" 0 "" 1
88 "Kapaklar Acik 2" 0 0 0 130 "3" "0" 1 "DIKKAT! Kapaklar Acik" 1
182 "4.Kule Kumas Koptu" 0 0 0 130 "Kumas Koptu sn" "0" 1 "4.Kule Kumas Koptu" 1
`
  const output = parseLockGeneral(contents)

  const results = [
    {
      lockNo: 0,
      lockName: 'Otomatik',
      logicType: 0,
      stopDyeing: 0,
      jumpStep: 0,
      alarm: 0,
      onDelay: '0',
      stepDelay: '0',
      giveMessage: 0,
      messageString: '',
      active: 1,
    },

    {
      lockNo: 88,
      lockName: 'Kapaklar Acik 2',
      logicType: 0,
      stopDyeing: 0,
      jumpStep: 0,
      alarm: 130,
      onDelay: '3',
      stepDelay: '0',
      giveMessage: 1,
      messageString: 'DIKKAT! Kapaklar Acik',
      active: 1,
    },

    {
      lockNo: 182,
      lockName: '4.Kule Kumas Koptu',
      logicType: 0,
      stopDyeing: 0,
      jumpStep: 0,
      alarm: 130,
      onDelay: 'Kumas Koptu sn',
      stepDelay: '0',
      giveMessage: 1,
      messageString: '4.Kule Kumas Koptu',
      active: 1,
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseLocksInput', () => {
  const contents = `
6 8 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0
7 0 0 "Dozaj Sicaklik" "0" 0.0 3 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 0
`

  const lines = contents.split('\n').filter(line => line.length > 0)
  const output = lines.map(parseSeperatedLocks)

  const results = [
    {
      lockId: 6,
      inputType: 8,
      inputs: [],
      logicType: 0,
    },
    {
      lockId: 7,
      inputType: 0,
      inputs: [
        {
          id: 0,
          r1min: 'Dozaj Sicaklik',
          r2max: '0',
          histerisis: '0.0',
          state: '3',
        },
      ],
      logicType: 0,
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseLocksOutput', () => {
  const contents = `
172 2 9 0 -1 0 -1 0 -1 0 -1 0 -1 -1 -1 -1 -1
6 3 62 0 30 1 63 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0
7 2 -1 0 -1 0 -1 0 -1 0 -1 0 -1 -1 -1 -1 -1
`

  const output = parseLocksOutput(contents)

  const results = {
    analogLocks: [
      {
        lockNo: 172,
        analogOutputs: [
          {
            outputId: 9,
            percentage: 0,
          },
        ],
      },
      {
        lockNo: 7,
        analogOutputs: [
        ],
      },
    ],
    digitalLocks: [
      {
        lockNo: 6,
        digitalOutputs: [
          {
            outputId: 62,
            state: 0,
          },
          {
            outputId: 30,
            state: 1,
          },
          {
            outputId: 63,
            state: 0,
          },
        ],
      },
    ],
  }

  expect(output).toStrictEqual(results)
})

it('parseMachineParameters', () => {
  const contents = `
SABIT_0=AK Ust,15000.000,9100,1,0.000,15000.000,0,1,0
SABIT_80=Kumas gir minumum,7500.000,9101,1,7500.000,8000.000,0,81,0
`

  const output = parseMachineParameters(contents)

  const results = [
    {
      machineParameterId: 0,
      paramString: 'AK Ust',
      defaultValue: 15000.000,
      dmArea: 9100,
      consScreen: 1,
      paramLowLimit: 0.000,
      paramHighLimit: 15000.000,
      consFormat: 0,
      consUnit: 0,
    },
    {
      machineParameterId: 80,
      paramString: 'Kumas gir minumum',
      defaultValue: 7500.000,
      dmArea: 9101,
      consScreen: 1,
      paramLowLimit: 7500.000,
      paramHighLimit: 8000.000,
      consFormat: 0,
      consUnit: 0,
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseMachineParameterValues', () => {
  const contents = `
SABIT_0=15000.000000
SABIT_1=1500.000000
`

  const output = parseMachineParameterValues(contents)

  const results = [
    {
      currentValue: 15000.000000,
      machineParameterId: 0,
    },
    {
      currentValue: 1500.000000,
      machineParameterId: 1,
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseManualReason', () => {
  const contents = `
1 "Kumaş kontrol"
2 "Kumaş koptu-sardı"
3 "Onay bekliyor"
4 "İlaveye girecek"
5 "Arıza"
6 "Kumaş çıkış"
7 "Kumaş Giriş"
8 "Buhar yok"
9 "Su yok"
`

  const output = parseManualReason(contents)

  const results = [
    {
      manualCode: 1,
      manualName: 'Kumaş kontrol',
    },
    {
      manualCode: 2,
      manualName: 'Kumaş koptu-sardı',
    },
    {
      manualCode: 3,
      manualName: 'Onay bekliyor',
    },
    {
      manualCode: 4,
      manualName: 'İlaveye girecek',
    },
    {
      manualCode: 5,
      manualName: 'Arıza',
    },
    {
      manualCode: 6,
      manualName: 'Kumaş çıkış',
    },
    {
      manualCode: 7,
      manualName: 'Kumaş Giriş',
    },
    {
      manualCode: 8,
      manualName: 'Buhar yok',
    },
    {
      manualCode: 9,
      manualName: 'Su yok',
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseStopReason', () => {
  const contents = `
1 "Mal Yok(sipariş yok)"
2 "Araba Yok"
3 "Rpt Bekliyor"
4 "Arıza"
5 "K.Hazır Değil(açma+fikse+gaze)"
6 "Kumaş Girilecek"
7 "Filtre Temizliği"
`

  const output = parseStopReason(contents)

  const results = [
    {
      stopCode: 1,
      stopName: 'Mal Yok(sipariş yok)',
    },
    {
      stopCode: 2,
      stopName: 'Araba Yok',
    },

    {
      stopCode: 3,
      stopName: 'Rpt Bekliyor',
    },
    {
      stopCode: 4,
      stopName: 'Arıza',
    },
    {
      stopCode: 5,
      stopName: 'K.Hazır Değil(açma+fikse+gaze)',
    },
    {
      stopCode: 6,
      stopName: 'Kumaş Girilecek',
    },
    {
      stopCode: 7,
      stopName: 'Filtre Temizliği',
    },
  ]

  expect(output).toStrictEqual(results)
})

it('parseSystem', () => {
  const contents = `
FROM_PROJECT_LANGUAGE=0
DIL=TR
ICONS_ENABLED=1
SIDETEXT_ENABLED=1
KILITLEMELER_AKTIF=1
TEST_PLC_EKRANINDA_KILITLEMELER_AKTIF=0
EXTERNAL_BUTTONS_ENABLED=0
BATCH_NO_DIGIT_COUNT=0
KEEP_PROGRAMS=1
PANEL_REEL_PUMP_TUNE=0
BARCODE_READER_ENABLED=1
PANEL_KLAPE_TUNE=0
MANUEL_MOD_GECIS_SEBEP_SOR=1
PROGRAM_IZLEME_ADIM_GECIS=1
PROGRAM_YAZMA_DEFAULT=1
PROGRAM_YAZARKEN_ONER=1
BATCH_NO_NUMERIK=0
HAVALI_MAKINE=0
SIKMA_KONTROLLU_MAKINE=0
DUZE_KONTROL_AKTIF=1
UZAKTAN_KONTROL_AKTIF=1
REAKTOR_KONTROL=0
OPERATOR_BATCH_BASLATAMASIN=0
KULLANICI_LOGOFF=1
OPTIM_AKTIF=0
POMPA_KULE_DURMASIN=1
KOMUT_GRUP_AKTIF=0
MCS_MAKINE=0
BOBIN_BOYAMA_MAKINE=0
JIGGER_MAKINE=0
PROJE_LOGOSU_KULLAN=0
MODBUS_MODE=0
PLC_OK_PROGRAM_OK=0
PLC_RECOVER_IOS=1
PLC_ENABLED=0
PISA_GUI_ENABLED=0
BATCH_NO_OTOMATIK=0
BIG_GUI_ENABLED=1
BATCH_NO_DIGIT_COUNT_VALUE=7
DIGITAL_IO_EVENT_TIME=60
DURUS_SEBEBI_ZORUNLU=1
PROJE_DIL_HAVUZUNU_KULLAN=1
PROJECT_NAME=CANLAR MAKINA 2016
PROJECT_DATE=0.0
DOKUNMATIK_EKRAN=0
KULLANICI_LOGOFF_PASSWORD=0
PLC_BAUD_RATE_57600=0
ILAVEDE_SADECE_ILAVE_PROSESLER=0
HAVALI_MAKINE_CMS=0
PLC_COUNTER_TYPE=0
HAZIR_IS_EMRI_BASLATMA_PARAMETRESI_SOR=1
ASK_BATCH_PARAMETERS_COUPLED_MODE=0
DO_NOT_RESTART_RUNNING_STEP=0
PREVENT_DISABLED_COMMAND=0
MAX_REMOTE_BATCH_COUNT=500
IS_EMRI_BASLATILIRKEN_TUM_PARAMETRELERI_SOR=0
OTOMATIK_GUNCELLEME=0
TELESKOP_IS_EMRI_BASLATMA_ONAYI=0
CODESYS_V32=0
TELESKOP_HAZIR_IS_EMRI_INDIREBILME=1
IO_SIRA_NUMARASI_GOSTERILSIN=1
FONKSIYON_HAVUZU=0
KULE_DEGERI_YUZDELIK_GOSTERILSIN=1
FARK_BASINC_FONKSIYONU=0
KIMYASAL_ISTEK_FONKSIYONU=0
IS_EMRI_BITISINDE_DURUS_SEBEBI_GOSTERILSIN=1
ISLEM_DURDURULDU_SEBEP_SOR=1
ISEMRI_IPTAL_EDILDIGINDE_SEBEP_SOR=0
KIMYASAL_BOYA_BILGILERINI_GOSTER=1
T8_RIO_SLOT=0
ALARM_REPEAT_TIME=30
SECOND_PLC_ACTIVE=0
DURUS_SEBEBI_SURESI=0
DURUS_ALARM_GOREVLERI=130
DUZE_KONTROLU_YAPILSIN=1
TO_PROJECT_LANGUAGE=0
PROGRAM_FINISHED_WINDOW=1
SOFT_RESTART_TIME=-1
REEL_DI_ENABLED=0
AZAMI_BATCH_SAYISI=20
AZAMI_DOSYA_BOYUTU=10485760
CALCULATE_INTERLOCK_FORMULAS=0
KIMYASAL_ISTEK_FONKSIYONU_DURUM_PARAMETRESI=1
FARK_BASINC_FONKSIYONU_ISLEM_PARAMETRESI=4
VACUUM=604800
UYGULAMA_LOG=0
PLC_DEBUG=0
TELESKOP_ONAYI_BEKLEME_SURESI=120000
PARCA_KURUTMA_MAKINASI=0
MIMIC_FINE_TUNING_X=0
MIMIC_FINE_TUNING_Y=0
T7_RIO_SLOT=0
SONLANDIRMA_SECENEGI_SORULSUN=1
MIMIK_ANIMASYON_AKTIF=0
OTOMATIK_REBOOT_SAYISI=0
SMARTEX_MANUEL_SCADA=0
SMARTEX_PLC_5U=0
YIKAMA_FAZ_BILGISI_AKTIF=0
SOFT_PANO_BUTON_AKTIF=0
ALARM_KALKINCA_BATCH_OTOMATIK_BASLAMASIN=0
MENU_DILI_KISAYOL_AKTIF=0
KULLANICI_ISLEMLERINI_YONET=0
HAZIR_IS_EMRINI_MANUEL_YUKLE=0
ILK_ADIMDAN_BASLATMA_ZORUNLU=0
OTOMATIK_BATCH_BASLATMA=0
KULLANICI_ALARMI_KALKINCA_BATCH_BASLAMASIN=0
KILITLEME_KALKINCA_BATCH_BASLAMASIN=0
DURUS_SEBEBINI_BATCH_BASLARKEN_SOR=1
KIMYASAL_ISTEKLER_ISEMRI_BAZINDA=0
WEBVISU_AKTIF=0
ADIM_ATLAMA_SEBEBI_AKTIF=0
VERITABANI_ISLEMLERI_AKTIF=0
ISEMRI_NUMARASI_ILLEGAL_KARAKTER_KULLANIMI_AKTIF=0
KOMUT_ZAMAN_ASILDI_SEBEPLERI_AKTIF=0
`

  const output = parseSystem(contents)

  const results = {
    FROM_PROJECT_LANGUAGE: '0',
    DIL: 'TR',
    ICONS_ENABLED: '1',
    SIDETEXT_ENABLED: '1',
    KILITLEMELER_AKTIF: '1',
    TEST_PLC_EKRANINDA_KILITLEMELER_AKTIF: '0',
    EXTERNAL_BUTTONS_ENABLED: '0',
    BATCH_NO_DIGIT_COUNT: '0',
    KEEP_PROGRAMS: '1',
    PANEL_REEL_PUMP_TUNE: '0',
    BARCODE_READER_ENABLED: '1',
    PANEL_KLAPE_TUNE: '0',
    MANUEL_MOD_GECIS_SEBEP_SOR: '1',
    PROGRAM_IZLEME_ADIM_GECIS: '1',
    PROGRAM_YAZMA_DEFAULT: '1',
    PROGRAM_YAZARKEN_ONER: '1',
    BATCH_NO_NUMERIK: '0',
    HAVALI_MAKINE: '0',
    SIKMA_KONTROLLU_MAKINE: '0',
    DUZE_KONTROL_AKTIF: '1',
    UZAKTAN_KONTROL_AKTIF: '1',
    REAKTOR_KONTROL: '0',
    OPERATOR_BATCH_BASLATAMASIN: '0',
    KULLANICI_LOGOFF: '1',
    OPTIM_AKTIF: '0',
    POMPA_KULE_DURMASIN: '1',
    KOMUT_GRUP_AKTIF: '0',
    MCS_MAKINE: '0',
    BOBIN_BOYAMA_MAKINE: '0',
    JIGGER_MAKINE: '0',
    PROJE_LOGOSU_KULLAN: '0',
    MODBUS_MODE: '0',
    PLC_OK_PROGRAM_OK: '0',
    PLC_RECOVER_IOS: '1',
    PLC_ENABLED: '0',
    PISA_GUI_ENABLED: '0',
    BATCH_NO_OTOMATIK: '0',
    BIG_GUI_ENABLED: '1',
    BATCH_NO_DIGIT_COUNT_VALUE: '7',
    DIGITAL_IO_EVENT_TIME: '60',
    DURUS_SEBEBI_ZORUNLU: '1',
    PROJE_DIL_HAVUZUNU_KULLAN: '1',
    PROJECT_NAME: 'CANLAR MAKINA 2016',
    PROJECT_DATE: '0.0',
    DOKUNMATIK_EKRAN: '0',
    KULLANICI_LOGOFF_PASSWORD: '0',
    PLC_BAUD_RATE_57600: '0',
    ILAVEDE_SADECE_ILAVE_PROSESLER: '0',
    HAVALI_MAKINE_CMS: '0',
    PLC_COUNTER_TYPE: '0',
    HAZIR_IS_EMRI_BASLATMA_PARAMETRESI_SOR: '1',
    ASK_BATCH_PARAMETERS_COUPLED_MODE: '0',
    DO_NOT_RESTART_RUNNING_STEP: '0',
    PREVENT_DISABLED_COMMAND: '0',
    MAX_REMOTE_BATCH_COUNT: '500',
    IS_EMRI_BASLATILIRKEN_TUM_PARAMETRELERI_SOR: '0',
    OTOMATIK_GUNCELLEME: '0',
    TELESKOP_IS_EMRI_BASLATMA_ONAYI: '0',
    CODESYS_V32: '0',
    TELESKOP_HAZIR_IS_EMRI_INDIREBILME: '1',
    IO_SIRA_NUMARASI_GOSTERILSIN: '1',
    FONKSIYON_HAVUZU: '0',
    KULE_DEGERI_YUZDELIK_GOSTERILSIN: '1',
    FARK_BASINC_FONKSIYONU: '0',
    KIMYASAL_ISTEK_FONKSIYONU: '0',
    IS_EMRI_BITISINDE_DURUS_SEBEBI_GOSTERILSIN: '1',
    ISLEM_DURDURULDU_SEBEP_SOR: '1',
    ISEMRI_IPTAL_EDILDIGINDE_SEBEP_SOR: '0',
    KIMYASAL_BOYA_BILGILERINI_GOSTER: '1',
    T8_RIO_SLOT: '0',
    ALARM_REPEAT_TIME: '30',
    SECOND_PLC_ACTIVE: '0',
    DURUS_SEBEBI_SURESI: '0',
    DURUS_ALARM_GOREVLERI: '130',
    DUZE_KONTROLU_YAPILSIN: '1',
    TO_PROJECT_LANGUAGE: '0',
    PROGRAM_FINISHED_WINDOW: '1',
    SOFT_RESTART_TIME: '-1',
    REEL_DI_ENABLED: '0',
    AZAMI_BATCH_SAYISI: '20',
    AZAMI_DOSYA_BOYUTU: '10485760',
    CALCULATE_INTERLOCK_FORMULAS: '0',
    KIMYASAL_ISTEK_FONKSIYONU_DURUM_PARAMETRESI: '1',
    FARK_BASINC_FONKSIYONU_ISLEM_PARAMETRESI: '4',
    VACUUM: '604800',
    UYGULAMA_LOG: '0',
    PLC_DEBUG: '0',
    TELESKOP_ONAYI_BEKLEME_SURESI: '120000',
    PARCA_KURUTMA_MAKINASI: '0',
    MIMIC_FINE_TUNING_X: '0',
    MIMIC_FINE_TUNING_Y: '0',
    T7_RIO_SLOT: '0',
    SONLANDIRMA_SECENEGI_SORULSUN: '1',
    MIMIK_ANIMASYON_AKTIF: '0',
    OTOMATIK_REBOOT_SAYISI: '0',
    SMARTEX_MANUEL_SCADA: '0',
    SMARTEX_PLC_5U: '0',
    YIKAMA_FAZ_BILGISI_AKTIF: '0',
    SOFT_PANO_BUTON_AKTIF: '0',
    ALARM_KALKINCA_BATCH_OTOMATIK_BASLAMASIN: '0',
    MENU_DILI_KISAYOL_AKTIF: '0',
    KULLANICI_ISLEMLERINI_YONET: '0',
    HAZIR_IS_EMRINI_MANUEL_YUKLE: '0',
    ILK_ADIMDAN_BASLATMA_ZORUNLU: '0',
    OTOMATIK_BATCH_BASLATMA: '0',
    KULLANICI_ALARMI_KALKINCA_BATCH_BASLAMASIN: '0',
    KILITLEME_KALKINCA_BATCH_BASLAMASIN: '0',
    DURUS_SEBEBINI_BATCH_BASLARKEN_SOR: '1',
    KIMYASAL_ISTEKLER_ISEMRI_BAZINDA: '0',
    WEBVISU_AKTIF: '0',
    ADIM_ATLAMA_SEBEBI_AKTIF: '0',
    VERITABANI_ISLEMLERI_AKTIF: '0',
    ISEMRI_NUMARASI_ILLEGAL_KARAKTER_KULLANIMI_AKTIF: '0',
    KOMUT_ZAMAN_ASILDI_SEBEPLERI_AKTIF: '0',
  }

  expect(output).toStrictEqual(results)
})

it('parseUser', () => {
  const contents = `
100 1984 GECICI KULLANICI 0x1313ffff 0x00000003 2
9999 9999 DENEME KULLANICISI 0x13110000 0x00000003 1
`

  const output = parseUser(contents)

  const results = [
    {
      userId: 100,
      userPass: '1984',
      userName: 'GECICI',
      userSurname: 'KULLANICI',
      userMode: '0x1313ffff',
      userMode2: '0x00000003',
      userType: 2,
    },
    {
      userId: 9999,
      userPass: '9999',
      userName: 'DENEME',
      userSurname: 'KULLANICISI',
      userMode: '0x13110000',
      userMode2: '0x00000003',
      userType: 1,
    },
  ]

  expect(output).toStrictEqual(results)
})
