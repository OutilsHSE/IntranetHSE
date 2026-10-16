/* ============================================================================
 *  INTRANET HSE — ESPACE QHP  (V3.3 · paquet 3 · 12/10/2026)
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
function qhpVideoHtml(u){
  u=String(u||'').trim(); if(!u)return '';
  let m=/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(u);
  if(m)return '<div class="qhp-vid"><iframe src="https://www.youtube.com/embed/'+esc(m[1])+'" title="Vidéo du QHP" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>';
  m=/vimeo\.com\/(\d+)/.exec(u);
  if(m)return '<div class="qhp-vid"><iframe src="https://player.vimeo.com/video/'+esc(m[1])+'" title="Vidéo du QHP" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
  if(/\.(mp4|webm|m4v)(\?|$)/i.test(u))return '<div class="qhp-vid"><video controls preload="metadata" src="'+esc(u)+'"></video></div>';
  return '<a class="btn btn-primary" href="'+esc(u)+'" target="_blank" rel="noopener">🎬 Ouvrir la vidéo</a><p class="hint">Vidéo hébergée ailleurs (SharePoint, Stream…) : elle s’ouvre dans un nouvel onglet.</p>';
}
/* ==================== V3.5 — TOUS LES FLASHS (bibliothèque) ====================
   L'Espace QHP a deux onglets : 🗓 les thèmes du mois (comme avant) et 📚 tous les
   flashs de la banque documentaire (SharePoint). Chaque flash a sa page : l'IMAGE du
   flash au centre (export PNG envoyé par le service HSE), la vidéo, le quiz, le
   bouton d'émargement. La vidéo, le quiz et l'image sont rangés dans un « thème »
   (onglet QHP_THEMES) qui porte l'identifiant du flash (colonne banque). */
