const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');
const links = [...(nav?.querySelectorAll('a') || [])];

if (location.pathname === '/' || location.pathname === '') {
  const homeLink = links.find(link => link.getAttribute('href') === '#home');
  homeLink?.setAttribute('aria-current', 'page');
}

menuButton?.addEventListener('click', () => {
  window.requestAnimationFrame(() => {
    if (menuButton.getAttribute('aria-expanded') === 'true') links[0]?.focus();
  });
});
