#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

FAILED=0

TARGET_FILES=(
  "README.md"
  "package.json"
  "scripts/templates/plugin_readme.md"
  "docs/specs/carrd-markup-contract.md"
  "docs/specs/plugin-data-contract.md"
  "cardbuilder/data/sites.json"
  "cardbuilder/projects/faktura/data/manifests/site-profile.json"
)

while IFS= read -r file; do
  TARGET_FILES+=("${file}")
done < <(find src -type f \( -name '*.js' -o -name '*.css' -o -name 'README.md' \) | sort)

while IFS= read -r file; do
  TARGET_FILES+=("${file}")
done < <(find tests-js -type f -name '*.js' ! -name 'backward-compat.test.js' | sort)

while IFS= read -r file; do
  TARGET_FILES+=("${file}")
done < <(find cardbuilder/projects/main-template/automation -type f | sort)

while IFS= read -r file; do
  TARGET_FILES+=("${file}")
done < <(find cardbuilder/projects/faktura/automation -type f | sort)

search_pattern() {
  local pattern="$1"
  local label="$2"
  local output_file
  output_file="$(mktemp)"

  if rg -n -e "${pattern}" "${TARGET_FILES[@]}" >"${output_file}"; then
    echo "[FAIL] ${label}"
    cat "${output_file}"
    FAILED=1
  else
    local status="$?"
    if [[ "${status}" -eq 1 ]]; then
      echo "[OK] ${label}"
    else
      echo "[FAIL] ${label}"
      FAILED=1
    fi
  fi

  rm -f "${output_file}"
}

check_paths() {
  local output_file
  output_file="$(mktemp)"

  if find src tests-js cardbuilder/projects/main-template/automation cardbuilder/projects/faktura/automation -type f -name '*-v2*' | sort >"${output_file}" && [[ -s "${output_file}" ]]; then
    echo "[FAIL] Clean file paths"
    cat "${output_file}"
    FAILED=1
  else
    echo "[OK] Clean file paths"
  fi

  rm -f "${output_file}"
}

echo "Running clean contract checks..."

check_paths
search_pattern 'CarrdPluginOptionsV2' 'Legacy config namespace'
search_pattern '\bCarrd[A-Za-z0-9]+V2\b' 'Legacy V2 globals'
search_pattern 'data-[a-z0-9-]*-v2[a-z0-9-]*' 'Legacy V2 data attributes'
search_pattern '\btheme-core-v2\b' 'Legacy theme-core-v2 bundle name'
search_pattern '/dist/[a-z0-9-]+-v2/' 'Legacy dist plugin paths'
search_pattern '/dist/theme-core-v2' 'Legacy theme bundle path'
search_pattern '\b(sync-v2|migrate-v2)\b' 'Legacy automation names'

if [[ "${FAILED}" -ne 0 ]]; then
  echo
  echo "Clean contract check failed."
  exit 1
fi

echo
echo "Clean contract check passed."
