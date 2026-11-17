"""Portal scroll-header: build the layered assets from two stills (a door/portal + the world behind it).

    python3 prep.py config.json            -> OUT/*.webp + OUT/scene.json

Units = pixels of the ORIGINAL door image (W x H). Layers are exported at 1x..4x of that grid from the
4x AI-upscaled copies (sr.py). Only the measured door geometry goes in the config (check it with
measure.py); everything else (zoom centre, zoom depth, layer crops, switch points, how big the world
behind the door must start) is derived here and written to scene.json, which the page reads.
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
Image.MAX_IMAGE_PIXELS = None

# screens every derived value is checked against (css width, css height, device pixel ratio)
VIEWPORTS = {
    'phone': [(428, 926, 3), (390, 844, 3), (430, 932, 3), (414, 736, 3), (360, 800, 3), (375, 667, 2), (375, 553, 2), (768, 1024, 2)],
    'desktop': [(1280, 720, 1), (1366, 768, 1), (1440, 900, 2), (1512, 982, 2), (1536, 864, 1.25), (1728, 1117, 2), (1920, 1080, 1), (2560, 1440, 1)],
}
REF = {'phone': (428, 926, 3), 'desktop': (1440, 900, 2)}   # screen the sharpness switch points are tuned for
AP, C1 = .70, 1.06            # share of the scroll spent approaching the door; final zoom of the world image


def arch(sc, d, feather, size):
    m = Image.new('L', size, 0); dr = ImageDraw.Draw(m)
    xl, xr, top, bot = [v * sc for v in (d['xl'], d['xr'], d['top'], d['bot'])]
    r = (xr - xl) / 2; cx = (xl + xr) / 2; cy = top + r
    dr.ellipse([cx - r, top, cx + r, top + 2 * r], fill=255)
    dr.rectangle([xl, cy, xr, bot], fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather * sc)) if feather else m


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def ease(x):
    x = min(1.0, max(0.0, x)); return x * x * (3 - 2 * x)


def lum(a): return a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114


def restore_stars(esr, orig_up, sigma, lo=10, hi=38, gain=.9, ymax=None):
    """Add back faint stars the AI upscaler cleaned away (high-pass of the original)."""
    o = orig_up.astype(np.float32)
    blur = np.array(Image.fromarray(orig_up).filter(ImageFilter.GaussianBlur(sigma))).astype(np.float32)
    hp = o - blur
    m = np.clip((lum(hp) - lo) / (hi - lo), 0, 1)[..., None]
    if ymax is not None: m[int(ymax):] = 0
    out = esr.astype(np.float32) + np.clip(hp, 0, None) * m * gain
    return np.clip(out + .5, 0, 255).astype(np.uint8)


def crop_units(img, sc, r):
    x, y, w, h = r
    return img.crop((round(x * sc), round(y * sc), round((x + w) * sc), round((y + h) * sc)))


def cover_to(img, size):
    """Resize + centre-crop so img fills size exactly (used when the world image has another aspect)."""
    W, H = size; k = max(W / img.width, H / img.height)
    im = img.resize((math.ceil(img.width * k), math.ceil(img.height * k)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))


# ---------------------------------------------------------------- geometry
def view_bounds(Q, W, H, s):
    """Widest area of the image any screen can show at zoom s (cover fit, zoom anchored at Q)."""
    return (Q[0] * (1 - 1 / s), Q[1] * (1 - 1 / s), Q[0] + (W - Q[0]) / s, Q[1] + (H - Q[1]) / s)


def screen_rect(vw, vh, W, H, Q, s):
    Kc = max(vw / W, vh / H); qx = (vw - W * Kc) / 2 + Kc * Q[0]; qy = (vh - H * Kc) / 2 + Kc * Q[1]; a = s * Kc
    return (Q[0] - qx / a, Q[1] - qy / a, Q[0] + (vw - qx) / a, Q[1] + (vh - qy) / a)


def inside_arch(I, x, y):
    r = (I['xr'] - I['xl']) / 2; cx = (I['xl'] + I['xr']) / 2; cy = I['top'] + r
    if x < I['xl'] or x > I['xr'] or y > I['bot']: return False
    return y >= cy or (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def s_cover(I, vw, vh, W, H, Q):
    """Smallest zoom at which the whole screen is inside the opening (the arch is convex: test corners)."""
    lo, hi = 1.0, 40.0
    for _ in range(60):
        s = (lo + hi) / 2; x0, y0, x1, y1 = screen_rect(vw, vh, W, H, Q, s)
        if all(inside_arch(I, x, y) for x, y in ((x0, y0), (x1, y0), (x0, y1), (x1, y1))): hi = s
        else: lo = s
    return hi


def cosmos_need(vw, vh, W, H, Q, OPC, CC, PORT, SMAX, t):
    """Smallest world-image zoom (c) that still fills the visible part of the opening (same maths as the page)."""
    Kc = max(vw / W, vh / H); qx = (vw - W * Kc) / 2 + Kc * Q[0]; qy = (vh - H * Kc) / 2 + Kc * Q[1]
    s = 1 / (1 - t * (1 - 1 / SMAX)); a = s * Kc; e = qx - a * Q[0]; f = qy - a * Q[1]
    px = e + a * OPC[0]; py = f + a * OPC[1]; m = ease((t - .5) / .5); cx = px + (vw / 2 - px) * m; cy = py + (vh / 2 - py) * m
    xL = max(0, e + a * PORT[0]); xR = min(vw, e + a * (PORT[0] + PORT[2])); yT = max(0, f + a * PORT[1]); yB = min(vh, f + a * (PORT[1] + PORT[3]))
    return s, max((cx - xL) / CC[0], (xR - cx) / (W - CC[0]), (cy - yT) / CC[1], (yB - cy) / (H - CC[1])) / Kc


def derive(cfg, W, H):
    I, O = cfg['inner'], cfg['outer']; HZ0, HZ1 = cfg['horizon']; target = cfg.get('target', 'phone')
    VPS = VIEWPORTS[target]; ow, oh = I['xr'] - I['xl'], I['bot'] - I['top']
    Q = [round((I['xl'] + I['xr'])), round(2 * (I['top'] + .65 * oh))]; Q = [Q[0] / 2, Q[1] / 2]   # zoom centre
    OPC = [(I['xl'] + I['xr']) / 2, (I['top'] + I['bot']) / 2]
    CC = [W / 2, H / 2]
    PORT = [I['xl'] - 1.5, I['top'] - 1.5, ow + 3, oh + 2.5]          # clip of the world image (the frame hides its corners)
    vw, vh, dpr = REF[target]; KD = max(vw / W, vh / H) * dpr
    S1 = round(max(1.0, 2 / KD), 3); S2 = round(max(S1 * 1.25, 3 / KD), 3)   # switch to the 3x / 4x layer
    top = math.floor(O['top'] - 9)                                      # the foreground is empty above the arch
    lay = lambda s: (lambda b: [max(0, math.floor(b[0])), top, min(W, math.ceil(b[2]) + 1) - max(0, math.floor(b[0])),
                                min(H, math.ceil(b[3]) + 1) - top])(view_bounds(Q, W, H, s))
    R = {'fg-lo': [0, top, W, H - top], 'fg-mid': lay(S1), 'fg-hi': lay(S2),
         'in-lo': [math.floor(I['xl'] - 12.5), math.floor(I['top'] - 11), math.ceil(ow + 25), math.ceil(oh + 24)],
         'glow': [math.floor(I['xl'] - 97.5), math.floor(I['top'] - 91), math.ceil(ow + 196), math.ceil(oh + 144)]}
    R['in-hi'] = list(R['in-lo'])
    # sky: only the part ever seen (it shows near the horizon until the arch is wider than the screen)
    s_side = W / (O['xr'] - O['xl']); y_need = max(HZ1 + 40, Q[1] + s_side * (HZ1 + 10 - Q[1]))
    SKY_H = int(min(H, math.ceil(y_need / 16) * 16)); R['sky'] = [0, 0, W, SKY_H]
    R['cosmos-1x'] = R['cosmos-2x'] = [0, 0, W, H]
    # zoom depth: at 94 % of it the opening must fill every screen
    sc = max(s_cover(I, *v[:2], W, H, Q) for v in VPS); SMAX = round(max(5.0, 1.03 * sc / .94), 2)
    if SMAX > 8: print(f'WARNING: opening is small for this image (zoom {SMAX}); the frame will look soft near the end')
    # how big the world behind the door must start so it always fills the opening (2.5 % margin)
    ts = [i / 400 for i in range(401)]; C0 = None
    for c0 in [x / 100 for x in range(30, 107)]:
        ok = True
        for vw_, vh_, _ in VPS:
            for t in ts:
                s, need = cosmos_need(vw_, vh_, W, H, Q, OPC, CC, PORT, SMAX, t)
                if s < 1.12: continue
                c = c0 / (1 - t * (1 - c0 / C1))
                if c < 1.025 * need: ok = False; break
            if not ok: break
        if ok: C0 = c0; break
    if C0 is None: C0 = C1; print('NOTE: world image never fills the opening by itself; the page enlarges it as needed')
    geo = dict(W=W, H=H, Q=Q, OPC=OPC, CC=CC, PORT=PORT, SMAX=SMAX, SIN=round(.94 * SMAX, 3),
               GF=[round(.72 * SMAX, 3), round(.92 * SMAX, 3)], SF=[round(.52 * SMAX, 3), round(.84 * SMAX, 3)],
               AP=AP, C0=C0, C1=C1, S1=S1, S2=S2, D=round(min(2.0, max(1.25, KD)), 2))
    return R, geo, VPS


def report(R, geo, VPS):
    W, H, Q = geo['W'], geo['H'], geo['Q']; bad = 0
    for vw, vh, dpr in VPS:
        KD = max(vw / W, vh / H) * dpr; S1 = max(geo['S1'], 2 / KD); S2 = max(geo['S2'], 3 / KD); miss = 0
        for i in range(0, 1001):
            t = i / 1000 * .999; s = 1 / (1 - t * (1 - 1 / geo['SMAX']))
            if s >= geo['SIN']: break
            n = 'fg-lo' if s < S1 else 'fg-mid' if s < S2 else 'fg-hi'; r = R[n]
            x0, y0, x1, y1 = screen_rect(vw, vh, W, H, Q, s); need = (max(x0, 0), max(y0, r[1]), min(x1, W), min(y1, H))
            if need[1] >= need[3]: continue
            miss = max(miss, r[0] - need[0], need[2] - (r[0] + r[2]), need[3] - (r[1] + r[3]))
        bad += miss > .01
        print(f'  {vw}x{vh}@{dpr}: switch {S1:.2f}/{S2:.2f}  layer gap {max(miss, 0):.2f}  {"OK" if miss <= .01 else "FAIL"}')
    return bad == 0


def main(cfg_path):
    cfg = json.load(open(cfg_path)); base = os.path.dirname(os.path.abspath(cfg_path))
    p = lambda k: os.path.join(base, cfg[k])
    OUT = os.path.join(base, cfg.get('out', 'out')) + '/'; os.makedirs(OUT, exist_ok=True)
    O = Image.open(p('door')).convert('RGB'); W, H = O.size
    X4 = Image.open(p('door_x4')).convert('RGB'); assert X4.size == (W * 4, H * 4), ('door_x4 must be exactly 4x', X4.size)
    I, OU = cfg['inner'], cfg['outer']; HZ0, HZ1 = cfg['horizon']
    R, geo, VPS = derive(cfg, W, H)
    print('geometry:', json.dumps(geo)); print('layers:', json.dumps(R))
    if not report(R, geo, VPS): sys.exit('layer coverage failed - check the geometry')
    q = lambda name, img, qual=94, alpha=False: (img.save(OUT + name, 'WEBP', quality=qual, method=6, alpha_quality=95 if alpha else 100), print(' ', name, img.size))

    # alpha masks at 4x: frame + ground (foreground) and the opening (original interior)
    S4 = (W * 4, H * 4)
    inner4 = np.array(arch(4, I, 1.2, S4), np.float32) / 255
    outer4 = np.array(arch(4, OU, 1.4, S4), np.float32) / 255
    yy = (np.arange(H * 4, dtype=np.float32) / 4)[:, None]
    fg_a4 = np.maximum(np.repeat(smooth(yy, HZ0, HZ1), W * 4, axis=1), outer4) * (1 - inner4); del outer4
    x4 = np.array(X4)
    fg4 = Image.fromarray(np.dstack([x4, (fg_a4 * 255 + .5).astype(np.uint8)]), 'RGBA')
    in4 = Image.fromarray(np.dstack([x4, (inner4 * 255 + .5).astype(np.uint8)]), 'RGBA'); del fg_a4, inner4
    for n, k in (('fg-lo', 2), ('fg-mid', 3), ('fg-hi', 4)):
        im = crop_units(fg4, 4, R[n]); q(n + '.webp', im if k == 4 else im.resize((R[n][2] * k, R[n][3] * k), Image.LANCZOS), alpha=True)
    im = crop_units(in4, 4, R['in-lo']); q('in-lo.webp', im.resize((R['in-lo'][2] * 2, R['in-lo'][3] * 2), Image.LANCZOS), alpha=True)
    q('in-hi.webp', crop_units(in4, 4, R['in-hi']), alpha=True); del fg4, in4

    # sky at 2x (stars restored), below the horizon replaced by plain far ground so nothing shows twice
    esr2 = np.array(X4.resize((W * 2, H * 2), Image.LANCZOS)); o2 = np.array(O.resize((W * 2, H * 2), Image.LANCZOS))
    sky = restore_stars(esr2, o2, 2.5, ymax=HZ0 * 2); del esr2
    band = np.array(O)[int(HZ1 - 10):int(HZ1 + 8)]; m = .17 * (OU['xr'] - OU['xl'])
    cols = [c for c in range(W) if c < OU['xl'] - m or c > OU['xr'] + m] or list(range(W))
    side = band[:, cols].reshape(-1, 3).mean(0)
    yy2 = (np.arange(H * 2, dtype=np.float32) / 2)[:, None, None]
    far = side[None, None, :] * (1 - .25 * smooth(yy2, HZ1 - 8, HZ1 + 412)) + np.random.default_rng(7).normal(0, 1.6, (H * 2, W * 2, 1))
    blend = smooth(yy2, HZ0 + 2, HZ1 - 6)
    sky = np.clip(sky * (1 - blend) + far * blend + .5, 0, 255).astype(np.uint8)
    q('sky.webp', Image.fromarray(sky[:R['sky'][3] * 2]), 92); del sky, o2

    # the world behind the door (same size as the door image; other aspects are cover-cropped)
    C = Image.open(p('world')).convert('RGB'); C4 = Image.open(p('world_x4')).convert('RGB')
    if C.size != (W, H): print('NOTE: world image cover-cropped from', C.size); C = cover_to(C, (W, H))
    if C4.size != (W * 4, H * 4): C4 = cover_to(C4, (W * 4, H * 4))
    c2 = restore_stars(np.array(C4.resize((W * 2, H * 2), Image.LANCZOS)), np.array(C.resize((W * 2, H * 2), Image.LANCZOS)), 2.5, gain=.7)
    q('cosmos-2x.webp', Image.fromarray(c2), 92); q('cosmos-1x.webp', C4.resize((W, H), Image.LANCZOS), 92)

    # golden glow sprite (rim + floor) at 2x
    gx, gy, gw, gh = R['glow']; sc = 2; S = lambda v: v * sc
    rim = Image.new('L', (gw * sc, gh * sc), 0); dr = ImageDraw.Draw(rim)
    r = (I['xr'] - I['xl']) / 2; cx = (I['xl'] + I['xr']) / 2 - gx; cy = I['top'] + r - gy
    dr.arc([S(cx - r), S(I['top'] - gy), S(cx + r), S(I['top'] - gy + 2 * r)], 180, 360, fill=255, width=S(3))
    dr.line([S(I['xl'] - gx), S(cy), S(I['xl'] - gx), S(I['bot'] - gy)], fill=255, width=S(3))
    dr.line([S(I['xr'] - gx), S(cy), S(I['xr'] - gx), S(I['bot'] - gy)], fill=255, width=S(3))
    rim = np.array(rim.filter(ImageFilter.GaussianBlur(S(5))), np.float32)
    fw = .676 * (I['xr'] - I['xl']); flo = Image.new('L', (gw * sc, gh * sc), 0)
    ImageDraw.Draw(flo).ellipse([S(cx - fw), S(I['bot'] - gy - 16), S(cx + fw), S(I['bot'] - gy + 16)], fill=255)
    flo = np.array(flo.filter(ImageFilter.GaussianBlur(S(12))), np.float32)
    a = np.clip(rim / max(rim.max(), 1) + flo / max(flo.max(), 1) * .85, 0, 1)
    col = np.array(cfg.get('glow_rgb', [255, 196, 122]), np.float32)
    q('glow.webp', Image.fromarray(np.dstack([np.broadcast_to(col, a.shape + (3,)), a * 255]).astype(np.uint8), 'RGBA'), 90, True)

    # twinkling stars, denser where the sky is bright (Milky Way), never on or near the arch
    L = lum(np.array(O, np.float32)); ytop = HZ0 - 26
    mw = np.array(Image.fromarray(np.clip(L, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(22)), np.float32)
    outer1 = np.array(arch(1, OU, 0, (W, H))) > 0; half = (OU['xr'] - OU['xl']) / 2 + 17
    rng = np.random.default_rng(11); stars = []; mmax = mw[:int(ytop)].max()
    while len(stars) < cfg.get('stars', 240):
        x, y = rng.uniform(4, W - 4), rng.uniform(4, ytop)
        if outer1[int(y), int(x)] or (abs(x - geo['OPC'][0]) < half and y > OU['top'] - 25): continue
        if rng.random() > .22 + .78 * (mw[int(y), int(x)] / mmax) ** 1.6: continue
        big = rng.random()
        stars.append([round(x, 1), round(y, 1), round(.5 + (1.3 if big > .93 else .55) * rng.random(), 2),
                      round(rng.uniform(0, 6.28), 2), round(rng.uniform(.6, 2.2), 2), int(rng.random() > .6)])
    geo['SKYH'] = math.ceil(max(st[1] for st in stars) + 9)
    names = ['sky', 'fg-lo', 'fg-mid', 'fg-hi', 'in-lo', 'in-hi', 'cosmos-1x', 'cosmos-2x', 'glow']
    sizes = {n: os.path.getsize(OUT + n + '.webp') for n in names}
    json.dump({'R': R, 'geo': geo, 'bytes': sizes, 'stars': stars}, open(OUT + 'scene.json', 'w'), separators=(',', ':'))
    print('scene.json written;', round(sum(sizes.values()) / 1e6, 2), 'MB of layers')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'config.json')
