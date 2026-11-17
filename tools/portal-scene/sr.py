"""4x AI upscale (Real-ESRGAN x4plus) on the CPU with ncnn - no GPU, no Hugging Face needed.

    python3 sr.py in.png out.png [x,y,w,h]      (optional region = quick test)

Models: run setup_esrgan.sh once (models land in $SR_MODELS, default /tmp/sr/models).
Speed: ~10 s per 192 px tile on 2 CPUs -> a 941x1672 image takes ~7-8 min. Run it in the background.
lightmode + 192 px tiles keep memory near 2.5 GB (bigger tiles were killed for memory).
"""
import os, sys, time
import ncnn, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
MODELS = os.environ.get('SR_MODELS', '/tmp/sr/models')


def load():
    net = ncnn.Net(); net.opt.use_vulkan_compute = False; net.opt.num_threads = os.cpu_count() or 2
    net.opt.lightmode = True; net.opt.use_packing_layout = True
    net.load_param(os.path.join(MODELS, 'realesrgan-x4plus.param')); net.load_model(os.path.join(MODELS, 'realesrgan-x4plus.bin'))
    return net


def run_tile(net, arr):
    h, w, _ = arr.shape; ex = net.create_extractor()
    m = ncnn.Mat.from_pixels(np.ascontiguousarray(arr).tobytes(), ncnn.Mat.PixelType.PIXEL_RGB, w, h)
    m.substract_mean_normalize([], [1 / 255.0] * 3); ex.input('data', m); _, o = ex.extract('output')
    return np.clip(np.array(o).transpose(1, 2, 0) * 255 + .5, 0, 255).astype(np.uint8)


def upscale(net, arr, tile=192, pad=10):
    H, W, _ = arr.shape; out = np.zeros((H * 4, W * 4, 3), np.uint8); t0 = time.time(); n = 0
    ys, xs = range(0, H, tile), range(0, W, tile); tot = len(ys) * len(xs)
    for y in ys:
        for x in xs:
            y0, y1, x0, x1 = max(0, y - pad), min(H, y + tile + pad), max(0, x - pad), min(W, x + tile + pad)
            o = run_tile(net, arr[y0:y1, x0:x1])
            ty, tx, th, tw = (y - y0) * 4, (x - x0) * 4, (min(H, y + tile) - y) * 4, (min(W, x + tile) - x) * 4
            out[y * 4:y * 4 + th, x * 4:x * 4 + tw] = o[ty:ty + th, tx:tx + tw]; n += 1
            if n % 10 == 0: print(f'{n}/{tot} tiles {time.time() - t0:.0f}s', flush=True)
    return out


if __name__ == '__main__':
    src = np.array(Image.open(sys.argv[1]).convert('RGB'))
    if len(sys.argv) > 3: x, y, w, h = map(int, sys.argv[3].split(',')); src = src[y:y + h, x:x + w]
    t = time.time(); o = upscale(load(), src); Image.fromarray(o).save(sys.argv[2]); print('done', o.shape, round(time.time() - t, 1), 's')
