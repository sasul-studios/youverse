"""8x detail layer for the deep part of the zoom (a second Real-ESRGAN pass over the 4x picture).

    python3 xhi.py config.json LAYER_DIR [S3]

Near the end of the walk through the door the 4x frame layer is enlarged 2-3x on phones and retina
laptops, so the door frame and the floor go soft. This builds an 8x copy of just the area any typical
screen can still see from zoom S3 on (default 2.7 phone, 2.0 desktop): the 4x crop is halved, then
upscaled 4x again by Real-ESRGAN, which redraws crisp edges instead of blurring them.
Only the opaque parts are kept (frame pieces above the horizon + the ground below it), so the opening
costs no memory. Writes fg-x-<n>.webp into LAYER_DIR and adds R['fg-x'] (list of rects in image units),
geo S3 / XS and bytes to LAYER_DIR/scene.json. The page loads them after the scene starts.
"""
import json, os, sys, time
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
Image.MAX_IMAGE_PIXELS = None
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import prep, sr  # noqa: E402

XS = 8


def moved(d, dx, dy):
    d = dict(d)
    if d['shape'] == 'poly': d['pts'] = [[x - dx, y - dy] for x, y in d['pts']]
    for k, v in (('xl', dx), ('xr', dx), ('top', dy), ('bot', dy)):
        if k in d: d[k] = d[k] - v
    return d


def seamless_cut(full, rects, x0, y0, xs=XS):
    """Cut pieces that join without a hairline. Scaled canvases that merely touch leave a thin see-through line,
    and plain overlaps draw soft edges twice. So pieces that meet overlap by 1 unit each way and cross-fade:
    the lower piece fades out over the 2 units, the upper one carries exactly what is missing, so drawn in this
    order they add up to the original picture. Returns [(rect_in_units, rgba), ...] in drawing order."""
    Hb, Wb = full.shape[:2]; a = full[..., 3].astype(np.float32) / 255; n = len(rects)
    w = np.zeros((n, Hb, Wb), np.float32); ext = [list(r) for r in rects]
    for k, (rx, ry, rw, rh) in enumerate(rects): w[k, (ry - y0) * xs:(ry - y0 + rh) * xs, (rx - x0) * xs:(rx - x0 + rw) * xs] = 1
    ramp = 1 - (np.arange(2 * xs, dtype=np.float32) + .5) / (2 * xs)          # 1 -> 0 across the 2-unit band
    for i in range(n):
        for j in range(n):
            if i == j: continue
            A, B = rects[i], rects[j]
            if A[0] + A[2] == B[0]:                                              # A left of B
                ya, yb = max(A[1], B[1]), min(A[1] + A[3], B[1] + B[3])
                if yb <= ya: continue
                b = A[0] + A[2]; X = slice((b - 1 - x0) * xs, (b + 1 - x0) * xs); Y = slice((ya - y0) * xs, (yb - y0) * xs)
                w[i][Y, X] = ramp[None, :]; w[j][Y, X] = 1 - ramp[None, :]
                ext[i][2] = max(ext[i][2], b + 1 - ext[i][0]); ext[j][2] += ext[j][0] - (b - 1); ext[j][0] = min(ext[j][0], b - 1)
            if A[1] + A[3] == B[1]:                                              # A above B
                xa, xb = max(A[0], B[0]), min(A[0] + A[2], B[0] + B[2])
                if xb <= xa: continue
                b = A[1] + A[3]; Y = slice((b - 1 - y0) * xs, (b + 1 - y0) * xs); X = slice((xa - x0) * xs, (xb - x0) * xs)
                w[i][Y, X] = ramp[:, None]; w[j][Y, X] = 1 - ramp[:, None]
                ext[i][3] = max(ext[i][3], b + 1 - ext[i][1]); ext[j][3] += ext[j][1] - (b - 1); ext[j][1] = min(ext[j][1], b - 1)
    S = w.sum(0); w = np.where(S > 0, w / np.maximum(S, 1e-6), 0)
    out = []; C = np.zeros((Hb, Wb), np.float32)
    for k in range(n):                                                           # coverage after piece k = a * (weights so far)
        Cn = np.minimum(C + a * w[k], 1); ak = np.where(1 - C > 1e-4, (Cn - C) / np.maximum(1 - C, 1e-4), 0); C = Cn
        rx, ry, rw, rh = ext[k]; Y = slice((ry - y0) * xs, (ry - y0 + rh) * xs); X = slice((rx - x0) * xs, (rx - x0 + rw) * xs)
        piece = full[Y, X].copy(); piece[..., 3] = np.clip(ak[Y, X] * 255 + .5, 0, 255).astype(np.uint8)
        out.append(([rx, ry, rw, rh], piece))
    return out


