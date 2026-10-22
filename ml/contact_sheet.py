"""Dev tool: save a PNG contact sheet of 28x28 samples. Usage: python contact_sheet.py synth|reject|mnist|fonts out.png"""
from __future__ import annotations

import sys

import numpy as np
from PIL import Image


def sheet(imgs: np.ndarray, cols: int = 20, scale: int = 3) -> Image.Image:
    n = len(imgs)
    rows = (n + cols - 1) // cols
    canvas = np.ones((rows * 30, cols * 30), dtype=np.float32) * 0.25
    for i, im in enumerate(imgs):
        r, c = divmod(i, cols)
        canvas[r * 30 + 1:r * 30 + 29, c * 30 + 1:c * 30 + 29] = 1 - im.reshape(28, 28)
    img = Image.fromarray((canvas * 255).astype(np.uint8))
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


if __name__ == '__main__':
    from preprocess import preprocess_strokes
    import synth
    kind, out = sys.argv[1], sys.argv[2]
    rng = np.random.default_rng(1)
    r = synth.R(rng)
    imgs = []
    if kind == 'synth':
        for d in range(10):
            for _ in range(20):
                s, zw, zh = synth.make_digit_strokes(r, d)
                imgs.append(preprocess_strokes(s, zw, zh))
    elif kind == 'reject':
        for _ in range(100):
            s, zw, zh = synth.make_reject_strokes(r)
            imgs.append(preprocess_strokes(s, zw, zh))
    sheet(np.array(imgs)).save(out)
    print('saved', out)
