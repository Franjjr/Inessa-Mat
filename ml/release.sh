#!/usr/bin/env bash
# Full retraining pipeline. Run from anywhere:  bash ml/release.sh [--quick] [--arch v2] [--epochs 14]
set -euo pipefail
cd "$(dirname "$0")"
PY=.venv/bin/python
QUICK=""; ARCH=v2; EPOCHS=14
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
cd .. && npx vitest run src/ink/ml
