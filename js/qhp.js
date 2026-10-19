/* ============================================================================
 *  INTRANET HSE — ESPACE QHP  (V3.3 · paquet 3 · 12/10/2026 — revu V3.9 · 16/10/2026)
 * ----------------------------------------------------------------------------
 *  Un écran par thème de quart d'heure prévention : 🎬 la vidéo, ⚡ le flash,
 *  ❓ le quiz (réponses immédiates, score), et le bouton ✍️ Émargement sur
 *  chaque page (lien de branchement de la tuile « emargement »). Les thèmes
 *  sont gérés depuis cet écran par un appareil éditeur (titre, mois, liens,
 *  questions) et rangés dans l'onglet QHP_THEMES par la synchro.
 *  Format des questions tapées par le service HSE (une question par bloc) :
 *      Q: Faut-il un casque sur le ponton ?
 *      - Non
 *      - *Oui, toujours
 *      E: Le casque est obligatoire dès la passerelle.
 *  L'étoile marque la bonne réponse ; la ligne E: (facultative) explique.
 *  Dépend de intranet.js (state, conf, esc, toast, go, estEditeur, syncAuto…).
 * ========================================================================== */
let qhpThemeOuvert=null, qhpRep={};
function qhpThemes(){return (state.qhpThemes||[]).filter(t=>!(state.tombQhpThemes||{})[t.id]).sort((a,b)=>String(b.mois||'').localeCompare(String(a.mois||''))||String(a.titre||'').localeCompare(String(b.titre||''),'fr'))}
function qhpMoisLib(k){if(!/^\d{4}-\d{2}$/.test(String(k||'')))return k||'';return (typeof BUL_MOIS_L!=='undefined'?BUL_MOIS_L[Number(k.slice(5,7))-1]:k.slice(5,7))+' '+k.slice(0,4)}
function lienEmargement(){
  if(typeof liensOutils!=='undefined'&&liensOutils.emargement)return liensOutils.emargement;
  const o=(state.outils||[]).find(x=>x.id==='emargement'&&x.url);return o?o.url:'';
}
function boutonEmargement(cls){const u=lienEmargement();return u?'<a class="btn btn-accent '+(cls||'')+'" href="'+esc(u)+'" target="_blank" rel="noopener">✍️ Émargement</a>':'<button class="btn btn-ghost '+(cls||'')+'" onclick="toast(\'La tuile « Fiche d’émargement QHP » n’est pas encore branchée\',true)">✍️ Émargement</button>'}
/* vidéo : YouTube / Vimeo / Stream intégrés quand c'est possible, sinon un bouton */
function youtubeId(u){const m=/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/.exec(String(u||''));return m?m[1]:''}
function qhpVideoHtml(u,auto){
  u=String(u||'').trim(); if(!u)return '';
  const yt=youtubeId(u);
  if(yt)return '<div class="qhp-vid"><iframe src="https://www.youtube.com/embed/'+esc(yt)+(auto?'?autoplay=1':'')+'" title="Vidéo du QHP" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>';
  let m=/vimeo\.com\/(\d+)/.exec(u);
  if(m)return '<div class="qhp-vid"><iframe src="https://player.vimeo.com/video/'+esc(m[1])+(auto?'?autoplay=1':'')+'" title="Vidéo du QHP" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
  if(/\.(mp4|webm|m4v)(\?|$)/i.test(u))return '<div class="qhp-vid"><video controls preload="metadata" src="'+esc(u)+'"></video></div>';
  return '<a class="btn btn-primary" href="'+esc(u)+'" target="_blank" rel="noopener">🎬 Ouvrir la vidéo</a><p class="hint">Vidéo hébergée ailleurs (SharePoint, Stream…) : elle s’ouvre dans un nouvel onglet.</p>';
}
/* V3.9 — la VIGNETTE d'une vidéo YouTube (image de la vidéo + bouton ▶) : la vidéo ne se
   charge qu'au clic, la page reste légère. Les autres hébergeurs gardent leur lecteur. */
function qhpVideoVignette(u){
  const yt=youtubeId(u);if(!yt)return qhpVideoHtml(u);
  return '<div class="fl-vidv" data-u="'+esc(u)+'" onclick="qhpJouerVideo(this)" title="Lire la vidéo" role="button" tabindex="0"><img src="https://img.youtube.com/vi/'+esc(yt)+'/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()"><span class="fl-play">▶</span></div>';
}
function qhpJouerVideo(el){const u=el.dataset.u;const w=document.createElement('div');w.innerHTML=qhpVideoHtml(u,true);el.replaceWith(w.firstChild)}
/* ==================== V3.5 — TOUS LES FLASHS (bibliothèque) ====================
   L'Espace QHP a deux onglets : 🗓 les thèmes du mois (comme avant) et 📚 tous les
   flashs de la banque documentaire (SharePoint). Chaque flash a sa page : l'IMAGE du
   flash au centre (export PNG envoyé par le service HSE), la vidéo, le quiz, le
   bouton d'émargement. La vidéo, le quiz et l'image sont rangés dans un « thème »
   (onglet QHP_THEMES) qui porte l'identifiant du flash (colonne banque). */
let qhpOnglet=(function(){try{return localStorage.getItem('ihse_qhp_onglet')||'themes'}catch(e){return 'themes'}})();
let qhpFlashOuvert=null;
let flFiltre={q:'',sec:'',type:'',an:'',mois:''}, flIA={q:'',ids:[],pq:{},enCours:false,err:''};
function flReset(){flFiltre={q:'',sec:'',type:'',an:'',mois:''};flIA={q:'',ids:[],pq:{},mots:[],enCours:false,err:''}}
/* V3.9 : cliquer « Tous les flashs » repart de la liste complète (plus de question ni de recherche IA qui traîne) */
function setQhpOnglet(o){qhpOnglet=o==='flashs'?'flashs':'themes';try{localStorage.setItem('ihse_qhp_onglet',qhpOnglet)}catch(e){}qhpFlashOuvert=null;qhpThemeOuvert=null;flReset();renderQhp()}
function qhpVoirFlashs(){qhpOnglet='flashs';qhpFlashOuvert=null;qhpThemeOuvert=null;go('v-qhp')}
function banqueFlashs(){return (typeof banqueData==='function'?banqueData():[]).filter(d=>d.famille==='flash')}
function flashParId(id){id=String(id);return banqueFlashs().find(x=>String(x.id)===id)}
function enrichissement(d){const l=qhpThemes(),id=String(d.id);
  return l.find(t=>t.banque&&String(t.banque)===id)||l.find(t=>t.flash&&d.url&&t.flash===d.url)
    ||l.find(t=>!t.banque&&t.fichier&&d.fichier&&flNomNet(t.fichier)===flNomNet(d.fichier))||null}   // V3.9.4 : image déposée avant que la banque connaisse le flash
/* V3.10 — IMAGES DIRECTES : l'image d'un flash est affichée depuis Google Drive (drive.google.com/thumbnail),
   sans passer par le script : pas d'exécution Apps Script, pas d'aller-retour réseau par image, cache du
   navigateur. Si Google refuse (image pas encore rendue lisible par lien, réseau qui bloque), le <img>
   échoue et la vignette repasse par le script, comme avant (flImgRepli). */
