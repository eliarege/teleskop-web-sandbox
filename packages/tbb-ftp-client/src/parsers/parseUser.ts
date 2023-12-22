import type { User } from '../types'

/**
 *  '/tbb6500/data/users/users'
 * example: 0 12345 Sadirlar Operator 0x11100150 0x00000003 1
 */
const pattern = /^(\d+) (\d+) ([a-z]+) ([a-z]+) (0x\d+) (0x\d+) (\d+)$/gim
export function parseUser(content: string) {
  const users = []
  let match = pattern.exec(content)
  while (match !== null) {
    const user: User = {
      userId: Number.parseInt(match[1]),
      userPass: match[2],
      userName: match[3],
      userSurname: match[4],
      userMode: match[5],
      userMode2: match[6],
      userType: Number.parseInt(match[7]),
    }
    users.push(user)
    match = pattern.exec(content)
  }
  return users
}
