/* Intranet HSE CDES — service worker (V3.3 p2 · hors connexion)
   Garde une copie de la page et de ses fichiers : sur chantier sans réseau, un
   appareil déjà déverrouillé rouvre l'intranet avec ses dernières données
   (elles sont dans le stockage local de la page). Les appels au serveur Apps
   Script ne sont JAMAIS mis en cache. Mise à jour : réseau d'abord, cache en
   secours (une nouvelle version du dépôt est vue dès la connexion suivante). */
const CACHE='ihse-v3-9-1';
const COQUILLE=['./','index.html','hse.html','config.js','css/intranet.css','css/hse.css','js/configuration.js','js/intranet.js','js/bulletin.js','js/terrain.js','js/qhp.js','js/retex.js','js/hse.js',
  'img/logo_cdes.png','img/bonhomme.png','img/mase_logo.png','img/mase_certificat.jpg','img/mascotte.png','img/picto_faits.png','img/picto_flashs.png'];
/* V3.7.1 : à l'installation aussi, on contourne le cache HTTP (sinon, dans les 10 min qui
   suivent un déploiement, l'ancien fichier pouvait être figé dans la nouvelle coquille) */
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(COQUILLE.map(u=>c.add(new Request(u,{cache:'reload'}))))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;        // serveur, polices, etc. : jamais touchés
  /* V3.3.6 : « no-cache » = on redemande toujours à GitHub si le fichier a changé ; avant,
     le navigateur pouvait resservir pendant 10 min l'ancienne version d'un fichier. */
  const req=e.request.mode==='navigate'?fetch(e.request.url,{cache:'no-cache',credentials:'same-origin'}):fetch(e.request,{cache:'no-cache'});
  e.respondWith(req.then(r=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r})
    .catch(()=>caches.match(e.request).then(r=>r||caches.match(e.request,{ignoreSearch:true})).then(r=>r||(e.request.mode==='navigate'?caches.match('index.html'):undefined))));
});
