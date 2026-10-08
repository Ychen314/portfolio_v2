/* ==========================================================
   PORTFOLIO SCRIPTS
   Header scroll state, orbiting tech pills, projects journey
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Header scroll border/shadow toggle
  const header = document.getElementById("siteHeader");

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // 2. Skills: pills spiral in, orbit briefly, then gather into a toolkit grid
  initSkillsScroll();

  // 3. Projects: character follows the S-path down the page
  initProjectsJourney();

  // 4. About: autoplay scene with courier and language characters
  initAbout();

  // 5. Contact: share the coder head across the new characters
  initContact();

  // 6. Contact: character drags the card in on first view
  initContactIntro();

  // 7. Ambient background spotlight tracking
  let pointerTicking = false;
  window.addEventListener("pointermove", (e) => {
    if (!pointerTicking) {
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--cursor-x", `${e.clientX}px`);
        document.documentElement.style.setProperty("--cursor-y", `${e.clientY}px`);
        pointerTicking = false;
      });
      pointerTicking = true;
    }
  }, { passive: true });

  // 8. Hero entrance animations
  initHeroAnimations();
});



/* ==========================================================
   SKILLS
   ========================================================== */
function initSkillsScroll() {
  const track = document.getElementById("skills");
  const viewport = document.querySelector(".skills-sticky-viewport");
  const stage = document.getElementById("skillsStage");
  const pillsContainer = document.getElementById("techPillsContainer");
  const coder = stage ? stage.querySelector(".coder") : null;
  const pills = Array.from(document.querySelectorAll(".tech-pill"));
  const progressFill = document.getElementById("skillsProgressFill");
  const ringOuter = stage ? stage.querySelector(".orbit-ring.outer") : null;
  const ringInner = stage ? stage.querySelector(".orbit-ring.inner") : null;

  if (!track || !viewport || !stage || pills.length === 0) return;

  const TAU = Math.PI * 2;
  const SPIN_TURNS = 0.55;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const outerCount = pills.filter((_, i) => i % 2 === 0).length;
  const innerCount = pills.length - outerCount;

  const configs = pills.map((el, i) => {
    const outer = i % 2 === 0;
    const slot = Math.floor(i / 2);
    const count = outer ? outerCount : innerCount;

    const baseAngle =
      (slot / count) * TAU - Math.PI / 2 + (outer ? 0 : Math.PI / count);

    const startProgress = (i / pills.length) * 0.34;
    const endProgress = startProgress + 0.22;

    return {
      el,
      outer,
      baseAngle,
      startProgress,
      endProgress,
      spawnAngle: baseAngle + (outer ? 0.9 : -0.9),
      baseWidth: el.offsetWidth,
      baseHeight: el.offsetHeight,
      lastZ: ""
    };
  });

  let geo = {};

  function measure() {
    configs.forEach((cfg) => {
      cfg.el.style.width = "";
      cfg.el.style.height = "";
      cfg.baseWidth = cfg.el.offsetWidth;
      cfg.baseHeight = cfg.el.offsetHeight;
    });

    const W = stage.offsetWidth;
    const H = stage.offsetHeight;
    const narrow = W < 520;

    const rxO = Math.min(W * 0.44, W / 2 - 62);
    const ryO = H * (narrow ? 0.4 : 0.37);

    geo = {
      rxO,
      ryO,
      rxI: rxO * 0.66,
      ryI: ryO * 0.66,
      spawn: Math.max(W, H) * 0.85
    };

    if (ringOuter) {
      ringOuter.style.width = `${geo.rxO * 2}px`;
      ringOuter.style.height = `${geo.ryO * 2}px`;
    }
    if (ringInner) {
      ringInner.style.width = `${geo.rxI * 2}px`;
      ringInner.style.height = `${geo.ryI * 2}px`;
    }
  }

  let ticking = false;

  function update() {
    const rect = track.getBoundingClientRect();
    const scrollDist = track.offsetHeight - viewport.offsetHeight;

    if (scrollDist <= 0) {
      ticking = false;
      return;
    }

    const progress = clamp(-rect.top / scrollDist, 0, 1);
    const flightProgress = reduceMotion ? 1 : progress;
    const spin = reduceMotion ? 0 : Math.min(progress, 0.68) * TAU * SPIN_TURNS;
    const collect = easeOutCubic(clamp((progress - 0.68) / 0.22, 0, 1));

    stage.style.setProperty("--p", progress.toFixed(3));
    if (progressFill) {
      progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    const narrow = stage.offsetWidth < 520;
    const columns = narrow ? 2 : 4;
    const rows = Math.ceil(pills.length / columns);
    const cellWidth = Math.min(228, (stage.offsetWidth * 0.96) / columns);
    const rowGap = narrow ? 62 : 80;

    configs.forEach((cfg, i) => {
      const dir = cfg.outer ? 1 : -1;
      const theta = cfg.baseAngle + dir * spin;
      const rx = cfg.outer ? geo.rxO : geo.rxI;
      const ry = cfg.outer ? geo.ryO : geo.ryI;

      const orbitX = Math.cos(theta) * rx;
      const orbitY = Math.sin(theta) * ry;

      const depth = (Math.sin(theta) + 1) / 2;

      const t = clamp(
        (flightProgress - cfg.startProgress) / (cfg.endProgress - cfg.startProgress),
        0,
        1
      );
      const e = easeOutCubic(t);

      const sx = Math.cos(cfg.spawnAngle) * geo.spawn;
      const sy = Math.sin(cfg.spawnAngle) * geo.spawn * 0.7;

      let x = lerp(sx, orbitX, e);
      let y = lerp(sy, orbitY, e);

      const swirl = (1 - e) * 0.7 * dir;
      const cos = Math.cos(swirl);
      const sin = Math.sin(swirl);
      const rotX = x * cos - y * sin;
      const rotY = x * sin + y * cos;
      x = rotX;
      y = rotY;

      const depthScale = 0.92 + 0.22 * depth;
      const depthOpacity = 0.5 + 0.5 * depth;

      const scale = lerp(0.3, depthScale, e);
      const fadeIn = clamp(t * 2.5, 0, 1);
      const opacity = fadeIn * lerp(1, depthOpacity, e);

      const z = t < 1 || depth > 0.5 ? "3" : "1";
      if (z !== cfg.lastZ) {
        cfg.el.style.zIndex = z;
        cfg.lastZ = z;
      }

      const col = i % columns;
      const row = Math.floor(i / columns);
      const listX = (col - (columns - 1) / 2) * cellWidth;
      const listY = (row - (rows - 1) / 2) * rowGap;
      const finalX = lerp(orbitX, listX, collect);
      const finalY = lerp(orbitY, listY, collect);
      const finalScale = lerp(scale, 1.0, collect);

      cfg.el.style.width = `${lerp(cfg.baseWidth, cellWidth - 14, collect).toFixed(1)}px`;
      cfg.el.style.height = `${lerp(cfg.baseHeight, 68, collect).toFixed(1)}px`;
      cfg.el.style.opacity = lerp(opacity, 1, collect).toFixed(2);
      cfg.el.style.transform =
        `translate(-50%, -50%) translate(${finalX.toFixed(1)}px, ${finalY.toFixed(1)}px) scale(${finalScale.toFixed(3)})`;
      cfg.el.style.pointerEvents = collect > 0.95 ? "auto" : "none";
    });

    if (pillsContainer) pillsContainer.classList.toggle("is-collected", collect > 0.96);
    if (coder) {
      coder.style.opacity = (1 - collect).toFixed(2);
      coder.style.transform = `translate(-50%, -50%) scale(${(1 - collect * 0.35).toFixed(3)})`;
    }
    if (ringOuter) ringOuter.style.opacity = (1 - collect).toFixed(2);
    if (ringInner) ringInner.style.opacity = ((1 - collect) * 0.8).toFixed(2);

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  function onResize() {
    measure();
    onScroll();
  }

  measure();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  update();
}

/* ==========================================================
   PROJECTS JOURNEY
   - Asymmetric S-curve cleanly bounds the side space
   - Corrected node clearance completely eliminates text overlap
   ========================================================== */
function initProjectsJourney() {
  const list = document.getElementById("projectsList");
  const svg = document.getElementById("journeySvg");
  const road = document.getElementById("journeyRoad");
  const base = document.getElementById("journeyPath");
  const done = document.getElementById("journeyDone");
  const linksG = document.getElementById("journeyLinks");
  const stationsG = document.getElementById("journeyStations");
  const char = document.getElementById("journeyChar");
  const poof = document.getElementById("journeyPoof");

  if (!list || !svg || !road || !base || !done || !char) return;

  const rows = Array.from(list.querySelectorAll(".project-row"));
  const cards = rows.map((r) => r.querySelector(".project-card"));
  const outfits = Array.from(svg.querySelectorAll(".outfit"));
  if (rows.length === 0) return;

  const N = rows.length;
  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrowMQ = window.matchMedia("(max-width: 859.98px)");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const navH =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--navbar-height")) || 72;

  const headTpl = svg.querySelector("#hd");
  if (headTpl) {
    svg.querySelectorAll("[data-head]").forEach((g) => {
      g.innerHTML = headTpl.innerHTML;
    });
  }

  let geo = { W: 0, H: 0, scale: 1 };
  let tops = [];
  let ys = [];
  let total = 0;
  let M = 0;
  let stationEls = [];
  let stationY = [];
  let linkEls = [];

  function measure() {
    const W = list.clientWidth;
    const H = list.clientHeight;
    const narrow = narrowMQ.matches;

    geo = { W, H, scale: narrow ? 0.38 : 0.6 };

    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    tops = rows.map((r) => r.offsetTop);

    // Initial vehicle Y: definitively pushed down to avoid any possibility of title overlap
    const startY = narrow ? 24 : 60;

    let pts = [];

    if (narrow) {
      // Repositioned further right to grant character safe clearance on mobile
      const cx = 46; 
      pts = [{ x: cx, y: startY }];
      rows.forEach((r, i) => {
        pts.push({
          x: cx + (i % 2 === 0 ? -6 : 6),
          y: tops[i] + r.offsetHeight / 2
        });
      });
      pts.push({ x: cx, y: H });
    } else {
      const stations = rows.map((r, i) => {
        const card = cards[i];
        const isLeft = r.classList.contains("is-left");
        const y = tops[i] + r.offsetHeight / 2;
        
        // Extended gap explicitly clears the ~220px character sprite 
        // to prevent arms/accessories from hanging over the project text
        const x = isLeft
          ? card.offsetLeft + card.offsetWidth + 200
          : card.offsetLeft - 200;
          
        return { x, y };
      });

      pts = [{ x: stations[0].x, y: startY }, ...stations, { x: stations[stations.length - 1].x, y: H }];
    }

    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1];
      const b = pts[k];
      const m = (b.y - a.y) / 2;
      d += ` C${a.x.toFixed(1)} ${(a.y + m).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - m).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    [road, base, done].forEach((p) => p.setAttribute("d", d));
    road.style.strokeWidth = narrow ? 10 : 18;

    total = base.getTotalLength();
    done.style.strokeDasharray = total;

    M = Math.max(200, Math.round(total / 3));
    ys = new Array(M + 1);
    for (let k = 0; k <= M; k++) {
      ys[k] = base.getPointAtLength((total * k) / M).y;
    }

    stationsG.innerHTML = "";
    linksG.innerHTML = "";
    stationEls = [];
    linkEls = [];
    stationY = [];

    const sr = narrow ? 12 : 15;

    rows.forEach((row, i) => {
      const p = pts[i + 1];
      stationY.push(p.y);

      const card = cards[i];
      const left = card.offsetLeft;
      const right = left + card.offsetWidth;
      const cardIsLeft = (left + right) / 2 < p.x;
      const x1 = p.x + (cardIsLeft ? -sr - 2 : sr + 2);
      const x2 = cardIsLeft ? right + 12 : left - 12;

      const line = document.createElementNS(NS, "line");
      line.setAttribute("class", "journey-link");
      line.setAttribute("x1", x1.toFixed(1));
      line.setAttribute("y1", p.y.toFixed(1));
      line.setAttribute("x2", x2.toFixed(1));
      line.setAttribute("y2", p.y.toFixed(1));
      if (cardIsLeft ? x1 <= x2 : x1 >= x2) line.style.display = "none";
      linksG.appendChild(line);
      linkEls.push(line);

      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "station");
      g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("r", sr);
      const t = document.createElementNS(NS, "text");
      t.textContent = String(i + 1).padStart(2, "0");
      g.appendChild(c);
      g.appendChild(t);
      stationsG.appendChild(g);
      stationEls.push(g);
    });

    syncLinks();
  }

  function yToLen(y) {
    if (y <= ys[0]) return 0;
    if (y >= ys[M]) return total;
    let lo = 0;
    let hi = M;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ys[mid] < y) lo = mid;
      else hi = mid;
    }
    const t = (y - ys[lo]) / (ys[hi] - ys[lo] || 1);
    return (total * (lo + t)) / M;
  }

  function syncLinks() {
    linkEls.forEach((l, i) => {
      l.classList.toggle("on", cards[i].classList.contains("revealed"));
    });
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
        syncLinks();
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
    );
    cards.forEach((c) => io.observe(c));
  } else {
    cards.forEach((c) => c.classList.add("revealed"));
  }

  let targetY = 0;
  let curY = 0;
  let rot = 0;
  let active = -1;
  let raf = 0;

  function readTarget() {
    const top = list.getBoundingClientRect().top;
    const mid = (window.innerHeight + navH) / 2;
    targetY = clamp(mid - top, ys[0] || 0, geo.H);
  }

  function setActive(i, burst) {
    if (i === active) return;
    active = i;
    outfits.forEach((o, k) => o.classList.toggle("active", k === i));

    if (burst && !reduceMotion) {
      poof.classList.remove("go");
      void poof.getBoundingClientRect();
      poof.classList.add("go");
    }
  }

  function render() {
    curY += (targetY - curY) * (reduceMotion ? 1 : 0.12);
    if (Math.abs(targetY - curY) < 0.4) curY = targetY;
    const moving = curY !== targetY;

    const len = yToLen(curY);
    const pt = base.getPointAtLength(len);
    const a = base.getPointAtLength(Math.max(0, len - 10));
    const b = base.getPointAtLength(Math.min(total, len + 10));

    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    let idx = 0;
    for (let i = N - 1; i >= 0; i--) {
      if (curY >= tops[i]) {
        idx = i;
        break;
      }
    }
    const want = clamp((90 - ang) * 0.3, -12, 12) * (idx === 0 ? 1 : 0.5);
    rot += (want - rot) * (reduceMotion ? 1 : 0.15);

    char.setAttribute(
      "transform",
      `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${geo.scale})`
    );
    char.classList.toggle("is-moving", moving && !reduceMotion);

    if (idx !== active) {
      setActive(idx, active !== -1);
    }

    done.style.strokeDashoffset = total - len;
    stationEls.forEach((s, i) => s.classList.toggle("passed", curY >= stationY[i] - 1));
  }

  function loop() {
    render();
    raf = curY !== targetY ? requestAnimationFrame(loop) : 0;
  }

  function kick() {
    readTarget();
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function onResize() {
    measure();
    kick();
  }

  measure();
  readTarget();
  curY = targetY;
  render();

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("load", onResize);
}


/* ==========================================================
   ABOUT: autoplay scene - append to main.js, then add
   initAbout();  inside the DOMContentLoaded handler.
   ========================================================== */
function initAbout() {
  const stage = document.getElementById("aboutStage");
  if (!stage) return;

  const cards = Array.from(stage.querySelectorAll(".about-card"));
  const slots = Array.from(stage.querySelectorAll(".lang-slot"));
  const laneA = document.getElementById("courierLane");
  const laneB = document.getElementById("langLane");
  const sub = stage.querySelector(".about-sub");
  const replay = document.getElementById("aboutReplay");
  const headTpl = document.getElementById("hd");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const SPEED = 0.32; // px per ms

  // split text into words for the staggered reveal
  stage.querySelectorAll("[data-split]").forEach((p) => {
    const words = p.textContent.trim().split(/\s+/);
    p.textContent = "";
    words.forEach((w, i) => {
      const s = document.createElement("span");
      s.className = "w";
      s.style.setProperty("--i", i);
      s.textContent = w;
      p.append(s, " ");
    });
  });

  /* ---------- Characters (same drawing language as the rest of the page) ---------- */
  const SKIN = "#f1cdb0";
  const leg = (x, fx, c, cls) =>
    `<g class="leg ${cls}"><rect x="${x}" y="22" width="16" height="42" rx="6" fill="${c}"/><rect x="${fx}" y="60" width="22" height="10" rx="5" fill="#000"/></g>`;
  const arm = (x, hx, c, cls) =>
    `<g class="arm ${cls}"><rect x="${x}" y="-20" width="15" height="44" rx="7.5" fill="${c}" stroke="#000" stroke-width="2"/><circle cx="${hx}" cy="27" r="6" fill="${SKIN}" stroke="#000" stroke-width="1.8"/></g>`;
  const carryArms = (c) =>
    `<g class="arms-carry"><path d="M-36 -12L-27 20M36 -12L27 20" stroke="#000" stroke-width="18" stroke-linecap="round"/><path d="M-36 -12L-27 20M36 -12L27 20" stroke="${c}" stroke-width="14" stroke-linecap="round"/><circle cx="-25" cy="24" r="6" fill="${SKIN}" stroke="#000" stroke-width="1.8"/><circle cx="25" cy="24" r="6" fill="${SKIN}" stroke="#000" stroke-width="1.8"/></g>`;
  const S = 'stroke="#000" stroke-width="2" stroke-linejoin="round"';

  const OUTFITS = {
    courier: {
      legs: "#333", body: "#e8e8e8",
      torso: `<path d="M-24 -22L22 28" stroke="#000" stroke-width="7"/>`,
      hat: `<path d="M-25 -64C-25 -90 25 -90 25 -64Z" fill="#fff" ${S}/><path d="M-25 -64H36Q40 -64 38 -59H-25Z" fill="#333" ${S}/>`
    },
    english: {
      legs: "#1a1a1a", body: "#333",
      torso: `<path d="M-11 -22L0 8L11 -22Z" fill="#fff" ${S}/><path d="M0 -16L-4 -10L0 14L4 -10Z" fill="#000"/>`,
      hat: `<path d="M-20 -68C-20 -94 20 -94 20 -68Z" fill="#111" ${S}/><rect x="-31" y="-71" width="62" height="6" rx="3" fill="#111" ${S}/>`
    },
    malay: {
      legs: "#525252", body: "#a3a3a3",
      torso: `<path d="M-8 -22L0 -12L8 -22" fill="none" stroke="#000" stroke-width="2"/><circle cx="0" cy="-4" r="2" fill="#000"/><circle cx="0" cy="8" r="2" fill="#000"/>`,
      hat: `<rect x="-19" y="-90" width="38" height="25" rx="4" fill="#111" ${S}/><path d="M-19 -74H19" stroke="#e8e8e8" stroke-width="2"/>`
    },
    chinese: {
      legs: "#333", body: "#fff",
      torso: `<rect x="-9" y="-25" width="18" height="8" rx="2" fill="#fff" ${S}/><path d="M0 -17V26" stroke="#000" stroke-width="1.6"/><circle cx="-6" cy="-4" r="2.2" fill="#000"/><circle cx="6" cy="-4" r="2.2" fill="#000"/><circle cx="-6" cy="12" r="2.2" fill="#000"/><circle cx="6" cy="12" r="2.2" fill="#000"/>`,
      hat: `<path d="M-25 -67Q0 -80 25 -67" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round"/><path d="M-25 -67Q0 -80 25 -67" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`
    },
    cantonese: {
      legs: "#1a1a1a", body: "#525252",
      torso: `<path d="M-20 -24Q0 -12 20 -24L18 -12Q0 -2 -18 -12Z" fill="#fff" ${S}/>`,
      hat: `<path d="M-23 -68C-23 -92 23 -92 23 -68Z" fill="#a3a3a3" ${S}/><ellipse cx="0" cy="-67" rx="34" ry="7" fill="#a3a3a3" ${S}/>`
    }
  };

  function cryingFaceSVG() {
    return `<g class="crying-overlay">
      <g class="tears-layer">
        <path class="tear-stream tear-l" d="M-10 -48 C -22 -62 -32 -46 -42 -32" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
        <path class="tear-stream tear-r" d="M10 -48 C 22 -62 32 -46 42 -32" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
        <circle class="tear-drop td1" cx="-36" cy="-30" r="3.2" fill="#38bdf8"/>
        <circle class="tear-drop td2" cx="36" cy="-30" r="3.2" fill="#38bdf8"/>
        <circle class="tear-drop td3" cx="-26" cy="-22" r="2.4" fill="#38bdf8"/>
        <circle class="tear-drop td4" cx="26" cy="-22" r="2.4" fill="#38bdf8"/>
      </g>
      <g stroke="#000" stroke-width="2.2" stroke-linecap="round" fill="none">
        <path d="M-15 -51 L-9 -48.5 L-15 -46"/>
        <path d="M15 -51 L9 -48.5 L15 -46"/>
      </g>
      <path d="M-8 -33 Q 0 -41 8 -33 Q 0 -26 -8 -33 Z" fill="#991b1b" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M-5 -34 Q 0 -37 5 -34" fill="none" stroke="#fff" stroke-width="1.2"/>
    </g>`;
  }

  function buildSVG(o, isCourier = false) {
    return `<svg class="char" viewBox="-62 -102 124 180" aria-hidden="true">
      <ellipse class="shadow" cx="0" cy="70" rx="32" ry="5"/>
      <g class="bob">
        ${leg(-19, -23, o.legs, "leg-l")}${leg(3, 1, o.legs, "leg-r")}
        <path d="M-30 28V-4Q-30 -22 -12 -22H12Q30 -22 30 -4V28Z" fill="${o.body}" stroke="#000" stroke-width="2.2" stroke-linejoin="round"/>
        ${o.torso}
        ${arm(-43, -35.5, o.body, "arm-l")}${arm(28, 35.5, o.body, "arm-r")}
        ${carryArms(o.body)}
        <g class="char-head">${headTpl ? headTpl.innerHTML : ""}${isCourier ? cryingFaceSVG() : ""}</g>
        ${o.hat}
      </g></svg>`;
  }

  function buildCarSVG() {
    return `<svg class="courier-car-svg" viewBox="0 0 160 95" aria-hidden="true">
      <!-- Ground Shadow -->
      <ellipse class="car-shadow" cx="80" cy="85" rx="70" ry="5.5" fill="rgba(0,0,0,0.12)"/>
      
      <!-- Exhaust pipe & animated puffs -->
      <g class="car-exhaust">
        <rect x="6" y="68" width="10" height="5" rx="2" fill="#333" stroke="#000" stroke-width="1.8"/>
        <g class="exhaust-puffs">
          <circle class="puff p1" cx="-2" cy="69" r="3" fill="#a3a3a3"/>
          <circle class="puff p2" cx="-10" cy="66" r="5" fill="#d4d4d4"/>
          <circle class="puff p3" cx="-20" cy="62" r="7" fill="#e8e8e8"/>
        </g>
      </g>

      <!-- Luggage rack on rear trunk deck -->
      <g class="car-rack">
        <rect x="14" y="44" width="28" height="4" rx="2" fill="#1a1a1a"/>
        <path d="M18 44V50 M38 44V50" stroke="#1a1a1a" stroke-width="2"/>
      </g>

      <!-- Driver (Teh Yu Chen smiling!) -->
      <g class="car-driver" transform="translate(70, 52)">
        <!-- Torso in courier uniform -->
        <path d="M-15 18V0Q-15 -8 -5 -8H5Q15 -8 15 0V18Z" fill="#e8e8e8" stroke="#000" stroke-width="2"/>
        <path d="M-9 -8L7 16" stroke="#000" stroke-width="3.5"/>
        <!-- Steering wheel -->
        <ellipse cx="15" cy="5" rx="3.5" ry="9" fill="none" stroke="#000" stroke-width="2.5"/>
        <!-- Hands on wheel -->
        <circle cx="13" cy="-1" r="3" fill="${SKIN}" stroke="#000" stroke-width="1.5"/>
        <circle cx="13" cy="9" r="3" fill="${SKIN}" stroke="#000" stroke-width="1.5"/>
        
        <!-- Driver Head with smiling expression (normal chibi neck) -->
        <g class="driver-head" transform="translate(0, -9)">
          <!-- Short normal neck -->
          <path d="M-5 -4h10v8c-2 2-8 2-10 0z" fill="#e3b693" stroke="#000" stroke-width="1.6"/>
          <!-- Head base (chin at y=0, rests snugly on shoulders at y=-8) -->
          <ellipse cx="0" cy="-17" rx="17" ry="17" fill="${SKIN}" stroke="#000" stroke-width="2"/>
          <!-- Hair -->
          <path d="M-17 -16C-21 -39 -4 -41 3 -38C15 -41 21 -26 17 -16C15 -23 9 -28 0 -28C-9 -28 -15 -23 -17 -16Z" fill="#1a1a1a" stroke="#000" stroke-width="1.8"/>
          <!-- Eyebrows (cheerful) -->
          <path d="M-9 -23q3.5 -3.5 7 0 M3 -23q3.5 -3.5 7 0" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round"/>
          <!-- Glasses -->
          <g fill="rgba(255,255,255,0.45)" stroke="#000" stroke-width="1.8">
            <rect x="-13" y="-21" width="10" height="9" rx="2.5"/>
            <rect x="3" y="-21" width="10" height="9" rx="2.5"/>
          </g>
          <path d="M-3 -17h6" stroke="#000" stroke-width="1.8"/>
          <!-- Happy smiling eyes (curved arcs ^_^) -->
          <g class="smile-eyes">
            <path d="M-10 -16q2.5 -3 5 0" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M6 -16q2.5 -3 5 0" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round"/>
          </g>
          <!-- Nose -->
          <path d="M0 -12q-1.5 3.5 1 4" fill="none" stroke="#d29c78" stroke-width="1.4" stroke-linecap="round"/>
          <!-- Rosy blushing cheeks -->
          <circle cx="-10" cy="-7" r="3" fill="#e8a48f" opacity="0.65"/>
          <circle cx="10" cy="-7" r="3" fill="#e8a48f" opacity="0.65"/>
          <!-- Big happy smile! -->
          <path d="M-6 -5Q0 4 6 -5Q0 -1 -6 -5Z" fill="#991b1b" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M-4 -4Q0 -2 4 -4" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>
          <!-- Courier Cap -->
          <path d="M-18 -25C-18 -43 18 -43 18 -25Z" fill="#fff" stroke="#000" stroke-width="1.8"/>
          <path d="M-18 -25H24Q27 -25 26 -21H-18Z" fill="#333" stroke="#000" stroke-width="1.8"/>
        </g>
      </g>

      <!-- Car Body Group (Body panels drawn in front of driver lower body) -->
      <g class="car-body-group">
        <!-- Main Car Body (Roadster / Coupe profile) -->
        <path d="M10 72 V50 Q10 44 20 44 H46 L56 56 H88 L98 46 H140 Q148 46 148 54 V72 Q148 76 144 76 H14 Q10 76 10 72 Z" fill="#ffffff" stroke="#000" stroke-width="2.4" stroke-linejoin="round"/>
        
        <!-- Windshield (slanted back towards driver) -->
        <path d="M96 48 L82 24 H76 L88 48 Z" fill="rgba(200, 230, 255, 0.4)" stroke="#000" stroke-width="1.8"/>
        <path d="M92 44 L82 28" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
        
        <!-- Car side stripe -->
        <path d="M12 60 H146" stroke="#1a1a1a" stroke-width="2.6"/>
        
        <!-- Door seam & handle -->
        <path d="M54 56 V74 M88 56 V74" stroke="#000" stroke-width="1.5"/>
        <rect x="59" y="59" width="6" height="2.5" rx="1.2" fill="#333"/>
        
        <!-- Front Headlight -->
        <path d="M144 50 H149 Q151 50 151 54 Q151 58 149 58 H144 Z" fill="#ffe066" stroke="#000" stroke-width="1.8"/>
        <!-- Headlight light beam -->
        <polygon class="headlight-beam" points="151,52 195,44 195,64 151,58" fill="rgba(255, 230, 100, 0.22)"/>

        <!-- Taillight -->
        <rect x="8" y="48" width="3.5" height="7" rx="1.5" fill="#ef4444" stroke="#000" stroke-width="1.4"/>

        <!-- Wheel Wells -->
        <path d="M22 76 A16 16 0 0 1 54 76" fill="#1a1a1a"/>
        <path d="M108 76 A16 16 0 0 1 140 76" fill="#1a1a1a"/>
      </g>

      <!-- Wheels (nested so CSS animation only rotates inner group) -->
      <g class="car-wheels">
        <!-- Rear Wheel -->
        <g transform="translate(38, 76)">
          <g class="wheel-spin">
            <circle cx="0" cy="0" r="13" fill="#1a1a1a" stroke="#000" stroke-width="2"/>
            <circle cx="0" cy="0" r="6.5" fill="#fff" stroke="#000" stroke-width="1.6"/>
            <circle cx="0" cy="0" r="2.2" fill="#1a1a1a"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#888" stroke-width="1.5"/>
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#888" stroke-width="1.5"/>
          </g>
        </g>

        <!-- Front Wheel -->
        <g transform="translate(124, 76)">
          <g class="wheel-spin">
            <circle cx="0" cy="0" r="13" fill="#1a1a1a" stroke="#000" stroke-width="2"/>
            <circle cx="0" cy="0" r="6.5" fill="#fff" stroke="#000" stroke-width="1.6"/>
            <circle cx="0" cy="0" r="2.2" fill="#1a1a1a"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#888" stroke-width="1.5"/>
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#888" stroke-width="1.5"/>
          </g>
        </g>
      </g>

      <!-- BEEP horn speech bubble -->
      <g class="car-horn-bubble" opacity="0" transform="translate(122, 10)">
        <rect x="0" y="0" width="42" height="20" rx="5" fill="#fff" stroke="#000" stroke-width="1.8"/>
        <path d="M6 20 L2 25 L12 20 Z" fill="#fff" stroke="#000" stroke-width="1.8"/>
        <path d="M5 19 L10 19" stroke="#fff" stroke-width="2.5"/>
        <text x="21" y="14" font-family="sans-serif" font-size="9" font-weight="900" fill="#000" text-anchor="middle" letter-spacing="0.5">BEEP!</text>
      </g>
    </svg>`;
  }

  /* ---------- Motion helpers ---------- */
  const stageLeft = () => stage.getBoundingClientRect().left;
  const centerX = (el) => {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2 - stageLeft();
  };

  const actors = [];
  function makeActor(lane, key, isCourier = false) {
    const el = document.createElement("div");
    el.className = `actor ${isCourier ? "actor-courier" : ""}`;
    el.innerHTML = `
      <div class="hop">
        ${buildSVG(OUTFITS[key], isCourier)}
        <div class="carry-holder"></div>
        ${isCourier ? `
          <div class="dizzy-stars-layer">
            <svg class="dizzy-svg" viewBox="-30 -15 60 30" width="60" height="30">
              <g class="orbiting-stars">
                <path class="dizzy-star star-1" d="M0 -5 L1.5 -1.5 L5 -1.5 L2.2 0.8 L3.1 4.5 L0 2.2 L-3.1 4.5 L-2.2 0.8 L-5 -1.5 L-1.5 -1.5 Z" fill="#facc15" stroke="#000" stroke-width="1"/>
                <path class="dizzy-star star-2" d="M0 -5 L1.5 -1.5 L5 -1.5 L2.2 0.8 L3.1 4.5 L0 2.2 L-3.1 4.5 L-2.2 0.8 L-5 -1.5 L-1.5 -1.5 Z" fill="#facc15" stroke="#000" stroke-width="1"/>
                <path class="dizzy-star star-3" d="M0 -5 L1.5 -1.5 L5 -1.5 L2.2 0.8 L3.1 4.5 L0 2.2 L-3.1 4.5 L-2.2 0.8 L-5 -1.5 L-1.5 -1.5 Z" fill="#facc15" stroke="#000" stroke-width="1"/>
              </g>
            </svg>
          </div>` : ""}
      </div>`;
    lane.appendChild(el);
    const a = { el, hop: el.querySelector(".hop"), holder: el.querySelector(".carry-holder"), x: 0 };
    actors.push(a);
    return a;
  }

  function makeCarActor(lane) {
    const el = document.createElement("div");
    el.className = "actor actor-car";
    el.innerHTML = `
      <div class="hop car-hop">
        ${buildCarSVG()}
        <div class="carry-holder car-holder"></div>
      </div>`;
    lane.appendChild(el);
    const a = { el, hop: el.querySelector(".car-hop"), holder: el.querySelector(".car-holder"), x: 0, isCar: true };
    actors.push(a);
    return a;
  }

  function setX(a, x) {
    a.x = x;
    a.el.style.transform = `translateX(${x - a.el.offsetWidth / 2}px)`;
  }

  function walk(a, x1, speed = SPEED) {
    const half = a.el.offsetWidth / 2;
    const x0 = a.x;
    a.el.style.setProperty("--dir", x1 >= x0 ? 1 : -1);
    a.el.classList.add("walking");
    a.x = x1;
    a.el.style.transform = `translateX(${x1 - half}px)`;
    const an = a.el.animate(
      [{ transform: `translateX(${x0 - half}px)` }, { transform: `translateX(${x1 - half}px)` }],
      { duration: Math.max(1, Math.abs(x1 - x0) / speed), easing: "linear" }
    );
    return an.finished.then(() => a.el.classList.remove("walking"));
  }

  const hop = (a) =>
    a.hop.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(-9px)" }, { transform: "translateY(0)" }],
      { duration: 340, easing: "ease-out" }
    ).finished;

  function fly(item, target, { dur = 800, lift = 70, endScale = 1, endOpacity = 0 } = {}) {
    const c = item.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();

    // Detach from parent actor and attach directly to stage so actor movements/slips never warp the flight path
    const startX = c.left - sr.left;
    const startY = c.top - sr.top;

    stage.appendChild(item);
    item.style.position = "absolute";
    item.style.left = `${startX}px`;
    item.style.top = `${startY}px`;
    item.style.margin = "0";
    item.style.zIndex = "25";
    item.style.pointerEvents = "none";
    item.style.transform = "none";

    const targetCenterX = t.left + t.width / 2 - sr.left;
    const targetCenterY = t.top + t.height / 2 - sr.top;
    const itemCenterX = startX + c.width / 2;
    const itemCenterY = startY + c.height / 2;

    const dx = targetCenterX - itemCenterX;
    const dy = targetCenterY - itemCenterY;

    return item.animate(
      [
        { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5 - lift}px) scale(1.15) rotate(14deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px,${dy}px) scale(${endScale}) rotate(0deg)`, opacity: endOpacity, offset: 1 }
      ],
      { duration: dur, easing: "cubic-bezier(.22,.9,.32,1)", fill: "forwards" }
    ).finished.then(() => {
      item.remove();
    });
  }

  /* ---------- Scenes ---------- */
  let token = 0;
  let done = false;
  const langActors = [];

  function reset() {
    cards.forEach((c) => c.classList.remove("is-in"));
    slots.forEach((s) => s.classList.remove("is-in"));
    sub.classList.remove("is-in");
    laneA.classList.remove("is-compact");
    [laneA, laneB].forEach((l) => (l.innerHTML = ""));
    actors.length = 0;
    langActors.length = 0;
    replay.hidden = true;
    done = false;
  }

  function showAll() {
    cards.forEach((c) => c.classList.add("is-in"));
    slots.forEach((s) => s.classList.add("is-in"));
    sub.classList.add("is-in");
    laneA.classList.add("is-compact");
  }

  async function play() {
    const my = ++token;
    reset();
    if (reduce) { showAll(); return; }
    const alive = () => my === token;

    // Scene 1: Courier delivers Card 0, slips & cries on Card 1, drives car for Card 2
    const W = stage.clientWidth;
    const courier = makeActor(laneA, "courier", true);

    // --- TURN 1: Education Card (Normal delivery) ---
    const parcel0 = document.createElement("div");
    parcel0.className = "parcel";
    courier.holder.appendChild(parcel0);
    courier.el.classList.add("carrying");
    setX(courier, -90);

    await walk(courier, centerX(cards[0]));
    if (!alive()) return;
    await hop(courier);
    await fly(parcel0, cards[0], { dur: 850, lift: 90, endScale: 0.5, endOpacity: 0 });
    parcel0.remove();
    cards[0].classList.add("is-in");
    courier.el.classList.remove("carrying");
    await wait(450);
    if (!alive()) return;
    await walk(courier, -90, 0.5);
    if (!alive()) return;

    // --- TURN 2: Experience Card (Slip, fall, parcel flies, stands up, cries, runs back) ---
    const parcel1 = document.createElement("div");
    parcel1.className = "parcel";
    courier.holder.appendChild(parcel1);
    courier.el.classList.add("carrying");
    setX(courier, -90);

    const dropX1 = centerX(cards[1]);
    const slipX = Math.max(dropX1 - 55, 40);

    await walk(courier, slipX);
    if (!alive()) return;

    // Banana peel on the ground
    const peel = document.createElement("div");
    peel.className = "banana-peel";
    peel.innerHTML = `
      <svg viewBox="0 0 34 22" width="34" height="22">
        <path d="M4 18 Q10 4 20 6 Q28 8 32 17 Q25 14 18 12 Q12 14 4 18 Z" fill="#facc15" stroke="#000" stroke-width="1.8"/>
        <path d="M14 8 Q17 2 20 3 Q19 7 14 8 Z" fill="#a16207" stroke="#000" stroke-width="1.2"/>
        <path d="M11 15 Q17 11 25 14" stroke="#eab308" stroke-width="1.6" fill="none"/>
      </svg>`;
    laneA.appendChild(peel);
    peel.style.left = `${slipX + 10}px`;

    // 1. Slip!
    courier.el.classList.remove("carrying");
    courier.el.classList.add("is-slipping");

    // The parcel accidentally flings into the air and drops to card 1!
    const flyPromise = fly(parcel1, cards[1], { dur: 900, lift: 130, endScale: 0.5, endOpacity: 0 });

    await wait(240);
    if (!alive()) return;

    // 2. Fall down!
    courier.el.classList.remove("is-slipping");
    courier.el.classList.add("is-fallen");

    await flyPromise;
    parcel1.remove();
    cards[1].classList.add("is-in");

    // Stay stunned on the ground briefly
    await wait(600);
    if (!alive()) return;

    // 3. Stand back up
    peel.classList.add("fading");
    setTimeout(() => peel.remove(), 400);

    courier.el.classList.remove("is-fallen");
    courier.el.classList.add("is-standing-up");
    await wait(450);
    if (!alive()) return;

    courier.el.classList.remove("is-standing-up");

    // 4. Start crying!
    courier.el.classList.add("is-crying");
    await wait(650);
    if (!alive()) return;

    // 5. Turn left and run back crying!
    courier.el.classList.add("is-running-crying");
    courier.el.style.setProperty("--dir", -1);
    await walk(courier, -140, 0.65);
    if (!alive()) return;

    courier.el.remove();
    await wait(350);
    if (!alive()) return;

    // --- TURN 3: "Next step" Card (Driving car with smile) ---
    const courierCar = makeCarActor(laneA);
    const parcel2 = document.createElement("div");
    parcel2.className = "parcel parcel-car";
    courierCar.holder.appendChild(parcel2);
    setX(courierCar, -160);

    const dropX2 = centerX(cards[2]);
    await walk(courierCar, dropX2, 0.46);
    if (!alive()) return;

    // Car brakes and honks
    courierCar.el.classList.add("is-braking");
    await wait(350);
    if (!alive()) return;

    // Drop parcel from car to card 2!
    await fly(parcel2, cards[2], { dur: 850, lift: 90, endScale: 0.5, endOpacity: 0 });
    parcel2.remove();
    cards[2].classList.add("is-in");
    await wait(600);
    if (!alive()) return;

    // Zoom away to the right!
    courierCar.el.classList.remove("is-braking");
    courierCar.el.classList.add("is-zooming");
    await walk(courierCar, W + 160, 0.65);
    if (!alive()) return;

    courierCar.el.remove();
    await wait(200);
    if (!alive()) return;

    // Smoothly reduce spacing between cards and dashed line to bring Languages section into view
    laneA.classList.add("is-compact");
    await wait(650);
    if (!alive()) return;

    // Scene 2: four characters queue up, each delivering one language pill
    sub.classList.add("is-in");
    await wait(400);
    if (!alive()) return;

    const keys = ["english", "malay", "chinese", "cantonese"];
    const spacing = slots.length > 1 ? centerX(slots[1]) - centerX(slots[0]) : 200;
    const step = spacing / SPEED + 500; // later walkers never overtake earlier ones

    await Promise.all(
      slots.map(async (slot, i) => {
        const a = makeActor(laneB, keys[i]);
        langActors.push(a);
        const carry = slot.querySelector(".lang-pill").cloneNode(true);
        carry.classList.add("is-carry");
        a.holder.appendChild(carry);
        a.el.classList.add("carrying");
        setX(a, W + a.el.offsetWidth);

        await wait(i * step);
        if (!alive()) return;
        await walk(a, centerX(slot));
        if (!alive()) return;
        await hop(a);
        await fly(carry, slot.querySelector(".lang-pill"), { dur: 750, lift: 50 });
        slot.classList.add("is-in");
        carry.remove();
        a.el.classList.remove("carrying");
        a.el.style.setProperty("--dir", 1);
        a.el.classList.add("waving");
        setTimeout(() => a.el.classList.remove("waving"), 2000);
      })
    );

    if (!alive()) return;
    done = true;
    replay.hidden = false;
  }

  replay.addEventListener("click", play);

  window.addEventListener(
    "resize",
    () => {
      if (!done) return;
      langActors.forEach((a, i) => setX(a, centerX(slots[i])));
    },
    { passive: true }
  );

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          play();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(stage);
  } else {
    showAll();
  }
}

/* ==========================================================
   CONTACT: Interactive peeking character & head sharing
   ========================================================== */
function initContact() {
  // 1. Share coder head template across the CTA buttons
  const tpl = document.getElementById("coderHeadTpl");
  if (tpl) {
    document.querySelectorAll("[data-coder-head]").forEach((g) => {
      g.innerHTML = tpl.innerHTML;
    });
  }

  const contactSection = document.getElementById("contact");
  const contactBox = document.querySelector(".contact-box");
  const peekBtn = document.getElementById("contactPeekBtn");
  const peekPupils = document.getElementById("peekPupils");
  const peekMouth = document.getElementById("peekMouth");
  const speech = document.getElementById("peekSpeech");
  const speechText = document.getElementById("peekSpeechText");
  const speechClose = document.getElementById("peekSpeechClose");
  const hint = document.getElementById("peekHint");

  if (!contactSection || !peekBtn || !peekPupils) return;

  // Quotes to cycle on poke
  const PEEK_QUOTES = [
    "👋 Hey there! I'm Teh Yu Chen. Thanks for stopping by!",
    "💼 Available for internship from Aug 2026 – Jan 2027!",
    "⚡ Feel free to message me directly on WhatsApp! 👉",
    "📫 Drop me an email anytime — I reply promptly!",
    "🎓 Final-year Web Technology student at UTHM!",
    "☕ You bring the coffee, I'll bring the code!",
    "🚀 Looking forward to building great things together!",
    "✨ Fun fact: You poked me! Now poke the buttons over there 👉"
  ];
  let quoteIndex = 0;
  let speechTimer = null;
  let mouthTimer = null;
  let pokeTimer = null;

  // --- 2. Eye Tracking (Pupils follow cursor) ---
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let targetPupilX = 0;
  let targetPupilY = 0;
  let curPupilX = 0;
  let curPupilY = 0;
  let isTracking = false;
  let idleTimer = null;

  function updateEyeTarget() {
    const rect = peekPupils.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < 1) {
      targetPupilX = 0;
      targetPupilY = 0;
      return;
    }

    const maxR = 3.8;
    const r = Math.min(dist / 90, 1) * maxR;
    targetPupilX = (dx / dist) * r;
    targetPupilY = (dy / dist) * r;
  }

  function loopEyes() {
    const ease = 0.16;
    curPupilX += (targetPupilX - curPupilX) * ease;
    curPupilY += (targetPupilY - curPupilY) * ease;

    peekPupils.style.setProperty("--pupil-x", `${curPupilX.toFixed(2)}px`);
    peekPupils.style.setProperty("--pupil-y", `${curPupilY.toFixed(2)}px`);

    requestAnimationFrame(loopEyes);
  }
  requestAnimationFrame(loopEyes);

  window.addEventListener(
    "pointermove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      updateEyeTarget();

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        targetPupilX = 0;
        targetPupilY = 0;
      }, 3500);
    },
    { passive: true }
  );

  // --- 3. Clickable Poke Reaction ---
  function showQuote(text) {
    if (!speech || !speechText) return;
    speechText.textContent = text;
    speech.classList.add("is-visible");

    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => {
      speech.classList.remove("is-visible");
    }, 4600);
  }

  function spawnParticles() {
    if (!contactBox) return;
    const emojis = ["💖", "✨", "⭐", "💬", "👋", "🚀", "☕"];
    const count = 4;
    const peekRect = peekBtn.getBoundingClientRect();
    const boxRect = contactBox.getBoundingClientRect();

    const startX = peekRect.left - boxRect.left + peekRect.width * 0.55;
    const startY = peekRect.top - boxRect.top + peekRect.height * 0.22;

    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "peek-particle";
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const dx = (Math.random() - 0.45) * 64;
      const dy = -(40 + Math.random() * 45);
      const rot = (Math.random() - 0.5) * 40;

      p.style.left = `${startX}px`;
      p.style.top = `${startY}px`;
      p.style.setProperty("--p-dx", `${dx}px`);
      p.style.setProperty("--p-dy", `${dy}px`);
      p.style.setProperty("--p-rot", `${rot}deg`);

      contactBox.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }
  }

  function pokeCharacter() {
    if (hint) hint.classList.add("is-dismissed");

    // Trigger hop animation
    if (contactBox) {
      contactBox.classList.remove("is-poked");
      void contactBox.offsetWidth; // Reflow
      contactBox.classList.add("is-poked");
      clearTimeout(pokeTimer);
      pokeTimer = setTimeout(() => {
        contactBox.classList.remove("is-poked");
      }, 650);
    }

    // Happy open smile
    if (peekMouth) {
      peekMouth.setAttribute("d", "M125 117 Q136 131 147 117 Z");
      peekMouth.setAttribute("fill", "#fb7185");
      clearTimeout(mouthTimer);
      mouthTimer = setTimeout(() => {
        peekMouth.setAttribute("d", "M128 119 q8 6 16 0");
        peekMouth.setAttribute("fill", "none");
      }, 1300);
    }

    spawnParticles();

    // Rotate speech bubble message
    const msg = PEEK_QUOTES[quoteIndex];
    quoteIndex = (quoteIndex + 1) % PEEK_QUOTES.length;
    showQuote(msg);
  }

  peekBtn.addEventListener("click", pokeCharacter);
  peekBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pokeCharacter();
    }
  });

  if (speechClose) {
    speechClose.addEventListener("click", (e) => {
      e.stopPropagation();
      speech.classList.remove("is-visible");
      clearTimeout(speechTimer);
    });
  }

  // --- 4. Contextual Reactions to Container Elements ---
  const ctaMail = document.querySelector(".cta-mail");
  const ctaWa = document.querySelector(".cta-wa");
  const infoItems = document.querySelectorAll(".contact-info li");

  if (ctaMail && contactBox) {
    ctaMail.addEventListener("mouseenter", () => {
      contactBox.classList.add("is-hover-mail");
    });
    ctaMail.addEventListener("mouseleave", () => {
      contactBox.classList.remove("is-hover-mail");
    });
  }

  if (ctaWa && contactBox) {
    ctaWa.addEventListener("mouseenter", () => {
      contactBox.classList.add("is-hover-wa");
    });
    ctaWa.addEventListener("mouseleave", () => {
      contactBox.classList.remove("is-hover-wa");
    });
  }

  if (contactBox && infoItems.length) {
    infoItems.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        contactBox.classList.add("is-hover-info");
      });
      item.addEventListener("mouseleave", () => {
        contactBox.classList.remove("is-hover-info");
      });
    });
  }
}

/* ==========================================================
   CONTACT INTRO: the peek character drags the card in (once)
   ========================================================== */
function initContactIntro() {
  const box = document.querySelector(".contact-box");
  const head = document.getElementById("peekHead");
  const backSvg = document.querySelector(".contact-peek-back svg");
  const speech = document.getElementById("peekSpeech");
  const speechText = document.getElementById("peekSpeechText");

  if (!box || !head || !backSvg) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  /* ---------- Tuning ---------- */
  const TRAVEL = window.innerWidth < 860 ? 220 : 380; // px the card is dragged
  // pull = heave strength, dur = heave ms, back = slide-back after letting go, rest = catch-breath ms
  const CYCLES = [
    { pull: 1.0,  dur: 420, back: 0.12, rest: 300, say: "hnnngh…" },
    { pull: 0.95, dur: 450, back: 0.15, rest: 360, say: "so… heavy…" },
    { pull: 0.9,  dur: 480, back: 0.18, rest: 420, say: "why is it… this big…" },
    { pull: 0.85, dur: 520, back: 0.2,  rest: 480, say: "nearly… there…" },
    { pull: 0.8,  dur: 560, back: 0.22, rest: 560, say: "one… more… pull…" },
    { pull: 0.9,  dur: 800, back: 0,    rest: 0,   say: "HNNNNGH!" }
  ];
  const GREETING = "Phew… made it! Poke me to say hi.";

  /* ---------- Tired face + dust (injected into the existing SVG) ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const FACE = `
    <path class="pf-brow" d="M114 90L131 84.5"/>
    <path class="pf-brow" d="M141 84.5L158 90"/>
    <g class="pf-lids">
      <path class="pf-lid" d="M118.6 94.6h11.8v5.2h-11.8z"/>
      <path class="pf-lid" d="M141.6 94.6h11.8v5.2h-11.8z"/>
      <path class="pf-lidline" d="M118.6 99.8h11.8M141.6 99.8h11.8"/>
    </g>
    <g class="pf-squint">
      <path d="M119 94.5L130 99.5L119 104.5"/>
      <path d="M153 94.5L142 99.5L153 104.5"/>
    </g>
    <ellipse class="pf-pant" cx="136" cy="121.5" rx="5" ry="5.5"/>
    <g class="pf-grit">
      <rect x="126" y="117.5" width="20" height="8" rx="3"/>
      <path d="M131 117.5v8M136 117.5v8M141 117.5v8"/>
    </g>
    <path class="pf-drop d1" d="M150 76q-3.5 5.5 0 8.5q3.5-3 0-8.5z"/>
    <path class="pf-drop d2" d="M86 82q-3 5 0 8q3-3 0-8z"/>
    <path class="pf-drop d3" d="M187 82q-3 5 0 8q3-3 0-8z"/>`;
  const DUST = `<circle cx="100" cy="400" r="5"/><circle cx="100" cy="400" r="4"/><circle cx="100" cy="400" r="6"/>`;

  function addGroup(parent, cls, markup, first) {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", cls);
    g.innerHTML = markup;
    if (first) parent.insertBefore(g, parent.firstChild);
    else parent.appendChild(g);
  }

  head.querySelectorAll('ellipse[rx="5.5"]').forEach((e) => e.classList.add("peek-sclera"));
  addGroup(head, "pf", FACE);
  addGroup(backSvg, "pf-dust", DUST, true);

  /* ---------- Helpers ---------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
  const POSES = ["intro-surge", "intro-rest", "intro-spent"];

  function setPos(x, y = 0) {
    box.style.setProperty("--push-x", `${x.toFixed(1)}px`);
    box.style.setProperty("--push-y", `${y.toFixed(1)}px`);
  }

  function pose(name) {
    box.classList.remove(...POSES);
    box.classList.add(`intro-${name}`);
  }

  function say(text) {
    if (!speech || !speechText) return;
    speechText.textContent = text;
    speech.classList.add("is-visible");
  }

  function hush() {
    if (speech) speech.classList.remove("is-visible");
  }

  // scrape = tiny vertical judder on the card while it's being dragged
  function tween(from, to, dur, ease, scrape) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        const x = from + (to - from) * ease(p);
        const y = scrape ? Math.sin(p * Math.PI * 12) * 1.6 * (1 - p) : 0;
        setPos(x, y);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      })(t0);
    });
  }

  function finish() {
    box.classList.remove("intro-ready", "intro-play", ...POSES);
    box.style.removeProperty("--push-x");
    box.style.removeProperty("--push-y");
  }

  /* ---------- Scene ---------- */
  const last = CYCLES.length - 1;
  const net = CYCLES.reduce((sum, c) => sum + c.pull - c.back, 0);
  const unit = TRAVEL / net;

  async function play() {
    try {
      box.classList.add("intro-play");
      say("okay… here goes…");
      await wait(900);

      let x = -TRAVEL;
      for (let i = 0; i < CYCLES.length; i++) {
        const c = CYCLES[i];

        // heave
        pose("surge");
        say(c.say);
        const to = i === last ? 0 : x + c.pull * unit;
        await tween(x, to, c.dur, easeOutCubic, true);
        x = to;

        // let go: the card slides back a bit while he catches his breath
        if (c.rest) {
          pose("rest");
          const slide = Math.min(260, c.rest * 0.5);
          const toBack = x - c.back * unit;
          await tween(x, toBack, slide, easeOutQuad);
          x = toBack;
          await wait(c.rest - slide);
        }
      }

      // card thuds into place, character is spent
      await tween(0, 7, 80, easeOutQuad);
      await tween(7, 0, 200, easeOutQuad);
      pose("spent");
      say("phew…");
      await wait(1300);
    } catch (err) {
      console.error(err);
    }

    finish();
    say(GREETING);
    setTimeout(() => {
      if (speechText && speechText.textContent === GREETING) hush();
    }, 4500);
  }

  /* ---------- Start state + trigger (first view only) ---------- */
  box.classList.add("intro-ready", "intro-rest");
  setPos(-TRAVEL);

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        play();
      }
    },
    { threshold: 0.35 }
  );
  io.observe(box);
}

/* ==========================================================
   HERO ENTRANCE ANIMATIONS
   ========================================================== */
function initHeroAnimations() {
  const hero = document.getElementById("home");
  if (!hero) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    // Skip to final state instantly
    hero.classList.add("hero-loaded");
    return;
  }

  // Trigger entrance animations on next frame so CSS transitions fire
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hero.classList.add("hero-loaded");
    });
  });

  // Subtle mouse-parallax on the photo for a 3-D depth feeling
  const photo = hero.querySelector(".hero-photo img");
  if (photo) {
    let pxTick = false;
    hero.addEventListener("mousemove", (e) => {
      if (pxTick) return;
      pxTick = true;
      requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const dx = (e.clientX - rect.left - cx) / cx; // -1 … +1
        const dy = (e.clientY - rect.top  - cy) / cy;
        photo.style.transform = `scale(1) translate(${dx * -6}px, ${dy * -4}px)`;
        pxTick = false;
      });
    }, { passive: true });

    hero.addEventListener("mouseleave", () => {
      photo.style.transform = "";
    });
  }
}