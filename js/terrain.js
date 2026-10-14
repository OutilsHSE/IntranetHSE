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
let remFiltre={statut:'ouvertes',source:'',cond:''};
/* conducteur de travaux du chantier : d'après les fiches QHP (carte chantier → conducteur servie avec le suivi QHP) */
function netCh(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function conducteurDe(chantier){const q=(typeof qhpData==='function')?qhpData():null;const m=q&&q.chantierConducteur;if(!m)return '';const k=netCh(chantier);if(!k)return '';if(m[k])return m[k];const hit=Object.keys(m).find(x=>x.length>=5&&(k.indexOf(x)>=0||x.indexOf(k)>=0));return hit?m[hit]:''}
/* V3.3.2 : le conducteur d'une remontée est d'abord celui de SA Vigiminute (colonne « conducteur »
   remplie par le serveur V29.3 : 1 Vigiminute = 1 chantier = 1 conducteur) ; sinon la carte chantier → conducteur. */
function conducteurRem(r){return String((r&&r.conducteur)||'').trim()||conducteurDe(r&&r.chantier)}
function conducteursConnus(){const s={};remontees().forEach(r=>{const c=conducteurRem(r);if(c)s[c]=1});return Object.keys(s).sort((a,b)=>a.localeCompare(b,'fr'))}
function remontees(){return (state.remontees||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.maj||'').localeCompare(String(a.maj||'')))}
function remType(t){const s=String(t||'');if(/^sd|situation/i.test(s))return{c:'sd',l:'SD'};if(/^bp|bonne/i.test(s))return{c:'bp',l:'BP'};if(/presqu/i.test(s))return{c:'pa',l:'Presqu’AT'};if(/^pa|am[ée]lior/i.test(s))return{c:'am',l:'PA'};return{c:'au',l:s||'—'}}
function remOuverte(r){return !/^trait/i.test(String(r.statut||''))}
function chantiersConnus(){const s={};remontees().forEach(r=>{const c=String(r.chantier||'').trim();if(c)s[c]=1});(state.arrivants||[]).forEach(a=>{const c=String(a.chantier||'').trim();if(c)s[c]=1});return Object.keys(s).sort((a,b)=>a.localeCompare(b,'fr'))}
function agenceParDefaut(){return agenceChoisie||conf.agenceAppareil||''}
function selectAgence(id,val){return '<select id="'+id+'"><option value="">— agence —</option>'+['IDF','NA','BPL'].map(a=>'<option value="'+a+'"'+(val===a?' selected':'')+'>'+a+' — '+AG_LIBS[a]+'</option>').join('')+'</select>'}
function datalistChantiers(){return '<datalist id="dl-chantiers">'+chantiersConnus().map(c=>'<option value="'+esc(c)+'">').join('')+'</datalist>'}
function majAgenceAppareil(a){if(a){conf.agenceAppareil=a;saveConfLS()}}

/* ---------- 📝 Déclarer un événement (fenêtre unique, V3.3.2) ----------
   Le premier menu choisit le type : une remontée (SD, presqu'accident, bonne
   pratique, point d'amélioration) part dans la table des remontées — la même que
   les Vigiminutes ; un accident part dans le journal des accidents (pré-déclaration). */
const DECL_TYPES=[
  {v:'SD (Situation Dangereuse)',l:'⚠️ Situation dangereuse',k:'rem'},
  {v:'Presqu\'AT',l:'😮 Presqu’accident',k:'rem'},
  {v:'PA (Point d\'Amélioration)',l:'💡 Point d’amélioration',k:'rem'},
  {v:'BP (Bonne Pratique)',l:'👍 Bonne pratique',k:'rem'},
  {v:'Accident Bénin',l:'🩹 Accident bénin',k:'acc'},
  {v:'Accident sans Arrêt de Travail',l:'🚑 Accident sans arrêt',k:'acc'},
  {v:'Accident avec Arrêt de Travail',l:'🚨 Accident avec arrêt',k:'acc'},
  {v:'Accident de trajet',l:'🚗 Accident de trajet',k:'acc'}];
