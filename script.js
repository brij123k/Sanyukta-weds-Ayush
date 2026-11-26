/* =========================================================
   Ayush & Sanyukta – Wedding Invite
   ========================================================= */

const CONFIG = {
  // First event (Haldi) – 23 Jan 2027, 3:00 PM IST
  countdownTo: "2027-01-23T15:00:00+05:30",
  // Wardrobe Planner – the style guide page that opens when the planner is tapped. Leave "" to show a "coming soon" note.
  wardrobePlannerUrl: "style-guide.html",
  // Optional song for the Sangeet ticket / vinyl, e.g. "assets/sangeet/song.mp3"
  sangeetSong: "",
  // Background music for the whole invite. Starts when the guest taps the book.
  // Put the MP3 at this path; if the file is missing, music simply stays off.
  backgroundMusic: "assets/music/hum-tum.mp3",
};

/* ---------- Background music ---------- */
const music = (() => {
  if (!CONFIG.backgroundMusic) return { ready: false, start() {} };
  const audio = new Audio(CONFIG.backgroundMusic);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.6;
  const state = { ready: false, wanted: false };

  const btn = document.createElement("button");
  btn.className = "music-btn";
  btn.hidden = true;
  btn.innerHTML = '<span aria-hidden="true">♫</span>';
  document.body.appendChild(btn);
  const show = () => {
    const on = !audio.paused;
    btn.classList.toggle("playing", on);
    btn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  };

  audio.addEventListener("canplay", () => { state.ready = true; }, { once: true });
  audio.addEventListener("error", () => { state.ready = false; btn.hidden = true; }); // no file → no music
  audio.addEventListener("play", show);
  audio.addEventListener("pause", show);

  btn.addEventListener("click", () => {
    state.wanted = audio.paused;
    audio.paused ? audio.play().catch(() => {}) : audio.pause();
  });
  // pause when the guest switches app/tab, resume when they come back
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.pause();
    else if (state.wanted) audio.play().catch(() => {});
  });

  return {
    get ready() { return state.ready; },
    // must be called from a tap (browsers block sound without one)
    start() {
      state.wanted = true;
      audio.play().then(() => { btn.hidden = false; }).catch(() => {});
    },
  };
})();

/* ---------- Intro video → then the invite ---------- */
(function intro() {
  const wrap = document.getElementById("intro");
  const video = document.getElementById("introVideo");
  // book.mp4: 0–2.2s closed book with "TAP TO OPEN", ~2.5–4.3s the cover opens, then it fades to blank.
  const OPEN_FROM = 2.2;  // on tap, jump here: the moment the cover starts to open
  const OPEN_UNTIL = 4.3; // the cover is open – fade into the invitation
  const FADE_MS = 1200;   // keep in sync with the #intro transition in style.css
  let closed = false, opening = false;

  // Smoothly fade the video away to reveal the invitation page (only when tapped).
  function close() {
    if (closed) return;
    closed = true;
    wrap.classList.add("gone");
    document.body.classList.remove("intro-on");
    setTimeout(() => video.pause(), FADE_MS); // keep it moving while it fades
  }

  // Show the closed book and WAIT. Some phones (iPhone) only paint a frame after play(),
  // so start muted playback and pause straight away on the closed-book frame.
  video.addEventListener("loadeddata", () => video.classList.add("show"), { once: true });
  video.addEventListener("playing", () => {
    video.classList.add("show");
    if (!opening) video.pause();
  });
  video.play().catch(() => {});

  // Tap the book → play the cover opening, then fade into the invitation.
  wrap.addEventListener("click", () => {
    if (opening) return;
    opening = true;
    video.currentTime = OPEN_FROM;
    music.start(); // the tap allows sound: start the background song (book.mp4 itself is silent)
    video.play().catch(close); // if it can't play, just open the site
  });
  // check every frame so we leave before the video's blank ending
  (function watch() {
    if (closed) return;
    if (opening && video.currentTime >= OPEN_UNTIL) return close();
    requestAnimationFrame(watch);
  })();
  video.addEventListener("ended", close);

  video.addEventListener("error", close); // never leave guests stuck on a broken video
})();

/* ---------- Loader ---------- */
(function loader() {
  const el = document.getElementById("loader");
  const bar = el.querySelector(".loader-bar i");
  const imgs = [...document.images];
  let done = 0;
  const finish = () => setTimeout(() => el.classList.add("gone"), 300);
  const tick = () => {
    bar.style.width = Math.round((++done / imgs.length) * 100) + "%";
    if (done >= imgs.length) finish();
  };
  imgs.forEach((img) => (img.complete ? tick() : (img.addEventListener("load", tick), img.addEventListener("error", tick))));
  setTimeout(finish, 6000);
})();

