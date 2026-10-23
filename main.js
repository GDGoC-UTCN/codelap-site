/* CodeLap Hackathon — interactions */
(() => {
  "use strict";

  document.documentElement.classList.add("js");

  // All times are Cluj-Napoca local time.
  const EVENT_START = new Date("2026-11-20T16:00:00+02:00");
  const EVENT_END = new Date("2026-11-22T18:30:00+02:00");
  const PROMO_START = new Date("2026-10-05T00:00:00+03:00"); // progress bar starts here
  const REG_OPEN = new Date("2026-10-19T10:00:00+03:00");
  const REG_CLOSE = new Date("2026-11-02T00:00:00+02:00"); // end of 1 Nov (23:59)
  const TEAMS_OUT = new Date("2026-11-13T00:00:00+02:00");

  const LANG = document.documentElement.lang === "ro" ? "ro" : "en";
  const T = {
    en: {
      soon: "Warm-up / Registration opens 19 Oct, 10:00",
      open: "Registration open / until 1 Nov",
      selection: "Selection in progress / teams on 13 Nov",
      teams: "Teams announced / final warm-up",
      live: "Race is on. Hacking until",
      running: "Lap in progress",
      done: "Chequered flag. See you next lap.",
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    ro: {
      soon: "Încălzire / Înscrierile se deschid pe 19 oct, ora 10:00",
      open: "Înscrieri deschise / până pe 1 nov",
      selection: "Selecție în desfășurare / echipele pe 13 nov",
      teams: "Echipele au fost anunțate / ultima încălzire",
      live: "Cursa a început. Mai sunt",
      running: "Tur în desfășurare",
      done: "Steagul în carouri. Ne vedem în turul următor.",
      openMenu: "Deschide meniul",
      closeMenu: "Închide meniul",
    },
  }[LANG];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLORS = ["#0B306B", "#1E4E8F", "#3A8BD9", "#8FBDE6", "#1E64D8", "#06152F"];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  /* ─────────── Glitch background canvas ─────────── */
  const canvas = document.getElementById("glitch-bg");
  const ctx = canvas.getContext("2d");
  const staticLayer = document.createElement("canvas");
  const sctx = staticLayer.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  let blocks = [];
  let lastSpawn = 0, lastFrame = 0, rafId = 0;

  function drawCross(c, x, y, s = 6) {
    c.beginPath();
    c.moveTo(x - s, y); c.lineTo(x + s, y);
    c.moveTo(x, y - s); c.lineTo(x, y + s);
    c.stroke();
  }

  // Blueprint "circuit" lines and crosshairs, drawn once per resize.
  function buildStatic() {
    staticLayer.width = W * dpr;
    staticLayer.height = H * dpr;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.clearRect(0, 0, W, H);
    sctx.lineWidth = 1;

    const n = Math.round((W * H) / 90000) + 6;
    for (let i = 0; i < n; i++) {
      sctx.strokeStyle = `rgba(30, 78, 143, ${rand(0.08, 0.2).toFixed(2)})`;
      let x = Math.round(rand(0, W)) + 0.5;
      let y = Math.round(rand(0, H)) + 0.5;
      sctx.beginPath();
      sctx.moveTo(x, y);
      const segs = 1 + ((Math.random() * 3) | 0);
      for (let s = 0; s < segs; s++) {
        if ((s + i) % 2) x = Math.round(x + rand(-260, 260)) + 0.5;
        else y = Math.round(y + rand(-220, 220)) + 0.5;
        sctx.lineTo(x, y);
      }
      sctx.stroke();
      // small terminal block at the line end
      sctx.fillStyle = "rgba(30, 100, 216, .35)";
      if (Math.random() < 0.5) sctx.fillRect(x - 6, y - 2, rand(8, 22), 4);
    }

    sctx.strokeStyle = "rgba(30, 78, 143, .45)";
    const crosses = Math.round((W * H) / 160000) + 4;
    for (let i = 0; i < crosses; i++) drawCross(sctx, rand(20, W - 20), rand(20, H - 20));
  }

  function spawnBurst(now) {
    // A burst = a horizontal band of fragments, like a corrupted scanline.
    const y = rand(0, H);
    const bandH = rand(6, 60);
    const cx = rand(-100, W);
    const count = 3 + ((Math.random() * 9) | 0);
    const life = rand(90, 700);
    for (let i = 0; i < count; i++) {
      blocks.push({
        x: cx + rand(-180, 260),
        y: y + rand(0, bandH),
        w: Math.random() < 0.15 ? rand(120, 380) : rand(6, 110),
        h: Math.random() < 0.7 ? rand(2, 7) : rand(8, 18),
        color: pick(COLORS),
        a: rand(0.18, 0.7),
        born: now + rand(0, 120),
        life: life * rand(0.5, 1.3),
        jitter: Math.random() < 0.35 ? rand(-24, 24) : 0,
      });
    }
    // occasional full-width scanline
    if (Math.random() < 0.18) {
      blocks.push({ x: 0, y: rand(0, H), w: W, h: 1, color: "#3A8BD9", a: 0.35, born: now, life: rand(60, 180), jitter: 0 });
    }
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (now - lastFrame < 33) return; // ~30fps is plenty for a glitch
    lastFrame = now;

    if (now - lastSpawn > rand(120, 420)) {
      spawnBurst(now);
      if (Math.random() < 0.12) { spawnBurst(now); spawnBurst(now); } // rare heavy glitch
      lastSpawn = now;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(staticLayer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    blocks = blocks.filter((b) => now - b.born < b.life);
    for (const b of blocks) {
      const t = now - b.born;
      if (t < 0) continue;
      const flicker = Math.random() < 0.08 ? 0 : 1;
      ctx.globalAlpha = b.a * flicker;
      ctx.fillStyle = b.color;
      const dx = b.jitter && Math.random() < 0.3 ? b.jitter : 0;
      ctx.fillRect(Math.round(b.x + dx), Math.round(b.y), Math.round(b.w), Math.round(b.h));
    }
    ctx.globalAlpha = 1;
  }

  function drawStill() {
    // Reduced motion: a single calm composition, no animation.
    const now = performance.now();
    for (let i = 0; i < 10; i++) spawnBurst(now - 200);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(staticLayer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const b of blocks) {
      ctx.globalAlpha = b.a * 0.6;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.globalAlpha = 1;
    blocks = [];
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    buildStatic();
    if (reduceMotion) drawStill();
  }

  let resizeTimer;
  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    // ignore mobile URL-bar height changes; rebuild on real width changes
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - H) < 140) return;
    lastW = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  resize();
  if (!reduceMotion) {
    rafId = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(rafId);
      else rafId = requestAnimationFrame(frame);
    });
  }

  /* ─────────── Scattered pixel blocks in dark panels ─────────── */
  document.querySelectorAll(".pixels").forEach((el) => {
    const n = parseInt(el.dataset.blocks || "30", 10);
    const frag = document.createDocumentFragment();
    // cluster blocks into a few horizontal bands so they read as glitches, not confetti
    const bands = Array.from({ length: 4 + ((Math.random() * 4) | 0) }, () => rand(0, 100));
    for (let i = 0; i < n; i++) {
      const b = document.createElement("i");
      const wide = Math.random() < 0.15;
      b.style.left = `${rand(-5, 100)}%`;
      b.style.top = `${Math.min(98, pick(bands) + rand(-4, 4))}%`;
      b.style.width = wide ? `${rand(18, 40)}%` : `${rand(1, 9)}%`;
      b.style.height = `${Math.random() < 0.7 ? rand(2, 7) : rand(10, 26)}px`; b.style.background = pick(["#1E4E8F", "#3A8BD9", "#1E64D8", "#8FBDE6", "#0B306B", "#E8F2FB"]);
      b.style.setProperty("--o", rand(0.25, 0.9).toFixed(2));
      b.style.setProperty("--d", `${rand(3, 9).toFixed(1)}s`);
      b.style.setProperty("--delay", `${rand(-9, 0).toFixed(1)}s`);
      b.style.setProperty("--shift", `${rand(-30, 30).toFixed(0)}px`);
      frag.appendChild(b);
    }
    el.appendChild(frag);
  });

  /* ─────────── Countdown ─────────── */
  const cdNums = {};
  document.querySelectorAll(".cd__num").forEach((el) => (cdNums[el.dataset.unit] = el));
  const cdStatus = document.getElementById("cd-status");
  const cdBar = document.getElementById("cd-bar");
  const cdPct = document.getElementById("cd-pct");
  const pad = (n) => String(n).padStart(2, "0");

  function setUnit(unit, value) {
    const el = cdNums[unit];
    const v = pad(value);
    if (el.textContent !== v) {
      el.textContent = v;
      if (!reduceMotion) {
        el.classList.remove("tick");
        void el.offsetWidth; // restart animation
        el.classList.add("tick");
      }
    }
  }

  function tickCountdown() {
    const now = new Date();
    let diff = EVENT_START - now;

    if (now >= EVENT_END) {
      cdStatus.textContent = T.done;
      diff = 0;
    } else if (now >= EVENT_START) {
      cdStatus.textContent = T.live;
      diff = EVENT_END - now;
    }

    const s = Math.max(0, Math.floor(diff / 1000));
    setUnit("days", Math.floor(s / 86400));
    setUnit("hours", Math.floor((s % 86400) / 3600));
    setUnit("minutes", Math.floor((s % 3600) / 60));
    setUnit("seconds", s % 60);

    const total = EVENT_START - PROMO_START;
    const pct = Math.min(100, Math.max(0, ((now - PROMO_START) / total) * 100));
    cdBar.style.width = `${pct.toFixed(1)}%`;
    cdPct.textContent =
      now >= EVENT_END ? T.done
      : now >= EVENT_START ? T.running
      : now >= TEAMS_OUT ? T.teams
      : now >= REG_CLOSE ? T.selection
      : now >= REG_OPEN ? T.open
      : T.soon;
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  // Show the registration form link once registration opens.
  function updateRegForm() {
    const open = new Date() >= REG_OPEN;
    document.querySelectorAll("[data-reg-pre]").forEach((el) => (el.hidden = open));
    document.querySelectorAll("[data-reg-live]").forEach((el) => (el.hidden = !open));
  }
  updateRegForm();
  setInterval(updateRegForm, 30000);

  // Mark key dates that have already passed.
  document.querySelectorAll(".keydates__list time[datetime]").forEach((t) => {
    if (new Date(`${t.getAttribute("datetime")}T00:00:00+02:00`) <= new Date()) {
      t.closest("li").classList.add("is-past");
    }
  });

  /* ─────────── Nav ─────────── */
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    links.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? T.closeMenu : T.openMenu);
  }
  toggle.addEventListener("click", () => setMenu(!links.classList.contains("is-open")));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // highlight the section in view
  const navLinks = [...links.querySelectorAll("a")];
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((a) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target) sectionObs.observe(target);
  });

  /* ─────────── Reveal on scroll ─────────── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    revealObs.observe(el);
  });
})();
