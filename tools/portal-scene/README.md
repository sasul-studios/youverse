# portal-scene: sharp, smooth scroll header from two stills

Two images in (a door/portal scene + the world behind the door, same size), a scroll-driven
"walk through the door" header out. Built for Youverse (`preview/intro-v3.html`, phone set in `preview/v3/`).

Why not a video: a phone shows only part of a 16:9 clip, magnified, so it looks soft; and redrawing big
images on a canvas every frame stutters on iPhone (WebKit re-decodes them). Here every layer is drawn
once into its own canvas and scrolling only changes CSS transform/opacity, so the GPU composites it
like a video: sharp (AI-upscaled 4x, three detail levels) and light (~2.7 MB instead of ~25 MB).

## Steps
1. `bash setup_esrgan.sh` (once per machine) - ncnn + Real-ESRGAN x4plus models.
2. Upscale both stills 4x (~8 min each for 941x1672 on 2 CPUs, run in background):
   `python3 sr.py door.png door_x4.png` and `python3 sr.py world.png world_x4.png`
3. Copy `youverse-phone.config.json`, point it at the files, set `"target"` (`phone` = portrait
   images, `desktop` = landscape images) and measure the door: `python3 measure.py config.json`
   and adjust `inner` / `outer` / `horizon` until the lines sit on the edges in `check.png`.
4. `python3 prep.py config.json` - writes the layers + `scene.json` (geometry, layer crops, zoom depth,
   start size of the world image) and checks layer coverage on 8 screen sizes.
5. Copy the output folder next to the page (e.g. `preview/v4/`) and set `PHONE_SET` / `DESK_SET` at the
   bottom of the page script. The page reads all geometry from `scene.json`.
6. Check: `python3 -m RangeHTTPServer 8772` in the site folder, then
   `python3 shots.py http://localhost:8772/intro-v3.html /tmp/s 428x926@3 390x844@3 --perf`
   (looks, JS errors, long tasks; headless Chromium has no GPU, so fps there is only relative).
7. Phone recordings from the client: `python3 rec_check.py rec.mp4` lists freezes frame by frame.
