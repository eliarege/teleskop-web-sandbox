declare module '*?base64' {
  const src: string
  export default src
}

declare module '*.ne' {
  const compiledRules: import('nearley').CompiledRules
  export default compiledRules
}
