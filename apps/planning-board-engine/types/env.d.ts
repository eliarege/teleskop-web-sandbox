declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production' | 'test'
    APP_NAME?: string
    APP_VERSION?: string
    SERVER_PORT?: string
  }
}
