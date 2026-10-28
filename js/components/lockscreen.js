import { html, useState, useEffect, useRef } from '../lib/preact-htm.js';
import { checkPin, checkBio } from '../lib/lock.js';

export function LockScreen({ settings, onUnlock }) {
  const [pin, setPin] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false), [forgot, setForgot] = useState(false);
  const ref = useRef();
  const bio = !!settings.lock?.bio;
  const tryBio = async () => { if (await checkBio()) onUnlock(); };
  useEffect(() => { bio ? tryBio() : ref.current?.focus(); }, []);
  const submit = async e => {
    e?.preventDefault(); if (pin.length < 4 || busy) return; setBusy(true);
    const r = await checkPin(pin); setBusy(false); setPin('');
    if (r.ok) return onUnlock();
    setMsg(r.wait ? `Muitas tentativas. Aguarde ${r.wait} segundos.` : `PIN incorreto.${r.left ? ` Restam ${r.left} tentativas antes de uma pausa.` : ''}`);
  };
  const tap = d => { if (pin.length < 8) { const n = pin + d; setPin(n); setMsg(''); } };
  return html`<div class="lock" role="dialog" aria-modal="true" aria-label="Planner bloqueado">
    <div class="lock-box">
      <div class="lock-ico" aria-hidden="true">🔒</div>
      <h1>${settings.name ? `Olá, ${settings.name}` : 'Planner bloqueado'}</h1>
      <p>Digite seu PIN para continuar</p>
      <form onSubmit=${submit}>
        <input ref=${ref} class="pin-input" type="password" inputmode="numeric" autocomplete="off" pattern="[0-9]*" maxlength="8" value=${pin}
          aria-label="PIN" onInput=${e => { setPin(e.target.value.replace(/\D/g, '')); setMsg(''); }} />
      </form>
      <div class="pin-dots" aria-hidden="true">${Array.from({ length: Math.max(4, pin.length) }, (_, i) => html`<i class=${i < pin.length ? 'on' : ''}></i>`)}</div>
      <p class="lock-msg" role="alert">${msg}</p>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => html`<button type="button" onClick=${() => tap(String(n))}>${n}</button>`)}
        ${bio ? html`<button type="button" aria-label="Usar Face ID ou digital" onClick=${tryBio}>☺︎</button>` : html`<span></span>`}
        <button type="button" onClick=${() => tap('0')}>0</button>
        <button type="button" aria-label="Apagar" onClick=${() => setPin(pin.slice(0, -1))}>⌫</button></div>
      <button class="btn" disabled=${pin.length < 4 || busy} onClick=${submit}>Entrar</button>
      <button class="link lock-forgot" onClick=${() => setForgot(!forgot)}>Esqueci o PIN</button>
      ${forgot && html`<p class="lock-help">Por segurança, o PIN não pode ser recuperado. ${bio ? 'Tente entrar com Face ID ou digital.' : ''} Se não lembrar, a saída é apagar os dados do site nos ajustes do navegador e restaurar seu último backup com a senha dele.</p>`}
    </div>
  </div>`;
}
