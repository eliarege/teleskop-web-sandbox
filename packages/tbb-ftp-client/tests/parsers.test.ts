import { describe, expect, it } from 'vitest'
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
import { parseMachineTranslations } from '../src/parsers/parseMachineTranslations'

// Helper: returns two variants of the given raw multiline content
// 1. Without a trailing newline
// 2. With a single trailing newline
function withVariants(raw: string) {
  const base = raw.endsWith('\n') ? raw.slice(0, -1) : raw
  return [base, `${base}\n`]
}

it('parseAnalogInput', () => {
  const base = [
    '0 1 1 "AK Sicakligi" 1 0 "anakazan_sicaklik.gif"',
    '13 2 6 "Iletkenlik" 1 13 "Karisimsuyu_Degeri.gif"',
  ].join('\n')
  const results = [
    { id: 0, card: 1, channel: 1, name: 'AK Sicakligi', enabled: 1, plcIO: 0, icon: 'anakazan_sicaklik.gif' },
    { id: 13, card: 2, channel: 6, name: 'Iletkenlik', enabled: 1, plcIO: 13, icon: 'Karisimsuyu_Degeri.gif' },
  ]
  for (const variant of withVariants(base)) {
    const output = parseAnalogInput(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseAnalogOutput', () => {
  const base = [
    '0 1 1 "Pompa Hizi" 0 1 0',
    '17 3 2 "empty" 0 1 17',
  ].join('\n')
  const results = [
    { id: 0, card: 1, channel: 1, name: 'Pompa Hizi', defaultValue: 0, enabled: 1, plcIO: 0, icon: '' },
    { id: 17, card: 3, channel: 2, name: 'empty', defaultValue: 0, enabled: 1, plcIO: 17, icon: '' },
  ]
  for (const variant of withVariants(base)) {
    const output = parseAnalogOutput(variant)
    expect(output).toStrictEqual(results)
  }
})

describe('parseBatchParameters', () => {
  it('old format', () => {
    const base = [
      'SABIT_0=Kilo, 1, 0, 2000, -9999, 1, 1,9600, []',
      'SABIT_2=Ikinci Soda, 0, 0, 5000, 0, 2, 4, []',
      'SABIT_11=Wss Yoğun Yıkama, 0, 0, 1, 0, 0, 0,9611,["Hayır","0",1,"Evet","1",0]',
    ].join('\n')
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
        selectionListDefault: null,
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
        selectionListDefault: null,
      },
      {
        batchParameterId: 11,
        paramString: 'Wss Yoğun Yıkama',
        format: '0',
        min: 0,
        max: 1,
        default: 0,
        unitCode: 0,
        unitText: '---',
        parameterId: 0,
        dmArea: 9611,
        selectionList: ['Hayır', 'Evet'],
        selectionValues: ['0', '1'],
        selectionListDefault: '0',
      },
    ]
    for (const variant of withVariants(base)) {
      const output = parseBatchParameters(variant)
      expect(output).toStrictEqual(results)
    }
  })

  it('new format', () => {
    const base = [
      'SABIT_12=Pk410, 0, 0, 1, 0, 0, 0,4500,[],0',
      'SABIT_13=Pk412, 0, 0, 30000, -9999, 8, 1,["t","1",1,"s","2",0,"e","3",0],1,8,12',
      'SABIT_14=Kilo, 0, 0, 30000, -9999, 1, 1,["t","1",1,"s","2",0,"e","3",0],1,-1,-1',
    ].join('\n')
    const results = [

      {
        batchParameterId: 12,
        paramString: 'Pk410',
        format: '0',
        min: 0,
        max: 1,
        default: 0,
        unitCode: 0,
        unitText: '---',
        parameterId: 0,
        dmArea: 4500,
        selectionList: [],
        selectionValues: [],
        selectionListDefault: null,
        visibility: false,
      },
      {
        batchParameterId: 13,
        paramString: 'Pk412',
        format: '0',
        min: 0,
        max: 30000,
        default: -9999,
        unitCode: 8,
        unitText: 'mbar',
        parameterId: 1,
        dmArea: null,
        selectionList: ['t', 's', 'e'],
        selectionValues: ['1', '2', '3'],
        selectionListDefault: '1',
        visibility: true,
        machineConstantIdMin: 8,
        machineConstantIdMax: 12,
      },
      {
        batchParameterId: 14,
        paramString: 'Kilo',
        format: '0',
        min: 0,
        max: 30000,
        default: -9999,
        unitCode: 1,
        unitText: 'Kg',
        parameterId: 1,
        dmArea: null,
        selectionList: ['t', 's', 'e'],
        selectionValues: ['1', '2', '3'],
        selectionListDefault: '1',
        visibility: true,
        machineConstantIdMin: -1,
        machineConstantIdMax: -1,
      },
    ]
    for (const variant of withVariants(base)) {
      const output = parseBatchParameters(variant)
      expect(output).toStrictEqual(results)
    }
  })
})

