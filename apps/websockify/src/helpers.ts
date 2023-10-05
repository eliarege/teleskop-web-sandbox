/**
 * Makes it possible to safely destruct properties with defaults.
 * @example
 * // Default value will only be applied if process.env.PORT is undefined
 * const { PORT = '8080' } = process.env
 *
 * // Safely extracts PORT variable and applies defaults if its falsy
 * const { PORT = '8080' } = getEnv(process.env)
 *
 */
export function getEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return new Proxy(env, {
    get(target, key: string) {
      if (target[key]) {
        return target[key]
      } else {
        return undefined
      }
    },
  })
}