function flImgUrl(id,w){return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(String(id))+'&sz=w'+(w||400)}
function flVigHtml(id){return '<div class="fl-vig" data-fim="'+esc(id)+'"><img src="'+esc(flImgUrl(id,400))+'" alt="" loading="lazy" onload="this.parentNode.classList.add(\'pret\',\'direct\')" onerror="flImgRepli(this)"></div>'}
function flImgRepli(img){const p=img.parentNode;if(!p)return;img.remove();p.dataset.repli='1';delete p.dataset.ok;p.classList.remove('pret','direct');flChargerImages()}
function flCouleur(d){return (typeof bqCouleur==='function')?bqCouleur(d):'#1F6FB2'}
function flDate(d){return (typeof bqDate==='function')?bqDate(d.date):String(d.date||'')}
function renderQhp(){
  const box=document.getElementById('v-qhp');if(!box)return;
  if(qhpThemeOuvert){
    const t=qhpThemes().find(x=>x.id===qhpThemeOuvert);
    const d=t&&t.banque?flashParId(t.banque):null;
    if(d){renderFlashPage(d,t);return}
    renderQhpTheme();return;
  }
  if(qhpFlashOuvert){const d=flashParId(qhpFlashOuvert);if(d){renderFlashPage(d,enrichissement(d));return}qhpFlashOuvert=null}
  const nbFl=banqueFlashs().length;
  let h='<div class="arr-head"><div><h2>🎓 Espace QHP</h2><p class="small muted" style="margin:2px 0 0">Les quarts d’heure prévention : le flash, la vidéo, le quiz — et l’émargement à portée de main.</p></div>'
    +'<div class="arr-kpis">'+boutonEmargement('btn-sm')+(estEditeur()&&qhpOnglet==='themes'?'<button class="btn btn-ghost btn-sm no-print" onclick="qhpEditer()" title="Un thème animé : vidéo + quiz sans flash de la banque">＋ Thème animé</button>':'')
    +(estEditeur()&&qhpOnglet==='flashs'?'<button class="btn btn-ghost btn-sm no-print" onclick="flLotOuvrir()" title="Déposer les PDF des flashs : leur première page devient l’image de chaque flash">📤 Images des flashs</button>':'')+'</div></div>';
  /* V3.9.4 : « 🔴 Derniers flashs » (les parutions des 3 derniers mois) remplace « Thèmes du mois » */
  h+='<div class="seg qhp-ong no-print"><button class="rouge '+(qhpOnglet==='themes'?'on':'')+'" onclick="setQhpOnglet(\'themes\')">🔴 Derniers flashs</button><button class="'+(qhpOnglet==='flashs'?'on':'')+'" onclick="setQhpOnglet(\'flashs\')">📚 Tous les flashs'+(nbFl?' <span class="apill">'+nbFl+'</span>':'')+'</button></div>';
  if(qhpOnglet==='flashs'){
    if(typeof banque!=='undefined'&&!banque.charge&&!banque.enCours&&typeof chargerBanque==='function')setTimeout(()=>chargerBanque(false),0);
    h+='<div class="ia-recherche"><input type="text" id="fl-q" class="bqsearch" value="'+esc(flFiltre.q)+'" placeholder="🔎 Rechercher un flash… chute à l’eau, levage, chaleur — ou pose une question" oninput="flSaisie(this.value)" onkeydown="if(event.key===\'Enter\')flLancerIA()">'
      +'<button class="btn btn-accent ia-btn" onclick="flLancerIA()" title="L’IA comprend la question et les synonymes du métier">✨ IA</button></div>'
      +'<div class="bqbar no-print" id="fl-filtres"></div><div id="fl-liste"></div>';
    box.innerHTML=h;renderFlashListe();return;
  }
  /* les derniers flashs parus : ceux des 3 derniers mois, et au moins les 8 plus récents */
  if(typeof banque!=='undefined'&&!banque.charge&&!banque.enCours&&typeof chargerBanque==='function')setTimeout(()=>chargerBanque(false),0);
  const tousFl=banqueFlashs().slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  /* V3.9.5 : les deux derniers MOIS DE PARUTION (pas de remplissage avec de vieux flashs) */
  const moisParus=[...new Set(tousFl.map(d=>String(d.date||'').slice(0,7)).filter(m=>/^\d{4}-\d{2}$/.test(m)))].slice(0,2);
  const derniers=tousFl.filter(d=>moisParus.includes(String(d.date||'').slice(0,7)));
  const typeLib=d=>(typeof BQ_TYPES!=='undefined'&&BQ_TYPES[d.type])?BQ_TYPES[d.type].lib:'Non typé';
  if(!tousFl.length)h+='<div class="secempty">'+((typeof banque!=='undefined'&&banque.enCours)?'⏳ Chargement des flashs…':'Aucun flash dans la banque pour l’instant.')+'</div>';
  else{
    h+='<p class="hint">'+derniers.length+' flash'+(derniers.length>1?'s':'')+' — '+moisParus.map(m=>esc(qhpMoisLib(m))).join(' et ')+' — <a href="#" onclick="setQhpOnglet(\'flashs\');return false">voir les '+tousFl.length+'</a></p>';
    h+='<div class="fl-grid" id="fl-derniers">'+derniers.map(d=>{const t=enrichissement(d),c=flCouleur(d);
      return '<div class="fl-card" style="--c:'+esc(c)+'" data-id="'+esc(String(d.id))+'" onclick="qhpOuvrirFlash(this.dataset.id)">'
        +(t&&t.image?flVigHtml(t.image):'<div class="fl-vig vide"><span>⚡</span></div>')
        +'<div class="fl-c"><div class="fl-band"><span>'+esc(typeLib(d))+'</span><span>'+esc(flDate(d))+'</span></div>'
        +'<div class="fl-t">'+esc(d.titre||d.fichier||'Flash')+'</div>'
        +'<div class="fl-m">'+(d.secteur&&d.secteur!=='Général'?'<span class="fl-sec">'+esc(d.secteur)+'</span>':'')
        +(t&&t.video?'<span>🎬</span>':'')+(t&&(t.quiz||[]).length?'<span>❓ '+t.quiz.length+'</span>':'')+'</div></div></div>'}).join('')+'</div>';
  }
  /* les thèmes animés (vidéo + quiz sans flash de la banque), s'il y en a */
  const l=qhpThemes().filter(t=>(t.actif||estEditeur())&&!t.banque&&!t.fichier);
  if(l.length)h+='<h3 class="qhp-sous">🗓 Thèmes animés</h3><div class="qhp-grid">'+l.map(t=>'<div class="qhp-card'+(t.actif?'':' off')+'" data-id="'+esc(t.id)+'" onclick="qhpOuvrir(this.dataset.id)">'
    +'<div class="qhp-mois">'+esc(qhpMoisLib(t.mois)||'—')+(t.actif?'':' · <i>masqué</i>')+'</div><div class="qhp-titre">'+esc(t.titre||'Sans titre')+'</div>'
    +'<div class="qhp-badges">'+(t.video?'<span>🎬 vidéo</span>':'')+(t.flash||t.image?'<span>⚡ flash</span>':'')+((t.quiz||[]).length?'<span>❓ quiz · '+t.quiz.length+'</span>':'')+'</div></div>').join('')+'</div>';
  box.innerHTML=h;flChargerImages();
}
function flSaisie(v){flFiltre.q=v;flFiltre.mois='';renderFlashListe()}
/* V3.5.1 — « ⚡ Flashs du mois » : les flashs du mois en cours ou, s'il n'y en a pas
   encore, ceux du dernier mois paru. Un seul flash : il s'ouvre directement. */
