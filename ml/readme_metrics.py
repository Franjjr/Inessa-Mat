"""Write the metrics tables of ml/README.md from ml/metrics.json (between the metrics markers).

Usage: python readme_metrics.py [--cnn-ms 0.9] [--e2e-ms 1.2]
  --cnn-ms / --e2e-ms: Node timings printed by `npx vitest run src/ink/ml` ("[ml] CNN inference", "[ml] recognize()").
  They are stored in metrics.json ("timing") so later runs without the flags keep them.
"""
from __future__ import annotations

import argparse
import json
import os
import re

from data_io import HERE

README = os.path.join(HERE, 'README.md')
METRICS = os.path.join(HERE, 'metrics.json')
BEGIN, END = '<!-- metrics:begin -->', '<!-- metrics:end -->'
TBEGIN, TEND = '<!-- timing:begin -->', '<!-- timing:end -->'

NAMES = {
    'mnist_raw': 'MNIST test (original images)',
    'mnist_restroked': 'MNIST test re-stroked with the app pen',
    'heldout_fonts': 'held-out handwriting fonts (never trained on)',
    'synthetic_strokes': 'synthetic child-like strokes (test seed)',
}
PAIRS = ['1<->7', '4<->9', '3<->8', '5<->6', '2<->7']


def tables(m: dict) -> str:
    sets = m['sets']
    rows = ['| test set | digits | accuracy (0-9) | app accuracy | null (asks again) | wrong digit | scribbles rejected |',
            '|---|---:|---:|---:|---:|---:|---:|']
    for k, label in NAMES.items():
        if k not in sets:
            continue
        s = sets[k]
        rej = f'{s["nondigit_rejected_pct"]:.1f} % of {s["n_nondigits"]}' if 'nondigit_rejected_pct' in s else '—'
        rows.append(f'| {label} | {s["n_digits"]} | **{s["accuracy_digits_pct"]:.2f} %** | {s["app_accuracy_pct"]:.2f} % | '
                    f'{s["app_null_rate_pct"]:.2f} % | {s["app_wrong_digit_pct"]:.2f} % | {rej} |')
    rows += ['', 'Confusions between the classic pairs (errors in both directions / digits of both classes, app decision):', '',
             '| test set | ' + ' | '.join(p.replace('<->', '↔') for p in PAIRS) + ' | top confusions (true→pred) |',
             '|---|' + '---:|' * len(PAIRS) + '---|']
    for k, label in NAMES.items():
        if k not in sets:
            continue
        s = sets[k]
        cells = [f'{s["pairs"][p]["errors"]} ({s["pairs"][p]["rate_pct"]:.2f} %)' for p in PAIRS]
        rows.append(f'| {label} | ' + ' | '.join(cells) + ' | ' + ', '.join(s['top_confusions'][:4]) + ' |')
    rows += ['', 'Per-class accuracy (0-9), %:', '', '| test set | ' + ' | '.join(str(d) for d in range(10)) + ' |',
             '|---|' + '---:|' * 10]
    for k, label in NAMES.items():
        if k in sets:
            rows.append(f'| {label} | ' + ' | '.join(f'{v:.1f}' for v in sets[k]['per_class_accuracy_pct']) + ' |')
    rows += ['', f'Model `{m["modelId"]}`' + (f', arch `{m["arch"]}`' if m.get('arch') else '') + '.']
    return '\n'.join(rows)


def replace(text: str, a: str, b: str, body: str) -> str:
    pat = re.compile(re.escape(a) + '.*?' + re.escape(b), re.S)
    if not pat.search(text):
        raise SystemExit(f'markers {a} … {b} not found in README.md')
    return pat.sub(lambda _: f'{a}\n{body}\n{b}', text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cnn-ms', type=float)
    ap.add_argument('--e2e-ms', type=float)
    a = ap.parse_args()
    with open(METRICS) as f:
        m = json.load(f)
    timing = m.get('timing', {})
    if a.cnn_ms is not None:
        timing['cnn_ms'] = a.cnn_ms
    if a.e2e_ms is not None:
        timing['recognize_ms'] = a.e2e_ms
    if timing:
        m['timing'] = timing
        with open(METRICS, 'w') as f:
            json.dump(m, f, indent=1)
    with open(README) as f:
        text = f.read()
    text = replace(text, BEGIN, END, tables(m))
    if timing:
        t = (f'CNN forward pass **{timing["cnn_ms"]:.2f} ms** per digit, full `recognize()` (preprocessing + CNN + '
             f'personalisation) **{timing["recognize_ms"]:.2f} ms** per digit')
        text = replace(text, TBEGIN, TEND, t)
    with open(README, 'w') as f:
        f.write(text)
    print('updated ml/README.md metrics')


if __name__ == '__main__':
    main()
