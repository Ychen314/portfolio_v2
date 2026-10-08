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
  const hero = document.querySelector(".proj-hero");
  if (hero) {
    hero.classList.add("is-loading");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        hero.classList.remove("is-loading");
        hero.classList.add("is-loaded");
      })
    );
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
});