function ouvrirDeclarer(type){
  const b=document.getElementById('md-corps');
  b.innerHTML='<label class="f">Que veux-tu déclarer ? *</label><select id="md-type" onchange="declTypeChange()"><option value="">— choisir —</option>'
    +DECL_TYPES.map(t=>'<option value="'+esc(t.v)+'"'+(type===t.v?' selected':'')+'>'+t.l+'</option>').join('')+'</select>'
    +'<div id="md-rem" style="display:none"></div><div id="md-acc" style="display:none"></div>'
    +'<p class="hint" id="md-ou"></p>';
  document.getElementById('m-declarer').classList.add('open');
  if(type)declTypeChange();
}
function declTypeChange(){
  const v=document.getElementById('md-type').value, t=DECL_TYPES.find(x=>x.v===v);
  const rem=document.getElementById('md-rem'), acc=document.getElementById('md-acc'), ou=document.getElementById('md-ou');
  rem.style.display=t&&t.k==='rem'?'':'none'; acc.style.display=t&&t.k==='acc'?'':'none';
  const env=document.getElementById('md-env');
  if(env){env.className='btn grow '+(t&&t.k==='acc'?'btn-danger':'btn-primary');env.textContent=t?(t.k==='acc'?'🚨 Envoyer au service HSE':'Envoyer la remontée'):'Envoyer'}
  if(!t){ou.textContent='';return}
  if(t.k==='rem'){
    if(!rem.innerHTML)rem.innerHTML=formSignalement();
    ou.textContent='Cette remontée rejoint le suivi des remontées terrain (même table que les Vigiminutes), visible par tous.'+(/BP/.test(v)?' Une bonne pratique est enregistrée directement comme traitée : pas d’action attendue.':'');
  }else{
    if(!acc.innerHTML)acc.innerHTML=formPredeclaration();
    ou.textContent='Cette pré-déclaration crée la fiche dans le journal des accidents du service HSE, qui la complète (blessure, analyse, plan d’actions). En cas d’urgence vitale : 15 / 112 d’abord.';
  }
}
function envoyerDeclaration(){
  const v=document.getElementById('md-type').value, t=DECL_TYPES.find(x=>x.v===v);
  if(!t){toast('Choisis le type d’événement',true);return}
  if(t.k==='rem')envoyerSignalement(v); else envoyerPredeclaration(v);
}
/* ---------- ⚡ Signaler (formulaire remontée) ---------- */
function formSignalement(){
  return '<div class="row"><div class="grow"><label class="f">Agence *</label>'+selectAgence('ms-agence',agenceParDefaut())+'</div>'
    +'<div class="grow"><label class="f">Chantier / lieu *</label><input type="text" id="ms-chantier" list="dl-chantiers" placeholder="Ex. Ardres, Atelier…" value="'+esc(conf.chantierAppareil||'')+'">'+datalistChantiers()+'</div></div>'
    +'<label class="f">Domaine</label><select id="ms-domaine">'+REM_DOMAINES.map(t=>'<option>'+esc(t)+'</option>').join('')+'</select>'
    +'<label class="f">Ce que tu as vu *</label><textarea id="ms-sujet" rows="3" placeholder="Décris en une ou deux phrases : quoi, où, quel risque."></textarea>'
    +'<label class="row" style="gap:8px;align-items:center;cursor:pointer;margin-top:6px"><input type="checkbox" id="ms-urgent"> <span>⚠️ Urgent — risque immédiat</span></label>';
}
function ouvrirSignaler(){ouvrirDeclarer('SD (Situation Dangereuse)')}
async function envoyerSignalement(type){
  const g=id=>(document.getElementById(id)||{}).value||'';
  const agence=g('ms-agence'),chantier=g('ms-chantier').trim(),sujet=g('ms-sujet').trim();
  if(!agence){toast('Choisis l’agence',true);return}
  if(!chantier){toast('Indique le chantier ou le lieu',true);return}
  if(sujet.length<5){toast('Décris ce que tu as vu',true);return}
  const urgent=!!(document.getElementById('ms-urgent')||{}).checked, bp=/^BP/.test(type||'');
  const o={agence,chantier,sujet:(urgent?'⚠️ URGENT — ':'')+sujet,type:type||REM_TYPES[0],domaine:g('ms-domaine'),impact:urgent?4:2,source:'encadrant',statut:bp?'Traitée':'Non traitée'};
  majAgenceAppareil(agence);conf.chantierAppareil=chantier;saveConfLS();
  closeModal();
  const ok=await envoyerRemontees([o],bp?'👍 Bonne pratique enregistrée — merci !':'📝 Déclaration envoyée — merci !');
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
function formPredeclaration(){
  const d=new Date(),pad=n=>String(n).padStart(2,'0');
  return '<div class="row"><div class="grow"><label class="f">Date *</label><input type="date" id="mp-date" value="'+d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'"></div>'
    +'<div style="width:120px"><label class="f">Heure</label><input type="time" id="mp-heure" value="'+pad(d.getHours())+':'+pad(d.getMinutes())+'"></div></div>'
    +'<div class="row"><div class="grow"><label class="f">Agence *</label>'+selectAgence('mp-agence',agenceParDefaut())+'</div>'
    +'<div class="grow"><label class="f">Chantier / lieu *</label><input type="text" id="mp-chantier" list="dl-chantiers" value="'+esc(conf.chantierAppareil||'')+'">'+datalistChantiers()+'</div></div>'
    +'<label class="f">Collaborateur concerné <span class="muted" style="font-weight:400">(facultatif — le service HSE complète)</span></label><input type="text" id="mp-collab" placeholder="Nom Prénom" autocomplete="off">'
    +'<label class="f">Ce qui s’est passé *</label><textarea id="mp-desc" rows="3" placeholder="Les faits, en quelques phrases. L’analyse viendra après."></textarea>';
}
function ouvrirPredeclaration(){ouvrirDeclarer('Accident Bénin')}
async function envoyerPredeclaration(type){
  const g=id=>(document.getElementById(id)||{}).value||'';
  const agence=g('mp-agence'),chantier=g('mp-chantier').trim(),desc=g('mp-desc').trim();
  if(!agence){toast('Choisis l’agence',true);return}
  if(!chantier){toast('Indique le chantier ou le lieu',true);return}
  if(desc.length<5){toast('Décris ce qui s’est passé',true);return}
  if(!webhookLecture()){toast('Le suivi n’est pas branché : renseigne config.js',true);return}
  majAgenceAppareil(agence);conf.chantierAppareil=chantier;saveConfLS();
  const inc={agence,date:g('mp-date'),heure:g('mp-heure'),type:type||g('mp-type')||'Accident Bénin',chantier,collaborateur:g('mp-collab').trim(),description:desc};
  try{
    const j=await appel({action:'incident-pre',appareil:conf.appareil||nomAppareil(),data:{incident:inc}});
    if(!j.ok)throw new Error(j.erreur||'?');
    closeModal();toast('🚨 Pré-déclaration envoyée au service HSE (journal des accidents)');
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
    (!remFiltre.source||(remFiltre.source==='encadrant'?r.source==='encadrant':r.source!=='encadrant'))&&
    (!remFiltre.cond||conducteurRem(r)===remFiltre.cond));
}
let remOuverts={};
function renderRemontees(){
  const box=document.getElementById('v-rem');if(!box)return;
  const tous=remontees().filter(r=>!agenceChoisie||(r.agence||'')===agenceChoisie), ouv=tous.filter(remOuverte).length, l=remVisibles();
  const sansRep=tous.filter(r=>remOuverte(r)&&!String(r.action||'').trim()&&!(r.commentaires||[]).length).length;
  let h='<div class="arr-head"><div><h2>📬 Remontées terrain</h2>'
    +'<p class="small muted" style="margin:2px 0 0">Vigiminutes (📱, remontées par la collecte) et déclarations faites depuis l’intranet (📝), au même endroit. Le conducteur de travaux est celui de la Vigiminute d’origine (une Vigiminute = un chantier = un conducteur) ; pour une déclaration faite ici, celui de la dernière Vigiminute du chantier. Chacun peut <b>changer le statut</b>, noter <b>l’action décidée</b> (qui, pour quand) et <b>ajouter un commentaire</b>. Rien ne s’efface, tout est tracé.</p></div>'
    +'<div class="arr-kpis"><span class="ak"><b>'+tous.length+'</b> remontées</span><span class="ak '+(ouv?'bad':'ok')+'"><b>'+ouv+'</b> ouvertes</span><span class="ak '+(sansRep?'bad':'ok')+'"><b>'+sansRep+'</b> sans réponse</span></div></div>';
  h+='<div class="row no-print arr-bar"><button class="btn btn-primary btn-sm" onclick="ouvrirSignaler()">📝 Déclarer</button>'
    +'<span class="seg" style="background:#fff">'+[['ouvertes','Ouvertes'],['toutes','Toutes'],['Traitée','Traitées']].map(x=>'<button class="'+(remFiltre.statut===x[0]?'on':'')+'" onclick="setRemFiltre(\'statut\',\''+x[0]+'\')">'+x[1]+'</button>').join('')+'</span>'
    +'<span class="seg" style="background:#fff">'+[['','Toutes sources'],['vigi','📱 Vigiminutes'],['encadrant','📝 Intranet']].map(x=>'<button class="'+(remFiltre.source===x[0]?'on':'')+'" onclick="setRemFiltre(\'source\',\''+x[0]+'\')">'+x[1]+'</button>').join('')+'</span>'
    +(conducteursConnus().length?'<select class="fsel" onchange="setRemFiltre(\'cond\',this.value)"><option value="">Tous les conducteurs</option>'+conducteursConnus().map(c=>'<option'+(remFiltre.cond===c?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select>':'')+'</div>';
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
        +'<td class="c-date">'+esc(frDateCourt(r.date)||'')+'<div class="rsrc">'+(r.source==='encadrant'?'📝 intranet':'📱 Vigiminute')+'</div></td>'
        +'<td>'+esc(r.chantier||'—')+(conducteurRem(r)?'<div class="rsrc" title="'+(r.conducteur?'Conducteur de travaux de la Vigiminute d’origine':'Conducteur de travaux du chantier (dernière Vigiminute ou fiche QHP)')+'">👷‍♂️ '+esc(conducteurRem(r))+'</div>':'')+'</td>'
        +'<td><span class="rty '+ty.c+'" title="'+esc(r.type)+'">'+esc(ty.l)+'</span></td>'
        +'<td class="c-suj">'+esc(r.sujet||'—')+(r.domaine?'<div class="rsrc">'+esc(r.domaine)+'</div>':'')+(remPhotos(r).length?' <button class="btn btn-ghost btn-sm rphoto no-print" onclick="ouvrirPhotos(\''+esc(r.id)+'\')" title="Voir la photo de la Vigiminute">📷'+(remPhotos(r).length>1?' '+remPhotos(r).length:'')+'</button>':'')+'</td>'
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
const TODO_ICO={accident:'🚨',action:'🛠️',remontee:'📬',arrivant:'👷',reporting:'📊',donnee:'🧩'};
function renderTodo(){
  const box=document.getElementById('hse-todo');if(!box)return;
  const td=state.todo;
  if(!estEditeur()){box.innerHTML='';return}
  if(!td||!Array.isArray(td.items)){box.innerHTML='<div class="card"><h2>✅ À faire — service HSE</h2><p class="muted">La liste arrive à la prochaine synchronisation (bouton 🔄 en haut).</p></div>'+renderFaitsHSE();return}
  const items=td.items.filter(i=>!agenceChoisie||!i.agence||i.agence===agenceChoisie);
  const vus=(conf.todoVus||{});
  const actifs=items.filter(i=>!vus[i.titre+'|'+i.id]);
  let h='<div class="card todo"><h2>✅ À faire — service HSE <span class="apill">'+actifs.length+'</span><span class="small muted" style="margin-left:auto;font-weight:400">calculée à la synchro'+(td.calculeLe?' · '+esc(frDateCourt(String(td.calculeLe).slice(0,10))):'')+'</span></h2>';
  if(!actifs.length)h+='<p class="muted" style="margin:0">Rien en attente'+(agenceChoisie?' pour cette agence':'')+' — tout est à jour 🎉</p>';
  else h+='<div class="todo-l">'+actifs.slice(0,40).map(i=>'<div class="todo-i p'+(i.prio||3)+'"><span class="todo-ico">'+(TODO_ICO[i.type]||'•')+'</span><div class="grow"><b>'+esc(i.titre)+'</b>'+(i.agence?' <span class="apill ag-'+esc(i.agence)+'">'+esc(i.agence)+'</span>':'')+'<div class="small muted">'+esc(i.detail||'')+'</div></div>'
    +'<button class="btn btn-ghost btn-sm no-print" title="Masquer sur cet appareil" onclick="todoVu(\''+esc(i.titre+'|'+i.id)+'\')">✓</button></div>').join('')+'</div>';
  if(Object.keys(vus).length)h+='<p class="hint" style="margin:8px 0 0"><a href="#" onclick="conf.todoVus={};saveConfLS();renderTodo();return false">Réafficher les éléments masqués ('+Object.keys(vus).length+')</a></p>';
  h+='</div>';
  h+=renderFaitsHSE();                     // V3.3.2 : la saisie des faits marquants vit ici, pas sur la page de consultation
  h+=renderBilanHSE();                     // V3.3.2 : les totaux de l'année précédente (colonne N-1 du bulletin)
  box.innerHTML=h;
}
/* ---------- 📷 Photos des remontées Vigiminutes (V3.3.2) ----------
   Le lien Drive de la photo est dans la colonne « photo » (serveur V29.4). Un collègue
   n'a pas accès au Drive : la page demande l'image AU SERVEUR (action « photo », mot de
   passe de consultation), qui la lit avec son propre accès et la renvoie réduite. */
function remPhotos(r){return String((r&&r.photo)||'').split(/[\s,;]+/).map(x=>x.trim()).filter(x=>/[-\w]{20,}/.test(x))}
const photosCache={};
async function ouvrirPhotos(id){
  const r=remontees().find(x=>x.id===id); if(!r)return;
  const liens=remPhotos(r); if(!liens.length)return;
  const m=document.getElementById('m-photos'); if(!m)return;
  document.getElementById('mph-titre').textContent='📷 '+(r.chantier||'')+(r.date?' · '+frDate(r.date):'');
  document.getElementById('mph-sujet').textContent=r.sujet||'';
  const box=document.getElementById('mph-corps');
  box.innerHTML=liens.map((l,i)=>'<div class="mph-item" id="mph-'+i+'"><div class="mph-wait">⏳ Chargement de la photo…</div></div>').join('');
  m.classList.add('open');
  for(let i=0;i<liens.length;i++){
    const cell=document.getElementById('mph-'+i); if(!cell)continue;
    try{
      let ph=photosCache[liens[i]];
      if(!ph){ph=await appel({action:'photo',id:liens[i]});if(ph&&ph.ok)photosCache[liens[i]]=ph}
      if(ph&&ph.ok&&ph.b64){cell.innerHTML='<img src="data:'+esc(ph.mime||'image/jpeg')+';base64,'+ph.b64+'" alt="'+esc(ph.nom||'photo')+'">'+(ph.nom?'<div class="rsrc">'+esc(ph.nom)+'</div>':'')}
      else cell.innerHTML='<div class="mph-err">Photo indisponible'+(ph&&ph.erreur?' — '+esc(ph.erreur):'')+'.<br><a href="'+esc(liens[i])+'" target="_blank" rel="noopener">Ouvrir le lien Drive</a> (réservé au service HSE)</div>';
    }catch(e){
      if(e&&e.verrou){oublierVerrou();montrerVerrou('Le mot de passe a changé. Redemande-le au service HSE.');return}
      cell.innerHTML='<div class="mph-err">Photo indisponible — '+esc(e.message||'?')+'</div>';
    }
  }
}

/* ---------- 📊 Bilan de l'année précédente (colonne N-1 du bulletin) ----------
   Le reporting a démarré en 2026 : le classeur n'a pas les mois de 2025. Plutôt que
   de ressaisir douze mois, le service HSE tape les TOTAUX de l'année — CDES et
   intérim — ici ; le bulletin les affiche dans la colonne N-1. Global, et par
   agence si on veut (le sélecteur d'agence en haut choisit la portée). */
const BILAN_CHAMPS=[['accArret','AT avec arrêt'],['joursArret','Jours d’arrêt'],['accSans','AT sans arrêt'],['benins','AT bénins'],['trajet','Accidents de trajet']];
let bilanAn=null;
function renderBilanHSE(){
  const anCour=new Date().getFullYear(); if(!bilanAn)bilanAn=String(anCour-1);
  const cle=bulBilanCle(bilanAn,agenceChoisie), brut=kpiVal(cle); let o=null; try{o=brut?JSON.parse(brut):null}catch(e){}
  const c=(o&&o.cdes)||{}, i=(o&&o.interim)||{};
  const portee=agenceChoisie?('agence '+agenceChoisie):'CDES — toutes agences';
  const ans=[anCour-1,anCour-2,anCour-3].map(a=>'<option'+(String(a)===bilanAn?' selected':'')+'>'+a+'</option>').join('');
  const inp=(id,v,ph)=>'<input type="number" min="0" step="any" id="'+id+'" value="'+(v===undefined||v===null||v===''?'':esc(String(v)))+'" placeholder="'+(ph||'')+'" style="width:100%">';
  let h='<div class="card"><h2>📊 Année précédente <span class="small muted" style="margin-left:auto;font-weight:400">colonne N-1 du bulletin · portée : '+esc(portee)+'</span></h2>'
    +'<p class="small muted" style="margin:0 0 8px">Le classeur n’a pas les mois d’avant 2026 : tape ici les <b>totaux de l’année</b>. Ils remplacent la colonne de gauche du tableau « Reporting ». Le sélecteur d’agence en haut de page choisit la portée (Global = CDES entière).</p>'
    +'<div class="row" style="align-items:center;gap:8px;margin-bottom:8px"><label class="f" style="margin:0">Année</label><select id="bl-an" style="width:120px" onchange="bilanAn=this.value;renderTodo()">'+ans+'</select>'
    +(o?'<span class="apill">saisi'+(o.maj?' · '+esc(frDateCourt(String(o.maj).slice(0,10))):'')+'</span>':'<span class="apill" style="background:#fff3e0;color:#9a5b00">rien de saisi</span>')+'</div>'
    +'<div class="agb-scroll"><table class="atab bl-tab"><thead><tr><th></th><th>CDES</th><th>Intérim</th></tr></thead><tbody>'
    +BILAN_CHAMPS.map(([k,lib])=>'<tr><th style="text-align:left">'+esc(lib)+'</th><td>'+inp('bl-c-'+k,c[k])+'</td><td>'+inp('bl-i-'+k,i[k])+'</td></tr>').join('')
    +'<tr><th style="text-align:left">Heures travaillées <span class="muted" style="font-weight:400">(pour Tg / Tf)</span></th><td>'+inp('bl-c-heures',c.heures,'ex. 150000')+'</td><td class="muted small">—</td></tr>'
    +'</tbody></table></div>'
    +'<div class="row no-print" style="margin-top:10px;gap:8px"><button class="btn btn-primary btn-sm" onclick="enregistrerBilan()">Enregistrer</button>'
    +(o?'<button class="btn btn-ghost btn-sm" onclick="effacerBilan()">Effacer ce bilan</button>':'')
    +'<span class="hint" style="margin:0">Tg = jours d’arrêt × 1 000 / heures · Tf = AT avec arrêt × 10⁶ / heures — calculés par la page.</span></div></div>';
  return h;
}
function enregistrerBilan(){
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  const g=id=>{const e=document.getElementById(id);if(!e)return '';const v=e.value.trim();return v===''?'':Number(v.replace(',','.'))};
  const cdes={},interim={};let rempli=false;
  BILAN_CHAMPS.forEach(([k])=>{const a=g('bl-c-'+k),b=g('bl-i-'+k);if(a!=='')cdes[k]=a;if(b!=='')interim[k]=b;if(a!==''||b!=='')rempli=true});
  const hh=g('bl-c-heures');if(hh!=='')cdes.heures=hh;
  if(!rempli&&hh===''){toast('Rien à enregistrer : remplis au moins une case',true);return}
  const cle=bulBilanCle(bilanAn,agenceChoisie);
  state.kpi[cle]=JSON.stringify({cdes:cdes,interim:interim,maj:nowISO()});state.kpiMaj[cle]=nowISO();save();
  toast('Bilan '+bilanAn+' enregistré ✓');
  if(typeof renderBulletin==='function')renderBulletin();renderTodo();
  if(typeof syncAuto==='function')syncAuto();
}
function effacerBilan(){
  if(!estEditeur())return;
  if(!confirm('Effacer le bilan '+bilanAn+' saisi ('+(agenceChoisie||'Global')+') ? La colonne N-1 reviendra aux mois du classeur, s’il y en a.'))return;
  const cle=bulBilanCle(bilanAn,agenceChoisie);
  state.kpi[cle]='';state.kpiMaj[cle]=nowISO();save();
  if(typeof renderBulletin==='function')renderBulletin();renderTodo();
  if(typeof syncAuto==='function')syncAuto();
}
function renderFaitsHSE(){
  const mois=[];const d=new Date();for(let i=0;i<4;i++){const x=new Date(d.getFullYear(),d.getMonth()-i,1);mois.push(x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'))}
  return '<div class="card"><h2>📣 Faits marquants HSE <span class="small muted" style="margin-left:auto;font-weight:400">affichés en tête du bulletin, une ligne par point</span></h2>'
    +'<div class="fm-l">'+mois.map(k=>{const v=String(kpiVal('faits.'+k)||'');return '<div class="fm-i"><b>'+esc(typeof bulLib==='function'?bulLib(k):k)+'</b><div class="small">'+(v?esc(v).replace(/\n/g,'<br>'):'<span class="muted">rien de saisi</span>')+'</div><button class="btn btn-ghost btn-sm no-print" onclick="bulEditerFaits(\''+k+'\')">✏️</button></div>'}).join('')+'</div></div>';
}
function todoVu(k){conf.todoVus=conf.todoVus||{};conf.todoVus[k]=1;saveConfLS();renderTodo()}
