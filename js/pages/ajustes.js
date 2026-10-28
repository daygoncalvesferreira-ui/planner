import { html, useState, useRef, useEffect, useLayoutEffect } from '../lib/preact-htm.js';
import { saveSettings, applyTheme } from '../store/settings.js';
import { exportBackup, importBackup, isEncrypted } from '../store/backup.js';
import { setPin, disableLock, setLockAfter, bioAvailable, enableBio, disableBio, checkPin } from '../lib/lock.js';
import { toast, Sheet, Section } from '../components/ui.js';
import { icons } from '../components/icons.js';
import { MODULES } from './outras.js';

function PinSheet({ open, mode, onClose, settings }) {
  const [a, setA] = useState(''), [b, setB] = useState(''), [cur, setCur] = useState(''), [err, setErr] = useState('');
  useLayoutEffect(() => { setA(''); setB(''); setCur(''); setErr(''); }, [open]); // antes de aparecer: digitar rápido não se perde
  if (!open) return null;
  const needCur = settings.lock?.enabled;
  const submit = async () => {
    if (needCur) { const r = await checkPin(cur); if (!r.ok) return setErr(r.wait ? `Aguarde ${r.wait} s.` : 'PIN atual incorreto.'); }
    if (mode === 'off') { await disableLock(); toast('Bloqueio desligado'); return onClose(); }
    if (!/^\d{4,8}$/.test(a)) return setErr('Use de 4 a 8 números.');
    if (/^(\d)\1+$/.test(a) || '0123456789'.includes(a) || '9876543210'.includes(a)) return setErr('Evite PIN óbvio como 1111 ou 1234.');
    if (a !== b) return setErr('Os dois PINs não são iguais.');
    await setPin(a); toast('PIN salvo 🔒'); onClose();
  };
  const P = (label, v, set) => html`<label class="field"><span>${label}</span><input class="input" type="password" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="8" value=${v} onInput=${e => { set(e.target.value.replace(/\D/g, '')); setErr(''); }} /></label>`;
  return html`<${Sheet} open=${open} onClose=${onClose} title=${mode === 'off' ? 'Desligar bloqueio' : needCur ? 'Trocar PIN' : 'Criar PIN'}>
    ${needCur && P('PIN atual', cur, setCur)}
    ${mode !== 'off' && html`${P('Novo PIN (4 a 8 números)', a, setA)}${P('Repita o novo PIN', b, setB)}
      <p class="lead">Guarde bem: por segurança, ele não pode ser recuperado.</p>`}
    <p class="lock-msg" role="alert">${err}</p>
    <button class="btn" onClick=${submit}>${mode === 'off' ? 'Desligar' : 'Salvar PIN'}</button>
  <//>`;
}

