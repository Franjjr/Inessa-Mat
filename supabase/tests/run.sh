#!/usr/bin/env bash
# Runs the Supabase migration + RLS test suite on a throw-away local Postgres (no Docker, no Supabase account).
# First run creates supabase/.venv with pgserver (bundles Postgres 16 binaries). Needs Python 3.9–3.12.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -x .venv/bin/python ]; then
  PY=""
  for candidate in python3.12 python3.11 python3.10 python3.9 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then PY="$candidate"; break; fi
  done
  if [ -z "$PY" ]; then echo "Python 3 is required"; exit 2; fi
  "$PY" -m venv .venv
  .venv/bin/pip install -q pgserver
fi

exec .venv/bin/python tests/run.py "$@"
