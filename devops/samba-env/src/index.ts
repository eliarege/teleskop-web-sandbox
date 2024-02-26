import fsp from 'node:fs/promises'
import fs from 'node:fs'
import process from 'node:process'
import { dirname, join, resolve } from 'node:path'
import { Command } from 'commander'
import YAML from 'yaml'
import { execa } from 'execa'
import { filter } from './utils.js'
import type { SambaParseOptions } from './smb.js'
import { isSpecialShare, parseSambaConfig, stringifySambaComfig } from './smb.js'

interface Compose {
  services?: Record<string, Service>
}

interface Service {
  image?: string
  container_name?: string
  network_mode?: string
  environment?: Record<string, any>
  volumes?: Array<string | { type: string, source: string, target: string }>
}

const program = new Command()

if (!process.env.HOME) {
  throw throwAndExit('HOME environment unset')
}

const env = {
  source_root: resolve(process.env.HOME, '.samba-env/share'),
  target_root: '/share',
  service_name: 'samba',
  compose_file: resolve(process.env.HOME, '.samba-env/docker-compose.yml'),
}

program
  .name('samba-env')
  .description('Samba Environment Manager')

function throwAndExit(msg: string): void {
  console.error(msg)
  process.exit(1)
}

async function readCompose(): Promise<Compose> {
  try {
    const content = await fsp.readFile(env.compose_file, 'utf-8')
    return YAML.parse(content)
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return {}
    } else {
      throw throwAndExit(`Failed to read compose file: ${err.message}`)
    }
  }
}

async function writeCompose(compose: Compose): Promise<void> {
  const composeStr = YAML.stringify(compose)
  try {
    await fsp.mkdir(dirname(env.compose_file), { recursive: true })
    await fsp.writeFile(env.compose_file, composeStr)
  } catch (err: any) {
    throw throwAndExit(`Failed to write compose file: ${err.message}`)
  }
}

function assertShareName(name: string): void {
  const NAME_RE = /^[A-Z0-9_]+$/i
  if (!NAME_RE.test(name)) {
    return throwAndExit(`Share names should only contain letters, digits or underscore`)
  }
}

function listShares(service: Service, options?: SambaParseOptions) {
  if (!service.environment) {
    return []
  }
  const sambaVolumeConfigs = filter(service.environment, (_, key) => key.startsWith('SAMBA_VOLUME_CONFIG_'))

  return Object.entries(sambaVolumeConfigs).flatMap(([key, configStr]) => {
    return parseSambaConfig(configStr, {
      replaceInternalWhitespace: '_',
      ...options,
    }).map((config, index, arr) => {
      return {
        ...config,
        source: key,
        siblings: arr.filter((_, i) => i !== index),
      }
    })
  })
}

async function ensureCompose() {
  if (!fs.existsSync(env.compose_file)) {
    const compose = {} as Compose
    ensureSambaService(compose)
    await fsp.mkdir(dirname(env.compose_file), { recursive: true })
    await fsp.writeFile(env.compose_file, YAML.stringify(compose))
  }
}

/** Mutates `compose` object to include `samba` service and returns `samba` service object */
function ensureSambaService(compose: Compose): Service {
  compose.services ??= {}
  const keys = Object.keys(compose.services)
  const excessiveKeys = keys.filter(k => env.service_name !== k)
  for (const key of excessiveKeys) {
    delete compose.services[key]
  }
  compose.services[env.service_name] ??= {}
  const service = compose.services[env.service_name]
  service.image = 'ghcr.io/servercontainers/samba'
  service.container_name = 'samba'
  service.network_mode = 'host'
  service.environment ??= {}
  service.environment.AVAHI_DISABLE = 1
  return service
}

function createShareCommand() {
  const share = new Command('share')
  share.description('Manage samba shares')
  share
    .command('create')
    .alias('add')
    .description(`create a new share in compose file`)
    .argument('<name>', 'share name')
    .option('--read-only', 'make share readonly', false)
    .option('--no-browsable', 'hide share in the list of available shares in a new view and in the browse list')
    .action(async (name, options) => {
      if (isSpecialShare(name)) {
        return throwAndExit(`Share name "${name}" is not allowed`)
      }
      assertShareName(name)
      const compose = await readCompose()
      const service = ensureSambaService(compose)
      const shares = listShares(service, { preserveCase: false })
      if (shares.some(s => s.name === name.toLowerCase())) {
        return throwAndExit(`Share "${name}" already exists`)
      }
      service.environment ??= {}
      service.environment[`SAMBA_VOLUME_CONFIG_${name.toLowerCase()}`] = stringifySambaComfig({
        name,
        parameters: {
          path: join(env.target_root, name),
          readonly: options.readOnly ?? false,
          browseable: options.browsable ?? true,
          guestok: true,
        },
      })
      service.volumes ??= []
      service.volumes.push({
        type: 'bind',
        source: join(env.source_root, name),
        target: join(env.target_root, name),
      })
      await fsp.mkdir(join(env.source_root, name), { recursive: true })
      await writeCompose(compose)
    })

  share
    .command('rm')
    .description('remove share from compose file')
    .argument('<name>', 'share name')
    .option('--remove-dir', 'remove share directory from host')
    .action(async (name, options) => {
      const compose = await readCompose()
      const service = ensureSambaService(compose)
      const shares = listShares(service, { preserveCase: false })
      const targetShare = shares.find(s => s.name === name.toLowerCase())
      if (!targetShare) {
        return throwAndExit(`Share "${name}" does not exist`)
      }

      if (targetShare.siblings.length === 0) {
        delete service.environment![targetShare.source]
      } else {
        service.environment![targetShare.source] = stringifySambaComfig(targetShare.siblings)
      }
      if (service.volumes) {
        service.volumes = service.volumes.filter((volume) => {
          return typeof volume === 'object' && volume.target.endsWith(`/${name}`)
        })
      }
      if (options.removeDir) {
        try {
          await fsp.rmdir(join(env.source_root, name))
        } catch (err: any) {
          if (err.code !== 'ENOENT') {
            return throwAndExit(`Failed to delete share directory: ${err.message}`)
          }
        }
      }
      await writeCompose(compose)
    })

  share
    .command('ls')
    .alias('list')
    .description('list shares')
    .action(async () => {
      const compose = await readCompose()
      const service = ensureSambaService(compose)
      const shares = listShares(service)
      if (shares.length) {
        console.log(shares.map(s => s.name).join('\n'))
      }
    })
  return share
}

function createReloadCommand() {
  return new Command('reload')
    .description('Reload samba instance')
    .action(async () => {
      await ensureCompose()
      await execa('docker', ['compose', 'up', '-d'], {
        cwd: dirname(env.compose_file),
      })
    })
}

function createStatusCommand() {
  return new Command('status')
    .description('Status of samba instance')
    .action(async () => {
      await ensureCompose()
      const { stdout } = await execa('docker', ['compose', 'ps', '-a', '--format', 'json', env.service_name], {
        cwd: dirname(env.compose_file),
      })
      if (stdout) {
        const container = JSON.parse(stdout)
        console.log(`${container.Status}`)
      } else {
        console.log('Inactive')
      }
    })
}

function createInfoCommand() {
  return new Command('info')
    .description('Returns samba environment details in json format')
    .action(() => {
      console.log(JSON.stringify(env, null, 2))
    })
}

program.addCommand(createShareCommand())
program.addCommand(createReloadCommand())
program.addCommand(createStatusCommand())
program.addCommand(createInfoCommand())
program.name('samba-env').parse()
