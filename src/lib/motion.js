export function setupEditorialMotion(root = document) {
  const nodes = [...root.querySelectorAll(".reveal, [data-reveal]")];
  if (!nodes.length) return;

  document.documentElement.classList.add("motion-ready");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    nodes.forEach(node => {
      node.classList.add('visible');
      node.style.removeProperty("--reveal-delay");
    });
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -42px" });

  nodes.forEach((node, index) => {
    if (node.dataset.revealStagger === "true") {
      node.style.setProperty("--reveal-delay", `${Math.min(index * 90, 360)}ms`);
    }
    observer.observe(node);
  });
}
