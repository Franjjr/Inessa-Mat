"""Parametric synthetic STROKE digits (child-like), scribble/non-digit strokes, and stroke-level augmentation.

Each digit is 1-3 strokes of lines/arcs/beziers in a unit frame (height ~1, y down) with style variants that
children really produce (1 with/without flag and base, 7 with/without crossbar, open/closed 4, 9 with straight
or curved tail, 2 with/without loop, round vs angular 3, 5 with detached top bar, 6/9 loop sizes...).
They are rasterised with exactly the app preprocessing (ml/preprocess.py == src/ink/ml/preprocess.ts).
"""
from __future__ import annotations

import math
from typing import Callable, List

import numpy as np

Pts = np.ndarray  # (n, 2)
Strokes = List[Pts]


# ---------------------------------------------------------------- primitives

def line(p0, p1, n: int = 12) -> Pts:
    t = np.linspace(0, 1, n)[:, None]
    return np.asarray(p0, float) * (1 - t) + np.asarray(p1, float) * t


def arc(cx, cy, rx, ry, a0, a1, n: int = 40) -> Pts:
    """Angles in degrees, y down: 0 = right, 90 = bottom, 270/-90 = top. a0 -> a1 (either direction)."""
    a = np.radians(np.linspace(a0, a1, n))
    return np.stack([cx + rx * np.cos(a), cy + ry * np.sin(a)], axis=1)


def bez(p0, p1, p2, p3, n: int = 30) -> Pts:
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = (np.asarray(p, float) for p in (p0, p1, p2, p3))
    return ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * (t ** 2) * p2 + (t ** 3) * p3


def join(*parts: Pts) -> Pts:
    out = [parts[0]]
    for p in parts[1:]:
        out.append(p[1:] if np.allclose(out[-1][-1], p[0]) else p)
    return np.concatenate(out, axis=0)


def resample(p: Pts, step: float) -> Pts:
    if len(p) < 2:
        return p
    d = np.sqrt(((p[1:] - p[:-1]) ** 2).sum(1))
    s = np.concatenate([[0], np.cumsum(d)])
    total = s[-1]
    if total <= 1e-9:
        return p[:1]
    n = max(2, int(math.ceil(total / step)) + 1)
    u = np.linspace(0, total, n)
    return np.stack([np.interp(u, s, p[:, 0]), np.interp(u, s, p[:, 1])], axis=1)


# ---------------------------------------------------------------- digits

class R:
    def __init__(self, rng: np.random.Generator):
        self.g = rng

    def u(self, a, b):
        return float(self.g.uniform(a, b))

    def c(self, p):  # chance
        return bool(self.g.random() < p)

    def pick(self, items, weights=None):
        w = None if weights is None else np.asarray(weights, float) / np.sum(weights)
        return items[int(self.g.choice(len(items), p=w))]


def d0(r: R) -> Strokes:
    rx = r.u(0.17, 0.33)
    a0 = r.u(-130, -50)
    sweep = r.u(330, 400) * (1 if r.c(0.35) else -1)
    egg = r.u(-0.15, 0.15)
    a = np.radians(np.linspace(a0, a0 + sweep, 64))
    ry = 0.5
    x = 0.3 + rx * np.cos(a) * (1 + egg * np.sin(a))
    y = 0.5 + ry * np.sin(a)
    return [np.stack([x, y], 1)]


