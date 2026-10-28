// Abre na hora com a cópia salva e busca atualização em segundo plano
// (no mercado com sinal fraco o app não fica esperando a internet).
// Ao publicar mudanças, suba a VERSION e inclua arquivos novos em FILES.
const VERSION = 'v13';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/tokens.css', 'css/base.css', 'css/components.css',
  'js/app.js', 'js/router.js', 'js/lib/preact-htm.js', 'js/lib/date.js', 'js/lib/shopping.js', 'js/lib/actions.js',
  'js/lib/bible.js', 'js/lib/cycle.js', 'js/store/schema.js', 'js/store/db.js', 'js/store/repo.js', 'js/store/hooks.js',
  'js/store/settings.js', 'js/store/backup.js', 'js/components/icons.js', 'js/components/ui.js', 'js/components/nav.js',
  'js/components/quickadd.js', 'js/components/itemsheet.js', 'js/pages/hoje.js', 'js/pages/outras.js',
  'js/pages/compras.js', 'js/pages/ajustes.js', 'js/pages/proximos.js', 'js/pages/biblia.js', 'js/pages/ciclo.js',
  'js/pages/midia.js', 'js/pages/ano.js', 'js/pages/retro.js', 'js/pages/colecoes.js', 'js/components/collection.js',
  'js/pages/treino.js', 'js/pages/alimentacao.js', 'js/pages/exames.js', 'js/pages/saude.js', 'js/lib/fitness.js', 'js/lib/habit-link.js',
  'js/pages/financas.js', 'js/lib/money.js',
  'js/pages/habitos.js', 'js/pages/busca.js', 'js/lib/crypto.js', 'js/lib/lock.js', 'js/components/lockscreen.js',
  'js/pages/cardapio.js', 'js/lib/recipes.js',
  'icons/icon-192.png', 'icons/icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
