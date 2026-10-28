import { useState, useEffect, useRef } from '../lib/preact-htm.js';
import { todayISO } from '../lib/date.js';
import { list, get, onChange } from './repo.js';

// Lista reativa: recarrega quando a coleção muda
export function useList(store, filter, deps = []) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => list(store, filter).then(r => alive && setRows(r));
    load();
    const off = onChange(s => s === store && load());
    return () => { alive = false; off(); };
  }, [store, ...deps]);
  return rows;
}

export function useRecord(store, id) {
  const [rec, setRec] = useState(undefined);
  useEffect(() => {
    let alive = true;
    const load = () => get(store, id).then(r => alive && setRec(r));
    load();
    const off = onChange(s => s === store && load());
    return () => { alive = false; off(); };
  }, [store, id]);
  return rec;
}

// Data de hoje que vira sozinha: ao voltar para o app, ao focar e a cada minuto
export function useToday() {
  const [d, setD] = useState(todayISO());
  useEffect(() => {
    const check = () => setD(todayISO());
    const iv = setInterval(check, 60000);
    document.addEventListener('visibilitychange', check);
    addEventListener('focus', check);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', check); removeEventListener('focus', check); };
  }, []);
  return d;
}

// Salva com atraso enquanto digita, mas grava na hora se o app for fechado ou minimizado
export function useAutosave(fn, ms = 500) {
  const t = useRef(), pending = useRef(null), fnRef = useRef(fn);
  fnRef.current = fn;
  const flush = () => { clearTimeout(t.current); if (pending.current) { const a = pending.current; pending.current = null; fnRef.current(...a); } };
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onHide);
    addEventListener('pagehide', flush);
    return () => { document.removeEventListener('visibilitychange', onHide); removeEventListener('pagehide', flush); flush(); };
  }, []);
  const call = (...a) => { pending.current = a; clearTimeout(t.current); t.current = setTimeout(flush, ms); };
  call.flush = flush;
  return call;
}
