import { useState, useEffect } from './lib/preact-htm.js';
const parse = () => (location.hash.replace(/^#\/?/, '').split('?')[0] || 'hoje').split('/');
export function useRoute() {
  const [r, setR] = useState(parse());
  useEffect(() => { const f = () => { setR(parse()); scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return r;
}