function dernierMoisFlashs(){
  const ms=banqueFlashs().map(d=>String(d.date||'').slice(0,7)).filter(m=>/^\d{4}-\d{2}$/.test(m)).sort();
  return ms.length?ms[ms.length-1]:'';
}
function flashsDuMois(){
  qhpOnglet='flashs';try{localStorage.setItem('ihse_qhp_onglet','flashs')}catch(e){}
  qhpThemeOuvert=null;qhpFlashOuvert=null;flIA={q:'',ids:[],pq:{},mots:[],enCours:false,err:''};
  const pret=banqueFlashs().length>0;
  if(!pret){flFiltre={q:'',sec:'',type:'',an:'',mois:'*'};if(document.querySelector('.view.active')&&document.querySelector('.view.active').id!=='v-qhp')go('v-qhp');else renderQhp();return}
  const m=dernierMoisFlashs();
  flFiltre={q:'',sec:'',type:'',an:'',mois:m};
  const l=banqueFlashs().filter(d=>String(d.date||'').slice(0,7)===m);
  if(l.length===1){qhpFlashOuvert=l[0].id;qhpRep={}}
  if(document.querySelector('.view.active')&&document.querySelector('.view.active').id!=='v-qhp')go('v-qhp');else{renderQhp();window.scrollTo(0,0)}
}
function flFinMois(){flFiltre.mois='';renderFlashListe()}
function flSetFiltre(k,v){flFiltre[k]=v;flFiltre.mois='';renderFlashListe()}
async function flLancerIA(){
  const q=String(flFiltre.q||'').trim();
  if(q.length<3){toast('Écris d’abord ta question (3 lettres au moins)',true);return}
  flIA={q:q,ids:[],pq:{},mots:[],enCours:true,err:'',debut:Date.now()};renderFlashListe();if(typeof chronoIAStart==='function')chronoIAStart();
  try{const r=await iaMots(q);flIA.mots=r.mots;flIA.cache=r.cache;flIA.duree=Math.round((Date.now()-flIA.debut)/1000);if(!r.mots.length)flIA.err='l’IA n’a pas compris la question'}
  catch(e){flIA.err=e.message||'erreur'}
  finally{flIA.enCours=false;renderFlashListe()}
}
function flFinIA(){flIA={q:'',ids:[],pq:{},mots:[],enCours:false,err:''};flFiltre.q='';const i=document.getElementById('fl-q');if(i)i.value='';renderFlashListe()}
function renderFlashListe(){
  const box=document.getElementById('fl-liste');if(!box)return;
  const tous=banqueFlashs();
  const typeLib=d=>(typeof BQ_TYPES!=='undefined'&&BQ_TYPES[d.type])?BQ_TYPES[d.type].lib:'Non typé';
  const uniq=f=>[...new Set(tous.map(f).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'fr'));
  const sel=(k,lib,vals)=>'<select onchange="flSetFiltre(\''+k+'\',this.value)"><option value="">'+lib+'</option>'+vals.map(v=>'<option'+(flFiltre[k]===v?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select>';
  const fb=document.getElementById('fl-filtres');
  if(fb)fb.innerHTML=sel('sec','Tous les secteurs',uniq(d=>d.secteur||''))+sel('type','Tous les types',uniq(typeLib))+sel('an','Toutes les années',uniq(d=>String(d.date||'').slice(0,4)).reverse())
    +'<span class="bqsp"></span><button class="btn btn-ghost btn-sm" onclick="rafraichirBanque()" title="Relire la banque maintenant">🔄</button>';
  let h='';
  if(typeof banque!=='undefined'&&banque.erreur)h+='<div class="secempty" style="border-color:rgba(194,43,34,.4);color:#C22B22">⚠️ '+esc(banque.erreur)+'</div>';
  if(flFiltre.mois==='*'&&tous.length){flashsDuMois();return}         // demandé avant que la banque ait répondu
  if(!tous.length){box.innerHTML=h+'<div class="secempty">'+((typeof banque!=='undefined'&&banque.enCours)?'⏳ Chargement des flashs…':'Aucun flash dans la banque pour l’instant.')+'</div>';return}
  const iaActive=!!(flIA.q&&flIA.q===String(flFiltre.q||'').trim()&&(flIA.enCours||(flIA.mots||[]).length||flIA.err));
  let l, elargi=false, partiel=false;
  const net=(typeof bqNet==='function'?bqNet:x=>String(x).toLowerCase());
  const foinDe=d=>net([d.titre,d.fichier,d.mots,typeLib(d),d.secteur].join(' '));
  const cadre=tous.filter(d=>!(flFiltre.sec&&(d.secteur||'')!==flFiltre.sec)&&!(flFiltre.type&&typeLib(d)!==flFiltre.type)&&!(flFiltre.an&&String(d.date||'').slice(0,4)!==flFiltre.an));
  const iaPrete=iaActive&&!flIA.err&&!flIA.enCours;
  if(iaPrete)l=iaClasser(cadre,flIA.mots,foinDe);
  if(iaActive){
    h+='<div class="ia-band">✨ Recherche IA : « '+esc(flIA.q)+' »'+(flIA.enCours?' — <i>l’IA réfléchit… <span data-chrono="'+(flIA.debut||0)+'">0 s</span></i>':flIA.err?' — ⚠️ '+esc(flIA.err)+' <i>(résultats de la recherche simple ci-dessous)</i>':' → <b>'+flIA.mots.map(esc).join('</b>, <b>')+'</b> — '+l.length+' flash'+(l.length>1?'s':'')+(flIA.cache?' <span class="muted">(réponse mémorisée)</span>':flIA.duree?' <span class="muted">('+flIA.duree+' s)</span>':''))+' <button class="btn btn-ghost btn-sm" onclick="flFinIA()">✕ Effacer</button></div>';
  }
  if(iaPrete){
    /* l déjà classé */
  }else if(flFiltre.mois&&flFiltre.mois!=='*'){
    l=tous.filter(d=>String(d.date||'').slice(0,7)===flFiltre.mois).sort((a,b)=>String(a.titre||'').localeCompare(String(b.titre||''),'fr'));
    h+='<div class="ia-band fl-mois-band">⚡ Flashs de '+esc(qhpMoisLib(flFiltre.mois).toLowerCase())+' — '+l.length+' flash'+(l.length>1?'s':'')+' <button class="btn btn-ghost btn-sm" onclick="flFinMois()">✕ Voir tous les flashs</button></div>';
  }else{
    const mots=(typeof bqMots==='function')?bqMots(flFiltre.q):net(flFiltre.q).split(' ').filter(Boolean);
    const corr=(typeof bqCorrespond==='function')?bqCorrespond:(ms,f)=>ms.every(m=>f.indexOf(m)>=0)?1:0;
    l=cadre.map(d=>{
      if(!mots.length)return d;
      const c=corr(mots,foinDe(d));   // V3.9 : synonymes, racines, fautes d'une lettre ; V3.9.4 : mots creux ignorés
      if(!c)return null; if(c===2)elargi=true;
      return c===2?Object.assign({},d,{_elargi:true}):d;
    }).filter(Boolean).sort((a,b)=>((a._elargi?1:0)-(b._elargi?1:0))||String(b.date||'').localeCompare(String(a.date||'')));
    if(!l.length&&mots.length>1){partiel=true;   // aucun flash avec TOUS les mots → ceux qui en ont certains, les plus complets d'abord
      l=cadre.map(d=>{const f=foinDe(d),n=mots.filter(m=>corr([m],f)).length;return n?Object.assign({},d,{_n:n,_elargi:true}):null}).filter(Boolean).sort((a,b)=>b._n-a._n||String(b.date||'').localeCompare(String(a.date||'')))}
    if(partiel)h+='<p class="hint">🔎 Aucun flash ne contient tous ces mots : voici ceux qui en contiennent certains, les plus complets d’abord.</p>';
    else if(elargi&&typeof bqElargissements==='function'){const el=bqElargissements(mots);if(el)h+='<p class="hint">🔎 Recherche élargie : '+el+'</p>'}
  }
  h+='<p class="hint">'+l.length+' flash'+(l.length>1?'s':'')+(l.length!==tous.length?' sur '+tous.length:'')+'</p>';
  if(!l.length&&!iaPrete&&!flIA.enCours)h+='<div class="secempty">Aucun flash ne correspond. Essaie ✨ IA : elle comprend la question entière.</div>';
  if(!l.length&&iaPrete)h+='<div class="secempty">Aucun flash ne porte ces mots dans son titre.</div>';
  h+='<div class="fl-grid">'+l.map(d=>{const t=enrichissement(d),c=flCouleur(d);
    return '<div class="fl-card" style="--c:'+esc(c)+'" data-id="'+esc(String(d.id))+'" onclick="qhpOuvrirFlash(this.dataset.id)">'
      +(t&&t.image?flVigHtml(t.image):'<div class="fl-vig vide"><span>⚡</span></div>')
      +'<div class="fl-c"><div class="fl-band"><span>'+esc(typeLib(d))+'</span><span>'+esc(flDate(d))+'</span></div>'
      +'<div class="fl-t">'+esc(d.titre||d.fichier||'Flash')+'</div>'
      +(d._ia?'<div class="bqia">✨ '+esc(d._ia)+'</div>':'')
      +'<div class="fl-m">'+(d.secteur&&d.secteur!=='Général'?'<span class="fl-sec">'+esc(d.secteur)+'</span>':'')
      +(t&&t.video?'<span>🎬</span>':'')+(t&&(t.quiz||[]).length?'<span>❓ '+t.quiz.length+'</span>':'')+'</div></div></div>'}).join('')+'</div>';
  box.innerHTML=h;flChargerImages();
}
/* V3.9.2 : les vignettes de la liste ne sont demandées que quand la carte arrive à l'écran
   (150 flashs = 150 demandes d'un coup, sinon) ; la grande image d'un flash est servie en
   priorité (file vidée), et sa vignette, déjà connue, s'affiche en attendant. */
let flObs=null,flPrefetchTimer=null;
function flChargerImages(){
  if(typeof retexImg!=='function')return;
  const pose=(el,x)=>{if(x&&x.src){el.style.backgroundImage='url("'+x.src+'")';el.classList.add('pret');el.classList.remove('ko');el.innerHTML=''}
    else if(!(x&&x.err==='annulé')){el.classList.add('ko');el.title='Image indisponible'+(x&&x.err?' : '+x.err:'');
      if(el.classList.contains('fl-grande')){
        if(el.classList.contains('pret')){el.classList.remove('floue','ko');el.title='Grande image indisponible'+(x&&x.err?' : '+x.err:'')+' — la vignette est affichée'}   // la vignette, nette, fait l'affaire
        else el.innerHTML='<div class="fl-img-ko" onclick="event.stopPropagation();const p=this.parentNode;delete p.dataset.ok;p.classList.remove(\'ko\');this.remove();flChargerImages()">📷 Image indisponible'+(x&&x.err?'<br><small>'+esc(x.err)+'</small>':'')+'<br><span class="btn btn-ghost btn-sm" style="margin-top:8px">↻ Réessayer</span></div>'}}
    else delete el.dataset.ok};
  const charge=(el,bas)=>{el.dataset.ok='1';
    if(el.classList.contains('fl-grande')){
      retexImg(el.dataset.fim,'').then(x=>{if(x&&x.src){el.classList.remove('floue')}pose(el,x)});            // la grande d'abord : voie haute
      retexImg(el.dataset.fim,'petit').then(x=>{if(x&&x.src&&!el.classList.contains('pret')){el.style.backgroundImage='url("'+x.src+'")';el.classList.add('pret','floue')}});
    }else retexImg(el.dataset.fim,'petit',{bas:!!bas}).then(x=>pose(el,x));
  };
  const els=[...document.querySelectorAll('#v-qhp [data-fim]:not([data-ok])')].filter(el=>el.dataset.repli||!el.querySelector('img'));   // V3.10 : les <img> directes se débrouillent seules
  if(!('IntersectionObserver' in window)){els.forEach(charge);return}
  if(!flObs)flObs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){flObs.unobserve(e.target);if(!e.target.dataset.ok)charge(e.target)}}),{rootMargin:'300px'});
  els.forEach(el=>{if(el.classList.contains('fl-grande'))charge(el);else flObs.observe(el)});
  /* V3.9.3 : les cartes hors écran se préchargent en arrière-plan, par lots, 2 s après l'affichage
     (elles finissent dans le cache du navigateur : le défilement et les prochaines visites sont instantanés) */
  if(flPrefetchTimer)clearTimeout(flPrefetchTimer);
  flPrefetchTimer=setTimeout(()=>{document.querySelectorAll('#v-qhp .fl-vig[data-fim][data-repli]:not([data-ok])').forEach(el=>{if(flObs)flObs.unobserve(el);charge(el,true)})},2000);
}
function flAgrandir(id){
  const m=document.getElementById('m-rxphoto');if(!m)return;
  m._ids=[id];m._i=0;m._direct=flImgUrl(id,1600);m.classList.add('open');retexLbAff();
}
function qhpOuvrirFlash(id){if(typeof retexViderFile==='function')retexViderFile();qhpFlashOuvert=id;qhpThemeOuvert=null;qhpRep={};renderQhp();window.scrollTo(0,0)}
function qhpFermerFlash(){qhpFlashOuvert=null;qhpThemeOuvert=null;renderQhp();window.scrollTo(0,0)}
function quizHtml(quiz){
  let h='<div class="card qhp-sec qhp-quiz"><h3>❓ Le quiz'+(quiz.length?' <span class="apill">'+quiz.length+' question'+(quiz.length>1?'s':'')+'</span>':'')+'</h3>';
  if(!quiz.length)return h+'<p class="muted">Pas de quiz'+(estEditeur()?' — ✏️ puis « ✨ Proposer un quiz » : l’IA lit le flash et propose 3 questions.':' pour ce flash.')+'</p></div>';
  quiz.forEach((q,i)=>{
    const rep=qhpRep[i];
    h+='<div class="qq'+(rep===undefined?'':(rep===q.b?' bon':' faux'))+'"><div class="qq-q">'+(i+1)+'. '+esc(q.q||'')+'</div><div class="qq-r">'
      +(q.r||[]).map((r,j)=>'<button class="qq-b'+(rep===undefined?'':(j===q.b?' juste':(j===rep?' choisi':'')))+'" '+(rep===undefined?'onclick="qhpRepondre('+i+','+j+')"':'disabled')+'>'+esc(r)+'</button>').join('')
      +'</div>'+(rep!==undefined?'<div class="qq-e">'+(rep===q.b?'✅ Bonne réponse !':'❌ La bonne réponse : <b>'+esc((q.r||[])[q.b]||'')+'</b>')+(q.e?' — '+esc(q.e):'')+'</div>':'')+'</div>';
  });
  const n=Object.keys(qhpRep).length, bons=quiz.filter((q,i)=>qhpRep[i]===q.b).length;
  if(n>=quiz.length)h+='<div class="qq-score">Score : <b>'+bons+' / '+quiz.length+'</b> '+(bons===quiz.length?'🏆 Parfait !':(bons>=quiz.length/2?'🙂 Pas mal — relis le flash pour le reste.':'🙁 Revois le flash et retente !'))+' <button class="btn btn-ghost btn-sm" onclick="qhpRep={};renderQhp()">↻ Recommencer</button></div>';
  return h+'</div>';
}
/* V3.9 — La page d'un flash : l'IMAGE du flash au centre, en grand, cliquable (elle ouvre le
   PDF dans SharePoint) ; à sa droite, dans deux encadrés, 🎬 la vidéo (vignette YouTube, la
   vidéo se lance au clic) et ❓ le quiz. Un seul bouton ✍️ Émargement, en haut. */
