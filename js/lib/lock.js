// Bloqueio do app: PIN (com hash) e, se o aparelho permitir, Face ID / digital (WebAuthn).
import { get, save } from '../store/repo.js';
import { hashSecret, sameHash, b64, unb64, randomBytes } from './crypto.js';

const settings = async () => (await get('settings', 'app')) || { id: 'app' };
const patch = async p => save('settings', { ...(await settings()), ...p, id: 'app' });

export async function setPin(pin) {
  const salt = b64(randomBytes(16));
  const cur = (await settings()).lock || {};
  await patch({ lock: { ...cur, enabled: true, salt, hash: await hashSecret(pin, salt), after: cur.after ?? 1, fails: 0, until: 0 } });
}
export async function disableLock() { await patch({ lock: { enabled: false } }); }
export async function setLockAfter(min) { const s = await settings(); await patch({ lock: { ...s.lock, after: min } }); }

// Tentativas erradas: a partir da 5ª, espera crescente (30 s, 1 min, 2 min…)
export async function checkPin(pin) {
  const s = await settings(); const l = s.lock;
  if (!l?.enabled) return { ok: true };
  if (l.until && Date.now() < l.until) return { ok: false, wait: Math.ceil((l.until - Date.now()) / 1000) };
  const ok = sameHash(await hashSecret(pin, l.salt), l.hash);
  const fails = ok ? 0 : (l.fails || 0) + 1;
  const until = !ok && fails >= 5 ? Date.now() + 30000 * 2 ** (fails - 5) : 0;
  await patch({ lock: { ...l, fails, until } });
  return { ok, wait: until ? Math.ceil((until - Date.now()) / 1000) : 0, left: Math.max(0, 5 - fails) };
}

export const bioAvailable = async () => { try { return !!window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch { return false; } };
export async function enableBio(name) {
  const cred = await navigator.credentials.create({ publicKey: {
    challenge: randomBytes(32), rp: { name: 'Planner' }, user: { id: randomBytes(16), name: 'planner', displayName: name || 'Planner' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' }, timeout: 60000 } });
  const s = await settings(); await patch({ lock: { ...s.lock, bio: b64(cred.rawId) } });
}
export async function disableBio() { const s = await settings(); const { bio, ...rest } = s.lock || {}; await patch({ lock: rest }); }
export async function checkBio() {
  const l = (await settings()).lock;
  if (!l?.bio) return false;
  try { await navigator.credentials.get({ publicKey: { challenge: randomBytes(32), allowCredentials: [{ type: 'public-key', id: unb64(l.bio) }], userVerification: 'required', timeout: 60000 } }); return true; }
  catch { return false; }
}
