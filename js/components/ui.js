import { html, useState, useEffect } from '../lib/preact-htm.js';
import { icons } from './icons.js';

export const Check = ({ on, onToggle, label }) => html`
  <button class=${'check' + (on ? ' on' : '')} onClick=${onToggle} role="checkbox" aria-checked=${!!on} aria-label=${label}>${icons.check()}</button>`;

export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const k = e => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [open]);
  if (!open) return null;
  return html`<div class="scrim" onClick=${onClose}></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label=${title}>
      <div class="grab"></div>${title && html`<h2>${title}</h2>`}${children}
    </div>`;
}

// Seção didática: ícone colorido + título + explicação curta de para que serve
export const Section = ({ title, icon, tone = 'rose', hint, meta, action, children }) => html`
  <section class=${'section tone-' + tone}>
    <div class="section-head">
      ${icon && html`<span class="badge">${icon}</span>`}
      <div class="head-text"><h2>${title}</h2>${hint && html`<p class="hint">${hint}</p>`}</div>
      ${action || (meta != null && html`<span class="meta">${meta}</span>`)}
    </div>
    ${children}
  </section>`;

// Aviso curto no rodapé. Com { undo }, mostra o botão Desfazer por 6 segundos.
let pushToast;
export const toast = (msg, opts = {}) => pushToast && pushToast({ msg, ...opts });
export function Toaster() {
  const [t, setT] = useState(null);
  useEffect(() => { let h; pushToast = v => { setT(v); clearTimeout(h); h = setTimeout(() => setT(null), v.undo ? 6000 : 2200); }; }, []);
  if (!t) return null;
  return html`<div class=${'toast' + (t.undo ? ' has-undo' : '')} role="status">${t.msg}
    ${t.undo && html`<button onClick=${async () => { setT(null); await t.undo(); }}>Desfazer</button>`}</div>`;
}
