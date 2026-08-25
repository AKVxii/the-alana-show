export function setupEditorialMotion(root = document) {
  const nodes = [...root.querySelectorAll(".reveal, [data-reveal]")];
  if (!nodes.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    nodes.forEach(node => {
      node.classList.add('visible');
      node.style.removeProperty("--reveal-delay");
    });
    document.documentElement.classList.add("motion-ready");
    return;
  }

  // Never hide content the visitor has already seen. Mark everything in the
  // initial viewport visible before motion-ready can apply its hidden state.
  const viewportCutoff = window.innerHeight * 1.05;
  nodes.forEach(node => {
    if (node.getBoundingClientRect().top <= viewportCutoff) node.classList.add("visible");
  });
  document.documentElement.classList.add("motion-ready");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -42px" });

  nodes.filter(node => !node.classList.contains("visible")).forEach((node, index) => {
    if (node.dataset.revealStagger === "true") {
      node.style.setProperty("--reveal-delay", `${Math.min(index * 90, 360)}ms`);
    }
    observer.observe(node);
  });
}