def d1(r: R) -> Strokes:
    top = (0.3 + r.u(-0.03, 0.03), r.u(0.0, 0.03))
    bot = (0.3 + r.u(-0.06, 0.06), 1.0)
    style = r.pick(['plain', 'flag', 'flagbase', 'longflag'], [0.3, 0.42, 0.13, 0.15])
    strokes: Strokes = []
    if style == 'plain':
        strokes.append(line(top, bot))
    else:
        if style == 'longflag':
            fl = (top[0] - r.u(0.18, 0.32), top[1] + r.u(0.22, 0.42))
        else:
            fl = (top[0] - r.u(0.08, 0.22), top[1] + r.u(0.08, 0.28))
        if r.c(0.3):  # slightly curved flag
            mid = ((fl[0] + top[0]) / 2 + r.u(-0.03, 0.03), (fl[1] + top[1]) / 2 - r.u(0.0, 0.04))
            flag = bez(fl, mid, mid, top, 10)
        else:
            flag = line(fl, top, 8)
        strokes.append(join(flag, line(top, bot)))
        if style == 'flagbase':
            b = r.u(0.12, 0.24)
            yb = 1.0 + r.u(-0.02, 0.03)
            strokes.append(line((bot[0] - b, yb), (bot[0] + b * r.u(0.8, 1.2), yb + r.u(-0.02, 0.02))))
    return strokes


def d2(r: R) -> Strokes:
    rr = r.u(0.22, 0.3)
    cx, cy = 0.3, rr + r.u(-0.02, 0.03)
    start = r.u(175, 215)
    end = r.u(20, 60) + 360
    top = arc(cx, cy, rr * r.u(0.9, 1.15), rr, start, end, 30)
    p = top[-1]
    base_y = 1.0
    bl = (r.u(0.0, 0.08), base_y)
    style = r.pick(['plain', 'loop', 'curvy', 'angular'], [0.45, 0.2, 0.25, 0.1])
    if style == 'angular':
        top = join(line((0.05, 0.03), (0.55, 0.0), 10), line((0.55, 0.0), (0.56, 0.18), 6))
        p = top[-1]
    if style == 'curvy':
        diag = bez(p, (p[0] - 0.05, p[1] + 0.25), (bl[0] + 0.15, bl[1] - 0.2), bl, 20)
    else:
        diag = line(p, bl, 16)
    end_x = r.u(0.5, 0.68)
    if style == 'loop':
        lr = r.u(0.05, 0.1)
        loop = arc(bl[0] + lr, bl[1] - lr, lr, lr, 180, 180 - 300, 18)
        base = line(loop[-1], (end_x, base_y + r.u(-0.03, 0.03)), 12)
        return [join(top, diag, loop, base)]
    base = line(bl, (end_x, base_y + r.u(-0.04, 0.04)), 12)
    return [join(top, diag, base)]


def d3(r: R) -> Strokes:
    r1 = r.u(0.2, 0.26)
    r2 = r.u(0.24, 0.3)
    cx = 0.3
    mid_y = 2 * r1 + r.u(-0.02, 0.02)
    style = r.pick(['round', 'angular', 'cusp'], [0.55, 0.2, 0.25])
    lower = arc(cx + r.u(-0.02, 0.03), 1 - r2, r2 * r.u(0.95, 1.2), r2, 270, 270 + r.u(220, 250), 34)
    lower[0] = (cx - (0.05 if style == 'cusp' else 0.0), mid_y)
    if style == 'angular':
        upper = join(line((0.06, 0.02), (0.55, 0.0), 10), line((0.55, 0.0), (cx - 0.02, mid_y), 14))
    else:
        upper = arc(cx, r1, r1 * r.u(0.9, 1.2), r1, r.u(190, 225), 450, 34)
        if style == 'cusp':
            upper = join(upper, line(upper[-1], (cx - 0.06, mid_y), 4))
    return [join(upper, line(upper[-1], lower[0], 3), lower)]


