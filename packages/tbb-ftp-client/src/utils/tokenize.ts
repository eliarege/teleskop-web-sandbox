export type StringToken = {
  type: 'string'
  value: string
}

export type FloatToken = {
  type: 'float'
  value: number
}

export type IntegerToken = {
  type: 'integer'
  value: number
}

export type ListToken = {
  type: 'list'
  value: { name: string, value: number }[]
}

export type IntegerListToken = {
  type: 'integer-list'
  value: number[]
}

export type Token = StringToken | FloatToken | IntegerToken | ListToken | IntegerListToken

export type TokenType = Token['type']

/**
 * Capture groups:
 *
 * 1) Float
 * 2) Hex
 * 3) Integer list (comma-separated integers like "4,13" or "2,3,5,6,7")
 * 4) Integer
 * 5) String
 * 6) Quoteless String
 * 7) List (JSON array like `["Option 1",1,"Option 2",2]`)
 */
const pattern = /(-?\d+\.\d+)|(0x[0-9a-fA-F]+)|(-?\d+(?:,-?\d+)+)|(-?\d+)|("[^"]*")|([^"\[\]\s]+)|(\[[^\]]*\])/g

/**
 * Tokenize a line into an array of tokens.
 *
 * @param line The line to tokenize.
 * @returns An array of tokens.
 */
export function tokenize(line: string): TokenArray {
  const tokens = [] as Token[] // number | string | { name: string, value: number }[]
  let match = pattern.exec(line)
  while (match !== null) {
    tokens.push(parseTokenMatch(match))
    match = pattern.exec(line)
  }
  return new TokenArray(tokens)
}

function parseTokenMatch(match: RegExpExecArray): Token {
  // Float
  if (match[1]) {
    return { type: 'float', value: Number.parseFloat(match[1]) }
  } // Hex (treated as string)
  else if (match[2]) {
    return { type: 'string', value: match[2] }
  } // Integer list (comma-separated)
  else if (match[3]) {
    return { type: 'integer-list', value: match[3].split(',').map(n => Number.parseInt(n)) }
  } // Integer
  else if (match[4]) {
    return { type: 'integer', value: Number.parseInt(match[4]) }
  } // Quoted string
  else if (match[5]) {
    return { type: 'string', value: match[5].slice(1, -1) }
  } // Quoteless string
  else if (match[6]) {
    return { type: 'string', value: match[6] }
  } // List
  else if (match[7]) {
    const rawList = JSON.parse(match[7])
    const list = [] as { name: string, value: number }[]
    for (let i = 0; i < rawList.length; i += 2) {
      list.push({
        name: rawList[i],
        value: Number(rawList[i + 1]),
      })
    }

    return { type: 'list', value: list }
  } else {
    throw new Error('No valid token match found')
  }
}

class TokenArray {
  constructor(private tokens: Token[]) {}

  get length() {
    return this.tokens.length
  }

  get(index: number, type: 'float'): number
  get(index: number, type: 'integer'): number
  get(index: number, type: 'string'): string
  get(index: number, type: 'list'): { name: string, value: number }[]
  get(index: number, type: 'integer-list'): number[]
  get(index: number, type: TokenType): Token['value'] {
    const token = this.tokens[index]
    if (!token) {
      switch (type) {
        case 'float':
          return 0
        case 'integer':
          return 0
        case 'string':
          return ''
        case 'list':
          return []
        case 'integer-list':
          return []
      }
    }
    const from = token.type
    const to = type
    if (from !== to) {
      if ((from === 'list' || to === 'list')) {
        throw new Error(`Cannot convert token of type ${from} to ${to}`)
      } else if (to === 'string') {
        return String(token.value)
      } else if (to === 'float') {
        const value = Number.parseFloat(String(token.value))
        return Number.isNaN(value) ? 0 : value
      } else if (to === 'integer') {
        const value = Number.parseInt(String(token.value))
        return Number.isNaN(value) ? 0 : value
      } else if (to === 'integer-list') {
        const value = Number.parseInt(String(token.value))
        return Number.isNaN(value) ? [] : [value]
      } else {
        throw new Error(`Unsupported token conversion from ${from} to ${to}`)
      }
    } else {
      return token.value
    }
  }
}
