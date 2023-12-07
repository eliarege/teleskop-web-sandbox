import type { KeycloakError, KeycloakProfile } from 'keycloak-js'
import Keycloak from 'keycloak-js'
import type { EventHookOn } from '@vueuse/core'

export interface KeycloakPlugin {
  ready: Readonly<Ref<boolean>>
  didInitialise: Readonly<Ref<boolean>>
  token: Readonly<Ref<string | undefined>>
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
  const appConfig = useAppConfig()
  const route = useRoute()
  const locale = useCookie('locale')

  const keycloak = new Keycloak({
    url: config.public.kcUrl,
    realm: config.public.kcRealm,
    clientId: config.public.kcClientId,
  })
  const ready = ref(false)
  const didInitialise = ref(false)
  const token = ref<string>()
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

  keycloak.onReady = auth => onReady.trigger(auth)
  keycloak.onAuthSuccess = () => {
    authenticated.value = true
    token.value = keycloak.token
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
    userInfo.value = undefined
    userProfile.value = undefined
    onAuthLogout.trigger()
  }
  keycloak.onTokenExpired = () => onTokenExpired.trigger()
  keycloak.onActionUpdate = status => onActionUpdate.trigger(status)

  let initPromise: Promise<any>

  if (appConfig.loginRequired) {
    initPromise = keycloak.init({
      onLoad: 'login-required',
      locale: locale.value || 'en-US',
    })
  } else {
    initPromise = keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${location.origin}/api/check-sso`,
      messageReceiveTimeout: 5000,
    })
  }

  initPromise.finally(() => {
    didInitialise.value = true
  })

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

  const updateToken = async (minimumTokenValidity?: number) => {
    await keycloak.updateToken(minimumTokenValidity ?? appConfig.minimumTokenValidity)
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

  return {
    provide: {
      keycloak: {
        ready: readonly(ready),
        didInitialise: readonly(didInitialise),
        token: readonly(token),
        authenticated: readonly(authenticated),
        userProfile: readonly(userProfile),
        userInfo: readonly(userInfo),
        login,
        logout,
        register,
        onReady: onReady.on,
        onAuthSuccess: onAuthSuccess.on,
        onAuthError: onAuthError.on,
        onAuthRefreshSuccess: onAuthRefreshSuccess.on,
        onAuthRefreshError: onAuthRefreshError.on,
        onAuthLogout: onAuthLogout.on,
        onTokenExpired: onTokenExpired.on,
        onActionUpdate: onActionUpdate.on,
        hasRealmRole: keycloak.hasRealmRole,
        hasResourceRole: keycloak.hasResourceRole,
        isTokenExpired: keycloak.isTokenExpired,
        updateToken,
        clearToken: keycloak.clearToken,
        loadUserInfo,
        loadUserProfile,
      } as KeycloakPlugin,
    },
  }
})
