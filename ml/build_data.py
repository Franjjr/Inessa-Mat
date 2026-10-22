"""Build training / test sets as uint8 28x28 arrays in ml/cache/*.npz (gitignored).

All images go through ml/preprocess.py (== app preprocessing). Sources:
  mnist_rs   MNIST re-stroked: skeleton -> uniform pen, with stroke-level augmentation
  mnist_raw  MNIST as-is (already 20x20 + centre of mass), for robustness to thick/variable ink
  fonts      handwriting fonts (train fonts only): glyph -> skeleton -> uniform pen, augmented
  synth      parametric child-like stroke digits (ml/synth.py)
  reject     scribbles / symbols (label 10 = "not a digit")

Usage: python build_data.py [--quick]
"""
from __future__ import annotations

import argparse
import os
import time
from multiprocessing import Pool

import numpy as np

import synth
from data_io import CACHE, DATA, load_mnist
from fonts_list import TEST_FONTS, TRAIN_FONTS
from preprocess import LINE_WIDTH, preprocess_segments, preprocess_strokes
from skeleton import font_digit_segments, mnist_to_segments

REJECT = 10


def to_u8(img) -> np.ndarray:
    return np.clip(np.round(img * 255), 0, 255).astype(np.uint8).reshape(28, 28)


def random_lw(r: synth.R, aug: bool) -> float:
    if not aug or r.c(0.4):
        return LINE_WIDTH
    return r.u(1.9, 3.5)


def render_segments_aug(r: synth.R, segs: np.ndarray, aug: bool, strength: float = 1.0):
    if aug:
        xs = np.concatenate([segs[:, 0], segs[:, 2]])
        ys = np.concatenate([segs[:, 1], segs[:, 3]])
        c = np.array([(xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2])
        ext = max(xs.max() - xs.min(), ys.max() - ys.min(), 1e-6)
        tf = synth.augment_points_fn(r, strength * r.u(0.3, 1.0))
        segs = np.concatenate([tf(segs[:, :2], c, ext), tf(segs[:, 2:], c, ext)], 1)
    return preprocess_segments(segs, check_tiny=False, line_width=random_lw(r, aug))


# ------------------------------------------------------------------ workers

def _mnist_worker(args):
    split, idx, variants, seed = args
    X, y = load_mnist(split)
    r = synth.R(np.random.default_rng(seed))
    out, lab = [], []
    for i in idx:
        segs = mnist_to_segments(X[i])
        if len(segs) == 0:
            continue
        for v in range(variants):
            aug = variants > 1 and v > 0 or (variants == 1 and r.c(0.7) and split == 'train')
            img = render_segments_aug(r, segs, aug)
            if img is not None:
                out.append(to_u8(img))
                lab.append(y[i])
    return np.array(out), np.array(lab)


def _font_worker(args):
    path, per_digit, seed, aug_strength = args
    r = synth.R(np.random.default_rng(seed))
    out, lab = [], []
    for d in range(10):
        segs = font_digit_segments(path, d)
        if len(segs) == 0:
            continue
        for v in range(per_digit):
            img = render_segments_aug(r, segs, v > 0, aug_strength)
            if img is not None:
                out.append(to_u8(img))
                lab.append(d)
    return np.array(out), np.array(lab)


def _synth_worker(args):
    n, seed, reject_frac = args
    r = synth.R(np.random.default_rng(seed))
    out, lab = [], []
    for k in range(n):
        if r.c(reject_frac):
            s, zw, zh = synth.make_reject_strokes(r)
            label = REJECT
        else:
            label = k % 10
            s, zw, zh = synth.make_digit_strokes(r, label, r.u(0.4, 1.2))
        img = preprocess_strokes(s, zw, zh, line_width=random_lw(r, True))
        if img is not None:
            out.append(to_u8(img))
            lab.append(label)
    return np.array(out), np.array(lab)


def run(pool, fn, jobs):
    res = pool.map(fn, jobs)
    res = [x for x in res if len(x[0])]
    return np.concatenate([a for a, _ in res]), np.concatenate([b for _, b in res]).astype(np.int64)


def font_path(name: str) -> str:
    return os.path.join(DATA, 'fonts', name.replace(' ', '_') + '.ttf')


def save(name, X, y):
    os.makedirs(CACHE, exist_ok=True)
    np.savez_compressed(os.path.join(CACHE, name + '.npz'), X=X, y=y)
    print(f'  {name}: {len(X)} samples, class counts {np.bincount(y, minlength=11).tolist()}', flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--quick', action='store_true')
    ap.add_argument('--only', default='')
    ap.add_argument('--workers', type=int, default=4)
    a = ap.parse_args()
    q = a.quick
    only = set(a.only.split(',')) if a.only else None
    want = lambda n: only is None or n in only  # noqa: E731
    t0 = time.time()
    with Pool(a.workers) as pool:
        if want('mnist'):
            n = 60000
            chunks = np.array_split(np.arange(n), 64)
            X, y = run(pool, _mnist_worker, [('train', c, 1 if q else 3, 1000 + i) for i, c in enumerate(chunks)])
            save('train_mnist_rs', X, y)
            Xr, yr = load_mnist('train')
            save('train_mnist_raw', Xr.copy(), yr)
            chunks = np.array_split(np.arange(10000), 32)
            X, y = run(pool, _mnist_worker, [('test', c, 1, 2000 + i) for i, c in enumerate(chunks)])
            save('test_mnist_rs', X, y)
            Xt, yt = load_mnist('test')
            save('test_mnist_raw', Xt.copy(), yt)
            print(f'mnist done {time.time() - t0:.0f}s', flush=True)
        if want('fonts'):
            per = 40 if q else 160
            X, y = run(pool, _font_worker, [(font_path(f), per, 3000 + i, 1.0) for i, f in enumerate(TRAIN_FONTS)
                                            if os.path.exists(font_path(f))])
            save('train_fonts', X, y)
            X, y = run(pool, _font_worker, [(font_path(f), 40, 4000 + i, 0.8) for i, f in enumerate(TEST_FONTS)
                                            if os.path.exists(font_path(f))])
            save('test_fonts', X, y)
            print(f'fonts done {time.time() - t0:.0f}s', flush=True)
        if want('synth'):
            total = 50000 if q else 240000
            jobs = [(total // 48, 5000 + i, 0.12) for i in range(48)]
            X, y = run(pool, _synth_worker, jobs)
            save('train_synth', X, y)
            X, y = run(pool, _synth_worker, [(6000 // 8, 9000 + i, 0.12) for i in range(8)])
            save('test_synth', X, y)
            print(f'synth done {time.time() - t0:.0f}s', flush=True)


if __name__ == '__main__':
    main()