function renderFlashPage(d,t){
  const box=document.getElementById('v-qhp'), c=flCouleur(d);
  const typeLib=(typeof BQ_TYPES!=='undefined'&&BQ_TYPES[d.type])?BQ_TYPES[d.type].lib:'Flash sécurité';
  const quiz=t&&Array.isArray(t.quiz)?t.quiz:[];
  const url=(d.url&&d.url!=='#')?d.url:'';
  const ouvrir=url?' onclick="window.open(this.dataset.u,\'_blank\',\'noopener\')" data-u="'+esc(url)+'" title="Ouvrir le flash (PDF)" role="link" tabindex="0"':'';
  let h='<div class="fl-top no-print"><button class="btn btn-ghost" onclick="qhpFermerFlash()">← Retour</button><span class="grow"></span>'+boutonEmargement('')
    +(estEditeur()?'<button class="btn btn-ghost no-print" onclick="qhpEditerFlash(\''+esc(d.id)+'\')">✏️ Image, vidéo, quiz</button>':'')+'</div>';
  h+='<div class="fl-head" style="--c:'+esc(c)+'"><div class="fl-head-k"><span>'+esc(typeLib)+'</span>'+(d.secteur?'<span>'+esc(d.secteur)+'</span>':'')+'<span>'+esc(flDate(d))+'</span>'+(t&&t.mois?'<span>🗓 thème de '+esc(qhpMoisLib(t.mois))+'</span>':'')+'</div>'
    +'<h2>'+esc(d.titre||d.fichier||'Flash')+'</h2>'+(t&&t.note?'<p>'+esc(t.note)+'</p>':'')+'</div>';
  const aSide=!!(t&&(t.video||quiz.length))||estEditeur();
  h+='<div class="fl-scene2'+(aSide?'':' seul')+'">';
  h+='<div class="fl-main">';
  if(t&&t.image){
    h+='<div class="fl-image fl-grande" data-fim="'+esc(t.image)+'"'+ouvrir+'><img src="'+esc(flImgUrl(t.image,1400))+'" alt="" onload="this.parentNode.classList.add(\'pret\',\'direct\')" onerror="flImgRepli(this)"></div>';
    h+='<div class="fl-main-b no-print">'+(url?'<span class="hint">Clique sur l’image pour ouvrir le flash (PDF)</span>':'')+'<span class="grow"></span>'
      +'<button class="btn btn-ghost btn-sm" data-id="'+esc(t.image)+'" onclick="flAgrandir(this.dataset.id)" title="Voir l’image en plein écran">🔍 Agrandir</button>'
      +(estEditeur()&&d.srcUrl?'<a class="btn btn-ghost btn-sm" href="'+esc(d.srcUrl)+'" target="_blank" rel="noopener">✏️ '+esc((d.srcExt||'PowerPoint').toUpperCase())+' ↗</a>':'')+'</div>';
  }else{
    h+='<div class="fl-poster" style="--c:'+esc(c)+'"'+ouvrir+'><div class="fl-poster-ico">⚡</div><div class="fl-poster-t">'+esc(d.titre||'Flash')+'</div>'
      +'<p>'+(url?'Clique pour ouvrir le flash dans SharePoint, avec ton compte Microsoft CDES.':'Lien du flash à renseigner.')+'</p>'
      +(estEditeur()?'<p class="hint">Pour afficher le flash ici : « 📤 Images des flashs » dans la liste (dépose les PDF), ou ✏️ ▸ image.</p>':'')+'</div>';
    if(estEditeur()&&d.srcUrl)h+='<div class="fl-main-b no-print"><span class="grow"></span><a class="btn btn-ghost btn-sm" href="'+esc(d.srcUrl)+'" target="_blank" rel="noopener">✏️ '+esc((d.srcExt||'PowerPoint').toUpperCase())+' ↗</a></div>';
  }
  h+='</div>';
  if(aSide){
    h+='<aside class="fl-side">';
    if(t&&t.video)h+='<div class="card fl-side-card fl-side-video"><h3>🎬 La vidéo</h3>'+qhpVideoVignette(t.video)+'</div>';
    else if(estEditeur())h+='<div class="card fl-side-card vide"><h3>🎬 La vidéo</h3><p class="muted">Pas de vidéo — ✏️ pour coller un lien YouTube, Vimeo, Stream…</p></div>';
    if(quiz.length||estEditeur())h+=quizHtml(quiz).replace('class="card qhp-sec qhp-quiz"','class="card fl-side-card qhp-quiz'+(quiz.length?'':' vide')+'"');
    h+='</aside>';
  }
  h+='</div>';
  box.innerHTML=h;flChargerImages();
}
function qhpOuvrir(id){qhpThemeOuvert=id;qhpRep={};renderQhp();window.scrollTo(0,0)}
function qhpFermer(){qhpThemeOuvert=null;renderQhp();window.scrollTo(0,0)}
function renderQhpTheme(){
  const box=document.getElementById('v-qhp'), t=qhpThemes().find(x=>x.id===qhpThemeOuvert);
  if(!t){qhpThemeOuvert=null;renderQhp();return}
  const quiz=Array.isArray(t.quiz)?t.quiz:[];
  let h='<div class="row no-print" style="margin-bottom:10px;align-items:center;gap:8px"><button class="btn btn-ghost" onclick="qhpFermer()">← Tous les thèmes</button>'+boutonEmargement('')+(estEditeur()?'<button class="btn btn-ghost no-print" onclick="qhpEditer(\''+esc(t.id)+'\')">✏️ Modifier</button>':'')+'</div>';
  h+='<div class="qhp-head"><div class="qhp-mois">'+esc(qhpMoisLib(t.mois)||'')+'</div><h2>'+esc(t.titre||'')+'</h2>'+(t.note?'<p>'+esc(t.note)+'</p>':'')+'</div>';
  h+='<div class="qhp-sections">';
  h+='<div class="card qhp-sec"><h3>🎬 La vidéo</h3>'+(t.video?qhpVideoHtml(t.video):'<p class="muted">Pas de vidéo pour ce thème.</p>')+'</div>';
  h+='<div class="card qhp-sec"><h3>⚡ Le flash</h3>'+(t.image?'<div class="fl-image" data-fim="'+esc(t.image)+'" onclick="retexLightbox(['+esc(JSON.stringify(t.image))+'],0)"></div>':'')+(t.flash?(/\.pdf(\?|$)/i.test(t.flash)?'<div class="qhp-pdf"><iframe src="'+esc(t.flash)+'" title="Flash" loading="lazy"></iframe></div>':'')+'<a class="btn btn-primary" href="'+esc(t.flash)+'" target="_blank" rel="noopener">⚡ Ouvrir le flash</a>':'<p class="muted">Pas de flash associé.</p>')+'</div>';
  h+=quizHtml(quiz);
  h+='</div>';
  h+='<div class="qhp-foot no-print"><p>Le QHP est fait ? </p>'+boutonEmargement('')+'</div>';
  box.innerHTML=h;flChargerImages();
}
function qhpRepondre(i,j){qhpRep[i]=j;renderQhp();const el=document.querySelectorAll('#v-qhp .qq')[i];if(el)el.scrollIntoView({block:'nearest'})}