def d4(r: R) -> Strokes:
    xv = r.u(0.38, 0.5)
    ybar = r.u(0.55, 0.72)
    style = r.pick(['closed', 'open', 'closed1'], [0.45, 0.4, 0.15])
    xr = xv + r.u(0.1, 0.22)
    vert = line((xv + r.u(-0.03, 0.03), r.u(0.0, 0.12) if style == 'open' else 0.0), (xv + r.u(-0.06, 0.04), 1.0))
    if style == 'open':
        xl = r.u(0.02, 0.12)
        s1 = join(line((xl + r.u(-0.02, 0.06), 0.0), (xl, ybar), 10), line((xl, ybar), (xr, ybar + r.u(-0.03, 0.03)), 10))
        return [s1, vert]
    s1 = join(line((xv, 0.0), (r.u(0.0, 0.06), ybar), 12), line((r.u(0.0, 0.06), ybar), (xr, ybar), 10))
    if style == 'closed1':  # one continuous stroke: diagonal, bar, back to the vertical
        return [join(s1, line((xr, ybar), (xv, ybar - 0.02), 3), line((xv, ybar - 0.02), (xv, 1.0), 8))]
    return [s1, vert]


def d5(r: R) -> Strokes:
    rb = r.u(0.24, 0.31)
    cy = 1 - rb
    cx = 0.3
    stem_top = (r.u(0.06, 0.16), r.u(0.0, 0.05))
    a0 = r.u(200, 235)
    belly = arc(cx, cy, rb * r.u(0.95, 1.2), rb, a0, r.u(130, 165) + 360, 36)
    stem = line(stem_top, belly[0], 10)
    bar_end = (r.u(0.48, 0.64), r.u(-0.04, 0.03))
    style = r.pick(['two', 'one', 'detached'], [0.5, 0.3, 0.2])
    if style == 'one':
        return [join(line(bar_end, stem_top, 10), stem, belly)]
    bar_start = stem_top
    if style == 'detached':
        bar_start = (stem_top[0] + r.u(0.03, 0.1), stem_top[1] - r.u(0.02, 0.07))
        bar_end = (bar_end[0] + r.u(0.0, 0.06), bar_end[1] - r.u(0.0, 0.05))
    return [join(stem, belly), line(bar_start, bar_end, 10)]


def d6(r: R) -> Strokes:
    rl = r.u(0.18, 0.3)
    cx = r.u(0.25, 0.32)
    cy = 1 - rl
    start = (r.u(0.42, 0.6), r.u(0.0, 0.04))
    left_x = cx - rl
    stem = bez(start, (r.u(0.15, 0.3), r.u(0.05, 0.15)), (left_x - r.u(0.0, 0.05), r.u(0.3, 0.5)), (left_x, cy), 24)
    loop = arc(cx, cy, rl * r.u(0.9, 1.15), rl, 180, 180 - r.u(330, 370), 32)
    return [join(stem, loop)]


def d7(r: R) -> Strokes:
    x0 = r.u(0.0, 0.08)
    x1 = r.u(0.5, 0.65)
    ytop = r.u(0.0, 0.04)
    foot = (r.u(0.12, 0.32), 1.0)
    style = r.pick(['plain', 'cross', 'serif', 'curved'], [0.4, 0.3, 0.12, 0.18])
    if r.c(0.25):  # short top bar (common in quick handwriting; must not become a "1")
        x0 = x1 - r.u(0.22, 0.36)
    bar = line((x0, ytop + r.u(-0.03, 0.03)), (x1, ytop), 12)
    if style == 'curved':
        diag = bez((x1, ytop), (x1 - 0.05, 0.35), (foot[0] + 0.05, 0.65), foot, 20)
    else:
        diag = line((x1, ytop), foot, 16)
    s = [join(bar, diag)]
    if style == 'serif':
        s = [join(line((x0, ytop + r.u(0.08, 0.16)), (x0, ytop), 5), bar, diag)]
    if style == 'cross':
        ym = r.u(0.45, 0.58)
        t = (ym - ytop) / (1 - ytop)
        xm = x1 + (foot[0] - x1) * t
        w = r.u(0.11, 0.2)
        s.append(line((xm - w, ym + r.u(-0.02, 0.02)), (xm + w * r.u(0.7, 1.1), ym + r.u(-0.02, 0.02)), 8))
    return s


