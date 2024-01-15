declare module '#app' {
  interface PageMeta {
    roles?: string[]
    noAuth?: boolean
  }
}

interface AppMeta {
  name: string
  version: string
  buildDate: string
  commitHash: string
}

declare global {
  interface ImportMeta {
    /** App build meta */
    app: AppMeta
  }
  namespace NodeJS {
    interface Process {
      /** App build meta */
      app: AppMeta
    }
  }
}

export {}
