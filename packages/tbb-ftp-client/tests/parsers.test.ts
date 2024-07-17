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
