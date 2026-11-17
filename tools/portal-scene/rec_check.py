"""Check a phone screen recording for stutter, frame by frame.

    python3 rec_check.py recording.mp4 [outdir]

Prints size/fps/duration and md5 (same md5 as an earlier file = the same recording sent again),
writes sheet.png (one frame every 0.5 s) and lists stalls: runs of identical frames in the middle of
motion. A smooth scroll changes every frame; 'frozen for 6 frames then a jump' is what users feel as
stutter. Look at full frames too (ffmpeg -ss T -i rec.mp4 -frames:v 1 f.png) for sharpness at 1:1.
"""
import glob, hashlib, json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw


def main(src, out=None):
    out = out or os.path.splitext(src)[0] + '_check'; os.makedirs(out, exist_ok=True)
    md5 = hashlib.md5(open(src, 'rb').read()).hexdigest()
    pr = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                    'stream=width,height,avg_frame_rate,nb_frames:format=duration', '-of', 'json', src]))
    st = pr['streams'][0]; dur = float(pr['format']['duration']); n, dn = map(int, st['avg_frame_rate'].split('/')); fps = n / dn
    print(f"{st['width']}x{st['height']}  {fps:.1f} fps  {dur:.2f} s  md5 {md5}")
    for f in glob.glob(out + '/g_*.png'): os.remove(f)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', 'scale=160:-2', '-vsync', '0', out + '/g_%05d.png'], check=True)
    fs = sorted(glob.glob(out + '/g_*.png')); A = [np.asarray(Image.open(f).convert('L'), np.float32) for f in fs]
    d = np.array([np.abs(A[i] - A[i - 1]).mean() for i in range(1, len(A))])
    moving = d > 1.0; stalls = []; i = 0
    while i < len(d):
        if d[i] < .4:
            j = i
            while j < len(d) and d[j] < .4: j += 1
            before = moving[max(0, i - 4):i].any(); after = moving[j:j + 2].any()
            if before and after and 2 <= j - i <= 20: stalls.append((i / fps, j - i))   # longer = the user paused
            i = j
        else: i += 1
    seg = moving.sum(); print(f'frames with motion: {seg}   stalls inside motion: {len(stalls)}')
    for t, k in stalls[:25]: print(f'  at {t:5.2f}s frozen {k} frames ({k / fps * 1000:.0f} ms)')
    sheet = sorted(range(0, len(fs), max(1, round(fps / 2)))); tw = 160; th = A[0].shape[0]
    g = Image.new('RGB', (9 * tw, ((len(sheet) + 8) // 9) * (th + 14)), 'white'); dr = ImageDraw.Draw(g)
    for k, idx in enumerate(sheet):
        x, y = (k % 9) * tw, (k // 9) * (th + 14); g.paste(Image.open(fs[idx]).convert('RGB'), (x, y + 14)); dr.text((x + 3, y + 1), f'{idx / fps:.1f}s', fill='black')
    g.save(out + '/sheet.png'); print('sheet ->', out + '/sheet.png')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
