#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
SDK_DIR="$DIR/sdk"
CMDLINE_BIN="$SDK_DIR/cmdline-tools/latest/bin/sdkmanager"

echo "=========================================="
echo "      Android SDK Setup for Rafeeq        "
echo "=========================================="

if [ ! -f "$CMDLINE_BIN" ]; then
    echo "❌ sdkmanager not found in $CMDLINE_BIN"
    exit 1
fi

echo "📦 Installing Android SDK 34 Platform and Build-Tools..."
yes | "$CMDLINE_BIN" --sdk_root="$SDK_DIR" "platforms;android-34" "build-tools;34.0.0" "platform-tools"

echo "✅ Android SDK setup completed successfully!"
echo "📍 SDK Directory: $SDK_DIR"
