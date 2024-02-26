// Samba Configuration File: https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html

const PARAMETER_RE = /^(.+?)=(.+)$/
const BOOLEAN_RE = /^(?:yes|no|true|false|0|1)$/i
const TRUE_RE = /^(?:yes|true|1)$/i
const SPECIAL_SHARE_RE = /^(?:homes|global|printers)$/i

export interface SambaParseOptions {
  preserveCase?: boolean
  preserveInternalWhitespace?: boolean
  replaceInternalWhitespace?: string
}

function parseParameterLine(str: string, options: SambaParseOptions = {}) {
  const match = str.match(PARAMETER_RE)
  if (!match)
    throw new Error('Invalid parameter string')

  let name = match[1].trim()
  if (!options.preserveCase) {
    name = name.toLowerCase()
  }
  if (!options.preserveInternalWhitespace) {
    if (typeof options.replaceInternalWhitespace === 'string') {
      name = name.replaceAll(/\s/g, options.replaceInternalWhitespace)
    } else {
      name = name.replaceAll(/\s/g, '')
    }
  }
  let value: string | boolean = match[2].trim()
  if (BOOLEAN_RE.test(value)) {
    value = TRUE_RE.test(value)
  }

  return { name, value }
}

export function isSpecialShare(name: string) {
  return SPECIAL_SHARE_RE.test(name)
}

export interface SambaSection {
  name: string
  parameters: Record<string, string | boolean>
}

/**
 *
 * @param {string} str
 * @param {object} options
 * @param {boolean=} options.preserveCase default: `false`
 * @param {string=} options.replaceInternalWhitespace Ignored if `preserveInternalWhitespace` is `true`
 * @param {boolean=} options.preserveInternalWhitespace default: `false`
 *
 * @returns {SambaSection[]}
 *
 * The file consists of sections and parameters. A section begins with the name of the section in square brackets and continues until the next section begins. Sections contain parameters of the form:
 *
 * `name = value`
 *
 * The file is line-based - that is, each newline-terminated line represents either a comment, a section name or a parameter.
 *
 * Section and parameter names are not case sensitive.
 *
 * Only the first equals sign in a parameter is significant. Whitespace before or after the first equals sign is discarded. Leading, trailing and internal whitespace in section and parameter names is irrelevant. Leading and trailing whitespace in a parameter value is discarded. Internal whitespace within a parameter value is retained verbatim.
 *
 * Any line beginning with a semicolon (“;”) or a hash (“#”) character is ignored, as are lines containing only whitespace.
 *
 * Any line ending in a “\” is continued on the next line in the customary UNIX fashion.
 *
 * The values following the equals sign in parameters are all either a string (no quotes needed) or a boolean, which may be given as yes/no, 1/0 or true/false. Case is not significant in boolean values, but is preserved in string values. Some items such as create masks are numeric.
 */
export function parseSambaConfig(str: string, options: SambaParseOptions = {}): SambaSection[] {
  const lines = str.split('\n')
  const sections = [] as SambaSection[]
  let currentSection = null as SambaSection | null

  for (let line of lines) {
    line = line.trim()
    if (!line || line.startsWith(';') || line.startsWith('#')) {
      continue
    }
    if (line.startsWith('[') && line.endsWith(']')) {
      let name = line.slice(1, -1)
      if (!options.preserveCase) {
        name = name.toLowerCase()
      }
      currentSection = {
        name,
        parameters: {},
      }
      sections.push(currentSection)
    } else {
      if (!currentSection) {
        throw new Error('Expected section')
      }
      const { name, value } = parseParameterLine(line, options)
      currentSection.parameters[name] = value
    }
  }
  return sections
}

export function stringifySambaComfig(config: SambaSection | SambaSection[]) {
  const output = []
  config = Array.isArray(config) ? config : [config]
  for (const section of config) {
    output.push(
      `[${section.name}]`,
      ...Object.entries(section.parameters)
        .map(([name, value]) => `${name} = ${stringifyParameterValue(value)}`),
    )
  }
  return output.join('\n')
}

function stringifyParameterValue(value: string | boolean) {
  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no'
  } else {
    return value ? `${value}` : ''
  }
}
