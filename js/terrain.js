/* ============================================================================
 *  INTRANET HSE — TERRAIN  (V3.3 · paquet 1 · 12/10/2026)
 * ----------------------------------------------------------------------------
 *  · ⚡ SIGNALER : un signalement court pour les encadrants, écrit dans la même
 *    table que les remontées Vigiminutes (source « encadrant »).
 *  · 📬 SUIVI DES REMONTÉES TERRAIN : une ligne par remontée, par agence ;
 *    statut, action décidée, qui, échéance, fil de commentaires — modifiables
 *    par tout appareil déverrouillé, rien ne s'efface, tout est tracé.
 *  · 🚨 PRÉ-DÉCLARATION D'ACCIDENT : six champs à chaud ; la fiche se finit
 *    dans la zone HSE et reste dans la to-do tant qu'elle n'est pas analysée.
 *  · ✅ TO-DO HSE : servie par la synchro éditeur, affichée en tête de la zone HSE.
 *  Dépend de intranet.js (state, conf, appel, esc, toast, go, agenceChoisie…).
 * ========================================================================== */
const REM_TYPES=['SD (Situation Dangereuse)','PA (Point d\'Amélioration)','BP (Bonne Pratique)','Presqu\'AT'];
const REM_DOMAINES=['Sécurité','Santé','Environnement','Réglementaire','Démarche SSE'];
const REM_STATUTS=['Non traitée','En cours','Traitée'];
const AT_TYPES=['Presqu\'Accident de Travail','Accident Bénin','Accident sans Arrêt de Travail','Accident avec Arrêt de Travail','Accident de trajet'];
const AG_LIBS={IDF:'Île-de-France',NA:'Nouvelle-Aquitaine',BPL:'Bretagne – Pays de la Loire'};
let remFiltre={statut:'ouvertes',source:''};
function remontees(){return (state.remontees||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.maj||'').localeCompare(String(a.maj||'')))}
function remType(t){const s=String(t||'');if(/^sd|situation/i.test(s))return{c:'sd',l:'SD'};if(/^bp|bonne/i.test(s))return{c:'bp',l:'BP'};if(/presqu/i.test(s))return{c:'pa',l:'Presqu’AT'};if(/^pa|am[ée]lior/i.test(s))return{c:'am',l:'PA'};return{c:'au',l:s||'—'}}
function remOuverte(r){return !/^trait/i.test(String(r.statut||''))}
function chantiersConnus(){const s={};remontees().forEach(r=>{const c=String(r.chantier||'').trim();if(c)s[c]=1});(state.arrivants||[]).forEach(a=>{const c=String(a.chantier||'').trim();if(c)s[c]=1});return Object.keys(s).sort((a,b)=>a.localeCompare(b,'fr'))}
function agenceParDefaut(){return agenceChoisie||conf.agenceAppareil||''}
function selectAgence(id,val){return '<select id="'+id+'"><option value="">— agence —</option>'+['IDF','NA','BPL'].map(a=>'<option value="'+a+'"'+(val===a?' selected':'')+'>'+a+' — '+AG_LIBS[a]+'</option>').join('')+'</select>'}
function datalistChantiers(){return '<datalist id="dl-chantiers">'+chantiersConnus().map(c=>'<option value="'+esc(c)+'">').join('')+'</datalist>'}
function majAgenceAppareil(a){if(a){conf.agenceAppareil=a;saveConfLS()}}