let qhpOnglet=(function(){try{return localStorage.getItem('ihse_qhp_onglet')||'themes'}catch(e){return 'themes'}})();
let qhpFlashOuvert=null;
let flFiltre={q:'',sec:'',type:'',an:'',mois:''}, flIA={q:'',ids:[],pq:{},enCours:false,err:''};
function setQhpOnglet(o){qhpOnglet=o==='flashs'?'flashs':'themes';try{localStorage.setItem('ihse_qhp_onglet',qhpOnglet)}catch(e){}qhpFlashOuvert=null;qhpThemeOuvert=null;renderQhp()}
function qhpVoirFlashs(){qhpOnglet='flashs';qhpFlashOuvert=null;qhpThemeOuvert=null;go('v-qhp')}
function banqueFlashs(){return (typeof banqueData==='function'?banqueData():[]).filter(d=>d.famille==='flash')}
function enrichissement(d){const l=qhpThemes();return l.find(t=>t.banque&&t.banque===d.id)||l.find(t=>t.flash&&d.url&&t.flash===d.url)||null}
function flCouleur(d){return (typeof bqCouleur==='function')?bqCouleur(d):'#1F6FB2'}
function flDate(d){return (typeof bqDate==='function')?bqDate(d.date):String(d.date||'')}
function renderQhp(){
  const box=document.getElementById('v-qhp');if(!box)return;
  if(qhpThemeOuvert){
    const t=qhpThemes().find(x=>x.id===qhpThemeOuvert);
    const d=t&&t.banque?banqueFlashs().find(x=>x.id===t.banque):null;
    if(d){renderFlashPage(d,t);return}
    renderQhpTheme();return;
  }
  if(qhpFlashOuvert){const d=banqueFlashs().find(x=>x.id===qhpFlashOuvert);if(d){renderFlashPage(d,enrichissement(d));return}qhpFlashOuvert=null}
  const nbFl=banqueFlashs().length;
  let h='<div class="arr-head"><div><h2>🎓 Espace QHP</h2><p class="small muted" style="margin:2px 0 0">Les quarts d’heure prévention : le flash, la vidéo, le quiz — et l’émargement à portée de main.</p></div>'
    +'<div class="arr-kpis"><button class="btn btn-primary btn-sm no-print" onclick="flashsDuMois()" title="Ouvrir les derniers flashs parus">⚡ Flashs du mois</button>'+boutonEmargement('btn-sm')+(estEditeur()&&qhpOnglet==='themes'?'<button class="btn btn-primary btn-sm no-print" onclick="qhpEditer()">＋ Nouveau thème</button>':'')+'</div></div>';
  h+='<div class="seg qhp-ong no-print"><button class="'+(qhpOnglet==='themes'?'on':'')+'" onclick="setQhpOnglet(\'themes\')">🗓 Thèmes du mois</button><button class="'+(qhpOnglet==='flashs'?'on':'')+'" onclick="setQhpOnglet(\'flashs\')">📚 Tous les flashs'+(nbFl?' <span class="apill">'+nbFl+'</span>':'')+'</button></div>';
  if(qhpOnglet==='flashs'){
    if(typeof banque!=='undefined'&&!banque.charge&&!banque.enCours&&typeof chargerBanque==='function')setTimeout(()=>chargerBanque(false),0);
    h+='<div class="ia-recherche"><input type="text" id="fl-q" class="bqsearch" value="'+esc(flFiltre.q)+'" placeholder="🔎 Rechercher un flash… chute à l’eau, levage, chaleur — ou pose une question" oninput="flSaisie(this.value)" onkeydown="if(event.key===\'Enter\')flLancerIA()">'
      +'<button class="btn btn-accent ia-btn" onclick="flLancerIA()" title="L’IA comprend la question et les synonymes du métier">✨ IA</button></div>'
      +'<div class="bqbar no-print" id="fl-filtres"></div><div id="fl-liste"></div>';
    box.innerHTML=h;renderFlashListe();return;
  }
  const l=qhpThemes().filter(t=>(t.actif||estEditeur())&&(!t.banque||t.mois));
  if(!l.length)h+='<div class="secempty">Aucun thème pour l’instant.'+(estEditeur()?' Clique sur « ＋ Nouveau thème », ou ouvre un flash dans « Tous les flashs » et donne-lui un mois.':' Le service HSE les ajoute au fil des mois.')+'</div>';
  else h+='<div class="qhp-grid">'+l.map(t=>'<div class="qhp-card'+(t.actif?'':' off')+'" onclick="qhpOuvrir(\''+esc(t.id)+'\')">'
    +'<div class="qhp-mois">'+esc(qhpMoisLib(t.mois)||'—')+(t.actif?'':' · <i>masqué</i>')+'</div><div class="qhp-titre">'+esc(t.titre||'Sans titre')+'</div>'
    +'<div class="qhp-badges">'+(t.video?'<span>🎬 vidéo</span>':'')+(t.flash||t.image?'<span>⚡ flash</span>':'')+((t.quiz||[]).length?'<span>❓ quiz · '+t.quiz.length+'</span>':'')+'</div></div>').join('')+'</div>';
  box.innerHTML=h;
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
  qhpThemeOuvert=null;qhpFlashOuvert=null;flIA={q:'',ids:[],pq:{},enCours:false,err:''};
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
  flIA={q:q,ids:[],pq:{},enCours:true,err:''};renderFlashListe();
  try{const r=await rechercheIA(q,banqueFlashs());flIA.ids=r.ids||[];flIA.pq=r.pourquoi||{}}
  catch(e){flIA.err=e.message||'erreur'}
  finally{flIA.enCours=false;renderFlashListe()}
}
function flFinIA(){flIA={q:'',ids:[],pq:{},enCours:false,err:''};renderFlashListe()}
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
  const iaActive=flIA.q&&flIA.q===String(flFiltre.q||'').trim()&&(flIA.enCours||flIA.ids.length||flIA.err);
  let l;
  if(iaActive){
    h+='<div class="ia-band">✨ Recherche IA : « '+esc(flIA.q)+' »'+(flIA.enCours?' — <i>recherche en cours…</i>':flIA.err?' — ⚠️ '+esc(flIA.err):' — '+flIA.ids.length+' flash'+(flIA.ids.length>1?'s':''))+' <button class="btn btn-ghost btn-sm" onclick="flFinIA()">✕ Revenir à la recherche simple</button></div>';
    l=flIA.ids.map(id=>tous.find(d=>d.id===id)).filter(Boolean);
  }else if(flFiltre.mois&&flFiltre.mois!=='*'){
    l=tous.filter(d=>String(d.date||'').slice(0,7)===flFiltre.mois).sort((a,b)=>String(a.titre||'').localeCompare(String(b.titre||''),'fr'));
    h+='<div class="ia-band fl-mois-band">⚡ Flashs de '+esc(qhpMoisLib(flFiltre.mois).toLowerCase())+' — '+l.length+' flash'+(l.length>1?'s':'')+' <button class="btn btn-ghost btn-sm" onclick="flFinMois()">✕ Voir tous les flashs</button></div>';
  }else{
    const mots=(typeof bqNet==='function'?bqNet(flFiltre.q):String(flFiltre.q||'').toLowerCase()).split(' ').filter(Boolean);
    l=tous.filter(d=>{
      if(flFiltre.sec&&(d.secteur||'')!==flFiltre.sec)return false;
      if(flFiltre.type&&typeLib(d)!==flFiltre.type)return false;
      if(flFiltre.an&&String(d.date||'').slice(0,4)!==flFiltre.an)return false;
      if(!mots.length)return true;
      const foin=(typeof bqNet==='function'?bqNet:x=>String(x).toLowerCase())([d.titre,d.fichier,d.mots,typeLib(d),d.secteur].join(' '));
      return mots.every(m=>foin.indexOf(m)>=0);
    }).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  }
  h+='<p class="hint">'+l.length+' flash'+(l.length>1?'s':'')+(l.length!==tous.length?' sur '+tous.length:'')+'</p>';
  if(!l.length&&!iaActive)h+='<div class="secempty">Aucun flash ne correspond. Essaie ✨ IA : elle comprend les synonymes.</div>';
  h+='<div class="fl-grid">'+l.map(d=>{const t=enrichissement(d),c=flCouleur(d);
    return '<div class="fl-card" style="--c:'+esc(c)+'" onclick="qhpOuvrirFlash(\''+esc(d.id)+'\')">'
      +(t&&t.image?'<div class="fl-vig" data-fim="'+esc(t.image)+'"></div>':'<div class="fl-vig vide"><span>⚡</span></div>')
      +'<div class="fl-c"><div class="fl-band"><span>'+esc(typeLib(d))+'</span><span>'+esc(flDate(d))+'</span></div>'
      +'<div class="fl-t">'+esc(d.titre||d.fichier||'Flash')+'</div>'
      +(iaActive&&flIA.pq[d.id]?'<div class="bqia">✨ '+esc(flIA.pq[d.id])+'</div>':'')
      +'<div class="fl-m">'+(d.secteur&&d.secteur!=='Général'?'<span class="fl-sec">'+esc(d.secteur)+'</span>':'')
      +(t&&t.video?'<span>🎬</span>':'')+(t&&(t.quiz||[]).length?'<span>❓ '+t.quiz.length+'</span>':'')+'</div></div></div>'}).join('')+'</div>';
  box.innerHTML=h;flChargerImages();
}
function flChargerImages(){
  if(typeof retexImg!=='function')return;
  document.querySelectorAll('#v-qhp [data-fim]:not([data-ok])').forEach(el=>{el.dataset.ok='1';
    retexImg(el.dataset.fim,el.classList.contains('fl-grande')?'':'petit').then(x=>{if(x&&x.src){el.style.backgroundImage='url("'+x.src+'")';el.classList.add('pret')}else{el.classList.add('ko');el.title='Image indisponible'+(x&&x.err?' : '+x.err:'')}})});
}
function qhpOuvrirFlash(id){qhpFlashOuvert=id;qhpThemeOuvert=null;qhpRep={};renderQhp();window.scrollTo(0,0)}
function qhpFermerFlash(){qhpFlashOuvert=null;qhpThemeOuvert=null;renderQhp();window.scrollTo(0,0)}
function quizHtml(quiz){
  let h='<div class="card qhp-sec qhp-quiz"><h3>❓ Le quiz'+(quiz.length?' <span class="apill">'+quiz.length+' question'+(quiz.length>1?'s':'')+'</span>':'')+'</h3>';
  if(!quiz.length)return h+'<p class="muted">Pas de quiz'+(estEditeur()?' — ✏️ en haut de la page pour en écrire un.':' pour ce flash.')+'</p></div>';
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
/* La page d'un flash : l'image au centre, puis la vidéo et le quiz */
function renderFlashPage(d,t){
  const box=document.getElementById('v-qhp'), c=flCouleur(d);
  const typeLib=(typeof BQ_TYPES!=='undefined'&&BQ_TYPES[d.type])?BQ_TYPES[d.type].lib:'Flash sécurité';
  const quiz=t&&Array.isArray(t.quiz)?t.quiz:[];
  let h='<div class="row no-print" style="margin-bottom:10px;align-items:center;gap:8px"><button class="btn btn-ghost" onclick="qhpFermerFlash()">← Retour</button>'+boutonEmargement('')
    +(estEditeur()?'<button class="btn btn-ghost no-print" onclick="qhpEditerFlash(\''+esc(d.id)+'\')">✏️ Image, vidéo, quiz</button>':'')+'</div>';
  h+='<div class="fl-head" style="--c:'+esc(c)+'"><div class="fl-head-k"><span>'+esc(typeLib)+'</span>'+(d.secteur?'<span>'+esc(d.secteur)+'</span>':'')+'<span>'+esc(flDate(d))+'</span>'+(t&&t.mois?'<span>🗓 thème de '+esc(qhpMoisLib(t.mois))+'</span>':'')+'</div>'
    +'<h2>'+esc(d.titre||d.fichier||'Flash')+'</h2>'+(t&&t.note?'<p>'+esc(t.note)+'</p>':'')+'</div>';
  h+='<div class="fl-scene">';
  if(t&&t.image)h+='<div class="fl-image fl-grande" data-fim="'+esc(t.image)+'" onclick="retexLightbox(['+esc(JSON.stringify(t.image))+'],0)" title="Agrandir"></div>';
  else h+='<div class="fl-poster" style="--c:'+esc(c)+'"><div class="fl-poster-ico">⚡</div><div class="fl-poster-t">'+esc(d.titre||'Flash')+'</div>'
    +'<p>Le flash s’ouvre dans SharePoint, avec ton compte Microsoft CDES.</p>'
    +(estEditeur()?'<p class="hint">Pour l’afficher ici, au centre de l’écran : ✏️ ▸ ajoute l’image du flash (PowerPoint ▸ Fichier ▸ Exporter ▸ PNG).</p>':'')+'</div>';
  h+='<div class="fl-actions">'+(d.url&&d.url!=='#'?'<a class="btn btn-primary" href="'+esc(d.url)+'" target="_blank" rel="noopener">⚡ Ouvrir le flash (PDF)</a>':'')
    +(estEditeur()&&d.srcUrl?'<a class="btn btn-ghost" href="'+esc(d.srcUrl)+'" target="_blank" rel="noopener">✏️ Modifier le '+esc((d.srcExt||'PowerPoint').toUpperCase())+' ↗</a>':'')+'</div>';
  h+='</div>';
  h+='<div class="qhp-sections">';
  h+='<div class="card qhp-sec"><h3>🎬 La vidéo</h3>'+(t&&t.video?qhpVideoHtml(t.video):'<p class="muted">Pas de vidéo'+(estEditeur()?' — ✏️ en haut de la page pour ajouter un lien (YouTube, Vimeo, SharePoint, Stream…).':' pour ce flash.')+'</p>')+'</div>';
  h+='<div class="card qhp-sec"><h3>📝 À retenir</h3><ul class="fl-retenir"><li>Type : <b>'+esc(typeLib)+'</b></li>'+(d.secteur?'<li>Secteur : <b>'+esc(d.secteur)+'</b></li>':'')+'<li>Date : <b>'+esc(flDate(d)||'—')+'</b></li>'+(d.mots?'<li>Mots-clés : '+esc(d.mots)+'</li>':'')+'</ul></div>';
  h+=quizHtml(quiz)+'</div>';
  h+='<div class="qhp-foot no-print"><p>Le QHP est fait ? </p>'+boutonEmargement('')+'</div>';
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
  const d=banqueFlashs().find(x=>x.id===docId);if(!d)return;
  const t=enrichissement(d);
  if(t){qhpEditer(t.id);if(!t.banque)document.getElementById('mq-banque').value=d.id;return}
  qhpEditer();
  document.getElementById('mq-titre-h').textContent='Flash : image, vidéo, quiz';
  document.getElementById('mq-titre').value=d.titre||'';
  document.getElementById('mq-mois').value='';
  document.getElementById('mq-flash').value=d.url||'';
  document.getElementById('mq-banque').value=d.id;
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
      const r=await appel({secret:conf.secret,action:'flash-image',appareil:conf.appareil||'éditeur',data:{nom:qhpImage.nouvelle.nom,mime:qhpImage.nouvelle.mime,b64:qhpImage.nouvelle.b64}},90000);
      if(!r||!r.ok||!r.id)throw new Error((r&&r.erreur)||'image refusée');image=r.id}
    catch(e){toast('Image non envoyée : '+(e.message||'?'),true);return}
  }
  const banqueId=g('mq-banque');
  const o={id:qhpEnCours||('qt'+Date.now().toString(36)),maj:nowISO(),titre,mois:g('mq-mois'),video:g('mq-video'),flash:g('mq-flash'),note:g('mq-note'),quiz,actif:document.getElementById('mq-actif').checked,banque:banqueId,image:image};
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
