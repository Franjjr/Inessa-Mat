#!/usr/bin/env bash
# Full retraining pipeline. Run from anywhere:  bash ml/release.sh [--quick] [--arch v3] [--epochs 16]
set -euo pipefail
cd "$(dirname "$0")"
PY=.venv/bin/python
QUICK=""; ARCH=v3; EPOCHS=16
while [[ $# -gt 0 ]]; do
  case "$1" in
    --quick) QUICK="--quick"; EPOCHS=2; shift ;;
    --arch) ARCH="$2"; shift 2 ;;
    --epochs) EPOCHS="$2"; shift 2 ;;
    *) echo "unknown arg $1"; exit 1 ;;
  esac
done
$PY fetch_fonts.py
[[ -f data/mnist/train-images-idx3-ubyte.gz ]] || bash get_mnist.sh
$PY build_data.py $QUICK
$PY train.py --arch "$ARCH" --epochs "$EPOCHS" --out cache/model.pt
$PY export.py --ckpt cache/model.pt          # export weights
$PY eval.py                                  # metrics of the exported artefact -> metrics.json
$PY export.py --ckpt cache/model.pt          # re-export with metrics embedded in model.json
$PY make_fixtures.py                         # TS parity fixtures for the new model
LOG=$(mktemp)
(cd .. && npx vitest run src/ink/ml) | tee "$LOG"
CNN_MS=$(grep -o 'CNN inference: [0-9.]*' "$LOG" | grep -o '[0-9.]*$' | head -1)
E2E_MS=$(grep -o 'recognize() end-to-end: [0-9.]*' "$LOG" | grep -o '[0-9.]*$' | head -1)
$PY readme_metrics.py ${CNN_MS:+--cnn-ms $CNN_MS} ${E2E_MS:+--e2e-ms $E2E_MS}   # tables in ml/README.md
rm -f "$LOG"
