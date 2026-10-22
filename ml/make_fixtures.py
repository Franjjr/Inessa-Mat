"""Export small shared fixtures for the TS tests in src/ink/ml/__fixtures__/:

  cases.json     stroke cases (every digit + edge cases) with the Python reference preprocessing output
                 (float32 base64), and the reference model output (probs, embedding) for the current model
  writer.json    a simulated child ("odd" style: mirrored 3 that the CNN reads as 8) for personalisation tests

Re-run after every export:  python make_fixtures.py
"""
from __future__ import annotations

import base64
import json
import os

import numpy as np

import synth
from data_io import HERE
from np_infer import NpModel
from preprocess import preprocess_strokes

OUT = os.path.join(HERE, '..', 'src', 'ink', 'ml', '__fixtures__')


def b64f32(a) -> str:
    return base64.b64encode(np.asarray(a, dtype='<f4').tobytes()).decode()


def sparse_image(img) -> dict:
    """Non-zero pixels only: indices (uint16 LE) + values (float32 LE), base64."""
    a = np.asarray(img, dtype='<f4').reshape(-1)
    idx = np.nonzero(a)[0].astype('<u2')
    return {'idx': base64.b64encode(idx.tobytes()).decode(), 'val': b64f32(a[idx])}


def to_ink(strokes, pointer='pen'):
    t = 0.0
    out = []
    for s in strokes:
        pts = []
        for x, y in np.asarray(s):
            pts.append({'x': round(float(x), 1), 'y': round(float(y), 1), 't': int(t)})
            t += 8.0
        t += 120.0
        out.append({'points': pts, 'pointerType': pointer})
    return out


def ink_to_xy(ink):
    return [[(p['x'], p['y']) for p in s['points']] for s in ink]


def place(r: synth.R, strokes, zone=(110.0, 130.0), size=None):
    """Unit-frame strokes -> pixel coordinates inside a DigitCell-like zone."""
    allp = np.concatenate([np.asarray(s) for s in strokes])
    lo = allp.min(0)
    h = max(1e-6, allp.max(0)[1] - lo[1])
    size = size or r.u(70, 100)
    w = (allp.max(0)[0] - lo[0]) / h * size
    off = np.array([(zone[0] - w) / 2 + r.u(-8, 8), (zone[1] - size) / 2 + r.u(-6, 6)])
    return [synth.resample((np.asarray(s) - lo) / h * size + off, 3.0) for s in strokes]


def main():
    os.makedirs(OUT, exist_ok=True)
    m = NpModel()
    r = synth.R(np.random.default_rng(2024))
    zone = {'width': 110.0, 'height': 130.0}
    cases = []

    def add(name, ink, expected, zone_=zone):
        xy = ink_to_xy(ink)
        img = preprocess_strokes(xy, zone_['width'], zone_['height'])
        case = {'name': name, 'expected': expected, 'zone': zone_, 'strokes': ink}
        if img is None:
            case['reference'] = {'image': None}
        else:
            out, emb = m.run(img[None])
            case['reference'] = {'image': sparse_image(img), 'output': [round(float(v), 7) for v in out[0]],
                                 'embedding': [round(float(v), 6) for v in emb[0]]}
        cases.append(case)
        return case

    for d in range(10):
        found = 0
        while found < 3:
            s = synth.augment_strokes(r, synth.DIGITS[d](r), 0.5)
            ink = to_ink(place(r, s))
            img = preprocess_strokes(ink_to_xy(ink), zone['width'], zone['height'])
            out, _ = m.run(img[None])
            if out[0].argmax() == d and out[0][d] > 0.9:
                add(f'digit-{d}-{found}', ink, d)
                found += 1

    add('empty', [], None)
    add('dot', [{'points': [{'x': 50, 'y': 60, 't': 0}], 'pointerType': 'pen'}], None)
    add('tiny-stroke', to_ink([np.array([[50, 60], [52, 61], [53, 63]], float)]), None)
    add('thin-one', to_ink([synth.resample(np.array([[55, 15], [56, 115]], float), 3)]), 1)
    add('dash', to_ink([synth.resample(np.array([[15, 70], [95, 66]], float), 3)]), None)
    for k in range(2):
        add(f'scribble-{k}', to_ink(place(r, synth.augment_strokes(r, synth.scribble(r), 0.6))), None)
    add('cross', to_ink(place(r, synth.augment_strokes(r, synth.symbol(synth.R(np.random.default_rng(3))), 0.3))), None)
    # a tap on the cell before writing (stray dot far from the digit) must be ignored
    seven = cases[[c['name'] for c in cases].index('digit-7-0')]['strokes']
    add('tap-then-7', [{'points': [{'x': 100.0, 'y': 8.0, 't': 0.0}], 'pointerType': 'pen'}] + seven, 7)
    add('dots-only', [{'points': [{'x': 20.0 + 30 * k, 'y': 30.0, 't': 0.0}], 'pointerType': 'touch'} for k in range(3)], None)
    # same "1" drawn at very different sizes / zones must preprocess to (almost) the same image
    one = [np.array([[0.45, 0.25], [0.6, 0.0], [0.58, 1.0]])]
    add('one-small', to_ink([synth.resample(one[0] * 30 + 5, 1.0)]), 1, {'width': 40.0, 'height': 46.0})
    add('one-large', to_ink([synth.resample(one[0] * 300 + 20, 6.0)]), 1, {'width': 360.0, 'height': 380.0})

    with open(os.path.join(OUT, 'cases.json'), 'w') as f:
        json.dump({'modelId': m.spec['modelId'], 'cases': cases}, f, separators=(',', ':'))

    # ---- simulated child with an odd "3" (mirrored, like an epsilon) and natural variation
    w = synth.R(np.random.default_rng(77))
    base = {d: synth.DIGITS[d](w) for d in range(10)}
    base[3] = [np.stack([1 - p[:, 0], p[:, 1]], 1) for p in synth.d3(w)]

    def sample(d, n):
        return [to_ink(place(w, synth.augment_strokes(w, base[d], 0.3))) for _ in range(n)]

    writer = {
        'modelId': m.spec['modelId'],
        'zone': zone,
        'oddDigit': 3,
        'calibration': {str(d): sample(d, 1) for d in range(10)},
        'extraOdd': sample(3, 3),
        'testOdd': sample(3, 10),
        'testNormal': {str(d): sample(d, 3) for d in range(10) if d != 3},
        'testEight': sample(8, 10),
        'testSeven': sample(7, 10),
    }
    with open(os.path.join(OUT, 'writer.json'), 'w') as f:
        json.dump(writer, f, separators=(',', ':'))
    # summary of the CNN alone on the writer's odd digit
    imgs = np.array([preprocess_strokes(ink_to_xy(s), zone['width'], zone['height']) for s in writer['testOdd']])
    out, _ = m.run(imgs)
    print('cases:', len(cases), '| odd style CNN predictions:', out[:, :10].argmax(1).tolist())


if __name__ == '__main__':
    main()