it.todo('parseCalibrationAnalogInput', () => {

})

it.todo('parseCalibrationCounter', () => {

})

it.todo('parseCommandAlarmReasons', () => {

})

it('parseCommandAlarms', () => {
  const base = [
    '5 100 8 -1 "" "Süre Aşıldı"',
    '86 106 0 -1 "" "Dozaj Süre Yetersiz"',
  ].join('\n')
  const results = [
    { commandNo: 5, alarmNo: 100, alarm: 'Süre Aşıldı' },
    { commandNo: 86, alarmNo: 106, alarm: 'Dozaj Süre Yetersiz' },
  ]
  for (const variant of withVariants(base)) {
    const output = parseCommandAlarms(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseCommandFeedback', () => {
  const base = [
    '5 0 "PV 1" "Sıcaklık" 1 3',
    '6 0 "PV 4" "Stabilize Zamanı" 0 11',
  ].join('\n')
  const results = [
    { commandNo: 5, format: 0, pvNo: 'PV 1', returnValueName: 'Sıcaklık', canShow: 1, SPRelation: 3 },
    { commandNo: 6, format: 0, pvNo: 'PV 4', returnValueName: 'Stabilize Zamanı', canShow: 0, SPRelation: 11 },
  ]
  for (const variant of withVariants(base)) {
    const output = parseCommandFeedback(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseCommandGraphic', () => {
  const base = [
    '24 2 "Süre" "Sıcaklık" "Gradyan" "5" "Bekleme Zamanı"',
    '30 0 "Süre" "" "" "" ""',
    '31 6 "Süre" "25" "" "" ""',
    '34 2 "Süre" "Sıcaklık" "Kazanç" "5" ""',
    '35 0 "" "" "" "" ""',
  ].join('\n')
  const results = [
    { commandNo: 24, type: 2, x: 'Süre', y: 'Sıcaklık', a: 'Gradyan', maxA: '5', b: 'Bekleme Zamanı' },
    { commandNo: 30, type: 0, x: 'Süre', y: '', a: '', maxA: '', b: '' },
    { commandNo: 31, type: 6, x: 'Süre', y: '25', a: '', maxA: '', b: '' },
    { commandNo: 34, type: 2, x: 'Süre', y: 'Sıcaklık', a: 'Kazanç', maxA: '5', b: '' },
    { commandNo: 35, type: 0, x: '', y: '', a: '', maxA: '', b: '' },
  ]
  for (const variant of withVariants(base)) {
    const output = parseCommandGraphic(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseCommandGroup', () => {
  const base = [
    '0 "Komutlar" "grupBoyama.gif"',
    '9 "Diger" "grupBoyama.gif"',
  ].join('\n')
  const results = [
    { commandGroupId: 0, name: 'Komutlar', icon: 'grupBoyama' },
    { commandGroupId: 9, name: 'Diger', icon: 'grupBoyama' },
  ]
  for (const variant of withVariants(base)) {
    const output = parseCommandGroup(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseCommandIO', () => {
  const base = [
    '5 "Giriş Seviye" 1,5 1 5,3 0',
    '5 "" 1,1 0',
    '4 "" -1,-1 -1',
  ].join('\n')
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
      ],
    },
  ]

  for (const variant of withVariants(base)) {
    const output = parseCommandIO(variant)
    expect(output).toStrictEqual(results)
  }
})

describe('parseCommandParams', () => {
  it('old format', () => {
    const base = [
      '5 0 "SP 12" "Pompa Offdelay" "" 3 60 0 600 2',
      '5 0 "SP 13" "Mikser" "" 1 0 0 1 0 ["Calisma","0","Calis","1"]',
      '15 1 "SP 17" "Hedef Toleransı" "" 3 0.8 0.0 1.0 0',
      '41 0 "SP 2" "Dozaj Egrisi" "" 1 0 -4 4 0 ["-4","-4","-3","-3","-2","-2","-1","-1","Lineer","0","1","1","2","2","3","3","4","4"]',
    ].join('\n')

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
      {
        commandNo: 15,
        name: 'SP 17',
        paramName: 'Hedef Toleransı',
        paramFormula: '',
        binding: 3,
        defaultValue: 0.8,
        minValue: 0,
        maxValue: 1,
        graphic: 0,
        selectionList: null,
      },
      {
        commandNo: 41,
        name: 'SP 2',
        paramName: 'Dozaj Egrisi',
        paramFormula: '',
        binding: 1,
        defaultValue: 0,
        minValue: -4,
        maxValue: 4,
        graphic: 0,
        selectionList: [
          { name: '-4', value: -4 },
          { name: '-3', value: -3 },
          { name: '-2', value: -2 },
          { name: '-1', value: -1 },
          { name: 'Lineer', value: 0 },
          { name: '1', value: 1 },
          { name: '2', value: 2 },
          { name: '3', value: 3 },
          { name: '4', value: 4 },
        ],
      },
    ]

    for (const variant of withVariants(base)) {
      const output = parseCommandParams(variant)
      expect(output).toStrictEqual(results)
    }
  })
  it('new format', () => {
    const base = [
      '3 0 "SP 3" "Süre" "" 3 300 0 7200 2 12 34',
      '1 0 "SP 4" "Dara" "" 3 0 0 1 0 ["Dara Alma","0","Dara Al","1"] 12 44',
      '2 0 "SP 5" "Artan Azalan" "IK1 Ust Seviye*IK1 Oran/100" 3 1 0 1 0 ["Azalan","0","Artan","1"] -1 -1',
      '3 0 "SP 6" "Alarm Toleransı" "" 3 0 0 100 0 -1 -1',
    ].join('\n')

    const results = [
      {
        commandNo: 3,
        name: 'SP 3',
        paramName: 'Süre',
        paramFormula: '',
        binding: 3,
        defaultValue: 300,
        minValue: 0,
        maxValue: 7200,
        graphic: 2,
        selectionList: null,
        machineConstantIdMin: 12,
        machineConstantIdMax: 34,
      },
      {
        commandNo: 1,
        name: 'SP 4',
        paramName: 'Dara',
        paramFormula: '',
        binding: 3,
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        graphic: 0,
        selectionList: [
          {
            name: 'Dara Alma',
            value: 0,
          },
          {
            name: 'Dara Al',
            value: 1,
          },
        ],
        machineConstantIdMin: 12,
        machineConstantIdMax: 44,
      },
      {
        commandNo: 2,
        name: 'SP 5',
        paramName: 'Artan Azalan',
        paramFormula: 'IK1 Ust Seviye*IK1 Oran/100',
        binding: 3,
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
        graphic: 0,
        selectionList: [
          { name: 'Azalan', value: 0 },
          { name: 'Artan', value: 1 },
        ],
        machineConstantIdMin: -1,
        machineConstantIdMax: -1,
      },
      {
        commandNo: 3,
        name: 'SP 6',
        paramName: 'Alarm Toleransı',
        paramFormula: '',
        binding: 3,
        defaultValue: 0,
        minValue: 0,
        maxValue: 100,
        graphic: 0,
        selectionList: null,
        machineConstantIdMin: -1,
        machineConstantIdMax: -1,
      },
    ]
    for (const variant of withVariants(base)) {
      const output = parseCommandParams(variant)
      expect(output).toStrictEqual(results)
    }
  })
})

it('parseCommandsEditing', () => {
  const contents = `${[
    '76  14,16,38 1,1,1',
    '77  16 1',
    '83  5,6,7,14,16,38,45 1,1,1,1,1,1,1',
    '22  13,20,28,37,75, 1,1,1,1,1,',
    '17   ',
  ].join('\n')}\n`

  const output = parseCommandsEditing(contents)

  const results = [
    { commandNo: 76, adviceList: '-1', dontUseList: '14,16,38', dontUseListCounter: '1,1,1' },
    { commandNo: 77, adviceList: '-1', dontUseList: '16', dontUseListCounter: '1' },
    { commandNo: 83, adviceList: '-1', dontUseList: '5,6,7,14,16,38,45', dontUseListCounter: '1,1,1,1,1,1,1' },
    { commandNo: 22, adviceList: '-1', dontUseList: '13,20,28,37,75', dontUseListCounter: '1,1,1,1,1' },
    { commandNo: 17, adviceList: '-1', dontUseList: null, dontUseListCounter: null },
  ]

  expect(output).toStrictEqual(results)
})

it('parseCommandsGeneral', () => {
  const base = [
    '5 1 "RK Boya Suyu Al" "f22.3" "RK_Boya_Suyu_Al.gif" 0 1 -1 1 0',
    '68 1 "AK Yikama Suyu Al" "f2" "AK_Boya_Suyu_Al.gif" 0 1 -1 2 0',
  ].join('\n')
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

  for (const variant of withVariants(base)) {
    const output = parseCommandsGeneral(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseConsumption', () => {
  const base = [
    'IP_CONVERTOR=5',
    'STEAM_COEFFICENT=1.00',
    'BUHAR_SAYACI_REEL=-1',
  ].join('\n')

  const results = {
    IP_CONVERTOR: 5,
    STEAM_COEFFICENT: 1.00,
    BUHAR_SAYACI_REEL: -1,
  }

  for (const variant of withVariants(base)) {
    const output = parseConsumption(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseControllerModel', () => {
  const base = [
    'T7700-Giada-TBBPLC',
  ].join('\n')

  const results = {
    productModel: 'T7700',
    hardwareModel: 'Giada',
    plcModel: 'TBBPLC',
  }

  for (const variant of withVariants(base)) {
    const output = parseControllerModel(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseCounter', () => {
  const base = [
    '2 1 3 "Elektrik Sayaci" 1 2',
    '3 1 4 "Su Sayaci" 1 3',
  ].join('\n')

  const results = [
    { id: 2, card: 1, channel: 3, name: 'Elektrik Sayaci', enabled: 1, plcIO: 2, icon: '' },
    { id: 3, card: 1, channel: 4, name: 'Su Sayaci', enabled: 1, plcIO: 3, icon: '' },
  ]

  for (const variant of withVariants(base)) {
    const output = parseCounter(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseCycleControl', () => {
  const base = [
    'CYCLE_GOZ_SAYISI=6',
  ].join('\n')

  const results = [
    {
      reelCount: 6,
    },
  ]

  for (const variant of withVariants(base)) {
    const output = parseCycleControl(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseDigitalInput', () => {
  const base = [
    '0 1 1 "Basinc Tahliye Acik" 1 0',
    '2 1 3 "Pompa 2 Calisiyor " 1 2',
  ].join('\n')

  const results = [
    { id: 0, card: 1, channel: 1, name: 'Basinc Tahliye Acik', enabled: 1, plcIO: 0, icon: '' },
    { id: 2, card: 1, channel: 3, name: 'Pompa 2 Calisiyor ', enabled: 1, plcIO: 2, icon: '' },
  ]

  for (const variant of withVariants(base)) {
    const output = parseDigitalInput(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseDigitalOutput', () => {
  const base = [
    '0 1 1 "Ana Pompa" 0 1 0',
    '2 1 3 "Alarm Lambasi" 0 1 2',
  ].join('\n')

  const results = [
    { id: 0, card: 1, channel: 1, name: 'Ana Pompa', defaultValue: 0, enabled: 1, plcIO: 0, icon: '' },
    { id: 2, card: 1, channel: 3, name: 'Alarm Lambasi', defaultValue: 0, enabled: 1, plcIO: 2, icon: '' },
  ]

  for (const variant of withVariants(base)) {
    const output = parseDigitalOutput(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseFinishReason', () => {
  const base = [
    '1 "Renk OK" 3 "Bitir"',
    '2 "LaboratuvarÇalışıyor" 3 "Bitir"',
  ].join('\n')

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

  for (const variant of withVariants(base)) {
    const output = parseFinishReason(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseFunctionAlarms', () => {
  const base = [
    'f6 S=100 E=101 O=',
    'f7 S= E=100,101,102,103,104,105,106 O=',
  ].join('\n')

  const results = [
    { f: 'f6', s: '100', e: '101', o: '', m: '' },
    { f: 'f7', s: '', e: '100,101,102,103,104,105,106', o: '', m: '' },
  ]

  for (const variant of withVariants(base)) {
    const output = parseFunctionAlarms(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseGlobalCommandFormulas', () => {
  const base = [
    'GLOBAL_FORMULA_1=Kilo*(AK Yikama Oran-Kumastaki Su),1,1,0,Yikama Suyu',
    'GLOBAL_FORMULA_2=Kilo*(AK Boya Oran-Kumastaki Su)-(Soda+Tuz+Boya+Sülfat+Alkali),2,1,0,Boya Suyu',
  ].join('\n')

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

  for (const variant of withVariants(base)) {
    const output = parseGlobalCommandFormulas(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseIOChangedEvent', () => {
  const base = [
    '1 13 10 60 60',
    '2 0 10 60',
    '5 2 60',
    '6 1 10 10 60 5',
  ].join('\n')

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
    {
      ioType: 6,
      ioIndex: 1,
      difference: 0,
      period: 60,
      minPeriod: 5,
    },
  ]

  for (const variant of withVariants(base)) {
    const output = parseIOChangedEvent(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseLockGeneral', () => {
  const base = [
    '0 "Otomatik" 0 0 0 0 "0" "0" 0 "" 1',
    '182 "4.Kule Kumas Koptu" 0 0 0 130 "Kumas Koptu sn" "0" 1 "4.Kule Kumas Koptu" 1',
    '55 "BK+1+ORANSAL+DOLDUR+MKS+ON" 0 0 0 0 "" "" 0 "" 1',
  ].join('\n')

  const results = [
    {
      lockNo: 1,
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
      lockNo: 183,
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
    {
      lockNo: 56,
      lockName: 'BK+1+ORANSAL+DOLDUR+MKS+ON',
      logicType: 0,
      stopDyeing: 0,
      jumpStep: 0,
      alarm: 0,
      onDelay: '',
      stepDelay: '',
      giveMessage: 0,
      messageString: '',
      active: 1,
    },
  ]

  for (const variant of withVariants(base)) {
    const output = parseLockGeneral(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseLocksInput', () => {
  const base = [
    '6 8 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 0',
    '7 0 0 "Dozaj Sicaklik" "0" 0.0 3 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 -1 0.0 0.0 0.0 0 0',
  ].join('\n')

  const results = [
    {
      lockId: 7,
      inputType: 8,
      inputs: [],
      logicType: 0,
    },
    {
      lockId: 8,
      inputType: 0,
      inputs: [
        {
          id: 1,
          r1min: 'Dozaj Sicaklik',
          r2max: '0',
          histerisis: '0.0',
          state: '3',
        },
      ],
      logicType: 0,
    },
  ]

  for (const variant of withVariants(base)) {
    const lines = variant.split('\n').filter(line => line.length > 0)
    const output = lines.map(parseSeperatedLocks)
    expect(output).toStrictEqual(results)
  }
})

it('parseLocksOutput', () => {
  const base = [
    '172 2 9 0 -1 0 -1 0 -1 0 -1 0 -1 -1 -1 -1 -1',
    '6 3 62 0 30 1 63 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0 -1 0',
    '7 2 -1 0 -1 0 -1 0 -1 0 -1 0 -1 -1 -1 -1 -1',
  ].join('\n')

  const results = {
    analogLocks: [
      {
        lockNo: 173,
        analogOutputs: [
          {
            outputId: 10,
            percentage: 0,
          },
        ],
      },
      {
        lockNo: 8,
        analogOutputs: [],
      },
    ],
    digitalLocks: [
      {
        lockNo: 7,
        digitalOutputs: [
          {
            outputId: 63,
            state: 0,
          },
          {
            outputId: 31,
            state: 1,
          },
          {
            outputId: 64,
            state: 0,
          },
        ],
      },
    ],
  }

  for (const variant of withVariants(base)) {
    const output = parseLocksOutput(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseMachineParameters', () => {
  const base = [
    'SABIT_0=AK Ust,9000,9100,1,0,9500,0,1,0',
    'SABIT_80=Kumas gir minumum,7500.000,9101,1,7500.000,8000.000,0,81,0',
  ].join('\n')

  const results = [
    {
      machineParameterId: 0,
      paramString: 'AK Ust',
      defaultValue: 9000,
      dmArea: 9100,
      consScreen: 1,
      paramLowLimit: 0,
      paramHighLimit: 9500,
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

  for (const variant of withVariants(base)) {
    const output = parseMachineParameters(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseMachineParameterValues', () => {
  const base = [
    'SABIT_0=15000.000000',
    'SABIT_1=1500.000000',
  ].join('\n')

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

  for (const variant of withVariants(base)) {
    const output = parseMachineParameterValues(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseManualReason', () => {
  const base = [
    '1 "Kumaş kontrol"',
    '9 "Su yok"',
  ].join('\n')

  const results = [
    {
      manualCode: 1,
      manualName: 'Kumaş kontrol',
    },
    {
      manualCode: 9,
      manualName: 'Su yok',
    },
  ]

  for (const variant of withVariants(base)) {
    const output = parseManualReason(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseStopReason', () => {
  const base = [
    '1 "Mal Yok(sipariş yok)"',
    '7 "Filtre Temizliği"',
  ].join('\n')

  const results = [
    {
      stopCode: 1,
      stopName: 'Mal Yok(sipariş yok)',
    },
    {
      stopCode: 7,
      stopName: 'Filtre Temizliği',
    },
  ]

  for (const variant of withVariants(base)) {
    const output = parseStopReason(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseSystem', () => {
  const base = [
    'FROM_PROJECT_LANGUAGE=0',
    'DIL=TR',
    'PROJECT_NAME=CANLAR MAKINA 2016',
    'PROJECT_DATE=0.0',
  ].join('\n')

  const results = {
    FROM_PROJECT_LANGUAGE: '0',
    DIL: 'TR',
    PROJECT_NAME: 'CANLAR MAKINA 2016',
    PROJECT_DATE: '0.0',
  }

  for (const variant of withVariants(base)) {
    const output = parseSystem(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseUser', () => {
  const base = [
    '100 1984 GECICI KULLANICI 0x1313ffff 0x00000003 2',
    '9999 9999 DENEME KULLANICISI 0x13110000 0x00000003 1',
  ].join('\n')

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

  for (const variant of withVariants(base)) {
    const output = parseUser(variant)
    expect(output).toStrictEqual(results)
  }
})

it('parseMachineTranslations', () => {
  const base = [
  `Sistem~System~~سیستم~Sistem~Sistema~Sistema~نظام~系统~系统~Σύστημα~Sistem~Tizim~Sistema~Hệ thống~Sistem~시스템~System~Système`,
  `acil~urgent~~`,
  ].join('\n')

  const results = [
    [
      { locale: 0, text: 'Sistem' },
      { locale: 1, text: 'System' },
      { locale: 3, text: 'سیستم' },
      { locale: 4, text: 'Sistem' },
      { locale: 5, text: 'Sistema' },
      { locale: 6, text: 'Sistema' },
      { locale: 7, text: 'نظام' },
      { locale: 8, text: '系统' },
      { locale: 9, text: '系统' },
      { locale: 10, text: 'Σύστημα' },
      { locale: 11, text: 'Sistem' },
      { locale: 12, text: 'Tizim' },
      { locale: 13, text: 'Sistema' },
      { locale: 14, text: 'Hệ thống' },
      { locale: 15, text: 'Sistem' },
      { locale: 16, text: '시스템' },
      { locale: 17, text: 'System' },
      { locale: 18, text: 'Système' },
    ],
    [
      { locale: 0, text: 'acil' },
      { locale: 1, text: 'urgent' },
    ],
  ]

  for (const variant of withVariants(base)) {
    const output = parseMachineTranslations(variant)
    expect(output).toStrictEqual(results)
  }
})