def d8(r: R) -> Strokes:
    style = r.pick(['single', 'two', 'snowman'], [0.6, 0.25, 0.15])
    if style == 'single':
        wt = r.u(0.16, 0.26)
        wb = r.u(0.2, 0.3)
        cross_y = r.u(0.42, 0.52)
        t = np.linspace(0, 2 * np.pi * r.u(0.97, 1.06), 80)
        # piecewise: top lobe for y < cross_y, bottom lobe below
        y = np.where(np.cos(t) > 0, cross_y * (1 - np.cos(t)), cross_y + (1 - cross_y) * (-np.cos(t)))
        w = np.where(np.cos(t) > 0, wt, wb)
        x = 0.3 + w * np.sin(2 * t) * (1 if r.c(0.5) else -1)
        return [np.stack([x, y], 1)]
    r1 = r.u(0.17, 0.24)
    r2 = 0.5 - r1 / 2 if style == 'snowman' else r.u(0.22, 0.28)
    r2 = min(r2, (1 - 2 * r1) / 2 + 0.02)
    c1 = (0.3 + r.u(-0.03, 0.03), r1)
    c2 = (0.3 + r.u(-0.03, 0.03), 1 - r2)
    a = r.u(0, 360)
    up = arc(c1[0], c1[1], r1 * r.u(0.9, 1.2), r1, a, a + r.u(340, 380) * (1 if r.c(0.5) else -1), 36)
    b = r.u(0, 360)
    lo = arc(c2[0], c2[1], r2 * r.u(0.9, 1.2), r2, b, b + r.u(340, 380) * (1 if r.c(0.5) else -1), 40)
    return [up, lo]


def d9(r: R) -> Strokes:
    rl = r.u(0.18, 0.28)
    cx = 0.3
    cy = rl
    rx = rl * r.u(0.95, 1.25)
    loop = arc(cx, cy, rx, rl, r.u(-10, 20), r.u(-10, 20) - r.u(340, 375), 36)
    xr = cx + rx
    style = r.pick(['straight', 'curved', 'separate', 'slant'], [0.4, 0.3, 0.15, 0.15])
    if style == 'curved':
        tail = bez((xr, cy), (xr + r.u(-0.02, 0.03), 0.6), (xr - 0.02, 0.95), (xr - r.u(0.15, 0.3), r.u(0.92, 1.0)), 20)
    elif style == 'slant':
        tail = line((xr, cy), (xr - r.u(0.1, 0.25), 1.0), 16)
    else:
        tail = line((xr, cy * r.u(0.4, 1.0)), (xr + r.u(-0.06, 0.04), 1.0), 16)
    if style == 'separate':
        return [loop, tail]
    return [join(loop, line(loop[-1], tail[0], 3), tail)]


DIGITS: List[Callable[[R], Strokes]] = [d0, d1, d2, d3, d4, d5, d6, d7, d8, d9]


# ---------------------------------------------------------------- non-digits ("reject" class)

def scribble(r: R) -> Strokes:
    n = int(r.u(90, 220))
    p = np.zeros((n, 2))
    ang = r.u(0, 2 * np.pi)
    vel = 0.0
    pos = np.array([0.5, 0.5])
    step = r.u(0.03, 0.06)
    for i in range(n):
        vel = 0.8 * vel + r.u(-0.9, 0.9)
        ang += vel
        pos = pos + step * np.array([math.cos(ang), math.sin(ang)])
        for k in range(2):
            if pos[k] < 0 or pos[k] > 1:
                pos[k] = min(1, max(0, pos[k]))
                ang += np.pi * r.u(0.6, 1.4)
        p[i] = pos
    return [p]


def hatch(r: R) -> Strokes:
    k = int(r.u(5, 11))  # >= 5 lines, fewer would look like a Z / 2 / 5
    ang = r.u(-1, 1)
    pts = []
    for i in range(k):
        y = i / (k - 1)
        x0, x1 = r.u(0, 0.2), r.u(0.8, 1)
        a, b = (x0, y + ang * 0.1), (x1, y - ang * 0.1)
        pts += [a, b] if i % 2 == 0 else [b, a]
    pts = np.array(pts)
    if r.c(0.5):
        return [pts]
    return [pts[i:i + 2] for i in range(0, len(pts), 2)]


