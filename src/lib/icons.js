const paths = {
  play: '<path d="M8 5v14l11-7z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  search: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16.5 16.5 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  close: '<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  youtube: '<path d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 2 12a30 30 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2A30 30 0 0 0 22 12a30 30 0 0 0-.4-4.8z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>',
  apple: '<path d="M16.6 13.1c0-2.4 2-3.6 2.1-3.7a4.7 4.7 0 0 0-3.7-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-1-3.3-.9a4.9 4.9 0 0 0-4.1 2.5c-1.8 3.1-.5 7.7 1.2 10.2.8 1.2 1.8 2.5 3.1 2.4 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4a11 11 0 0 0 1.4-2.9 4.3 4.3 0 0 1-2.2-4.1zM14 5.8a4.4 4.4 0 0 0 1-3.2 4.6 4.6 0 0 0-3 1.5 4.2 4.2 0 0 0-1.1 3.1A3.8 3.8 0 0 0 14 5.8z" fill="currentColor"/>',
  spotify: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M6.8 9.2c3.7-1.1 7.9-.7 10.8.9M7.5 12.3c3.2-.8 6.8-.5 9.3.8M8.2 15.2c2.6-.6 5.4-.3 7.5.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  amazon: '<path d="M6 18c3.7 2.1 8.1 2.1 12 0M16.8 19.5 18 18l-2-.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M8.5 8.5c.4-2 2-3 4.1-3 2.5 0 3.8 1.2 3.8 3.6v5.5c0 .8.3 1.2.8 1.8h-2.6l-.6-1.1c-1 .9-2.1 1.4-3.5 1.4-2.1 0-3.5-1.3-3.5-3.3 0-2.5 1.8-3.8 5.3-3.8h1.2V9c0-1-.5-1.5-1.3-1.5-.9 0-1.4.5-1.5 1.4zM13.5 12h-.8c-1.7 0-2.5.5-2.5 1.5 0 .8.5 1.2 1.3 1.2.8 0 1.5-.4 2-1z" fill="currentColor"/>',
  iheart: '<path d="M12 21s-7.5-4.5-9.3-9.2C1.4 8.5 3.5 5.5 6.8 5.5c2 0 3.4 1.1 4.2 2.4.8-1.3 2.2-2.4 4.2-2.4 3.3 0 5.4 3 4.1 6.3C19.5 16.5 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 11.5c1.8-1 5.2-1 7 0M9.8 14c1.1-.6 3.3-.6 4.4 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  radio: '<path d="M7 18h10M9 18l1-7h4l1 7M12 4v4M8.5 6.5 10 8M15.5 6.5 14 8M5.5 9.5 8 10.5M18.5 9.5 16 10.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="10" r="1.4" fill="currentColor"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  heart: '<path d="M12 21s-8-4.8-9.5-10C1.6 7.8 4 5 7.2 5c2 0 3.6 1.1 4.8 2.7C13.2 6.1 14.8 5 16.8 5 20 5 22.4 7.8 21.5 11 20 16.2 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  handshake: '<path d="m8 12 3-3c.8-.8 2-.8 2.8 0l1.2 1.2M3 12l4-4 3 3M21 12l-4-4-2.5 2.5M6 15l2 2c.8.8 2 .8 2.8 0l.2-.2M9 18l1 1c.8.8 2 .8 2.8 0l4.2-4.2M3 10l3 3M21 10l-3 3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  quote: '<path d="M6 9h5v5H7c0 2-1 3.5-3 4M14 9h5v5h-4c0 2-1 3.5-3 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 13v6H5V6h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
};

export function icon(name, className = "") {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || paths.arrow}</svg>`;
}
