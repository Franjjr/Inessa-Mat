"""Stroke preprocessing shared by training and the app.

This file MUST stay numerically identical to src/ink/ml/preprocess.ts (parity tests in
src/ink/ml/preprocess.test.ts compare both on shared fixtures exported by ml/make_fixtures.py).

Pipeline (strokes in zone pixel coordinates -> 28x28 float image in 0..1, MNIST style):
  0. drop stray taps: tiny strokes far from the rest of the ink
  1. bounding box of all points; no points, or ink extent below the "tiny" threshold -> None
  2. scale uniformly (aspect preserved, a thin "1" stays thin) so the ink, including the pen width, fits
     a BOX x BOX square, centred on the bbox centre
  3. rasterise polylines with round caps/joins: per pixel coverage = clamp(r + 0.5 - dist, 0, 1), union = max
  4. shift so that the centre of mass lands on the image centre (second render pass, sub-pixel exact)
"""
from __future__ import annotations

from typing import Iterable, Sequence

import numpy as np

SIZE = 28
BOX = 20.0
LINE_WIDTH = 2.6          # pen width in output pixels (uniform, proportional to digit size)
MIN_INK_PX = 3.0          # absolute minimum ink extent (zone px)
MIN_INK_FRAC = 0.06       # ... and relative to min(zone width, zone height)
MAX_COM_SHIFT = 4.0       # never shift more than this (px) when centring by centre of mass
STRAY_MAX_FRAC = 0.12     # a stroke this small (vs. all ink) ...
STRAY_GAP_FRAC = 0.2      # ... and this far from the rest (vs. the rest's extent) is a stray tap -> ignored

_cx = (np.arange(SIZE, dtype=np.float64) + 0.5)
PIX_X = np.tile(_cx, SIZE)            # (784,) x of pixel centres, row-major
PIX_Y = np.repeat(_cx, SIZE)          # (784,) y of pixel centres

Stroke = Sequence[Sequence[float]]    # [(x, y), ...]


def strokes_to_segments(strokes: Iterable[Stroke]) -> np.ndarray:
    """Polylines -> (n, 4) array of segments [ax, ay, bx, by]. A single-point stroke becomes a dot."""
    segs = []
    for s in strokes:
        a = np.asarray(s, dtype=np.float64).reshape(-1, 2)
        if len(a) == 0:
            continue
        if len(a) == 1:
            segs.append(np.concatenate([a, a], axis=1))
        else:
            segs.append(np.concatenate([a[:-1], a[1:]], axis=1))
    if not segs:
        return np.zeros((0, 4), dtype=np.float64)
    return np.concatenate(segs, axis=0)


def rasterize_segments(segs: np.ndarray, line_width: float) -> np.ndarray:
    """Anti-aliased distance-based rasteriser. segs in output pixel coords. Returns (784,) float64 in 0..1."""
    img = np.zeros(SIZE * SIZE, dtype=np.float64)
    if len(segs) == 0:
        return img
    r = line_width / 2.0
    # process in chunks to bound memory for long skeletons
    for k in range(0, len(segs), 512):
        s = segs[k:k + 512]
        ax, ay, bx, by = s[:, 0:1], s[:, 1:2], s[:, 2:3], s[:, 3:4]
        vx = bx - ax
        vy = by - ay
        l2 = vx * vx + vy * vy
        px = PIX_X[None, :]
        py = PIX_Y[None, :]
        wx = px - ax
        wy = py - ay
        with np.errstate(invalid='ignore', divide='ignore'):
            t = np.where(l2 > 0, (wx * vx + wy * vy) / np.where(l2 > 0, l2, 1.0), 0.0)
        t = np.clip(t, 0.0, 1.0)
        dx = px - (ax + t * vx)
        dy = py - (ay + t * vy)
        d = np.sqrt(dx * dx + dy * dy)
        cov = np.clip(r + 0.5 - d, 0.0, 1.0)
        img = np.maximum(img, cov.max(axis=0))
    return img


