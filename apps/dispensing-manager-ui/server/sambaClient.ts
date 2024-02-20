import SambaClient from 'samba-client'

const sambaClient = new SambaClient({
  address: '//192.168.16.88/public', // required
})

export { sambaClient }
