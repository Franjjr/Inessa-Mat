"""Raster digit (MNIST / font glyph) -> skeleton -> line segments, so it can be re-stroked with the app's
uniform pen (ml/preprocess.py). MNIST pen width varies a lot; the app's never does."""
from __future__ import annotations

import numpy as np
from scipy import ndimage
from skimage.morphology import skeletonize

_OFFS = [(0, 1), (1, 0), (1, 1), (1, -1)]


def prune_spurs(sk: np.ndarray, length: int) -> np.ndarray:
    """Remove short end branches (skeleton spurs at blunt corners), keeping the main structure."""
    sk = sk.copy()
    kernel = np.ones((3, 3), int)
    for _ in range(2):
        nb = ndimage.convolve(sk.astype(int), kernel, mode='constant') - sk
        ends = np.argwhere(sk & (nb == 1))
        for (y, x) in ends:
            path = [(y, x)]
            cy, cx = y, x
            prev = None
            ok = False
            for _ in range(length):
                nbrs = [(cy + dy, cx + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                        if (dy or dx) and 0 <= cy + dy < sk.shape[0] and 0 <= cx + dx < sk.shape[1]
                        and sk[cy + dy, cx + dx] and (cy + dy, cx + dx) != prev and (cy + dy, cx + dx) not in path]
                if len(nbrs) != 1:
                    ok = len(nbrs) >= 2  # reached a junction -> this is a spur
                    break
                prev = (cy, cx)
                cy, cx = nbrs[0]
                path.append((cy, cx))
            if ok:
                for (py, px) in path[:-1]:
                    sk[py, px] = False
    return sk


def mask_to_segments(mask: np.ndarray, spur: int = 0) -> np.ndarray:
    sk = skeletonize(mask)
    if spur > 0:
        sk = prune_spurs(sk, spur)
    ys, xs = np.nonzero(sk)
    if len(ys) == 0:
        return np.zeros((0, 4))
    segs = []
    on = sk
    H, W = sk.shape
    for dy, dx in _OFFS:
        y2 = ys + dy
        x2 = xs + dx
        valid = (y2 >= 0) & (y2 < H) & (x2 >= 0) & (x2 < W)
        y1v, x1v, y2v, x2v = ys[valid], xs[valid], y2[valid], x2[valid]
        hit = on[y2v, x2v]
        segs.append(np.stack([x1v[hit] + 0.5, y1v[hit] + 0.5, x2v[hit] + 0.5, y2v[hit] + 0.5], 1))
    segs = np.concatenate(segs, 0).astype(np.float64)
    # isolated pixels become dots
    deg = np.zeros_like(sk, dtype=int)
    for s in segs:
        deg[int(s[1]), int(s[0])] += 1
        deg[int(s[3]), int(s[2])] += 1
    iy, ix = np.nonzero(sk & (deg == 0))
    if len(iy):
        dots = np.stack([ix + 0.5, iy + 0.5, ix + 0.5, iy + 0.5], 1)
        segs = np.concatenate([segs, dots], 0)
    return segs


def mnist_to_segments(img28: np.ndarray, up: int = 4, thresh: float = 0.4) -> np.ndarray:
    big = ndimage.zoom(img28.astype(np.float32) / 255.0, up, order=1)
    mask = big > thresh
    mask = ndimage.binary_closing(mask, iterations=1)
    return mask_to_segments(mask, spur=up * 2)


def glyph_mask(font, ch: str, size: int = 160) -> np.ndarray:
    from PIL import Image, ImageDraw
    img = Image.new('L', (size * 2, size * 2), 0)
    d = ImageDraw.Draw(img)
    d.text((size // 2, size // 4), ch, fill=255, font=font)
    a = np.asarray(img) > 128
    ys, xs = np.nonzero(a)
    if len(ys) == 0:
        return a
    return a[max(0, ys.min() - 4):ys.max() + 5, max(0, xs.min() - 4):xs.max() + 5]


def font_digit_segments(font_path: str, digit: int, px: int = 110) -> np.ndarray:
    from PIL import ImageFont
    font = ImageFont.truetype(font_path, px)
    m = glyph_mask(font, str(digit))
    # normalise glyph height to ~100 px so spur pruning / skeleton quality is comparable across fonts
    h = m.shape[0]
    if h > 0 and abs(h - 100) > 10:
        m = ndimage.zoom(m.astype(np.float32), 100.0 / h, order=1) > 0.5
    m = ndimage.binary_closing(m, iterations=1)
    m = ndimage.binary_fill_holes(m) & m if False else m
    est_thickness = max(2, int(round(m.sum() / max(1, skeletonize(m).sum()))))
    return mask_to_segments(m, spur=max(4, est_thickness))