def ink_bbox(segs: np.ndarray):
    xs = np.concatenate([segs[:, 0], segs[:, 2]])
    ys = np.concatenate([segs[:, 1], segs[:, 3]])
    return xs.min(), ys.min(), xs.max(), ys.max()


def min_ink_extent(zone_w: float | None, zone_h: float | None) -> float:
    if zone_w and zone_h and zone_w > 0 and zone_h > 0 and np.isfinite(zone_w) and np.isfinite(zone_h):
        return max(MIN_INK_PX, MIN_INK_FRAC * min(zone_w, zone_h))
    return MIN_INK_PX


def preprocess_segments(segs: np.ndarray, zone_w: float | None = None, zone_h: float | None = None,
                        line_width: float = LINE_WIDTH, check_tiny: bool = True):
    """Core preprocessing on a segment list (zone px). Returns (784,) float32 image or None."""
    if len(segs) == 0:
        return None
    x0, y0, x1, y1 = ink_bbox(segs)
    w = x1 - x0
    h = y1 - y0
    ext = max(w, h)
    if check_tiny and ext < min_ink_extent(zone_w, zone_h):
        return None
    if ext <= 0:
        ext = 1.0  # a single dot (only reachable with check_tiny=False)
    scale = (BOX - line_width) / ext
    cx = (x0 + x1) / 2.0
    cy = (y0 + y1) / 2.0
    half = SIZE / 2.0
    t = segs.copy()
    t[:, [0, 2]] = (segs[:, [0, 2]] - cx) * scale + half
    t[:, [1, 3]] = (segs[:, [1, 3]] - cy) * scale + half
    img = rasterize_segments(t, line_width)
    mass = img.sum()
    if mass > 0:
        mx = float((img * PIX_X).sum() / mass)
        my = float((img * PIX_Y).sum() / mass)
        sx = min(MAX_COM_SHIFT, max(-MAX_COM_SHIFT, half - mx))
        sy = min(MAX_COM_SHIFT, max(-MAX_COM_SHIFT, half - my))
        t[:, [0, 2]] += sx
        t[:, [1, 3]] += sy
        img = rasterize_segments(t, line_width)
    return img.astype(np.float32)


def _bbox(points: np.ndarray):
    return points[:, 0].min(), points[:, 1].min(), points[:, 0].max(), points[:, 1].max()


def drop_stray_strokes(strokes: Iterable[Stroke]) -> list:
    """Remove tiny strokes far away from the rest (e.g. the child tapped the cell before writing)."""
    arr = [np.asarray(s, dtype=np.float64).reshape(-1, 2) for s in strokes]
    arr = [a for a in arr if len(a)]
    if len(arr) < 2:
        return arr
    boxes = [_bbox(a) for a in arr]
    allp = np.concatenate(arr)
    x0, y0, x1, y1 = _bbox(allp)
    ext_all = max(x1 - x0, y1 - y0)
    small = [max(b[2] - b[0], b[3] - b[1]) < STRAY_MAX_FRAC * ext_all for b in boxes]
    main = [a for a, sm in zip(arr, small) if not sm]
    if not main:
        return arr
    mx0, my0, mx1, my1 = _bbox(np.concatenate(main))
    ext_main = max(mx1 - mx0, my1 - my0)
    keep = []
    for a, b, sm in zip(arr, boxes, small):
        if sm:
            gx = max(0.0, mx0 - b[2], b[0] - mx1)
            gy = max(0.0, my0 - b[3], b[1] - my1)
            if max(gx, gy) > STRAY_GAP_FRAC * ext_main:
                continue
        keep.append(a)
    return keep


def preprocess_strokes(strokes: Iterable[Stroke], zone_w: float | None = None, zone_h: float | None = None,
                       line_width: float = LINE_WIDTH, check_tiny: bool = True):
    return preprocess_segments(strokes_to_segments(drop_stray_strokes(strokes)), zone_w, zone_h, line_width, check_tiny)