/* ---------- Toast ---------- */
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- Fade sections in on scroll ---------- */
(function reveal() {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
    { threshold: 0.05 }
  );
  document.querySelectorAll(".fade").forEach((el) => io.observe(el));
})();

/* ---------- Petal colours (used by the Haldi photo petal blast) ---------- */
const PETAL_COLORS = ["#f39a2b", "#f7b500", "#e8577a", "#ec7f37", "#f06292", "#ffca28", "#d84315"];
const rand = (a, b) => a + Math.random() * (b - a);

/* ---------- Flower shower over chosen sections (every .petal-zone: Lagnotsav, Wardrobe Planner) ---------- */
document.querySelectorAll(".petal-zone").forEach((layer) => {
  const COUNT = 8; // how many petals fall in each section

  function start() {
    for (let i = 0; i < COUNT; i++) {
      const p = document.createElement("img");
      p.src = layer.dataset.petal || "assets/haldi/petal.png"; // data-petal picks the colour
      p.alt = "";
      p.className = "zone-petal";
      // sizes / drift are in design px (the layer scales with the invite)
      p.style.cssText = `--left:${rand(3, 93)}%; --size:${rand(28, 46)}; --dur:${rand(7, 11)}s;
        --delay:${rand(0, 4)}s; --drift:${rand(-120, 120)}; --spin:${rand(-360, 360)}deg;
        --flip:${Math.random() < 0.5 ? -1 : 1};`;
      layer.appendChild(p);
    }
  }
  // start the first time this section scrolls into view
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { io.disconnect(); start(); }
  }, { threshold: 0.15 });
  io.observe(layer);
});

