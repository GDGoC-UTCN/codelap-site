/* CodeLap — teaser countdown; at zero the covered car glitches into the real one.
 *
 * Used by two pages:
 *   /                     → counts down to REVEAL_AT
 *   /supersecret/reveal   → <body data-demo="10">: counts down from 10 seconds
 */
(() => {
  "use strict";

  const REVEAL_AT = new Date("2026-10-26T20:00:00+02:00"); // 26 Oct, 20:00 Romania time (EET, after the clocks go back)
  const TEASER_START = new Date("2026-09-26T00:00:00+03:00"); // loading bar starts here

  const demoSecs = parseInt(document.body.dataset.demo, 10) || 0;
  const now0 = Date.now();
  let target = REVEAL_AT.getTime();
  let barStart = TEASER_START.getTime();
  if (demoSecs) {
    target = now0 + demoSecs * 1000;
    barStart = now0;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const COLORS = ["#0B306B", "#1E4E8F", "#3A8BD9", "#8FBDE6", "#1E64D8", "#06152F"];

  /* ─────────── Glitch background (with a burst mode for the reveal) ─────────── */
  const canvas = $("glitch-bg");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, blocks = [], lastSpawn = 0, lastFrame = 0;
  let boostUntil = 0; // while now < boostUntil, glitches spawn much faster

  function spawnBurst(now, heavy = false) {
    const y = rand(0, H), bandH = rand(6, heavy ? 120 : 60), cx = rand(-100, W);
    const count = (heavy ? 8 : 3) + ((Math.random() * 9) | 0);
    const life = rand(90, heavy ? 400 : 700);
    for (let i = 0; i < count; i++) {
      blocks.push({
        x: cx + rand(-220, 300),
        y: y + rand(0, bandH),
        w: Math.random() < (heavy ? 0.3 : 0.15) ? rand(120, heavy ? W * 0.6 : 380) : rand(6, 110),
        h: Math.random() < 0.7 ? rand(2, 7) : rand(8, heavy ? 30 : 18),
        color: pick(COLORS),
        a: rand(0.2, heavy ? 0.85 : 0.7),
        born: now + rand(0, 120),
        life: life * rand(0.5, 1.3),
        jitter: Math.random() < 0.35 ? rand(-24, 24) : 0,
      });
    }
    if (Math.random() < (heavy ? 0.5 : 0.18)) {
      blocks.push({ x: 0, y: rand(0, H), w: W, h: heavy ? 2 : 1, color: "#3A8BD9", a: 0.4, born: now, life: rand(60, 180), jitter: 0 });
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - lastFrame < 33) return;
    lastFrame = now;

    const boosted = Date.now() < boostUntil;
    if (now - lastSpawn > (boosted ? rand(20, 60) : rand(120, 420))) {
      spawnBurst(now, boosted);
      if (boosted || Math.random() < 0.12) spawnBurst(now, boosted);
      lastSpawn = now;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    blocks = blocks.filter((b) => now - b.born < b.life);
    for (const b of blocks) {
      if (now < b.born) continue;
      ctx.globalAlpha = Math.random() < 0.08 ? 0 : b.a;
      ctx.fillStyle = b.color;
      const dx = b.jitter && Math.random() < 0.3 ? b.jitter : 0;
      ctx.fillRect(Math.round(b.x + dx), Math.round(b.y), Math.round(b.w), Math.round(b.h));
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
  }
  window.addEventListener("resize", resize);
  resize();
  if (!reduceMotion) requestAnimationFrame(frame);

  /* ─────────── Both cars → horizontal strips, so rows can flip between them ─────────── */
  const STRIPS = 28;
  const cover = $("cover");
  const newCar = $("new");
  const coverStrips = [];
  const newStrips = [];
  for (let i = 0; i < STRIPS; i++) {
    const top = `${(i / STRIPS) * 100}%`;
    const height = `calc(${100 / STRIPS}% + 1px)`;

    const c = document.createElement("div");
    c.className = "tz__strip";
    c.style.top = top;
    c.style.height = height;
    c.style.backgroundSize = `100% ${STRIPS * 100}%`;
    c.style.backgroundPosition = `0 ${(i / (STRIPS - 1)) * 100}%`;
    cover.appendChild(c);
    coverStrips.push(c);

    // each new-car strip holds a full-frame copy of the photo, shifted up to its row
    const n = document.createElement("div");
    n.className = "tz__nstrip";
    n.style.top = top;
    n.style.height = height;
    const inner = document.createElement("div");
    inner.style.top = `${-i * 100}%`;
    inner.style.height = `${STRIPS * 100}%`;
    const img = document.createElement("img");
    img.src = "/assets/car-glitch.webp";
    img.alt = "";
    inner.append(img);
    n.appendChild(inner);
    newCar.appendChild(n);
    newStrips.push(n);
  }
  cover.classList.add("has-strips");

  /* ─────────── Countdown ─────────── */
  const units = {};
  document.querySelectorAll("#cd [data-u]").forEach((el) => (units[el.dataset.u] = el));
  const bar = $("bar");
  const load = $("load");
  const frameEl = $("frame");
  const pad = (n) => String(n).padStart(2, "0");
  let revealed = false;
  let lastSec = -1;

  function tick() {
    const left = Math.max(0, target - Date.now());
    const s = Math.ceil(left / 1000);
    units.d.textContent = pad(Math.floor(s / 86400));
    units.h.textContent = pad(Math.floor((s % 86400) / 3600));
    units.m.textContent = pad(Math.floor((s % 3600) / 60));
    units.s.textContent = pad(s % 60);

    const pct = Math.min(100, Math.max(0, ((Date.now() - barStart) / (target - barStart)) * 100)) || 0;
    bar.style.width = `${pct.toFixed(2)}%`;
    load.textContent = `Loading ${Math.floor(pct)}%`;

    // last 10 seconds: everything gets twitchier
    if (s <= 10 && s > 0 && !revealed) {
      body.classList.add("is-final");
      if (s !== lastSec && !reduceMotion) {
        boostUntil = Date.now() + 180;
        frameEl.animate(shakeFrames(4), { duration: 220 });
      }
    }
    lastSec = s;

    if (left <= 0 && !revealed) reveal(demoSecs ? 0 : 600);
  }

  function shakeFrames(amp) {
    return Array.from({ length: 8 }, (_, i) => ({
      transform: i === 7 ? "none" : `translate(${rand(-amp, amp)}px, ${rand(-amp / 2, amp / 2)}px)`,
    }));
  }

  /* ─────────── The reveal: the covered car glitches into the new one ─────────── */
  const MORPH_MS = 1700;
  const smooth = (x) => x * x * (3 - 2 * x);

  // Per-row switch-over points, loosely clustered in bands so it reads as signal corruption.
  const thresholds = coverStrips.map((_, i) => Math.min(0.95, Math.max(0.05, 0.5 + 0.35 * Math.sin(i * 1.7) + rand(-0.25, 0.25))));

  function setRow(i, showNew, dx) {
    const t = dx ? `translateX(${dx}px)` : "";
    coverStrips[i].style.opacity = showNew ? "0" : "1";
    newStrips[i].style.opacity = showNew ? "1" : "0";
    coverStrips[i].style.transform = t;
    newStrips[i].style.transform = t;
  }

  const RGB_SPLIT = "drop-shadow(7px 0 0 rgba(58,139,217,.75)) drop-shadow(-7px 0 0 rgba(6,21,47,.55))";

  async function reveal(delay) {
    revealed = true;
    clearInterval(timer);
    await wait(delay);

    const pre = $("pre");
    const post = $("post");
    body.classList.remove("is-final");
    body.classList.add("is-revealing");
    document.title = "CodeLap Hackathon — Drive the future";

    if (reduceMotion) {
      for (let i = 0; i < STRIPS; i++) setRow(i, true, 0);
      showPost(pre, post);
      return;
    }

    // 1. Interference builds up on the covered car.
    boostUntil = Date.now() + 2600;
    frameEl.animate(shakeFrames(8), { duration: 500 });
    for (let k = 0; k < 10; k++) {
      coverStrips.forEach((_, i) => setRow(i, false, Math.random() < 0.3 ? rand(-50, 50) : 0));
      frameEl.style.filter = Math.random() < 0.4 ? RGB_SPLIT : "";
      await wait(55);
    }

    // 2. Rows flicker between the two cars; the new one gradually wins.
    const t0 = performance.now();
    let flashed = false;
    await new Promise((done) => {
      (function step() {
        const p = smooth(Math.min(1, (performance.now() - t0) / MORPH_MS));
        const chaos = 1 - Math.abs(2 * p - 1); // strongest in the middle of the morph
        for (let i = 0; i < STRIPS; i++) {
          const past = p > thresholds[i];
          const showNew = past ? Math.random() > 0.18 * (1 - p) : Math.random() < 0.2 * p;
          const dx = Math.random() < 0.08 + 0.35 * chaos ? rand(-70, 70) * (0.3 + chaos) : 0;
          setRow(i, showNew, dx);
        }
        frameEl.style.filter = Math.random() < 0.15 + 0.4 * chaos ? RGB_SPLIT : "";
        frameEl.style.transform = Math.random() < 0.3 * chaos ? `translate(${rand(-6, 6)}px, ${rand(-3, 3)}px)` : "";
        if (!flashed && p > 0.5) {
          flashed = true;
          $("flash").animate([{ opacity: 0 }, { opacity: 0.45, offset: 0.2 }, { opacity: 0 }], { duration: 320 });
        }
        if (p < 1) setTimeout(step, 50);
        else done();
      })();
    });

    // 3. Lock in: a couple of aftershocks, then clean.
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < STRIPS; i++) setRow(i, true, Math.random() < 0.15 ? rand(-24, 24) : 0);
      frameEl.style.filter = RGB_SPLIT;
      await wait(60);
      for (let i = 0; i < STRIPS; i++) setRow(i, true, 0);
      frameEl.style.filter = "";
      await wait(90);
    }
    frameEl.style.transform = "";

    showPost(pre, post);
    idleGlitch();
  }

  function showPost(pre, post) {
    pre.hidden = true;
    post.hidden = false;
    body.classList.add("is-revealed");
  }

  // After the reveal, the car keeps glitching now and then, like the rest of the site.
  function idleGlitch() {
    if (reduceMotion) return;
    setTimeout(async () => {
      const rows = Array.from({ length: 2 + ((Math.random() * 4) | 0) }, () => (Math.random() * STRIPS) | 0);
      const band = (Math.random() * STRIPS) | 0;
      rows.push(band, Math.min(STRIPS - 1, band + 1));
      for (let k = 0; k < 3; k++) {
        rows.forEach((i) => setRow(i, Math.random() < 0.75, rand(-30, 30)));
        await wait(60);
      }
      rows.forEach((i) => setRow(i, true, 0));
      idleGlitch();
    }, rand(2500, 5500));
  }

  const timer = setInterval(tick, 250);
  tick();
})();
