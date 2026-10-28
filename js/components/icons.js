import { html } from '../lib/preact-htm.js';
const I = (d, s = 22) => html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const icons = {
  hoje: () => I(html`<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>`),
  calendario: () => I(html`<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>`),
  habitos: (z) => I(html`<path d="M12 20.5c4.5-2.6 7.5-6 7.5-9.6A4.4 4.4 0 0 0 12 8a4.4 4.4 0 0 0-7.5 2.9c0 3.6 3 7 7.5 9.6Z"/>`, z),
  financas: () => I(html`<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>`),
  vida: (z) => I(html`<circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>`, z),
  plus: () => I(html`<path d="M12 5v14M5 12h14"/>`, 24),
  check: () => I(html`<path d="m6 12.5 4 4 8-9"/>`, 16),
  x: () => I(html`<path d="M7 7l10 10M17 7 7 17"/>`, 18),
  gear: () => I(html`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>`),
  star: () => I(html`<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>`, 20),
  clock: () => I(html`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`, 20),
  list: () => I(html`<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17.5" r="1"/>`, 20),
  moon: () => I(html`<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>`, 20),
  search: () => I(html`<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>`),
  edit: () => I(html`<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>`, 18),
  back: () => I(html`<path d="M15 5l-7 7 7 7"/>`)
};