/* ---------- ⚡ Signaler ---------- */
function ouvrirSignaler(){
  const b=document.getElementById('ms-corps');
  b.innerHTML='<div class="row"><div class="grow"><label class="f">Agence *</label>'+selectAgence('ms-agence',agenceParDefaut())+'</div>'
    +'<div class="grow"><label class="f">Chantier / lieu *</label><input type="text" id="ms-chantier" list="dl-chantiers" placeholder="Ex. Ardres, Atelier…" value="'+esc(conf.chantierAppareil||'')+'">'+datalistChantiers()+'</div></div>'
    +'<div class="row"><div class="grow"><label class="f">Type *</label><select id="ms-type">'+REM_TYPES.map(t=>'<option>'+esc(t)+'</option>').join('')+'</select></div>'
    +'<div class="grow"><label class="f">Domaine</label><select id="ms-domaine">'+REM_DOMAINES.map(t=>'<option>'+esc(t)+'</option>').join('')+'</select></div></div>'
    +'<label class="f">Ce que tu as vu *</label><textarea id="ms-sujet" rows="3" placeholder="Décris en une ou deux phrases : quoi, où, quel risque."></textarea>'
    +'<label class="row" style="gap:8px;align-items:center;cursor:pointer;margin-top:6px"><input type="checkbox" id="ms-urgent"> <span>⚠️ Urgent — risque immédiat (le service HSE est prévenu en priorité)</span></label>'
    +'<p class="hint">Pas de photo pour l’instant : décris, le service HSE te rappellera si besoin. Le signalement rejoint le suivi des remontées terrain, visible par tous.</p>';
  document.getElementById('m-signal').classList.add('open');
  setTimeout(()=>{const s=document.getElementById('ms-sujet');if(s&&document.getElementById('ms-chantier').value)s.focus()},80);
}
async function envoyerSignalement(){
  const g=id=>(document.getElementById(id)||{}).value||'';
  const agence=g('ms-agence'),chantier=g('ms-chantier').trim(),sujet=g('ms-sujet').trim();
  if(!agence){toast('Choisis l’agence',true);return}
  if(!chantier){toast('Indique le chantier ou le lieu',true);return}
  if(sujet.length<5){toast('Décris ce que tu as vu',true);return}
  const urgent=document.getElementById('ms-urgent').checked;
  const o={agence,chantier,sujet:(urgent?'⚠️ URGENT — ':'')+sujet,type:g('ms-type'),domaine:g('ms-domaine'),impact:urgent?4:2,source:'encadrant',statut:'Non traitée'};
  majAgenceAppareil(agence);conf.chantierAppareil=chantier;saveConfLS();
  closeModal();
  const ok=await envoyerRemontees([o],'⚡ Signalement envoyé — merci !');
  if(ok)go('v-rem');
}
async function envoyerRemontees(items,msg){
  if(!webhookLecture()){toast('Le suivi n’est pas branché : renseigne config.js',true);return false}
  try{
    const j=await appel({action:'remontees-maj',appareil:conf.appareil||nomAppareil(),data:{remontees:items}});
    if(j.data&&Array.isArray(j.data.remontees))state.remontees=j.data.remontees;
    save();renderRemontees();if(typeof renderBulletin==='function')renderBulletin();
    toast(msg||'Enregistré ✓');return true;
  }catch(e){
    if(e&&e.verrou){oublierVerrou();montrerVerrou('Le mot de passe a changé. Redemande-le au service HSE.');return false}
    toast('Échec : '+(e.message||'?'),true);return false}
}

/* ---------- 🚨 Pré-déclaration d'accident ---------- */
function ouvrirPredeclaration(){
  const d=new Date(),pad=n=>String(n).padStart(2,'0');
  const b=document.getElementById('mp-corps');
  b.innerHTML='<div class="row"><div class="grow"><label class="f">Date *</label><input type="date" id="mp-date" value="'+d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'"></div>'
    +'<div style="width:120px"><label class="f">Heure</label><input type="time" id="mp-heure" value="'+pad(d.getHours())+':'+pad(d.getMinutes())+'"></div></div>'
    +'<div class="row"><div class="grow"><label class="f">Agence *</label>'+selectAgence('mp-agence',agenceParDefaut())+'</div>'
    +'<div class="grow"><label class="f">Chantier / lieu *</label><input type="text" id="mp-chantier" list="dl-chantiers" value="'+esc(conf.chantierAppareil||'')+'">'+datalistChantiers()+'</div></div>'
    +'<label class="f">Type d’événement *</label><select id="mp-type">'+AT_TYPES.map(t=>'<option>'+esc(t)+'</option>').join('')+'</select>'
    +'<label class="f">Collaborateur concerné <span class="muted" style="font-weight:400">(facultatif ici — le service HSE complète)</span></label><input type="text" id="mp-collab" placeholder="Nom Prénom" autocomplete="off">'
    +'<label class="f">Ce qui s’est passé *</label><textarea id="mp-desc" rows="3" placeholder="Les faits, en quelques phrases. L’analyse viendra après."></textarea>'
    +'<p class="hint">Cette pré-déclaration crée la fiche dans le journal des accidents du service HSE, qui la complète (blessure, analyse, plan d’actions). En cas d’urgence vitale : 15 / 112 d’abord.</p>';
  document.getElementById('m-predecl').classList.add('open');
}
async function envoyerPredeclaration(){
  const g=id=>(document.getElementById(id)||{}).value||'';
  const agence=g('mp-agence'),chantier=g('mp-chantier').trim(),desc=g('mp-desc').trim();
  if(!agence){toast('Choisis l’agence',true);return}
  if(!chantier){toast('Indique le chantier ou le lieu',true);return}
  if(desc.length<5){toast('Décris ce qui s’est passé',true);return}
  if(!webhookLecture()){toast('Le suivi n’est pas branché : renseigne config.js',true);return}
  majAgenceAppareil(agence);conf.chantierAppareil=chantier;saveConfLS();
  const inc={agence,date:g('mp-date'),heure:g('mp-heure'),type:g('mp-type'),chantier,collaborateur:g('mp-collab').trim(),description:desc};
  try{
    const j=await appel({action:'incident-pre',appareil:conf.appareil||nomAppareil(),data:{incident:inc}});
    if(!j.ok)throw new Error(j.erreur||'?');
    closeModal();toast('🚨 Pré-déclaration envoyée au service HSE');
    if(typeof syncOuLecture==='function')setTimeout(()=>syncOuLecture(false),800);
  }catch(e){
    if(e&&e.verrou){oublierVerrou();montrerVerrou('Le mot de passe a changé. Redemande-le au service HSE.');return}
    toast('Échec : '+(e.message||'?'),true)}
}

