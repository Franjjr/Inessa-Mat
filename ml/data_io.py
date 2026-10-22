"""Dataset loading helpers (MNIST idx files)."""
from __future__ import annotations

import gzip
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
CACHE = os.path.join(HERE, 'cache')


def load_mnist(split: str = 'train'):
    prefix = 'train' if split == 'train' else 't10k'
    d = os.path.join(DATA, 'mnist')
    with gzip.open(os.path.join(d, f'{prefix}-images-idx3-ubyte.gz'), 'rb') as f:
        imgs = np.frombuffer(f.read(), dtype=np.uint8, offset=16).reshape(-1, 28, 28)
    with gzip.open(os.path.join(d, f'{prefix}-labels-idx1-ubyte.gz'), 'rb') as f:
        labels = np.frombuffer(f.read(), dtype=np.uint8, offset=8)
    return imgs, labels.astype(np.int64)
