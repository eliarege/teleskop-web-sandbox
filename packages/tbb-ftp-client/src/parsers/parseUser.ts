import type { User } from '../types'
import { splitLines } from '../utils/common'
import { tokenize } from '../utils/tokenize'

/**
 * **Path**: `/tbb6500/data/users/users`
 *
 * **Example**:
 * ```txt
 * 0 12345 Sadirlar Operator 0x11100150 0x00000003 1
 * ```
 */
export function parseUser(content: string) {
  const lines = splitLines(content)
  const users: Omit<User, 'userInfo' | 'userActive'>[] = []

  for (const line of lines) {
    const tokens = tokenize(line)
    users.push({
      userId: tokens.get(0, 'integer'),
      userPass: tokens.get(1, 'string'),
      userName: tokens.get(2, 'string'),
      userSurname: tokens.get(3, 'string'),
      userMode: tokens.get(4, 'string'),
      userMode2: tokens.get(5, 'string'),
      userType: tokens.get(6, 'integer'),
    })
  }
  return users
}

export function serializeUser(users: User[]): string {
  const regexStrings = users.map(user => [
    user.userId,
    user.userPass,
    user.userName,
    user.userSurname,
    user.userMode,
    user.userMode2,
    user.userType,
  ].join(' '))
  return regexStrings.join('\n')
}
