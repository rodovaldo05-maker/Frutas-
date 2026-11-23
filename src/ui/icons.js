// Ícones da interface em SVG (traço), desenhados para o jogo. Elementos com
// data-icon="nome" recebem o ícone ao iniciar.

const svg = (body, fill = false) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  play: svg('<path d="M7 4.5v15l12-7.5z"/>', true),
  swords: svg('<path d="M4 4l9 9M4 4h4M4 4v4M20 4l-9 9M20 4h-4M20 4v4M7 17l-3 3M17 17l3 3M8.5 14.5l1 1M15.5 14.5l-1 1"/>'),
  server: svg('<rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M8 7h.01M8 17h.01M12 7h5M12 17h5"/>'),
  gear: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/><circle cx="12" cy="12" r="6.6"/>'),
  scroll: svg('<path d="M7 4h11a2 2 0 0 1 2 2v1h-4M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M7 4a2 2 0 0 1 2 2v12M11 9h5M11 13h5M11 17h3"/>'),
  map: svg('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  credits: svg('<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  run: svg('<circle cx="15" cy="4.5" r="1.8"/><path d="M8 21l3-5 3 2v4M6 12l3-3 4 1 2 3 3 1M11 10l-2 6"/>'),
  crouch: svg('<circle cx="12" cy="5" r="1.8"/><path d="M8 20h4l1-4-3-2 1-4h3l2 3M10 10l-3 3"/><path d="M5 20h14" opacity=".5"/>'),
  dash: svg('<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M16 12a4 4 0 1 1-1.5-3.1"/><path d="M17 3l.5 3-3 .5"/>'),
  jump: svg('<path d="M12 20V6M6 11l6-6 6 6"/><path d="M6 20h12" opacity=".6"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  coin: svg('<circle cx="12" cy="12" r="8" fill="#f2c14e" stroke="#8a5a14"/><path d="M12 7.5v9M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" stroke="#8a5a14"/>'),
  gem: svg('<path d="M6 4h12l3 5-9 11L3 9z" fill="#c084fc" stroke="#5b2a86"/><path d="M3 9h18M9 4l3 16 3-16" stroke="#5b2a86" opacity=".7"/>'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>'),
  bolt: svg('<path d="M13 3L5 14h6l-1 7 8-11h-6z" fill="currentColor"/>'),
  bubble: svg('<circle cx="9" cy="14" r="5"/><circle cx="16.5" cy="7.5" r="3"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  save: svg('<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>'),
  home: svg('<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/>'),
  flag: svg('<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  bag: svg('<path d="M6 8h12l1 12H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2M9 12h6"/>'),
  key: svg('<circle cx="8" cy="12" r="4" fill="#f2c14e" stroke="#8a5a14"/><path d="M12 12h9M18 12v3M21 12v2" stroke="#f2c14e"/>'),
  star: svg('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8z"/>'),
  trash: svg('<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>'),
  glider: svg('<path d="M12 5l10 9-10-3L2 14z"/><path d="M12 11v4M9 18h6M9.5 18L12 11l2.5 7"/>'),
  person: svg('<circle cx="12" cy="7" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>'),
  fist: svg('<path d="M7 11V8a1.5 1.5 0 0 1 3 0v2M10 10V7a1.5 1.5 0 0 1 3 0v3M13 10V7.5a1.5 1.5 0 0 1 3 0V11M16 11V9a1.5 1.5 0 0 1 3 0v4a7 7 0 0 1-7 7h-1a5 5 0 0 1-5-5v-2a2 2 0 0 1 2-2h3"/>'),
  shield: svg('<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M12 7v10" opacity=".6"/>'),
  fruit: svg('<circle cx="12" cy="14" r="6.5"/><path d="M12 7.5V4M12 5c1.5-1.8 4-2 5.5-1-1 1.8-3.5 2.6-5.5 2"/>'),
  sword: svg('<path d="M14.5 3H21v6.5L10 20.5 3.5 14z"/><path d="M6 12l6 6M4 20l3-3"/>'),
  weight: svg('<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>'),
  vital: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M12 9.5v5M9.5 12h5"/>'),
  pad: svg('<rect x="3" y="8" width="18" height="10" rx="4"/><path d="M8 11v4M6 13h4M15.5 12h.01M17.5 14h.01"/>'),
};

export function applyIcons(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) {
    const name = el.dataset.icon;
    if (ICONS[name] && !el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', ICONS[name]);
  }
}

// Emblema do jogo: timão dourado com a fruta mascote no centro
export const EMBLEM = `<svg viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a3"/><stop offset=".55" stop-color="#d9a64a"/><stop offset="1" stop-color="#8a5a1c"/></linearGradient>
  </defs>
  <g stroke="#3b250b" stroke-width="2.5" fill="url(#gold)">
    ${Array.from({ length: 8 }, (_, i) => `<rect x="56" y="4" width="8" height="26" rx="3" transform="rotate(${i * 45} 60 60)"/>`).join('')}
    <circle cx="60" cy="60" r="36" fill="none" stroke="url(#gold)" stroke-width="9"/>
    <circle cx="60" cy="60" r="36" fill="none" stroke="#3b250b" stroke-width="1.5"/>
    <circle cx="60" cy="60" r="27" fill="#1d1533"/>
  </g>
  <g shape-rendering="crispEdges">
    <rect x="47" y="50" width="26" height="20" fill="#ff9b79"/><rect x="50" y="46" width="20" height="4" fill="#ff9b79"/><rect x="50" y="70" width="20" height="4" fill="#d66c54"/>
    <rect x="47" y="64" width="26" height="6" fill="#d66c54"/><rect x="50" y="50" width="6" height="6" fill="#ffbe96"/>
    <rect x="58.5" y="39" width="3" height="8" fill="#78543a"/><rect x="61" y="39" width="9" height="4" fill="#7ab05c"/>
    <rect x="52" y="56" width="4" height="5" fill="#221e20"/><rect x="64" y="56" width="4" height="5" fill="#221e20"/>
    <rect x="57" y="64" width="6" height="2" fill="#221e20"/>
  </g>
</svg>`;
