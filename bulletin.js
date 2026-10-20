/* ============================================================================
 *  INTRANET HSE — ACCUEIL « BULLETIN HSE »  (V3.2 · 12/10/2026)
 * ----------------------------------------------------------------------------
 *  Reprend la structure du bulletin mensuel du service HSE (juin 2026) :
 *    · le mois en titre ;
 *    · FAITS MARQUANTS HSE (texte libre, saisi par le service HSE) ;
 *    · AT DEPUIS LE 1er JANVIER et NB DE JOURS DEPUIS LE DERNIER AT ;
 *    · tableau REPORTING N-1 / N, colonnes CDES et Intérim, cases colorées ;
 *    · VIGIMINUTES : % de réalisation par mois contre l'objectif ;
 *    · QHP, remontées, nouveaux arrivants, flashs du mois, certification MASE.
 *  Tout vient des données déjà servies par le script (rep, qhp, arrivants) ;
 *  rien de nouveau à saisir sauf les faits marquants (clé KPI « faits.AAAA-MM »,
 *  éditeur seulement). Le sélecteur d'agence du haut filtre tout le bulletin.
 *  Ce fichier ne dépend que des fonctions de intranet.js (repData, qhpData,
 *  kpiVal, esc, frDate, carteMase, arrivants…).
 * ========================================================================== */
const BUL_MOIS_L=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const BUL_MOIS_C=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
/* Seuils de couleur — PROVISOIRES, calés sur le bulletin de juin 2026 (à confirmer par le service HSE).
   Chaque entrée : [limite verte incluse, limite orange incluse] ; au-delà = rouge. null = pas de couleur. */
/* V3.8 — seuils du service HSE (16/10/2026) : vert = 0 ; rouge au-delà de 5 AT avec arrêt
   et de 50 jours d'arrêt ; orange entre les deux. Le reste à l'avenant : AT sans arrêt
   comme les AT avec arrêt, bénins et trajet plus tolérants, Tf / Tg sur les repères BTP.
   Intérim : 1 AT = rouge, sinon vert (pas d'orange). */
