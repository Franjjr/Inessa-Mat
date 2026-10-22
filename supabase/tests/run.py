#!/usr/bin/env python3
"""Verify supabase/migrations against a throw-away local Postgres 16 (pgserver, pip-installable, no Docker).

    supabase/tests/run.sh            # creates supabase/.venv on first run
    supabase/.venv/bin/python supabase/tests/run.py [--keep]

Steps: start Postgres in a temp dir → fresh database → Supabase stub (auth schema, roles) → every migration TWICE
(must be idempotent) → test helpers → every tests/NN_*.sql file except the stub/helpers. Each passing check prints
"ok - …"; any FAIL or SQL error makes the run fail (exit code 1).
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import tempfile
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
MIGRATIONS = sorted((ROOT / "migrations").glob("*.sql"))
STUB = HERE / "00_supabase_stub.sql"
HELPERS = HERE / "01_test_helpers.sql"
SUITES = [p for p in sorted(HERE.glob("[0-9][0-9]_*.sql")) if p not in (STUB, HELPERS)]

GREEN, RED, DIM, RESET = "\033[32m", "\033[31m", "\033[2m", "\033[0m"
if not sys.stdout.isatty():
    GREEN = RED = DIM = RESET = ""


def main() -> int:
    try:
        import pgserver  # type: ignore
    except ImportError:
        print("pgserver is not installed. Run supabase/tests/run.sh (it creates supabase/.venv).")
        return 2

    keep = "--keep" in sys.argv
    data_dir = Path(tempfile.mkdtemp(prefix="numeria-pg-"))
    psql = Path(pgserver.__file__).parent / "pginstall" / "bin" / "psql"
    server = pgserver.get_server(str(data_dir), cleanup_mode=None if keep else "delete")
    try:
        admin_uri = server.get_uri()
        run_psql(psql, admin_uri, "drop database if exists numeria_test;")
        run_psql(psql, admin_uri, "create database numeria_test;")
        uri = admin_uri.replace("/postgres?", "/numeria_test?")

        steps: list[tuple[str, Path]] = [("stub", STUB)]
        for m in MIGRATIONS:
            steps += [("migration", m), ("migration (re-run: idempotency)", m)]
        steps.append(("helpers", HELPERS))

        for label, path in steps:
            out = run_file(psql, uri, path, stop_on_error=True)
            if out.returncode != 0:
                print(f"{RED}✗ {label}: {path.name}{RESET}")
                print(out.stdout[-4000:], out.stderr[-4000:])
                return 1
            print(f"{GREEN}✓{RESET} {label}: {path.name}")

        total_ok = total_fail = 0
        for suite in SUITES:
            out = run_file(psql, uri, suite, stop_on_error=False)
            text = out.stdout + "\n" + out.stderr
            oks = re.findall(r"NOTICE:\s+ok - (.*)", text)
            errors = [line for line in text.splitlines() if re.search(r"\bERROR:", line)]
            print(f"\n{suite.name}")
            for msg in oks:
                print(f"  {GREEN}ok{RESET} {DIM}{msg}{RESET}")
            for line in errors:
                print(f"  {RED}{line.strip()}{RESET}")
            total_ok += len(oks)
            total_fail += len(errors)

        # Re-applying on a project that already holds data must also be safe.
        for m in MIGRATIONS:
            out = run_file(psql, uri, m, stop_on_error=True)
            if out.returncode != 0:
                print(f"{RED}✗ migration re-run with data: {m.name}{RESET}")
                print(out.stdout[-4000:], out.stderr[-4000:])
                total_fail += 1
            else:
                print(f"{GREEN}✓{RESET} migration re-run with data: {m.name}")

        colour = GREEN if total_fail == 0 else RED
        print(f"\n{colour}{total_ok} passed, {total_fail} failed{RESET}")
        if keep:
            print(f"database kept running: {uri}")
        return 0 if total_fail == 0 else 1
    finally:
        if not keep:
            try:
                server.cleanup()
            except Exception:
                pass
            shutil.rmtree(data_dir, ignore_errors=True)


def run_psql(psql: Path, uri: str, sql: str) -> None:
    subprocess.run([str(psql), uri, "-v", "ON_ERROR_STOP=1", "-q", "-c", sql], check=True, capture_output=True, text=True)


def run_file(psql: Path, uri: str, path: Path, stop_on_error: bool) -> subprocess.CompletedProcess[str]:
    args = [str(psql), uri, "-q", "-X", "-v", f"ON_ERROR_STOP={1 if stop_on_error else 0}", "-f", str(path)]
    env = {**os.environ, "PGOPTIONS": "-c client_min_messages=notice"}
    return subprocess.run(args, capture_output=True, text=True, env=env)


if __name__ == "__main__":
    sys.exit(main())
