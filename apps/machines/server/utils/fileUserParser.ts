// '../../tbb6500/data/users/users'
export function fileUserParser(content: string) {
  const pattern = /^(\d+) (\d+) ([a-z]+) ([a-z]+) (0x\d+) (0x\d+) (\d+)$/gim

  const users = []
  let match = pattern.exec(content)
  while (match !== null) {
    const user = {
      userId: match[1],
      userPass: match[2],
      userName: match[3],
      userSurname: match[4],
      userMode: match[5],
      userMode2: match[6],
      userType: match[7],
    }
    users.push(user)
    match = pattern.exec(content)
  }
  return users
}