def spiral(r: R) -> Strokes:
    turns = r.u(2.0, 4.0)
    t = np.linspace(0, 2 * np.pi * turns, 120)
    rad = 0.05 + 0.45 * t / t[-1]
    return [np.stack([0.5 + rad * np.cos(t), 0.5 + rad * np.sin(t) * r.u(0.7, 1.2)], 1)]


def symbol(r: R) -> Strokes:
    kind = r.pick(['x', 'plus', 'eq', 'hash', 'dash', 'star', 'dashes'])
    if kind == 'x':
        return [line((0, 0), (1, 1)), line((1, 0), (0, 1))]
    if kind == 'plus':
        return [line((0, 0.5 + r.u(-0.1, 0.1)), (1, 0.5)), line((0.5 + r.u(-0.1, 0.1), 0), (0.5, 1))]
    if kind == 'eq':
        g = r.u(0.25, 0.6)
        return [line((0, 0), (1, 0.02)), line((0, g), (1, g + 0.02))]
    if kind == 'hash':
        return [line((0.3, 0), (0.25, 1)), line((0.7, 0), (0.65, 1)), line((0, 0.33), (1, 0.33)), line((0, 0.66), (1, 0.66))]
    if kind == 'dash':
        a = r.u(-0.6, 0.6)  # mostly horizontal (|angle from vertical| >= ~55 deg)
        return [line((0, 0.5 - a * 0.5), (1, 0.5 + a * 0.5))]
    if kind == 'star':
        s = []
        for k in range(int(r.u(3, 5))):
            a = np.pi * k / 3 + r.u(-0.2, 0.2)
            s.append(line((0.5 - 0.5 * math.cos(a), 0.5 - 0.5 * math.sin(a)), (0.5 + 0.5 * math.cos(a), 0.5 + 0.5 * math.sin(a))))
        return s
    s = []
    for _ in range(int(r.u(5, 9))):
        p = np.array([r.u(0, 1), r.u(0, 1)])
        a = r.u(0, np.pi)
        L = r.u(0.08, 0.2)
        s.append(line(p, p + L * np.array([math.cos(a), math.sin(a)]), 4))
    return s


REJECTS: List[Callable[[R], Strokes]] = [scribble, scribble, hatch, spiral, symbol, symbol]


# ---------------------------------------------------------------- augmentation

def random_affine(r: R, rot_deg=15.0, shear=0.3, aspect=(0.72, 1.35)) -> np.ndarray:
    th = math.radians(r.u(-rot_deg, rot_deg))
    sh = r.u(-shear, shear)
    ax = r.u(*aspect)
    rot = np.array([[math.cos(th), -math.sin(th)], [math.sin(th), math.cos(th)]])
    shm = np.array([[1, sh], [0, 1]])
    sc = np.array([[ax, 0], [0, 1]])
    return rot @ shm @ sc


def elastic_field(r: R, amp: float):
    """Smooth random displacement field f(p) built from a few random low-frequency sinusoids."""
    k = 3
    fx = [(r.u(0.5, 2.5), r.u(0.5, 2.5), r.u(0, 2 * np.pi), r.u(-1, 1)) for _ in range(k)]
    fy = [(r.u(0.5, 2.5), r.u(0.5, 2.5), r.u(0, 2 * np.pi), r.u(-1, 1)) for _ in range(k)]

    def f(p: np.ndarray) -> np.ndarray:
        x, y = p[:, 0], p[:, 1]
        dx = sum(a * np.sin(2 * np.pi * (u * x + v * y) + ph) for u, v, ph, a in fx) / k
        dy = sum(a * np.sin(2 * np.pi * (u * x + v * y) + ph) for u, v, ph, a in fy) / k
        return p + amp * np.stack([dx, dy], 1)

    return f


