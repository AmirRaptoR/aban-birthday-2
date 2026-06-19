#!/usr/bin/env bash
# Reads .env and writes config.js, which the static site loads in the browser.
# Run this once after filling in .env (and again whenever .env changes).
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "No .env found. Copy .env.example to .env and fill it in." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; source .env; set +a

: "${SUPABASE_URL:?SUPABASE_URL missing in .env}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY missing in .env}"

cat > config.js <<EOF
// AUTO-GENERATED from .env by generate-config.sh — do not edit by hand.
window.ABAN_CONFIG = {
  SUPABASE_URL: "${SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}",
};
EOF

echo "Wrote config.js"
