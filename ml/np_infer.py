"""Reference NumPy inference of the exported model (public/models/digits/model.json + model.bin).

Mirrors src/ink/ml/cnn.ts so that JS-vs-Python parity can be tested on shared fixtures, and checks that the
export (BN folding, layouts) matches the PyTorch model.
"""
from __future__ import annotations

import json
import os

import numpy as np

from data_io import HERE

MODEL_DIR = os.path.join(HERE, '..', 'public', 'models', 'digits')


def _tensor(blob: bytes, spec: dict) -> np.ndarray:
    n = int(np.prod(spec['shape']))
    dtype = spec.get('dtype', 'float32')
    if dtype == 'float32':
        a = np.frombuffer(blob, dtype='<f4', count=n, offset=spec['offset'])
    elif dtype == 'int8':
        q = np.frombuffer(blob, dtype=np.int8, count=n, offset=spec['offset']).astype(np.float32)
        if 'scales' in spec:
            a = q.reshape(spec['shape'][0], -1) * np.asarray(spec['scales'], np.float32)[:, None]
        else:
            a = q * np.float32(spec.get('scale', 1.0))
    else:
        raise ValueError(dtype)
    return a.reshape(spec['shape']).astype(np.float32)


class NpModel:
    def __init__(self, model_dir: str = MODEL_DIR):
        with open(os.path.join(model_dir, 'model.json')) as f:
            self.spec = json.load(f)
        with open(os.path.join(model_dir, self.spec['weights']['file']), 'rb') as f:
            blob = f.read()
        self.layers = []
        for l in self.spec['layers']:
            w = _tensor(blob, l['weight']) if 'weight' in l else None
            b = _tensor(blob, l['bias']) if 'bias' in l else None
            self.layers.append((l, w, b))

    def run(self, x: np.ndarray):
        """x: (N, 784) or (N, 1, 28, 28) -> (output (N, K), embedding (N, E) or None)"""
        x = np.asarray(x, np.float32).reshape([-1] + self.spec['input']['shape'])
        emb = None
        for l, w, b in self.layers:
            t = l['type']
            if t == 'conv2d':
                p = l.get('padding', 0)
                xp = np.pad(x, ((0, 0), (0, 0), (p, p), (p, p)))
                oc, ic, kh, kw = w.shape
                n, _, h, wd = xp.shape
                oh, ow = h - kh + 1, wd - kw + 1
                cols = np.lib.stride_tricks.sliding_window_view(xp, (kh, kw), axis=(2, 3))  # n,ic,oh,ow,kh,kw
                x = np.einsum('nchwij,ocij->nohw', cols, w, optimize=True) + (b[None, :, None, None] if b is not None else 0)
                x = x.astype(np.float32)
            elif t == 'maxpool2d':
                s = l.get('size', 2)
                n, c, h, wd = x.shape
                oh, ow = h // s, wd // s
                x = x[:, :, :oh * s, :ow * s].reshape(n, c, oh, s, ow, s).max(axis=(3, 5))
            elif t == 'flatten':
                x = x.reshape(x.shape[0], -1)
            elif t == 'dense':
                x = (x @ w.T + (b if b is not None else 0)).astype(np.float32)
            elif t == 'relu':
                x = np.maximum(x, 0)
            elif t == 'softmax':
                e = np.exp(x - x.max(axis=1, keepdims=True))
                x = e / e.sum(axis=1, keepdims=True)
            if l.get('activation') == 'relu':
                x = np.maximum(x, 0)
            if l.get('embedding'):
                emb = x.copy()
        return x, emb
