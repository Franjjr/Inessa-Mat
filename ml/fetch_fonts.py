"""Download handwriting fonts from Google Fonts (TTF) into ml/data/fonts/.

Google Fonts returns TTF URLs when the CSS API is queried with an old browser User-Agent.
Usage: ml/.venv/bin/python ml/fetch_fonts.py
"""
import os
import re
import sys
import urllib.request
import urllib.parse

from fonts_list import TRAIN_FONTS, TEST_FONTS

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'data', 'fonts')
UA = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:30.0) Gecko/20100101 Firefox/30.0'


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    ok, failed = 0, []
    for name in TRAIN_FONTS + TEST_FONTS:
        dest = os.path.join(OUT, name.replace(' ', '_') + '.ttf')
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            ok += 1
            continue
        try:
            css = fetch('https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(name)).decode('utf8')
            urls = re.findall(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', css)
            if not urls:
                raise RuntimeError('no font url in css')
            data = fetch(urls[0])
            with open(dest, 'wb') as f:
                f.write(data)
            ok += 1
        except Exception as e:  # noqa: BLE001
            failed.append((name, str(e)))
    print(f'fonts ok: {ok}, failed: {len(failed)}')
    for n, e in failed:
        print('  FAILED', n, e, file=sys.stderr)


if __name__ == '__main__':
    main()