def main(cfg_path, out, S3=None):
    cfg = json.load(open(cfg_path)); base = os.path.dirname(os.path.abspath(cfg_path))
    meta = json.load(open(os.path.join(out, 'scene.json'))); g = meta['geo']; W, H, Q = g['W'], g['H'], g['Q']
    target = cfg.get('target', 'phone'); S3 = S3 or (2.7 if target == 'phone' else 2.0)
    I = prep.norm_shape(cfg['inner']); OUL = [prep.norm_shape(d) for d in (cfg['outer'] if isinstance(cfg['outer'], list) else [cfg['outer']])]
    OU = prep.bbox(OUL); HZ0, HZ1 = cfg['horizon']

    # everything any typical screen can show from zoom S3 on (the view only shrinks as the zoom grows)
    rs = [prep.screen_rect(vw, vh, W, H, Q, S3) for vw, vh in prep.TYPICAL[target]]
    x0 = max(0, int(min(r[0] for r in rs)) - 2); x1 = min(W, int(max(r[2] for r in rs)) + 3)
    y0 = max(0, int(min(r[1] for r in rs)) - 2, int(min(OU['top'], HZ0)) - 3); y1 = min(H, int(max(r[3] for r in rs)) + 3)
    w, h = x1 - x0, y1 - y0
    print(f'region x {x0}..{x1}  y {y0}..{y1}  ({w}x{h} units -> {w * XS}x{h * XS} px)', flush=True)

    # colour: halve the 4x crop, then Real-ESRGAN 4x again -> 8x with crisp edges
    X4 = Image.open(os.path.join(base, cfg['door_x4'])).convert('RGB')
    src = X4.crop((x0 * 4, y0 * 4, x1 * 4, y1 * 4)).resize((w * 2, h * 2), Image.LANCZOS); del X4
    t = time.time(); rgb = sr.upscale(sr.load(), np.array(src)); print(f'esrgan {time.time() - t:.0f}s', flush=True)

    # alpha drawn directly at 8x for this crop (same recipe as prep.py: ground ramp + frame, minus the opening)
    S = (w * XS, h * XS)
    inner = np.array(prep.shape_mask(XS, moved(I, x0, y0), 1.2, S), np.float32) / 255
    outer = prep.union_mask(XS, [moved(d, x0, y0) for d in OUL], 1.4, S)
    yy = (y0 + np.arange(S[1], dtype=np.float32) / XS)[:, None]
    a = np.maximum(np.repeat(prep.smooth(yy, HZ0, HZ1), S[0], axis=1), outer) * (1 - inner)
    full = np.dstack([rgb, (a * 255 + .5).astype(np.uint8)])

    # pieces without overlap: frame above the horizon (left, right, top of the opening) + the ground below
    yh = int(HZ0); ix0, ix1, iy0 = int(I['xl']) + 3, int(I['xr']) - 3, int(I['top']) + 3
    if I['shape'] == 'arch': iy0 += int((I['xr'] - I['xl']) / 2)
    fx0, fx1 = max(x0, int(OU['xl']) - 3), min(x1, int(OU['xr']) + 4)
    rects = []
    if yh > y0:
        rects += [[fx0, y0, ix0 - fx0, yh - y0], [ix1, y0, fx1 - ix1, yh - y0], [ix0, y0, ix1 - ix0, iy0 - y0]]
    rects.append([x0, max(y0, yh), w, y1 - max(y0, yh)])
    rects = [r for r in rects if r[2] > 0 and r[3] > 0]
    # overlap neighbours by 1 unit: scaled canvases that only touch show a hairline seam where their edges meet
    total = 0; kept = []
    for n, (rect, piece) in enumerate(seamless_cut(full, rects, x0, y0)):
        if piece[..., 3].max() < 3: continue
        name = f'fg-x-{len(kept)}.webp'
        Image.fromarray(piece, 'RGBA').save(os.path.join(out, name), 'WEBP', quality=90, method=6, alpha_quality=95)
        b = os.path.getsize(os.path.join(out, name)); total += b; kept.append(rect)
        print(f'  {name} {piece.shape[1]}x{piece.shape[0]}  {b // 1024} KB', flush=True)
    meta['R']['fg-x'] = kept; g['S3'] = S3; g['XS'] = XS; meta['bytes']['fg-x'] = total
    json.dump(meta, open(os.path.join(out, 'scene.json'), 'w'), separators=(',', ':'))
    print(f'fg-x: {len(kept)} pieces, {total // 1024} KB, {sum(r[2] * r[3] for r in kept) * XS * XS / 1e6:.1f} MP')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else None)
