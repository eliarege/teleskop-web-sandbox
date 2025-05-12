# Archive Proxy

## Summary

The purpose of the app is to adjust date values returned by the IO Values Server, which runs on Windows machines. It adds the number of calendar days between the last batch and the current date (minus 1) to each date value returned by the server. It's not meant for production.

## Config

See [config.ts](./src/config.ts)