def wobble(r: R, p: Pts, amp: float) -> Pts:
    """Child-like wobble: smooth perpendicular noise along the stroke."""
    if len(p) < 3 or amp <= 0:
        return p
    d = np.sqrt(((p[1:] - p[:-1]) ** 2).sum(1))
    s = np.concatenate([[0], np.cumsum(d)])
    tang = np.gradient(p, axis=0)
    norm = np.stack([-tang[:, 1], tang[:, 0]], 1)
    norm /= np.maximum(1e-9, np.linalg.norm(norm, axis=1, keepdims=True))
    off = np.zeros(len(p))
    for _ in range(3):
        f = r.u(1.0, 8.0)
        off += r.u(-1, 1) * np.sin(2 * np.pi * f * s + r.u(0, 2 * np.pi))
    off = off / 3 * amp
    off += r.u(0, amp * 0.3) * r.g.standard_normal(len(p))  # tremor
    return p + norm * off[:, None]


def overshoot(r: R, p: Pts, amount: float) -> Pts:
    if len(p) < 2:
        return p
    out = p
    for end in (0, 1):
        if r.c(0.35):
            a, b = (out[1], out[0]) if end == 0 else (out[-2], out[-1])
            v = b - a
            n = np.linalg.norm(v)
            if n < 1e-9:
                continue
            ext = b + v / n * r.u(0, amount)
            out = np.vstack([ext[None], out]) if end == 0 else np.vstack([out, ext[None]])
    return out


def augment_strokes(r: R, strokes: Strokes, strength: float = 1.0) -> Strokes:
    """Stroke-level augmentation in the unit frame: wobble, gaps, overshoot, affine, elastic."""
    out = []
    for s in strokes:
        s = resample(np.asarray(s, float), r.u(0.012, 0.03))
        s = overshoot(r, s, 0.06 * strength)
        s = wobble(r, s, r.u(0.0, 0.025) * strength)
        s = s + np.array([r.u(-0.03, 0.03), r.u(-0.03, 0.03)]) * strength  # small gaps between strokes
        out.append(s)
    A = random_affine(r, 15 * strength, 0.3 * strength)
    allp = np.concatenate(out)
    c = (allp.min(0) + allp.max(0)) / 2
    out = [(s - c) @ A.T for s in out]
    f = elastic_field(r, r.u(0.0, 0.05) * strength)
    return [f(s) for s in out]


def augment_points_fn(r: R, strength: float = 1.0):
    """Point transform for skeleton segments (consistent for shared endpoints): affine + elastic."""
    A = random_affine(r, 15 * strength, 0.3 * strength)
    f = elastic_field(r, r.u(0.0, 0.04) * strength)

    def tf(p: np.ndarray, center: np.ndarray, scale: float) -> np.ndarray:
        q = (p - center) / scale
        q = f(q @ A.T)
        return q * scale
    return tf


def to_zone(r: R, strokes: Strokes):
    """Place unit-frame strokes into a random zone pixel frame (size like the app's cells)."""
    size = r.u(30, 220)
    off = np.array([r.u(0, 50), r.u(0, 50)])
    pen = r.pick(['pen', 'touch'])
    jit = 0.4 if pen == 'pen' else 1.0
    res = []
    for s in strokes:
        q = s * size + off
        q = q + r.g.standard_normal(q.shape) * jit * r.u(0, 1)  # sensor jitter in px
        res.append(q)
    return res, size * 1.4, size * 1.4


def make_digit_strokes(r: R, digit: int, strength: float = 1.0):
    s = DIGITS[digit](r)
    s = augment_strokes(r, s, strength)
    return to_zone(r, s)


def make_reject_strokes(r: R):
    fn = REJECTS[int(r.g.integers(len(REJECTS)))]
    s = augment_strokes(r, fn(r), 1.0)
    return to_zone(r, s)
