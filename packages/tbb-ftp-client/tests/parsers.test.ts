import { expect, it } from 'vitest'
import { parseCommandsEditing } from '../src/parsers/parseCommandsEditing'

it('should parse commands editing correctly', () => {
  const contents = `
8  12,19,21,23,27,40,60 1,1,1,1,1,1,1
87
47  43,14, 1,1,
32  16 1
`

  const commands = parseCommandsEditing(contents)

  const results = [
    { commandNo: 8, adviceList: '-1', dontUseList: '12,19,21,23,27,40,60', dontUseListCounter: '1,1,1,1,1,1,1' },
    { commandNo: 87, adviceList: '-1', dontUseList: null, dontUseListCounter: null },
    { commandNo: 47, adviceList: '-1', dontUseList: '43,14', dontUseListCounter: '1,1' },
    { commandNo: 32, adviceList: '-1', dontUseList: '16', dontUseListCounter: '1' },
  ]

  expect(commands).toStrictEqual(results)
})