/* ---------- 📬 Suivi des remontées terrain ---------- */
function setRemFiltre(k,v){remFiltre[k]=v;renderRemontees()}
function remVisibles(){
  return remontees().filter(r=>
    (!agenceChoisie||(r.agence||'')===agenceChoisie)&&
    (remFiltre.statut==='toutes'||(remFiltre.statut==='ouvertes'?remOuverte(r):String(r.statut||'')===remFiltre.statut))&&
    (!remFiltre.source||(remFiltre.source==='encadrant'?r.source==='encadrant':r.source!=='encadrant')));
}
let remOuverts={};
function renderRemontees(){
  const box=document.getElementById('v-rem');if(!box)return;
  const tous=remontees().filter(r=>!agenceChoisie||(r.agence||'')===agenceChoisie), ouv=tous.filter(remOuverte).length, l=remVisibles();
  const sansRep=tous.filter(r=>remOuverte(r)&&!String(r.action||'').trim()&&!(r.commentaires||[]).length).length;
  let h='<div class="arr-head"><div><h2>📬 Remontées terrain</h2>'
    +'<p class="small muted" style="margin:2px 0 0">Vigiminutes et signalements des encadrants, au même endroit. Chacun peut <b>changer le statut</b>, noter <b>l’action décidée</b> (qui, pour quand) et <b>ajouter un commentaire</b>. Rien ne s’efface, tout est tracé.</p></div>'
    +'<div class="arr-kpis"><span class="ak"><b>'+tous.length+'</b> remontées</span><span class="ak '+(ouv?'bad':'ok')+'"><b>'+ouv+'</b> ouvertes</span><span class="ak '+(sansRep?'bad':'ok')+'"><b>'+sansRep+'</b> sans réponse</span></div></div>';
  h+='<div class="row no-print arr-bar"><button class="btn btn-primary btn-sm" onclick="ouvrirSignaler()">⚡ Signaler</button>'
    +'<span class="seg" style="background:#fff">'+[['ouvertes','Ouvertes'],['toutes','Toutes'],['Traitée','Traitées']].map(x=>'<button class="'+(remFiltre.statut===x[0]?'on':'')+'" onclick="setRemFiltre(\'statut\',\''+x[0]+'\')">'+x[1]+'</button>').join('')+'</span>'
    +'<span class="seg" style="background:#fff">'+[['','Toutes sources'],['vigi','📱 Vigiminutes'],['encadrant','👷 Encadrants']].map(x=>'<button class="'+(remFiltre.source===x[0]?'on':'')+'" onclick="setRemFiltre(\'source\',\''+x[0]+'\')">'+x[1]+'</button>').join('')+'</span></div>';
  const groupes=AGENCES_ORDRE.filter(g=>!agenceChoisie||g.code===agenceChoisie);
  let rien=true;
  groupes.forEach(g=>{
    const lg=l.filter(r=>(AGENCES_COUL[r.agence]?r.agence:'')===g.code);
    if(!lg.length&&(g.code===''||agenceChoisie))return;
    if(!lg.length){h+='<div class="agb ag-'+(g.code||'X')+'"><div class="agb-h"><span class="agb-nom">'+esc(g.lib)+'</span><span class="agb-n muted">rien à afficher</span></div></div>';return}
    rien=false;
    h+='<div class="agb ag-'+(g.code||'X')+'"><div class="agb-h"><span class="agb-nom">'+esc(g.lib)+'</span><span class="agb-n">'+lg.length+' remontée'+(lg.length>1?'s':'')+' · <b>'+lg.filter(remOuverte).length+'</b> ouverte'+(lg.filter(remOuverte).length>1?'s':'')+'</span></div>';
    h+='<div class="agb-scroll"><table class="atab rtab"><thead><tr><th>Date</th><th>Chantier</th><th>Type</th><th class="c-suj">Remontée</th><th>Statut</th><th class="c-pa">Action décidée</th><th>💬</th></tr></thead><tbody>';
    lg.forEach(r=>{
      const ty=remType(r.type), nc=(r.commentaires||[]).length, ouvert=!!remOuverts[r.id];
      const urgent=/URGENT/.test(String(r.sujet||''));
      h+='<tr class="'+(remOuverte(r)?'':'ok')+(urgent?' urgent':'')+'">'
        +'<td class="c-date">'+esc(frDateCourt(r.date)||'')+'<div class="rsrc">'+(r.source==='encadrant'?'👷 encadrant':'📱 Vigiminute')+'</div></td>'
        +'<td>'+esc(r.chantier||'—')+'</td>'
        +'<td><span class="rty '+ty.c+'" title="'+esc(r.type)+'">'+esc(ty.l)+'</span></td>'
        +'<td class="c-suj">'+esc(r.sujet||'—')+(r.domaine?'<div class="rsrc">'+esc(r.domaine)+'</div>':'')+'</td>'
        +'<td><select class="rst s-'+String(r.statut||'Non traitée').replace(/\s.*/,'').toLowerCase()+'" onchange="remStatut(\''+esc(r.id)+'\',this.value)">'+REM_STATUTS.map(s=>'<option'+(String(r.statut||'Non traitée')===s?' selected':'')+'>'+s+'</option>').join('')+'</select></td>'
        +'<td class="c-pa" onclick="ouvrirRemAction(\''+esc(r.id)+'\')" title="Modifier l’action décidée">'+(r.action?'<b>'+esc(r.action)+'</b>'+(r.qui||r.echeance?'<div class="rsrc">'+esc(r.qui||'')+(r.echeance?' · pour le '+esc(frDate(r.echeance)):'')+'</div>':''):'<span class="muted">＋ définir</span>')+'</td>'
        +'<td><button class="btn btn-ghost btn-sm" onclick="remToggle(\''+esc(r.id)+'\')">💬 '+nc+'</button></td></tr>';
      if(ouvert){
        h+='<tr class="rfil"><td colspan="7"><div class="rfil-box">'
          +((r.commentaires||[]).map(c=>'<div class="rcom"><span class="rcom-q">'+esc(c.q||'?')+'</span><span class="rcom-d">'+esc(frDateCourt(String(c.d||'').slice(0,10)))+'</span><div>'+esc(c.t)+'</div></div>').join('')||'<p class="muted" style="margin:0 0 6px">Pas encore de commentaire.</p>')
          +'<div class="row no-print"><input type="text" id="rc-'+esc(r.id)+'" class="grow" placeholder="Ajouter un commentaire (ce qu’on a fait, ce qu’on attend…)" onkeydown="if(event.key===\'Enter\')remCommenter(\''+esc(r.id)+'\')"><button class="btn btn-primary btn-sm" onclick="remCommenter(\''+esc(r.id)+'\')">Envoyer</button></div>'
          +'</div></td></tr>';
      }
    });
    h+='</tbody></table></div></div>';
  });
  if(rien)h+='<div class="secempty">'+(tous.length?'Rien ne correspond à ce filtre.':'Aucune remontée pour l’instant. Les Vigiminutes arrivent avec la collecte ; le bouton ⚡ Signaler en ajoute tout de suite.')+'</div>';
  h+='<p class="hint" style="margin-top:12px">Le statut « Traitée » ferme la remontée (elle reste dans « Toutes »). Les remontées sans action ni commentaire depuis 15 jours remontent dans la to-do du service HSE.</p>';
  box.innerHTML=h;
}
function remToggle(id){remOuverts[id]=!remOuverts[id];renderRemontees()}
function remStatut(id,val){
  const r=(state.remontees||[]).find(x=>x.id===id);if(!r)return;
  r.statut=val;renderRemontees();
  envoyerRemontees([{id,statut:val}],'Statut : '+val);
}
function remCommenter(id){
  const inp=document.getElementById('rc-'+id);if(!inp)return;
  const t=inp.value.trim();if(!t){toast('Écris un commentaire',true);return}
  const r=(state.remontees||[]).find(x=>x.id===id);
  if(r){r.commentaires=(r.commentaires||[]).concat([{d:nowISO(),q:conf.appareil||'moi',t}]);renderRemontees()}
  envoyerRemontees([{id,commentaire:t}],'💬 Commentaire ajouté');
}
let remEnCours=null;
function ouvrirRemAction(id){
  const r=(state.remontees||[]).find(x=>x.id===id);if(!r)return;
  remEnCours=id;
  document.getElementById('mr-sous').textContent=(r.chantier?r.chantier+' · ':'')+(r.sujet||'');
  document.getElementById('mr-action').value=r.action||'';
  document.getElementById('mr-qui').value=r.qui||'';
  document.getElementById('mr-ech').value=r.echeance||'';
  document.getElementById('mr-statut').innerHTML=REM_STATUTS.map(s=>'<option'+(String(r.statut||'Non traitée')===s?' selected':'')+'>'+s+'</option>').join('');
  document.getElementById('m-remaction').classList.add('open');
}
function enregistrerRemAction(){
  if(!remEnCours)return;
  const g=id=>document.getElementById(id).value.trim();
  const o={id:remEnCours,action:g('mr-action'),qui:g('mr-qui'),echeance:g('mr-ech'),statut:g('mr-statut')};
  const r=(state.remontees||[]).find(x=>x.id===remEnCours);if(r)Object.assign(r,o);
  closeModal();renderRemontees();
  envoyerRemontees([o],'Action enregistrée ✓');
}

