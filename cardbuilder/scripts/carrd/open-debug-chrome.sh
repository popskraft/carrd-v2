#!/usr/bin/env bash

set -euo pipefail

PORT="${CARRD_DEBUG_PORT:-9222}"
CHROME_BIN="${CARRD_DEBUG_CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
ACTIVE_TEMPLATE="/Users/popskraft/Projects/carrd-v2/cardbuilder/data/active-template.json"
SITE_REGISTRY="/Users/popskraft/Projects/carrd-v2/cardbuilder/data/sites.json"
RESOLVE_SITE="/Users/popskraft/Projects/carrd-v2/cardbuilder/scripts/carrd/resolve-site.mjs"

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome binary not found: $CHROME_BIN" >&2
  exit 1
fi

read_site_field() {
  local field="$1"
  node "$RESOLVE_SITE" \
    --registry "$SITE_REGISTRY" \
    --active-template "$ACTIVE_TEMPLATE" \
    --field "$field"
}

SITE_SLUG="$(read_site_field siteSlug)"
BUILDER_URL="$(read_site_field builderUrl)"
PUBLISHED_URL="$(read_site_field publishedSiteUrl)"

REGISTRY_PROFILE_DIR="$(read_site_field chromeProfileDir 2>/dev/null | tr -d '[:space:]')"
PROFILE_DIR="${CARRD_DEBUG_PROFILE:-${REGISTRY_PROFILE_DIR:-$HOME/.codex/chrome-debug-profile}}"

mkdir -p "$PROFILE_DIR"

if [[ -z "$BUILDER_URL" ]]; then
  echo "Resolved site is missing a builder URL." >&2
  exit 1
fi

endpoint="http://127.0.0.1:${PORT}/json/version"

if curl -sf "$endpoint" >/dev/null 2>&1; then
  echo "Debug Chrome already available on port ${PORT}."
else
  echo "Starting debug Chrome on port ${PORT}..."
  chrome_args=(
    --remote-debugging-port="${PORT}"
    --user-data-dir="${PROFILE_DIR}"
    --new-window
    "${BUILDER_URL}"
  )
  if [[ -n "$PUBLISHED_URL" ]]; then
    chrome_args+=("${PUBLISHED_URL}")
  fi
  nohup "$CHROME_BIN" \
    "${chrome_args[@]}" \
    >/tmp/carrd-debug-chrome.log 2>&1 &

  for _ in $(seq 1 30); do
    if curl -sf "$endpoint" >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
fi

if ! curl -sf "$endpoint" >/dev/null 2>&1; then
  echo "Debug Chrome did not become available on port ${PORT}." >&2
  exit 1
fi

echo
echo "Debug Chrome is ready."
echo "Site:      ${SITE_SLUG}"
echo "Builder:   ${BUILDER_URL}"
echo "Published: ${PUBLISHED_URL}"
echo "Version:   ${endpoint}"
echo "Tabs:      http://127.0.0.1:${PORT}/json/list"
