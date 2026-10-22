"""Measure cosine-similarity statistics of embeddings for simulated writers, to set the personalisation
threshold / temperature stored in model.json ("personalization").

A simulated writer = one fixed style per digit (ml/synth.py base strokes) + natural variation (light
augmentation). Prints quantiles of same-digit vs. different-digit similarities.
Usage: python calibrate_personal.py
"""
from __future__ import annotations

import json
import sys

import numpy as np

import synth
from np_infer import NpModel
from preprocess import preprocess_strokes


def writer_samples(r: synth.R, base, n: int, strength: float = 0.35):
    out = []
    for _ in range(n):
        s = synth.augment_strokes(r, base, strength)
        z, zw, zh = synth.to_zone(r, s)
        out.append(preprocess_strokes(z, zw, zh))
    return np.array(out)


def norm(e):
    return e / np.maximum(1e-9, np.linalg.norm(e, axis=1, keepdims=True))


def main(writers: int = 40, per: int = 6):
    m = NpModel()
    rng = np.random.default_rng(123)
    r = synth.R(rng)
    same, diff = [], []
    for w in range(writers):
        embs = []
        for d in range(10):
            base = synth.DIGITS[d](r)
            _, e = m.run(writer_samples(r, base, per))
            embs.append(norm(e))
        for d in range(10):
            s = embs[d] @ embs[d].T
            iu = np.triu_indices(per, 1)
            same.extend(s[iu].tolist())
            for d2 in range(10):
                if d2 != d:
                    diff.extend((embs[d] @ embs[d2].T).max(1).tolist())
    same, diff = np.array(same), np.array(diff)
    q = [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
    res = {'same': np.quantile(same, q).round(3).tolist(), 'diff_max': np.quantile(diff, q).round(3).tolist(), 'quantiles': q}
    print(json.dumps(res, indent=1))
    return res


if __name__ == '__main__':
    main(*(int(a) for a in sys.argv[1:]))
