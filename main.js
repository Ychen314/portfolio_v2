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

  // 2. Skills: pills spiral in, then orbit the character while scrolling
  initSkillsScroll();

  // 3. Projects: character follows the S-path down the page
  initProjectsJourney();
});

/* ==========================================================
   SKILLS
   ========================================================== */
function initSkillsScroll() {
  const track = document.getElementById("skills");
  const stage = document.getElementById("skillsStage");
  const pills = Array.from(document.querySelectorAll(".tech-pill"));
  const progressFill = document.getElementById("skillsProgressFill");
  const ringOuter = stage ? stage.querySelector(".orbit-ring.outer") : null;
  const ringInner = stage ? stage.querySelector(".orbit-ring.inner") : null;

  if (!track || !stage || pills.length === 0) return;

  const TAU = Math.PI * 2;
  const SPIN_TURNS = 0.9;
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

    const startProgress = (i / pills.length) * 0.5;
    const endProgress = startProgress + 0.24;

    return {
      el,
      outer,
      baseAngle,
      startProgress,
      endProgress,
      spawnAngle: baseAngle + (outer ? 0.9 : -0.9),
      lastZ: ""
    };
  });

  let geo = {};

  function measure() {
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
    const scrollDist = track.offsetHeight - window.innerHeight;

    if (scrollDist <= 0) {
      ticking = false;
      return;
    }

    const progress = clamp(-rect.top / scrollDist, 0, 1);
    const flightProgress = reduceMotion ? 1 : progress;
    const spin = reduceMotion ? 0 : progress * TAU * SPIN_TURNS;

    stage.style.setProperty("--p", progress.toFixed(3));
    if (progressFill) {
      progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    configs.forEach((cfg) => {
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

      const depthScale = 0.8 + 0.2 * depth;
      const depthOpacity = 0.5 + 0.5 * depth;

      const scale = lerp(0.3, depthScale, e);
      const fadeIn = clamp(t * 2.5, 0, 1);
      const opacity = fadeIn * lerp(1, depthOpacity, e);

      const z = t < 1 || depth > 0.5 ? "3" : "1";
      if (z !== cfg.lastZ) {
        cfg.el.style.zIndex = z;
        cfg.lastZ = z;
      }

      cfg.el.style.opacity = opacity.toFixed(2);
      cfg.el.style.transform =
        `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      cfg.el.style.pointerEvents = t >= 1 ? "auto" : "none";
    });

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