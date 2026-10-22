"""Small CNNs for 28x28 handwritten digits (+ a "reject" class).

Architectures (BN folded into conv/dense at export, ml/export.py):
  v2 (default, ~2.2 M MACs, ~61 k params):
    conv5x5(1->16) BN ReLU pool | conv3x3(16->32) BN ReLU pool | conv3x3(32->64) BN ReLU pool (7->3)
    flatten 576 -> dense 64 BN ReLU (= embedding for personalisation) -> dense 11
  v1 (~4 M MACs, ~70 k params): v2 with an extra conv3x3(32->32) at 14x14.
The JS runtime is scalar (~1.3 GMAC/s in V8), so v2 runs in ~2 ms per digit.
"""
from __future__ import annotations

import torch
from torch import nn

NUM_CLASSES = 11
EMBED = 64

ARCHS = {
    # ('conv', out_channels, kernel, padding) | ('pool',)
    'v1': [('conv', 16, 5, 2), ('pool',), ('conv', 32, 3, 1), ('conv', 32, 3, 1), ('pool',), ('conv', 64, 3, 1), ('pool',)],
    'v2': [('conv', 16, 5, 2), ('pool',), ('conv', 32, 3, 1), ('pool',), ('conv', 64, 3, 1), ('pool',)],
    'v3': [('conv', 16, 5, 2), ('pool',), ('conv', 40, 3, 1), ('pool',), ('conv', 80, 3, 1), ('pool',)],
}


class DigitNet(nn.Module):
    def __init__(self, arch: str = 'v2', embed: int = EMBED, **_):
        super().__init__()
        self.cfg = dict(arch=arch, embed=embed)
        self.blocks = nn.ModuleList()
        self.plan = ARCHS[arch]
        c, hw = 1, 28
        for b in self.plan:
            if b[0] == 'conv':
                _, oc, k, p = b
                self.blocks.append(nn.ModuleDict({'conv': nn.Conv2d(c, oc, k, padding=p, bias=False), 'bn': nn.BatchNorm2d(oc)}))
                c = oc
                hw = hw + 2 * p - k + 1
            else:
                self.blocks.append(nn.MaxPool2d(2))
                hw = hw // 2
        self.flat = c * hw * hw
        self.fc1 = nn.Linear(self.flat, embed, bias=False)
        self.bn_fc1 = nn.BatchNorm1d(embed)
        self.fc2 = nn.Linear(embed, NUM_CLASSES)
        self.act = nn.ReLU()
        self.drop1 = nn.Dropout(0.25)
        self.drop2 = nn.Dropout(0.2)

    def features(self, x: torch.Tensor) -> torch.Tensor:
        for blk in self.blocks:
            if isinstance(blk, nn.ModuleDict):
                x = self.act(blk['bn'](blk['conv'](x)))
            else:
                x = blk(x)
        return torch.flatten(x, 1)

    def embed(self, x: torch.Tensor) -> torch.Tensor:
        return self.act(self.bn_fc1(self.fc1(self.drop1(self.features(x)))))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.fc2(self.drop2(self.embed(x)))
