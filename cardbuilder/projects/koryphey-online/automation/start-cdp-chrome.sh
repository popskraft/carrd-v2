#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-9222}"
PROFILE_DIR="${2:-/tmp/chrome-cdp-koryphey}"

open -na "Google Chrome" --args \
  --remote-debugging-port="${PORT}" \
  --user-data-dir="${PROFILE_DIR}"

echo "Chrome started with CDP on port ${PORT}"
echo "Profile: ${PROFILE_DIR}"
echo "Now open these tabs in that Chrome:"
echo "  1) https://carrd.co/dashboard/4544177104830762/build"
echo "  2) https://carrd.co/dashboard/8089177104819774/build"
