declare namespace NodeJS {
  interface ProcessEnv {
    SERVER_HOST?: string
    SERVER_PORT?: string
    TELESKOP_HOST?: string
    TELESKOP_PORT?: string
    TELESKOP_USER?: string
    TELESKOP_PASSWORD?: string
    TELESKOP_DATABASE?: string
    TELESKOP_INSTANCE_NAME?: string

    KC_URL?: string
    KC_REALM?: string
    KC_CLIENT_ID?: string
    /** Enable Keycloak, default value is `false` in development, `true` in production */
    KC_ENABLED?: string

    LOG_LEVEL?: string
    NODE_ENV?: 'production' | 'development' | 'test'
    /** Dev only, ignores `TELESKOP_*` variables when set */
    TARGET_HOST?: string
    /** Dev only */
    TARGET_PORT?: string
  }
}
