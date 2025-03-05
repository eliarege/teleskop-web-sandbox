import type { KeycloakError, KeycloakInitOptions, KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js'
import Keycloak from 'keycloak-js'
import type { EventHookOn } from '@vueuse/core'
import { withBase } from 'ufo'
import { setHeader } from '../utils/ofetch'

export interface KeycloakPlugin {
  fetch: typeof $fetch
  enabled: boolean
  ready: Readonly<Ref<boolean>>
  /** Did keycloak initialise? */
  didInitialise: Readonly<Ref<boolean>>
  /** Access Token */
  token: Readonly<Ref<string | undefined>>
  tokenParsed: Readonly<Ref<KeycloakTokenParsed | undefined>>
  /** Is user authenticated */
  authenticated: Readonly<Ref<boolean>>
  userProfile: Readonly<Ref<KeycloakProfile | undefined>>
  userInfo: Readonly<Ref<Record<string, any> | undefined>>
  /** Redirects to login form. */
  login: (options?: { redirectUri?: string }) => void
  /** Redirects to logout. */
  logout: () => void
  /** Redirects to registration form. */
  register: () => void
  /** Called when keycloak is initialised */
  onReady: EventHookOn<boolean>
  /** Called when a user is successfully authenticated. */
  onAuthSuccess: EventHookOn
  /** Called if there was an error during authentication. */
  onAuthError: EventHookOn<KeycloakError>
  /** Called when the token is refreshed. */
  onAuthRefreshSuccess: EventHookOn
  /** Called if there was an error while trying to refresh the token. */
  onAuthRefreshError: EventHookOn
  /** Called if the user is logged out (will only be called if the session status iframe is enabled. */
  onAuthLogout: EventHookOn
  /** Called when the access token is expired. If a refresh token is available the token can be refreshed with updateToken, or in cases where it is not (that is, with implicit flow) you can redirect to the login screen to obtain a new access token. */
  onTokenExpired: EventHookOn
  /** Called when a AIA has been requested by the application. */
  onActionUpdate: EventHookOn<'success' | 'cancelled' | 'error'>
  /** Returns true if the token has the given realm role. */
  hasRealmRole: Keycloak['hasRealmRole']
  /** Returns true if the token has the given role for the resource (resource is optional, if not specified clientId is used). */
  hasResourceRole: Keycloak['hasResourceRole']
  /** Returns true if the token has less than minValidity seconds left before it expires (minValidity is optional, if not specified 0 is used). */
  isTokenExpired: Keycloak['isTokenExpired']
  /** If the token expires within minValidity seconds (minValidity is optional, if not specified 5 is used) the token is refreshed. If -1 is passed as the minValidity, the token will be forcibly refreshed. If the session status iframe is enabled, the session status is also checked. */
  updateToken: Keycloak['updateToken']
  /**
   * Clear authentication state, including tokens. This can be useful if application has detected the session was expired, for example if updating token fails.
   *
   * Invoking this results in onAuthLogout callback listener being invoked.
   */
  clearToken: Keycloak['clearToken']
  /** Loads the users info. Updates `userInfo` ref */
  loadUserInfo: () => void
  /** Loads the users profile. Updates `userProfile` ref */
  loadUserProfile: () => void
}

declare module 'keycloak-js' {
  interface KeycloakTokenParsed {
    // profile scope
    name?: string
    preferred_username?: string
    full_name?: string
    birthdate?: string
    gender?: string
    profile?: string
    picture?: string
    website?: string
    username?: string
    zoneinfo?: string
    nickname?: string
    updated_at?: number
    family_name?: string
    given_name?: string
    locale?: string
    middle_name?: string
    // email scope
    email?: string
    email_verified?: boolean
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const locale = useCookie('teleskop_locale')
  const kcConfig = useAppConfig().keycloak
  const kcEnabled = config.public.kcEnabled
  const kcScope = 'openid profile email'
  const keycloak = new Keycloak({
    url: config.public.kcUrl,
    realm: config.public.kcRealm,
    clientId: config.public.kcClientId,
  })
  const ready = ref(false)
  const didInitialise = ref(false)
  const token = ref<string>()
  const tokenParsed = ref<KeycloakTokenParsed>()
  const authenticated = ref(false)
  const userProfile = ref<KeycloakProfile>()
  const userInfo = ref<Record<string, any>>()
  const route = useRoute()

  const onReady = createEventHook<boolean>()
  const onAuthSuccess = createEventHook()
  const onAuthError = createEventHook<KeycloakError>()
  const onAuthRefreshSuccess = createEventHook()
  const onAuthRefreshError = createEventHook()
  const onAuthLogout = createEventHook()
  const onTokenExpired = createEventHook()
  const onActionUpdate = createEventHook<'success' | 'cancelled' | 'error'>()

  keycloak.onReady = (auth) => {
    ready.value = true
    onReady.trigger(auth ?? false)
  }
  keycloak.onAuthSuccess = () => {
    authenticated.value = true
    token.value = keycloak.token
    tokenParsed.value = keycloak.tokenParsed
    onAuthSuccess.trigger()
  }
  keycloak.onAuthError = err => onAuthError.trigger(err)
  keycloak.onAuthRefreshSuccess = () => {
    token.value = keycloak.token
    onAuthRefreshSuccess.trigger()
  }
  keycloak.onAuthRefreshError = () => onAuthRefreshError.trigger()
  keycloak.onAuthLogout = () => {
    authenticated.value = false
    token.value = undefined
    tokenParsed.value = undefined
    userInfo.value = undefined
    userProfile.value = undefined
    onAuthLogout.trigger()
  }
  keycloak.onTokenExpired = () => onTokenExpired.trigger()
  keycloak.onActionUpdate = status => onActionUpdate.trigger(status)

  if (kcEnabled) {
    let initPromise: Promise<any>
    const initOptions: KeycloakInitOptions = {
      flow: 'standard',
      scope: kcScope,
      enableLogging: kcConfig?.enableLogging ?? import.meta.dev,
      pkceMethod: 'S256',
    }
    if (kcConfig?.loginRequired) {
      initPromise = keycloak.init({
        ...initOptions,
        onLoad: 'login-required',
        locale: locale.value || 'en-US',
      })
    } else {
      initPromise = keycloak.init({
        ...initOptions,
        onLoad: 'check-sso',
        checkLoginIframe: window.isSecureContext,
        silentCheckSsoRedirectUri: withBase('/api/check-sso', withBase(config.app.baseURL, location.origin)),
      })
    }
    initPromise.finally(() => {
      didInitialise.value = true
      // Supported parameters for standard flow: https://github.com/keycloak/keycloak-js/blob/52c8ad8f2e75123dfd1c5a4f6ef6c76ce2fd9be4/lib/keycloak.js#L1039
      let cleanHash = location.hash
        .replaceAll(/[#&](?:code|state|session_state|iss|kc_action(?:_status)?)=[^#&]*/g, '')

      if (cleanHash.length && !cleanHash.startsWith('#')) {
        cleanHash = `#${cleanHash}`
      }
      navigateTo(route.path + location.search + cleanHash, { replace: true })
    })
  } else {
    ready.value = true
    authenticated.value = true
    didInitialise.value = true
  }

  const noop = () => {}

  const login = (options?: { redirectUri?: string }) => {
    navigateTo(
      keycloak.createLoginUrl({
        locale: locale.value || 'en',
        redirectUri: options?.redirectUri,
      }),
      { external: true },
    )
  }

  const logout = () => {
    navigateTo(
      keycloak.createLogoutUrl(),
      { external: true },
    )
  }

  const register = () => {
    navigateTo(
      keycloak.createRegisterUrl({
        locale: locale.value || 'en',
      }),
      { external: true },
    )
  }

  const updateToken = async (minimumTokenValidity?: number): Promise<boolean> => {
    return keycloak.updateToken(minimumTokenValidity ?? kcConfig?.minimumTokenValidity)
  }

  const loadUserProfile = async () => {
    await updateToken()
    await keycloak.loadUserProfile()
    userProfile.value = keycloak.profile
  }

  const loadUserInfo = async () => {
    await updateToken()
    await keycloak.loadUserInfo()
    userInfo.value = keycloak.userInfo
  }

  const fetch = $fetch.create({
    async onRequest(context) {
      if (kcEnabled) {
        if (!token.value && !didInitialise.value) {
          await until(didInitialise).toBe(true)
        }
        if (token.value) {
          await keycloak.updateToken(kcConfig?.minimumTokenValidity)
          setHeader(context.options, 'Authorization', `Bearer ${token.value}`)
        }
      }
    },
  })

  const hasRealmRole = (role: string) => {
    return tokenParsed.value?.realm_access?.roles.includes(role) ?? false
  }

  const hasResourceRole = (role: string, resource = config.public.kcClientId) => {
    return tokenParsed.value?.resource_access?.[resource]?.roles.includes(role) ?? false
  }

  return {
    provide: {
      keycloak: {
        fetch,
        enabled: kcEnabled,
        ready: readonly(ready),
        didInitialise: readonly(didInitialise),
        token: readonly(token),
        tokenParsed: readonly(tokenParsed),
        authenticated: readonly(authenticated),
        userProfile: readonly(userProfile),
        userInfo: readonly(userInfo),
        login: kcEnabled ? login : noop,
        logout: kcEnabled ? logout : noop,
        register: kcEnabled ? register : noop,
        onReady: onReady.on,
        onAuthSuccess: onAuthSuccess.on,
        onAuthError: onAuthError.on,
        onAuthRefreshSuccess: onAuthRefreshSuccess.on,
        onAuthRefreshError: onAuthRefreshError.on,
        onAuthLogout: onAuthLogout.on,
        onTokenExpired: onTokenExpired.on,
        onActionUpdate: onActionUpdate.on,
        hasRealmRole: kcEnabled ? hasRealmRole : () => true,
        hasResourceRole: kcEnabled ? hasResourceRole : () => true,
        isTokenExpired: kcEnabled ? keycloak.isTokenExpired : () => false,
        updateToken: kcEnabled ? updateToken : noop,
        // No need to wrap this since its already handled by `onAuthLogout` listener
        clearToken: kcEnabled ? keycloak.clearToken : noop,
        loadUserInfo: kcEnabled ? loadUserInfo : noop,
        loadUserProfile: kcEnabled ? loadUserProfile : noop,
      } as KeycloakPlugin,
    },
  }
})
