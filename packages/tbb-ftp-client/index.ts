import { FTPClient } from "./src/TBBFTPClient";


const client = new FTPClient('192.168.88.202')

const data = await client.fetchCommandIO()
console.log('data = ', data);
