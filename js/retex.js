/* ===========================================================================
 *  RETEX DE FIN DE CHANTIER — V3.3.3 (14/10/2026)
 *  Remplace le fichier Excel « Tableau Bilans de fin de chantier REX ».
 *  · Liste par agence, en tableau lisible (chantier, conducteur, période, SSE,
 *    l'essentiel du RETEX, vignette photo) ; clic → la fiche complète.
 *  · Formulaire = les colonnes de l'Excel : chantier, activité, conducteur, dates,
 *    3 événements SSE (type, gravité, description), maîtrise organisationnelle,
 *    maîtrise financière, événement significatif de RETEX, illustrations, actions
 *    d'amélioration / BP — en une ou plusieurs PHASES (cas Palplanches Montech,
 *    avec le rendement), + photos (réduites dans le navigateur, rangées par le
 *    serveur dans le Drive CDES privé, affichées via le serveur).
 *  · Tout appareil déverrouillé crée et complète ; seul l'éditeur retire une fiche.
 *  · Import (éditeur) du fichier converti depuis les Excel existants.
 *  Aucune donnée ici : tout vient du serveur, derrière le mot de passe.
 * ========================================================================= */
const RETEX_TYPES=['Aucun','ATAA','ATSA','Accident bénin','Presqu-accident','Situation dangereuse','Pollution','Autres atteintes à l\'environnement','Incendie/Explosion','Autres'];
const RETEX_GRAV=['Faible','Moyenne','Grave'];
const RETEX_BLOCS=[
  {k:'organisation',l:'Maîtrise organisationnelle',ico:'🧭',c:'org',ph:'Préparation du chantier / planning / météo · gestion de la coactivité / communication · réactivité face aux aléas, adaptation des moyens et des méthodes'},
  {k:'financier',l:'Maîtrise financière',ico:'💶',c:'fin',ph:'Respect du budget et des moyens prévus · rendement / efficacité des interventions · impact des imprévus (retards, surcoûts…), réclamations'},
  {k:'retex',l:'Événement significatif de RETEX',ico:'💡',c:'rex',ph:'Bonne pratique, difficulté majeure, innovation…'},
  {k:'actions',l:'Actions d’amélioration et BP à partager',ico:'✅',c:'act',ph:'Ce qu’on refait, ce qu’on change, ce qu’on généralise'}];
let retexVue={id:null}, retexFiltre={q:'',sse:false}, retexForm=null, retexEnvoi=false;
function retexListe(){return Array.isArray(state.retex)?state.retex:[]}
function retexNumTitre(ch){
  const s=String(ch||'').replace(/\s+/g,' ').trim();
  const m=s.match(/^(\d{4}\s?\d{2}\s?\d{3})\s*(?:(IDF|NA|BPL)\b)?\s*[-–:]?\s*(.*)$/);
  return m&&m[3]?{num:m[1],titre:m[3]}:{num:'',titre:s};
}
function retexDuree(a,b){if(!a||!b)return '';const j=Math.round((new Date(b)-new Date(a))/864e5)+1;if(!(j>0))return '';return j<14?j+' j':(j<70?Math.round(j/7)+' sem.':Math.round(j/30.4)+' mois')}
function retexEvtsReels(f){return (f.evenements||[]).filter(e=>e&&e.type&&e.type!=='Aucun')}
function retexGravCls(g){return g==='Grave'?'grave':(g==='Moyenne'?'moy':(g==='Faible'?'faible':''))}
function retexPhotos(f){const l=[...(f.photos||[])];(f.phases||[]).forEach(p=>(p.photos||[]).forEach(x=>l.push(x)));return l}
function retexEssentiel(f){
  const ps=f.phases||[];const t=k=>ps.map(p=>p[k]).filter(Boolean).join('\n');
  return {retex:t('retex')||t('organisation')||t('financier'),actions:t('actions')};
}
function retexCherche(f){
  if(!retexFiltre.q)return true;
  const q=retexFiltre.q.toLowerCase();
  return JSON.stringify([f.chantier,f.activite,f.conducteur,f.evenements,f.phases]).toLowerCase().includes(q);
}
function setRetexFiltre(k,v){retexFiltre[k]=v;renderRetex();if(k==='q'){const e=document.getElementById('rx-q');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length)}}}

/* ---------- photos : vignettes demandées au serveur, gardées en mémoire ---------- */
const retexImgs={};
/* V3.3.5 : 3 demandes de photo à la fois au plus (le serveur répondait en vrac à 20
   demandes simultanées) ; un échec n'est PAS gardé en mémoire (on peut réessayer) et
   la vignette dit pourquoi au lieu de « charger » sans fin.
   V3.9.2 : (1) les images sont aussi gardées dans le navigateur (IndexedDB, 14 jours) :
   à la deuxième ouverture, les 150 cartes de flashs ne demandent plus rien au serveur ;
   (2) la file d'attente peut être VIDÉE (retexViderFile) quand on ouvre un flash, pour que
   sa grande image ne fasse pas la queue derrière 150 vignettes de la liste. */
