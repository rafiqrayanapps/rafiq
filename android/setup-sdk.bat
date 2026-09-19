@echo off
setlocal

set SCRIPT_DIR=%~dp0
set SDK_DIR=%SCRIPT_DIR%sdk
set CMDLINE_BIN=%SDK_DIR%\cmdline-tools\latest\bin\sdkmanager.bat

echo ==========================================
echo       Android SDK Setup for Rafeeq        
echo ==========================================

echo Installing Android SDK 34 Platform and Build-Tools...
echo y | call "%CMDLINE_BIN%" --sdk_root="%SDK_DIR%" "platforms;android-34" "build-tools;34.0.0" "platform-tools"

echo Android SDK setup completed successfully!
pause
