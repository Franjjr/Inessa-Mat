#!/usr/bin/env bash
# Download MNIST (idx gz files) into ml/data/mnist.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data/mnist && cd data/mnist
for f in train-images-idx3-ubyte.gz train-labels-idx1-ubyte.gz t10k-images-idx3-ubyte.gz t10k-labels-idx1-ubyte.gz; do
  [[ -s $f ]] && continue
  curl -sSf -o "$f" "https://ossci-datasets.s3.amazonaws.com/mnist/$f" || curl -sSf -o "$f" "https://storage.googleapis.com/cvdf-datasets/mnist/$f"
done
ls -la
