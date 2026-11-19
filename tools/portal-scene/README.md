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
5b. Deep-zoom detail (recommended): `python3 xhi.py config.json preview/v5` (~3 min phone, ~7 min laptop).
   Near the end of the walk the 4x frame is enlarged 2-3x on phones and retina laptops; this adds an 8x
   copy of only the frame + floor the screen can still see (second Real-ESRGAN pass over the halved 4x crop),
   as `fg-x-*.webp` pieces that cross-fade where they meet (scaled canvases that only touch leave a hairline).
   The page (`intro-v5.html` and later) loads them after the start, and only on screens that need them.
6. Check: `python3 -m RangeHTTPServer 8772` in the site folder, then
   `python3 shots.py http://localhost:8772/index.html /tmp/s 428x926@3 390x844@3 --perf`
   (looks, JS errors, long tasks; headless Chromium has no GPU, so fps there is only relative).
7. Phone recordings from the client: `python3 rec_check.py rec.mp4` lists freezes frame by frame.

## Config options (besides the measured geometry)
- `inner`: the opening, `{"shape":"arch"|"rect", xl,xr,top,bot}`; `outer`: one shape or a list of shapes, where a
  polygon `{"pts":[[x,y],...]}` covers parts in front such as an open door leaf.
- `crossfade` [s0, s1]: zoom range where the door's own interior fades into the world image (default [1.12, 1.9]).
- `glow_gain`, `glow_rgb`, `glow_fade` [s0, s1]: the light along the opening; `bloom`: peak of the warm glow when
  passing the door (0 = none; Bu Sa'ad found a long white glow annoying).
- `max_zoom` (7) / `flash_zoom` (5): if the opening cannot fill typical screens below `max_zoom`, the zoom stops at
  `flash_zoom` and the door scene dissolves into the world image. The page also decides this per screen, so old
  16:9 phones dissolve while modern phones walk through the door.

## Page notes (intro-v5 and later)
- Phones: the browser bar sliding away makes the screen taller without changing its width. The page keeps
  the framing, but covers the tallest height seen (`VHC`) and only hides the frame once that whole height is
  inside the opening (`SINs`); otherwise a dark band showed at the bottom while passing the door.
- The scroll range is measured in px from the first viewport, so the bar sliding in/out no longer nudges the scene.
- Every hidden layer is shown at 0.4% opacity for a few frames after loading (and the 8x pieces after they
  arrive), so the graphics chip already holds them when the zoom switches level.