let retexEnCours=0;const retexFile=[];
function retexSuivant(){while(retexEnCours<3&&retexFile.length){const t=retexFile.shift();retexEnCours++;
  t.go().finally(()=>{retexEnCours--;retexSuivant()})}}
function retexViderFile(){while(retexFile.length){const t=retexFile.shift();delete retexImgs[t.k];t.fin({err:'annulé'})}}
/* cache navigateur des images (clé id|taille → data URL) */
const IMG_CACHE_JOURS=14;
let imgDbP=null;
function imgDb(){
  if(imgDbP)return imgDbP;
  imgDbP=new Promise(ok=>{try{if(!window.indexedDB){ok(null);return}
    const r=indexedDB.open('ihse_images',1);
    r.onupgradeneeded=()=>{r.result.createObjectStore('img')};
    r.onsuccess=()=>ok(r.result);r.onerror=()=>ok(null);r.onblocked=()=>ok(null)}catch(e){ok(null)}});
  return imgDbP;
}
async function imgCacheLire(k){
  try{const db=await imgDb();if(!db)return null;
    return await new Promise(ok=>{const t=db.transaction('img','readonly').objectStore('img').get(k);t.onsuccess=()=>{const v=t.result;
      if(v&&v.src&&Date.now()-(v.t||0)<IMG_CACHE_JOURS*864e5)ok(v.src);else ok(null)};t.onerror=()=>ok(null)})}catch(e){return null}
}
async function imgCacheEcrire(k,src){
  try{const db=await imgDb();if(!db)return;
    const t=db.transaction('img','readwrite');t.objectStore('img').put({src,t:Date.now()},k)}catch(e){}
}
function retexImg(id,taille){
  const k=id+'|'+(taille||'');
  if(retexImgs[k])return retexImgs[k];
  const p=new Promise(ok=>{
    imgCacheLire(k).then(src=>{
      if(src){ok({src});return}
      if(retexImgs[k]!==p){ok({err:'annulé'});return}          // vidée entre-temps
      retexFile.push({k,fin:ok,go:()=>appel({action:'photo',id:id,taille:taille||''},60000)
        .then(r=>r&&r.ok&&r.b64?{src:'data:'+(r.mime||'image/jpeg')+';base64,'+r.b64}:{err:(r&&r.erreur)||'réponse vide'})
        .catch(e=>{if(e&&e.verrou){oublierVerrou();montrerVerrou('Le mot de passe a changé. Redemande-le au service HSE.')}return {err:(e&&e.message)||'erreur'}})
        .then(x=>{if(x.err)delete retexImgs[k];else imgCacheEcrire(k,x.src);ok(x)})});
      retexSuivant()});
  });
  retexImgs[k]=p;return p;
}
let retexObs=null;
function retexChargerVignettes(){
  const els=[...document.querySelectorAll('#v-retex [data-rph]:not([data-ok])')];
  const charge=el=>{el.dataset.ok='1';el.classList.remove('ko');el.removeAttribute('title');
    retexImg(el.dataset.rph,el.dataset.taille||'petit').then(x=>{
      if(x.src){el.style.backgroundImage='url("'+x.src+'")';el.classList.add('pret')}
      else{el.classList.add('ko');el.title='Photo indisponible : '+x.err+' — clique pour réessayer';el.dataset.err=x.err;
        el.addEventListener('click',ev=>{if(!el.classList.contains('ko'))return;ev.stopPropagation();delete el.dataset.ok;charge(el)},{once:true})}
    })};
  if(!('IntersectionObserver' in window)){els.forEach(charge);return}
  if(!retexObs)retexObs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){retexObs.unobserve(e.target);charge(e.target)}}),{rootMargin:'200px'});
  els.forEach(el=>retexObs.observe(el));
}
function retexLightbox(ids,i){
  const m=document.getElementById('m-rxphoto');if(!m)return;
  m._ids=ids;m._i=i;m.classList.add('open');retexLbAff();
}
function retexLbAff(){
  const m=document.getElementById('m-rxphoto'),id=m._ids[m._i],box=document.getElementById('rxlb-img');
  document.getElementById('rxlb-n').textContent=(m._i+1)+' / '+m._ids.length;
  box.innerHTML='<div class="mph-wait">⏳ Chargement de la photo…</div>';
  retexImg(id,'').then(x=>{if(m._ids[m._i]!==id)return;box.innerHTML=x.src?'<img src="'+x.src+'" alt="">':'<div class="mph-err">Photo indisponible — '+esc(x.err)+'<br><button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="retexLbAff()">↻ Réessayer</button></div>'});
}
function retexLbPas(d){const m=document.getElementById('m-rxphoto');m._i=(m._i+d+m._ids.length)%m._ids.length;retexLbAff()}

