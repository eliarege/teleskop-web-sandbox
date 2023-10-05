declare namespace NodeJS {
  interface ProcessEnv {
    SERVER_HOST?: string
    SERVER_PORT?: string
    TELESKOP_HOST?: string
    TELESKOP_PORT?: string
    TELESKOP_USER?: string
    TELESKOP_PASSWORD?: string
    TELESKOP_DATABASE?: string
    LOG_LEVEL?: string
    NODE_ENV?: 'production' | 'development'
    /** Development environment */
    TARGET_HOST?: string
    /** Development environment */
    TARGET_PORT?: string
  }
}