/* ---------- édition (éditeur) ---------- */
let qhpEnCours=null;
function quizVersTexte(quiz){return (quiz||[]).map(q=>'Q: '+(q.q||'')+'\n'+(q.r||[]).map((r,j)=>'- '+(j===q.b?'*':'')+r).join('\n')+(q.e?'\nE: '+q.e:'')).join('\n\n')}
function texteVersQuiz(txt){
  const out=[];let cur=null;
  String(txt||'').split(/\r?\n/).forEach(l=>{
    const s=l.trim();if(!s)return;
    if(/^q\s*[:.]/i.test(s)){if(cur&&cur.q)out.push(cur);cur={q:s.replace(/^q\s*[:.]\s*/i,''),r:[],b:0,e:''};return}
    if(!cur)return;
    if(/^[-•*]\s*/.test(s)){let r=s.replace(/^[-•]\s*/,'');let bon=false;if(/^\*/.test(r)){bon=true;r=r.replace(/^\*\s*/,'')}cur.r.push(r);if(bon)cur.b=cur.r.length-1;return}
    if(/^e\s*[:.]/i.test(s)){cur.e=s.replace(/^e\s*[:.]\s*/i,'');return}
    cur.q+=' '+s;
  });
  if(cur&&cur.q)out.push(cur);
  return out.filter(q=>q.r.length>=2);
}
function qhpEditer(id){
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  const t=id?qhpThemes().find(x=>x.id===id):null;qhpEnCours=t?t.id:null;
  const d=new Date();
  document.getElementById('mq-titre-h').textContent=t?'Modifier le thème':'Nouveau thème QHP';
  document.getElementById('mq-titre').value=t?t.titre||'':'';
  document.getElementById('mq-mois').value=t?(t.mois||''):d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  document.getElementById('mq-video').value=t?t.video||'':'';
  document.getElementById('mq-flash').value=t?t.flash||'':'';
  document.getElementById('mq-note').value=t?t.note||'':'';
  document.getElementById('mq-quiz').value=t?quizVersTexte(t.quiz):'';
  document.getElementById('mq-actif').checked=t?t.actif!==false:true;
  document.getElementById('mq-del').style.display=t?'':'none';
  document.getElementById('mq-banque').value=t?(t.banque||''):'';
  qhpImage={id:t?(t.image||''):'',nouvelle:null};qhpImageRendu();
  document.getElementById('m-qtheme').classList.add('open');
}
/* V3.5 : enrichir un flash de la banque (vidéo, quiz, image) — crée ou reprend son thème */
function qhpEditerFlash(docId){
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  const d=flashParId(docId);if(!d)return;
  const t=enrichissement(d);
  if(t){qhpEditer(t.id);if(!t.banque)document.getElementById('mq-banque').value=String(d.id);return}
  qhpEditer();
  document.getElementById('mq-titre-h').textContent='Flash : image, vidéo, quiz';
  document.getElementById('mq-titre').value=d.titre||'';
  document.getElementById('mq-mois').value='';
  document.getElementById('mq-flash').value=d.url||'';
  document.getElementById('mq-banque').value=String(d.id);
}
let qhpImage={id:'',nouvelle:null};
function qhpImageRendu(){
  const ap=document.getElementById('mq-image-ap'),del=document.getElementById('mq-image-del');if(!ap)return;
  ap.className='mq-image-ap';ap.style.backgroundImage='';ap.removeAttribute('data-fim');ap.removeAttribute('data-ok');
  if(qhpImage.nouvelle){ap.style.backgroundImage='url("'+qhpImage.nouvelle.src+'")';ap.classList.add('pret')}
  else if(qhpImage.id&&typeof retexImg==='function'){retexImg(qhpImage.id,'petit').then(x=>{if(x&&x.src){ap.style.backgroundImage='url("'+x.src+'")';ap.classList.add('pret')}})}
  else ap.classList.add('vide');
  if(del)del.style.display=(qhpImage.nouvelle||qhpImage.id)?'':'none';
}
async function qhpChoisirImage(inp){
  const f=inp.files&&inp.files[0];inp.value='';if(!f)return;
  try{qhpImage.nouvelle=await retexReduire(f);qhpImageRendu()}catch(e){toast('Image illisible',true)}
}
function qhpRetirerImage(){qhpImage={id:'',nouvelle:null};qhpImageRendu()}
async function qhpEnregistrer(){
  const g=k=>document.getElementById(k).value.trim();
  const titre=g('mq-titre');if(!titre){toast('Donne un titre au thème',true);return}
  const quiz=texteVersQuiz(g('mq-quiz'));
  if(g('mq-quiz')&&!quiz.length){toast('Quiz : il faut au moins une question « Q: » avec deux réponses « - »',true);return}
  let image=qhpImage.id||'';
  if(qhpImage.nouvelle){
    try{toast('📤 Envoi de l’image du flash…');
      const r=await appelRetente({secret:conf.secret,action:'flash-image',appareil:conf.appareil||'éditeur',data:{nom:qhpImage.nouvelle.nom,mime:qhpImage.nouvelle.mime,b64:qhpImage.nouvelle.b64}},90000);
      if(!r||!r.ok||!r.id)throw new Error((r&&r.erreur)||'image refusée');image=r.id}
    catch(e){toast('Image non envoyée : '+(e.message||'?'),true);return}
  }
  const banqueId=g('mq-banque');
  const ancien=qhpEnCours?qhpThemes().find(x=>x.id===qhpEnCours):null;
  const o={id:qhpEnCours||('qt'+Date.now().toString(36)),maj:nowISO(),titre,mois:g('mq-mois'),video:g('mq-video'),flash:g('mq-flash'),note:g('mq-note'),quiz,actif:document.getElementById('mq-actif').checked,banque:banqueId,image:image,fichier:banqueId?'':((ancien&&ancien.fichier)||'')};
  state.qhpThemes=(state.qhpThemes||[]).filter(x=>x.id!==o.id).concat([o]);
  save();closeModal();qhpRep={};
  if(banqueId){qhpFlashOuvert=banqueId;qhpThemeOuvert=null}else qhpThemeOuvert=o.id;
  renderQhp();toast('Enregistré ✓ (synchro en cours)');
  if(typeof syncAuto==='function')syncAuto();
}
function qhpSupprimer(){
  if(!qhpEnCours)return;const t=qhpThemes().find(x=>x.id===qhpEnCours);
  if(!confirm('Retirer le thème « '+(t?t.titre:'')+' » de l’espace QHP ?'))return;
  state.tombQhpThemes=state.tombQhpThemes||{};state.tombQhpThemes[qhpEnCours]=nowISO();
  state.qhpThemes=(state.qhpThemes||[]).filter(x=>x.id!==qhpEnCours);
  save();closeModal();qhpThemeOuvert=null;renderQhp();toast('Thème retiré');
  if(typeof syncAuto==='function')syncAuto();
}
function qhpThemesPayload(){
  const tombes=Object.keys(state.tombQhpThemes||{}).map(id=>({id,maj:state.tombQhpThemes[id],supprime:true}));
  return (state.qhpThemes||[]).map(t=>Object.assign({},t,{maj:t.maj||EPOCH})).concat(tombes);
}

