"""Export a trained checkpoint to the app's generic sequential format.

  public/models/digits/model.json   architecture: ordered layers with type, shapes and byte offsets
  public/models/digits/model.bin    weights, float32 little-endian (BN folded)

The TS loader (src/ink/ml/cnn.ts) also understands int8 tensors ({"dtype": "int8", "scale": s} or per-channel
"scales"); float32 is used by default because the model is small (~280 KB).

Usage: python export.py [--ckpt cache/model.pt] [--metrics metrics.json]
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os

import numpy as np
import torch

import preprocess as pp
from data_io import CACHE, HERE
from model import DigitNet

OUT_DIR = os.path.join(HERE, '..', 'public', 'models', 'digits')
FORMAT = 'numeria-seq-cnn'
FORMAT_VERSION = 1
LABELS = [str(i) for i in range(10)] + ['reject']


def fold(w: torch.Tensor, bn) -> tuple[np.ndarray, np.ndarray]:
    scale = (bn.weight / torch.sqrt(bn.running_var + bn.eps)).detach()
    shape = [-1] + [1] * (w.dim() - 1)
    wf = (w.detach() * scale.view(shape)).numpy().astype(np.float32)
    bf = (bn.bias.detach() - bn.running_mean * scale).numpy().astype(np.float32)
    return wf, bf


class Writer:
    def __init__(self):
        self.chunks: list[bytes] = []
        self.offset = 0

    def add(self, arr: np.ndarray) -> dict:
        a = np.ascontiguousarray(arr, dtype='<f4')
        b = a.tobytes()
        desc = {'offset': self.offset, 'shape': list(a.shape), 'dtype': 'float32'}
        self.chunks.append(b)
        self.offset += len(b)
        return desc

    def data(self) -> bytes:
        return b''.join(self.chunks)


def build(model: DigitNet):
    m = model.eval()
    w = Writer()
    layers = []
    shape = [1, 28, 28]

    def conv(name, c, bn, pad):
        nonlocal shape
        wf, bf = fold(c.weight, bn)
        oc, ic, kh, kw = wf.shape
        out = [oc, shape[1] + 2 * pad - kh + 1, shape[2] + 2 * pad - kw + 1]
        layers.append({'type': 'conv2d', 'name': name, 'inShape': shape, 'outShape': out, 'kernel': [kh, kw],
                       'stride': 1, 'padding': pad, 'activation': 'relu', 'weight': w.add(wf), 'bias': w.add(bf)})
        shape = out

    def pool():
        nonlocal shape
        out = [shape[0], shape[1] // 2, shape[2] // 2]
        layers.append({'type': 'maxpool2d', 'inShape': shape, 'outShape': out, 'size': 2, 'stride': 2})
        shape = out

    ci = 0
    for blk, plan in zip(m.blocks, m.plan):
        if plan[0] == 'conv':
            ci += 1
            conv(f'conv{ci}', blk['conv'], blk['bn'], plan[3])
        else:
            pool()
    flat = int(np.prod(shape))
    layers.append({'type': 'flatten', 'inShape': shape, 'outShape': [flat]})
    wf, bf = fold(m.fc1.weight, m.bn_fc1)
    layers.append({'type': 'dense', 'name': 'fc1', 'inShape': [flat], 'outShape': [wf.shape[0]], 'activation': 'relu',
                   'embedding': True, 'weight': w.add(wf), 'bias': w.add(bf)})
    w2 = m.fc2.weight.detach().numpy()
    b2 = m.fc2.bias.detach().numpy()
    layers.append({'type': 'dense', 'name': 'fc2', 'inShape': [wf.shape[0]], 'outShape': [w2.shape[0]],
                   'activation': 'none', 'weight': w.add(w2), 'bias': w.add(b2)})
    layers.append({'type': 'softmax', 'inShape': [w2.shape[0]], 'outShape': [w2.shape[0]]})
    return layers, w.data()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ckpt', default=os.path.join(CACHE, 'model.pt'))
    ap.add_argument('--metrics', default=os.path.join(HERE, 'metrics.json'))
    ap.add_argument('--out', default=OUT_DIR)
    a = ap.parse_args()
    ck = torch.load(a.ckpt, map_location='cpu')
    model = DigitNet(**ck['cfg'])
    model.load_state_dict(ck['state'])
    layers, blob = build(model)
    digest = hashlib.sha256(blob).hexdigest()[:10]
    metrics = None
    if os.path.exists(a.metrics):
        with open(a.metrics) as f:
            metrics = json.load(f).get('summary')
    meta = {
        'format': FORMAT,
        'version': FORMAT_VERSION,
        'modelId': f'digits-{digest}',
        'createdAt': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'),
        'input': {'shape': [1, 28, 28], 'layout': 'chw', 'range': [0, 1]},
        'labels': LABELS,
        'rejectIndex': 10,
        'embeddingSize': int(ck['cfg']['embed']),
        'preprocess': {'size': pp.SIZE, 'box': pp.BOX, 'lineWidth': pp.LINE_WIDTH, 'minInkPx': pp.MIN_INK_PX,
                       'minInkFrac': pp.MIN_INK_FRAC, 'maxComShift': pp.MAX_COM_SHIFT,
                       'strayMaxFrac': pp.STRAY_MAX_FRAC, 'strayGapFrac': pp.STRAY_GAP_FRAC},
        'weights': {'file': 'model.bin', 'byteLength': len(blob), 'dtype': 'float32', 'endianness': 'little'},
        'layers': layers,
        'metrics': metrics,
    }
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, 'model.bin'), 'wb') as f:
        f.write(blob)
    with open(os.path.join(a.out, 'model.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    print(f'exported {meta["modelId"]}: {len(blob)} bytes weights, {len(layers)} layers -> {a.out}')


if __name__ == '__main__':
    main()
