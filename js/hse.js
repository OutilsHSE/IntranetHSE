/* ===========================================================================
 *  BONHOMME CDES — la silhouette de la fiche d'analyse d'accident, reprise
 *  telle quelle pour la cartographie des lésions (même repère : 427 x 1079).
 * ========================================================================= */
const BH_IMG = 'img/bonhomme.png';
const BH_W = 427, BH_H = 1079;
/* un point par zone, repris des repères de la fiche d'analyse d'accident */
const BH_POINTS = {
  tete:[212,92], visage:[212,150], cou:[212,207],
  epaule:[112,245], bras:[56,425], main:[55,615],
  thorax:[212,415], dos:[212,515], hanche:[212,580],
  jambe:[140,695], cheville:[116,953], pied:[92,1040],
  multiple:[212,700]
};
/* parZone : {zone: nombre}  ·  opts : {cliquable, selection, hauteur} */
function bonhommeCDES(parZone, opts){
  opts = opts || {};
  const sel = opts.selection || '';
  const haut = opts.hauteur || 340;
  const M = 50;                                  // marge pour les pastilles qui débordent
  const VB = (-M) + ' -10 ' + (BH_W + M*2) + ' ' + (BH_H + 20);
  let cibles = '', marques = '';
  if(opts.cliquable){
    Object.keys(BH_POINTS).forEach(function(z){
      const p = BH_POINTS[z];
      cibles += '<circle class="bh-cible' + (sel===z ? ' sel' : '') + '" cx="'+p[0]+'" cy="'+p[1]+'" r="34" '+
        'onclick="choisirZone(\''+z+'\')"><title>'+esc(zoneLib(z))+'</title></circle>';
    });
  }
  Object.keys(parZone || {}).forEach(function(z){
    const nb = parZone[z], p = BH_POINTS[z];
    if(!nb || !p || z === 'aucune') return;
    const fort = nb >= 2, c = fort ? '#74ccef' : '#3D9BD9', r = fort ? 33 : 27;
    const actif = (sel === z);
    marques +=
      '<g class="bh-z' + (actif ? ' sel' : '') + '"' + (opts.cliquable ? ' onclick="choisirZone(\''+z+'\')"' : '') + '>'+
      '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(r+14)+'" fill="'+c+'" opacity=".18"/>'+
      '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+r+'" fill="'+c+'" opacity=".95" '+
        'stroke="'+(actif ? '#ffffff' : 'rgba(6,14,28,.8)')+'" stroke-width="'+(actif ? 7 : 5)+'"/>'+
      '<text x="'+p[0]+'" y="'+(p[1]+12)+'" text-anchor="middle" font-size="33" font-weight="700" '+
        'fill="#06121f" font-family="Barlow Condensed,Arial">'+nb+'</text>'+
      '<title>'+esc(zoneLib(z))+' : '+nb+' cas</title></g>';
  });
  return '<svg class="bonhomme" viewBox="'+VB+'" height="'+haut+'" role="img" aria-label="Zones du corps lésées">'+
    '<image href="'+BH_IMG+'" x="0" y="0" width="'+BH_W+'" height="'+BH_H+'"/>'+
    cibles + marques + '</svg>';
}
/* V3 (09/10/2026) : le semis de données réelles a été RETIRÉ du fichier public (il contenait des noms). La zone HSE n’existe que branchée au classeur : rien à semer. */
const SEED = {"mensuel": [], "incidents": [], "remontees": [], "objectifs": [], "chantiers": []};
/* ===========================================================================
 *  REPORTING HSE — CDES · logique de l'appli de saisie
 *  Une seule règle : ce qui est saisi ici part dans le classeur, et l'intranet
 *  l'affiche. Aucune saisie ailleurs.
 * ========================================================================= */
const APP_VERSION = 'V3.3.4';   // 14/10/2026 — Reporting autonome (brique de la zone HSE), saisie stable, thème clair corrigé
const LS = 'rhse_v1', LS_CONF = 'rhse_conf_v1';
const EPOCH = '1970-01-01T00:00:00.000Z';
const MOIS_S = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const MOIS_L = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const ANNEE = new Date().getFullYear();

