"""Train the digit CNN on the cached datasets (run build_data.py first).

Usage: python train.py --epochs 12 [--out cache/model.pt]
"""
from __future__ import annotations

import argparse
import json
import os
import time

import numpy as np
import torch
import torch.nn.functional as F
from torch import nn

from data_io import CACHE
from model import NUM_CLASSES, DigitNet

# Share of each source in every epoch (sampling with replacement).
MIX = {'train_mnist_rs': 0.30, 'train_mnist_raw': 0.08, 'train_fonts': 0.22, 'train_synth': 0.40}
TESTS = ['test_mnist_rs', 'test_mnist_raw', 'test_fonts', 'test_synth']


def load(name):
    d = np.load(os.path.join(CACHE, name + '.npz'))
    return d['X'], d['y']


def to_tensor(X):
    return torch.from_numpy(X.astype(np.float32) / 255.0).unsqueeze(1)


def random_shift(x: torch.Tensor, p: float = 0.3, max_px: int = 1) -> torch.Tensor:
    """Small integer shifts (centre-of-mass centring is never perfect for real ink)."""
    if p <= 0:
        return x
    n = x.shape[0]
    mask = torch.rand(n) < p
    if not mask.any():
        return x
    x = x.clone()
    idx = mask.nonzero().flatten()
    dx = torch.randint(-max_px, max_px + 1, (len(idx),))
    dy = torch.randint(-max_px, max_px + 1, (len(idx),))
    for k, i in enumerate(idx.tolist()):
        x[i] = torch.roll(x[i], shifts=(int(dy[k]), int(dx[k])), dims=(1, 2))
    return x


@torch.no_grad()
def evaluate(model, X, y, bs=2048):
    model.eval()
    logits = torch.cat([model(X[i:i + bs]) for i in range(0, len(X), bs)])
    p = logits.argmax(1)
    acc = (p == y).float().mean().item()
    digit_mask = y < 10
    # digits-only accuracy where the prediction is restricted to 0..9 (reject logit ignored)
    pd = logits[:, :10].argmax(1)
    acc_digits = (pd[digit_mask] == y[digit_mask]).float().mean().item() if digit_mask.any() else float('nan')
    rejected = (p[digit_mask] == 10).float().mean().item() if digit_mask.any() else float('nan')
    return acc, acc_digits, rejected, p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--epochs', type=int, default=12)
    ap.add_argument('--steps-per-epoch', type=int, default=0)
    ap.add_argument('--bs', type=int, default=256)
    ap.add_argument('--lr', type=float, default=3e-3)
    ap.add_argument('--out', default=os.path.join(CACHE, 'model.pt'))
    ap.add_argument('--seed', type=int, default=0)
    ap.add_argument('--arch', default='v2')
    a = ap.parse_args()
    torch.manual_seed(a.seed)
    np.random.seed(a.seed)
    torch.set_num_threads(os.cpu_count() or 4)

    srcs = {}
    for k in MIX:
        if os.path.exists(os.path.join(CACHE, k + '.npz')):
            X, y = load(k)
            srcs[k] = (to_tensor(X), torch.from_numpy(y))
            print(f'{k}: {len(X)}', flush=True)
    total = sum(len(v[1]) for v in srcs.values())
    steps = a.steps_per_epoch or total // a.bs
    tests = {}
    for k in TESTS:
        if os.path.exists(os.path.join(CACHE, k + '.npz')):
            X, y = load(k)
            tests[k] = (to_tensor(X), torch.from_numpy(y))

    model = DigitNet(a.arch)
    opt = torch.optim.AdamW(model.parameters(), lr=a.lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=a.lr, total_steps=a.epochs * steps, pct_start=0.15)
    names = list(srcs)
    w = np.array([MIX[n] for n in names])
    w = w / w.sum()
    # class weights: reject is a minority, keep its loss contribution moderate
    cw = torch.ones(NUM_CLASSES)
    crit = nn.CrossEntropyLoss(weight=cw, label_smoothing=0.05)
    for ep in range(a.epochs):
        model.train()
        t0 = time.time()
        tot_loss = 0.0
        for step in range(steps):
            counts = np.random.multinomial(a.bs, w)
            xs, ys = [], []
            for n, c in zip(names, counts):
                if c == 0:
                    continue
                X, y = srcs[n]
                idx = torch.randint(0, len(y), (int(c),))
                xs.append(X[idx])
                ys.append(y[idx])
            xb = random_shift(torch.cat(xs))
            yb = torch.cat(ys)
            loss = crit(model(xb), yb)
            opt.zero_grad(set_to_none=True)
            loss.backward()
            opt.step()
            sched.step()
            tot_loss += loss.item()
        msg = [f'epoch {ep + 1}/{a.epochs} loss {tot_loss / steps:.4f} ({time.time() - t0:.0f}s)']
        for k, (X, y) in tests.items():
            acc, accd, rej, _ = evaluate(model, X, y)
            msg.append(f'{k}: acc {acc * 100:.2f} digits {accd * 100:.2f} rej {rej * 100:.2f}')
        print(' | '.join(msg), flush=True)
        torch.save({'state': model.state_dict(), 'cfg': model.cfg}, a.out)
    print('saved', a.out)


if __name__ == '__main__':
    main()
