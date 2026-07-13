@echo off

set CI_PROJECT_PATH=eliarege/teleskop-web-sandbox
set TARGET_APPS=archive

node .\scripts\detect-file-change.js
