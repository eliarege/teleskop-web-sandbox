// Generates .env files for all apps based on the selected config
import { readdir, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, resolve, basename, dirname } from 'path'
import { encode } from 'querystring'
import dotenv from 'dotenv'
import { z } from 'zod/v4'
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const configRelativePath = 'config'

const argv = yargs(hideBin(process.argv))
  .usage('Usage: generate-env <config> [options]')
  .command(
    '$0 <config>',
    `Generate .env files for all apps based on the selected config. Configurations are stored in the ${configRelativePath}/ directory as JSON files.`,
    (yargs) => {
      return yargs.positional('config', {
        describe: 'Config file to use',
        type: 'string'
      }).option('env-file', {
        alias: 'e',
        type: 'string',
        description: 'Name of the .env file to generate (default: .env)',
        default: '.env',
      });
    }
  )
  .demandCommand(1, 'You must provide a config file')
  .parse();

const configFile = ensureJson(argv.config)
const envFile = argv.envFile

const workspaceDir = resolve(import.meta.dirname, '../..')
const configDir = resolve(workspaceDir, configRelativePath)
const appsDir = resolve(workspaceDir, 'apps')
const configPath = resolve(configDir, configFile)

// Top-level config schema: standard keys are strictly validated with
// defaults, any unknown keys (including per-app overrides) pass through.
const connectionOptionsSchema = z.record(z.string(), z.string()).default({})

const teleskopSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().positive().int().default(1433),
  user: z.string().default('sa'),
  password: z.string().default(''),
  database: z.string().default('Teleskop'),
  instanceName: z.string().optional(),
  connectionOptions: connectionOptionsSchema,
  timezoneOffset: z.number().int().default(-180),
}).default({})

const dmexchangeSchema = z.object({
  enabled: z.boolean().default(false),
  host: z.string().optional(),
  port: z.number().positive().int().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
  instanceName: z.string().optional(),
  connectionOptions: z.record(z.string(), z.string()).optional(),
}).default({})

const keycloakSchema = z.object({
  enabled: z.boolean().default(false),
}).default({})

const configSchema = z.looseObject({
  teleskop: teleskopSchema,
  dmexchange: dmexchangeSchema,
  keycloak: keycloakSchema,
})

// Schema for per-app env overrides. Recursively accepts nested objects;
// leaf values may be string / number / boolean / null. Arrays are rejected
// by zod (plain objects only — `Array.isArray(obj)` is false for arrays in
// zod's object check), producing a hard validation error pointing to the
// offending key path.
const appEnvValueSchema = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.record(z.string(), appEnvValueSchema),
  ]),
)

const appEnvSchema = z.record(z.string(), appEnvValueSchema)

const rawConfig = await import(configPath, { with: { type: 'json' } }).catch(() => {
  console.error(`Error: Config file "${configFile}" not found in ${configRelativePath}/ directory.`)
  process.exit(1)
}).then(m => m.default)

const config = configSchema.parse(rawConfig)
const appList = await readdir(appsDir, { withFileTypes: true })
  .then(files => files.filter(f => f.isDirectory()).map(f => f.name))

// Per-app env overrides: a flat map of `app -> { NUXT_KEY: value }`.
// Only top-level keys matching an existing app directory are processed;
// unknown keys are silently ignored. Null leaves are dropped at flatten time.
/** @type {Record<string, Record<string, string|number|boolean>>} */
const appEnvMaps = {}
for (const [key, value] of Object.entries(config)) {
  if (key === 'teleskop' || key === 'dmexchange' || key === 'keycloak') continue
  if (!appList.includes(key)) continue
  appEnvMaps[key] = flattenAppEnv(appEnvSchema.parse(value))
}

const teleskopHost = config.teleskop.host
const teleskopPort = config.teleskop.port
const teleskopUser = config.teleskop.user
const teleskopPassword = config.teleskop.password
const teleskopDatabase = config.teleskop.database
const teleskopInstanceName = config.teleskop.instanceName
const teleskopTimezoneOffset = config.teleskop.timezoneOffset
const teleskopConnectionOptions = encode(config.teleskop.connectionOptions)

const dmexchangeEnabled = config.dmexchange?.enabled || false
const dmexchangeHost = config.dmexchange?.host || teleskopHost
const dmexchangePort = config.dmexchange?.port || teleskopPort
const dmexchangeUser = config.dmexchange?.user || teleskopUser
const dmexchangePassword = config.dmexchange?.password || teleskopPassword
const dmexchangeDatabase = config.dmexchange?.database || 'DmExchange'
const dmexchangeInstanceName = config.dmexchange?.instanceName || teleskopInstanceName
const dmexchangeConnectionOptions = encode(config.dmexchange?.connectionOptions || {})

const keycloakEnabled = config.keycloak.enabled

