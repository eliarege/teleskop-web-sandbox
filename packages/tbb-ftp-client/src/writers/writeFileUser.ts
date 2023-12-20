import type { User } from "../types"

// '/tbb6500/data/users/users'

export function writeFileUser(users: User[]): string {
  const regexStrings = users.map(user => `${user.userId} ${user.userPass} ${user.userName} ${user.userSurname} ${user.userMode} ${user.userMode2} ${user.userType}`)
  return regexStrings.join('\n')
}
