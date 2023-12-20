import { TBB6500FtpClient } from "./src/TBBFTPClient";

const client = new TBB6500FtpClient('192.168.88.202')

const data = await client.fetchFinishReasons()
console.log('data = ', data);
