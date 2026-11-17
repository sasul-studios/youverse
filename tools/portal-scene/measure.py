"""Find and check the door geometry that prep.py needs.

    python3 measure.py config.json [check.png]

Draws the config's geometry on the ORIGINAL door image - inner opening (cyan), outer silhouette
(magenta), horizon band (yellow), zoom centre (red) - plus four 4x close-ups (arch top, left rim,
right rim, threshold), and prints brightness profiles that help place the numbers:
  inner = the glowing opening, cut just inside the bright rim (the world image shows through it)
  outer = the outside edge of the whole frame (everything inside it stays in front)
  horizon = [y0, y1] band where the sky fades into the ground (ground fully opaque from y1 down)
Move the numbers until every line sits on its edge in every close-up, then run prep.py.
If the config has no geometry yet, only the profiles and a horizon guess are printed.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw


def lum(a): return a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114


def outline(dr, d, k, ox, oy, col, w):
    if 'pts' in d:   # polygon (e.g. an open door leaf)
        P = [((x - ox) * k, (y - oy) * k) for x, y in d['pts']]; dr.line(P + P[:1], fill=col, width=w); return
    xl, xr, top, bot = [(v - o) * k for v, o in ((d['xl'], ox), (d['xr'], ox), (d['top'], oy), (d['bot'], oy))]
    if d.get('shape') == 'rect': dr.rectangle([xl, top, xr, bot], outline=col, width=w); return
    r = (xr - xl) / 2; cx = (xl + xr) / 2; cy = top + r
    dr.arc([cx - r, top, cx + r, top + 2 * r], 180, 360, fill=col, width=w)
    dr.line([xl, cy, xl, bot], fill=col, width=w); dr.line([xr, cy, xr, bot], fill=col, width=w)
    dr.line([xl, bot, xr, bot], fill=col, width=w)


def draw_all(img, g, k, ox=0, oy=0, w=2):
    dr = ImageDraw.Draw(img)
    for d in (g['outer'] if isinstance(g.get('outer'), list) else [g['outer']] if 'outer' in g else []): outline(dr, d, k, ox, oy, (255, 60, 220), w)
    if 'inner' in g: outline(dr, g['inner'], k, ox, oy, (40, 230, 255), w)
    for y in g.get('horizon', []): dr.line([0, (y - oy) * k, img.width, (y - oy) * k], fill=(255, 220, 40), width=w)
    if 'inner' in g:
        I = g['inner']; qx = ((I['xl'] + I['xr']) / 2 - ox) * k; qy = (I['top'] + .65 * (I['bot'] - I['top']) - oy) * k
        dr.line([qx - 10, qy, qx + 10, qy], fill=(255, 40, 40), width=w); dr.line([qx, qy - 10, qx, qy + 10], fill=(255, 40, 40), width=w)


def main(cfg_path, out=None):
    cfg = json.load(open(cfg_path)); base = os.path.dirname(os.path.abspath(cfg_path))
    door = Image.open(os.path.join(base, cfg['door'])).convert('RGB'); W, H = door.size; A = np.array(door, np.float32); L = lum(A)
    print(f'door {W}x{H} (units = these pixels)')
    # horizon guess: biggest brightness jump down the side columns (left/right 20 %), lower half of the image
    side = np.concatenate([L[:, :int(W * .2)], L[:, int(W * .8):]], 1).mean(1)
    sm = np.convolve(side, np.ones(5) / 5, 'same'); gr = sm[6:] - sm[:-6]; lo, hi = int(H * .45), int(H * .92)
    yh = lo + int(np.argmax(gr[lo:hi])) + 3
    print(f'rough horizon guess y~{yh} (often off: trust the yellow lines in the "horizon" close-up)')
    g = {k: cfg[k] for k in ('inner', 'outer', 'horizon') if k in cfg}
    ymid = int((g['inner']['top'] + g['inner']['bot']) / 2) if 'inner' in g else int(H * .55)
    row = L[ymid]; thr = row.max() * .75; peaks = []
    for x in range(1, W - 1):
        if row[x] >= thr and row[x] >= row[x - 1] and row[x] >= row[x + 1]: peaks.append(x)
    print(f'bright points on row y={ymid} (rim highlights / opening edges):', peaks[:12], '...' if len(peaks) > 12 else '')
    col = L[:, W // 2]; print('centre column brightness every 20 px from y=%d:' % int(H * .25),
                             ' '.join(f'{y}:{int(col[y])}' for y in range(int(H * .25), int(H * .85), 20)))
    if 'inner' not in g: return
    # overview + close-ups
    k0 = 1000 / H; ov = door.resize((round(W * k0), 1000), Image.LANCZOS); draw_all(ov, g, k0)
    I = g['inner']; cx = (I['xl'] + I['xr']) / 2; mid = (I['top'] + I['bot']) / 2; S = 90; Z = 4; tiles = []
    for (x, y, name) in ((cx, I['top'], 'arch top'), (I['xl'], mid, 'left rim'), (I['xr'], mid, 'right rim'), (max(S / 2, min(d.get('xl', min(q[0] for q in d.get('pts', [[1e9, 0]]))) for d in (g['outer'] if isinstance(g['outer'], list) else [g['outer']])) - 70) if 'outer' in g else S / 2, sum(g.get('horizon', [I['bot']] * 2)) / 2, 'horizon')):
        ox, oy = x - S / 2, y - S / 2
        t = door.crop((round(ox), round(oy), round(ox + S), round(oy + S))).resize((S * Z, S * Z), Image.LANCZOS)
        draw_all(t, g, Z, round(ox), round(oy), 2); ImageDraw.Draw(t).text((6, 6), name, fill=(255, 255, 255)); tiles.append(t)
    sheet = Image.new('RGB', (ov.width + S * Z * 2 + 30, max(1000, S * Z * 2 + 10)), (20, 20, 24)); sheet.paste(ov, (0, 0))
    for i, t in enumerate(tiles): sheet.paste(t, (ov.width + 10 + (i % 2) * (S * Z + 10), (i // 2) * (S * Z + 10)))
    out = out or os.path.join(base, 'check.png'); sheet.save(out); print('check image ->', out)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