function nowISO(){return new Date().toISOString()}
function uid(p){return (p||'x')+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function n(v){const x=Number(String(v==null?'':v).replace(',','.'));return isNaN(x)?0:x}
function frDate(iso){if(!iso)return '';const d=new Date(String(iso).slice(0,10)+'T00:00');if(isNaN(d))return String(iso);
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()}
function frCourt(iso){if(!iso)return '';const d=new Date(String(iso).slice(0,10)+'T00:00');if(isNaN(d))return '';
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')}
function moisDe(iso){return String(iso||'').slice(0,7)}
function toast(m,e){const t=document.getElementById('toast');t.textContent=m;t.className=(e?'err ':'')+'show';
  clearTimeout(t._t);t._t=setTimeout(()=>t.className='',2800)}

/* ==================== RÉFÉRENTIELS (menus déroulants) ==================== */
const REF = {
  typeAT:['Presqu\'Accident de Travail','Accident Bénin','Accident sans Arrêt de Travail','Accident avec Arrêt de Travail','Accident de trajet','Maladie professionnelle'],
  categorie:['Employés CDI','Employés CDD','Cadres CDI','Cadres CDD','Intérimaires','Apprenti(e)s / Stagiaires','Sous-traitant'],
  blessure:['Plaies / Coupures / Piqûre','Heurt / Choc','Lésions traumatiques (Entorse / Foulure / Luxation…)','Liaisons musculaires (lombalgie…)','Brûlure','Projection / Corps étranger','Noyade','Intoxication','Pas de blessure'],
  typologie:['Blessure par un outil à main','Choc / Heurt avec un objet fixe','Chute de plain-pied','Chute de hauteur','Chute d\'objet / effondrement','Accident de la route en mission','Manutention manuelle','Coactivité engin / piéton','Électrisation','Produit chimique','Chute à l\'eau','Autre'],
  cause:['Cause Humaine : Non respect des consignes HSE','Cause Humaine : Erreur Humaine / Manque de vigilance','Cause Technique : Défaillance d\'un équipement','Cause Organisationnelle : Préparation insuffisante','Cause Environnementale : Conditions extérieures','Autre'],
  ouiNon:['Oui','Non'],
  rqs:['/','RQS N°1','RQS N°2','RQS N°3 : Port des EPI','RQS N°4','RQS N°5','RQS N°6','RQS N°7','RQS N°8','RQS N°9','RQS N°10'],
  domaineRem:['Sécurité','Santé','Environnement','Réglementaire','Démarche SSE'],
  typeRem:['SD (Situation Dangereuse)','PA (Point d\'Amélioration)','BP (Bonne Pratique)','Presqu\'AT'],
  statutRem:['Traitée','En cours','Non traitée'],
  natureSE:['Campagne de mesures d\'exposition','Sensibilisation santé','Sensibilisation environnement','Événement environnemental significatif','Flash Sécurité','Flash Santé','Flash Environnement','Flash RETEX suite AT','Autre action'],
  smileys:[{v:'😀',l:'Atteint / très bien'},{v:'🙂',l:'En bonne voie'},{v:'😐',l:'À suivre'},{v:'😟',l:'Non traité / en retard'}],
  familles:['Main d’œuvre','Matériel','Milieu','Méthode','Management'],
  statutAction:['À faire','En cours','Faite']
};
/* zones du bonhomme : id → libellé + dessin */
const ZONES = [
  {id:'tete',lib:'Tête / Arcade'},{id:'visage',lib:'Visage / Yeux'},{id:'cou',lib:'Cou / Nuque'},
  {id:'epaule',lib:'Épaules'},{id:'bras',lib:'Bras / Coude'},{id:'main',lib:'Main / Doigts'},
  {id:'thorax',lib:'Thorax / Abdomen'},{id:'dos',lib:'Dos / Lombaires'},
  {id:'hanche',lib:'Hanche / Bassin'},{id:'jambe',lib:'Jambe / Genou'},
  {id:'cheville',lib:'Cheville'},{id:'pied',lib:'Pied / Orteils'},
  {id:'multiple',lib:'Plusieurs zones'},{id:'aucune',lib:'Pas de blessure'}
];
function zoneLib(id){const z=ZONES.find(x=>x.id===id);return z?z.lib:(id||'—')}
/* correspondance depuis les libellés du fichier historique */
function zoneDepuisTexte(t){
  t=String(t||'').toLowerCase();
  if(!t||t.indexOf('pas de bless')>=0)return 'aucune';
  if(t.indexOf('main')>=0||t.indexOf('doigt')>=0)return 'main';
  if(t.indexOf('cheville')>=0)return 'cheville';
  if(t.indexOf('pied')>=0||t.indexOf('orteil')>=0)return 'pied';
  if(t.indexOf('jambe')>=0||t.indexOf('genou')>=0||t.indexOf('cuisse')>=0)return 'jambe';
  if(t.indexOf('dos')>=0||t.indexOf('lombaire')>=0)return 'dos';
  if(t.indexOf('épaule')>=0||t.indexOf('epaule')>=0)return 'epaule';
  if(t.indexOf('bras')>=0||t.indexOf('coude')>=0)return 'bras';
  if(t.indexOf('tête')>=0||t.indexOf('tete')>=0||t.indexOf('arcade')>=0||t.indexOf('crâne')>=0)return 'tete';
  if(t.indexOf('yeux')>=0||t.indexOf('visage')>=0||t.indexOf('œil')>=0)return 'visage';
  if(t.indexOf('thorax')>=0||t.indexOf('abdomen')>=0||t.indexOf('côte')>=0)return 'thorax';
  if(t.indexOf('hanche')>=0||t.indexOf('bassin')>=0)return 'hanche';
  if(t.indexOf('cou')>=0||t.indexOf('nuque')>=0)return 'cou';
  return 'multiple';
}

/* ==================== ÉTAT ==================== */
let state = {mensuel:[], incidents:[], remontees:[], se:[], objectifs:[], chantiers:[], params:{}, tomb:{}};

/* ---------- découpage par agence ----------
   Une ligne dont l'agence est vide n'est pas perdue : elle tombe dans « Non
   réparti », comptée dans le Global et signalée, pour qu'on voie ce qui reste
   à ventiler. Le Global n'est jamais stocké : c'est toujours une somme. */
const AGENCES=[{code:'IDF',lib:'Île-de-France'},{code:'NA',lib:'Nouvelle-Aquitaine'},{code:'BPL',lib:'Bretagne – Pays de la Loire'}];
const AG_LIB={'':'Non réparti',IDF:'Île-de-France',NA:'Nouvelle-Aquitaine',BPL:'Bretagne – Pays de la Loire'};
let agence='';                       // '' = Global
function estGlobal(){return agence===''}
function agLib(c){return AG_LIB[c]||c}
/* nom de chantier normalisé, pour rapprocher « Adres » et « Ardres » */
function netCh(v){return String(v||'').toLowerCase()
  .replace(/[àâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[îï]/g,'i')
  .replace(/[ôö]/g,'o').replace(/[ûùü]/g,'u').replace(/ç/g,'c')
  .replace(/[^a-z0-9]+/g,' ').trim()}
function chantiers(){if(!Array.isArray(state.chantiers))state.chantiers=[];return state.chantiers}
/* Rapprochement : d'abord le nom exact, sinon le nom connu le plus long qui est
   contenu dans l'autre — « Arcachon » ↔ « Dragage Arcachon ». Le seuil de 5
   caractères évite qu'un nom trop court n'attrape tout ; on renvoie aussi PAR QUI
   la correspondance a été faite, pour pouvoir l'afficher plutôt que la subir. */
const MIN_RAPPROCHE=5;
function trouveChantier(nom){
  const n=netCh(nom);if(!n)return null;
  const l=chantiers().filter(c=>!c.supprime&&c.agence);
  const exact=l.find(c=>netCh(c.nom)===n);
  if(exact)return {agence:exact.agence,via:null};
  let best=null,len=0;
  l.forEach(c=>{const k=netCh(c.nom);
    const court=k.length<n.length?k:n;
    if(court.length<MIN_RAPPROCHE)return;
    if(k.length>len&&(n.indexOf(k)>=0||k.indexOf(n)>=0)){best={agence:c.agence,via:c.nom};len=k.length}});
  return best;
}
function agenceDeChantier(nom){const r=trouveChantier(nom);return r?r.agence:''}
/* agence effective d'un enregistrement : celle qu'il porte, sinon celle de son chantier */
function agDe(o,champ){return o.agence||agenceDeChantier(o[champ||'chantier'])}
/* filtre selon l'agence sélectionnée (Global = tout) */
function filtreAg(l,champ){return estGlobal()?l:(l||[]).filter(o=>agDe(o,champ)===agence)}
let conf = {webhook:'', secret:'', appareil:'', autoSync:true};
let vue = 'v-acc', ficheEnCours = null, typeFiche = '', zoneChoisie = '';
/* fiche d'incident : arbre des causes et plan d'actions en cours d'édition */
let fArbre = {pourquoi:[],causes:[]}, fPlan = [];

function webhookURL(){return conf.webhook||CONFIG.WEBHOOK_URL||''}
function estBranche(){return !!(webhookURL()&&conf.secret)}
function modeDemo(){return !webhookURL()&&!state._touche}

function load(){
  try{const r=localStorage.getItem(LS);if(r){const s=JSON.parse(r);if(s&&typeof s==='object')state=Object.assign(state,s)}}catch(e){}
  ['mensuel','incidents','remontees','se','objectifs','chantiers'].forEach(k=>{if(!Array.isArray(state[k]))state[k]=[]});
  if(!state.tomb)state.tomb={};
  if(!state.params)state.params={};
  try{const c=localStorage.getItem(LS_CONF);if(c)conf=Object.assign(conf,JSON.parse(c))}catch(e){}
  /* V3 (09/10/2026) : la zone HSE vit DANS l'intranet. Le code éditeur et le nom
     d'appareil sont ceux que l'intranet connaît déjà (ihse_conf_v2, même origine) :
     plus rien à brancher deux fois. L'intranet fait foi s'il a un secret. */
  try{const ci=JSON.parse(localStorage.getItem('ihse_conf_v2')||'{}');
    if(ci&&ci.webhook&&ci.secret){
      if(conf.webhook!==ci.webhook||conf.secret!==ci.secret||(!conf.appareil&&ci.appareil)){
        conf.webhook=ci.webhook;conf.secret=ci.secret;if(!conf.appareil)conf.appareil=ci.appareil||'';saveConf();}
    }}catch(e){}
  if(!state.mensuel.length&&!state.incidents.length&&!state._touche)semer();
  if(normaliserMensuel())save();
}
function save(){state._touche=true;try{localStorage.setItem(LS,JSON.stringify(state))}catch(e){toast('Mémoire pleine',true)}}
function saveConf(){try{localStorage.setItem(LS_CONF,JSON.stringify(conf))}catch(e){}}

/* semis : les vraies données 2026 reprises du classeur, pour démarrer plein */
function semer(){
  state.mensuel = SEED.mensuel.map(m=>Object.assign({maj:EPOCH},m));
  state.incidents = SEED.incidents.map((o,i)=>Object.assign({id:'i'+i,maj:EPOCH},o));
  state.remontees = SEED.remontees.map((o,i)=>Object.assign({id:'r'+i,maj:EPOCH},o));
  state.objectifs = SEED.objectifs.map((o,i)=>Object.assign({id:'o'+i,maj:EPOCH},o));
  state.se = [];
  state.chantiers = SEED.chantiers ? SEED.chantiers.slice() : [];
}
/* une ligne = un mois ET une agence. En Global on ne crée jamais de ligne :
   le Global est la somme des agences, pas une ligne de plus. */
function moisLigne(k,ag){
  const a=(ag===undefined)?agence:ag;
  let m=state.mensuel.find(x=>x.k===k&&(x.agence||'')===a);
  /* V3.3.4 : une ligne créée juste pour l'affichage porte une date « zéro » : elle ne
     peut jamais écraser au serveur une vraie ligne qui n'était pas encore arrivée ici.
     Elle prend une vraie date dès qu'on y saisit quelque chose (majMois). */
  if(!m){m={k:k,agence:a,mp:0,maj:EPOCH};state.mensuel.push(m)}
  if(m.mp===undefined||m.mp==='')m.mp=0;        // maladies pro : 0 par défaut, chaque mois
  return m;
}
const COLS_SOMME=['heures','effectif','accArret','accSans','benins','trajet','joursArret','mp',
  'vmsAuto','vmsMan','vms','vmsCd','vmsAd','dechetsT','accueilsAuto','accueilsMan','accueils','accueilsEmb','accueilsInt',
  'arrivants','interimaires','visites',
  'vigiAtt','vigiRecu','qhpEff','qhpPart','formationsAuto','formationsMan','formations'];
/* vue Global d'un mois : la somme des agences, calculée, jamais stockée */
function moisSomme(k){
  const l=state.mensuel.filter(x=>x.k===k);
  const m={k:k,agence:'',_calcule:true};
  COLS_SOMME.forEach(c=>{const v=l.reduce((s,x)=>s+n(x[c]),0);m[c]=v||''});
  let t=0,tv=0;
  l.forEach(x=>{const a=n(x.dechetsT),b=n(x.dechetsVal);if(a>0&&b>0){t+=a;tv+=a*b/100}});
  m.dechetsVal=t>0?Math.round(tv/t):'';
  return m;
}
function moisAnnee(){const out=[];
  for(let i=0;i<12;i++){const k=ANNEE+'-'+String(i+1).padStart(2,'0');
    out.push(estGlobal()?moisSomme(k):moisLigne(k))}
  return out.sort((a,b)=>a.k.localeCompare(b.k))}
/* les lignes qui traînent sans agence — ce qui reste à ventiler */
function moisNonRepartis(){return state.mensuel.filter(m=>!(m.agence||'')&&COLS_SOMME.some(c=>n(m[c])>0))}
function actifs(l){return (l||[]).filter(x=>!x.supprime)}

/* ==================== NAVIGATION ==================== */
let QHP=null, ACC_AUTO='';
let qhpGroupe=(function(){try{return localStorage.getItem('rep_qhp_groupe')||'secteur'}catch(e){return 'secteur'}})();
function setQhpGroupe(g){qhpGroupe=(g==='agence')?'agence':'secteur';
  try{localStorage.setItem('rep_qhp_groupe',qhpGroupe)}catch(e){}}

const ECRANS = [
  {id:'v-mensuel',t:'Mensuel',c:'var(--accent)',r:renderMensuel},
  {id:'v-acc',t:'Accidentologie',c:'var(--warn)',r:renderAcc},
  {id:'v-se',t:'Santé & Environnement',c:'var(--ok)',r:renderSE},
  {id:'v-flash',t:'Flashs SSE',c:'var(--accent)',r:renderFlash},
  {id:'v-obj',t:'Objectifs SSE',c:'var(--violet)',r:renderObj}
];
/* ---------- écran de correspondance chantier → agence ----------
   La liste est bâtie à partir des chantiers réellement rencontrés dans les
   remontées et les incidents : rien à taper, il n'y a qu'à affecter. */
function chantiersVus(){
  const vus={};
  const pose=(nom,src)=>{
    const n=netCh(nom);if(!n)return;
    if(!vus[n])vus[n]={nom:String(nom).trim(),n:0,src:{}};
    vus[n].n++;vus[n].src[src]=(vus[n].src[src]||0)+1;
  };
  actifs(state.remontees).forEach(r=>pose(r.chantier,'remontées'));
  actifs(state.incidents).forEach(i=>pose(i.lieu,'incidents'));
  chantiers().filter(c=>!c.supprime).forEach(c=>pose(c.nom,'table'));
  return Object.keys(vus).sort((a,b)=>vus[b].n-vus[a].n||a.localeCompare(b,'fr')).map(k=>vus[k]);
}
function ouvrirChantiers(){
  const l=chantiersVus();
  const nonAff=l.filter(c=>!agenceDeChantier(c.nom)).length;
  const auto=chantiers().filter(c=>!c.supprime&&c.agence&&c.origine!=='manuel').length;
  let h='<p class="hint">L’agence de chaque chantier est <b>lue dans le classeur Vigiminutes</b> à '+
        'chaque collecte — rien à saisir ici. Ce tableau montre le résultat, et permet de corriger '+
        'une exception : une correction faite ici n’est jamais écrasée par la collecte suivante.</p>'+
        '<p class="hint">'+l.length+' chantier'+(l.length>1?'s':'')+' · '+auto+' rattaché'+(auto>1?'s':'')+
        ' automatiquement'+(nonAff?' · <b style="color:var(--accent)">'+nonAff+' sans agence</b>':' · aucun en attente ✓')+'</p>'+
        (nonAff&&!auto?'<p class="hint" style="color:var(--accent)">⚠️ Aucun rattachement automatique : '+
          'la colonne « Agence » n’a pas été trouvée dans le classeur Vigiminutes, ou la collecte n’a pas encore tourné.</p>':'');
  l.forEach(c=>{
    const r=trouveChantier(c.nom), a=r?r.agence:'';
    const fiche=chantiers().find(x=>netCh(x.nom)===netCh(c.nom));
    const orig=fiche&&fiche.agence
      ? (fiche.origine==='manuel'?' · <i style="color:var(--accent)">corrigé à la main</i>'
                                 :' · <i style="color:var(--ok)">via Vigiminutes</i>')
      : '';
    const detail=Object.keys(c.src).map(x=>c.src[x]+' '+x).join(' · ')+orig+
      (r&&r.via?' · <i style="color:var(--accent)">rattaché via « '+esc(r.via)+' »</i>':'');
    h+='<div class="chx'+(a?'':' vide')+'"><span class="cn">'+esc(c.nom)+'</span>'+
       '<span class="cc">'+detail+'</span>'+
       '<select onchange="setChantier(this.value,\''+esc(c.nom).replace(/'/g,"\\'")+'\')">'+
       '<option value=""'+(a?'':' selected')+'>— à affecter —</option>'+
       AGENCES.map(x=>'<option value="'+x.code+'"'+(a===x.code?' selected':'')+'>'+x.code+' · '+esc(x.lib)+'</option>').join('')+
       '</select></div>';
  });
  document.getElementById('mc-corps').innerHTML=h;
  document.getElementById('m-ch').classList.add('open');
}
function setChantier(code,nom){
  const n=netCh(nom);
  let c=chantiers().find(x=>netCh(x.nom)===n);
  if(!c){c={nom:nom};chantiers().push(c)}
  c.agence=code;c.supprime=false;c.origine='manuel';c.maj=nowISO();
  save();ouvrirChantiers();rerendre();syncAuto();
}

function renderAgences(){
  const box=document.getElementById('agences');if(!box)return;
  const nr=moisNonRepartis().length
        + actifs(state.incidents).filter(i=>!agDe(i,'lieu')).length
        + actifs(state.remontees).filter(r=>!agDe(r)).length;
  let h='<button class="ag'+(estGlobal()?' on':'')+'" onclick="setAgence(\'\')">🏢 Global</button>';
  AGENCES.forEach(a=>{h+='<button class="ag'+(agence===a.code?' on':'')+'" onclick="setAgence(\''+a.code+'\')" title="'+esc(a.lib)+'">'+a.code+'</button>'});
  if(nr)h+='<span class="ag-nr" title="Lignes sans agence : elles comptent dans le Global mais dans aucune agence">⚠️ '+nr+' à ventiler</span>';
  h+='<button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="ouvrirChantiers()">🗺 Chantiers par agence</button>';
  box.innerHTML=h;
}
function setAgence(a){agence=a;rendreStable(()=>{renderAgences();rendreVue();banniere()})}

function renderOnglets(){
  document.getElementById('onglets').innerHTML = ECRANS.map(e=>
    '<button class="ong'+(vue===e.id?' on':'')+'" onclick="go(\''+e.id+'\')" style="'+(vue===e.id?'color:#003A6E':'')+'">'+
    '<span class="pt" style="background:'+e.c+';color:'+e.c+'"></span>'+esc(e.t)+'</button>').join('');
}
/* V3.3.4 — RE-RENDU STABLE (bugs signalés par le service HSE le 14/10) : chaque saisie
   redessinait tout l'écran, la synchro automatique 2,5 s plus tard le redessinait
   encore ET remontait la page en haut ; la case sur laquelle on venait de cliquer
   disparaissait (d'où « taper plusieurs fois »). Désormais :
   · le re-rendu garde la case active (et le curseur), le défilement de la page et
     celui des tableaux ;
   · il attend que le clic ou la tabulation soit fini (setTimeout 0) ;
   · la synchro ne redessine jamais pendant qu'on est dans une case : elle note
     qu'il faudra le faire et le fait quand on quitte les cases ;
   · seul un changement d'onglet remonte la page en haut. */
let aRafraichir=false, reRenduPrevu=false;
function caseActive(){const a=document.activeElement;return (a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.closest('main'))?a:null}
function cleCase(el,vueEl){
  if(!el)return null;
  if(el.dataset&&el.dataset.cle)return {cle:el.dataset.cle};
  if(el.id)return {id:el.id};
  const l=[...vueEl.querySelectorAll('input,select,textarea')];const i=l.indexOf(el);return i>=0?{idx:i}:null;
}
function retrouverCase(k,vueEl){
  if(!k)return null;
  if(k.cle)return vueEl.querySelector('[data-cle="'+CSS.escape(k.cle)+'"]');
  if(k.id)return document.getElementById(k.id);
  return vueEl.querySelectorAll('input,select,textarea')[k.idx]||null;
}
function rendreStable(fn){
  const vueEl=document.getElementById(vue)||document.querySelector('main');
  const a=caseActive(), k=a?cleCase(a,vueEl):null;
  let sel=null;try{if(a&&a.selectionStart!=null)sel=[a.selectionStart,a.selectionEnd]}catch(e){}
  const y=window.scrollY, x=window.scrollX;
  const sc=[...vueEl.querySelectorAll('.tbl-scroll,.tbl-wrap')].map(e=>[e.scrollLeft,e.scrollTop]);
  fn();
  const vueEl2=document.getElementById(vue)||vueEl;
  [...vueEl2.querySelectorAll('.tbl-scroll,.tbl-wrap')].forEach((e,i)=>{if(sc[i]){e.scrollLeft=sc[i][0];e.scrollTop=sc[i][1]}});
  window.scrollTo(x,y);
  const b=retrouverCase(k,vueEl2);
  if(b){try{b.focus({preventScroll:true});if(sel&&b.setSelectionRange)b.setSelectionRange(sel[0],sel[1])}catch(e){}}
}
function rendreVue(){const e=ECRANS.find(x=>x.id===vue);if(e)e.r();else if(vue==='v-reglages')renderReglages()}
/* après une saisie : on laisse le clic / la tabulation se terminer, puis on redessine en place */
function rerendre(){
  if(reRenduPrevu)return;reRenduPrevu=true;
  setTimeout(()=>{reRenduPrevu=false;rendreStable(()=>{renderAgences();rendreVue();banniere()})},0);
}
/* après une synchro : jamais pendant une saisie */
function rafraichirApresSynchro(){
  if(caseActive()||document.querySelector('.modal.open')){aRafraichir=true;return}
  aRafraichir=false;rendreStable(()=>{renderAgences();renderOnglets();rendreVue();banniere()});
}
document.addEventListener('focusout',()=>{setTimeout(()=>{if(aRafraichir&&!caseActive()&&!document.querySelector('.modal.open'))rafraichirApresSynchro()},400)});
function go(v){
  renderAgences();
  vue=v;
  document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(v); if(el)el.classList.add('active');
  renderOnglets();
  const e=ECRANS.find(x=>x.id===v);
  if(e)e.r(); else if(v==='v-reglages')renderReglages();
  banniere();
  window.scrollTo(0,0);
}
function banniere(){
  const b=document.getElementById('banniere');
  if(modeDemo())b.innerHTML='<div class="banner">🧪 <b>Données de démonstration</b> — ce sont tes vrais chiffres 2026 repris du classeur. Dès que tu modifies quelque chose, elles deviennent tes données de travail.</div>';
  else if(!estBranche())b.innerHTML='<div class="banner info">📌 Travail sur cet appareil uniquement. Renseigne la connexion (⚙️) pour partager avec l’intranet.</div>';
  else b.innerHTML='';
}

/* ==================== ÉCRAN 1 — MENSUEL ==================== */
/* ---------- LA RÈGLE DE BASCULE ----------
   Avant le mois de bascule, l'ancien reporting 2026 fait foi : tout est saisi (ou
   chargé) et rattaché à l'agence historique. À partir de la bascule, les outils
   font foi : l'accidentologie est comptée depuis le journal d'analyses, les
   accueils et formations arrivent en automatique (+ une colonne manuelle pour
   les fiches papier). La bascule est annoncée par le serveur ; à défaut 2026-09. */
let BASCULE='2026-09', AGENCE_HISTO='IDF';
function apresBascule(k){return String(k||'').slice(0,7)>=BASCULE}

/* ---------- les colonnes du mensuel, par thématique ----------
   Chaque colonne dit d'où elle vient :
   · auto:'bascule'  → saisie avant la bascule, automatique (🤖) à partir d'elle
   · auto:'vigi'     → idem, avec la date propre aux Vigiminutes (juillet 2026)
   · journal:true    → comptée depuis le journal d'analyses d'accident après la bascule
   · total:[a,b]     → calculée = a + b (jamais saisie)
   · calc:'…'        → pourcentage calculé
   · rien            → toujours saisie à la main
   Global n'est jamais saisi : c'est la somme des agences. */
let VIGI_AUTO='2026-07';           // à partir de ce mois, les Vigiminutes viennent du classeur, par agence
const GROUPES=[
  {id:'rh',   t:'Indicateurs',        c:'#74ccef'},
  {id:'acc',  t:'Accidentologie',     c:'#ff8f85'},
  {id:'anim', t:'Animation HSE',      c:'#ffcf5c'},
  {id:'arr',  t:'Nouveaux arrivants', c:'#a9e8c6'},
  {id:'env',  t:'Environnement',      c:'#c4a6f0'}
];
const COLS=[
  {k:'heures',t:'Heures travaillées',g:'rh',large:true},{k:'effectif',t:'Effectif moyen',g:'rh'},
  {k:'accArret',t:'AT avec arrêt',g:'acc',journal:true},{k:'accSans',t:'AT sans arrêt',g:'acc',journal:true},
  {k:'benins',t:'AT bénins',g:'acc',journal:true},{k:'trajet',t:'AT trajet',g:'acc',journal:true},
  {k:'joursArret',t:'Jours d’arrêt',g:'acc'},{k:'mp',t:'Maladies pro',g:'acc',defaut:0},
  {k:'qhpEff',t:'QHP effectif',g:'anim',auto:'bascule'},{k:'qhpPart',t:'QHP participants',g:'anim',auto:'bascule'},
  {k:'pq',t:'% QHP',g:'anim',calc:['qhpPart','qhpEff']},
  {k:'vigiAtt',t:'Vigi. attendues',g:'anim',auto:'vigi'},{k:'vigiRecu',t:'Vigi. reçues',g:'anim',auto:'vigi'},
  {k:'pv',t:'% Vigi',g:'anim',calc:['vigiRecu','vigiAtt']},
  {k:'vmsAuto',t:'VMS digital',g:'anim',auto:'bascule'},{k:'vmsMan',t:'VMS papier',g:'anim'},
  {k:'vms',t:'VMS total',g:'anim',total:['vmsAuto','vmsMan'],gras:true},
  {k:'vmsCd',t:'CD',tt:'VMS · conditions dangereuses',g:'anim',auto:'bascule',petit:true},
  {k:'vmsAd',t:'AD',tt:'VMS · actes dangereux',g:'anim',auto:'bascule',petit:true},
  {k:'visites',t:'Visites (CR)',g:'anim',auto:'bascule'},
  {k:'arrivants',t:'Nouveaux arrivants',g:'arr',defautDe:'accueilsEmb'},
  {k:'interimaires',t:'Nouveaux intérimaires',g:'arr',defautDe:'accueilsInt'},
  {k:'accueilsAuto',t:'Accueils digital',g:'arr',auto:'bascule'},{k:'accueilsMan',t:'Accueils papier',g:'arr'},
  {k:'accueils',t:'Accueils total',g:'arr',total:['accueilsAuto','accueilsMan'],gras:true},
  {k:'formationsAuto',t:'Fiches formation digital',g:'arr',auto:'bascule'},{k:'formationsMan',t:'Fiches formation papier',g:'arr'},
  {k:'formations',t:'Fiches formation total',g:'arr',total:['formationsAuto','formationsMan'],gras:true},
  {k:'dechetsT',t:'Déchets (t)',g:'env'},{k:'dechetsVal',t:'Valorisé (%)',g:'env'}
];
// compatibilité : COLM = colonnes saisissables, COLM_AUTO = colonnes qui viennent des outils
const COLM=COLS.filter(c=>!c.calc&&!c.total&&!c.auto), COLM_AUTO=COLS.filter(c=>c.auto||c.total);
function debutAuto(c){return c.auto==='vigi'?VIGI_AUTO:BASCULE}
/* ce que la case (colonne × mois) est : 'calc' · 'total' · 'auto' (🤖) · 'saisie' */
function modeCase(c,mk){
  if(c.calc)return 'calc';
  if(c.total)return 'total';
  if(c.journal)return apresBascule(mk)?'auto':'saisie';
  if(c.auto)return String(mk).slice(0,7)>=debutAuto(c)?'auto':'saisie';
  return 'saisie';
}
function libCol(k){const c=COLS.find(x=>x.k===k);return c?(c.tt||c.t):k}
function sourceAuto(c){
  if(c.auto==='vigi')return 'le classeur Reporting Vigiminutes';
  if(/^qhp/.test(c.k))return 'l’appli Suivi QHP';
  if(/^accueils/.test(c.k))return 'le registre des accueils';
  if(/^formations/.test(c.k))return 'le registre des fiches de formation';
  if(c.k==='visites')return 'le classeur CR Observations';
  if(/^vms/.test(c.k))return 'le classeur VMS';
  return 'tes outils';
}
/* ---------- notes et doutes sur les indicateurs ----------
   Ce que l'outil sait de chaque indicateur (d'où il vient, depuis quand) et ce dont
   je ne suis pas sûr — directement dans l'écran de saisie, pas dans un inventaire à
   part. Un doute porte un identifiant : « ✓ Vu » le range (mémorisé sur cet appareil). */
const NOTES_COL = [
  [['heures'],{src:'Paie — exports « occupation » (horaire = heures pointées, forfait = jours × 7 h)',
    txt:'Janvier→juin : le total de l’ancien reporting est conservé ; NA et BPL sont calculées depuis les exports, IDF = le reste. Juillet→août : IDF vient des exports, en orange (à vérifier). Depuis septembre : à saisir par agence.',
    doute:{id:'heures-erp',txt:'L’ERP sort du reporting les collaborateurs sortis de l’effectif : les exports sous-estiment le total (≈ 1 300 h/mois de moins que ton reporting). Juillet et août sont donc probablement un peu bas — à corriger si tu as le vrai total.'}}],
  [['effectif'],{src:'Paie — exports « occupation » : présents dans le mois (congés compris)',
    txt:'Même règle que les heures : janvier→juin, l’effectif de l’ancien reporting est conservé, NA et BPL comptés depuis les exports, IDF = le reste. Juillet→août : IDF depuis les exports, en orange.',
    doute:{id:'effectif-auto',txt:'Le roster QHP porte l’agence de chaque personne : je peux l’automatiser si tu veux — dis-le moi.'}}],
  [['accArret','accSans','benins','trajet'],{src:'Journal d’analyses d’accident — onglet ACCIDENTS (agence, date, type, zone, jours d’arrêt…)',dep:'sept. 2026',
    txt:'Comptés par mois et par agence depuis la bascule — plus de saisie. L’agence, la date et le type viennent de la fiche ACCIDENTS ; les actions RETEX s’y rattachent par la personne. Avant : ancien reporting, IDF ; juillet-août comptés depuis les fiches, en orange.',
    doute:{id:'acc-doublon',txt:'Un accident de juillet est saisi deux fois dans l’onglet ACCIDENTS (deux rapports d’analyse pour le même événement) : une seule fiche est gardée, complétée par les deux. Supprime la ligne en trop si tu veux un journal propre.'}}],
  [['joursArret'],{src:'Saisie',txt:'Le journal donne les jours d’arrêt par accident, pas par mois : à saisir (un arrêt qui court sur plusieurs mois se répartit à la main).',
    doute:{id:'jours-double',txt:'Avril→juin affichaient le double (40 / 62 / 60) : une ligne « sans agence » de l’ancien format s’ajoutait à la ligne IDF dans le Global. Ces lignes sont maintenant versées dans IDF — vérifie que tu retrouves 20 / 31 / 30.'}}],
  [['mp'],{src:'Saisie',txt:'0 par défaut chaque mois. Affiché dans Santé sur l’intranet.'}],
  [['arrivants'],{src:'Saisie — par défaut = accueils d’embauchés',
    txt:'Embauchés + stagiaires + alternants. Posé automatiquement depuis les accueils, orange tant que tu ne l’as pas saisi ; une saisie le confirme et n’est jamais écrasée.'}],
  [['interimaires'],{src:'Saisie — par défaut = accueils d’intérimaires',txt:'Même mécanique que les nouveaux arrivants.'}],
  [['formationsAuto','formationsMan','formations'],{src:'Digital : registre Formations (fiches terminées) depuis sept., saisie avant · papier : saisie',dep:'sept. 2026',txt:'Même mécanique que les accueils : total = digital + papier.',
    doute:{id:'form-agence',txt:'Le registre ne porte pas l’agence : je la déduis du roster QHP (nom du collaborateur) ; un nom absent du roster tombe en « non réparti ». Le métier (activité) de chaque fiche est bien dans le registre — je peux ventiler par métier si tu veux.'}}],
  [['dechetsT','dechetsVal'],{src:'Saisie',txt:'Tonnage et part valorisée. Aucun historique 2026 : ça démarre maintenant.'}],
  [['vigiAtt','vigiRecu'],{src:'Janvier→juin : ancien reporting 2026 sur IDF, par défaut · depuis juillet : classeur Reporting Vigiminutes (SYNTHÈSE MENSUELLE), par agence',dep:'juil. 2026',
    txt:'Les six premiers mois sont en orange : ce sont les chiffres de l’ancien reporting, saisir la case les confirme. Depuis juillet, les blocs IDF / NA / BPL du classeur remplissent les cases 🤖.'}],
  [['qhpEff','qhpPart'],{src:'Janvier→mai : ancien reporting 2026 sur IDF · depuis septembre : appli Suivi QHP (roster + présences), par agence',dep:'sept. 2026',
    txt:'Juin, juillet et août sont vides dans l’ancien reporting. Les 14 fiches QHP de juin à septembre sont reprises dans l’appli Suivi QHP : elles alimentent les deux tableaux de l’intranet (par conducteur de travaux, par collaborateur) mais PAS ces deux cases, protégées par la bascule.',
    doute:{id:'qhp-juin-aout',txt:'Les 14 fiches de juin→septembre ne touchent que 12, 12, 8 puis 3 collaborateurs sur 116 — environ 10 % de participation, contre 80 % en janvier→mai. Soit la participation a vraiment chuté cet été, soit toutes les fiches papier ne sont pas numérisées. Quand tu auras tranché : propriété QHP_AUTO = 2026-06 dans le script pour que juin→août remontent ici aussi.'}}],
  [['vmsAuto','vmsMan','vms','vmsCd','vmsAd'],{src:'Digital : classeur VMS (une ligne par observation, colonne Agence) depuis sept., saisie avant · papier : saisie · CD / AD : classeur VMS depuis sept.',dep:'sept. 2026',
    txt:'Même mécanique que les accueils : total (en gras) = digital + papier. Une visite = un n° de VMS ; CD et AD comptent les observations « Condition dangereuse » / « Acte dangereux » de l’appli, par agence (colonne Agence, sinon le chantier). Janvier→août : tes VMS saisies sont passées en digital.',
    doute:{id:'vms-aout-na',txt:'Tes VMS de juillet-août sont remises (Sarcelles 27/07 : 6 CD, 3 AD ; Tourbière de Pérols-sur-Vézère 28/08 : 2 CD), sur IDF comme tu les avais saisies. Celle du 28/08 (Corrèze) est sans doute NA : la case porte un ⚠️. Les CD / AD des VMS papier ne sont comptées nulle part — dis-moi si tu veux aussi une colonne papier pour elles.'}}],
  [['accueilsAuto','accueilsMan','accueils'],{src:'Digital : janvier→août les 47 fiches d’accueil PDF transcrites, depuis sept. le registre Accueils (colonne Agence CDES) · papier : saisie',dep:'sept. 2026',
    txt:'Total = digital + papier, recalculé à chaque saisie. Le registre distingue embauchés et intérimaires : c’est ce qui pose les valeurs par défaut des nouveaux arrivants et intérimaires.',
    doute:{id:'juin-bpl',txt:'Juin BPL : 4 intérimaires rattachés à BPL d’après le lieu (Suscinio, Trignac), pas d’après une agence écrite — à confirmer. La case est marquée ⚠️ dans le tableau.'}}],
  [['visites'],{src:'Classeur CR Observations — visites distinctes (n° + date + chantier), colonne Agence du classeur, sinon le chantier',dep:'sept. 2026',txt:'Avant : ancien reporting, IDF.',
    doute:{id:'cr-agence',txt:'Ta colonne Agence est encore vide sur les CR déjà saisis : tant qu’elle l’est, l’agence vient du chantier (table des chantiers, alimentée par les Vigiminutes) ; un chantier inconnu tombe en « non réparti » — à corriger dans 🗺 Chantiers ou dans la colonne.'}}]
];
const NOTES_ECRAN = {
  'v-acc':[
    {t:'Incidents',src:'Journal d’analyses d’accident',dep:'données 2026',
     txt:'Créés automatiquement, dédoublonnés sur date + chantier + personne. Un incident supprimé ici ne revient pas.',
     doute:{id:'acc-completer',txt:'La fiche ACCIDENTS ne porte ni la typologie de risque ni la cause fondamentale : les fiches créées depuis l’onglet sans rapport d’analyse restent à compléter ici ; celles qui ont un rapport d’analyse sont déjà remplies. Le % d’événements analysés compte les fiches avec un arbre des causes ou typologie + cause.'}},
    {t:'Agence d’un incident',src:'Colonne Agence de l’onglet ACCIDENTS ; sinon le chantier (table des chantiers)',
     txt:'La fiche complète ce qui est vide dans l’appli (zone, blessure, HIPO, jours d’arrêt…) sans jamais écraser ce que tu as corrigé ici.',
     doute:{id:'acc-doublon'}},
    {t:'Actions correctives : total, faites, en retard',src:'Journal d’analyses (actions rattachées)',dep:'données 2026',txt:'Plus aucune saisie.'}
  ],
  'v-rem':[
    {t:'Remontées terrain',src:'Classeur Vigiminutes — onglet Agence · Type · Domaine · Statut',dep:'toute l’année 2026',
     txt:'Créées si absentes, jamais écrasées. Janvier→juin : l’agence vient du chantier (🗺 Chantiers, Arcachon → NA). Depuis juillet : la colonne Agence du classeur fait foi, par agence.',
     doute:{id:'rem-statut',txt:'Le statut vient de l’appli Vigiminutes. Si tu le changes ici, la collecte suivante ne le remet pas — mais l’appli Vigiminutes, elle, ne le saura pas.'}},
    {t:'Situations dangereuses — tous outils',src:'Vigi SD + VMS conditions dangereuses + VMS actes dangereux',
     doute:{id:'sd-actes',txt:'J’ai compté les actes dangereux des VMS dans le total. Dis-moi si tu ne veux que les conditions.'}}
  ],
  'v-se':[
    {t:'Campagnes · sensibilisations · événements environnementaux',src:'Saisie ici, par agence',
     txt:'Comptés par l’intranet : une ligne = une action, quel que soit le nombre de personnes concernées.'}
  ],
  'v-flash':[
    {t:'Flashs Sécurité · Santé · Environnement · RETEX',src:'Saisie ici',
     txt:'Un flash = une ligne, commun à toutes les agences. Le comptage annuel remplace la saisie dans Réglages.'}
  ],
  'v-obj':[
    {t:'Objectifs SSE',src:'Saisie ici — 4 lignes automatiques, 19 saisies au mois',txt:'Bilan par trimestre ; les trimestres à venir n’ont pas de bilan.',
     doute:{id:'obj-cibles',txt:'3 cibles restent à poser : objectifs 4, 12 et 13 (« cible à poser » dans la fiche).'}}
  ],
  'v-reglages':[
    {t:'Certification MASE',src:'Rapport d’audit PDF + certificat PDF',dep:'V20',
     txt:'Extraction automatique : note, cinq axes, agence, n° et dates de validité — vérifiée sur tes PDF, corrigeable à la main. Une seule agence certifiée : le MASE reste global.'},
    {t:'Objectif mensuel de VMS · taux de conformité réglementaire · points du mois',src:'Saisie ici',txt:'Restent en global.'},
    {t:'Postes couverts par une fiche de formation',src:'—',
     doute:{id:'postes-fiches',txt:'Pas branché : le collecteur ne remonte pas le libellé du poste. Prévu, pas fait — à confirmer si tu y tiens.'}}
  ]
};
const DOUTES_CASES=[{k:'2026-06',ag:'BPL',champ:'accueilsAuto',id:'juin-bpl',txt:'4 intérimaires rattachés à BPL d’après le lieu — à confirmer'},
  {k:'2026-08',ag:'IDF',champ:'vmsAuto',id:'vms-aout-na',txt:'VMS du 28/08 à la Tourbière de Pérols-sur-Vézère : NA plutôt qu’IDF ?'}];
function noteCol(k){
  const e=NOTES_COL.find(x=>x[0].indexOf(k)>=0);
  if(!e)return null;
  return Object.assign({t:libCol(k)},e[1]);
}
function douteTexte(id){
  // un doute cité dans plusieurs écrans est écrit une seule fois : on va le chercher
  let t='';NOTES_COL.forEach(x=>{if(x[1].doute&&x[1].doute.id===id&&x[1].doute.txt)t=x[1].doute.txt});
  if(!t)Object.keys(NOTES_ECRAN).forEach(v=>NOTES_ECRAN[v].forEach(x=>{if(x.doute&&x.doute.id===id&&x.doute.txt)t=x.doute.txt}));
  return t;
}
function douteVu(id){return (conf.doutesVus||[]).indexOf(id)>=0}
function marquerDoute(id,vu){
  const l=(conf.doutesVus||[]).filter(x=>x!==id);
  conf.doutesVus=vu?l.concat([id]):l;saveConf();closeModal();rerendre();
}
function notesDe(ecran){
  if(ecran==='v-mensuel'){
    return NOTES_COL.map(e=>Object.assign({t:e[0].map(libCol).join(' · ')},e[1]));
  }
  return NOTES_ECRAN[ecran]||[];
}
function htmlNote(nt){
  let h='<div class="ni'+(nt.doute&&!douteVu(nt.doute.id)?' doute':'')+'"><b>'+esc(nt.t)+'</b>'+
    '<span class="src">'+esc(nt.src||'')+(nt.dep?' · <i>depuis '+esc(nt.dep)+'</i>':'')+'</span>'+
    (nt.txt?'<p>'+esc(nt.txt)+'</p>':'');
  if(nt.doute){
    const id=nt.doute.id, vu=douteVu(id);
    h+='<p class="dt'+(vu?' vu':'')+'">'+(vu?'✓ ':'⚠️ ')+esc(douteTexte(id))+' '+
       (vu?'<button class="btn btn-ghost btn-xs" onclick="marquerDoute(\''+id+'\',false)" title="Remettre ce doute en avant">↺</button>'
          :'<button class="btn btn-ghost btn-xs" onclick="marquerDoute(\''+id+'\',true)">✓ Vu</button>')+'</p>';
  }
  return h+'</div>';
}
const notesOuvertes={};
function panneauNotes(ecran){
  const l=notesDe(ecran);if(!l.length)return '';
  const ids=[];l.forEach(nt=>{if(nt.doute&&ids.indexOf(nt.doute.id)<0)ids.push(nt.doute.id)});
  const ouverts=ids.filter(id=>!douteVu(id)).length;
  // en tête : les doutes, compacts ; en dessous, repliées, les notes sur chaque indicateur
  let d='';
  ids.forEach(id=>{
    const nt=l.find(x=>x.doute&&x.doute.id===id), vu=douteVu(id);
    d+='<div class="dl'+(vu?' vu':'')+'"><span>'+(vu?'✓':'⚠️')+' <b>'+esc(nt.t)+'</b> — '+esc(douteTexte(id))+'</span>'+
       (vu?'<button class="btn btn-ghost btn-xs" onclick="marquerDoute(\''+id+'\',false)" title="Remettre ce doute en avant">↺</button>'
          :'<button class="btn btn-ghost btn-xs" onclick="marquerDoute(\''+id+'\',true)">✓ Vu</button>')+'</div>';
  });
  /* V3.3.4 : replié par défaut (il mangeait la page) ; l'état ouvert est retenu */
  return '<details class="notes"'+(notesOuvertes[ecran]?' open':'')+' ontoggle="notesOuvertes[\''+ecran+'\']=this.open"><summary>💬 Mes doutes sur ces indicateurs'+
    (ouverts?' <span class="nb">'+ouverts+' à trancher</span>':(ids.length?' <span class="nb ok">tout vu ✓</span>':' <span class="nb ok">aucun</span>'))+'</summary>'+
    (d?'<div class="dls">'+d+'</div>':'')+
    '<details class="sub"><summary>D’où vient chaque chiffre, depuis quand ('+l.length+' notes)</summary>'+
    '<div class="nl">'+l.map(htmlNote).join('')+'</div></details></details>';
}
function voirNote(k){
  const nt=noteCol(k);if(!nt)return;
  document.getElementById('mn-titre').textContent=nt.t;
  document.getElementById('mn-corps').innerHTML=htmlNote(nt);
  document.getElementById('m-note').classList.add('open');
}
function douteCase(mk,champ){
  const d=DOUTES_CASES.find(x=>x.k===mk&&x.champ===champ&&(estGlobal()||agence===x.ag));
  return d&&!douteVu(d.id)?d:null;
}
function renderMensuel(){
  const rows=moisAnnee();
  const S=k=>rows.reduce((s,m)=>s+n(m[k]),0);
  const H=S('heures'), AA=S('accArret'), JA=S('joursArret');
  const tf=H?Math.round(AA*1e6/H*100)/100:0, tg=H?Math.round(JA*1000/H*100)/100:0;
  /* En Global, les lignes sont la SOMME des agences : on les affiche, on ne les
     saisit pas — sinon on écraserait une ventilation par un total. */
  const lecture=estGlobal();
  let h='<div class="barre"><h2>📅 Saisie mensuelle '+ANNEE+(lecture?'':' — '+esc(agLib(agence)))+'</h2>'+
    '<span class="p '+(lecture?'cyan':'gris')+'">'+(lecture
       ?'Vue Global : somme des agences, en lecture seule — choisis une agence pour saisir'
       :'Une thématique par bloc — les cases 🤖 se remplissent toutes seules')+'</span>'+
    '<div class="droite"><button class="btn btn-ghost btn-sm" onclick="window.print()">🖨</button></div></div>';
  h+='<div class="legende-couleurs">'+
    '<span class="lc auto">🤖 automatique — depuis les outils</span>'+
    '<span class="lc defaut">par défaut — à vérifier</span>'+
    '<span class="lc acompleter">à compléter</span>'+
    '<span class="lc saisi">saisi</span>'+
    '<span class="lc total">total calculé</span>'+
    '<span class="lc doute">⚠️ doute à trancher</span></div>';
  h+=panneauNotes('v-mensuel');
  h+='<div class="kpis" style="margin-bottom:14px">'+
    kpi(H.toLocaleString('fr-FR'),'Heures travaillées')+
    kpi(AA,'AT avec arrêt',AA>0?'bad':'good')+
    kpi(JA,'Jours d’arrêt')+
    kpi(String(tf).replace('.',','),'Taux de fréquence')+
    kpi(String(tg).replace('.',','),'Taux de gravité')+'</div>';
  // en-tête cliquable : ℹ ouvre la note de la colonne, ⚠️ signale un doute pas encore vu
  const th=c=>{const nt=noteCol(c.k), d=nt&&nt.doute&&!douteVu(nt.doute.id);
    const cls=['g-'+c.g,c.large?'heures':'',c.petit?'petit':'',c.calc?'calc':''].filter(Boolean).join(' ');
    return '<th class="'+cls+'" style="text-align:right">'+(nt
      ?'<button class="thn'+(d?' doute':'')+'" onclick="voirNote(\''+c.k+'\')" title="'+esc((c.tt?c.tt+' — ':'')+(nt.src||''))+(d?' — ⚠️ un doute à trancher':'')+'">'+esc(c.t)+'<i>'+(d?'⚠️':'ℹ')+'</i></button>'
      :'<span'+(c.tt?' title="'+esc(c.tt)+'"':'')+'>'+esc(c.t)+'</span>')+'</th>'};
  // ligne des thématiques : une cellule fusionnée par groupe, dans sa couleur
  let grp='';
  GROUPES.forEach(g=>{const nb=COLS.filter(c=>c.g===g.id).length;
    grp+='<th class="grp g-'+g.id+'" colspan="'+nb+'" style="--gc:'+g.c+'">'+esc(g.t)+'</th>'});
  h+='<div class="card"><div class="tbl-scroll"><table class="uni mensuel"><thead>'+
     '<tr class="grps"><th></th>'+grp+'</tr>'+
     '<tr><th>Mois</th>'+COLS.map(th).join('')+'</tr></thead><tbody>';
  const fmt=v=>(v===undefined||v===''||v===null)?'—':(isNaN(Number(v))?esc(String(v)):Number(v).toLocaleString('fr-FR'));
  const pct=(m,c)=>{const a=n(m[c.calc[1]]);return a?Math.round(n(m[c.calc[0]])/a*100)+' %':'—'};
  rows.forEach(m=>{
    h+='<tr><td><b>'+MOIS_L[Number(m.k.slice(5,7))-1]+'</b></td>';
    COLS.forEach(c=>{
      const mode=modeCase(c,m.k);
      const base='g-'+c.g+(c.petit?' petit':'')+(c.large?' heures':'');
      const d=douteCase(m.k,c.k);   // ⚠️ une case dont je ne suis pas sûr
      const flag=d?'<i>⚠️</i>':'';
      const dAttr=d?' title="'+esc(d.txt)+'"':'';
      if(mode==='calc'){h+='<td class="calc '+base+'">'+pct(m,c)+'</td>';return}
      if(mode==='total'){h+='<td class="num total '+base+(d?' doute':'')+'"'+dAttr+'><b>'+fmt(m[c.k])+'</b>'+flag+'</td>';return}
      if(mode==='auto'){
        // 🤖 : la case vient d'un outil — vide tant que la date n'est pas passée ou que la collecte n'a pas tourné
        const src=c.journal?'Compté depuis le journal d’analyses d’accident':'Recopié depuis '+esc(sourceAuto(c));
        h+='<td class="num auto '+base+(d?' doute':'')+'" title="'+(d?esc(d.txt):src)+'">'+fmt(m[c.k])+'<i>🤖</i>'+flag+'</td>';return}
      // saisie
      const vide=(m[c.k]===undefined||m[c.k]==='');
      const def=estDefaut(m,c.k);
      // code couleur : 🟠 par défaut, à vérifier · ⚪ à compléter · saisi
      const cls=def?'defaut':(vide?'acompleter':'saisi');
      const titre=def?'Valeur par défaut'+(c.defautDe?' (= '+esc(libCol(c.defautDe))+')':' (ancien reporting 2026)')+' — à vérifier, saisir pour confirmer'
                 :(vide?'À compléter':'');
      if(lecture){h+='<td class="num '+base+(def?' defaut':'')+'">'+(c.gras?'<b>'+fmt(m[c.k])+'</b>':fmt(m[c.k]))+'</td>';return}
      h+='<td class="'+cls+' '+base+(d?' doute':'')+'"'+dAttr+'><input class="'+cls+(c.gras?' gras':'')+'" data-cle="'+m.k+'|'+c.k+'" inputmode="decimal" title="'+(d?esc(d.txt):titre)+'" value="'+(vide?'':esc(m[c.k]))+'" onchange="majMois(\''+m.k+'\',\''+c.k+'\',this.value)">'+flag+'</td>';
    });
    h+='</tr>';
  });
  h+='<tr class="tot"><td><b>TOTAL</b></td>';
  COLS.forEach(c=>{
    if(c.calc){const a=S(c.calc[1]);h+='<td class="calc g-'+c.g+'">'+(a?Math.round(S(c.calc[0])/a*100)+' %':'—')+'</td>';return}
    h+='<td class="num g-'+c.g+(c.petit?' petit':'')+'"><b>'+(S(c.k)||0).toLocaleString('fr-FR')+'</b></td>'});
  h+='</tr></tbody></table></div>';
  const moisL=k=>MOIS_L[Number(k.slice(5,7))-1]+' '+k.slice(0,4);
  h+='<p class="hint" style="margin-top:10px">🤖 Une case robot vient d’un outil : QHP, accueils et fiches de formation digitales, VMS digitales (avec CD / AD), visites (CR) et accidentologie (journal d’analyses) depuis <b>'+esc(moisL(BASCULE))+'</b> ; '+
    'Vigiminutes depuis <b>'+esc(moisL(VIGI_AUTO))+'</b> (classeur Reporting Vigiminutes, par agence). Elle reste vide (—) tant que le mois n’est pas passé ou que la collecte de nuit n’a pas tourné. '+
    'Avant ces dates, tout se saisit ici — les chiffres de l’ancien reporting 2026 sont rattachés à '+esc(AGENCE_HISTO)+', en orange quand ils sont posés par défaut. '+
    'Toujours à toi : heures, effectif, jours d’arrêt, maladies pro (0 par défaut), VMS papier, nouveaux arrivants, accueils et fiches papier, déchets.</p></div>';
  document.getElementById('v-mensuel').innerHTML=h;
}
/* ---------- valeurs par défaut, à vérifier ----------
   Une case « par défaut » a été remplie par l'outil à partir d'une autre donnée
   (ex. nouveaux arrivants = accueils d'embauchés). Elle reste marquée orange tant
   que le service HSE ne l'a pas saisie lui-même — la saisir lève la marque. */
function defautsDe(m){
  if(Array.isArray(m.defauts))return m.defauts;
  if(typeof m.defauts==='string'&&m.defauts){try{const j=JSON.parse(m.defauts);if(Array.isArray(j))return j}catch(e){}}
  return [];
}
function estDefaut(m,c){return defautsDe(m).indexOf(c)>=0}
function poserDefauts(m){
  const d=defautsDe(m).slice();
  COLM.forEach(c=>{
    if(!c.defautDe)return;
    const src=m[c.defautDe];
    if(src===undefined||src==='')return;
    const vide=(m[c.k]===undefined||m[c.k]==='');
    if(!vide&&d.indexOf(c.k)<0)return;             // saisi à la main : on ne touche pas
    m[c.k]=n(src);
    if(d.indexOf(c.k)<0)d.push(c.k);
  });
  m.defauts=d;
}
/* Remise d'aplomb du mensuel après chargement, synchro ou restauration :
   – une ligne SANS agence d'avant la bascule (ancien format) est versée dans l'agence
     historique — règle du service HSE : l'historique est IDF. Une case vide y reçoit la valeur,
     une case déjà renseignée est gardée. Sinon elle s'ajoutait à la ligne IDF dans le Global
     et doublait les chiffres (40 jours d'arrêt en avril au lieu de 20) ;
   – VMS : l'ancienne colonne unique « vms » devient le digital quand ni digital ni papier
     n'est renseigné, puis le total est recalculé. */
function normaliserMensuel(){
  const histo=AGENCE_HISTO||'IDF';
  const parKA={},garde=[];let change=false;
  const vide=v=>v===undefined||v===null||v==='';
  state.mensuel.forEach(m=>{if(m.agence)parKA[m.k+'|'+m.agence]=m});
  state.mensuel.forEach(m=>{
    if(m.agence||!/^\d{4}-\d{2}$/.test(String(m.k))||apresBascule(m.k)){garde.push(m);return}
    const cible=parKA[m.k+'|'+histo];
    change=true;
    if(!cible){m.agence=histo;parKA[m.k+'|'+histo]=m;garde.push(m);return}
    Object.keys(m).forEach(c=>{if(['k','agence','maj','defauts'].indexOf(c)>=0)return;if(vide(cible[c])&&!vide(m[c]))cible[c]=m[c]});
    const dC=defautsDe(cible).slice();defautsDe(m).forEach(d=>{if(dC.indexOf(d)<0&&cible[d]===m[d])dC.push(d)});cible.defauts=dC;
    if(String(m.maj||'')>String(cible.maj||''))cible.maj=m.maj;
  });
  if(change)state.mensuel=garde;
  state.mensuel.forEach(m=>{
    if(vide(m.vmsAuto)&&vide(m.vmsMan)&&!vide(m.vms)){m.vmsAuto=n(m.vms);m.maj=nowISO();change=true}
    const avant=m.vms;totauxMois(m);if(String(avant)!==String(m.vms)){m.maj=nowISO();change=true}
  });
  return change;
}
/* accueils, formations et VMS : total = digital + papier, tous les mois (avant la bascule le
   digital est saisi, après il vient des outils) */
function totauxMois(m){
  COLS.filter(c=>c.total).forEach(c=>{const t=[c.k].concat(c.total);
    const a=m[t[1]],b=m[t[2]];
    if((a===undefined||a==='')&&(b===undefined||b===''))return;
    m[t[0]]=n(a)+n(b);
  });
}
function majMois(k,champ,val){
  const m=moisLigne(k);
  m[champ]=(val===''?'':n(val));
  // une saisie lève la marque « par défaut » sur cette case
  const d=defautsDe(m).filter(x=>x!==champ);m.defauts=d;
  totauxMois(m);
  poserDefauts(m);
  m.maj=nowISO();
  save();rerendre();syncAuto();
}
function kpi(v,l,cls){return '<div class="kpi '+(cls||'')+'"><div class="v">'+v+'</div><div class="l">'+esc(l)+'</div></div>'}

/* ==================== ÉCRAN 2 — ACCIDENTOLOGIE ==================== */
function renderAcc(){
  /* filtré sur l'agence sélectionnée */
  let inc=filtreAg(actifs(state.incidents),'lieu');   // découpage par agence
  const tous=inc;
  if(zoneChoisie)inc=inc.filter(i=>(i.zone||zoneDepuisTexte(i.zoneTexte))===zoneChoisie);
  const cpt=t=>inc.filter(i=>String(i.type||'').toLowerCase().indexOf(t)>=0).length;
  const rows=moisAnnee(), H=rows.reduce((s,m)=>s+n(m.heures),0);
  const AA=inc.filter(i=>/avec arr/i.test(i.type||'')).length;
  const JA=rows.reduce((s,m)=>s+n(m.joursArret),0)||inc.reduce((s,i)=>s+n(i.joursArret),0);
  const tf=H?Math.round(AA*1e6/H*100)/100:0, tg=H?Math.round(JA*1000/H*100)/100:0;
  let h='<div class="barre"><h2>🚨 Accidentologie '+ANNEE+'</h2>'+
    '<div class="droite"><button class="btn btn-accent" onclick="ouvrirFiche(\'incident\')">＋ Déclarer un incident</button></div></div>';
  h+=panneauNotes('v-acc');
  h+='<div class="kpis" style="margin-bottom:14px">'+
    kpi(AA,'AT avec arrêt',AA>0?'bad':'good')+
    kpi(cpt('sans arr'),'AT sans arrêt','mid')+
    kpi(cpt('bénin')+cpt('benin'),'AT bénins')+
    kpi(cpt('presqu'),'Presqu’accidents','cyan')+
    kpi(String(tf).replace('.',','),'Taux de fréquence')+
    kpi(String(tg).replace('.',','),'Taux de gravité')+'</div>';
  h+='<div class="grille g3">';
  // --- bonhomme ---
  const parZone={};tous.forEach(i=>{const z=i.zone||zoneDepuisTexte(i.zoneTexte);if(z&&z!=='aucune')parZone[z]=(parZone[z]||0)+1});
  h+='<div class="card"><h2>🧍 Zones lésées</h2>'+bonhommeCDES(parZone,{cliquable:true,selection:zoneChoisie,hauteur:400})+
     (Object.keys(parZone).length?'<div style="text-align:center;margin-top:8px">'+
       Object.keys(parZone).sort((a,b)=>parZone[b]-parZone[a]).map(z=>
         '<span class="p '+(zoneChoisie===z?'vert':'cyan')+'" style="margin:2px;cursor:pointer" onclick="choisirZone(\''+z+'\')">'+esc(zoneLib(z))+' · '+parZone[z]+'</span>').join('')+'</div>':'')+
     '<div class="leg"><span><i style="background:#3D9BD9;opacity:.75"></i>1 cas</span>'+
     '<span><i style="background:#74ccef"></i>2 cas et +</span><span>· clic sur une zone = filtrer</span></div>';
  const aucune=inc.filter(i=>(i.zone||zoneDepuisTexte(i.zoneTexte))==='aucune').length;
  if(aucune)h+='<p class="hint" style="text-align:center">+ '+aucune+' incident'+(aucune>1?'s':'')+' sans blessure</p>';
  h+='</div>';
  // --- typologies & causes ---
  h+='<div class="card"><h2>⚠️ Typologies de risque</h2>'+barres(compte(inc,'typologie'),'#3D9BD9')+
     '<h3 style="margin-top:16px">🔍 Causes fondamentales</h3>'+barres(compte(inc,'cause'),'#D9660A')+'</div>';
  // --- liste ---
  // --- suivi des actions correctives, tous incidents confondus ---
  const actes=[];
  tous.forEach(i=>{(jparse(i.plan,[])||[]).forEach(a=>{if(a&&a.t)actes.push(Object.assign({},a,{inc:i}))})});
  if(actes.length){
    const faites=actes.filter(a=>/faite/i.test(String(a.s||''))).length;
    const tard=actes.filter(a=>enRetard(a)).length;
    h+='<div class="card"><h2>🛠 Actions correctives ('+actes.length+')</h2>';
    h+='<div class="kpis" style="margin-bottom:10px">'+
       kpi(actes.length-faites,'Encore ouvertes',(actes.length-faites)?'':'good')+
       kpi(tard,'En retard',tard?'bad':'good')+
       kpi(faites,'Faites','good')+'</div>';
    h+='<div class="tbl-scroll"><table class="uni"><thead><tr><th>Action</th><th>Qui</th><th>Échéance</th><th>Statut</th><th>Incident</th></tr></thead><tbody>';
    actes.sort((a,b)=>String(a.e||'9999').localeCompare(String(b.e||'9999'))).forEach(a=>{
      h+='<tr onclick="ouvrirFiche(\'incident\',\''+a.inc.id+'\')"'+(enRetard(a)?' class="tard"':'')+'>'+
         '<td>'+esc(a.t)+'</td><td>'+esc(a.q||'—')+'</td>'+
         '<td>'+(a.e?esc(frCourt(a.e)):'—')+(enRetard(a)?' ⚠️':'')+'</td>'+
         '<td>'+esc(a.s||'À faire')+'</td>'+
         '<td class="muted">'+esc(frCourt(a.inc.date))+' · '+esc(a.inc.lieu||'')+'</td></tr>';
    });
    h+='</tbody></table></div></div>';
  }
  h+='<div class="card"><h2>📋 Incidents ('+inc.length+')'+(zoneChoisie?' <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="choisirZone(\''+zoneChoisie+'\')">✕ '+esc(zoneLib(zoneChoisie))+'</button>':'')+'</h2><div class="tbl-scroll">'+
     '<table class="uni"><thead><tr><th>Date</th><th>Type</th><th>Lieu</th><th>Zone lésée</th></tr></thead><tbody>';
  inc.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).forEach(i=>{
    h+='<tr onclick="ouvrirFiche(\'incident\',\''+i.id+'\')"><td>'+esc(frCourt(i.date))+'</td>'+
       '<td>'+pastilleAT(i.type)+'</td><td>'+esc(i.lieu||'—')+'</td>'+
       '<td>'+esc(zoneLib(i.zone||zoneDepuisTexte(i.zoneTexte)))+'</td></tr>';
  });
  if(!inc.length)h+='<tr><td colspan="4"><div class="vide"><span class="big">🚨</span>Aucun incident enregistré.</div></td></tr>';
  h+='</tbody></table></div><p class="hint" style="margin-top:8px">Clic sur une ligne = fiche complète (récit, analyse, actions).</p></div>';
  h+='</div>';
  document.getElementById('v-acc').innerHTML=h;
}
function pastilleAT(t){
  t=String(t||'');
  if(/avec arr/i.test(t))return '<span class="p rouge">Avec arrêt</span>';
  if(/sans arr/i.test(t))return '<span class="p jaune">Sans arrêt</span>';
  if(/b[ée]nin/i.test(t))return '<span class="p cyan">Bénin</span>';
  if(/presqu/i.test(t))return '<span class="p violet">Presqu’AT</span>';
  if(/trajet/i.test(t))return '<span class="p gris">Trajet</span>';
  if(/maladie/i.test(t))return '<span class="p gris">Maladie pro</span>';
  return '<span class="p gris">'+esc(t||'—')+'</span>';
}
function compte(list,champ){
  const c={};list.forEach(o=>{const v=String(o[champ]||'').trim();if(v)c[v]=(c[v]||0)+1});
  return Object.keys(c).map(k=>({l:k,n:c[k]})).sort((a,b)=>b.n-a.n);
}
function barres(data,coul){
  if(!data.length)return '<p class="hint">Rien à afficher pour le moment.</p>';
  const max=Math.max(...data.map(d=>d.n),1);
  return data.map(d=>'<div class="hb"><span class="hl">'+esc(d.l.length>34?d.l.slice(0,33)+'…':d.l)+'</span>'+
    '<span class="ht"><i style="width:'+Math.round(d.n/max*100)+'%;background:'+coul+';box-shadow:0 0 8px '+coul+'99"></i></span>'+
    '<span class="hv">'+d.n+'</span></div>').join('');
}

/* ==================== ÉCRAN 3 — REMONTÉES ==================== */
function renderRem(){if(!document.getElementById('v-rem'))return;
  const rem=filtreAg(actifs(state.remontees),'chantier');
  const trait=rem.filter(r=>/^trait/i.test(r.statut||'')).length;
  const pc=rem.length?Math.round(trait/rem.length*100):0;
  const presqu=rem.filter(r=>/presqu/i.test(r.type||'')).length;
  let h='<div class="barre"><h2>👁️ Remontées Vigiminutes '+ANNEE+'</h2>'+
    '<div class="droite"><button class="btn btn-accent" onclick="ouvrirFiche(\'remontee\')">＋ Ajouter une remontée</button></div></div>';
  h+=panneauNotes('v-rem');
  h+='<div class="kpis" style="margin-bottom:14px">'+
    kpi(rem.length,'Remontées')+kpi(trait,'Traitées','good')+
    kpi(pc+' %','Taux de traitement',pc>=80?'good':'mid')+
    kpi(presqu,'Presqu’accidents','cyan')+
    kpi(rem.filter(r=>/^oui/i.test(r.transversale||'')).length,'Transversales')+'</div>';
  h+='<div class="grille g2">';
  h+='<div class="card"><h2>🗂️ Par domaine</h2>'+barres(compte(rem,'domaine'),'#3D9BD9')+
     '<h3 style="margin-top:16px">Par type</h3>'+barres(compte(rem,'type'),'#9A6BE0')+'</div>';
  h+='<div class="card"><h2>📈 Par mois</h2>'+barresMois(rem)+
     '<h3 style="margin-top:16px">Par statut</h3>'+barres(compte(rem,'statut'),'#1FA866')+'</div>';
  h+='</div>';
  h+='<div class="card" style="margin-top:14px"><h2>📋 Détail</h2><div class="tbl-scroll">'+
     '<table class="uni"><thead><tr><th>Mois</th><th>Chantier</th><th>Sujet</th><th>Domaine</th><th>Type</th><th>Impact</th><th>Statut</th></tr></thead><tbody>';
  rem.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).forEach(r=>{
    h+='<tr onclick="ouvrirFiche(\'remontee\',\''+r.id+'\')"><td>'+esc(frCourt(r.date))+'</td><td>'+esc(r.chantier||'—')+'</td>'+
       '<td>'+esc(String(r.sujet||'').slice(0,46))+'</td><td>'+esc(r.domaine||'—')+'</td>'+
       '<td>'+esc(String(r.type||'').split(' ')[0]||'—')+'</td><td class="num">'+esc(r.impact||'')+'</td>'+
       '<td>'+(/^trait/i.test(r.statut||'')?'<span class="p vert">Traitée</span>':
               (/cours/i.test(r.statut||'')?'<span class="p jaune">En cours</span>':'<span class="p gris">'+esc(r.statut||'—')+'</span>'))+'</td></tr>';
  });
  if(!rem.length)h+='<tr><td colspan="7"><div class="vide"><span class="big">👁️</span>Aucune remontée.</div></td></tr>';
  h+='</tbody></table></div></div>';
  document.getElementById('v-rem').innerHTML=h;
}
function barresMois(list){
  const c={};list.forEach(o=>{const k=moisDe(o.date);if(k)c[k]=(c[k]||0)+1});
  const ks=Object.keys(c).sort();
  if(!ks.length)return '<p class="hint">Rien à afficher.</p>';
  const max=Math.max(...ks.map(k=>c[k]),1), W=520, H=140, bw=Math.floor((W-20)/ks.length)-8;
  let b='';
  ks.forEach((k,i)=>{const x=10+i*((W-20)/ks.length)+4, bh=Math.round((H-40)*c[k]/max), y=H-24-bh;
    b+='<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+Math.max(bh,2)+'" rx="4" fill="#74ccef" opacity=".9"><title>'+MOIS_L[Number(k.slice(5,7))-1]+' : '+c[k]+'</title></rect>'+
       '<text x="'+(x+bw/2)+'" y="'+(y-5)+'" font-size="11" text-anchor="middle" fill="#eef5fb">'+c[k]+'</text>'+
       '<text x="'+(x+bw/2)+'" y="'+(H-8)+'" font-size="10" text-anchor="middle" fill="#c9d7e4">'+MOIS_S[Number(k.slice(5,7))-1].replace('.','')+'</text>'});
  return '<div class="chart"><svg viewBox="0 0 '+W+' '+H+'">'+b+'</svg></div>';
}

/* ==================== ÉCRAN 4 — SANTÉ & ENVIRONNEMENT ==================== */
function renderSE(){
  const l=filtreAg(actifs(state.se),'chantier');
  const cpt=t=>l.filter(x=>String(x.nature||'').toLowerCase().indexOf(t)>=0).length;
  let h='<div class="barre"><h2>🌱 Santé & Environnement '+ANNEE+'</h2>'+
    '<div class="droite"><button class="btn btn-accent" onclick="ouvrirFiche(\'se\')">＋ Ajouter une action</button></div></div>';
  h+=panneauNotes('v-se');
  h+='<div class="kpis" style="margin-bottom:14px">'+
    kpi(cpt('campagne'),'Campagnes de mesures')+
    kpi(cpt('sensibilisation santé'),'Sensibilisations santé')+
    kpi(cpt('sensibilisation environnement'),'Sensibilisations environnement')+
    kpi(cpt('événement'),'Événements environnementaux',cpt('événement')>0?'bad':'good')+'</div>';
  h+='<div class="grille g2">';
  h+='<div class="card"><h2>📊 Par nature</h2>'+barres(compte(l,'nature'),'#1FA866')+'</div>';
  h+='<div class="card"><h2>📅 Par mois</h2>'+barresMois(l)+'</div>';
  h+='</div>';
  h+='<div class="card" style="margin-top:14px"><h2>📋 Actions ('+l.length+')</h2><div class="tbl-scroll">'+
     '<table class="uni"><thead><tr><th>Date</th><th>Nature</th><th>Intitulé</th><th>Lieu / public</th></tr></thead><tbody>';
  l.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).forEach(x=>{
    h+='<tr onclick="ouvrirFiche(\'se\',\''+x.id+'\')"><td>'+esc(frCourt(x.date))+'</td><td>'+esc(x.nature||'—')+'</td>'+
       '<td>'+esc(x.intitule||'')+'</td><td>'+esc(x.public||'—')+'</td></tr>';
  });
  if(!l.length)h+='<tr><td colspan="4"><div class="vide"><span class="big">🌱</span>Aucune action enregistrée — commence par « ＋ Ajouter une action ».</div></td></tr>';
  h+='</tbody></table></div></div>';
  document.getElementById('v-se').innerHTML=h;
}

/* ==================== ÉCRAN — FLASHS SSE ====================
   Quantifier chaque mois les flashs partagés, par type, avec leurs sujets.
   Commun à toutes les agences : la bascule d'agence n'a pas d'effet ici.
   Un flash = une ligne de la table Santé & Environnement (nature « Flash … »),
   ce qui le fait compter automatiquement dans l'intranet. */
const TYPES_FLASH=[
  {nat:'Flash Sécurité',t:'Sécurité',c:'#ff6b5e'},
  {nat:'Flash Santé',t:'Santé',c:'#3D9BD9'},
  {nat:'Flash Environnement',t:'Environnement',c:'#1FA866'},
  {nat:'Flash RETEX suite AT',t:'RETEX suite AT',c:'#E09628'}];
function flashsDe(k,nat){
  return actifs(state.se).filter(x=>String(x.nature||'')===nat&&String(x.date||'').slice(0,7)===k);
}
function renderFlash(){
  const an=String(ANNEE);
  let h='<div class="barre"><h2>📣 Flashs SSE '+an+'</h2>'+
    '<span class="p gris">Commun à toutes les agences</span>'+
    '<div class="droite"><button class="btn btn-accent" onclick="nouveauFlash()">＋ Nouveau flash</button></div></div>';
  h+=panneauNotes('v-flash');
  // compteurs annuels
  const tot=TYPES_FLASH.map(t=>actifs(state.se).filter(x=>String(x.nature||'')===t.nat&&String(x.date||'').slice(0,4)===an).length);
  h+='<div class="kpis" style="margin-bottom:14px">'+
    kpi(tot.reduce((a,b)=>a+b,0),'Flashs diffusés')+
    TYPES_FLASH.map((t,i)=>kpi(tot[i],t.t)).join('')+'</div>';
  h+='<div class="card"><div class="tbl-scroll"><table class="uni flash"><thead><tr><th class="mois">Mois</th>'+
     TYPES_FLASH.map(t=>'<th style="text-align:center;color:'+t.c+'">'+esc(t.t)+'</th>').join('')+
     '<th style="text-align:center">Total</th></tr></thead><tbody>';
  for(let i=0;i<12;i++){
    const k=an+'-'+String(i+1).padStart(2,'0');
    const parType=TYPES_FLASH.map(t=>flashsDe(k,t.nat));
    const n2=parType.reduce((s,l)=>s+l.length,0);
    h+='<tr><td class="mois"><b>'+MOIS_L[i]+'</b></td>';
    parType.forEach((l,j)=>{
      h+='<td class="n '+(l.length?'ok':'zero')+'">'+l.length+
         (l.length?'<div class="fl-sujets">'+l.map(x=>'<div><b>'+esc(x.intitule||'(sans sujet)')+'</b>'+
           ' <button class="btn btn-ghost btn-sm" style="padding:0 5px" onclick="ouvrirFiche(\'se\',\''+x.id+'\')">✏️</button></div>').join('')+'</div>':'')+
         '<button class="btn btn-ghost fl-add" onclick="nouveauFlash(\''+k+'\',\''+TYPES_FLASH[j].nat.replace(/'/g,"\\'")+'\')">＋</button></td>';
    });
    h+='<td class="n '+(n2?'':'zero')+'">'+n2+'</td></tr>';
  }
  h+='</tbody></table></div></div>';
  h+='<p class="hint" style="margin-top:8px">Chaque flash est aussi une ligne de l’écran Santé & Environnement : l’intranet les compte tout seul, par type et par mois.</p>';
  document.getElementById('v-flash').innerHTML=h;
}
/* ouvre la fiche Santé & Environnement pré-remplie en flash */
function nouveauFlash(k,nat){
  ouvrirFiche('se');
  const d=document.getElementById('f-date'), na=document.getElementById('f-nature');
  if(d&&k)d.value=k+'-15';
  if(na&&nat)na.value=nat;
}

/* ==================== ÉCRAN 5 — OBJECTIFS SSE ==================== */
const DOM_COUL={'SECURITE':'#ff6b5e','SÉCURITÉ':'#ff6b5e','SANTE':'#3D9BD9','SANTÉ':'#3D9BD9',
  'ENVIRONNEMENT':'#1FA866','CULTURE SSE':'#9A6BE0'};
/* ===========================================================================
 *  ÉCRAN SUIVI QHP — en LECTURE SEULE
 *  Les mêmes deux tableaux que l'intranet, calculés par le serveur depuis
 *  l'appli Suivi QHP. Rien ne se saisit ici : c'est ce qui rend impossible
 *  toute contradiction entre les trois outils.
 * ========================================================================= */
const MOIS_C1=['J','F','M','A','M','J','J','A','S','O','N','D'];
function qbar(pc,cls){
  return '<span class="qbar '+(cls||'')+'"><i style="width:'+Math.max(0,Math.min(100,pc))+'%"></i></span>';
}
function enteteMoisQ(mois){
  return (mois||[]).map((m,i)=>{
    const an=String(m.k).slice(2,4), chg=(i===0)||String(mois[i-1].k).slice(0,4)!==String(m.k).slice(0,4);
    return '<th class="mcol" title="'+esc(String(m.k))+'">'+MOIS_C1[Number(String(m.k).slice(5,7))-1]+(chg?'<i>'+an+'</i>':'')+'</th>';
  }).join('');
}
function renderQhp(){
  const box=document.getElementById('v-qhp'); if(!box)return;
  const q=QHP;
  if(!q||!q.collaborateurs||!q.collaborateurs.length){
    box.innerHTML='<div class="card"><h2>📋 Suivi des QHP</h2>'
      +'<p class="hint">Ces tableaux sont calculés à partir de l’appli <b>Suivi QHP</b> et arrivent avec la synchronisation. '
      +'Clique sur <b>Synchroniser</b> : s’ils restent vides, c’est que la propriété <code>QHP_SHEET_ID</code> n’est pas renseignée côté script.</p></div>';
    return;
  }
  const obj=q.objAn||6;
  let h='<div class="card"><h2>📋 Suivi des QHP <span class="ro">lecture seule</span></h2>';
  h+='<p class="hint">Tout se saisit dans l’appli <b>Suivi QHP</b> : cet écran ne fait que l’afficher, '
    +'donc personne ne peut se contredire d’un outil à l’autre.</p>';

  /* --- les conducteurs --- */
  const lc=q.conducteurs||[], actifs=lc.filter(c=>c.total>0).length;
  const maxc=Math.max(1,...lc.map(c=>c.total||0));
  h+='<h3>👷 Les conducteurs de travaux <span class="hint" style="font-weight:400">— QHP animés sur 12 mois glissants</span></h3>';
  h+='<div class="qlist">';
  lc.forEach(c=>{
    h+='<div class="qrow'+(c.total?'':' vide')+'">'
      +'<span class="qn">'+esc(c.nom)+'<span class="qag">'+esc(c.agence||'')+'</span></span>'
      +qbar(c.total/maxc*100,c.total?'':'nul')
      +'<span class="qv">'+c.total+'</span>'
      +'<span class="qd">'+(c.chantiers||0)+' chantier'+((c.chantiers||0)>1?'s':'')
      +' · '+(c.participants||0)+' participation'+((c.participants||0)>1?'s':'')+'</span></div>';
  });
  h+='</div><p class="hint"><b>'+actifs+'</b> conducteur(s) sur '+lc.length+' ont animé au moins un QHP.</p>';
  if(q.condInconnus&&q.condInconnus.length)
    h+='<p class="hint">⚠️ Animateur non reconnu : '+q.condInconnus.map(x=>esc(x.t)+' ('+x.n+')').join(', ')
      +' — corrige l’orthographe dans la fiche QHP pour qu’il compte.</p>';

  /* --- les collaborateurs --- */
  const l=q.collaborateurs, atteint=l.filter(c=>c.total>=obj).length, zero=l.filter(c=>c.total===0).length;
  h+='<h3 style="margin-top:22px">🧑‍🤝‍🧑 La participation des collaborateurs '
    +'<span class="hint" style="font-weight:400">— objectif '+obj+' QHP par an</span></h3>';
  h+='<div class="kpis" style="margin-bottom:12px">'
    +'<div class="kpi"><div class="v">'+l.length+'</div><div class="l">Collaborateurs suivis</div></div>'
    +'<div class="kpi"><div class="v">'+atteint+'</div><div class="l">Ont atteint les '+obj+' QHP</div></div>'
    +'<div class="kpi"><div class="v">'+zero+'</div><div class="l">N’ont suivi aucun QHP</div></div></div>';
  h+='<div class="seg no-print" style="margin-bottom:10px">'
    +'<button class="'+(qhpGroupe==='secteur'?'on':'')+'" onclick="setQhpGroupe(\'secteur\')">Par secteur</button>'
    +'<button class="'+(qhpGroupe==='agence'?'on':'')+'" onclick="setQhpGroupe(\'agence\')">Par agence</button></div>';
  const grp={};
  l.forEach(c=>{const k=(qhpGroupe==='agence'?(c.agence||'—'):(c.secteur||'Sans groupe'));(grp[k]=grp[k]||[]).push(c)});
  h+='<div class="qlist">';
  Object.keys(grp).sort((a,b)=>a.localeCompare(b,'fr')).forEach(g=>{
    const gl=grp[g], ok=gl.filter(c=>c.total>=obj).length, rien=gl.filter(c=>c.total===0).length;
    const pc=gl.length?Math.round(ok/gl.length*100):0;
    h+='<div class="qrow"><span class="qn">'+esc(g)+'<span class="qag">'+gl.length+'</span></span>'
      +qbar(pc,pc>=80?'ok':pc>=40?'mid':'bad')
      +'<span class="qv">'+pc+' %</span>'
      +'<span class="qd">'+ok+' à l’objectif'+(rien?' · <b class="rouge">'+rien+' à zéro</b>':'')+'</span></div>';
  });
  h+='</div>';
  const sous=l.filter(c=>c.total<obj).sort((a,b)=>a.total-b.total||a.nom.localeCompare(b.nom,'fr'));
  if(sous.length){
    h+='<details class="grille-det" open><summary>🚩 À relancer — '+sous.length+' collaborateur(s) sous les '+obj+' QHP</summary>';
    h+='<div class="qtags">'+sous.map(c=>'<span class="qtag'+(c.total?'':' zero')+'" title="'
      +esc((c.secteur||'—')+' · '+(c.agence||'—'))+'">'+esc(c.nom)+' <b>'+c.total+'</b></span>').join('')+'</div></details>';
  } else h+='<p class="hint">✅ Tout le monde a atteint l’objectif sur les 12 derniers mois.</p>';

  h+='<details class="grille-det"><summary>Voir le détail mois par mois ('+l.length+' collaborateurs)</summary>';
  h+='<div class="tbl-wrap" style="margin-top:8px"><table class="grille"><thead><tr><th>Collaborateur</th><th class="sec">'
    +(qhpGroupe==='agence'?'Agence':'Groupe')+'</th>'+enteteMoisQ(q.mois)+'<th style="text-align:center">Total</th></tr></thead><tbody>';
  Object.keys(grp).sort((a,b)=>a.localeCompare(b,'fr')).forEach(g=>{
    grp[g].slice().sort((a,b)=>a.nom.localeCompare(b.nom,'fr')).forEach(c=>{
      h+='<tr><td>'+esc(c.nom)+'</td><td class="sec">'+esc(g)+'</td>';
      (c.mois||[]).forEach(v=>{h+='<td class="mcol">'+(v===1?'<span class="v">✓</span>':v===0?'<span class="z">·</span>':'<span class="na">–</span>')+'</td>'});
      h+='<td style="text-align:center"><b>'+c.total+'</b></td></tr>';
    });
  });
  h+='</tbody></table></div><p class="hint">✓ = au moins un QHP ce mois-là · « · » = aucun · « – » = hors période ou neutralisé dans l’appli Suivi QHP.</p></details>';
  if(q.calculeLe)h+='<p class="hint" style="margin-top:10px">Calculé le '+esc(new Date(q.calculeLe).toLocaleString('fr-FR'))+'.</p>';
  h+='</div>';
  box.innerHTML=h;
}
function renderObj(){
  const l=actifs(state.objectifs);
  const smi=s=>s||'';
  const compteS=v=>l.filter(o=>[o.s1,o.s2,o.s3,o.s4].filter(Boolean).slice(-1)[0]===v).length;
  let h='<div class="barre"><h2>🎯 Objectifs SSE '+ANNEE+'</h2>'+
    '<div class="droite">'+
    (objSansInds()?'<button class="btn btn-primary" onclick="prefillInds()" title="Reprend les indicateurs du classeur « TABLEAU DE BORD Indicateurs SSE CDES 2026 »">📥 Pré-remplir les indicateurs ('+objSansInds()+')</button> ':'')+
    '<button class="btn btn-accent" onclick="ouvrirFiche(\'objectif\')">＋ Nouvel objectif</button></div></div>';
  h+=panneauNotes('v-obj');
  h+='<div class="kpis" style="margin-bottom:14px">'+
    kpi(l.length,'Objectifs')+
    kpi(compteS('😀'),'Atteints','good')+
    kpi(compteS('🙂'),'En bonne voie','good')+
    kpi(compteS('😐'),'À suivre','mid')+
    kpi(compteS('😟'),'En retard','bad')+'</div>';
  const parDom={};l.forEach(o=>{const d=(o.domaine||'AUTRE').toUpperCase();(parDom[d]=parDom[d]||[]).push(o)});
  Object.keys(parDom).forEach(d=>{
    const c=DOM_COUL[d]||'#8fa6bd';
    h+='<div class="rub"><div class="rt" style="color:'+c+';display:flex;align-items:center;gap:10px;font-family:Barlow Condensed;font-size:15px;font-weight:700;letter-spacing:1.6px;margin:16px 2px 10px">'+
       '<span class="dot" style="width:8px;height:8px;border-radius:2px;transform:rotate(45deg);background:'+c+'"></span>'+esc(d)+'</div>';
    parDom[d].forEach(o=>{
      h+='<div class="obj"><div class="oh"><span class="p gris">N°'+esc(o.num||'')+'</span>'+
         '<span class="on2">'+esc(o.intitule||'')+'</span>'+
         '<button class="btn btn-ghost btn-sm" onclick="ouvrirFiche(\'objectif\',\''+o.id+'\')">✏️</button></div>';
      if(o.indicateur)h+='<p class="hint" style="margin-top:6px">📏 '+esc(o.indicateur)+'</p>';
      h+=blocIndicateurs(o);
      h+='<div class="tri">';
      [1,2,3,4].forEach(t=>{
        const s=o['s'+t]||'', c2=o['c'+t]||'', calc=smileyCalcule(o,t);
        const aff=s||calc||'·';
        h+='<button class="tr'+(s?' force':'')+'" onclick="cycleSmiley(\''+o.id+'\','+t+')" title="'+
           esc(c2||(s?'Posé à la main — clic pour revenir au calcul':calc?'Calculé depuis les indicateurs — clic pour forcer':'Clic pour changer'))+'">'+
           'T'+t+' <b>'+aff+'</b></button>';
      });
      h+='</div>';
      const dernier=[o.c1,o.c2,o.c3,o.c4].filter(Boolean).slice(-1)[0];
      if(dernier)h+='<p class="hint" style="margin-top:8px">💬 '+esc(dernier)+'</p>';
      h+='</div>';
    });
    h+='</div>';
  });
  if(!l.length)h+='<div class="card"><div class="vide"><span class="big">🎯</span>Aucun objectif — « ＋ Nouvel objectif » pour commencer.</div></div>';
  document.getElementById('v-obj').innerHTML=h;
}
/* ---------- indicateurs rattachés à un objectif ----------
   Chaque objectif porte des lignes d'indicateur, saisies MOIS par MOIS, dont on
   tire un bilan par TRIMESTRE. Une ligne peut être automatique (elle lit un
   indicateur déjà calculé par l'intranet) ou manuelle (tu tapes la valeur). */
const AUTO_OBJ = {
  'auto.remontees':'Remontées Vigiminutes','auto.sd':'Situations dangereuses (tous outils)',
  'auto.vigiPart':'Participation Vigiminutes','auto.qhpPart':'Participation QHP',
  'auto.qhpNb':'QHP réalisés','auto.vms':'VMS réalisées','auto.visites':'CR / observations HSE',
  'auto.accueils':'Accueils HSE','auto.formations':'Fiches de formation au poste',
  'auto.analyses':'Événements analysés','auto.modeop':'Modes opératoires disponibles',
  'auto.accArret':'AT avec arrêt','auto.hipo':'Événements à haut potentiel',
  'auto.dechetsVal':'Part valorisée des déchets'};
const MOIS_C3=['J','F','M','A','M','J','J','A','S','O','N','D'];
/* unité et mode d'agrégation par défaut de chaque source automatique */
const AUTO_META={'auto.remontees':{unite:'nb',agg:'somme'},'auto.sd':{unite:'nb',agg:'somme'},
  'auto.vigiPart':{unite:'pct',agg:'moyenne'},'auto.qhpPart':{unite:'pct',agg:'moyenne'},
  'auto.qhpNb':{unite:'nb',agg:'somme'},'auto.vms':{unite:'nb',agg:'somme'},
  'auto.visites':{unite:'nb',agg:'somme'},'auto.accueils':{unite:'nb',agg:'somme'},
  'auto.formations':{unite:'nb',agg:'somme'},'auto.analyses':{unite:'pct',agg:'dernier'},
  'auto.modeop':{unite:'nb',agg:'dernier'},'auto.accArret':{unite:'nb',agg:'somme'},
  'auto.hipo':{unite:'nb',agg:'dernier'},'auto.dechetsVal':{unite:'pct',agg:'moyenne'}};
let indEnCours=null;

/* ---------- catalogue des indicateurs, repris du classeur « TABLEAU DE BORD
   Indicateurs SSE CDES 2026 », onglet SUIVI DES OBJECTIFS SSE ----------
   Les libellés sont ceux de la colonne « Indicateurs de suivi ». Les cibles sont
   celles écrites dans l'intitulé de l'objectif lui-même ; quand l'objectif n'en
   donne pas, la cible est laissée vide — à toi de la poser. */
const CATALOGUE_INDS = {
 '1':[{lib:'% de flashs animés par l’encadrement (réalisé / prévu)',cle:'',unite:'pct',agg:'moyenne',sens:'sup',cible:100},
      {lib:'% de collaborateurs sensibilisés (traçabilité par équipe)',cle:'',unite:'pct',agg:'moyenne',sens:'sup',cible:100}],
 '2':[{lib:'Nb de thématiques diffusées',cle:'',unite:'nb',agg:'somme',sens:'sup',cible:12},
      {lib:'% de collaborateurs sensibilisés aux thématiques mensuelles',cle:'',unite:'pct',agg:'moyenne',sens:'sup',cible:80}],
 '3':[{lib:'% de participation à la réalisation des Vigiminutes',cle:'auto.vigiPart',unite:'pct',agg:'moyenne',sens:'sup',cible:80},
      {lib:'Nb de remontées terrain',cle:'auto.remontees',unite:'nb',agg:'somme',sens:'sup',cible:50}],
 '4':[{lib:'% d’AT analysés avec le salarié',cle:'auto.analyses',unite:'pct',agg:'dernier',sens:'sup',cible:100},
      {lib:'Nb de sensibilisations réalisées à la suite des AT significatifs',cle:'',unite:'nb',agg:'somme',sens:'sup',cible:''}],
 '5':[{lib:'Nb de supports de sensibilisation / formations réalisées',cle:'',unite:'nb',agg:'somme',sens:'sup',cible:4},
      {lib:'% de salariés exposés sensibilisés',cle:'',unite:'pct',agg:'dernier',sens:'sup',cible:100}],
 '6':[{lib:'Nb d’écarts relevés',cle:'',unite:'nb',agg:'somme',sens:'inf',cible:0}],
 '7':[{lib:'Existence du PUI (0 = non, 1 = oui)',cle:'',unite:'nb',agg:'dernier',sens:'sup',cible:1},
      {lib:'Exercice incendie réalisé (0 = non, 1 = oui)',cle:'',unite:'nb',agg:'dernier',sens:'sup',cible:1}],
 '8':[{lib:'Nb de non-conformités relevées',cle:'',unite:'nb',agg:'somme',sens:'inf',cible:0}],
 '9':[{lib:'Nb de systèmes installés',cle:'',unite:'nb',agg:'somme',sens:'sup',cible:2},
      {lib:'% de soudeurs formés',cle:'',unite:'pct',agg:'dernier',sens:'sup',cible:100}],
 '10':[{lib:'% d’actions TMS mises en place',cle:'',unite:'pct',agg:'dernier',sens:'sup',cible:100}],
 '11':[{lib:'Nb de non-conformités relevées',cle:'',unite:'nb',agg:'somme',sens:'inf',cible:0}],
 '12':[{lib:'Nb de bacs de rétention distribués',cle:'',unite:'nb',agg:'somme',sens:'sup',cible:''},
       {lib:'Nb de non-conformités relevées',cle:'',unite:'nb',agg:'somme',sens:'inf',cible:0}],
 '13':[{lib:'Nb de solutions déployées',cle:'',unite:'nb',agg:'somme',sens:'sup',cible:''},
       {lib:'% de collaborateurs sensibilisés',cle:'',unite:'pct',agg:'dernier',sens:'sup',cible:100}],
 '14':[{lib:'% d’actions RSE déployées',cle:'',unite:'pct',agg:'dernier',sens:'sup',cible:100}]
};
/* combien d'objectifs attendent encore leurs lignes d'indicateur */
function objSansInds(){
  return actifs(state.objectifs).filter(o=>!indsDe(o).length && CATALOGUE_INDS[String(o.num||'').trim()]).length}

function prefillInds(){
  const l=actifs(state.objectifs);
  let faits=0, lignes=0, sansCible=0;
  l.forEach(o=>{
    const c=CATALOGUE_INDS[String(o.num||'').trim()];
    if(!c||indsDe(o).length)return;            // jamais écraser un objectif déjà renseigné
    o.inds=c.map(d=>Object.assign({},d,{auto:!!d.cle}));
    o.inds.forEach(d=>{if(d.cible==='')sansCible++});
    o.maj=nowISO();faits++;lignes+=c.length;
  });
  if(!faits){toast('Rien à pré-remplir : tes objectifs ont déjà leurs indicateurs');return}
  save();rerendre();syncAuto();
  toast(faits+' objectif'+(faits>1?'s':'')+' · '+lignes+' indicateur'+(lignes>1?'s':'')+
        (sansCible?' — '+sansCible+' cible'+(sansCible>1?'s':'')+' à compléter':''));
}

function indsDe(o){if(!Array.isArray(o.inds))o.inds=[];return o.inds}
function valsDe(o){if(!o.vals||typeof o.vals!=='object')o.vals={};return o.vals}
function valInd(o,i,k){const v=valsDe(o)[String(i)];return (v&&v[k]!==undefined&&v[k]!=='')?Number(v[k]):null}

/* agrégation d'une liste de valeurs mensuelles selon le mode de la ligne */
function aggInd(d,liste){
  const l=liste.filter(v=>v!==null&&v!==undefined);
  // « 0 non-conformité » : aucune ligne saisie = zéro, donc objectif tenu
  if(!l.length)return (d.sens==='inf'&&d.agg==='somme')?0:null;
  if(d.agg==='dernier')return l[l.length-1];
  if(d.agg==='moyenne')return Math.round(l.reduce((s,v)=>s+v,0)/l.length*10)/10;
  return l.reduce((s,v)=>s+v,0);
}
/* atteinte en %, avec cible annuelle mise au prorata pour les cumuls */
function pcInd(d,v,nbMois){
  if(v===null||d.cible===''||d.cible===undefined||d.cible===null)return null;
  const c0=Number(d.cible);
  if(d.sens==='inf')return v<=c0?100:Math.max(0,Math.round(100-(v-c0)*100/Math.max(c0,1)));
  const c=(d.agg==='somme'&&nbMois&&nbMois<12)?c0*nbMois/12:c0;
  if(!c)return v>0?100:null;
  return Math.max(0,Math.round(v/c*100));
}
function moisSaisis(){return moisAnnee().filter(m=>Object.keys(m).some(c=>c!=='k'&&c!=='maj'&&n(m[c])>0)).length||new Date().getMonth()+1}

function smileyCalcule(o,t){
  // un trimestre pas encore commencé n'a pas de bilan
  if((t-1)*3+1>moisSaisis())return '';
  const l=indsDe(o),nb=Math.min(moisSaisis(),t*3),pcs=[];
  l.forEach((d,i)=>{
    if(d.auto)return;                       // les lignes auto sont calculées côté intranet
    const vs=[];for(let m=0;m<t*3;m++)vs.push(valInd(o,i,ANNEE+'-'+String(m+1).padStart(2,'0')));
    const p=pcInd(d,aggInd(d,vs),nb);if(p!==null)pcs.push(p);
  });
  if(!pcs.length)return '';
  const pc=Math.round(pcs.reduce((s,x)=>s+x,0)/pcs.length);
  return pc>=100?'😀':pc>=75?'🙂':pc>=50?'😐':'😟';
}

function blocIndicateurs(o){
  const l=indsDe(o);
  let h='<div class="inds">';
  if(!l.length)h+='<p class="hint">Aucun indicateur chiffré — l’avancement reste au smiley posé à la main.</p>';
  l.forEach((d,i)=>{
    const nb=moisSaisis();
    let val;
    if(d.auto){val=null}
    else{const vs=[];for(let m=0;m<12;m++)vs.push(valInd(o,i,ANNEE+'-'+String(m+1).padStart(2,'0')));val=aggInd(d,vs)}
    const pc=d.auto?null:pcInd(d,val,nb);
    const u=d.unite==='pct'?' %':'';
    h+='<div class="ind"><div class="ih">'+
       '<span class="ib">'+(d.auto?'🤖':'✍️')+'</span>'+
       '<span class="il">'+esc(d.lib||AUTO_OBJ[d.cle]||'(sans libellé)')+'</span>'+
       (d.cible!==''&&d.cible!==null&&d.cible!==undefined
          ? '<span class="ic">'+(d.sens==='inf'?'≤ ':'≥ ')+esc(String(d.cible))+u+'</span>' : '')+
       (pc!==null?'<span class="ip '+(pc>=100?'ok':pc>=75?'mid':'bad')+'">'+pc+' %</span>':'')+
       '<button class="btn btn-ghost btn-sm" onclick="editInd(\''+o.id+'\','+i+')">✏️</button>'+
       '<button class="btn btn-ghost btn-sm" onclick="supprInd(\''+o.id+'\','+i+')">🗑</button>'+
       '</div>';
    if(d.auto)h+='<p class="hint">Valeur reprise automatiquement de l’intranet — rien à saisir.</p>';
    else{
      h+='<div class="imois">';
      for(let m=0;m<12;m++){
        const k=ANNEE+'-'+String(m+1).padStart(2,'0'), v=valInd(o,i,k);
        h+='<label class="im'+(m%3===2?' finT':'')+'"><span>'+MOIS_C3[m]+'</span>'+
           '<input type="number" step="any" value="'+(v===null?'':v)+'" '+
           'onchange="setInd(\''+o.id+'\','+i+',\''+k+'\',this.value)"></label>';
      }
      h+='</div>';
      if(val!==null)h+='<p class="hint">'+(d.agg==='somme'?'Total':d.agg==='moyenne'?'Moyenne':'Dernière valeur')+
        ' sur l’année : <b>'+String(val).replace('.',',')+u+'</b></p>';
    }
    h+='</div>';
  });
  h+='<button class="btn btn-ghost btn-sm" onclick="editInd(\''+o.id+'\',-1)">＋ Indicateur</button></div>';
  return h;
}

function setInd(id,i,k,v){
  const o=state.objectifs.find(x=>x.id===id);if(!o)return;
  const vs=valsDe(o);if(!vs[String(i)])vs[String(i)]={};
  if(v===''||v===null)delete vs[String(i)][k];else vs[String(i)][k]=Number(v);
  o.maj=nowISO();save();rerendre();syncAuto();
}
function supprInd(id,i){
  const o=state.objectifs.find(x=>x.id===id);if(!o)return;
  if(!confirm('Supprimer cet indicateur et ses valeurs ?'))return;
  const l=indsDe(o),vs=valsDe(o);
  l.splice(i,1);
  const nv={};Object.keys(vs).forEach(c=>{const j=Number(c);if(j<i)nv[c]=vs[c];else if(j>i)nv[String(j-1)]=vs[c]});
  o.vals=nv;o.maj=nowISO();save();rerendre();syncAuto();
}
function editInd(id,i){
  const o=state.objectifs.find(x=>x.id===id);if(!o)return;
  const l=indsDe(o), d=(i>=0?l[i]:{lib:'',cle:'',unite:'nb',agg:'somme',sens:'sup',cible:''});
  const opts=['<option value="">✍️ Valeur saisie à la main</option>']
    .concat(Object.keys(AUTO_OBJ).map(c=>'<option value="'+c+'"'+(d.cle===c?' selected':'')+'>🤖 '+esc(AUTO_OBJ[c])+'</option>')).join('');
  const sel=(v,liste)=>liste.map(x=>'<option value="'+x[0]+'"'+(v===x[0]?' selected':'')+'>'+x[1]+'</option>').join('');
  indEnCours={id:id,i:i};
  document.getElementById('mi-corps').innerHTML=
    '<div class="grille">'+
    '<label class="full">Libellé de l’indicateur<textarea id="i-lib" rows="2">'+esc(d.lib||'')+'</textarea></label>'+
    '<label class="full">Source<select id="i-cle">'+opts+'</select></label>'+
    '<label>Unité<select id="i-unite">'+sel(d.unite||'nb',[['nb','Nombre'],['pct','Pourcentage']])+'</select></label>'+
    '<label>Sur l’année, on<select id="i-agg">'+sel(d.agg||'somme',[['somme','additionne les mois'],['moyenne','fait la moyenne'],['dernier','garde la dernière valeur']])+'</select></label>'+
    '<label>Objectif atteint quand<select id="i-sens">'+sel(d.sens||'sup',[['sup','on dépasse la cible'],['inf','on reste sous la cible']])+'</select></label>'+
    '<label>Cible sur l’année<input id="i-cible" type="number" step="any" value="'+(d.cible===''||d.cible===null||d.cible===undefined?'':d.cible)+'"></label>'+
    '</div><p class="hint">La cible porte sur l’année entière. Quand on additionne les mois, l’atteinte est mise au prorata des mois déjà saisis — 6 sur 20 à fin juin vaut 60 %, pas 30 %.</p>';
  document.getElementById('mi-titre').textContent=(i>=0?'Modifier l’indicateur':'Nouvel indicateur');
  // le choix d'une source automatique préremplit unité et agrégation
  document.getElementById('i-cle').onchange=function(){
    const a=AUTO_META[this.value];if(!a)return;
    document.getElementById('i-unite').value=a.unite;
    document.getElementById('i-agg').value=a.agg;
    const lib=document.getElementById('i-lib');
    if(!lib.value.trim())lib.value=AUTO_OBJ[this.value]||'';
  };
  document.getElementById('m-ind').classList.add('open');
}
function enregistrerInd(){
  if(!indEnCours)return;
  const o=state.objectifs.find(x=>x.id===indEnCours.id);if(!o)return;
  const l=indsDe(o), i=indEnCours.i, cle=document.getElementById('i-cle').value;
  const nd={lib:document.getElementById('i-lib').value.trim()||AUTO_OBJ[cle]||'',
            cle:cle,auto:!!cle,
            unite:document.getElementById('i-unite').value,
            agg:document.getElementById('i-agg').value,
            sens:document.getElementById('i-sens').value,
            cible:document.getElementById('i-cible').value};
  if(!nd.lib){toast('Donne un libellé à l’indicateur',true);return}
  if(i>=0)l[i]=nd;else l.push(nd);
  indEnCours=null;o.maj=nowISO();save();closeModal();rerendre();syncAuto();
}

function cycleSmiley(id,t){
  const o=state.objectifs.find(x=>x.id===id);if(!o)return;
  const ordre=['','😀','🙂','😐','😟'];
  const i=ordre.indexOf(o['s'+t]||'');
  o['s'+t]=ordre[(i+1)%ordre.length];
  o.maj=nowISO();save();rerendre();syncAuto();
}

/* ==================== FICHES (formulaires) ==================== */
const FICHES = {
  incident:{titre:'Incident / accident',liste:'incidents',
    champs:[
      {k:'date',t:'Date',type:'date',obl:true},{k:'heure',t:'Heure',ph:'ex. 14h30'},
      {k:'type',t:'Type',type:'select',opts:REF.typeAT,obl:true},
      {k:'joursArret',t:'Jours d’arrêt',type:'number'},
      {k:'collaborateur',t:'Collaborateur',obl:true},{k:'categorie',t:'Catégorie',type:'select',opts:REF.categorie},
      {k:'lieu',t:'Lieu / chantier',obl:true},{k:'temoin',t:'Témoin'},
      {k:'description',t:'Que s’est-il passé ?',type:'textarea',full:true,obl:true},
      {k:'zone',t:'Zone lésée',type:'bonhomme',full:true},
      {k:'blessure',t:'Type de blessure',type:'select',opts:REF.blessure},
      {k:'typologie',t:'Typologie du risque',type:'select',opts:REF.typologie},
      {k:'cause',t:'Cause fondamentale',type:'select',opts:REF.cause},
      {k:'rqs',t:'Règle qui sauve concernée',type:'select',opts:REF.rqs},
      {k:'hipo',t:'Événement HIPO',type:'select',opts:REF.ouiNon},
      {k:'posteAmenage',t:'Poste aménagé',type:'select',opts:['Oui','Non','Non nécessaire']},
      {k:'cpam',t:'Déclaré CPAM',type:'select',opts:REF.ouiNon},
      {k:'actions',t:'Analyse (ce qu’on retient)',type:'textarea',full:true},
      {k:'arbre',t:'Arbre des causes',type:'arbre',full:true},
      {k:'plan',t:'Actions correctives',type:'plan',full:true}
    ]},
  remontee:{titre:'Remontée Vigiminute',liste:'remontees',
    champs:[
      {k:'date',t:'Date',type:'date',obl:true},{k:'chantier',t:'Chantier',obl:true},
      {k:'sujet',t:'Sujet de la remontée',type:'textarea',full:true,obl:true},
      {k:'domaine',t:'Domaine',type:'select',opts:REF.domaineRem,obl:true},
      {k:'type',t:'Type',type:'select',opts:REF.typeRem,obl:true},
      {k:'impact',t:'Impact HSE (1 à 4)',type:'select',opts:['1','2','3','4']},
      {k:'transversale',t:'Transversale',type:'select',opts:REF.ouiNon},
      {k:'recurrence',t:'Récurrence',type:'select',opts:REF.ouiNon},
      {k:'statut',t:'Statut',type:'select',opts:REF.statutRem},
      {k:'reportPA',t:'Reporté au plan d’actions',type:'select',opts:REF.ouiNon},
      {k:'dateReal',t:'Date de réalisation',type:'date'}
    ]},
  se:{titre:'Action santé / environnement',liste:'se',
    champs:[
      {k:'date',t:'Date',type:'date',obl:true},
      {k:'nature',t:'Nature',type:'select',opts:REF.natureSE,obl:true},
      {k:'intitule',t:'Intitulé',full:true,obl:true},
      {k:'public',t:'Lieu / public concerné'},
      {k:'nb',t:'Personnes concernées',type:'number'},
      {k:'note',t:'Commentaire',type:'textarea',full:true}
    ]},
  objectif:{titre:'Objectif SSE',liste:'objectifs',
    champs:[
      {k:'num',t:'N°'},{k:'domaine',t:'Domaine',type:'select',opts:['SECURITE','SANTE','ENVIRONNEMENT','CULTURE SSE']},
      {k:'intitule',t:'Objectif',type:'textarea',full:true,obl:true},
      {k:'indicateur',t:'Indicateurs (texte libre — repris tel quel dans la fiche MASE)',type:'textarea',full:true},
      {k:'moyens',t:'Moyens mis en place',type:'textarea',full:true},
      {k:'c1',t:'Commentaire T1',type:'textarea',full:true},
      {k:'c2',t:'Commentaire T2',type:'textarea',full:true},
      {k:'c3',t:'Commentaire T3',type:'textarea',full:true},
      {k:'c4',t:'Commentaire T4',type:'textarea',full:true}
    ]}
};
let filtreZoneEcran='';
function ouvrirFiche(type,id){
  filtreZoneEcran=zoneChoisie;
  typeFiche=type;const F=FICHES[type];if(!F)return;
  const o=id?state[F.liste].find(x=>x.id===id):null;
  ficheEnCours=o||null;
  zoneChoisie=o?(o.zone||zoneDepuisTexte(o.zoneTexte)):'';
  document.getElementById('mf-titre').textContent=(o?'Modifier — ':'Nouvel enregistrement — ')+F.titre;
  document.getElementById('mf-sous').textContent=o?('Créé le '+frDate(o.date)):'Les champs marqués * sont obligatoires.';
  document.getElementById('mf-del').style.display=o?'':'none';
  let h='<div class="frm">';
  F.champs.forEach(c=>{
    const v=o?(o[c.k]===undefined?'':o[c.k]):'';
    h+='<div class="'+(c.full||c.type==='bonhomme'||c.type==='textarea'?'full':'')+'">';
    h+='<label class="f">'+esc(c.t)+(c.obl?' *':'')+'</label>';
    if(c.type==='select'){
      h+='<select id="f-'+c.k+'"><option value=""></option>'+
         c.opts.map(x=>'<option'+(String(v)===String(x)?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select>';
    }else if(c.type==='textarea'){
      h+='<textarea id="f-'+c.k+'" rows="3">'+esc(v)+'</textarea>';
    }else if(c.type==='bonhomme'){
      h+='<p class="aide">Touche la zone du corps concernée.</p>'+
         '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">'+
         '<div id="f-bonhomme">'+bonhommeCDES({},{cliquable:true,selection:zoneChoisie,hauteur:330})+'</div>'+
         '<div style="flex:1;min-width:190px"><div id="f-zone-lib" class="p cyan" style="margin-bottom:8px">'+esc(zoneChoisie?zoneLib(zoneChoisie):'aucune zone choisie')+'</div>'+
         ZONES.map(z=>'<span class="chip'+(zoneChoisie===z.id?' on':'')+'" data-z="'+z.id+'" onclick="choisirZone(\''+z.id+'\')">'+esc(z.lib)+'</span>').join('')+
         '</div></div>';
    }else if(c.type==='arbre'){
      h+='<p class="aide">Remonte la chaîne : chaque « pourquoi » creuse le précédent. Range ensuite les causes profondes par famille.</p>'+
         '<div id="f-arbre"></div>';
    }else if(c.type==='plan'){
      h+='<p class="aide">Une ligne par action, avec un responsable et une échéance : le dashboard comptera les retards.</p>'+
         '<div id="f-plan"></div>'+
         '<button type="button" class="btn btn-ghost btn-sm" onclick="ajouterAction()">＋ Ajouter une action corrective</button>';
    }else{
      h+='<input type="'+(c.type||'text')+'" id="f-'+c.k+'" value="'+esc(v)+'"'+(c.ph?' placeholder="'+esc(c.ph)+'"':'')+'>';
    }
    h+='</div>';
  });
  h+='</div>';
  document.getElementById('mf-corps').innerHTML=h;
  fArbre  = (o&&jparse(o.arbre,null))||{pourquoi:[],causes:[]};
  if(!Array.isArray(fArbre.pourquoi))fArbre.pourquoi=[];
  if(!Array.isArray(fArbre.causes))fArbre.causes=[];
  fPlan   = (o&&jparse(o.plan,[]))||[];
  renderArbre();renderPlan();
  document.getElementById('m-form').classList.add('open');
}
function jparse(v,def){
  if(v===''||v===null||v===undefined)return def;
  if(typeof v==='object')return v;
  try{return JSON.parse(v)}catch(e){return def}
}

/* ---------- arbre des causes ---------- */
function renderArbre(){
  const b=document.getElementById('f-arbre');if(!b)return;
  let h='<div class="arbre">';
  fArbre.pourquoi.forEach((t,i)=>{
    h+='<div class="pq"><span class="n">Pourquoi '+(i+1)+' ?</span>'+
       '<input type="text" value="'+esc(t)+'" placeholder="parce que…" oninput="fArbre.pourquoi['+i+']=this.value">'+
       '<button type="button" class="x" onclick="retirerPourquoi('+i+')">✕</button></div>';
  });
  h+='<button type="button" class="btn btn-ghost btn-sm" onclick="ajouterPourquoi()">＋ Creuser d’un cran</button>';
  h+='<div class="fam">';
  h+=fArbre.causes.map((c,i)=>
    '<div class="cz"><select onchange="fArbre.causes['+i+'].cat=this.value">'+
    REF.familles.map(f=>'<option'+(c.cat===f?' selected':'')+'>'+esc(f)+'</option>').join('')+'</select>'+
    '<input type="text" value="'+esc(c.t||'')+'" placeholder="cause profonde retenue" oninput="fArbre.causes['+i+'].t=this.value">'+
    '<button type="button" class="x" onclick="retirerCause('+i+')">✕</button></div>').join('');
  h+='<button type="button" class="btn btn-ghost btn-sm" onclick="ajouterCause()">＋ Ajouter une cause profonde</button>';
  h+='</div></div>';
  b.innerHTML=h;
}
function ajouterPourquoi(){if(fArbre.pourquoi.length>=6){toast('Six « pourquoi », c’est déjà bien creusé');return}fArbre.pourquoi.push('');renderArbre()}
function retirerPourquoi(i){fArbre.pourquoi.splice(i,1);renderArbre()}
function ajouterCause(){fArbre.causes.push({cat:REF.familles[0],t:''});renderArbre()}
function retirerCause(i){fArbre.causes.splice(i,1);renderArbre()}

/* ---------- plan d'actions ---------- */
function renderPlan(){
  const b=document.getElementById('f-plan');if(!b)return;
  if(!fPlan.length){b.innerHTML='<p class="hint">Aucune action pour l’instant.</p>';return}
  b.innerHTML='<div class="plan">'+fPlan.map((a,i)=>
    '<div class="ac'+(enRetard(a)?' tard':'')+'">'+
    '<input type="text" class="t" value="'+esc(a.t||'')+'" placeholder="Action à mener" oninput="fPlan['+i+'].t=this.value">'+
    '<input type="text" class="q" value="'+esc(a.q||'')+'" placeholder="Qui ?" oninput="fPlan['+i+'].q=this.value">'+
    '<input type="date" class="e" value="'+esc(a.e||'')+'" onchange="fPlan['+i+'].e=this.value;renderPlan()">'+
    '<select class="s" onchange="fPlan['+i+'].s=this.value;renderPlan()">'+
      REF.statutAction.map(x=>'<option'+((a.s||'À faire')===x?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select>'+
    '<button type="button" class="x" onclick="retirerAction('+i+')">✕</button></div>').join('')+'</div>';
}
function enRetard(a){
  if(!a||!a.e)return false;
  if(/faite/i.test(String(a.s||'')))return false;
  return String(a.e).slice(0,10) < new Date().toISOString().slice(0,10);
}
function ajouterAction(){fPlan.push({t:'',q:'',e:'',s:'À faire'});renderPlan()}
function retirerAction(i){fPlan.splice(i,1);renderPlan()}
function choisirZone(z){
  zoneChoisie=(zoneChoisie===z?'':z);
  const box=document.getElementById('f-bonhomme');
  if(box){box.innerHTML=bonhommeCDES({},{cliquable:true,selection:zoneChoisie,hauteur:330});
    document.getElementById('f-zone-lib').textContent=zoneChoisie?zoneLib(zoneChoisie):'aucune zone choisie';
    document.querySelectorAll('.chip[data-z]').forEach(c=>c.classList.toggle('on',c.dataset.z===zoneChoisie));
  }else{ // clic depuis l'écran : filtre visuel
    renderAcc();
  }
}
function enregistrerFiche(){
  const F=FICHES[typeFiche];if(!F)return;
  const o=ficheEnCours||{id:uid(typeFiche[0])};
  for(const c of F.champs){
    if(c.type==='bonhomme'){o.zone=zoneChoisie;continue}
    if(c.type==='arbre'){
      const a={pourquoi:fArbre.pourquoi.filter(x=>String(x||'').trim()),
               causes:fArbre.causes.filter(x=>String(x.t||'').trim())};
      o.arbre=(a.pourquoi.length||a.causes.length)?JSON.stringify(a):'';continue}
    if(c.type==='plan'){
      const pl=fPlan.filter(x=>String(x.t||'').trim());
      o.plan=pl.length?JSON.stringify(pl):'';continue}
    const el=document.getElementById('f-'+c.k);
    const v=el?String(el.value||'').trim():'';
    if(c.obl&&!v){toast('« '+c.t+' » est obligatoire',true);if(el)el.focus();return}
    o[c.k]=v;
  }
  o.maj=nowISO();
  if(!ficheEnCours)state[F.liste].push(o);
  zoneChoisie='';                       // le choix du formulaire ne doit pas filtrer l'écran
  save();closeModal();rerendre();toast('Enregistré ✓');syncAuto();
}
function supprimerFiche(){
  const F=FICHES[typeFiche];if(!F||!ficheEnCours)return;
  if(!confirm('Supprimer définitivement cet enregistrement ?'))return;
  ficheEnCours.supprime=true;ficheEnCours.maj=nowISO();
  zoneChoisie='';
  save();closeModal();rerendre();toast('Supprimé');syncAuto();
}
function closeModal(){document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));if(aRafraichir)setTimeout(()=>{if(aRafraichir)rafraichirApresSynchro()},50);
  if(typeFiche==='incident'){zoneChoisie=filtreZoneEcran;const v=document.getElementById('v-acc');if(v&&v.classList.contains('active'))renderAcc()}}
document.addEventListener('mousedown',e=>{document.querySelectorAll('.modal.open').forEach(m=>{if(e.target===m)closeModal()})});

/* ==================== SYNCHRONISATION ==================== */
let syncEnCours=false, syncTimer=null;
function syncEtat(t){const el=document.getElementById('sync-etat');if(el)el.textContent=t}
function verifierUrl(u){
  u=String(u||'').trim();
  if(!u)return "Renseigne l'adresse du webhook.";
  if(/\/dev\/?$/.test(u))return "Adresse de TEST (/dev) : il faut celle qui finit par /exec.";
  return '';
}
async function appel(payload,ms){
  const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),ms||45000);
  try{
    const r=await fetch(webhookURL(),{method:'POST',redirect:'follow',signal:ctrl.signal,
      headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const txt=await r.text();
    let j;try{j=JSON.parse(txt)}catch(e){throw new Error('Réponse inattendue — vérifie « Qui a accès : Tout le monde »')}
    if(!j.ok)throw new Error(j.erreur||'Erreur serveur');
    return j;
  }catch(e){
    if(e&&e.name==='AbortError')throw new Error('Le serveur ne répond pas');
    if(e instanceof TypeError)throw new Error("Impossible de joindre l'adresse. "+(verifierUrl(webhookURL())||'Vérifie la connexion'));
    throw e;
  }finally{clearTimeout(t)}
}
function payloadSync(){
  return {secret:conf.secret,action:'rep-sync',appareil:conf.appareil||'appareil',data:{
    mensuel:state.mensuel.map(m=>Object.assign({},m,{maj:m.maj||EPOCH,defauts:JSON.stringify(defautsDe(m))})),
    /* la zone lésée est résolue avant l'envoi : le dashboard reçoit un identifiant net */
    incidents:state.incidents.map(o=>Object.assign({},o,{maj:o.maj||EPOCH,zone:o.zone||zoneDepuisTexte(o.zoneTexte)||''})),
    remontees:state.remontees.map(o=>Object.assign({},o,{maj:o.maj||EPOCH})),
    se:state.se.map(o=>Object.assign({},o,{maj:o.maj||EPOCH})),
    chantiers:chantiers().map(c=>Object.assign({},c,{maj:c.maj||EPOCH})),
    objectifs:state.objectifs.map(o=>Object.assign({},o,{maj:o.maj||EPOCH,
      inds:JSON.stringify(o.inds||[]),vals:JSON.stringify(o.vals||{})})),
    params:state.params
  }};
}
const CLE_COLL={mensuel:m=>m.k+'|'+(m.agence||''),chantiers:c=>c.id||c.nom||c.cle||JSON.stringify(c)};
function cleColl(k,o){return (CLE_COLL[k]||(o=>o.id))(o)}
function modifsDepuis(t0){const r={};
  ['mensuel','incidents','remontees','se','objectifs','chantiers'].forEach(k=>{r[k]=(state[k]||[]).filter(o=>o&&o.maj&&String(o.maj)>=t0).map(o=>JSON.parse(JSON.stringify(o)))});
  return r}
function reappliquer(r){let n=0;
  Object.keys(r).forEach(k=>{if(!Array.isArray(state[k]))state[k]=[];
    r[k].forEach(o=>{const c=cleColl(k,o);const i=state[k].findIndex(x=>cleColl(k,x)===c);
      if(i<0){state[k].push(o);n++}else if(!state[k][i].maj||String(state[k][i].maj)<String(o.maj)){state[k][i]=o;n++}})});
  return n>0}
function appliquer(d){
  ['mensuel','incidents','remontees','se','objectifs','chantiers'].forEach(k=>{if(Array.isArray(d[k]))state[k]=d[k]});
  if(d.bascule&&/^\d{4}-\d{2}$/.test(d.bascule))BASCULE=d.bascule;
  if(d.agenceHistorique)AGENCE_HISTO=d.agenceHistorique;
  if(d.vigiAuto&&/^\d{4}-\d{2}$/.test(d.vigiAuto))VIGI_AUTO=d.vigiAuto;
  if(d.accAuto&&/^\d{4}-\d{2}$/.test(d.accAuto))ACC_AUTO=d.accAuto;
  /* Les tableaux QHP arrivent en LECTURE SEULE : ils ne sont ni saisis ici ni
     renvoyés au serveur. La saisie reste dans l'appli Suivi QHP — c'est ce qui
     garantit qu'on ne peut pas se contredire d'un écran à l'autre. */
  if(d.qhp&&typeof d.qhp==='object')QHP=d.qhp;
  if(d.params&&typeof d.params==='object')state.params=Object.assign({},state.params,d.params);
  normaliserMensuel();
  save();
}
async function syncNow(manuel){
  if(!webhookURL()){if(manuel)toast('Renseigne d’abord la connexion (⚙️)',true);return false}
  if(syncEnCours)return false;
  syncEnCours=true;syncEtat('⏳ Synchronisation…');
  try{
    const t0=nowISO();
    const j=await appel(payloadSync());
    /* V3.3.4 : ce qui a été saisi PENDANT l'aller-retour (maj ≥ t0) n'est pas dans la
       réponse du serveur : on le remet par-dessus, sinon la case « perdait » le chiffre
       et il fallait le retaper. Il repart à la synchro suivante. */
    const recents=modifsDepuis(t0);
    appliquer(j.data||{});
    if(reappliquer(recents)){save();syncAuto()}
    conf.dernierSync=nowISO();saveConf();
    rafraichirApresSynchro();                       // V3.3.4 : en place, sans remonter la page
    syncEtat('✅ Synchronisé à '+new Date().toLocaleTimeString('fr-FR').slice(0,5));
    if(manuel)toast('Synchronisé ✓');
    return true;
  }catch(e){
    syncEtat('⚠️ '+(e.message||'échec'));
    if(manuel)toast('Échec : '+(e.message||'?'),true);
    return false;
  }finally{syncEnCours=false}
}
function syncAuto(){
  if(!estBranche()||conf.autoSync===false)return;
  clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow(false),2500);
}
async function testerWebhook(){
  const u=document.getElementById('sy-url').value.trim(),s=document.getElementById('sy-secret').value.trim();
  const pb=verifierUrl(u);if(pb){syncEtat('⚠️ '+pb);toast('Adresse incorrecte',true);return}
  const old={w:conf.webhook,s:conf.secret};conf.webhook=u;conf.secret=s;
  syncEtat('⏳ Test…');
  try{const j=await appel({secret:s,action:'ping',appareil:conf.appareil||'test'},25000);
    syncEtat('✅ Connexion OK'+(j.editeur?' · droits éditeur reconnus':' · lecture seule (mot de passe ?)'));
    toast('Connexion réussie ✓');
  }catch(e){conf.webhook=old.w;conf.secret=old.s;syncEtat('⚠️ '+(e.message||'échec'));toast('Échec',true)}
}
function saveSync(){
  const u=document.getElementById('sy-url').value.trim();
  if(u){const pb=verifierUrl(u);if(pb){syncEtat('⚠️ '+pb);toast('Adresse incorrecte',true);return}}
  conf.webhook=u;conf.secret=document.getElementById('sy-secret').value.trim();
  conf.appareil=document.getElementById('sy-appareil').value.trim()||'appareil';
  saveConf();renderReglages();toast('Enregistré ✓');if(webhookURL())syncNow(true);
}
function oublierSync(){
  if(!confirm('Effacer l’adresse et le mot de passe sur CET appareil ?'))return;
  conf.webhook='';conf.secret='';saveConf();renderReglages();toast('Effacé');
}
function renderParams(){
  const box=document.getElementById('params-box');if(!box)return;
  let h='';
    const pr=(cle,lib,type)=>'<label class="f">'+lib+'</label><input type="'+(type||'text')+'" id="pr-'+cle+'" value="'+
      esc(state.params[cle]===undefined?'':state.params[cle])+'" onchange="majParam(\''+cle+'\',this.value)">';
    h+='<p class="aide" style="margin-top:2px">Certification MASE — à mettre à jour une fois par an, après l’audit.</p>';
    h+='<div class="mase-pdf"><b>📄 Lire les PDF</b> — dépose le <b>rapport d’audit</b> et le <b>certificat</b> : '+
       'la note, les cinq axes, l’agence, le n° et les dates de validité se remplissent tout seuls.'+
       '<input type="file" id="mase-pdf" accept="application/pdf" multiple onchange="lireMasePdf(this)">'+
       '<div id="mase-pdf-etat" class="aide"></div></div>';
    h+=pr('mase.avancement','Note obtenue à l’audit MASE (%)','number');
    h+=pr('mase.agence','Agence concernée');
    h+='<div class="frm">'+pr('mase.debut','Certifié à compter du','date')+pr('mase.fin','Jusqu’au','date')+'</div>';
    h+=pr('mase.num','N° du certificat');
    h+=pr('mase.certUrl','Lien du certificat (PDF)');
    h+='<p class="aide" style="margin-top:10px">Synoptique de l’audit — les 5 axes, en %.</p><div class="frm">';
    h+=pr('mase.ax1','1. Engagement de la direction','number');
    h+=pr('mase.ax2','2. Compétences et qualifications','number');
    h+=pr('mase.ax3','3. Organisation du travail','number');
    h+=pr('mase.ax4','4. Efficacité du système de management','number');
    h+=pr('mase.ax5','5. Bilan et amélioration continue','number');
    h+='</div>';
    h+='<label class="f">Prochaines échéances sécurité</label><input type="text" id="pr-secu.echeances" value="'+esc(state.params['secu.echeances']===undefined?'':state.params['secu.echeances'])+'" onchange="majParam(\'secu.echeances\',this.value)">';
    h+='<label class="f">Objectif VMS par mois</label><input type="number" id="pr-vms.objMois" value="'+esc(state.params['vms.objMois']===undefined?'':state.params['vms.objMois'])+'" onchange="majParam(\'vms.objMois\',this.value)">';
  box.innerHTML=h;
}
function majParam(k,v){state.params[k]=String(v||'').trim();state.params._maj=nowISO();save();toast('Enregistré ✓');syncAuto()}

/* ==================== MASE : lecture du rapport d'audit et du certificat ====================
   Le rapport SOCOTEC et le certificat du comité de pilotage ont une structure stable :
     « TOTAL AUDIT 3910 / 5000 78,2% »          → la note
     « 1 Engagement de la direction … 720 / 900 80,0% » → un axe par chapitre 1 à 5
     « Société : CDES – Agence d’Ile-de-France »  → l'agence
     « N° N 2026-1066 »                            → le numéro du certificat
     « valable à compter du 05/06/2026 jusqu'au 04/06/2027 » → la validité
   On reconstruit les lignes du PDF (pdf.js donne des morceaux, pas des lignes)
   puis on applique ces motifs. Rien n'est écrasé sans être trouvé. */
const PDFJS_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
function chargerPdfJs(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  return new Promise((ok,ko)=>{
    const sc=document.createElement('script');sc.src=PDFJS_URL;
    sc.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;ok(window.pdfjsLib)};
    sc.onerror=()=>ko(new Error('pdf.js inaccessible (réseau ?)'));
    document.head.appendChild(sc);
  });
}
/* texte d'un PDF, ligne par ligne : on regroupe les morceaux par ordonnée */
async function lignesPdf(fichier){
  const lib=await chargerPdfJs();
  const buf=await fichier.arrayBuffer();
  const doc=await lib.getDocument({data:buf}).promise;
  const lignes=[];
  for(let p=1;p<=doc.numPages;p++){
    const page=await doc.getPage(p);
    const tc=await page.getTextContent();
    const parY={};
    tc.items.forEach(it=>{
      if(!it.str||!it.str.trim())return;
      const y=Math.round(it.transform[5]/2)*2;       // tolérance de 2 pt
      (parY[y]=parY[y]||[]).push({x:it.transform[4],s:it.str});
    });
    Object.keys(parY).map(Number).sort((a,b)=>b-a).forEach(y=>{
      lignes.push(parY[y].sort((a,b)=>a.x-b.x).map(o=>o.s).join(' ').replace(/\s+/g,' ').trim());
    });
  }
  return lignes;
}
/* motifs → champs MASE. Renvoie {champs:{cle:valeur}, trouves:[libellés]} */
function extraireMase(lignes){
  const ch={},vus=[];
  const fr=d=>{const m=String(d).match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?m[3]+'-'+m[2]+'-'+m[1]:''};
  const num=v=>String(v).replace(',','.');
  const AXES={'1':'mase.ax1','2':'mase.ax2','3':'mase.ax3','4':'mase.ax4','5':'mase.ax5'};
  // pdf.js peut rendre les accents en forme décomposée (e + accent) : on recompose.
  // Et les tirets / apostrophes typographiques ressortent parfois comme des
  // caractères de contrôle Windows-1252 (145-150), invisibles : on les ramène en ASCII.
  const propre=l=>String(l).normalize('NFC')
    .replace(/[\u0091\u0092\u2018\u2019]/g,"'").replace(/[\u0093\u0094\u201C\u201D]/g,'"')
    .replace(/[\u0096\u0097\u2013\u2014]/g,'-').replace(/\u00A0/g,' ');
  lignes.map(propre).forEach(l=>{
    let m;
    if((m=l.match(/TOTAL\s+AUDIT\s+\d+\s*\/\s*\d+\s+([\d,\.]+)\s*%/i))){ch['mase.avancement']=num(m[1]);vus.push('note globale '+m[1]+' %')}
    // un chapitre : « 3 Organisation du travail 1010 / 1300 77,7% » (pas « 3.2 … »)
    else if((m=l.match(/^([1-5])\s+(?!\.)\D.*?\s(\d+)\s*\/\s*(\d+)\s+([\d,\.]+)\s*%/))){
      if(AXES[m[1]]&&ch[AXES[m[1]]]===undefined){ch[AXES[m[1]]]=num(m[4]);vus.push('axe '+m[1]+' : '+m[4]+' %')}}
    // pdf.js laisse parfois tomber le tiret et l'apostrophe typographiques : « CDES  Agence dIle-de-France »
    else if((m=l.match(/^Soci[ée]t[ée]\s*:\s*CDES\s*[–-]?\s*Agence\s+d[’']?\s*(.+)$/i))){ch['mase.agence']=m[1].trim();vus.push('agence '+m[1].trim())}
    else if((m=l.match(/N°\s*(N\s*\d{4}\s*-\s*\d{3,5})/))){ch['mase.num']=m[1].replace(/\s+/g,' ').trim();vus.push('certificat '+ch['mase.num'])}
    else if((m=l.match(/compter\s+du\s+(\d{2}\/\d{2}\/\d{4}).*?jusqu[’']?\s*au\s+(\d{2}\/\d{2}\/\d{4})/i))){
      ch['mase.debut']=fr(m[1]);ch['mase.fin']=fr(m[2]);vus.push('valable du '+m[1]+' au '+m[2])}
  });
  return {champs:ch,trouves:vus};
}
async function lireMasePdf(inp){
  const etat=document.getElementById('mase-pdf-etat');
  const fichiers=Array.from(inp.files||[]);if(!fichiers.length)return;
  etat.textContent='Lecture en cours…';
  try{
    let total={};const rapport=[];
    for(const f of fichiers){
      const lignes=await lignesPdf(f);
      const r=extraireMase(lignes);
      Object.assign(total,r.champs);
      rapport.push(f.name+' → '+(r.trouves.length?r.trouves.join(' · '):'rien de reconnu'));
    }
    const cles=Object.keys(total);
    if(!cles.length){etat.innerHTML='⚠️ Aucune valeur reconnue. Ce sont bien le rapport d’audit MASE et le certificat ?<br>'+rapport.map(esc).join('<br>');return}
    cles.forEach(k=>{state.params[k]=String(total[k])});
    state.params._maj=nowISO();save();renderParams();syncAuto();
    document.getElementById('mase-pdf-etat').innerHTML='✅ '+cles.length+' valeur'+(cles.length>1?'s':'')+' reprise'+(cles.length>1?'s':'')+' — vérifie et corrige si besoin.<br>'+rapport.map(esc).join('<br>');
    toast('MASE mis à jour depuis le PDF ✓');
  }catch(e){etat.textContent='❌ '+e.message}
  inp.value='';
}
function renderReglages(){
  renderParams();
  document.getElementById('notes-reglages').innerHTML=panneauNotes('v-reglages');
  document.getElementById('sy-url').value=conf.webhook||'';
  document.getElementById('sy-secret').value=conf.secret||'';
  document.getElementById('sy-appareil').value=conf.appareil||'';
  document.getElementById('apropos').textContent='Reporting HSE CDES — version '+APP_VERSION+
    ' · '+actifs(state.incidents).length+' incidents · '+actifs(state.remontees).length+' remontées'+
    ' · '+chantiers().filter(c=>!c.supprime&&c.agence).length+' chantiers rattachés';
  if(!syncEnCours)syncEtat(webhookURL()?(conf.dernierSync?'Dernière synchro : '+new Date(conf.dernierSync).toLocaleString('fr-FR'):'Configuré — pas encore synchronisé'):'Non configuré — travail local');
}
/* branchement par lien #config=… (même format que l'intranet) */
function deb64url(t){let b=String(t).replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';return decodeURIComponent(escape(atob(b)))}
function appliquerLien(){
  const m=(location.hash||'').match(/[#&]config=([^&]+)/);
  if(!m)return false;
  try{const o=JSON.parse(deb64url(m[1]));if(!o.u)return false;
    conf.webhook=o.u;conf.secret=o.s||'';conf.autoSync=true;
    if(!conf.appareil)conf.appareil=(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?'Téléphone':'PC')+' '+Math.random().toString(36).slice(2,6);
    saveConf();history.replaceState(null,'',location.pathname);
    setTimeout(()=>toast('Appareil branché ✓'),600);return true;
  }catch(e){return false}
}

/* ==================== EXPORT / IMPORT ==================== */
function dl(nom,contenu,type){const b=new Blob([contenu],{type:type||'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=nom;a.click();URL.revokeObjectURL(a.href)}
function exportJSON(){dl('reporting-hse-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({state},null,2));toast('Sauvegarde téléchargée')}
/* Restauration d'une sauvegarde.
   L'ancienne version enveloppait TOUT dans un seul try : une erreur de
   réaffichage était alors annoncée comme « fichier invalide », ce qui envoyait
   chercher le problème au mauvais endroit. On sépare désormais les trois temps
   — lire, valider, appliquer — et on dit lequel a échoué. */
function restaurerDepuisTexte(txt, provenance){
  let j;
  try{ j=JSON.parse(txt); }
  catch(e){
    const debut=String(txt||'').replace(/^\uFEFF/,'').trim().slice(0,40);
    if(/^</.test(debut))
      toast('Ce n’est pas le JSON mais une page web — retélécharge le fichier',true);
    else if(!debut)
      toast('Fichier vide ('+provenance+')',true);
    else
      toast('JSON illisible : '+e.message,true);
    return false;
  }
  const st=(j&&j.state)?j.state:j;               // on accepte aussi l'état seul
  if(!st||typeof st!=='object'||!Array.isArray(st.mensuel)){
    toast('Fichier lu, mais ce n’est pas une sauvegarde du Reporting',true);
    return false;
  }
  const compte=['mensuel','incidents','remontees','objectifs'].map(k=>(st[k]||[]).length);
  if(!confirm('Remplacer les données actuelles par :\n'+
      compte[0]+' mois · '+compte[1]+' incidents · '+compte[2]+' remontées · '+compte[3]+' objectifs ?'))return false;
  // un import sans « params » (ex. l'import 2026) ne doit pas casser Réglages : on garde les réglages actuels
  state=Object.assign({mensuel:[],incidents:[],remontees:[],se:[],objectifs:[],chantiers:[],tomb:{},params:state.params||{}},st);
  if(!state.params||typeof state.params!=='object')state.params={};
  normaliserMensuel();
  save();
  // le réaffichage vient APRÈS l'enregistrement : s'il échoue, les données sont déjà en lieu sûr
  try{ renderAgences(); go(vue); }
  catch(e){ toast('Données chargées, mais l’affichage a planté : '+e.message,true); return true; }
  toast('Restauré ✓ — '+compte[0]+' mois, '+compte[1]+' incidents, '+compte[2]+' remontées');
  return true;
}
function importJSON(inp){
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onerror=()=>{toast('Lecture du fichier impossible',true);inp.value=''};
  r.onload=()=>{restaurerDepuisTexte(r.result,f.name);inp.value=''};
  r.readAsText(f,'utf-8');
}
/* Porte de secours : coller le contenu du fichier, quand le téléchargement
   l'a abîmé ou que le navigateur refuse de le lire. */
function collerJSON(){
  const t=prompt('Colle ici le contenu du fichier de sauvegarde (Ctrl+A puis Ctrl+C dans le fichier) :');
  if(t===null||!t.trim())return;
  restaurerDepuisTexte(t,'presse-papier');
}

/* ==================== DÉMARRAGE ==================== */
function demarrer(){
  load();
  /* réservé au service HSE : sans code éditeur (celui de l'intranet), rien ne s'affiche */
  if(!estBranche()){
    document.body.classList.add('verrou');
    document.querySelector('main').innerHTML='<div class="card verrou-carte"><h2>🔒 Réservé au service HSE</h2>'+
      '<p>Le Reporting n’est accessible qu’aux éditeurs de l’intranet. Ouvre l’intranet avec ton lien éditeur sur cet appareil, puis reviens ici.</p>'+
      '<a class="btn btn-primary" href="./">← Retour à l’intranet</a></div>';
    ['onglets','agences'].forEach(id=>{const e=document.getElementById(id);if(e)e.innerHTML=''});
    document.querySelectorAll('.syncpill').forEach(b=>b.style.display='none');
    return;
  }
  appliquerLien();
  renderOnglets();
  go('v-acc');
  if(webhookURL()){
    document.getElementById('sync-pill').style.display='';
    setTimeout(()=>syncNow(false),700);
    setInterval(()=>{if(!document.hidden)syncNow(false)},300000);
  }
}

window.__LOGO__='img/logo_cdes.png';
(function(){const lg=document.getElementById('logo');if(lg)lg.src=window.__LOGO__})();
/* V3.3.4 : le Reporting est une application à part entière (ouverte depuis la
   brique « Reporting » de la zone HSE). Plus de cadre, plus de messages. */
demarrer();
