@echo off

FOR /F "tokens=*" %%i IN ('gh auth token') DO SET "TOKEN=%%i"

act push ^
  -W .\.github\workflows\teleskop-web-sandbox.yml ^
  --eventpath .\.github\event.json ^
  -s GITHUB_TOKEN=%TOKEN% ^
  --env GITHUB_REF=refs/tags/v0.0.1 ^
  --env GITHUB_REF_NAME=v0.0.1 ^
  --artifact-server-path "%CD%\.artifacts" ^
  -P self-hosted=ghcr.io/catthehacker/ubuntu:act-latest ^
  -P docker=ghcr.io/catthehacker/ubuntu:act-latest

