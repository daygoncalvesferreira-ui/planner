// Criptografia no próprio aparelho (Web Crypto): PIN com hash e backup com senha.
const enc = new TextEncoder(), dec = new TextDecoder();
export const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
export const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
export const randomBytes = n => crypto.getRandomValues(new Uint8Array(n));
const ITER = 210000; // PBKDF2-SHA256, recomendação atual da OWASP

async function baseKey(secret) { return crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits', 'deriveKey']); }

// Hash do PIN: nunca guardamos o PIN, só o resultado com "sal" aleatório
export async function hashSecret(secret, saltB64) {
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: ITER }, await baseKey(secret), 256);
  return b64(bits);
}
// Comparação em tempo constante
export function sameHash(a, b) { if (!a || !b || a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

async function aesKey(password, salt) {
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, await baseKey(password), { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptText(text, password) {
  const salt = randomBytes(16), iv = randomBytes(12);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(password, salt), enc.encode(text));
  return { enc: 'aes-256-gcm', kdf: 'pbkdf2-sha256', iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) };
}
export async function decryptText(box, password) {
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, await aesKey(password, unb64(box.salt)), unb64(box.data));
    return dec.decode(plain);
  } catch { throw new Error('Senha incorreta ou arquivo danificado.'); }
}
