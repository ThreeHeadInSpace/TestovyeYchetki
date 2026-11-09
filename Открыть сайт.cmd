@echo off
node "%~dp0scripts\start.mjs" --open
if errorlevel 1 pause