/* ==================== V3.9 — ✨ PROPOSER UN QUIZ (éditeur) ====================
   L'IA lit l'IMAGE du flash (celle rangée dans « Flashs images ») et propose trois
   questions techniques, écrites dans la case du quiz au format Q: / - / * / E:.
   Rien n'est enregistré avant « Enregistrer » : le service HSE relit et corrige. */
/* V3.11 : retirer le quiz d'un flash — la case est vidée, le quiz disparaît à l'enregistrement */
function qhpEffacerQuiz(){const z=document.getElementById('mq-quiz');if(!z)return;if(z.value.trim()&&!confirm('Retirer le quiz de ce flash ?'))return;z.value='';z.focus();toast('Quiz retiré — clique sur Enregistrer pour confirmer')}
async function qhpProposerQuiz(){
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  const btn=document.getElementById('mq-ia');
  if(!qhpImage.id&&!qhpImage.nouvelle){toast('Ajoute d’abord l’image du flash (📤) : l’IA lit l’image',true);return}
  const zone=document.getElementById('mq-quiz');
  if(zone.value.trim()&&!confirm('Remplacer le quiz déjà écrit par la proposition de l’IA ?'))return;
  if(btn){btn.disabled=true;btn.textContent='✨ L’IA lit le flash…'}
  try{
    if(qhpImage.nouvelle){
      toast('📤 Envoi de l’image du flash…');
      const r=await appelRetente({secret:conf.secret,action:'flash-image',appareil:conf.appareil||'éditeur',data:{nom:qhpImage.nouvelle.nom,mime:qhpImage.nouvelle.mime,b64:qhpImage.nouvelle.b64}},90000);
      if(!r||!r.ok||!r.id)throw new Error((r&&r.erreur)||'image refusée');
      qhpImage={id:r.id,nouvelle:null};qhpImageRendu();
    }
    const t0=Date.now();
    const r=await appelRetente({secret:conf.secret,action:'flash-quiz',appareil:conf.appareil||'éditeur',data:{image:qhpImage.id,titre:(document.getElementById('mq-titre')||{}).value||''}},90000);
    if(!r||!r.ok||!r.texte)throw new Error((r&&r.erreur)||'pas de proposition');
    zone.value=r.texte;zone.focus();
    toast('✨ '+(r.quiz||[]).length+' questions proposées en '+Math.round((Date.now()-t0)/1000)+' s — relis, corrige, puis Enregistre');
  }catch(e){toast('Quiz IA : '+(e.message||'?'),true)}
  finally{if(btn){btn.disabled=false;btn.textContent='✨ Proposer un quiz'}}
}

