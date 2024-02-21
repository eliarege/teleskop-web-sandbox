import SambaClient from 'samba-client'

const config = useRuntimeConfig()

const sambaClient = new SambaClient({
  address: config.sambaPath, // required
})

export { sambaClient }