// Standard managed env categories, applied to every app.
const standardCategories = [
  {
    label: 'Teleskop database connection',
    env: {
      NUXT_TELESKOP_HOST: teleskopHost,
      NUXT_TELESKOP_PORT: teleskopPort,
      NUXT_TELESKOP_USER: teleskopUser,
      NUXT_TELESKOP_PASSWORD: teleskopPassword,
      NUXT_TELESKOP_DATABASE: teleskopDatabase,
      ...(teleskopInstanceName ? { NUXT_TELESKOP_INSTANCE_NAME: teleskopInstanceName } : {}),
      NUXT_TELESKOP_TIMEZONE_OFFSET: teleskopTimezoneOffset,
      NUXT_TELESKOP_CONNECTION_OPTIONS: teleskopConnectionOptions,
    },
  },
  {
    label: 'DmExchange database connection',
    env: {
      NUXT_DMEXCHANGE_ENABLED: dmexchangeEnabled,
      NUXT_DMEXCHANGE_HOST: dmexchangeHost,
      NUXT_DMEXCHANGE_PORT: dmexchangePort,
      NUXT_DMEXCHANGE_USER: dmexchangeUser,
      NUXT_DMEXCHANGE_PASSWORD: dmexchangePassword,
      NUXT_DMEXCHANGE_DATABASE: dmexchangeDatabase,
      ...(dmexchangeInstanceName ? { NUXT_DMEXCHANGE_INSTANCE_NAME: dmexchangeInstanceName } : {}),
      NUXT_DMEXCHANGE_CONNECTION_OPTIONS: dmexchangeConnectionOptions,
    },
  },
  {
    label: 'Keycloak configuration',
    env: {
      NUXT_PUBLIC_KC_ENABLED: keycloakEnabled,
    },
  },
]

/**
 * @param {string} file
 * @return {string}
 */
function ensureJson(file) {
  return file.endsWith('.json') ? file : `${file}.json`
}

/**
 * Convert a camelCase / PascalCase / kebab-case key into UPPER_SNAKE_CASE,
 * matching nuxt runtime-config env-key behavior.
 * @param {string} key
 * @return {string}
 */
function toUpperSnake(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/[- ]+/g, '_')
    .toUpperCase()
}

/**
 * Recursively flatten a per-app env override object into a flat map of
 * `NUXT_<PARENT>_<CHILD>_...` keys. Strings, numbers and booleans are
 * emitted as leaves. Null values are dropped. Arrays never reach here
 * because `appEnvSchema` rejects them during validation.
 * @param {Record<string, any>} obj
 * @param {string} prefix
 * @param {Record<string, string|number|boolean>} out
 * @returns {Record<string, string|number|boolean>}
 */
function flattenAppEnv(obj, prefix = 'NUXT_', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) continue
    const envKey = `${prefix}${toUpperSnake(key)}`
    if (typeof value === 'object' && !Array.isArray(value)) {
      flattenAppEnv(value, `${envKey}_`, out)
    } else {
      out[envKey] = value
    }
  }
  return out
}

/**
 * @param {Array<{label: string, env: Record<string, any>}>} categories
 * @returns {string}
 */
function stringifyCategories(categories) {
  const lines = []
  for (const category of categories) {
    lines.push(`# ${category.label}`)
    for (const [key, value] of Object.entries(category.env)) {
      lines.push(`${key}=${value}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

/**
 * Determine the set of env-var keys managed by the script for a given app:
 * the standard categories plus any per-app overrides generated from config.
 * @param {string} app
 * @returns {Set<string>}
 */
function managedKeysForApp(app) {
  const keys = new Set()
  for (const category of standardCategories) {
    for (const key of Object.keys(category.env)) keys.add(key)
  }
  for (const key of Object.keys(appEnvMaps[app] ?? {})) keys.add(key)
  return keys
}

for (const app of appList) {
  const appEnvPath = resolve(appsDir, app, envFile)
  const appOverrides = appEnvMaps[app]
  const categories = [...standardCategories]
  if (appOverrides && Object.keys(appOverrides).length > 0) {
    categories.push({
      label: 'App configuration',
      env: appOverrides,
    })
  }
  const managedKeys = managedKeysForApp(app)

  const exists = existsSync(appEnvPath)
  if (exists) {
    const existingEnv = dotenv.parse(await readFile(appEnvPath, 'utf-8'))
    const otherEnv = Object.fromEntries(Object.entries(existingEnv).filter(([key]) => !managedKeys.has(key)))
    if (Object.keys(otherEnv).length > 0) {
      await writeFile(appEnvPath, stringifyCategories([
        ...categories,
        {
          label: 'Other environment variables',
          env: otherEnv,
        },
      ]))
      continue
    }
  }
  await writeFile(appEnvPath, stringifyCategories(categories))
}

const readJSONC = async (path) => {
  const text = await readFile(path, 'utf-8')
  return parseJSONC(text)
}

// Copied from `tiny-jsonc` package
const parseJSONC = (text) => {
  const stringOrCommentRe = /("(?:\\?[^])*?")|(\/\/.*)|(\/\*[^]*?\*\/)/g;
  const stringOrTrailingCommaRe = /("(?:\\?[^])*?")|(,\s*)(?=]|})/g;

  text = String(text); // To be extra safe
  try { // Fast path for valid JSON
    return JSON.parse(text);
  } catch { // Slow path for JSONC and invalid inputs
    return JSON.parse(text.replace(stringOrCommentRe, '$1').replace(stringOrTrailingCommaRe, '$1'));
  }
}

const writeJSON = async (path, data) => {
  const content = JSON.stringify(data, null, 2) + '\n'
  await writeFile(path, content)
}

const mcpPath = join(workspaceDir, '.vscode/mcp.json')
const mcpConfig = await readJSONC(mcpPath)

if (mcpConfig?.servers?.['mssql-mcp-server']) {
  const env = mcpConfig.servers['mssql-mcp-server'].env ??= {}
  env['DB_USER'] = teleskopUser
  env['DB_PASSWORD'] = teleskopPassword
  env['DB_SERVER'] = teleskopHost
  env['DB_DATABASE'] = teleskopDatabase
  env['DB_TRUST_SERVER_CERT'] = 'true'
  await writeJSON(mcpPath, mcpConfig)
}

const plural = appList.length === 1 ? '' : 's'
console.log(`Generated ${envFile} file${plural} for config "${basename(configFile, '.json')}"`)
