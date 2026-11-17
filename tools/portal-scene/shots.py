"""Screenshot a scroll page at several scroll points (headless Chromium) + optional smoothness probe.

    python3 shots.py URL OUTPREFIX [WxH@DPR ...] [--perf]

Saves OUTPREFIX_<vp>_<pp>.png and OUTPREFIX_<vp>_grid.png, prints the page mode and JS errors.
--perf scrolls top->bottom in 4 s and prints fps / slowest frames / long tasks (main thread blocked > 50 ms).
Serve the folder with `python3 -m RangeHTTPServer PORT` (range requests are needed for video seeking).
Headless Chromium has no GPU and cannot play H.264: trust it for looks, errors and long tasks only;
the real smoothness test is the phone (ask for a screen recording, check it with rec_check.py).
"""
import asyncio, json, sys
from playwright.async_api import async_playwright
from PIL import Image

PS = [0, .15, .30, .39, .50, .60, .66, .72, .85, 1.0]
PERF = '''async(mx)=>{const iv=[];let lt=0,long=0;try{new PerformanceObserver(l=>{long+=l.getEntries().length}).observe({type:'longtask'});}catch(e){}
 await new Promise(r=>{const t0=performance.now();function f(t){if(lt)iv.push(t-lt);lt=t;const e=t-t0;scrollTo(0,mx*Math.min(1,e/4000));if(e<4300)requestAnimationFrame(f);else r();}requestAnimationFrame(f);});
 iv.sort((a,b)=>a-b);const n=iv.length;return {fps:+(1000*n/iv.reduce((a,b)=>a+b,0)).toFixed(1),p95:+iv[Math.floor(n*.95)].toFixed(1),max:+iv[n-1].toFixed(1),longtasks:long};}'''


async def run(url, prefix, vps, perf):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for vp in vps:
            wh, d = vp.split('@'); w, h = map(int, wh.split('x')); d = float(d); mob = w < h
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=d, has_touch=mob, is_mobile=mob)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            await pg.goto(url); await pg.wait_for_timeout(6000)
            mx = await pg.evaluate('document.documentElement.scrollHeight-innerHeight')
            files = []
            for q in PS:
                await pg.evaluate(f'scrollTo(0,{int(mx * q)})'); await pg.wait_for_timeout(1400)
                f = f'{prefix}_{vp}_{int(q * 100):03d}.png'; await pg.screenshot(path=f); files.append(f)
            mode = await pg.evaluate('typeof mode!=="undefined"?mode:"?"')
            res = ''
            if perf:
                await pg.evaluate('scrollTo(0,0)'); await pg.wait_for_timeout(1500)
                res = json.dumps(await pg.evaluate(PERF, mx))
            print(vp, 'mode', mode, 'errors', errs[:5], res)
            tw = 214; th = round(tw * h / w); g = Image.new('RGB', (5 * tw, 2 * th))
            for i, f in enumerate(files): g.paste(Image.open(f).convert('RGB').resize((tw, th)), ((i % 5) * tw, (i // 5) * th))
            g.save(f'{prefix}_{vp}_grid.png'); await ctx.close()
        await b.close()


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if x != '--perf']
    asyncio.run(run(a[0], a[1], a[2:] or ['428x926@3', '390x844@3'], '--perf' in sys.argv))