function BackupSheet({ mode, file, onClose }) {
  const [p1, setP1] = useState(''), [p2, setP2] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  useLayoutEffect(() => { setP1(''); setP2(''); setErr(''); }, [mode]);
  if (!mode) return null;
  const go = async () => {
    setBusy(true); setErr('');
    try {
      if (mode === 'export') { if (p1.length < 6) throw new Error('Use pelo menos 6 caracteres.'); if (p1 !== p2) throw new Error('As senhas não são iguais.'); if (await exportBackup(p1)) toast('Backup salvo 🔐'); }
      else { const r = await importBackup(file, p1); toast(r.added ? `Restaurado: ${r.added} itens recuperados` : 'Nada a recuperar: seus dados já estão mais novos'); }
      onClose();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return html`<${Sheet} open=${!!mode} onClose=${onClose} title=${mode === 'export' ? 'Salvar backup com senha' : 'Senha do backup'}>
    <p class="lead">${mode === 'export' ? 'O arquivo fica protegido: sem esta senha, ninguém consegue ler seus dados. Use uma senha diferente do PIN e anote num lugar seguro (ex.: Bitwarden).' : 'Digite a senha usada ao salvar este backup.'}</p>
    <label class="field"><span>Senha</span><input class="input" type="password" autocomplete="new-password" value=${p1} onInput=${e => setP1(e.target.value)} /></label>
    ${mode === 'export' && html`<label class="field"><span>Repita a senha</span><input class="input" type="password" autocomplete="new-password" value=${p2} onInput=${e => setP2(e.target.value)} /></label>`}
    <p class="lock-msg" role="alert">${err}</p>
    <button class="btn" disabled=${busy || !p1} onClick=${go}>${busy ? 'Aguarde…' : mode === 'export' ? 'Salvar backup' : 'Restaurar'}</button>
  <//>`;
}

export function Ajustes({ settings }) {
  const [name, setName] = useState(settings.name || '');
  const [pinMode, setPinMode] = useState(null);
  const [bk, setBk] = useState(null); // { mode, file }
  const [bio, setBio] = useState(false);
  useEffect(() => { bioAvailable().then(setBio); }, []);
  const file = useRef();
  const lock = settings.lock || {};
  const setTheme = t => { applyTheme(t); saveSettings({ theme: t }); };
  const T = (id, l) => html`<button type="button" class=${settings.theme === id ? 'on' : ''} onClick=${() => setTheme(id)}>${l}</button>`;
  async function onImport(e) {
    const f = e.target.files[0]; if (!f) return; e.target.value = '';
    if (await isEncrypted(f)) return setBk({ mode: 'import', file: f });
    try { const r = await importBackup(f); toast(r.added ? `Restaurado: ${r.added} itens` : 'Nada a recuperar'); } catch (err) { toast(err.message || 'Não foi possível ler o arquivo.'); }
  }
  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt) : null;
  const days = last ? Math.floor((Date.now() - last) / 864e5) : null;
  const hidden = settings.hiddenModules || [];
  const togMod = id => saveSettings({ hiddenModules: hidden.includes(id) ? hidden.filter(x => x !== id) : [...hidden, id] });
  return html`
    <a class="icon-btn" href="#/hoje" aria-label="Voltar" style="margin-left:-12px;margin-top:8px">${icons.back()}</a>
    <h1 class="page-title" style="padding-top:4px">Ajustes</h1>

    <${Section} title="Segurança" icon=${html`<span aria-hidden="true">🔒</span>`} tone="rose" hint="Protege o app se alguém pegar seu celular desbloqueado.">
      <label class="toggle"><input type="checkbox" checked=${!!lock.enabled} onChange=${() => setPinMode(lock.enabled ? 'off' : 'on')} />
        <span><strong>Bloquear o app com PIN</strong><small>${lock.enabled ? 'Ligado. O app pede o PIN ao abrir.' : 'Recomendado: você guarda dados de saúde, finanças e da Olivia.'}</small></span></label>
      ${lock.enabled && html`
        ${bio && html`<label class="toggle"><input type="checkbox" checked=${!!lock.bio} onChange=${async e => { try { e.target.checked ? (await enableBio(settings.name), toast('Face ID / digital ativado')) : (await disableBio(), toast('Desativado')); } catch { toast('Não foi possível ativar neste aparelho'); } }} />
          <span><strong>Entrar com Face ID ou digital</strong><small>O PIN continua valendo como reserva.</small></span></label>`}
        <div class="field"><span>Bloquear quando eu sair do app</span><div class="seg">${[[0, 'Na hora'], [1, '1 min'], [5, '5 min'], [15, '15 min']].map(([m, l]) => html`<button type="button" class=${(lock.after ?? 1) === m ? 'on' : ''} onClick=${() => setLockAfter(m)}>${l}</button>`)}</div></div>
        <button class="btn ghost" onClick=${() => setPinMode('on')}>Trocar PIN</button>`}
      <label class="toggle" style="margin-top:12px"><input type="checkbox" checked=${settings.showCycleOnToday !== false} onChange=${e => saveSettings({ showCycleOnToday: e.target.checked })} />
        <span><strong>Mostrar ciclo menstrual na tela Hoje</strong><small>Desligue se costuma mostrar o celular para outras pessoas.</small></span></label>
    <//>

    <${Section} title="Backup" icon=${html`<span aria-hidden="true">💾</span>`} tone="blue" hint="Seus dados ficam só neste aparelho. Salve uma cópia toda semana: no iPhone, escolha Salvar em Arquivos.">
      <p class=${'backup-status' + (days == null || days > 7 ? ' warn' : '')}>${last ? `Último backup: há ${days === 0 ? 'menos de 1 dia' : days + (days === 1 ? ' dia' : ' dias')}` : 'Você ainda não fez nenhum backup.'}
        ${window.__persisted === false ? ' · O navegador não garantiu guardar os dados: instale o app na tela inicial.' : ''}</p>
      <button class="btn" onClick=${() => setBk({ mode: 'export' })}>Salvar backup com senha</button>
      <button class="btn ghost" onClick=${() => file.current.click()}>Restaurar backup</button>
      <input ref=${file} type="file" accept="application/json,.json" class="sr-only" onChange=${onImport} />
    <//>

    <${Section} title="Áreas que eu uso" icon=${html`<span aria-hidden="true">🧩</span>`} tone="lilac" hint="Desligue o que você não usa: some da tela Vida e da busca de atalhos. Nada é apagado e você pode religar quando quiser.">
      <div class="mod-list">${MODULES.map(([id, e, n]) => html`<label class="mod"><input type="checkbox" checked=${!hidden.includes(id)} onChange=${() => togMod(id)} /><span>${e} ${n}</span></label>`)}</div>
    <//>

    <${Section} title="Geral" icon=${html`<span aria-hidden="true">⚙️</span>`} tone="teal">
      <label class="field"><span>Seu nome</span>
        <input class="input" value=${name} onInput=${e => setName(e.target.value)} onBlur=${() => name.trim() && saveSettings({ name: name.trim() })} /></label>
      <div class="field"><span>Aparência</span><div class="seg">${T('light', 'Claro')}${T('dark', 'Escuro')}${T('auto', 'Automático')}</div></div>
      <a class="btn ghost" style="display:grid;place-items:center;text-decoration:none" href="#/hoje/editar">Personalizar a tela Hoje</a>
    <//>
    <${PinSheet} open=${!!pinMode} mode=${pinMode} settings=${settings} onClose=${() => setPinMode(null)} />
    <${BackupSheet} mode=${bk?.mode} file=${bk?.file} onClose=${() => setBk(null)} />`;
}
