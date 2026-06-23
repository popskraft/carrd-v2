#!/usr/bin/env bash

set -euo pipefail

PORT="${CARRD_DEBUG_PORT:-9222}"
LIST_URL="http://127.0.0.1:${PORT}/json/list"
VERSION_URL="http://127.0.0.1:${PORT}/json/version"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for debug-chrome-status.sh" >&2
  exit 1
fi

if ! curl -sf "$VERSION_URL" >/dev/null 2>&1; then
  echo "No debug Chrome detected on port ${PORT}." >&2
  exit 1
fi

echo "Version:"
curl -sf "$VERSION_URL" | jq '{Browser, "Protocol-Version", webSocketDebuggerUrl}'
echo
echo "Tabs:"
curl -sf "$LIST_URL" | jq '.[] | select(.type == "page") | {id, title, url, webSocketDebuggerUrl}'

