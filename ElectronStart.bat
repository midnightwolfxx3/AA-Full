@setlocal enableextensions
@cd /d "%~dp0/"

START cmd.exe /k "node_modules\electron\dist\electron.exe start.js"