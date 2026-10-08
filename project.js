/* ==========================================================
   PROJECT SUBPAGES SCRIPT
   Header scroll state, hero entrance, click-to-enlarge images
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Header border/shadow on scroll (same behaviour as index.html)
  const header = document.getElementById("siteHeader");
  const updateHeader = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // 2. Hero entrance (plays once)
  const hero = document.querySelector(".proj-hero, .hero");
  if (hero) {
    hero.classList.add("is-loading");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        hero.classList.remove("is-loading");
        hero.classList.add("is-loaded", "hero-loaded");
      })
    );
  }

  // Ambient cursor spotlight tracking (same as index.html)
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

  // Screenshot galleries animate into view as a small visual story.
  const galleries = document.querySelectorAll(".mobile-showcase, .admin-showcase");
  if ("IntersectionObserver" in window) {
    const galleryObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-inview");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18 });
    galleries.forEach((gallery) => galleryObserver.observe(gallery));
  } else {
    galleries.forEach((gallery) => gallery.classList.add("is-inview"));
  }

  // The student thinks through each transport problem as the overview enters view.
  const problemScene = document.getElementById("problemScene");
  if (problemScene) {
    const startThinking = () => {
      if (problemScene.classList.contains("is-thinking")) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        problemScene.classList.add("is-settled");
        return;
      }
      problemScene.classList.add("is-thinking");
      window.setTimeout(() => problemScene.classList.add("is-settled"), 2200);
    };
    if ("IntersectionObserver" in window) {
      const problemObserver = new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        startThinking();
        observer.disconnect();
      }, { threshold: 0.2 });
      problemObserver.observe(problemScene);
    } else {
      startThinking();
    }
  }

  // 3. Missing screenshots: drop the broken <img> so the striped placeholder + label show
  document.querySelectorAll(".proj-screen img").forEach((img) => {
    img.addEventListener("error", () => img.remove());
  });

  // 4. Click-to-enlarge viewer
  const viewer = document.getElementById("projViewer");
  const viewerImg = document.getElementById("projViewerImg");
  if (!viewer || !viewerImg || typeof viewer.showModal !== "function") return;

  document.querySelectorAll(".proj-zoom").forEach((btn) => {
    btn.addEventListener("click", () => {
      const img = btn.querySelector("img");
      if (!img) return;
      viewerImg.src = img.currentSrc || img.src;
      viewerImg.alt = img.alt;
      viewer.showModal();
    });
  });

  // click on the backdrop closes it
  viewer.addEventListener("click", (e) => {
    if (e.target === viewer) viewer.close();
  });

  // 5. Interactive Carpool Features (2x2 car passenger seat selection)
  const passengers = document.querySelectorAll(".passenger-unit");
  const featurePanels = document.querySelectorAll(".feature-panel");

  if (passengers.length && featurePanels.length) {
    const setActiveSeat = (index) => {
      passengers.forEach((p) => {
        const pIdx = parseInt(p.getAttribute("data-index"), 10);
        const isActive = pIdx === index;
        p.classList.toggle("is-active", isActive);
        p.classList.toggle("is-dimmed", !isActive);
        p.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      featurePanels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.id === `feature-panel-${index}`);
      });
    };

    passengers.forEach((p) => {
      const idx = parseInt(p.getAttribute("data-index"), 10);
      p.addEventListener("click", () => setActiveSeat(idx));
      p.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActiveSeat(idx);
        }
      });
    });

  }
});
