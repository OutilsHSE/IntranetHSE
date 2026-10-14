/* ============================================================================
 *  INTRANET HSE — ACCUEIL « BULLETIN HSE »  (V3.2 · 12/10/2026)
 * ----------------------------------------------------------------------------
 *  Reprend la structure du bulletin mensuel de Justin (juin 2026) :
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
/* Seuils de couleur — PROVISOIRES, calés sur le bulletin de juin 2026 (à confirmer par Justin).
   Chaque entrée : [limite verte incluse, limite orange incluse] ; au-delà = rouge. null = pas de couleur. */
const BUL_SEUILS={
  accArret:[0,1], joursArret:[0,30], accSans:null, benins:null, tg:[0.5,1.5], tf:[10,25]
};
function bulCouleur(cle,v){
  const s=BUL_SEUILS[cle]; if(!s||v===null||v===undefined||v==='')return '';
  const n=Number(v); if(isNaN(n))return '';
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

/* Pictos et mascotte : les images de Justin (img/picto_faits.png, img/picto_flashs.png,
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
function bulImprimer(){window.print()}
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
  const ipa=rep.interimParAn||{}, intN=ipa[an]||null, intP=ipa[anP]||null, interimDispo=!!rep.interimParAn;
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
  /* V3.3 : les deux boutons du terrain, visibles par tous */
  h+='<div class="bul-actions no-print"><button class="btn-sig" onclick="ouvrirSignaler()"><b>⚡ Signaler</b><span>situation dangereuse, presqu’accident, bonne pratique</span></button>'
    +'<button class="btn-pre" onclick="ouvrirPredeclaration()"><b>🚨 Pré-déclarer un accident</b><span>six champs, le service HSE complète</span></button></div>';

  /* ---- faits marquants + AT ---- */
  h+='<div class="bul-card bul-faits">'+bulPicto('picto_faits','📣')+'<div class="bul-faits-corps"><h3>Faits marquants HSE</h3>'
    +(faits?'<ul>'+String(faits).split(/\n+/).filter(Boolean).map(l=>'<li>'+esc(l.replace(/^[-•·]\s*/,''))+'</li>').join('')+'</ul>'
           :'<p class="muted">Rien de saisi pour ce mois.'+(estEditeur()?' Clique sur ✏️ pour écrire 1 à 3 lignes (journée sécurité, certification, visite…).':'')+'</p>')
    +(estEditeur()?'<button class="btn btn-ghost btn-sm no-print bul-edit" onclick="bulEditerFaits()">✏️ Modifier</button>':'')+'</div></div>';
  h+='<div class="bul-card bul-at"><div class="bul-at-k">AT depuis le 1<sup>er</sup> janvier '+esc(an)+'</div>'
    +'<div class="bul-at-v '+(cdes.N.accArret===0?'vert':(cdes.N.accArret===1?'orange':'rouge'))+'">'+(cdes.N.dispo?cdes.N.accArret:'—')
    +(cdes.P.dispo?bulTend(cdes.N.accArret,bulSomme(bulAnnee(rows,anP,anP+bulMois.slice(4)),'accArret'),false,''):'')+'</div>'
    +'<div class="bul-at-s">avec arrêt'+(cdes.N.dispo?' · '+cdes.N.accSans+' sans arrêt · '+cdes.N.benins+' bénin'+(cdes.N.benins>1?'s':''):'')+'</div>'
    +'<div class="bul-at-k">Nb de jours depuis le dernier AT</div>'
    +'<div class="bul-at-v '+(js===null?'':(js>=100?'vert':(js>=30?'orange':'rouge')))+'">'+(js===null?'—':js.toLocaleString('fr-FR'))+'</div>'
    +'<div class="bul-at-s">'+(da?'dernier AT avec arrêt le '+esc(frDate(String(da).slice(0,10))):'aucun AT avec arrêt connu')
    +(rec!==null?' · record <b>'+rec.toLocaleString('fr-FR')+' j</b>':'')+'</div></div>';

  /* ---- tableau reporting N-1 / N ---- */
  const L=[['AT avec arrêt','accArret',0],['Jours d’arrêt','joursArret',0],['AT sans arrêt','accSans',0],['AT bénins','benins',0],['Taux de gravité','tg',2],['Taux de fréquence','tf',2]];
  h+='<div class="bul-card bul-rep"><h3>Reporting</h3><div class="bul-scroll"><table class="bul-tab"><thead>'
    +'<tr><th rowspan="2"></th><th colspan="2">'+esc(anP)+'</th><th colspan="2">'+esc(an)+'</th></tr>'
    +'<tr><th>CDES</th><th class="int">Intérim</th><th>CDES</th><th class="int">Intérim</th></tr></thead><tbody>';
  L.forEach(([lib,c,dec])=>{
    const vP=cdes.P.dispo?cdes.P[c]:null, vN=cdes.N.dispo?cdes.N[c]:null;
    const iP=intP&&c!=='tg'&&c!=='tf'?intP[c]:(interimDispo&&c!=='tg'&&c!=='tf'&&cdes.P.dispo?0:null);
    const iN=intN&&c!=='tg'&&c!=='tf'?intN[c]:(interimDispo&&c!=='tg'&&c!=='tf'&&cdes.N.dispo?0:null);
    h+='<tr><th>'+esc(lib)+'</th>'
      +'<td class="'+bulCouleur(c,vP)+'">'+bulNum(vP,dec)+'</td><td class="int '+bulCouleur(c,iP)+'">'+(iP===null?'—':bulNum(iP,0))+'</td>'
      +'<td class="'+bulCouleur(c,vN)+'">'+bulNum(vN,dec)+'</td><td class="int '+bulCouleur(c,iN)+'">'+(iN===null?'—':bulNum(iN,0))+'</td></tr>';
  });
  h+='</tbody></table></div><p class="hint">'+esc(an)+' : cumul au '+esc(bulLib(bulMois).toLowerCase())+' · '+esc(anP)+' : année entière. '
    +'Tg = jours d’arrêt × 1 000 / heures · Tf = AT avec arrêt × 10⁶ / heures.'
    +(interimDispo?' Intérim : AT dont la catégorie du collaborateur est « intérimaire ».':' Colonne Intérim : disponible après la nouvelle version du script.')+'</p></div>';

  /* ---- Vigiminutes ---- */
  const objV=Number(kpiVal('vigi.objPart'))||80;
  const moisAn=[];for(let i=0;i<12;i++){const k=an+'-'+String(i+1).padStart(2,'0');const m=rows.find(x=>x.k===k);
    const att=m?Number(m.vigiAtt)||0:0, recu=m?Number(m.vigiRecu)||0:0;moisAn.push({k,att,recu,pc:att>0?Math.round(recu/att*100):null})}
  const vRecu=moisAn.filter(m=>m.k<=bulMois).reduce((s,m)=>s+m.recu,0);
  const remAn=((rep.remontees&&rep.remontees.parMois)||[]).filter(x=>String(x.k).slice(0,4)===an&&x.k<=bulMois).reduce((s,x)=>s+(Number(x.n)||0),0);
  const mCur=moisAn.find(m=>m.k===bulMois)||{};
  h+='<div class="bul-card bul-vigi"><h3>Vigiminutes <span class="bul-obj">objectif : '+objV+' % des Vigi attendues</span>'
    +(mCur.pc!==null&&mCur.pc!==undefined?'<span class="bul-sm" title="'+esc(bulLib(bulMois))+' : '+mCur.pc+' %">'+bulSmiley(mCur.pc,objV)+(function(){const i=moisAn.findIndex(m=>m.k===bulMois);const pv=i>0?moisAn[i-1].pc:null;return bulTend(mCur.pc,pv,true,' pt')})()+'</span>':'')+'</h3>'
    +bulGraphVigi(moisAn,objV)
    +'<div class="bul-total">'+vRecu.toLocaleString('fr-FR')+' Vigiminute'+(vRecu>1?'s':'')+' et '+remAn.toLocaleString('fr-FR')+' remontée'+(remAn>1?'s':'')+' <span class="muted">depuis janvier</span></div></div>';

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
  h+='<div class="bul-card bul-mini"><div class="bul-mini-ico">🗣️</div><h3>QHP '+esc(bulPeriode==='annee'?an:BUL_MOIS_C[Number(bulMois.slice(5,7))-1])+'</h3>'
    +(qPc!==null?'<div class="bul-big">'+qPc+' %<span class="bul-sm">'+bulSmiley(qPc,objQ)+bulTend(qPc,qPrev,true,' pt')+'</span></div><div class="bul-sub">'+(bulPeriode==='annee'?'en moyenne, ':'')+qVus+' collaborateur'+(qVus>1?'s':'')+' sur '+qEff+' ont participé'+(qNb!==null?' · '+qNb+' QHP réalisé'+(qNb>1?'s':''):'')+'</div>'
      :(Number(rowM.qhpEff)>0?'<div class="bul-big">'+Math.round(Number(rowM.qhpPart)/Number(rowM.qhpEff)*100)+' %<span class="bul-sm">'+bulSmiley(Math.round(Number(rowM.qhpPart)/Number(rowM.qhpEff)*100),objQ)+'</span></div><div class="bul-sub">'+rowM.qhpPart+' / '+rowM.qhpEff+' collaborateurs (reporting)</div>'
      :'<div class="bul-big muted">—</div><div class="bul-sub">pas encore de QHP ce mois-ci</div>'))+'</div>';
  let R=rep.remontees;
  if(typeof remontees==='function'){const lr=remontees().filter(r=>!agenceChoisie||(r.agence||'')===agenceChoisie);
    if(lr.length){const tr=lr.filter(r=>!remOuverte(r)).length;R={total:lr.length,traitees:tr,pc:Math.round(tr/lr.length*100),sd:lr.filter(r=>remType(r.type).c==='sd').length}}}
  h+='<div class="bul-card bul-mini bul-link" onclick="go(\'v-rem\')" title="Ouvrir le suivi des remontées terrain"><div class="bul-mini-ico">📬</div><h3>Remontées terrain</h3>'
    +(R&&R.total?'<div class="bul-big">'+R.traitees+'<small>/'+R.total+'</small><span class="bul-sm">'+bulSmiley(R.pc,objV)+'</span></div><div class="bul-sub">traitées · '+R.pc+' %'+(R.sd?' · '+R.sd+' situation'+(R.sd>1?'s':'')+' dangereuse'+(R.sd>1?'s':''):'')+'</div>'
      :'<div class="bul-big muted">—</div><div class="bul-sub">aucune remontée enregistrée</div>')+'</div>';
  const tousA=(typeof arrivants==='function'?arrivants():[]).filter(a=>!agenceChoisie||(a.agence||'')===agenceChoisie), compA=tousA.filter(a=>typeof arrivComplet==='function'&&arrivComplet(a)).length;
  const pcA=tousA.length?Math.round(compA/tousA.length*100):null;
  h+='<div class="bul-card bul-mini bul-link" onclick="go(\'v-arriv\')" title="Ouvrir le suivi des nouveaux arrivants"><div class="bul-mini-ico">🎒</div><h3>Nouveaux arrivants</h3>'
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
      +'<div><b>🗣️ QHP du mois</b>'+(idxQ<0||!condsAg.length?'<p class="muted">pas de conducteur connu pour cette agence</p>':(manquants.length?'<p>'+manquants.length+' conducteur'+(manquants.length>1?'s':'')+' sans QHP : <span class="bul-noms">'+manquants.map(c=>esc(c.nom)).join(', ')+'</span></p>':'<p class="ok">✔ tous les conducteurs ont animé leur QHP</p>'))+'</div>'
      +'<div onclick="go(\'v-arriv\')" class="bul-link"><b>🎒 Arrivants à compléter</b>'+(aComp.length?'<p>'+aComp.length+' : <span class="bul-noms">'+aComp.slice(0,6).map(a=>esc(a.nom)+' <i>'+JALONS.filter(j=>jalonEtat(a,j.c)!=='todo').length+'/'+JALONS.length+'</i>').join(', ')+(aComp.length>6?'…':'')+'</span></p>':'<p class="ok">✔ tous les parcours sont complets</p>')+'</div>'
      +'<div onclick="go(\'v-rem\')" class="bul-link"><b>📬 Remontées ouvertes</b>'+(remAg.length?'<p>'+remAg.length+' ouverte'+(remAg.length>1?'s':'')+(sansRep.length?', <b>'+sansRep.length+' sans réponse</b>':'')+' : <span class="bul-noms">'+remAg.slice(0,3).map(r=>esc(String(r.sujet||'').slice(0,50))).join(' · ')+'</span></p>':'<p class="ok">✔ aucune remontée en attente</p>')+'</div>'
      +'</div></div>';
  }
  /* ---- V3.3 p2 : podium bienveillant des conducteurs de travaux ---- */
  {
    const idxQ=q&&Array.isArray(q.mois)?q.mois.findIndex(m=>m.k===bulMois):-1;
    let conds=(q&&Array.isArray(q.conducteurs)?q.conducteurs:[]).filter(c=>!agenceChoisie||(c.agence||'')===agenceChoisie);
    const score=c=>bulPeriode==='annee'?(c.mois||[]).reduce((s,n,i)=>s+((q.mois[i]&&String(q.mois[i].k).slice(0,4)===an)?n:0),0):(idxQ>=0&&c.mois?c.mois[idxQ]:0);
    conds=conds.map(c=>({nom:c.nom,agence:c.agence,n:score(c),part:c.participants||0})).filter(c=>c.n>0).sort((a,b)=>b.n-a.n||b.part-a.part).slice(0,5);
    if(conds.length){const med=['🥇','🥈','🥉','🏅','🏅'];
      h+='<div class="bul-card bul-podium"><h3>🏆 Conducteurs de travaux — QHP '+esc(bulPeriode==='annee'?an:BUL_MOIS_C[Number(bulMois.slice(5,7))-1])+'</h3><ol class="bul-pod">'
        +conds.map((c,i)=>'<li><span class="med">'+med[i]+'</span><span class="nom">'+esc(c.nom)+(agenceChoisie?'':' <span class="apill ag-'+esc(c.agence||'')+'">'+esc(c.agence||'')+'</span>')+'</span><b>'+c.n+' QHP</b></li>').join('')
        +'</ol><p class="hint" style="margin:6px 0 0">Bravo à eux — et merci à tous ceux qui animent les quarts d’heure prévention.</p></div>';
    }
  }
  /* ---- flashs du mois + MASE ---- */
  const fl=(rep.flashs||[]), flM=bulPeriode==='annee'?fl.filter(f=>String(f.date).slice(0,4)===an):fl.filter(f=>String(f.date).slice(0,7)===bulMois), flA=flM.length?flM.slice(0,bulPeriode==='annee'?14:6):fl.filter(f=>String(f.date).slice(0,4)===an&&f.date<=bulMois+'-31').slice(0,3);
  h+='<div class="bul-card bul-flash">'+bulPicto('picto_flashs','⚡')+'<div class="bul-faits-corps"><h3>Flashs '+(bulPeriode==='annee'?'de l’année':(flM.length?'mensuels':'récents'))+'</h3>'
    +(flA.length?'<ul>'+flA.map(f=>'<li><b>'+esc(bulNature(f.nature))+'</b> : '+esc(f.intitule||'—')+((flM.length&&bulPeriode!=='annee')?'':' <span class="muted">('+esc(BUL_MOIS_C[Number(String(f.date).slice(5,7))-1])+')</span>')+'</li>').join('')+'</ul>'
      :'<p class="muted">Aucun flash enregistré'+(rep.flashs?' pour '+esc(bulLib(bulMois).toLowerCase()):' (nouvelle version du script nécessaire)')+'.</p>')
    +'</div></div>';
  h+='<div class="bul-card bul-masc"><img src="img/mascotte.png" alt="Mascotte CDES" onerror="var c=this.closest(\'.bul-masc\');if(c){c.remove();var f=document.querySelector(\'.bul-flash\');if(f)f.classList.add(\'large\')}"></div>';
  h+='<div class="bul-card bul-mase">'+(typeof carteMase==='function'?carteMase():'')+'</div>';
  h+='</div>';
  box.innerHTML=h;
  bulAppliquerVue();
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
function bulGraphVigi(moisAn,obj){
  const W=560,H=190,pl=34,pb=34,pt=16,pr=10,iw=(W-pl-pr)/12;
  let s='<svg class="bul-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Vigiminutes : pourcentage de réalisation par mois">';
  [0,25,50,75,100].forEach(p=>{const y=pt+(H-pt-pb)*(1-p/100);s+='<line x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'" stroke="#e3eaf1"/><text x="'+(pl-6)+'" y="'+(y+4)+'" text-anchor="end" font-size="10" fill="#7b8fa3">'+p+'%</text>'});
  moisAn.forEach((m,i)=>{
    const x=pl+i*iw+iw*0.2, w=iw*0.6;
    if(m.pc!==null){const hh=(H-pt-pb)*Math.min(m.pc,100)/100, y=pt+(H-pt-pb)-hh;
      s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" rx="4" fill="'+(m.pc>=obj?'#E8720C':'#f1b27a')+'"><title>'+esc(BUL_MOIS_L[i])+' : '+m.recu+' / '+m.att+' ('+m.pc+' %)</title></rect>'
        +'<text x="'+(x+w/2)+'" y="'+(y-4)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#14283e">'+m.pc+'%</text>'}
    s+='<text x="'+(x+w/2)+'" y="'+(H-pb+14)+'" text-anchor="middle" font-size="10" fill="#4c6379">'+BUL_MOIS_C[i]+'</text>'});
  const yo=pt+(H-pt-pb)*(1-obj/100);
  s+='<line x1="'+pl+'" y1="'+yo+'" x2="'+(W-pr)+'" y2="'+yo+'" stroke="#1F6FB2" stroke-width="3" stroke-linecap="round"/>';
  s+='<text x="'+(W-pr)+'" y="'+(yo-6)+'" text-anchor="end" font-size="10" font-weight="700" fill="#1F6FB2">objectif '+obj+' %</text>';
  s+='<g transform="translate('+pl+','+(H-8)+')"><rect width="12" height="8" fill="#E8720C" rx="2"/><text x="16" y="8" font-size="10" fill="#4c6379">% réalisation</text><line x1="110" y1="4" x2="130" y2="4" stroke="#1F6FB2" stroke-width="3"/><text x="134" y="8" font-size="10" fill="#4c6379">objectif</text></g>';
  return s+'</svg>';
}
/* faits marquants : texte libre, 1 ligne = 1 point, clé KPI « faits.AAAA-MM », éditeur seulement */
function bulEditerFaits(){
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  const cle='faits.'+bulMois, act=String(kpiVal(cle)||'');
  const t=prompt('Faits marquants HSE — '+bulLib(bulMois)+'\nUne ligne par point (3 maximum conseillé) :',act);
  if(t===null)return;
  state.kpi[cle]=t.trim();state.kpiMaj[cle]=nowISO();save();renderBulletin();
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