/* ---------- l'écran ---------- */
function renderRetex(){
  const box=document.getElementById('v-retex');if(!box)return;
  if(retexVue.id){const f=retexListe().find(x=>x.id===retexVue.id);if(f){box.innerHTML=retexFicheHtml(f);retexChargerVignettes();return}retexVue.id=null}
  const tous=retexListe().filter(f=>!agenceChoisie||(f.agence||'')===agenceChoisie);
  const l=tous.filter(f=>retexCherche(f)&&(!retexFiltre.sse||retexEvtsReels(f).length));
  const nSse=tous.filter(f=>retexEvtsReels(f).length).length, nPh=tous.reduce((s,f)=>s+retexPhotos(f).length,0);
  let h='<div class="arr-head"><div><h2>📘 RETEX chantiers</h2>'
    +'<p class="small muted" style="margin:2px 0 0">Les bilans de fin de chantier : ce qui a marché, ce qui a coincé, ce qu’on refait. Clique sur un chantier pour lire sa fiche. Tout le monde peut ajouter ou compléter un RETEX.</p></div>'
    +'<div class="arr-kpis"><span class="ak"><b>'+tous.length+'</b> chantier'+(tous.length>1?'s':'')+'</span><span class="ak '+(nSse?'bad':'ok')+'"><b>'+nSse+'</b> avec événement SSE</span><span class="ak"><b>'+nPh+'</b> photo'+(nPh>1?'s':'')+'</span></div></div>';
  h+='<div class="row no-print arr-bar"><button class="btn btn-primary btn-sm" onclick="ouvrirRetexForm()">＋ Nouveau RETEX</button>'
    +'<input type="text" id="rx-q" class="fsel rx-q" placeholder="🔎 Chercher (chantier, conducteur, mot clé…)" value="'+esc(retexFiltre.q)+'" oninput="setRetexFiltre(\'q\',this.value)">'
    +'<button class="btn btn-ghost btn-sm'+(retexFiltre.sse?' on':'')+'" onclick="setRetexFiltre(\'sse\',!retexFiltre.sse)">'+(retexFiltre.sse?'☑':'☐')+' Avec événement SSE</button>'
    +(estEditeur()?'<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'rx-imp\').click()" title="Importer le fichier converti depuis les tableaux Excel">📥 Importer</button><input type="file" id="rx-imp" accept=".json,application/json" style="display:none" onchange="importerRetex(this)">':'')
    +'</div><div id="rx-import-etat"></div>';
  const groupes=AGENCES_ORDRE.filter(g=>!agenceChoisie||g.code===agenceChoisie);
  let rien=true;
  groupes.forEach(g=>{
    const lg=l.filter(f=>(AGENCES_COUL[f.agence]?f.agence:'')===g.code);
    if(!lg.length&&(g.code===''||agenceChoisie||retexFiltre.q||retexFiltre.sse))return;
    if(!lg.length){h+='<div class="agb ag-'+(g.code||'X')+'"><div class="agb-h"><span class="agb-nom">'+esc(g.lib)+'</span><span class="agb-n muted">pas encore de RETEX</span></div></div>';return}
    rien=false;
    h+='<div class="agb ag-'+(g.code||'X')+'"><div class="agb-h"><span class="agb-nom">'+esc(g.lib)+'</span><span class="agb-n">'+lg.length+' RETEX</span></div>'
      +'<div class="rxt"><div class="rxt-h"><span>Chantier</span><span>Conducteur · période</span><span>SSE</span><span>L’essentiel</span><span></span></div>';
    lg.forEach(f=>{
      const nt=retexNumTitre(f.chantier), ev=retexEvtsReels(f), es=retexEssentiel(f), ph=retexPhotos(f), np=(f.phases||[]).length;
      h+='<div class="rxt-r" onclick="ouvrirRetex(\''+esc(f.id)+'\')" tabindex="0" onkeydown="if(event.key===\'Enter\')ouvrirRetex(\''+esc(f.id)+'\')">'
        +'<div class="rx-ch">'+(nt.num?'<span class="rx-num">'+esc(nt.num)+'</span>':'')+'<b>'+esc(nt.titre)+'</b>'
          +'<div class="rx-tags">'+(f.activite?'<span class="rx-act">'+esc(f.activite)+'</span>':'')+(np>1?'<span class="rx-ph">'+np+' phases</span>':'')+'</div></div>'
        +'<div class="rx-qui">'+(f.conducteur?'<b>👷‍♂️ '+esc(f.conducteur)+'</b>':'<span class="muted">—</span>')
          +'<span>'+(f.dateDebut?esc(frDate(f.dateDebut)):'')+(f.dateFin?' → '+esc(frDate(f.dateFin)):'')+'</span>'+(retexDuree(f.dateDebut,f.dateFin)?'<span class="muted">'+retexDuree(f.dateDebut,f.dateFin)+'</span>':'')+'</div>'
        +'<div class="rx-sse">'+(ev.length?ev.map(e=>'<span class="rx-ev '+retexGravCls(e.gravite)+'" title="'+esc(e.description||'')+'">'+esc(e.type)+(e.gravite?' · '+esc(e.gravite):'')+'</span>').join(''):((f.evenements||[]).length?'<span class="rx-ev ok">✓ Aucun</span>':'<span class="muted small">non renseigné</span>'))+'</div>'
        +'<div class="rx-ess">'+(es.retex?'<p class="rx-ex">'+esc(es.retex)+'</p>':'<p class="muted small">—</p>')+(es.actions?'<p class="rx-ac">✅ '+esc(es.actions)+'</p>':'')+'</div>'
        +'<div class="rx-vg">'+(ph.length?'<div class="rx-thumb" data-rph="'+esc(ph[0])+'"></div>'+(ph.length>1?'<span class="rx-nph">📷 '+ph.length+'</span>':''):'<div class="rx-thumb vide">📘</div>')+'</div>'
        +'</div>';
    });
    h+='</div></div>';
  });
  if(rien&&!tous.length)h+='<div class="secempty">Aucun RETEX pour l’instant. « ＋ Nouveau RETEX » pour le premier bilan de fin de chantier'+(estEditeur()?' — ou « 📥 Importer » pour reprendre les tableaux Excel.':'.')+'</div>';
  else if(rien)h+='<div class="secempty">Aucun RETEX ne correspond.</div>';
  box.innerHTML=h;
  retexChargerVignettes();
}
function ouvrirRetex(id){retexVue.id=id;renderRetex();window.scrollTo(0,0)}
function fermerRetex(){retexVue.id=null;renderRetex()}
function retexTexte(t){return esc(t).replace(/(https?:\/\/[^\s<]+)/g,u=>'<a href="'+u+'" target="_blank" rel="noopener">'+(u.length>60?u.slice(0,57)+'…':u)+'</a>').replace(/\n/g,'<br>')}
function retexFicheHtml(f){
  const nt=retexNumTitre(f.chantier), ev=f.evenements||[], ps=f.phases||[], multi=ps.length>1, gal=f.photos||[], toutes=retexPhotos(f);
  const coul=AGENCES_COUL[f.agence]||'#5b7387';
  let h='<div class="row no-print" style="margin-bottom:12px;gap:8px"><button class="btn btn-ghost btn-sm" onclick="fermerRetex()">← Tous les RETEX</button><span class="grow"></span>'
    +'<button class="btn btn-ghost btn-sm" onclick="window.print()">🖨 Imprimer</button>'
    +'<button class="btn btn-primary btn-sm" onclick="ouvrirRetexForm(\''+esc(f.id)+'\')">✏️ Compléter / modifier</button>'
    +(estEditeur()?'<button class="btn btn-ghost btn-sm" onclick="supprimerRetex(\''+esc(f.id)+'\')" title="Retirer ce RETEX">🗑️</button>':'')+'</div>';
  h+='<div class="rx-hero" style="--ag:'+coul+'"><div class="rx-hero-g">'+(nt.num?'<span class="rx-num">'+esc(nt.num)+'</span>':'')
    +'<h2>'+esc(nt.titre)+'</h2><div class="rx-chips">'
    +(f.agence?'<span class="apill ag-'+esc(f.agence)+'">'+esc(f.agence)+'</span>':'<span class="apill">sans agence</span>')
    +(f.activite?'<span>🏗️ '+esc(f.activite)+'</span>':'')+(f.conducteur?'<span>👷‍♂️ '+esc(f.conducteur)+'</span>':'')
    +((f.dateDebut||f.dateFin)?'<span>📅 '+esc(frDate(f.dateDebut)||'?')+' → '+esc(frDate(f.dateFin)||'?')+(retexDuree(f.dateDebut,f.dateFin)?' · '+retexDuree(f.dateDebut,f.dateFin):'')+'</span>':'')
    +(toutes.length?'<span>📷 '+toutes.length+'</span>':'')+'</div></div>'
    +(toutes.length?'<div class="rx-hero-ph" data-rph="'+esc(toutes[0])+'" data-taille="" onclick="retexLightbox('+esc(JSON.stringify(toutes))+',0)"></div>':'')+'</div>';
  /* événements SSE */
  h+='<div class="card rx-card"><h2>🦺 Événements significatifs SSE</h2>';
  const evR=ev.filter(e=>e&&e.type&&e.type!=='Aucun');
  if(!ev.length)h+='<p class="muted" style="margin:0">Non renseigné.</p>';
  else if(!evR.length)h+='<p class="rx-none">✓ Aucun événement SSE sur ce chantier.</p>';
  else h+='<div class="rx-evl">'+evR.map(e=>'<div class="rx-evi '+retexGravCls(e.gravite)+'"><div class="rx-evt"><b>'+esc(e.type)+'</b>'+(e.gravite?'<span>'+esc(e.gravite)+'</span>':'')+'</div><div>'+retexTexte(e.description||'—')+'</div></div>').join('')+'</div>';
  h+='</div>';
  /* phases */
  ps.forEach((p,i)=>{
    const vides=RETEX_BLOCS.every(b=>!p[b.k])&&!p.illustration&&!p.rendement&&!(p.photos||[]).length;
    if(vides&&!multi){h+='<div class="card"><p class="muted" style="margin:0">Le bilan n’est pas encore rempli — « ✏️ Compléter » pour l’écrire.</p></div>';return}
    h+='<div class="card rx-phase">'+(multi?'<div class="rx-ph-h"><span class="rx-ph-n">'+(i+1)+'</span><h3>'+esc(p.intitule||'Phase '+(i+1))+'</h3>'+(p.rendement?'<span class="rx-rend">⚙️ '+esc(p.rendement).replace(/\n/g,' · ')+'</span>':'')+'</div>'
      :'<h2>📘 Le bilan'+(p.rendement?' <span class="rx-rend">⚙️ '+esc(p.rendement).replace(/\n/g,' · ')+'</span>':'')+'</h2>')
      +'<div class="rx-blocs">'+RETEX_BLOCS.filter(b=>p[b.k]).map(b=>'<div class="rx-b '+b.c+'"><div class="rx-bt">'+b.ico+' '+esc(b.l)+'</div><div class="rx-bx">'+retexTexte(p[b.k])+'</div></div>').join('')+'</div>'
      +(p.illustration?'<p class="rx-ill">🖼️ '+retexTexte(p.illustration)+'</p>':'')
      +((p.photos||[]).length?'<div class="rx-gal">'+p.photos.map(id=>'<div class="rx-gi" data-rph="'+esc(id)+'" onclick="retexLightbox('+esc(JSON.stringify(toutes))+','+toutes.indexOf(id)+')"></div>').join('')+'</div>':'')
      +'</div>';
  });
  if(gal.length)h+='<div class="card"><h2>📷 Photos, plans, schémas</h2><div class="rx-gal">'+gal.map(id=>'<div class="rx-gi" data-rph="'+esc(id)+'" onclick="retexLightbox('+esc(JSON.stringify(toutes))+','+toutes.indexOf(id)+')"></div>').join('')+'</div></div>';
  h+='<p class="hint">'+(f.source==='import Excel'?'Repris du tableau Excel des bilans de fin de chantier.':'Saisi depuis l’intranet'+(f.auteur?' ('+esc(f.auteur)+')':''))+(f.maj?' · mis à jour le '+esc(frDate(String(f.maj).slice(0,10))):'')+'</p>';
  return h;
}

