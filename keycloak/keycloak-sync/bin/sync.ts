import { readFile, readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import consola from 'consola'
import objectHash from 'object-hash'
import type { ErrorObject } from 'ajv'
import Ajv from 'ajv'
import KcAdminClient from '@keycloak/keycloak-admin-client'
import type ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation'
import type GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation'
import type RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation'
import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation'

interface PackageJSON {
  name: string
  description?: string
  eliar: EliarMeta
}

interface ManifestJSON {
  roles: AppRole[]
}

interface EliarMeta {
  type: 'nuxt' | 'node'
  port: number
  outDir: string
}

interface AppRole {
  name: string
  description?: string
}

interface SyncedAppRole extends AppRole {
  clientId: string
  representation: RoleRepresentation
}

interface App {
  name: string
  clientId: string
  roles: SyncedAppRole[]
  pkg: PackageJSON
  manifest?: ManifestJSON
}

interface MappingsRepresentation {
  clientMappings: Record<string, {
    id: string
    client: string
    mappings: RoleRepresentation[]
  }>
}

const isDevContainer = !!process.env.REMOTE_CONTAINERS_IPC

const KEYCLOAK_URL = `http://${isDevContainer ? 'keycloak' : 'localhost'}:8080`
const KEYCLOAK_REALM = 'teleskop-web'
const KEYCLOAK_TOKEN_INSPECTOR = 'keycloak-token-inspector'
const ADMIN_GROUP = 'admin'
const USER_GROUP = 'user'
const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const APP_DIR = resolve(ROOT_DIR, 'apps')
const SCHEMA_DIR = resolve(ROOT_DIR, 'schemas')

async function readJSON(path: string, { strict } = { strict: true }) {
  return JSON.parse(await readFile(path, 'utf-8').catch((e) => {
    if (!strict && e.code === 'ENOENT') {
      return 'null'
    } else {
      throw e
    }
  }))
}

function upperFirst(str: string) {
  return str[0].toUpperCase() + str.slice(1)
}

function toTitleCase(str: string) {
  return str.split('-').map(upperFirst).join(' ')
}

function getManifestJson(appName: string): Promise<ManifestJSON | undefined> {
  return readJSON(join(APP_DIR, appName, 'manifest.json'), { strict: false })
}

function getPackageJson(appName: string): Promise<PackageJSON> {
  return readJSON(join(APP_DIR, appName, 'package.json'))
}

function getClientRepresentation(app: App): ClientRepresentation {
  const appType = app.pkg.eliar.type
  if (!appType) {
    throw new Error(`"eliar" key undefined in "apps/${app.name}"`)
  } else if (appType === 'nuxt') {
    const appPort = app.pkg.eliar.port || 3000
    return {
      clientId: app.name,
      enabled: true,
      name: toTitleCase(app.name),
      description: app.pkg.description,
      publicClient: true,
      webOrigins: [
        `http://127.0.0.1:${appPort}`,
        `http://localhost:${appPort}`,
        ...(isDevContainer ? [
          `http://app:${appPort}`,
          `http://${app.name}:${appPort}`
        ] : [])
      ],
      redirectUris: [
        `http://127.0.0.1:${appPort}/*`,
        `http://localhost:${appPort}/*`,
        ...(isDevContainer ? [
          `http://app:${appPort}`,
          `http://${app.name}:${appPort}`
        ] : [])
      ],
    }
  } else if (appType === 'node') {
    return {
      clientId: app.name,
      enabled: true,
      name: toTitleCase(app.name),
      description: app.pkg.description,
      publicClient: false,
      bearerOnly: true,
    }
  } else {
    throw new Error(`Unknown app type defined at "apps/${app.name}": ${appType}`)
  }
}

async function ensureGroup(admin: KcAdminClient, groupName: string): Promise<GroupRepresentation> {
  const groups = await admin.groups.find()
  const group = groups.find(g => g.name === groupName)
  return group || admin.groups.create({ name: groupName })
}

async function ensureRealm(admin: KcAdminClient, realmName: string): Promise<void> {
  const exists = await admin.realms.findOne({ realm: realmName }).catch(() => null)
  if (!exists) {
    await admin.realms.create({
      realm: realmName,
      enabled: true,
      displayName: toTitleCase(realmName),
      internationalizationEnabled: true,
      defaultLocale: 'en',
      supportedLocales: ['en', 'tr'],
    })
    consola.info(`Created realm ${realmName}`)
  }
}

async function ensureUser(admin: KcAdminClient, username: string, representation: Omit<UserRepresentation, 'username'>): Promise<UserRepresentation> {
  const users = await admin.users.find()
  const user = users.find(u => u.username === username)
  return user || admin.users.create({
    ...representation,
    enabled: true,
    username,
  })
}

async function syncClient(admin: KcAdminClient, app: App, clients: ClientRepresentation[]): Promise<string> {
  const clientRepresentation = getClientRepresentation(app)
  const currentHash = objectHash(clientRepresentation)
  const client = clients.find(c => c.clientId === app.name)

  if (!client) {
    const createdClient = await admin.clients.create({
      ...clientRepresentation,
      attributes: {
        devHash: currentHash,
      },
    })
    consola.info(`Created client "${app.name}"`)
    return createdClient.id
  } else {
    const prevHash = client.attributes?.devHash
    if (currentHash !== prevHash) {
      consola.info(`Updated client "${app.name}"`)
      await admin.clients.update({ id: client.id! }, {
        ...clientRepresentation,
        attributes: {
          devHash: currentHash,
        },
      })
    }
    return client.id!
  }
}

async function syncClientRoles(admin: KcAdminClient, clientId: string, clientName: string, manifest: ManifestJSON): Promise<SyncedAppRole[]> {
  const prevRoles = await admin.clients.listRoles({ id: clientId })
  const currentRoles = manifest.roles || []
  let changesMade = false

  for (const role of prevRoles) {
    if (!currentRoles.some(r => r.name === role.name)) {
      await admin.clients.delRole({
        id: clientId,
        roleName: role.name!,
      })
      changesMade = true
    }
  }
  for (const role of currentRoles) {
    if (!prevRoles.some(r => r.name === role.name)) {
      await admin.clients.createRole({
        id: clientId,
        name: role.name,
        description: role.description,
      })
      changesMade = true
    }
  }

  if (changesMade) {
    consola.info(`Updated roles of client "${clientName}"`)
  }

  const kcRoles = await admin.clients.listRoles({ id: clientId })
  return manifest.roles.map(role => ({
    ...role,
    clientId,
    representation: kcRoles.find(kc => kc.name === role.name)!,
  }))
}

async function syncGroupRoleMappings(admin: KcAdminClient, groupName: string, roles: SyncedAppRole[]): Promise<GroupRepresentation> {
  const group = await ensureGroup(admin, groupName)
  const { clientMappings = {} } = await admin.groups.listRoleMappings({ id: group.id! }) as MappingsRepresentation

  const nextRoles = roles
  const prevRoles = Object.values(clientMappings)
    .flatMap(client =>
      client.mappings.map(mapping => ({
        clientId: client.id,
        representation: mapping,
      })),
    )

  let changesMade = false

  for (const prevRole of prevRoles) {
    if (!nextRoles.some(r => r.clientId === prevRole.clientId && r.name === prevRole.representation.name)) {
      await admin.groups.delClientRoleMappings({
        id: group.id!,
        clientUniqueId: prevRole.clientId,
        roles: [{
          id: prevRole.representation.id!,
          name: prevRole.representation.name!,
        }],
      })
      changesMade = true
    }
  }

  for (const nextRole of nextRoles) {
    if (!prevRoles.some(r => r.clientId === nextRole.clientId && r.representation.name === nextRole.name)) {
      await admin.groups.addClientRoleMappings({
        id: group.id!,
        clientUniqueId: nextRole.clientId,
        roles: [{
          id: nextRole.representation.id!,
          name: nextRole.representation.name!,
        }],
      })
      changesMade = true
    }
  }

  if (changesMade) {
    consola.info(`Updated role mappings of group "${groupName}"`)
  }

  return group
}

async function ensureTokenInspectorClient(admin: KcAdminClient, clients: ClientRepresentation[]) {
  if (!clients.some(c => c.clientId === KEYCLOAK_TOKEN_INSPECTOR)) {
    await admin.clients.create({
      clientId: KEYCLOAK_TOKEN_INSPECTOR,
      enabled: true,
      name: 'Keycloak Token Inspector',
      description: 'Used for creating/inspecting tokens in development',
      publicClient: true,
      webOrigins: [
        'http://127.0.0.1:8082',
        'http://localhost:8082',
      ],
      redirectUris: [
        'http://127.0.0.1:8082/*',
        'http://localhost:8082/*',
      ],
    })
  }
}

function serializeAjvErrors(errors: ErrorObject[]) {
  return errors.map(err => `- ${err.instancePath}: ${err.message}`).join('\n')
}

async function main() {
  const ajv = new Ajv({
    schemas: {
      'https://json.schemastore.org/package': true,
    },
  })
  const manifestSchema = await readJSON(join(SCHEMA_DIR, 'manifest.schema.json'))
  const packageSchema = await readJSON(join(SCHEMA_DIR, 'package.schema.json'))
  const validateManifest = ajv.compile(manifestSchema)
  const validatePackage = ajv.compile(packageSchema)
  const admin = new KcAdminClient({
    baseUrl: KEYCLOAK_URL,
  })
  const dirs = await readdir(APP_DIR, { withFileTypes: true })
  const appNames = dirs.filter(d => d.isDirectory()).map(d => d.name)
  await admin.auth({
    username: 'admin',
    password: 'password',
    clientId: 'admin-cli',
    grantType: 'password',
  })

  await ensureRealm(admin, KEYCLOAK_REALM)
  admin.setConfig({ realmName: KEYCLOAK_REALM })

  const apps = new Map<string, App>()
  for (const name of appNames) {
    const pkg = await getPackageJson(name)
    const manifest = await getManifestJson(name)
    if (!validatePackage(pkg)) {
      consola.error(`App "${name}" has invalid "package.json" file:\n`, serializeAjvErrors(validatePackage.errors!))
    } else if (manifest && !validateManifest(manifest)) {
      consola.error(`App "${name}" has invalid "manifest.json" file:\n`, serializeAjvErrors(validateManifest.errors!))
    } else {
      apps.set(name, { name, pkg, manifest, clientId: '', roles: [] })
    }
  }

  const appList = [...apps.values()]
  const clients = await admin.clients.find()

  await ensureTokenInspectorClient(admin, clients)

  for (const app of appList) {
    app.clientId = await syncClient(admin, app, clients)
    if (app.manifest) {
      app.roles = await syncClientRoles(admin, app.clientId, app.name, app.manifest)
    }
  }

  const adminRoles = appList.flatMap(app => app.roles)
  const adminGroup = await syncGroupRoleMappings(admin, ADMIN_GROUP, adminRoles)
  const userGroup = await ensureGroup(admin, USER_GROUP)

  const adminUser = await ensureUser(admin, 'admin', {
    firstName: 'Admin',
    lastName: 'At Eliar',
    email: 'admin@eliar.com',
    credentials: [
      { type: 'password', value: 'password' },
    ],
  })
  const userUser = await ensureUser(admin, 'user', {
    firstName: 'Eliar',
    lastName: 'At Eliar',
    email: 'user@eliar.com',
    credentials: [
      { type: 'password', value: 'password' },
    ],
  })

  if (!adminUser.groups || !adminUser.groups.includes(ADMIN_GROUP)) {
    await admin.users.addToGroup({ id: adminUser.id!, groupId: adminGroup.id! })
  }
  if (!userUser.groups || !userUser.groups.includes(USER_GROUP)) {
    await admin.users.addToGroup({ id: userUser.id!, groupId: userGroup.id! })
  }

  consola.info('Synchronization complete')
}

main().catch((err) => {
  consola.error(err)
  process.exit(1)
})