/* ==================== V3.9 — 📤 IMAGES DES FLASHS, PAR LOT (éditeur) ====================
   Le service HSE dépose d'un coup les PDF des flashs (le dossier SharePoint synchronisé
   dans l'explorateur) : la PREMIÈRE PAGE de chaque PDF est dessinée dans la page (pdf.js,
   embarqué dans js/lib — jamais de CDN), réduite en JPEG, rattachée au flash de la banque
   qui porte le même nom de fichier, puis envoyée dans « Flashs images ». Les flashs qui ont
   déjà une image sont passés, sauf si on coche « remplacer ». Des PNG / JPG déjà exportés
   de PowerPoint sont acceptés aussi. */
let flLot={fichiers:[],enCours:false};
function flNomNet(n){return (typeof bqNet==='function'?bqNet:x=>String(x).toLowerCase())(String(n||'').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' '))}
function flReconnaitre(nom){
  const n=flNomNet(nom);if(!n)return null;const tous=banqueFlashs();
  let d=tous.find(x=>flNomNet(x.fichier)===n)||tous.find(x=>flNomNet(x.titre)===n);
  if(d)return d;
  if(n.length>=8){d=tous.find(x=>{const f=flNomNet(x.fichier),t=flNomNet(x.titre);return (f&&f.length>=8&&(f.indexOf(n)>=0||n.indexOf(f)>=0))||(t&&t.length>=8&&(t.indexOf(n)>=0||n.indexOf(t)>=0))});if(d)return d}
  return null;
}
function flLotOuvrir(){
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  flLot={fichiers:[],enCours:false};flLotRendu();
  document.getElementById('m-flot').classList.add('open');
}
function flLotRendu(){
  const box=document.getElementById('flot-liste'),btn=document.getElementById('flot-go');if(!box)return;
  const tous=banqueFlashs();
  if(!flLot.fichiers.length){box.innerHTML='<p class="muted small">Aucun fichier pour l’instant.</p>';if(btn)btn.disabled=true;return}
  const opts=tous.slice().sort((a,b)=>String(a.titre||a.fichier||'').localeCompare(String(b.titre||b.fichier||''),'fr'));
  box.innerHTML='<table class="tbl flot-tbl"><thead><tr><th>Fichier déposé</th><th>Flash de la banque</th><th>État</th></tr></thead><tbody>'+flLot.fichiers.map((f,i)=>{
    const d=f.docId?tous.find(x=>x.id===f.docId):null, t=d?enrichissement(d):null;
    const etat=f.etat||(d?(t&&t.image?'⚠️ a déjà une image':'✓ prêt'):f.docId==='*attente*'?'🕓 gardée pour le flash à venir':'❓ non reconnu — choisis le flash, ou « en attente »');
    return '<tr><td><div class="flot-apercu"'+(f.src?' style="background-image:url(\''+f.src+'\')"':'')+'></div><span>'+esc(f.nom)+'</span></td>'
      +'<td><select onchange="flLotChoisir('+i+',this.value)"><option value="">— aucun —</option><option value="*attente*"'+(f.docId==='*attente*'?' selected':'')+'>🕓 En attente : le flash arrivera dans la banque (même nom de fichier)</option>'+opts.map(o=>'<option value="'+esc(String(o.id))+'"'+(String(o.id)===String(f.docId)?' selected':'')+'>'+esc(o.titre||o.fichier)+'</option>').join('')+'</select></td>'
      +'<td class="small">'+esc(etat)+'</td></tr>'}).join('')+'</tbody></table>';
  if(btn){const n=flLot.fichiers.filter(f=>f.docId&&f.src&&!f.fait).length;btn.disabled=!n||flLot.enCours;btn.textContent=flLot.enCours?'⏳ Envoi en cours…':'📤 Envoyer '+n+' image'+(n>1?'s':'')}
}
function flLotChoisir(i,id){const f=flLot.fichiers[i];if(!f)return;f.docId=id||'';f.etat='';flLotRendu()}
async function flLotFichiers(inp){
  /* V3.9 : un dossier entier (sous-dossiers compris) ou des fichiers ; seuls les PDF / images comptent */
  const fs=[...(inp.files||[])].filter(f=>/\.(pdf|png|jpe?g|webp)$/i.test(f.name)&&!/^[.~$]/.test(f.name)).slice(0,400);inp.value='';
  if(!fs.length){toast('Aucun PDF ni image dans ce choix',true);return}
  toast(fs.length+' fichier'+(fs.length>1?'s':'')+' à lire…');
  for(const f of fs){
    const e={nom:f.name,docId:'',src:'',b64:'',mime:'image/jpeg',etat:'⏳ lecture…'};flLot.fichiers.push(e);flLotRendu();
    try{
      const img=/\.pdf$/i.test(f.name)?await flPdfPremierePage(f):await retexReduire(f);
      e.src=img.src;e.b64=img.b64;e.mime=img.mime;const d=flReconnaitre(f.name);e.docId=d?String(d.id):'*attente*';e.etat='';   // V3.9.4 : un PDF que la banque ne connaît pas encore est gardé « en attente »
    }catch(err){e.etat='❌ '+(err.message||'illisible')}
    flLotRendu();
  }
}
/* pdf.js (embarqué) : la première page du PDF dessinée dans un canvas, puis JPEG ≤ 1600 px */
let pdfjsPret=null;
function chargerPdfjs(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  if(pdfjsPret)return pdfjsPret;
  pdfjsPret=new Promise((ok,ko)=>{const sc=document.createElement('script');sc.src='js/lib/pdf.min.js?v='+encodeURIComponent(typeof APP_VERSION!=='undefined'?APP_VERSION:'1');
    sc.onload=()=>{try{window.pdfjsLib.GlobalWorkerOptions.workerSrc='js/lib/pdf.worker.min.js';ok(window.pdfjsLib)}catch(e){ko(e)}};sc.onerror=()=>ko(new Error('pdf.js introuvable (js/lib)'));document.head.appendChild(sc)});
  return pdfjsPret;
}
async function flPdfPremierePage(fichier){
  const lib=await chargerPdfjs();
  const buf=await fichier.arrayBuffer();
  const pdf=await lib.getDocument({data:buf,isEvalSupported:false,disableFontFace:false}).promise;
  const page=await pdf.getPage(1);
  const v1=page.getViewport({scale:1}),k=Math.min(3,1400/Math.max(v1.width,v1.height)),vp=page.getViewport({scale:k});   // V3.9.1 : 1 400 px suffisent à l'écran, l'envoi est deux fois plus léger
  const c=document.createElement('canvas');c.width=Math.round(vp.width);c.height=Math.round(vp.height);
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  await page.render({canvasContext:x,viewport:vp}).promise;
  try{pdf.destroy()}catch(e){}
  const src=c.toDataURL('image/jpeg',.78);
  return {src,b64:src.split(',')[1],mime:'image/jpeg',nom:(fichier.name||'flash').replace(/\.[^.]+$/,'')+'.jpg'};
}
async function flLotEnvoyer(){
  if(flLot.enCours)return;
  const remplacer=!!(document.getElementById('flot-remplacer')||{}).checked;
  const todo=flLot.fichiers.filter(f=>f.docId&&f.src&&!f.fait);
  if(!todo.length)return;
  flLot.enCours=true;flLotRendu();
  let n=0,passes=0,k=0;
  /* V3.9.1 : trois images partent en même temps (au lieu d'une), et une erreur passagère de
     Google (« Page introuvable ») est réessayée deux fois avant d'être affichée en ❌ */
  const uneImage=async f=>{
    const d=f.docId==='*attente*'?null:flashParId(f.docId);
    if(!d&&f.docId!=='*attente*'){f.etat='❌ flash inconnu';return}
    const t=d?enrichissement(d):(qhpThemes().find(x=>!x.banque&&x.fichier&&flNomNet(x.fichier)===flNomNet(f.nom))||null);
    if(t&&t.image&&!remplacer){f.etat='↷ passé (a déjà une image)';f.fait=true;passes++;flLotRendu();return}
    f.etat='⏳ envoi…';flLotRendu();
    try{
      const r=await appelRetente({secret:conf.secret,action:'flash-image',appareil:conf.appareil||'éditeur',data:{nom:f.nom.replace(/\.[^.]+$/,'')+'.jpg',mime:f.mime,b64:f.b64}},90000,2);
      if(!r||!r.ok||!r.id)throw new Error((r&&r.erreur)||'image refusée');
      const o=Object.assign({},t||{id:'qt'+Date.now().toString(36)+(k++),titre:d?(d.titre||d.fichier||'Flash'):f.nom.replace(/\.[^.]+$/,''),mois:'',video:'',note:'',quiz:[],actif:true},
        {maj:nowISO(),banque:d?String(d.id):'',flash:(t&&t.flash)||(d&&d.url)||'',image:r.id,fichier:d?'':f.nom});
      if(!o.titre)o.titre=d?(d.titre||d.fichier||'Flash'):f.nom;
      state.qhpThemes=(state.qhpThemes||[]).filter(x=>x.id!==o.id).concat([o]);save();
      f.etat='✅ envoyée';f.fait=true;n++;
    }catch(e){f.etat='❌ '+(e.message||'?')+' — relance « Envoyer » pour réessayer'}
    flLotRendu();
  };
  const file=todo.slice();
  const ouvrier=async()=>{while(file.length){await uneImage(file.shift())}};
  await Promise.all([ouvrier(),ouvrier(),ouvrier()]);
  flLot.enCours=false;flLotRendu();
  toast(n+' image'+(n>1?'s':'')+' envoyée'+(n>1?'s':'')+(passes?', '+passes+' passée'+(passes>1?'s':''):'')+' (synchro en cours)');
  if(n&&typeof syncAuto==='function')syncAuto();
  renderQhp();
}