/* ---------- le formulaire ---------- */
function retexPhaseVide(){return {intitule:'',rendement:'',organisation:'',financier:'',retex:'',illustration:'',actions:'',photos:[],nouvelles:[]}}
function ouvrirRetexForm(id){
  const f=id?retexListe().find(x=>x.id===id):null;
  retexForm={id:f?f.id:null,
    phases:(f&&f.phases&&f.phases.length?f.phases:[{}]).map(p=>Object.assign(retexPhaseVide(),JSON.parse(JSON.stringify(p)),{nouvelles:[]})),
    evenements:(f&&f.evenements&&f.evenements.length?JSON.parse(JSON.stringify(f.evenements)):[{type:'Aucun',gravite:'',description:''}]),
    photos:f?[...(f.photos||[])]:[],nouvelles:[]};
  document.getElementById('mrx-titre').textContent=f?'RETEX — '+retexNumTitre(f.chantier).titre:'Nouveau RETEX de fin de chantier';
  const conds=(()=>{const q=(typeof qhpData==='function')?qhpData():null;return q&&Array.isArray(q.conducteurs)?q.conducteurs.map(c=>c.nom):[]})();
  document.getElementById('mrx-tete').innerHTML=
    '<div class="row"><div style="width:190px"><label class="f">Agence *</label>'+selectAgence('rx-agence',f?f.agence:agenceParDefaut())+'</div>'
    +'<div class="grow"><label class="f">Chantier *</label><input type="text" id="rx-chantier" value="'+esc(f?f.chantier:'')+'" placeholder="N° et nom du chantier, ex. 2026 01 002 – Extraction sédiments port"></div></div>'
    +'<div class="row"><div class="grow"><label class="f">Activité</label><input type="text" id="rx-activite" value="'+esc(f?f.activite:'')+'" placeholder="Dragage, protection de berge, faucardage…"></div>'
    +'<div class="grow"><label class="f">Conducteur de travaux</label><input type="text" id="rx-conducteur" list="dl-rx-cond" value="'+esc(f?f.conducteur:'')+'" autocomplete="off"><datalist id="dl-rx-cond">'+conds.map(c=>'<option value="'+esc(c)+'">').join('')+'</datalist></div></div>'
    +'<div class="row"><div class="grow"><label class="f">Date début</label><input type="date" id="rx-debut" value="'+esc(f?f.dateDebut:'')+'"></div><div class="grow"><label class="f">Date fin</label><input type="date" id="rx-fin" value="'+esc(f?f.dateFin:'')+'"></div></div>';
  retexFormRendu();
  document.getElementById('m-retex').classList.add('open');
}
/* recopie ce qui est tapé dans retexForm avant de redessiner (ajout / retrait de lignes) */
function retexFormLire(){
  if(!retexForm)return;
  retexForm.evenements=retexForm.evenements.map((e,i)=>({type:(document.getElementById('rxe-t-'+i)||{}).value||'',gravite:(document.getElementById('rxe-g-'+i)||{}).value||'',description:((document.getElementById('rxe-d-'+i)||{}).value||'').trim()}));
  retexForm.phases.forEach((p,i)=>{['intitule','rendement','organisation','financier','retex','illustration','actions'].forEach(k=>{const e=document.getElementById('rxp-'+k+'-'+i);if(e)p[k]=e.value})});
}
function retexFormRendu(){
  const F=retexForm, multi=F.phases.length>1;
  if(!F.phases.length)F.phases.push(retexPhaseVide());
  /* une seule phase : ses photos rejoignent la galerie (un seul champ photo à l'écran) */
  if(!multi&&(F.phases[0].photos.length||F.phases[0].nouvelles.length)){F.photos.push(...F.phases[0].photos);F.nouvelles.push(...F.phases[0].nouvelles);F.phases[0].photos=[];F.phases[0].nouvelles=[]}
  document.getElementById('mrx-evts').innerHTML=F.evenements.map((e,i)=>
    '<div class="rx-fev"><div class="row"><div class="grow"><select id="rxe-t-'+i+'">'+['',...RETEX_TYPES].map(t=>'<option value="'+esc(t)+'"'+(e.type===t?' selected':'')+'>'+(t||'— type —')+'</option>').join('')+'</select></div>'
    +'<div style="width:140px"><select id="rxe-g-'+i+'"><option value="">— gravité —</option>'+RETEX_GRAV.map(g=>'<option'+(e.gravite===g?' selected':'')+'>'+g+'</option>').join('')+'</select></div>'
    +(F.evenements.length>1?'<button class="btn btn-ghost btn-sm" onclick="retexFormLire();retexForm.evenements.splice('+i+',1);retexFormRendu()" title="Retirer">✕</button>':'')+'</div>'
    +'<textarea id="rxe-d-'+i+'" rows="2" placeholder="Description de l’événement, constat, non-conformité">'+esc(e.description||'')+'</textarea></div>').join('')
    +(F.evenements.length<3?'<button class="btn btn-ghost btn-sm" onclick="retexFormLire();retexForm.evenements.push({type:\'\',gravite:\'\',description:\'\'});retexFormRendu()">＋ Un autre événement</button>':'');
  document.getElementById('mrx-phases').innerHTML=F.phases.map((p,i)=>
    '<div class="rx-fph'+(multi?' multi':'')+'">'
    +(multi?'<div class="row" style="align-items:flex-end"><div class="grow"><label class="f">Phase '+(i+1)+' — activité</label><input type="text" id="rxp-intitule-'+i+'" value="'+esc(p.intitule)+'" placeholder="Ex. Battage des palplanches"></div>'
      +'<button class="btn btn-ghost btn-sm" onclick="retexFormLire();retexForm.phases.splice('+i+',1);retexFormRendu()" title="Retirer cette phase">🗑 Retirer</button></div>':'')
    +'<label class="f">Rendement <span class="muted" style="font-weight:400;text-transform:none">(facultatif)</span></label><input type="text" id="rxp-rendement-'+i+'" value="'+esc(p.rendement)+'" placeholder="Ex. 100 t/j, 15 palplanches/j">'
    +RETEX_BLOCS.map(b=>'<label class="f">'+b.ico+' '+esc(b.l)+'</label><textarea id="rxp-'+b.k+'-'+i+'" rows="3" placeholder="'+esc(b.ph)+'">'+esc(p[b.k]||'')+'</textarea>').join('')
    +'<label class="f">🖼️ Illustrations — commentaire <span class="muted" style="font-weight:400;text-transform:none">(facultatif)</span></label><input type="text" id="rxp-illustration-'+i+'" value="'+esc(p.illustration)+'" placeholder="Ce que montrent la photo, le plan ou le schéma">'
    +(multi?retexPhotosFormHtml('p'+i,p.photos,p.nouvelles):'')
    +'</div>').join('')
    +'<button class="btn btn-ghost btn-sm" onclick="retexFormLire();retexForm.phases.push(retexPhaseVide());retexFormRendu()">＋ Ajouter une phase</button>'
    +'<span class="hint" style="margin-left:8px">Pour un chantier en plusieurs étapes (installation, battage, repli…), chacune avec son rendement.</span>';
  document.getElementById('mrx-photos').innerHTML=retexPhotosFormHtml('g',F.photos,F.nouvelles);
  retexFormVignettes();
}
function retexPhotosFormHtml(cle,ids,nouvelles){
  return '<div class="rx-fphotos"><div class="rx-gal petite">'
    +ids.map((id,j)=>'<div class="rx-gi" data-fph="'+esc(id)+'"><button class="rx-x" onclick="retexRetirerPhoto(\''+cle+'\','+j+',false)" title="Retirer">✕</button></div>').join('')
    +nouvelles.map((n,j)=>'<div class="rx-gi pret" style="background-image:url(\''+n.src+'\')"><span class="rx-new">nouvelle</span><button class="rx-x" onclick="retexRetirerPhoto(\''+cle+'\','+j+',true)" title="Retirer">✕</button></div>').join('')
    +'<label class="rx-add">📷<span>Ajouter</span><input type="file" accept="image/*" multiple onchange="retexAjouterPhotos(\''+cle+'\',this)"></label></div></div>';
}
function retexCiblePhotos(cle){if(cle==='g')return retexForm;return retexForm.phases[Number(cle.slice(1))]}
function retexRetirerPhoto(cle,j,nouvelle){retexFormLire();const c=retexCiblePhotos(cle);(nouvelle?c.nouvelles:c.photos).splice(j,1);retexFormRendu()}
function retexFormVignettes(){document.querySelectorAll('#m-retex [data-fph]:not([data-ok])').forEach(el=>{el.dataset.ok='1';retexImg(el.dataset.fph,'petit').then(x=>{if(x.src){el.style.backgroundImage='url("'+x.src+'")';el.classList.add('pret')}else{el.classList.add('ko');el.title='Photo indisponible : '+x.err}})})}
/* réduction dans le navigateur : 1 600 px de côté, JPEG 82 % — une photo de téléphone passe de 4-6 Mo à ~300 ko */
function retexReduire(fichier){
  return new Promise((ok,ko)=>{
    const r=new FileReader();
    r.onload=()=>{const img=new Image();img.onload=()=>{
      const k=Math.min(1,1600/Math.max(img.width,img.height)),w=Math.round(img.width*k),h=Math.round(img.height*k);
      const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);
      const src=c.toDataURL('image/jpeg',.82);ok({src,b64:src.split(',')[1],mime:'image/jpeg',nom:(fichier.name||'photo').replace(/\.[^.]+$/,'')+'.jpg'})};
      img.onerror=()=>ko(new Error('image illisible'));img.src=r.result};
    r.onerror=()=>ko(r.error);r.readAsDataURL(fichier);
  });
}
async function retexAjouterPhotos(cle,inp){
  const fs=[...(inp.files||[])].slice(0,20);inp.value='';if(!fs.length)return;
  retexFormLire();const c=retexCiblePhotos(cle);
  for(const f of fs){try{c.nouvelles.push(await retexReduire(f))}catch(e){toast('Photo ignorée : '+e.message,true)}}
  retexFormRendu();
}
async function retexEnvoyerPhotos(liste,etat){
  const ids=[];
  for(const n of liste){
    etat.n++;toast('📷 Envoi des photos '+etat.n+' / '+etat.total+'…');
    const r=await appel({action:'retex-photo',appareil:conf.appareil||nomAppareil(),data:{nom:n.nom,mime:n.mime,b64:n.b64}},90000);
    if(!r||!r.ok||!r.id)throw new Error((r&&r.erreur)||'photo refusée');
    ids.push(r.id);
  }
  return ids;
}
async function enregistrerRetex(){
  if(retexEnvoi)return;
  retexFormLire();
  const g=id=>(document.getElementById(id)||{}).value||'';
  const F=retexForm, agence=g('rx-agence'), chantier=g('rx-chantier').trim();
  if(!agence){toast('Choisis l’agence',true);return}
  if(chantier.length<3){toast('Indique le chantier',true);return}
  if(!webhookLecture()){toast('Le suivi n’est pas branché : renseigne config.js',true);return}
  const btn=document.getElementById('mrx-ok');retexEnvoi=true;if(btn){btn.disabled=true;btn.textContent='⏳ Enregistrement…'}
  try{
    const etat={n:0,total:F.nouvelles.length+F.phases.reduce((s,p)=>s+p.nouvelles.length,0)};
    const photos=F.photos.concat(await retexEnvoyerPhotos(F.nouvelles,etat));
    const phases=[];
    for(const p of F.phases){const pp=Object.assign({},p);pp.photos=(p.photos||[]).concat(await retexEnvoyerPhotos(p.nouvelles,etat));delete pp.nouvelles;
      if(F.phases.length===1)pp.intitule=pp.intitule||'';phases.push(pp)}
    const o={agence,chantier,activite:g('rx-activite').trim(),conducteur:g('rx-conducteur').trim(),dateDebut:g('rx-debut'),dateFin:g('rx-fin'),
      evenements:F.evenements.filter(e=>e.type||e.gravite||e.description),phases,photos};
    if(F.id)o.id=F.id;
    const j=await appel({action:'retex-maj',appareil:conf.appareil||nomAppareil(),data:{retex:[o]}},60000);
    if(!j||!j.ok)throw new Error((j&&j.erreur)||'refusé');
    if(j.data&&Array.isArray(j.data.retex))state.retex=j.data.retex;save();
    majAgenceAppareil(agence);closeModal();
    const cree=!F.id&&state.retex.find(x=>x.chantier===chantier);
    retexVue.id=F.id||(cree&&cree.id)||null;renderRetex();window.scrollTo(0,0);
    toast(F.id?'RETEX mis à jour ✓':'📘 RETEX enregistré — merci !');
  }catch(e){
    if(e&&e.verrou){oublierVerrou();montrerVerrou('Le mot de passe a changé. Redemande-le au service HSE.');return}
    toast('Échec : '+(e.message||'?')+' — rien n’est perdu, réessaie',true);
  }finally{retexEnvoi=false;if(btn){btn.disabled=false;btn.textContent='Enregistrer le RETEX'}}
}
async function supprimerRetex(id){
  const f=retexListe().find(x=>x.id===id);if(!f)return;
  if(!estEditeur()){toast('Seul un appareil éditeur peut retirer un RETEX',true);return}
  if(!confirm('Retirer le RETEX « '+retexNumTitre(f.chantier).titre+' » ?\n\nLa ligne reste dans l’onglet RETEX du classeur (pierre tombale).'))return;
  try{
    const j=await appel({secret:conf.secret,action:'retex-suppr',appareil:conf.appareil||nomAppareil(),data:{ids:[id]}});
    if(j.data&&Array.isArray(j.data.retex))state.retex=j.data.retex;save();retexVue.id=null;renderRetex();toast('🗑️ RETEX retiré');
  }catch(e){toast('Échec : '+(e.message||'?'),true)}
}