const BUL_SEUILS={
  accArret:[0,5], joursArret:[0,50], accSans:[0,5], benins:[0,10], trajet:[0,2], tg:[0,1.5], tf:[0,25]
};
const BUL_SEUILS_INT={ accArret:[0,0], joursArret:[0,0], accSans:[0,0], benins:[0,0], trajet:[0,0], tg:[0,0], tf:[0,0] };
function bulCouleur(cle,v,interim){
  const s=(interim?BUL_SEUILS_INT:BUL_SEUILS)[cle]; if(!s||v===null||v===undefined||v==='')return '';
  const n=Number(v); if(isNaN(n))return '';
  if(s==='zero')return n===0?'vert':'';
  return n<=s[0]?'vert':(n<=s[1]?'orange':'rouge');
}
function bulSmiley(pc,obj){ if(pc===null||pc===undefined||isNaN(pc))return ''; return pc>=obj?'🙂':(pc>=obj*0.8?'😐':'🙁'); }
function bulMoisCourant(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
let bulMois=bulMoisCourant();            // le bulletin s'ouvre toujours sur le mois en cours
function bulSetMois(k){bulMois=k;renderBulletin()}
function bulMoisVoisin(d){const an=Number(bulMois.slice(0,4)),m=Number(bulMois.slice(5,7))-1+d;const x=new Date(an,m,1);
  const k=x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0');if(k>bulMoisCourant())return;bulSetMois(k)}
function bulLib(k){return BUL_MOIS_L[Number(k.slice(5,7))-1]+' '+k.slice(0,4)}
function bulNum(v,dec){if(v===null||v===undefined||v===''||isNaN(Number(v)))return '—';return Number(v).toLocaleString('fr-FR',{minimumFractionDigits:dec||0,maximumFractionDigits:dec||0})}
function bulSomme(rows,c){return rows.reduce((s,m)=>s+(Number(m[c])||0),0)}
/* cumul d'une année jusqu'au mois affiché (année N) ou entière (N-1) */
function bulAnnee(rows,an,jusqua){return (rows||[]).filter(m=>String(m.k).slice(0,4)===an&&(!jusqua||m.k<=jusqua))}
function bulRecordJours(dates){
  const l=(dates||[]).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if(!l.length)return null;
  let rec=0;const J=86400000;
  for(let i=1;i<l.length;i++)rec=Math.max(rec,Math.round((new Date(l[i])-new Date(l[i-1]))/J));
  rec=Math.max(rec,Math.round((new Date(new Date().toISOString().slice(0,10))-new Date(l[l.length-1]))/J));
  return rec;
}

/* Pictos et mascotte : les images du service HSE (img/picto_faits.png, img/picto_flashs.png,
   img/mascotte.png) s'affichent si elles sont dans le dépôt ; sinon un emoji prend la place. */
function bulPicto(nom,emoji){return '<div class="bul-pict"><img src="img/'+nom+'.png" alt="" onload="this.nextElementSibling.style.display=\'none\'" onerror="this.remove()"><span>'+emoji+'</span></div>'}
/* V3.3 paquet 2 : vue Mois / Année, tendances, « Mon agence », podium des conducteurs, PDF */
let bulPeriode='mois';
function bulSetPeriode(p){bulPeriode=(p==='annee'?'annee':'mois');renderBulletin()}
function bulTend(cur,prev,hausseBonne,unite){
  if(cur===null||cur===undefined||prev===null||prev===undefined||isNaN(cur)||isNaN(prev))return '';
  const d=Math.round((cur-prev)*10)/10; if(!d)return '<span class="tend eq" title="identique à la période précédente">＝</span>';
  const bon=hausseBonne?d>0:d<0;
  return '<span class="tend '+(bon?'bon':'mauvais')+'" title="vs période précédente : '+(d>0?'+':'')+d+(unite||'')+'">'+(d>0?'▲':'▼')+' '+(d>0?'+':'')+d+(unite||'')+'</span>';
}
let bulSnap=null;
/* V3.3.2 — PDF DU BULLETIN : plus une impression de l'écran, mais UNE PAGE A4 dessinée
   comme le bulletin mensuel du service HSE : bandeau (logo, BULLETIN HSE, mois, agence,
   mascotte) · Faits marquants · deux gros chiffres AT · tableau Reporting N-1 / N
   (CDES / Intérim, cases rouge / orange / vert) · Vigiminutes vs objectif avec le total
   « N Vigiminutes et N remontées » · Flashs mensuels · ligne QHP / remontées / arrivants.
   Le reste de la page est masqué à l'impression (CSS #bul-print). */
function bulImprimer(){
  if(!bulSnap){renderBulletin();if(!bulSnap){window.print();return}}
  const d=bulSnap, titre=(bulPeriode==='annee'?'Année '+d.an:bulLib(bulMois)).toUpperCase()+(agenceChoisie?' — '+d.agLib.toUpperCase():'');
  const num=(v,dec)=>bulNum(v,dec);
  const tdCl=(c,v,inter)=>{if(inter&&(c==='tg'||c==='tf'))return ' class="gris"';const k=bulCouleur(c,v);return k?' class="'+k+'"':''};
  let h='';
  /* ligne 1-2 : [ MOIS / faits marquants ]  [ AT depuis le 1er janvier / jours depuis dernier AT ] */
  h+='<div class="bp-g1">'
    +'<div class="bp-cyan bp-mois">'+esc(titre)+'</div>'
    +'<div class="bp-cyan bp-k">AT DEPUIS LE 1<sup>er</sup> JANVIER'+(bulPeriode==='annee'?' '+esc(d.an):'')+'</div>'
    +'<div class="bp-faits"><img src="img/picto_faits.png" alt="" onerror="this.remove()"><div><h2>FAITS MARQUANTS HSE :</h2>'
    +(d.faits?'<ul>'+String(d.faits).split(/\n+/).filter(Boolean).map(l=>'<li>- '+esc(l.replace(/^[-•·]\s*/,''))+'</li>').join('')+'</ul>':'<p class="bp-vide">—</p>')+'</div></div>'
    +'<div class="bp-col"><div class="bp-noir">'+(d.cdes.N.dispo?d.cdes.N.accArret:'—')+'</div>'
    +'<div class="bp-cyan bp-k">Nb de jours depuis dernier AT</div>'
    +'<div class="bp-noir">'+(d.js===null?'—':d.js.toLocaleString('fr-FR'))+'</div></div>'
    +'</div>';
  /* ligne 3 : REPORTING | VIGIMINUTES */
  h+='<div class="bp-g2"><div class="bp-cadre"><h3>REPORTING</h3><table class="bp-tab"><thead>'
    +'<tr><th class="vide"></th><th colspan="2" class="an">'+esc(d.anP)+'</th><th colspan="2" class="an">'+esc(d.an)+'</th></tr>'
    +'<tr><th class="vide"></th><th>CDES</th><th>Intérim</th><th>CDES</th><th>Intérim</th></tr></thead><tbody>';
  const LIB={accArret:'AT avec Arrêt',joursArret:'Jours d’Arrêt',accSans:'AT sans Arrêt',benins:'AT Bénins',tg:'T° Gravité',tf:'T° Fréquence'};
  d.L.forEach(([lib,c,dec])=>{
    const vP=d.cdes.P.dispo?d.cdes.P[c]:null, vN=d.cdes.N.dispo?d.cdes.N[c]:null;
    const iP=d.intP&&c!=='tg'&&c!=='tf'?d.intP[c]:(d.interimDispo&&c!=='tg'&&c!=='tf'&&d.cdes.P.dispo?0:null);
    const iN=d.intN&&c!=='tg'&&c!=='tf'?d.intN[c]:(d.interimDispo&&c!=='tg'&&c!=='tf'&&d.cdes.N.dispo?0:null);
    h+='<tr><th>'+esc(LIB[c]||lib)+'</th><td'+tdCl(c,vP)+'>'+num(vP,dec)+'</td><td'+tdCl(c,iP,true)+'>'+(iP===null?'':num(iP,0))+'</td><td'+tdCl(c,vN)+'>'+num(vN,dec)+'</td><td'+tdCl(c,iN,true)+'>'+(iN===null?'':num(iN,0))+'</td></tr>';
  });
  h+='</tbody></table></div>';
  h+='<div class="bp-cadre bp-vigi"><h3>VIGIMINUTES</h3><div class="bp-vtitre">Suivi des VIGIMINUTES<br><span>(Objectif : '+d.objV+' % des Vigi attendues)</span></div>'
    +bulGraphVigi(d.moisG||d.moisAn,d.objV)
    +'<div class="bp-total">'+d.vRecu.toLocaleString('fr-FR')+' Vigiminute'+(d.vRecu>1?'s':'')+' et '+d.remAn.toLocaleString('fr-FR')+' Remontée'+(d.remAn>1?'s':'')+'</div></div></div>';
  /* ligne 4 : FLASHS MENSUELS | mascotte */
  h+='<div class="bp-g3"><img class="bp-pf" src="img/picto_flashs.png" alt="" onerror="this.remove()">'
    +'<div class="bp-flash"><h2>FLASHS '+(bulPeriode==='annee'?'DE L’ANNÉE':'MENSUELS')+' :</h2>'
    +(d.flA.length?'<ul>'+d.flA.map(f=>'<li>- Flash <b>'+esc(bulNature(f.nature).replace(/^Flash\s*/i,'')||'Prévention')+'</b> : '+esc(f.intitule||'—')+'</li>').join('')+'</ul>':'<p class="bp-vide">Aucun flash ce mois-ci.</p>')
    +'<div class="bp-minis">'
    +'<span><b>QHP</b> '+(d.qPc!==null&&d.qPc!==undefined?d.qPc+' % '+bulSmiley(d.qPc,d.objQ):'—')+'</span>'
    +'<span><b>Remontées traitées</b> '+(d.R&&d.R.total?d.R.traitees+' / '+d.R.total+' '+bulSmiley(d.R.pc,d.objV):'—')+'</span>'
    +'<span><b>Arrivants</b> '+(d.tousA?d.compA+' / '+d.tousA+' parcours complets':'—')+'</span>'
    +(d.conds.length?'<span><b>🏆 QHP</b> '+d.conds.map((c,i)=>['🥇','🥈','🥉'][i]+' '+esc(c.nom)).join(' · ')+'</span>':'')
    +'</div></div>'
    +'<img class="bp-masc" src="img/mascotte.png" alt="" onerror="this.remove()"></div>';
  h+='<div class="bp-pied">Service HSE — CDES · généré le '+esc(frDate(new Date().toISOString().slice(0,10)))+' depuis l’intranet HSE</div>';
  let box=document.getElementById('bul-print');
  if(!box){box=document.createElement('div');box.id='bul-print';document.body.appendChild(box)}
  box.innerHTML=h; document.body.classList.add('impression-bulletin');
  const fin=()=>{document.body.classList.remove('impression-bulletin')};
  window.addEventListener('afterprint',fin,{once:true});
  setTimeout(()=>{window.print();setTimeout(fin,1500)},150);
}
function bulBilanCle(an,ag){return 'bilan.'+an+(ag?'.'+ag:'')}
function bulBilanSaisi(an){
  const brut=kpiVal(bulBilanCle(an,agenceChoisie)); if(!brut)return null;
  try{const o=typeof brut==='string'?JSON.parse(brut):brut;return (o&&typeof o==='object')?o:null}catch(e){return null}
}
function renderBulletin(){
  const box=document.getElementById('ess-box');if(!box)return;
  const rep=repData()||{}, rows=rep.mois||[], q=qhpData();
  const an=bulMois.slice(0,4), anP=String(Number(an)-1);
  const rN=bulAnnee(rows,an,bulMois), rP=bulAnnee(rows,anP);
  const heuresN=bulSomme(rN,'heures'), heuresP=bulSomme(rP,'heures');
  const cdes={
    N:{accArret:bulSomme(rN,'accArret'),joursArret:bulSomme(rN,'joursArret'),accSans:bulSomme(rN,'accSans'),benins:bulSomme(rN,'benins'),
       tg:heuresN?bulSomme(rN,'joursArret')*1000/heuresN:null, tf:heuresN?bulSomme(rN,'accArret')*1e6/heuresN:null, dispo:rN.length>0},
    P:{accArret:bulSomme(rP,'accArret'),joursArret:bulSomme(rP,'joursArret'),accSans:bulSomme(rP,'accSans'),benins:bulSomme(rP,'benins'),
       tg:heuresP?bulSomme(rP,'joursArret')*1000/heuresP:null, tf:heuresP?bulSomme(rP,'accArret')*1e6/heuresP:null, dispo:rP.length>0}};
  const ipa=rep.interimParAn||{}; let intN=ipa[an]?Object.assign({},ipa[an]):null, intP=ipa[anP]?Object.assign({},ipa[anP]):null, interimDispo=!!rep.interimParAn;
  /* V3.8 : heures des intérimaires (colonne intHeures du mensuel) → Tf / Tg intérim ; les
     jours d'arrêt intérim saisis au mensuel priment sur ceux des fiches quand ils existent */
  const intH=(l)=>bulSomme(l,'intHeures'), intJ=(l)=>bulSomme(l,'intJoursArret');
  const tauxInt=(o,l)=>{if(!o)return o;const h=intH(l);const j=intJ(l)||o.joursArret||0;o.heures=h;
    o.tg=h?j*1000/h:null;o.tf=h?(o.accArret||0)*1e6/h:null;return o};
  intN=tauxInt(intN,rN); intP=tauxInt(intP,rP);
  /* V3.3.2 : BILAN SAISI pour l'année précédente (zone HSE ▸ « Année précédente »).
     Quand le classeur n'a pas les mois de N-1 (reporting démarré en 2026), les
     totaux tapés à la main prennent la place de la colonne N-1 ; ils priment sur
     des mois partiels. KPI bilan.AAAA (global) ou bilan.AAAA.IDF (par agence). */
  const bilanP=bulBilanSaisi(anP);
  if(bilanP){
    const c=bilanP.cdes||{}, hP=Number(c.heures)||0;
    cdes.P={accArret:Number(c.accArret)||0,joursArret:Number(c.joursArret)||0,accSans:Number(c.accSans)||0,benins:Number(c.benins)||0,
      /* V3.3.4 : Tg / Tf tapés dans le bilan font foi ; sinon calcul depuis les heures */
      tg:(c.tg!==undefined&&c.tg!==''&&!isNaN(Number(c.tg)))?Number(c.tg):(hP?(Number(c.joursArret)||0)*1000/hP:null),
      tf:(c.tf!==undefined&&c.tf!==''&&!isNaN(Number(c.tf)))?Number(c.tf):(hP?(Number(c.accArret)||0)*1e6/hP:null), dispo:true, saisi:true};
    if(bilanP.interim){const i=bilanP.interim,hI=Number(i.heures)||0;intP={accArret:Number(i.accArret)||0,joursArret:Number(i.joursArret)||0,accSans:Number(i.accSans)||0,benins:Number(i.benins)||0,trajet:Number(i.trajet)||0,
      tg:(i.tg!==undefined&&i.tg!==''&&!isNaN(Number(i.tg)))?Number(i.tg):(hI?(Number(i.joursArret)||0)*1000/hI:null),
      tf:(i.tf!==undefined&&i.tf!==''&&!isNaN(Number(i.tf)))?Number(i.tf):(hI?(Number(i.accArret)||0)*1e6/hI:null)};interimDispo=true}
  }
  const js=joursSans(), da=dernierArret(), rec=bulRecordJours(rep.atArretDates);
  const agLib=agenceChoisie?((agencesDispo().find(x=>x.code===agenceChoisie)||{}).lib||agenceChoisie):'CDES — toutes agences';
  let faits=kpiVal('faits.'+bulMois);
  if(bulPeriode==='annee'){const l=[];for(let i=0;i<12;i++){const k=an+'-'+String(i+1).padStart(2,'0');const f=kpiVal('faits.'+k);if(f)String(f).split(/\n+/).filter(Boolean).forEach(x=>l.push(BUL_MOIS_C[i]+' — '+x.replace(/^[-•·]\s*/,'')))}faits=l.join('\n')}
  const estMoisCourant=bulMois>=bulMoisCourant();

  let h='<div class="bul">';
  /* ---- en-tête ---- */
  h+='<div class="bul-head"><div class="bul-head-g"><div class="bul-mois"><button class="bul-nav no-print" onclick="bulMoisVoisin(-1)" title="Mois précédent">‹</button>'
    +'<h2>'+esc(bulPeriode==='annee'?'Année '+bulMois.slice(0,4):bulLib(bulMois))+'</h2>'
    +'<button class="bul-nav no-print" onclick="bulMoisVoisin(1)" '+(estMoisCourant?'disabled':'')+' title="Mois suivant">›</button></div></div>'
    +'<div class="bul-head-d"><span class="seg bul-per no-print"><button class="'+(bulPeriode==='mois'?'on':'')+'" onclick="bulSetPeriode(\'mois\')">Mois</button><button class="'+(bulPeriode==='annee'?'on':'')+'" onclick="bulSetPeriode(\'annee\')">Année</button></span>'
    +'<span class="bul-switch seg no-print"><button data-v="bulletin" onclick="bulSetVue(\'bulletin\')">📰 Bulletin</button><button data-v="dash" onclick="bulSetVue(\'dash\')">📊 Tableau de bord</button></span>'
    +'<button class="bul-nav no-print" style="width:auto;padding:0 10px;font-size:14px" onclick="bulImprimer()" title="Imprimer / enregistrer en PDF ce bulletin">🖨 PDF</button>'
    +'<div class="bul-ag'+(agenceChoisie?' ag-'+agenceChoisie:'')+'">'+esc(agLib)+'</div></div></div>';
  /* V3.3.2 : UN seul bouton de déclaration, discret, dans le bandeau d'actions (le type choisi dans la fenêtre dirige vers les remontées ou vers les accidents) */
  h+='<div class="bul-decl no-print"><button class="btn btn-decl" onclick="ouvrirDeclarer()"><svg class="ico-decl" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2 1.3 21h21.4L12 2.2z" fill="#fff"/><path d="M12 8.6v6.2" stroke="#D7261E" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="18" r="1.5" fill="#D7261E"/></svg>Déclarer un événement</button><span class="muted">situation dangereuse, presqu’accident, bonne pratique, point d’amélioration… ou accident</span></div>';

  /* ---- faits marquants : masqués pour les lecteurs tant que rien n'est saisi ; la saisie se fait dans la zone HSE ---- */
  if(faits||estEditeur()){
    h+='<div class="bul-card bul-faits">'+bulPicto('picto_faits','📣')+'<div class="bul-faits-corps"><h3>Faits marquants HSE</h3>'
      +(faits?'<ul>'+String(faits).split(/\n+/).filter(Boolean).map(l=>'<li>'+esc(l.replace(/^[-•·]\s*/,''))+'</li>').join('')+'</ul>'
             :'<p class="muted">Rien de saisi pour '+esc(bulLib(bulMois).toLowerCase())+' — à écrire dans la zone HSE (carte « Faits marquants »). Les lecteurs ne voient pas cette carte tant qu’elle est vide.</p>')
      +'</div></div>';
  }
  /* ---- AT : carte claire, deux chiffres côte à côte ---- */
  const atCls=bulCouleur('accArret',cdes.N.accArret)||'rouge', jsCls=js===null?'':(js>=100?'vert':(js>=30?'orange':'rouge'));
  h+='<div class="bul-card bul-at'+(faits||estEditeur()?'':' large')+'">'
    +'<div class="bul-at-b"><div class="bul-at-k">AT avec arrêt depuis le 1<sup>er</sup> janvier '+esc(an)+'</div>'
    +'<div class="bul-at-v '+atCls+'">'+(cdes.N.dispo?cdes.N.accArret:'—')+(cdes.P.dispo?bulTend(cdes.N.accArret,bulSomme(bulAnnee(rows,anP,anP+bulMois.slice(4)),'accArret'),false,''):'')+'</div>'
    +'<div class="bul-at-s">'+(cdes.N.dispo?cdes.N.accSans+' sans arrêt · '+cdes.N.benins+' bénin'+(cdes.N.benins>1?'s':''):'pas de données')+'</div></div>'
    +'<div class="bul-at-b"><div class="bul-at-k">Jours depuis le dernier AT avec arrêt</div>'
    +'<div class="bul-at-v '+jsCls+'">'+(js===null?'—':js.toLocaleString('fr-FR'))+'</div>'
    +'<div class="bul-at-s">'+(da?'dernier le '+esc(frDate(String(da).slice(0,10))):'aucun AT avec arrêt connu')+(rec!==null?' · record <b>'+rec.toLocaleString('fr-FR')+' j</b>':'')+'</div></div>'
    +'</div>';

  /* ---- tableau reporting N-1 / N ---- */
  const L=[['AT avec arrêt','accArret',0],['Jours d’arrêt','joursArret',0],['AT sans arrêt','accSans',0],['AT bénins','benins',0],['Taux de gravité','tg',2],['Taux de fréquence','tf',2]];
  h+='<div class="bul-card bul-rep"><h3>Reporting</h3><div class="bul-scroll"><table class="bul-tab"><thead>'
    +'<tr><th rowspan="2"></th><th colspan="2">'+esc(anP)+'</th><th colspan="2">'+esc(an)+'</th></tr>'
    +'<tr><th>CDES</th><th class="int">Intérim</th><th>CDES</th><th class="int">Intérim</th></tr></thead><tbody>';
  L.forEach(([lib,c,dec])=>{
    const vP=cdes.P.dispo?cdes.P[c]:null, vN=cdes.N.dispo?cdes.N[c]:null;
    const estTaux=(c==='tg'||c==='tf');
    /* V3.8 : Tf / Tg intérim quand les heures intérim sont connues (mensuel ou bilan N-1) */
    const iP=intP?(estTaux?(intP[c]===null||intP[c]===undefined?null:intP[c]):intP[c]):(interimDispo&&!estTaux&&cdes.P.dispo?0:null);
    const iN=intN?(estTaux?(intN[c]===null||intN[c]===undefined?null:intN[c]):intN[c]):(interimDispo&&!estTaux&&cdes.N.dispo?0:null);
    h+='<tr><th>'+esc(lib)+'</th>'
      +'<td class="'+bulCouleur(c,vP)+'">'+bulNum(vP,dec)+'</td><td class="int '+bulCouleur(c,iP,true)+'">'+(iP===null?'—':bulNum(iP,dec))+'</td>'
      +'<td class="'+bulCouleur(c,vN)+'">'+bulNum(vN,dec)+'</td><td class="int '+bulCouleur(c,iN,true)+'">'+(iN===null?'—':bulNum(iN,dec))+'</td></tr>';
  });
  h+='</tbody></table></div><p class="hint">'+esc(an)+' : cumul au '+esc(bulLib(bulMois).toLowerCase())+' · '+esc(anP)+' : année entière'+(cdes.P.saisi?' (bilan saisi par le service HSE)':'')+'. '
    +'Tg = jours d’arrêt × 1 000 / heures · Tf = AT avec arrêt × 10⁶ / heures.'
    +(interimDispo?' Intérim : AT dont la catégorie du collaborateur est « intérimaire » ; Tf / Tg intérim dès que les heures intérim sont saisies dans le mensuel (colonnes Intérimaires).':' Colonne Intérim : disponible après la nouvelle version du script.')
    +' Couleurs : vert = 0 · rouge au-delà de 5 AT avec arrêt ou 50 jours d’arrêt · intérim : rouge dès 1.</p></div>';

  /* ---- Vigiminutes ---- */
  const objV=Number(kpiVal('vigi.objPart'))||80;
  const moisAn=[];for(let i=0;i<12;i++){const k=an+'-'+String(i+1).padStart(2,'0');const m=rows.find(x=>x.k===k);
    const att=m?Number(m.vigiAtt)||0:0, recu=m?Number(m.vigiRecu)||0:0;moisAn.push({k,att,recu,pc:att>0?Math.round(recu/att*100):null})}
  /* V3.13 : vue Mois → la barre du mois, les Vigiminutes et les remontées DU MOIS (par agence si une agence est choisie) ;
     vue Année → les 12 barres et le cumul depuis janvier */
  const estAn=bulPeriode==='annee';
  const parMoisRem=(rep.remontees&&rep.remontees.parMois)||[];
  const mCur=moisAn.find(m=>m.k===bulMois)||{};
  const vRecu=estAn?moisAn.filter(m=>m.k<=bulMois).reduce((s,m)=>s+m.recu,0):(Number(mCur.recu)||0);
  const vAtt=estAn?moisAn.filter(m=>m.k<=bulMois).reduce((s,m)=>s+m.att,0):(Number(mCur.att)||0);
  const remAn=parMoisRem.filter(x=>estAn?(String(x.k).slice(0,4)===an&&x.k<=bulMois):x.k===bulMois).reduce((s,x)=>s+(Number(x.n)||0),0);
  const moisG=estAn?moisAn:[Object.assign({k:bulMois,att:0,recu:0,pc:null},mCur)];
  const vPc=vAtt>0?Math.round(vRecu/vAtt*100):null;
  h+='<div class="bul-card bul-vigi"><h3>Vigiminutes <span class="bul-obj">objectif : '+objV+' % des Vigi attendues</span>'
    +(mCur.pc!==null&&mCur.pc!==undefined?'<span class="bul-sm" title="'+esc(bulLib(bulMois))+' : '+mCur.pc+' %">'+bulSmiley(mCur.pc,objV)+(function(){const i=moisAn.findIndex(m=>m.k===bulMois);const pv=i>0?moisAn[i-1].pc:null;return bulTend(mCur.pc,pv,true,' pt')})()+'</span>':'')+'</h3>'
    +bulGraphVigi(moisG,objV)
    +'<div class="bul-total">'+vRecu.toLocaleString('fr-FR')+' Vigiminute'+(vRecu>1?'s':'')+(vAtt?' <span class="muted">sur '+vAtt.toLocaleString('fr-FR')+' attendue'+(vAtt>1?'s':'')+(vPc!==null?' ('+vPc+' %)':'')+'</span>':'')+' et '+remAn.toLocaleString('fr-FR')+' remontée'+(remAn>1?'s':'')+' <span class="muted">'+(estAn?'depuis janvier':'en '+esc(bulLib(bulMois).toLowerCase()))+'</span>'+(typeof oublisBouton==='function'?oublisBouton('vigi'):'')+'</div></div>';

  /* ---- QHP · remontées · arrivants ---- */
  const objQ=(q&&q.objPart)||Number(kpiVal('qhp.objPart'))||80;
  function qhpMois(k){const m=q&&Array.isArray(q.mois)?q.mois.find(x=>x.k===k):null;if(!m)return null;
    if(agenceChoisie){const pa=m.parAgence&&m.parAgence[agenceChoisie];return pa?{eff:pa.eff,vus:pa.vus,nb:null}:null}
    return {eff:m.eff,vus:m.vus,nb:m.nb}}
  let qm=null,qEff=0,qVus=0,qNb=null,qPc=null,qPrev=null;
  if(bulPeriode==='annee'){const l=[];for(let i=0;i<12;i++){const k=an+'-'+String(i+1).padStart(2,'0');if(k>bulMois)break;const m=qhpMois(k);if(m&&m.eff)l.push(m)}
    if(l.length){qm=true;qEff=Math.round(l.reduce((s,m)=>s+m.eff,0)/l.length);qVus=Math.round(l.reduce((s,m)=>s+m.vus,0)/l.length);qNb=l.some(m=>m.nb!==null)?l.reduce((s,m)=>s+(m.nb||0),0):null;qPc=Math.round(l.reduce((s,m)=>s+m.vus/m.eff*100,0)/l.length)}}
  else{qm=qhpMois(bulMois);if(qm){qEff=qm.eff;qVus=qm.vus;qNb=qm.nb;qPc=qEff?Math.round(qVus/qEff*100):null}
    const d=new Date(Number(an),Number(bulMois.slice(5,7))-2,1);const kp=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');const pm=qhpMois(kp);qPrev=pm&&pm.eff?Math.round(pm.vus/pm.eff*100):null}
  const rowM=rows.find(m=>m.k===bulMois)||{};
  /* V3.13 : vue Année → graphique en barres du % de participation aux QHP, mois par mois (même lecture que les Vigiminutes) */
  let qAn=[];
  if(bulPeriode==='annee'){for(let i=0;i<12;i++){const k=an+'-'+String(i+1).padStart(2,'0');if(k>bulMois)break;const m=qhpMois(k),rm=rows.find(x=>x.k===k)||{};
      let eff=m&&m.eff?m.eff:(Number(rm.qhpEff)||0),vus=m&&m.eff?m.vus:(Number(rm.qhpPart)||0);
      qAn.push({k,eff,vus,nb:m?m.nb:null,pc:eff?Math.round(vus/eff*100):null,titre:BUL_MOIS_L[i]+' : '+vus+' collaborateur(s) sur '+eff+(eff?' ('+Math.round(vus/eff*100)+' %)':'')})}
    while(qAn.length<12){const i=qAn.length;qAn.push({k:an+'-'+String(i+1).padStart(2,'0'),pc:null})}
    h+='<div class="bul-card bul-qhpan"><h3>QHP '+esc(an)+' <span class="bul-obj">objectif : '+objQ+' % de l’effectif chaque mois</span></h3>'
      +bulGraphBarres(qAn,objQ,{cOk:'#7A4FC0',cKo:'#c9b5ea',legende:'% de participation',aria:'QHP : pourcentage de participation par mois'})
      +'<div class="bul-total">'+(qPc!==null?qPc+' % <span class="muted">de participation en moyenne</span>':'—')+(qNb!==null?' · '+qNb+' QHP <span class="muted">depuis janvier</span>':'')+'</div></div>';
    h+=bulCarteVms(an);
  }
  h+='<div class="bul-card bul-mini"><div class="bul-mini-ico">🗣️</div><h3>QHP '+esc(bulPeriode==='annee'?an:BUL_MOIS_C[Number(bulMois.slice(5,7))-1])+'</h3>'
    +(qPc!==null?'<div class="bul-big">'+qPc+' %<span class="bul-sm">'+bulSmiley(qPc,objQ)+bulTend(qPc,qPrev,true,' pt')+'</span></div><div class="bul-sub">'+(bulPeriode==='annee'?'en moyenne, ':'')+qVus+' collaborateur'+(qVus>1?'s':'')+' sur '+qEff+' ont participé'+(qNb!==null?' · '+qNb+' QHP réalisé'+(qNb>1?'s':''):'')+'</div>'
      :(Number(rowM.qhpEff)>0?'<div class="bul-big">'+Math.round(Number(rowM.qhpPart)/Number(rowM.qhpEff)*100)+' %<span class="bul-sm">'+bulSmiley(Math.round(Number(rowM.qhpPart)/Number(rowM.qhpEff)*100),objQ)+'</span></div><div class="bul-sub">'+rowM.qhpPart+' / '+rowM.qhpEff+' collaborateurs (reporting)</div>'
      :'<div class="bul-big muted">—</div><div class="bul-sub">pas encore de QHP ce mois-ci</div>'))+(typeof oublisBouton==='function'?oublisBouton('qhp'):'')+'</div>';
  let R=rep.remontees;
  if(typeof remontees==='function'){const lr=remontees().filter(r=>!agenceChoisie||(r.agence||'')===agenceChoisie);
    if(lr.length){const tr=lr.filter(r=>!remOuverte(r)).length;R={total:lr.length,traitees:tr,pc:Math.round(tr/lr.length*100),sd:lr.filter(r=>remType(r.type).c==='sd').length}}}
  h+='<div class="bul-card bul-mini bul-link" onclick="go(\'v-rem\')" title="Ouvrir le suivi des remontées terrain"><div class="bul-mini-ico">📬</div><h3>Remontées terrain</h3>'
    +(R&&R.total?'<div class="bul-big">'+R.traitees+'<small>/'+R.total+'</small><span class="bul-sm">'+bulSmiley(R.pc,objV)+'</span></div><div class="bul-sub">traitées · '+R.pc+' %'+(R.sd?' · '+R.sd+' situation'+(R.sd>1?'s':'')+' dangereuse'+(R.sd>1?'s':''):'')+'</div>'
      :'<div class="bul-big muted">—</div><div class="bul-sub">aucune remontée enregistrée</div>')+'</div>';
  const tousA=(typeof arrivants==='function'?arrivants():[]).filter(a=>!agenceChoisie||(a.agence||'')===agenceChoisie), compA=tousA.filter(a=>typeof arrivComplet==='function'&&arrivComplet(a)).length;
  const pcA=tousA.length?Math.round(compA/tousA.length*100):null;
  h+='<div class="bul-card bul-mini bul-link" onclick="go(\'v-arriv\')" title="Ouvrir le suivi des nouveaux arrivants"><div class="bul-mini-ico">👷</div><h3>Nouveaux arrivants</h3>'
    +(tousA.length?'<div class="bul-big">'+compA+'<small>/'+tousA.length+'</small><span class="bul-sm">'+bulSmiley(pcA,100)+'</span></div><div class="bul-sub">parcours complets · '+(tousA.length-compA)+' à compléter</div>'
      :'<div class="bul-big muted">—</div><div class="bul-sub">aucun arrivant suivi</div>')+'</div>';

  /* ---- V3.3 p2 : « Mon agence en un écran » (vue agence) ---- */
  if(agenceChoisie){
    const idxQ=q&&Array.isArray(q.mois)?q.mois.findIndex(m=>m.k===bulMois):-1;
    const condsAg=(q&&Array.isArray(q.conducteurs)?q.conducteurs:[]).filter(c=>(c.agence||'')===agenceChoisie);
    const manquants=idxQ>=0?condsAg.filter(c=>!(c.mois&&c.mois[idxQ]>0)):[];
    const aComp=tousA.filter(a=>!(typeof arrivComplet==='function'&&arrivComplet(a))&&!(typeof arrivAncien==='function'&&arrivAncien(a)));
    const remAg=(typeof remontees==='function'?remontees():[]).filter(r=>(r.agence||'')===agenceChoisie&&remOuverte(r));
    const sansRep=remAg.filter(r=>!String(r.action||'').trim()&&!(r.commentaires||[]).length);
    h+='<div class="bul-card bul-agence"><h3>📌 À faire dans l’agence — '+esc(bulLib(bulMois).toLowerCase())+'</h3><div class="bul-ag3">'
      +'<div><b>🗣️ QHP du mois</b>'+(idxQ<0||!condsAg.length?'<p class="muted">pas d’encadrant chantier connu pour cette agence</p>':(manquants.length?'<p>'+manquants.length+' encadrant'+(manquants.length>1?'s':'')+' chantier sans QHP : <span class="bul-noms">'+manquants.map(c=>esc(c.nom)).join(', ')+'</span></p>':'<p class="ok">✔ tous les encadrants chantiers ont animé leur QHP</p>'))+'</div>'
      +'<div onclick="go(\'v-arriv\')" class="bul-link"><b>👷 Arrivants à compléter</b>'+(aComp.length?'<p>'+aComp.length+' : <span class="bul-noms">'+aComp.slice(0,6).map(a=>esc(a.nom)+' <i>'+JALONS.filter(j=>jalonEtat(a,j.c)!=='todo').length+'/'+JALONS.length+'</i>').join(', ')+(aComp.length>6?'…':'')+'</span></p>':'<p class="ok">✔ tous les parcours sont complets</p>')+'</div>'
      +'<div onclick="go(\'v-rem\')" class="bul-link"><b>📬 Remontées ouvertes</b>'+(remAg.length?'<p>'+remAg.length+' ouverte'+(remAg.length>1?'s':'')+(sansRep.length?', <b>'+sansRep.length+' sans réponse</b>':'')+' : <span class="bul-noms">'+remAg.slice(0,3).map(r=>esc(String(r.sujet||'').slice(0,50))).join(' · ')+'</span></p>':'<p class="ok">✔ aucune remontée en attente</p>')+'</div>'
      +'</div></div>';
  }
  /* ---- V3.3 p2 : podium bienveillant des encadrants chantiers (V3.13 : « Encadrants chantiers ») ---- */
  {
    const idxQ=q&&Array.isArray(q.mois)?q.mois.findIndex(m=>m.k===bulMois):-1;
    let conds=(q&&Array.isArray(q.conducteurs)?q.conducteurs:[]).filter(c=>!agenceChoisie||(c.agence||'')===agenceChoisie);
    const score=c=>bulPeriode==='annee'?(c.mois||[]).reduce((s,n,i)=>s+((q.mois[i]&&String(q.mois[i].k).slice(0,4)===an)?n:0),0):(idxQ>=0&&c.mois?c.mois[idxQ]:0);
    conds=conds.map(c=>({nom:c.nom,agence:c.agence,n:score(c),part:c.participants||0})).filter(c=>c.n>0).sort((a,b)=>b.n-a.n||b.part-a.part).slice(0,5);
    if(conds.length){const med=['🥇','🥈','🥉','🏅','🏅'];
      /* égalité = même médaille (deux premiers ex æquo → deux 🥇, le suivant 🥉) */
      let rang=0;conds.forEach((c,i)=>{if(i>0&&c.n===conds[i-1].n)c.r=conds[i-1].r;else{rang=i;c.r=rang}});
      h+='<div class="bul-card bul-podium"><h3>🏆 Encadrants chantiers — QHP '+esc(bulPeriode==='annee'?an:BUL_MOIS_C[Number(bulMois.slice(5,7))-1])+'</h3><ol class="bul-pod">'
        +conds.map((c,i)=>'<li><span class="med">'+med[c.r]+'</span><span class="nom">'+esc(c.nom)+(agenceChoisie?'':' <span class="apill ag-'+esc(c.agence||'')+'">'+esc(c.agence||'')+'</span>')+'</span><b>'+c.n+' QHP</b></li>').join('')
        +'</ol><p class="hint" style="margin:6px 0 0">Bravo à eux — et merci à tous ceux qui animent les quarts d’heure prévention.</p></div>';
    }
  }
  if(bulPeriode!=='annee')h+=bulCarteVms(an);   // V3.13 : VMS du mois, cumul de l'année et podium
  /* ---- flashs du mois + MASE ---- */
  const fl=(rep.flashs||[]), flM=bulPeriode==='annee'?fl.filter(f=>String(f.date).slice(0,4)===an):fl.filter(f=>String(f.date).slice(0,7)===bulMois), flA=flM.length?flM.slice(0,bulPeriode==='annee'?14:6):fl.filter(f=>String(f.date).slice(0,4)===an&&f.date<=bulMois+'-31').slice(0,3);
  h+='<div class="bul-card bul-flash">'+bulPicto('picto_flashs','⚡')+'<div class="bul-faits-corps"><h3>Flashs '+(bulPeriode==='annee'?'de l’année':(flM.length?'mensuels':'récents'))+'</h3>'
    +(flA.length?'<ul>'+flA.map(f=>'<li><b>'+esc(bulNature(f.nature))+'</b> : '+esc(f.intitule||'—')+((flM.length&&bulPeriode!=='annee')?'':' <span class="muted">('+esc(BUL_MOIS_C[Number(String(f.date).slice(5,7))-1])+')</span>')+'</li>').join('')+'</ul>'
      :'<p class="muted">Aucun flash enregistré'+(rep.flashs?' pour '+esc(bulLib(bulMois).toLowerCase()):' (nouvelle version du script nécessaire)')+'.</p>')
    +(typeof flashsDuMois==='function'?'<button class="btn btn-primary btn-sm no-print" style="margin-top:8px" onclick="flashsDuMois()">⚡ Ouvrir les flashs du mois</button>':'')   // V3.5.1
    +'</div></div>';
  h+='<div class="bul-card bul-masc"><img src="img/mascotte.png" alt="Mascotte CDES" onerror="var c=this.closest(\'.bul-masc\');if(c){c.remove();var f=document.querySelector(\'.bul-flash\');if(f)f.classList.add(\'large\')}"></div>';
  h+='<div class="bul-card bul-mase">'+(typeof carteMase==='function'?carteMase():'')+'</div>';
  h+='</div>';
  box.innerHTML=h;
  bulAppliquerVue();
  /* V3.3.2 : tout ce qu'il faut pour le PDF « bulletin » (mise en page dédiée, voir bulImprimer) */
  bulSnap={an,anP,cdes,intN,intP,interimDispo,js,da,rec,faits,agLib,L,moisAn,moisG,objV,vRecu,remAn,mCur,qPc,qVus,qEff,qNb,objQ,R,tousA:tousA.length,compA,flA,flM:flM.length,
    conds:(function(){try{const idxQ=q&&Array.isArray(q.mois)?q.mois.findIndex(m=>m.k===bulMois):-1;let c=(q&&Array.isArray(q.conducteurs)?q.conducteurs:[]).filter(c=>!agenceChoisie||(c.agence||'')===agenceChoisie);
      const sc=c=>bulPeriode==='annee'?(c.mois||[]).reduce((s,n,i)=>s+((q.mois[i]&&String(q.mois[i].k).slice(0,4)===an)?n:0),0):(idxQ>=0&&c.mois?c.mois[idxQ]:0);
      return c.map(c=>({nom:c.nom,n:sc(c)})).filter(c=>c.n>0).sort((a,b)=>b.n-a.n).slice(0,3)}catch(e){return []}})()};
}
/* ===== V3.13 — VMS DANS LE BULLETIN : réalisation du mois, de l'année, et podium =====
   Données : rep.vms.personnes [{nom, agence, objectif (VMS par an), dates:['AAAA-MM-JJ']}] (serveur V31.5,
   onglets VMS_PERSONNES / VMS_VISITES du Reporting HSE). Objectif du mois = objectifs annuels / 12. */
function bulCarteVms(an){
  const g=(typeof repGlobal==='function'?repGlobal():null)||{},v=g.vms;
  const titre='<h3>🦺 VMS — visites managériales de sécurité</h3>';
  if(!v||!Array.isArray(v.personnes))return '<div class="bul-card bul-vms">'+titre+'<p class="muted">Disponible après la nouvelle version du script de l’intranet (V31.5).</p></div>';
  const P=v.personnes.filter(p=>!agenceChoisie||(p.agence||'')===agenceChoisie);
  if(!P.length)return '<div class="bul-card bul-vms">'+titre+'<p class="muted">Aucune personne suivie'+(agenceChoisie?' pour cette agence':'')+' (Reporting HSE ▸ VMS &amp; QHP).</p></div>';
  const estAn=bulPeriode==='annee',mi=Number(bulMois.slice(5,7));
  const dansMois=d=>String(d).slice(0,7)===bulMois, dansAn=d=>String(d).slice(0,4)===an&&String(d).slice(0,7)<=bulMois;
  const objAn=P.reduce((s,p)=>s+(Number(p.objectif)||0),0), objMois=objAn/12, objDate=objAn*mi/12;
  const nMois=P.reduce((s,p)=>s+(p.dates||[]).filter(dansMois).length,0), nAn=P.reduce((s,p)=>s+(p.dates||[]).filter(dansAn).length,0);
  const pcAn=objAn?Math.round(nAn/objAn*100):null, pcDate=objDate?Math.round(nAn/objDate*100):null;
  const fmt=x=>(Math.round(x*10)/10).toLocaleString('fr-FR');
  let h='<div class="bul-card bul-vms">'+titre+'<div class="bul-vms-2">'
    +(estAn?'':'<div class="bul-vms-b"><div class="bul-vms-k">'+esc(bulLib(bulMois))+'</div><div class="bul-big">'+nMois+'<small> VMS</small><span class="bul-sm">'+bulSmiley(objMois?Math.round(nMois/objMois*100):null,100)+'</span></div><div class="bul-sub">objectif du mois ≈ '+fmt(objMois)+' (objectifs annuels ÷ 12)</div></div>')
    +'<div class="bul-vms-b"><div class="bul-vms-k">Depuis janvier '+esc(an)+'</div><div class="bul-big">'+nAn+'<small>/'+objAn+'</small><span class="bul-sm">'+bulSmiley(pcDate,100)+'</span></div>'
    +'<div class="bul-vbar" title="trait = où on devrait en être fin '+esc(bulLib(bulMois).toLowerCase())+' ('+fmt(objDate)+' VMS)"><i style="width:'+Math.min(100,pcAn||0)+'%"></i><span style="left:'+Math.min(100,mi/12*100)+'%"></span></div>'
    +'<div class="bul-sub">'+(pcAn!==null?pcAn+' % de l’objectif annuel · ':'')+'attendu à date ≈ '+fmt(objDate)+'</div></div></div>';
  const sc=p=>(p.dates||[]).filter(estAn?dansAn:dansMois).length;
  let L=P.map(p=>({nom:p.nom,agence:p.agence,n:sc(p),obj:Number(p.objectif)||0})).filter(p=>p.n>0).sort((a,b)=>b.n-a.n||a.nom.localeCompare(b.nom,'fr')).slice(0,5);
  if(L.length){const med=['🥇','🥈','🥉','🏅','🏅'];L.forEach((c,i)=>{c.r=(i>0&&c.n===L[i-1].n)?L[i-1].r:i});
    h+='<div class="bul-vms-k" style="margin-top:8px">🏆 Podium '+(estAn?esc(an):esc(bulLib(bulMois).toLowerCase()))+'</div><ol class="bul-pod">'
      +L.map(c=>'<li><span class="med">'+med[c.r]+'</span><span class="nom">'+esc(c.nom)+(agenceChoisie||!c.agence?'':' <span class="apill ag-'+esc(c.agence)+'">'+esc(c.agence)+'</span>')+'</span><b>'+c.n+' VMS'+(estAn&&c.obj?' <span class="muted">/ '+c.obj+'</span>':'')+'</b></li>').join('')+'</ol>'}
  else h+='<p class="muted" style="margin:8px 0 0">Aucune VMS '+(estAn?'cette année':'ce mois-ci')+' pour l’instant.</p>';
  return h+'</div>';
}
/* Accueil : « Bulletin » (la page simple, pour tout le monde) ou « Tableau de bord »
   (toutes les familles d'indicateurs, courbes, tableaux QHP). Mémorisé par appareil. */
function bulVue(){return conf.vueAccueil==='dash'?'dash':'bulletin'}
function bulSetVue(v){conf.vueAccueil=(v==='dash'?'dash':'bulletin');saveConfLS();bulAppliquerVue();window.scrollTo(0,0)}
function bulAppliquerVue(){
  const dash=bulVue()==='dash';
  document.body.classList.toggle('vue-dash',dash);
  const d=document.getElementById('dash-detail');if(d)d.style.display=dash?'':'none';
  document.querySelectorAll('.bul-switch button').forEach(b=>b.classList.toggle('on',b.dataset.v===(dash?'dash':'bulletin')));
}
function bulNature(n){const t=String(n||'');if(/retex/i.test(t))return 'Flash RETEX';if(/s[ée]cu/i.test(t))return 'Flash Sécurité';if(/sant/i.test(t))return 'Flash Santé';if(/environ/i.test(t))return 'Flash Environnement';return t||'Flash'}
/* V3.13 — graphique en barres générique : % par mois, ligne d'objectif. Une seule barre en vue Mois,
   les 12 en vue Année. m = {k:'AAAA-MM', pc, titre} ; couleurs : atteint / en dessous. */
function bulGraphBarres(liste,obj,o){o=o||{};
  const W=560,H=190,pl=34,pb=34,pt=16,pr=10,n=Math.max(liste.length,1),iw=(W-pl-pr)/n;
  const cOk=o.cOk||'#E8720C',cKo=o.cKo||'#f1b27a';
  let s='<svg class="bul-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.aria||'pourcentage par mois')+'">';
  [0,25,50,75,100].forEach(p=>{const y=pt+(H-pt-pb)*(1-p/100);s+='<line x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'" stroke="#e3eaf1"/><text x="'+(pl-6)+'" y="'+(y+4)+'" text-anchor="end" font-size="10" fill="#7b8fa3">'+p+'%</text>'});
  liste.forEach((m,i)=>{
    const w=Math.min(iw*0.6,90), x=pl+i*iw+(iw-w)/2, mi=Number(String(m.k).slice(5,7))-1;
    if(m.pc!==null&&m.pc!==undefined){const hh=(H-pt-pb)*Math.min(m.pc,100)/100, y=pt+(H-pt-pb)-hh;
      s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" rx="4" fill="'+(m.pc>=obj?cOk:cKo)+'"><title>'+esc(m.titre||(BUL_MOIS_L[mi]+' : '+m.pc+' %'))+'</title></rect>'
        +'<text x="'+(x+w/2)+'" y="'+(y-4)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#14283e">'+m.pc+'%</text>'}
    s+='<text x="'+(x+w/2)+'" y="'+(H-pb+14)+'" text-anchor="middle" font-size="10" fill="#4c6379">'+(n===1?BUL_MOIS_L[mi]:BUL_MOIS_C[mi])+'</text>'});
  const yo=pt+(H-pt-pb)*(1-obj/100);
  s+='<line x1="'+pl+'" y1="'+yo+'" x2="'+(W-pr)+'" y2="'+yo+'" stroke="#1F6FB2" stroke-width="3" stroke-linecap="round"/>';
  s+='<text x="'+(W-pr)+'" y="'+(yo-6)+'" text-anchor="end" font-size="10" font-weight="700" fill="#1F6FB2">objectif '+obj+' %</text>';
  s+='<g transform="translate('+pl+','+(H-8)+')"><rect width="12" height="8" fill="'+cOk+'" rx="2"/><text x="16" y="8" font-size="10" fill="#4c6379">'+esc(o.legende||'% réalisation')+'</text><line x1="130" y1="4" x2="150" y2="4" stroke="#1F6FB2" stroke-width="3"/><text x="154" y="8" font-size="10" fill="#4c6379">objectif</text></g>';
  return s+'</svg>';
}
function bulGraphVigi(moisAn,obj){return bulGraphBarres(moisAn.map(m=>Object.assign({},m,{titre:BUL_MOIS_L[Number(String(m.k).slice(5,7))-1]+' : '+m.recu+' Vigiminute(s) sur '+m.att+' attendue(s)'+(m.pc!==null?' ('+m.pc+' %)':'')})),obj,{aria:'Vigiminutes : pourcentage de réalisation par mois'})}
/* faits marquants : texte libre, 1 ligne = 1 point, clé KPI « faits.AAAA-MM », éditeur seulement */
function bulEditerFaits(mois){
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  mois=mois||bulMois;
  const cle='faits.'+mois, act=String(kpiVal(cle)||'');
  const t=prompt('Faits marquants HSE — '+bulLib(mois)+'\nUne ligne par point (3 maximum conseillé) :',act);
  if(t===null)return;
  state.kpi[cle]=t.trim();state.kpiMaj[cle]=nowISO();save();renderBulletin();if(typeof renderTodo==='function')renderTodo();
  if(typeof syncAuto==='function')syncAuto();
  toast(t.trim()?'Faits marquants enregistrés ✓':'Faits marquants effacés');
}
/* MODE AFFICHAGE (écran d'agence, TV de réunion) : ?affichage=1 ou ?affichage=IDF.
   Plein écran, sans en-tête ni volet ; en vue CDES les agences tournent toutes
   les 20 s ; les données se rafraîchissent par la synchro habituelle. Le verrou
   de consultation s'applique comme partout. */
(function(){
  const m=/[?&]affichage=([^&#]*)/.exec(location.search||'');if(!m)return;
  document.body.classList.add('affichage');
  const code=decodeURIComponent(m[1]||'').toUpperCase();
  window.addEventListener('load',()=>{
    try{if(['IDF','NA','BPL'].includes(code))setAgence(code);}catch(e){}
    if(!['IDF','NA','BPL'].includes(code)){const cyc=['','IDF','NA','BPL'];let i=0;setInterval(()=>{i=(i+1)%cyc.length;try{setAgence(cyc[i])}catch(e){}},20000)}
    setInterval(()=>{try{if(typeof syncOuLecture==='function')syncOuLecture(false)}catch(e){}},600000);
  });
})();
/* si l'intranet a déjà dessiné l'accueil avant que ce fichier soit chargé, on le redessine en bulletin */
try{if(document.getElementById('ess-box')&&document.getElementById('ess-box').innerHTML&&!document.body.classList.contains('verrouille'))renderBulletin()}catch(e){}
