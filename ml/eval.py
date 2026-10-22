"""Evaluate the EXPORTED model (public/models/digits, NumPy reference == TS runtime) on the cached test sets.

Writes ml/metrics.json (summary is embedded into model.json by export.py on the next export).
Usage: python eval.py
"""
from __future__ import annotations

import json
import os

import numpy as np

from data_io import CACHE, HERE
from np_infer import NpModel

TESTS = {
    'mnist_restroked': 'test_mnist_rs',      # MNIST test set re-stroked with the app's uniform pen
    'mnist_raw': 'test_mnist_raw',           # original MNIST test images
    'heldout_fonts': 'test_fonts',           # handwriting fonts never seen in training, augmented
    'synthetic_strokes': 'test_synth',       # parametric child-like stroke digits + scribbles
}
PAIRS = [(1, 7), (4, 9), (3, 8), (5, 6), (2, 7), (3, 5), (0, 6), (8, 9)]
MIN_CONF = 0.35


def app_decision(p: np.ndarray) -> np.ndarray:
    """Mimics recognizer.ts: argmax digit, or -1 (null) if reject wins or confidence < MIN_CONF."""
    top = p[:, :10].argmax(1)
    conf = p[np.arange(len(p)), top]
    null = (p[:, 10] >= conf) | (conf < MIN_CONF)
    return np.where(null, -1, top)


def main():
    m = NpModel()
    report = {'modelId': m.spec['modelId'], 'sets': {}}
    summary = {}
    for name, f in TESTS.items():
        path = os.path.join(CACHE, f + '.npz')
        if not os.path.exists(path):
            continue
        d = np.load(path)
        X, y = d['X'].astype(np.float32) / 255.0, d['y']
        probs = np.concatenate([m.run(X[i:i + 2000])[0] for i in range(0, len(X), 2000)])
        dig = y < 10
        pd = probs[:, :10].argmax(1)
        dec = app_decision(probs)
        cm = np.zeros((10, 11), dtype=int)
        for t, p in zip(y[dig], np.where(dec[dig] < 0, 10, dec[dig])):
            cm[t, p] += 1
        pairs = {}
        for a, b in PAIRS:
            n = cm[a].sum() + cm[b].sum()
            pairs[f'{a}<->{b}'] = {'errors': int(cm[a, b] + cm[b, a]), 'of': int(n),
                                   'rate_pct': round(100 * (cm[a, b] + cm[b, a]) / max(1, n), 3)}
        off = [(int(cm[i, j]), i, j) for i in range(10) for j in range(10) if i != j and cm[i, j]]
        off.sort(reverse=True)
        res = {
            'n_digits': int(dig.sum()),
            'accuracy_digits_pct': round(100 * float((pd[dig] == y[dig]).mean()), 3),
            'app_accuracy_pct': round(100 * float((dec[dig] == y[dig]).mean()), 3),
            'app_null_rate_pct': round(100 * float((dec[dig] < 0).mean()), 3),
            'app_wrong_digit_pct': round(100 * float(((dec[dig] >= 0) & (dec[dig] != y[dig])).mean()), 3),
            'per_class_accuracy_pct': [round(100 * float((pd[y == c] == c).mean()), 2) for c in range(10)],
            'pairs': pairs,
            'top_confusions': [f'{i}->{j}: {n}' for n, i, j in off[:8]],
            'confusion_true_x_pred_with_null': cm.tolist(),
        }
        if (~dig).any():
            res['n_nondigits'] = int((~dig).sum())
            res['nondigit_rejected_pct'] = round(100 * float((dec[~dig] < 0).mean()), 3)
        report['sets'][name] = res
        summary[name] = {k: res[k] for k in ('accuracy_digits_pct', 'app_accuracy_pct', 'app_null_rate_pct')}
        if 'nondigit_rejected_pct' in res:
            summary[name]['nondigit_rejected_pct'] = res['nondigit_rejected_pct']
        print(f'{name:18s} digits acc {res["accuracy_digits_pct"]:6.2f}%  app acc {res["app_accuracy_pct"]:6.2f}%  '
              f'null {res["app_null_rate_pct"]:5.2f}%  wrong {res["app_wrong_digit_pct"]:5.2f}%'
              + (f'  scribbles rejected {res["nondigit_rejected_pct"]:.1f}%' if 'nondigit_rejected_pct' in res else '')
              + f'  top confusions {res["top_confusions"][:4]}')
    report['summary'] = summary
    with open(os.path.join(HERE, 'metrics.json'), 'w') as f:
        json.dump(report, f, indent=1)
    print('wrote ml/metrics.json')


if __name__ == '__main__':
    main()