/* ---------- import (éditeur) du fichier converti depuis les Excel ---------- */
async function importerRetex(inp){
  const fichier=inp.files&&inp.files[0];inp.value='';if(!fichier)return;
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  let d;try{d=JSON.parse(await fichier.text())}catch(e){toast('Fichier illisible',true);return}
  if(!d||d.format!=='retex-cdes-v1'||!Array.isArray(d.fiches)){toast('Ce n’est pas un fichier d’import RETEX',true);return}
  const deja={};retexListe().forEach(f=>deja[f.id]=1);
  const a=d.fiches.filter(f=>f&&f.id&&!deja[f.id]);
  if(!a.length){toast('Tout est déjà importé ('+d.fiches.length+' fiches)');return}
  if(!confirm('Importer '+a.length+' RETEX'+(d.fiches.length-a.length?' ('+(d.fiches.length-a.length)+' déjà présents, ignorés)':'')+' ?\n\nLes photos sont envoyées une par une au Drive CDES : compte 1 à 3 minutes, garde la page ouverte.'))return;
  const zone=document.getElementById('rx-import-etat');
  let ok=0;
  for(let i=0;i<a.length;i++){
    const f=a[i];
    if(zone)zone.innerHTML='<div class="rx-imp">📥 Import '+(i+1)+' / '+a.length+' — '+esc(retexNumTitre(f.chantier).titre)+'…</div>';
    try{
      const etat={n:0,total:(f.photos||[]).length+(f.phases||[]).reduce((s,p)=>s+(p.photos||[]).length,0)};
      const env=l=>retexEnvoyerPhotos((l||[]).filter(x=>x&&x.b64),etat);
      const o=Object.assign({},f,{photos:await env(f.photos),phases:[]});
      for(const p of (f.phases||[]))o.phases.push(Object.assign({},p,{photos:await env(p.photos)}));
      const j=await appel({action:'retex-maj',appareil:conf.appareil||nomAppareil(),data:{retex:[o]}},60000);
      if(!j||!j.ok)throw new Error((j&&j.erreur)||'refusé');
      if(j.data&&Array.isArray(j.data.retex))state.retex=j.data.retex;save();ok++;
    }catch(e){toast('Import interrompu sur « '+retexNumTitre(f.chantier).titre+' » : '+(e.message||'?')+'. Relance l’import : ce qui est passé ne sera pas refait.',true);break}
  }
  renderRetex();
  const z=document.getElementById('rx-import-etat');if(z)z.innerHTML='<div class="rx-imp ok">✓ '+ok+' RETEX importé'+(ok>1?'s':'')+'. Vérifie l’agence des fiches rangées dans « Sans agence » (✏️ pour la poser).</div>';
}
