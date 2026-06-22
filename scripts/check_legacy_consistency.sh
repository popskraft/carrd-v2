#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

TARGETS=(src tests-js)
FAILED=0

check_absent() {
  local label="$1"
  local pattern="$2"
  local output_file
  output_file="$(mktemp)"

  if rg -n -e "${pattern}" "${TARGETS[@]}" >"${output_file}"; then
    echo "[FAIL] ${label}"
    cat "${output_file}"
    FAILED=1
  else
    echo "[OK] ${label}"
  fi

  rm -f "${output_file}"
}

echo "Running legacy consistency checks..."

check_absent "Legacy Shopping Cart API (window.CartPlugin)" "window\\.CartPlugin"
check_absent "Legacy Shopping Cart API alias (window.CarrdCart)" "window\\.CarrdCart"
check_absent "Legacy Modal API (window.ModalPlugin)" "window\\.ModalPlugin"
check_absent "Legacy Typography API (window.TypographyPlugin)" "window\\.TypographyPlugin"
check_absent "Legacy columns config bridge (CarrdPluginOptionsV2.columns)" "CarrdPluginOptionsV2\\.columns"

check_absent "Legacy cart class prefix (crt-*)" "\\bcrt-[a-z0-9-]+"
check_absent "Legacy columns container class (custom-grid-container)" "\\bcustom-grid-container\\b"
check_absent "Legacy columns helper class (constrain-width)" "\\bconstrain-width\\b"
check_absent "Legacy typography heading classes (theme-h1..h4)" "\\btheme-h[1-4]\\b"
check_absent "Legacy typography list/hr classes (theme-ul/ol/li/hr)" "\\btheme-(ul|ol|li|hr)\\b"
check_absent "Legacy token prefix (--mini-*)" "--mini-"

if [[ "${FAILED}" -ne 0 ]]; then
  echo
  echo "Legacy consistency check failed."
  exit 1
fi

echo
echo "Legacy consistency check passed."