/* ---------- Petal blast: real flower petals fly out from a point, then float down ---------- */
function petalBlast(x, y, count = 45) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "petal-blast";
    const size = rand(12, 22);
    p.style.cssText = `left:${x}px; top:${y}px; --size:${size}px; --dur:6s;
      --color:${PETAL_COLORS[i % PETAL_COLORS.length]};`;
    p.appendChild(document.createElement("i"));
    document.body.appendChild(p);
    const a = rand(-Math.PI, 0);              // mostly upwards, like flowers thrown in the air
    const d = rand(80, 260);
    const ux = Math.cos(a) * d, uy = Math.sin(a) * d;
    const fall = rand(250, 450), rot = rand(-720, 720);
    const anim = p.animate([
      { transform: "translate(-50%,-50%) scale(.3) rotate(0deg)", opacity: 1 },
      { transform: `translate(calc(-50% + ${ux}px), calc(-50% + ${uy}px)) scale(1) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(calc(-50% + ${ux * 1.3}px), calc(-50% + ${uy + fall}px)) scale(.9) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: rand(2200, 3200), easing: "cubic-bezier(.2,.7,.4,1)", delay: rand(0, 200), fill: "both" });
    anim.onfinish = () => p.remove();
  }
}

/* ---------- Confetti burst ---------- */
// burst(anchor) bursts from the element's centre; pass { x, y } (viewport px) to burst from a point.
function burst(anchor, { x, y, colors = ["#d4a43a", "#f4c9d0", "#e9b949", "#c46a7c"], count = 28, spread = 120 } = {}) {
  const r = anchor.getBoundingClientRect();
  const cx = x ?? r.left + r.width / 2, cy = y ?? r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * spread;
    Object.assign(s.style, {
      position: "fixed", left: cx + "px", top: cy + "px", width: "7px", height: "7px",
      borderRadius: Math.random() > 0.5 ? "50%" : "1px",
      background: colors[i % colors.length],
      zIndex: 60, pointerEvents: "none",
      transition: "transform 1s cubic-bezier(.2,.8,.3,1), opacity 1s ease",
    });
    document.body.appendChild(s);
    requestAnimationFrame(() => {
      s.style.transform = `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 40}px) rotate(${Math.random() * 360}deg)`;
      s.style.opacity = "0";
    });
    setTimeout(() => s.remove(), 1100);
  }
}

/* ---------- Scratch the glitter heart to reveal the date ---------- */
(function scratchHeart() {
  const wrap = document.getElementById("scratch");
  const canvas = document.getElementById("scratchCanvas");
  const img = wrap.querySelector(".scratch-img");
  const ctx = canvas.getContext("2d");
  const GRID = 18;
  const hit = new Set();
  let drawing = false, finished = false, last = null, paintedWidth = 0;

  function paint() {
    const r = wrap.getBoundingClientRect();
    // Mobile browsers fire "resize" when the address bar shows/hides during scroll.
    // Only repaint when the width really changed, or the guest's scratching is wiped.
    if (r.width === paintedWidth) return;
    paintedWidth = r.width;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(img, 0, 0, r.width, r.height);
    hit.clear();
  }
  img.complete ? paint() : img.addEventListener("load", paint);
  window.addEventListener("resize", () => !finished && paint());

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  };

  function scratch(p) {
    const rad = p.w * 0.09;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineWidth = rad * 2;
    ctx.beginPath();
    ctx.moveTo(last ? last.x : p.x, last ? last.y : p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    for (let dx = -rad; dx <= rad; dx += rad / 2)
      for (let dy = -rad; dy <= rad; dy += rad / 2) {
        const gx = Math.floor(((p.x + dx) / p.w) * GRID), gy = Math.floor(((p.y + dy) / p.h) * GRID);
        if (gx >= 0 && gy >= 0 && gx < GRID && gy < GRID) hit.add(gx + "," + gy);
      }
    if (hit.size / (GRID * GRID) > 0.4) finish();
  }

  function finish() {
    if (finished) return;
    finished = true;
    wrap.classList.add("done");
    document.getElementById("scratchHint")?.classList.add("done");
    burst(wrap);
  }

  canvas.addEventListener("pointerdown", (e) => {
    drawing = true; last = null;
    canvas.setPointerCapture(e.pointerId);
    scratch(pos(e));
  });
  canvas.addEventListener("pointermove", (e) => drawing && scratch(pos(e)));
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
    canvas.addEventListener(ev, () => { drawing = false; last = null; })
  );
  canvas.addEventListener("dblclick", finish);
})();

/* ---------- Haldi: tap polaroid → haldi faces ---------- */
(function haldi() {
  const btn = document.getElementById("haldiPhoto");
  btn.addEventListener("click", (e) => {
    const on = !btn.classList.contains("on");
    // Spread the haldi photo out from where the guest tapped (centre for keyboard).
    // offsetX/Y are in the button's own (un-rotated) coordinates.
    if (on && e.detail > 0) {
      btn.style.setProperty("--cx", (e.offsetX / btn.clientWidth) * 100 + "%");
      btn.style.setProperty("--cy", (e.offsetY / btn.clientHeight) * 100 + "%");
    } else if (on) {
      btn.style.setProperty("--cx", "50%");
      btn.style.setProperty("--cy", "50%");
    }
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", String(on));
    if (!on) return;
    const pt = e.detail > 0 ? { x: e.clientX, y: e.clientY } : {};
    // haldi powder puff + marigold petals
    burst(btn, { ...pt, colors: ["#f7c548", "#f2b705", "#ffd95a", "#e9a400"], count: 40, spread: 160 });
    // flowers blow out over the photo
    const r = btn.getBoundingClientRect();
    petalBlast(pt.x ?? r.left + r.width / 2, pt.y ?? r.top + r.height / 2, 15);
  });
})();

/* ---------- Sangeet: flip ticket + spin vinyl ---------- */
(function sangeet() {
  const ticket = document.getElementById("ticket");
  const vinyl = document.getElementById("vinyl");
  const audio = CONFIG.sangeetSong ? new Audio(CONFIG.sangeetSong) : null;
  if (audio) audio.loop = true;
  const play = (on) => {
    vinyl.classList.toggle("playing", on);
    if (audio) on ? audio.play().catch(() => {}) : audio.pause();
  };

  ticket.addEventListener("click", () => {
    const flipped = ticket.classList.toggle("flipped");
    play(flipped);
    if (flipped) burst(ticket);
  });
  vinyl.addEventListener("click", () => play(!vinyl.classList.contains("playing")));
})();

/* ---------- Wardrobe planner ---------- */
document.querySelectorAll(".planner-link").forEach((a) => {
  if (CONFIG.wardrobePlannerUrl) {
    // Opens the style guide page in a new tab (the invite stays open behind it)
    a.href = CONFIG.wardrobePlannerUrl;
    a.target = "_blank";
    a.rel = "noopener";
  } else {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      toast("Wardrobe planner coming soon ✨");
    });
  }
});

/* ---------- Countdown ---------- */
(function countdown() {
  const target = new Date(CONFIG.countdownTo).getTime();
  const els = {};
  document.querySelectorAll("#countdown b").forEach((b) => (els[b.dataset.k] = b));
  const pad = (n) => String(n).padStart(2, "0");
  function update() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
    const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    els.d.textContent = pad(d);
    els.h.textContent = pad(h);
    els.m.textContent = pad(m);
    els.s.textContent = pad(s);
  }
  update();
  setInterval(update, 1000);
})();
