import type { KeycloakError, KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js'
import Keycloak from 'keycloak-js'
import type { EventHookOn } from '@vueuse/core'
import { setHeader } from '~/utils/ofetch'

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
  login: () => void
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

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const route = useRoute()
  const locale = useCookie('teleskop_locale')
  const kcConfig = useAppConfig().keycloak
  const kcEnabled = config.public.kcEnabled
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
    onReady.trigger(auth)
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

  let initPromise: Promise<any>

  if (kcEnabled) {
    if (kcConfig?.loginRequired) {
      initPromise = keycloak.init({
        onLoad: 'login-required',
        locale: locale.value || 'en-US',
        enableLogging: kcConfig?.enableLogging ?? import.meta.env.DEV,
      })
    } else {
      initPromise = keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${location.origin}/api/check-sso`,
        messageReceiveTimeout: 5000,
        enableLogging: kcConfig?.enableLogging ?? import.meta.env.DEV,
      })
    }
    initPromise.finally(() => {
      didInitialise.value = true
    })
  } else {
    ready.value = true
    authenticated.value = true
    didInitialise.value = true
  }

  const noop = () => {}

  const login = () => {
    navigateTo(
      keycloak.createLoginUrl({
        redirectUri: `${location.origin}${route.fullPath}`,
        locale: locale.value || 'en',
      }),
      { external: true },
    )
  }

  const logout = () => {
    navigateTo(
      keycloak.createLogoutUrl({
        redirectUri: `${location.origin}${route.fullPath}`,
      }),
      { external: true },
    )
  }

  const register = () => {
    navigateTo(
      keycloak.createRegisterUrl({
        redirectUri: `${location.origin}${route.fullPath}`,
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
        await keycloak.updateToken(kcConfig?.minimumTokenValidity)
        setHeader(context.options, 'Authorization', `Bearer ${token.value}`)
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