/* ---------- ✅ To-do HSE (zone HSE, éditeur) ---------- */
const TODO_ICO={accident:'🚨',action:'🛠️',remontee:'📬',arrivant:'🎒',reporting:'📊',donnee:'🧩'};
function renderTodo(){
  const box=document.getElementById('hse-todo');if(!box)return;
  const td=state.todo;
  if(!estEditeur()){box.innerHTML='';return}
  if(!td||!Array.isArray(td.items)){box.innerHTML='<div class="card"><h2>✅ À faire — service HSE</h2><p class="muted">La liste arrive à la prochaine synchronisation (bouton 🔄 en haut).</p></div>';return}
  const items=td.items.filter(i=>!agenceChoisie||!i.agence||i.agence===agenceChoisie);
  const vus=(conf.todoVus||{});
  const actifs=items.filter(i=>!vus[i.titre+'|'+i.id]);
  let h='<div class="card todo"><h2>✅ À faire — service HSE <span class="apill">'+actifs.length+'</span><span class="small muted" style="margin-left:auto;font-weight:400">calculée à la synchro'+(td.calculeLe?' · '+esc(frDateCourt(String(td.calculeLe).slice(0,10))):'')+'</span></h2>';
  if(!actifs.length)h+='<p class="muted" style="margin:0">Rien en attente'+(agenceChoisie?' pour cette agence':'')+' — tout est à jour 🎉</p>';
  else h+='<div class="todo-l">'+actifs.slice(0,40).map(i=>'<div class="todo-i p'+(i.prio||3)+'"><span class="todo-ico">'+(TODO_ICO[i.type]||'•')+'</span><div class="grow"><b>'+esc(i.titre)+'</b>'+(i.agence?' <span class="apill ag-'+esc(i.agence)+'">'+esc(i.agence)+'</span>':'')+'<div class="small muted">'+esc(i.detail||'')+'</div></div>'
    +'<button class="btn btn-ghost btn-sm no-print" title="Masquer sur cet appareil" onclick="todoVu(\''+esc(i.titre+'|'+i.id)+'\')">✓</button></div>').join('')+'</div>';
  if(Object.keys(vus).length)h+='<p class="hint" style="margin:8px 0 0"><a href="#" onclick="conf.todoVus={};saveConfLS();renderTodo();return false">Réafficher les éléments masqués ('+Object.keys(vus).length+')</a></p>';
  h+='</div>';
  box.innerHTML=h;
}
function todoVu(k){conf.todoVus=conf.todoVus||{};conf.todoVus[k]=1;saveConfLS();renderTodo()}
