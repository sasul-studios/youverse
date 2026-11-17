#!/usr/bin/env bash
# One-time setup for sr.py: ncnn from PyPI + the Real-ESRGAN x4plus model files, taken from the
# realesrgan-ncnn-py wheel on PyPI (Hugging Face / pytorch / GitHub release downloads are blocked here).
set -euo pipefail
DIR="${1:-/tmp/sr/models}"; mkdir -p "$DIR"
pip install --break-system-packages -q ncnn numpy pillow
TMP=$(mktemp -d)
pip download -q realesrgan-ncnn-py==2.0.0 --no-deps --python-version 3.11 --only-binary=:all: --platform manylinux2014_x86_64 -d "$TMP"
python3 - "$TMP" "$DIR" <<'PY'
import glob, os, sys, zipfile
z = zipfile.ZipFile(glob.glob(sys.argv[1] + '/*.whl')[0])
for n in ('realesrgan-x4plus.param', 'realesrgan-x4plus.bin'):
    open(os.path.join(sys.argv[2], n), 'wb').write(z.read('realesrgan_ncnn_py/models/' + n))
print('models ->', sys.argv[2])
PY
rm -rf "$TMP"
