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
let remFiltre={statut:'toutes',source:'',cond:''};
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
  h+='<div class="row no-print arr-bar"><button class="btn btn-decl btn-sm" onclick="ouvrirSignaler()"><svg class="ico-decl" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2 1.3 21h21.4L12 2.2z" fill="#fff"/><path d="M12 8.6v6.2" stroke="#D7261E" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="18" r="1.5" fill="#D7261E"/></svg>Déclarer</button>'
    +'<span class="seg" style="background:#fff">'+[['toutes','Toutes'],['ouvertes','Ouvertes'],['Traitée','Traitées']].map(x=>'<button class="'+(remFiltre.statut===x[0]?'on':'')+'" onclick="setRemFiltre(\'statut\',\''+x[0]+'\')">'+x[1]+'</button>').join('')+'</span>'
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

/* ---------- 🔒 ZONE HSE en BRIQUES (V3.3.4, retours du 14/10) ----------
   Plus de Reporting dans un cadre (double défilement, couleurs illisibles) : la zone
   HSE est une grille de briques. Les briques d'outils ouvrent l'application dans un
   nouvel onglet ; les briques de saisie (à faire, faits marquants, année précédente)
   se déplient sur place et restent fermées par défaut, pour ne pas « manger la page ».
   L'état ouvert / fermé est retenu sur cet appareil. */
const TODO_ICO={accident:'🚨',action:'🛠️',remontee:'📬',arrivant:'👷',reporting:'📊',donnee:'🧩'};
let briquesOuvertes=(function(){try{return JSON.parse(localStorage.getItem('ihse_briques')||'{}')||{}}catch(e){return {}}})();
function briqueBascule(el){const k=el&&el.dataset&&el.dataset.b;if(!k)return;
  if(el.open)briquesOuvertes[k]=1;else delete briquesOuvertes[k];
  if(k==='collab'&&el.open&&!collabData.charge&&!collabData.enCours)chargerCollab();
  try{localStorage.setItem('ihse_briques',JSON.stringify(briquesOuvertes))}catch(e){}}
function brique(k,ico,titre,resume,corps,classe){
  return '<details class="brique'+(classe?' '+classe:'')+'" data-b="'+k+'"'+(briquesOuvertes[k]?' open':'')+' ontoggle="briqueBascule(this)">'
    +'<summary><span class="br-ico">'+ico+'</span><span class="br-t"><b>'+titre+'</b><span class="br-r">'+resume+'</span></span><span class="br-fl" aria-hidden="true">▾</span></summary>'
    +'<div class="br-corps">'+corps+'</div></details>';
}
function briqueLien(ico,titre,resume,url,id){
  if(!url)return '<div class="brique br-lien off"><span class="br-ico">'+ico+'</span><span class="br-t"><b>'+titre+'</b><span class="br-r">lien à brancher (voir le mode opératoire)</span></span></div>';
  return '<a class="brique br-lien" id="'+id+'" href="'+esc(url)+'" target="_blank" rel="noopener"><span class="br-ico">'+ico+'</span><span class="br-t"><b>'+titre+'</b><span class="br-r">'+resume+'</span></span><span class="br-fl" aria-hidden="true">↗</span></a>';
}
function lienOutilId(id){const o=(state.outils||[]).find(x=>x.id===id)||DEF_OUTILS.find(x=>x.id===id);return o?lienOutil(o):''}
function renderTodo(){
  const box=document.getElementById('hse-todo');if(!box)return;
  if(!estEditeur()){box.innerHTML='';return}
  /* -- briques d'outils -- */
  const vigi=lienOutilId('suivivigi'), vigiBranche=/#config=/.test(vigi);
  let h='<div class="briques-titre">🔒 Zone HSE <span class="muted">· réservée au service HSE</span></div><div class="briques">';
  h+=briqueLien('🧮','Reporting HSE','Mensuel, accidentologie, santé & environnement, flashs, objectifs','hse.html','br-reporting');
  h+=briqueLien('📊','Suivi des Vigiminutes',vigiBranche?'Taux de réalisation par chantier et par bateau':'S’ouvre sans connexion tant que le lien de branchement n’est pas posé',vigi,'br-vigi');
  const aa=lienOutilId('analyseacc'), aaBranche=/#config=/.test(aa);
  h+=briqueLien('🚨','Analyse d’accident',aaBranche?'Recueil des faits, arbre des causes, rapport':'S’ouvre sans connexion tant que le lien de branchement n’est pas posé',aa,'br-aa');
  /* -- à faire -- */
  const td=state.todo;
  let corpsT, resT;
  if(!td||!Array.isArray(td.items)){resT='la liste arrive à la prochaine synchronisation';corpsT='<p class="muted">La liste arrive à la prochaine synchronisation (bouton 🔄 en haut).</p>'}
  else{
    const items=td.items.filter(i=>!agenceChoisie||!i.agence||i.agence===agenceChoisie);
    const vus=(conf.todoVus||{});
    const actifs=items.filter(i=>!vus[i.titre+'|'+i.id]);
    const urg=actifs.filter(i=>(i.prio||3)===1).length;
    resT=actifs.length?(actifs.length+' élément'+(actifs.length>1?'s':'')+(urg?' · <b class="rouge">'+urg+' urgent'+(urg>1?'s':'')+'</b>':'')):'rien en attente 🎉';
    corpsT='<p class="hint" style="margin:0 0 8px">Calculée à la synchro'+(td.calculeLe?' · '+esc(frDateCourt(String(td.calculeLe).slice(0,10))):'')+(agenceChoisie?' · agence '+esc(agenceChoisie):'')+'</p>';
    if(!actifs.length)corpsT+='<p class="muted" style="margin:0">Rien en attente'+(agenceChoisie?' pour cette agence':'')+' — tout est à jour 🎉</p>';
    else corpsT+='<div class="todo-l">'+actifs.slice(0,40).map(i=>'<div class="todo-i p'+(i.prio||3)+'"><span class="todo-ico">'+(TODO_ICO[i.type]||'•')+'</span><div class="grow"><b>'+esc(i.titre)+'</b>'+(i.agence?' <span class="apill ag-'+esc(i.agence)+'">'+esc(i.agence)+'</span>':'')+'<div class="small muted">'+esc(i.detail||'')+'</div></div>'
      +'<button class="btn btn-ghost btn-sm no-print" title="Masquer sur cet appareil" onclick="todoVu(\''+esc(i.titre+'|'+i.id)+'\')">✓</button></div>').join('')+'</div>';
    if(Object.keys(vus).length)corpsT+='<p class="hint" style="margin:8px 0 0"><a href="#" onclick="conf.todoVus={};saveConfLS();renderTodo();return false">Réafficher les éléments masqués ('+Object.keys(vus).length+')</a></p>';
  }
  h+=brique('todo','✅','À faire',resT,corpsT,'todo');
  /* -- faits marquants -- */
  const kCour=bulMoisCourantSur();const fCour=String(kpiVal('faits.'+kCour)||'').trim();
  h+=brique('faits','📣','Faits marquants',fCour?(fCour.split(/\n+/).filter(Boolean).length+' point(s) pour '+esc(typeof bulLib==='function'?bulLib(kCour).toLowerCase():kCour)):'rien de saisi pour '+esc(typeof bulLib==='function'?bulLib(kCour).toLowerCase():kCour),renderFaitsHSE());
  /* -- année précédente -- */
  const anCour=new Date().getFullYear(); if(!bilanAn)bilanAn=String(anCour-1);
  const bo=bulBilanLu(bilanAn);
  /* -- entrées / départs (V3.7) -- */
  h+=brique('collab','👥','Entrées / départs des collaborateurs',resumeCollab(),renderCollabHSE(),'collab');
  /* -- oublis QHP / Vigiminutes (V3.6) -- */
  const ob=resumeOublis();
  h+=brique('oublis','🔎','Oublis Vigiminutes / QHP',ob.resume,renderOublisHSE());
  h+=brique('bilan','📅','Année précédente',esc(bilanAn)+' · '+(bo?'bilan saisi ✓':'<b class="orange">rien de saisi</b>')+' · '+esc(agenceChoisie?('agence '+agenceChoisie):'Global'),renderBilanHSE());
  h+='</div>';
  box.innerHTML=h;
  if(briquesOuvertes.collab&&!collabData.charge&&!collabData.enCours&&!collabData.err)setTimeout(chargerCollab,0);
}
/* ---------- 🔎 OUBLIS VIGIMINUTES / QHP PAR CHANTIER (V3.6) ----------
   Règles du service HSE : 1 Vigiminute par semaine et 1 QHP par mois sur chaque chantier
   actif. Actif = une activité (Vigiminute ou QHP) dans les 2 dernières semaines pour les
   Vigiminutes, dans les 4 dernières semaines pour les QHP. Calculé par le serveur. */
let oublisTous=false;
const MOIS_COURTS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function oublisListe(){const o=state.oublis;if(!o||!Array.isArray(o.chantiers))return [];return o.chantiers.filter(c=>!agenceChoisie||(c.agence||'')===agenceChoisie)}
function etatCase(n,actif,courant){return n>0?'ok':(!actif?'na':(courant?'att':'ko'))}
/* V3.7.1 : le serveur peut renvoyer { erreur, chantiers:[] } sans semaines ni mois ;
   on exige la forme complète, sinon toute la zone HSE ne se dessinait plus */
function oublisUtilisables(o){return !!(o&&Array.isArray(o.chantiers)&&Array.isArray(o.semaines)&&o.semaines.length>=2&&Array.isArray(o.mois)&&o.mois.length>=2)}
function resumeOublis(){
  const o=state.oublis;
  if(!oublisUtilisables(o))return {resume:o&&o.erreur?'calcul en erreur côté serveur':'arrive à la prochaine synchronisation',ko:0};
  const l=oublisListe(),nS=o.semaines.length,nM=o.mois.length;
  const koV=l.filter(c=>etatCase(c.vigi[nS-2],c.actifV[nS-2],false)==='ko').length;
  const attV=l.filter(c=>etatCase(c.vigi[nS-1],c.actifV[nS-1],true)==='att').length;
  const koQ=l.filter(c=>etatCase(c.qhp[nM-2],c.actifQ[nM-2],false)==='ko').length;
  const attQ=l.filter(c=>etatCase(c.qhp[nM-1],c.actifQ[nM-1],true)==='att').length;
  const mc=MOIS_COURTS[Number(o.mois[nM-1].slice(5,7))-1];
  const p=[];
  p.push(koV?'<b class="rouge">'+koV+' sans Vigiminute la semaine dernière</b>':'Vigiminutes de la semaine dernière ✓');
  if(attV)p.push(attV+' à faire cette semaine');
  if(koQ)p.push('<b class="rouge">'+koQ+' sans QHP le mois dernier</b>');
  if(attQ)p.push(attQ+' QHP à faire en '+mc);
  return {resume:p.join(' · ')+(agenceChoisie?' · '+esc(agenceChoisie):''),ko:koV+koQ};
}
/* V3.9 — les oublis par famille, pour les cartes de l'accueil : { ko: oublis de la période
   close, att: à faire sur la période en cours } pour la famille 'vigi' ou 'qhp', sur l'agence choisie */
function oublisCompteur(fam){
  const o=state.oublis;if(!oublisUtilisables(o))return null;
  const l=oublisListe();
  if(fam==='qhp'){const n=o.mois.length;return {ko:l.filter(c=>etatCase(c.qhp[n-2],c.actifQ[n-2],false)==='ko').length,att:l.filter(c=>etatCase(c.qhp[n-1],c.actifQ[n-1],true)==='att').length,lib:'le mois dernier',libAtt:'ce mois-ci'}}
  const n=o.semaines.length;return {ko:l.filter(c=>etatCase(c.vigi[n-2],c.actifV[n-2],false)==='ko').length,att:l.filter(c=>etatCase(c.vigi[n-1],c.actifV[n-1],true)==='att').length,lib:'la semaine dernière',libAtt:'cette semaine'};
}
/* le bouton posé sur les cartes Vigiminutes et QHP de l'accueil (tout appareil déverrouillé) */
function oublisBouton(fam){
  const c=oublisCompteur(fam);if(!c)return '';
  const cls=c.ko?'ob-btn ko':c.att?'ob-btn att':'ob-btn ok';
  const txt=c.ko?c.ko+' oubli'+(c.ko>1?'s':'')+' '+c.lib:c.att?c.att+' à faire '+c.libAtt:'✓ à jour';
  return '<button class="'+cls+' no-print" onclick="event.stopPropagation();oublisOuvrir(\''+fam+'\')" title="Voir les chantiers, par agence">🔎 '+esc(txt)+'</button>';
}
let oublisFam='';
function oublisOuvrir(fam){
  oublisFam=fam==='qhp'?'qhp':'vigi';oublisTous=false;
  const m=document.getElementById('m-oublis');if(!m)return;
  oublisModalRendu();m.classList.add('open');
}
function oublisModalRendu(){
  const t=document.getElementById('obm-titre'),c=document.getElementById('obm-corps');if(!c)return;
  if(t)t.textContent=(oublisFam==='qhp'?'🗣️ QHP par chantier':'📝 Vigiminutes par chantier')+(agenceChoisie?' — '+agenceChoisie:' — toutes agences');
  c.innerHTML=renderOublisHSE('modal',oublisFam);
}
function renderOublisHSE(cible,fam){
  /* V3.9.5 — lisible : UNE famille à la fois quand on vient d'une carte de l'accueil (fam = 'vigi' | 'qhp'),
     les deux côte à côte dans la zone HSE avec une vraie séparation ; une case « pas attendue »
     (chantier pas actif) est GRISE, pleine ; la période en cours est encadrée ; nombre d'oublis par chantier. */
  const o=state.oublis, dansModal=cible==='modal', rafraichir=dansModal?'oublisModalRendu()':'renderTodo()';
  if(!oublisUtilisables(o))return o&&o.erreur?'<p class="muted">Le calcul des oublis a échoué côté serveur : '+esc(o.erreur)+'. Relance une synchronisation (🔄) ; si ça persiste, le classeur Vigiminutes ou QHP n’est pas lisible.</p>'
    :'<p class="muted">Le suivi arrive à la prochaine synchronisation (bouton 🔄 en haut).</p>';
  const nS=o.semaines.length,nM=o.mois.length, montrerV=fam!=='qhp', montrerQ=fam!=='vigi';
  const cell=(n,actif,courant,extra)=>{const e=etatCase(n,actif,courant);return '<td class="ob-'+e+(courant?' ob-c':'')+(extra||'')+'" title="'+(e==='ok'?n+' fait'+(n>1?'s':''):e==='ko'?'oubli':e==='att'?'à faire (période en cours)':'pas attendu : chantier sans activité')+'">'+(e==='ok'?n:e==='ko'?'✗':e==='att'?'⏳':'')+'</td>'};
  const koV=c=>c.vigi.filter((n,i)=>etatCase(n,c.actifV[i],i===nS-1)==='ko').length, koQ=c=>c.qhp.filter((n,i)=>etatCase(n,c.actifQ[i],i===nM-1)==='ko').length;
  const attV=c=>c.vigi.some((n,i)=>etatCase(n,c.actifV[i],i===nS-1)==='att'), attQ=c=>c.qhp.some((n,i)=>etatCase(n,c.actifQ[i],i===nM-1)==='att');
  const nbKo=c=>(montrerV?koV(c):0)+(montrerQ?koQ(c):0);
  const aRelancer=c=>nbKo(c)>0||(montrerV&&attV(c))||(montrerQ&&attQ(c));
  const l=oublisListe().filter(c=>oublisTous||aRelancer(c));
  const semLib=s=>s.slice(8,10)+'/'+s.slice(5,7);
  let h='<p class="hint" style="margin:0 0 8px">'+(montrerV?'<b>1 Vigiminute par semaine</b>':'')+(montrerV&&montrerQ?' et ':'')+(montrerQ?'<b>1 QHP par mois</b>':'')+' sur chaque chantier actif. '
    +'<span class="ob-ok ob-leg">3</span> fait · <span class="ob-ko ob-leg">✗</span> oubli · <span class="ob-att ob-leg">⏳</span> période en cours · <span class="ob-na ob-leg">&nbsp;</span> pas attendu (chantier sans activité). Calculé à la synchro'+(o.calculeLe?' · '+esc(frDateCourt(String(o.calculeLe).slice(0,10))):'')+'.</p>'
    +'<div class="row no-print" style="gap:8px;margin-bottom:8px"><span class="seg"><button class="'+(oublisTous?'':'on')+'" onclick="oublisTous=false;'+rafraichir+'">Chantiers à relancer</button><button class="'+(oublisTous?'on':'')+'" onclick="oublisTous=true;'+rafraichir+'">Tous les chantiers actifs</button></span></div>';
  (o.erreurs||[]).forEach(e=>{h+='<div class="secempty" style="margin-bottom:8px">⚠️ '+esc(e)+'</div>'});
  if(!l.length)return h+'<p class="muted">'+(oublisTous?'Aucun chantier actif'+(agenceChoisie?' pour cette agence':'')+'.':'Rien à relancer'+(agenceChoisie?' pour cette agence':'')+' 🎉')+'</p>';
  const ags=[...new Set(l.map(c=>c.agence||''))].sort((a,b)=>(a===''?1:0)-(b===''?1:0)||a.localeCompare(b));
  ags.forEach(ag=>{
    const lc=l.filter(c=>(c.agence||'')===ag).sort((a,b)=>nbKo(b)-nbKo(a)||String(a.nom).localeCompare(String(b.nom),'fr'));
    h+='<div class="ob-ag"><h4>'+(ag?'<span class="apill ag-'+esc(ag)+'">'+esc(ag)+'</span>':'<span class="apill">Sans agence</span>')+' <span class="muted small">'+lc.length+' chantier'+(lc.length>1?'s':'')+'</span></h4>'
      +'<div class="agb-scroll"><table class="atab ob-tab'+(montrerV&&montrerQ?' ob-deux':'')+'"><thead><tr><th rowspan="2" class="ob-nom">Chantier</th><th rowspan="2" class="ob-cond">Conducteur</th>'
      +(montrerV?'<th colspan="'+nS+'" class="ob-gv">📝 Vigiminutes · semaine du</th>':'')+(montrerQ?'<th colspan="'+nM+'" class="ob-gq">🗣️ QHP · mois</th>':'')+'<th rowspan="2" class="ob-tot">Oublis</th></tr><tr>'
      +(montrerV?o.semaines.map((s,i)=>'<th class="ob-gv'+(i===nS-1?' ob-cour':'')+'">'+(i===nS-1?'cette sem.':semLib(s))+'</th>').join(''):'')
      +(montrerQ?o.mois.map((m,i)=>'<th class="ob-gq'+(i===nM-1?' ob-cour':'')+'">'+MOIS_COURTS[Number(m.slice(5,7))-1]+'</th>').join(''):'')+'</tr></thead><tbody>'
      +lc.map(c=>{const k=nbKo(c);return '<tr><td class="ob-nom">'+esc(c.nom)+'</td><td class="ob-cond small">'+esc(c.conducteur||'—')+'</td>'
        +(montrerV?c.vigi.map((n,i)=>cell(n,c.actifV[i],i===nS-1)).join(''):'')+(montrerQ?c.qhp.map((n,i)=>cell(n,c.actifQ[i],i===nM-1,(montrerV&&i===0)?' ob-q1':'')).join(''):'')
        +'<td class="ob-tot'+(k?' ko':'')+'">'+(k||'—')+'</td></tr>'}).join('')
      +'</tbody></table></div></div>';
  });
  return h;
}
/* ---------- 👥 ENTRÉES / DÉPARTS DES COLLABORATEURS (V3.7) ----------
   Une seule liste pour tous les outils : le Référentiel CDES (onglet COLLABORATEURS).
   Un départ = une date de départ : la personne disparaît des listes de saisie des outils
   branchés (Suivi QHP, CR / Observations, PDP, VMS) ; ce qui a déjà été signé ou saisi
   reste. Lu et modifié par le serveur de l'intranet, éditeur seulement. */
let collabData={liste:[],charge:false,enCours:false,err:'',auj:''}, collabQ='', collabEdit=null;
function collabAuj(){return collabData.auj||new Date().toISOString().slice(0,10)}
function collabActif(c){return !c.dateDepart||c.dateDepart>=collabAuj()}
async function chargerCollab(){
  collabData.enCours=true;collabData.err='';majCollab();
  try{const r=await appel({secret:conf.secret,action:'collab-liste',appareil:conf.appareil||'éditeur'},45000);collabData.liste=r.collaborateurs||[];collabData.auj=r.aujourdhui||'';collabData.charge=true}
  catch(e){collabData.err=e.message||'erreur'}
  finally{collabData.enCours=false;majCollab()}
}
function majCollab(){
  const el=document.querySelector('#hse-todo details[data-b="collab"]');
  if(!el){if(typeof renderTodo==='function')renderTodo();return}
  const r=el.querySelector('summary .br-r');if(r)r.innerHTML=resumeCollab();
  const c=el.querySelector('.br-corps');if(c)c.innerHTML=renderCollabHSE();
}
function resumeCollab(){
  if(collabData.enCours&&!collabData.charge)return '⏳ chargement du Référentiel…';
  if(collabData.err)return '<b class="rouge">⚠️ '+esc(collabData.err)+'</b>';
  if(!collabData.charge)return 'ouvre pour charger la liste (Référentiel CDES)';
  const m=collabAuj().slice(0,7), l=collabData.liste.filter(c=>!agenceChoisie||c.agence===agenceChoisie);
  const act=l.filter(collabActif).length, ent=l.filter(c=>(c.dateAjout||'').slice(0,7)===m).length, dep=l.filter(c=>(c.dateDepart||'').slice(0,7)===m).length;
  return act+' actif'+(act>1?'s':'')+' · '+ent+' entrée'+(ent>1?'s':'')+' et '+dep+' départ'+(dep>1?'s':'')+' ce mois'+(agenceChoisie?' · '+esc(agenceChoisie):'');
}
function renderCollabHSE(){
  let h='<p class="hint" style="margin:0 0 8px">Une seule liste pour tous les outils : le <b>Référentiel CDES</b>. Un départ retire la personne des listes de saisie des outils branchés (Suivi QHP, CR / Observations, PDP, VMS) sous 10 minutes ; tout ce qu’elle a déjà signé ou saisi reste dans l’historique.</p>';
  h+='<div class="row no-print" style="gap:8px;margin-bottom:10px;align-items:center"><button class="btn btn-primary btn-sm" onclick="collabNouvelle()">➕ Nouvelle entrée</button>'
    +'<input type="text" id="collab-q" placeholder="🔎 Chercher un nom" value="'+esc(collabQ)+'" oninput="collabQ=this.value;renderCollabListe()" style="flex:1;min-width:160px">'
    +'<button class="btn btn-ghost btn-sm" onclick="chargerCollab()" title="Relire le Référentiel">🔄</button></div>';
  if(collabData.err)h+='<div class="secempty">⚠️ '+esc(collabData.err)+(/REFERENTIEL_ID/.test(collabData.err)?'<br>Ajoute la propriété <b>REFERENTIEL_ID</b> (identifiant du classeur « Référentiel CDES ») dans le script de l’intranet.':'')+'</div>';
  if(collabData.enCours&&!collabData.charge)return h+'<p class="muted">⏳ Chargement…</p>';
  return h+'<div id="collab-liste">'+collabListeHtml()+'</div>';
}
function renderCollabListe(){const b=document.getElementById('collab-liste');if(b)b.innerHTML=collabListeHtml();const r=document.querySelector('#hse-todo details[data-b="collab"] summary .br-r');if(r)r.innerHTML=resumeCollab()}
function collabListeHtml(){
  if(!collabData.charge)return '';
  const net=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const q=net(collabQ).trim();
  const l=collabData.liste.filter(c=>(!agenceChoisie||c.agence===agenceChoisie)&&(!q||net(c.nom).includes(q)));
  const lim=new Date(collabAuj());lim.setDate(lim.getDate()-90);const limK=lim.toISOString().slice(0,10);
  const mouv=[];l.forEach(c=>{if(c.dateAjout&&c.dateAjout>=limK)mouv.push({c,t:'e',d:c.dateAjout});if(c.dateDepart&&c.dateDepart>=limK)mouv.push({c,t:'d',d:c.dateDepart})});
  mouv.sort((a,b)=>b.d.localeCompare(a.d));
  let h='';
  if(mouv.length&&!q)h+='<h4 class="cl-h">Mouvements des 3 derniers mois</h4><div class="cl-mouv">'+mouv.slice(0,20).map(m=>'<span class="cl-m '+m.t+'">'+(m.t==='e'?'➕ ':'🚪 ')+esc(m.c.nom)+' <i>'+esc(frDateCourt(m.d))+(m.c.agence?' · '+esc(m.c.agence):'')+'</i></span>').join('')+'</div>';
  const act=l.filter(collabActif).sort((a,b)=>a.nom.localeCompare(b.nom,'fr')), partis=l.filter(c=>!collabActif(c)).sort((a,b)=>String(b.dateDepart).localeCompare(String(a.dateDepart)));
  h+='<h4 class="cl-h">Actifs <span class="apill">'+act.length+'</span></h4>';
  if(!act.length)h+='<p class="muted">Personne'+(q?' ne correspond':'')+'.</p>';
  else h+='<div class="agb-scroll"><table class="atab cl-tab"><thead><tr><th>Nom</th><th>Agence</th><th>Groupe</th><th>Rôles</th><th>Entrée</th><th></th></tr></thead><tbody>'
    +act.map(c=>'<tr'+(c.dateDepart?' class="cl-part"':'')+'><td><b>'+esc(c.nom)+'</b>'+(c.dateDepart?' <span class="cl-dep">part le '+esc(frDateCourt(c.dateDepart))+'</span>':'')+'</td><td>'+(c.agence?'<span class="apill ag-'+esc(c.agence)+'">'+esc(c.agence)+'</span>':'—')+'</td><td class="small">'+esc(c.secteur||'—')+'</td>'
      +'<td class="small">'+[c.conducteur?'🎓 conducteur':'',c.qhp?'QHP':'',c.diffusion?'📧 Vigiminutes':''].filter(Boolean).join(' · ')+'</td><td class="small">'+(c.dateAjout?esc(frDateCourt(c.dateAjout)):'—')+'</td>'
      +'<td class="cl-act"><button class="btn btn-ghost btn-sm" title="Modifier" data-n="'+esc(c.nom)+'" onclick="collabModifier(this.dataset.n)">✏️</button>'+(c.dateDepart?'<button class="btn btn-ghost btn-sm" data-n="'+esc(c.nom)+'" onclick="collabOp(\'retour\',this.dataset.n)">↩ Annuler le départ</button>':'<button class="btn btn-ghost btn-sm" data-n="'+esc(c.nom)+'" onclick="collabDepart(this.dataset.n)">🚪 Départ</button>')+'</td></tr>').join('')+'</tbody></table></div>';
  if(partis.length)h+='<details class="cl-partis"><summary>Partis <span class="apill">'+partis.length+'</span> — gardés pour l’historique, absents des listes des outils</summary><div class="agb-scroll"><table class="atab cl-tab"><tbody>'
    +partis.map(c=>'<tr><td>'+esc(c.nom)+'</td><td>'+esc(c.agence||'—')+'</td><td class="small">parti le '+esc(frDateCourt(c.dateDepart))+'</td><td class="cl-act"><button class="btn btn-ghost btn-sm" data-n="'+esc(c.nom)+'" onclick="collabOp(\'retour\',this.dataset.n)">↩ Annuler le départ</button></td></tr>').join('')+'</tbody></table></div></details>';
  return h;
}
async function collabOp(op,nom,extra){
  try{
    const r=await appel({secret:conf.secret,action:'collab-maj',appareil:conf.appareil||'éditeur',data:Object.assign({op:op,nom:nom},extra||{})},45000);
    collabData.liste=r.collaborateurs||collabData.liste;collabData.charge=true;
    toast({entree:'Entrée enregistrée ✓',depart:'Départ enregistré ✓',retour:'Départ annulé ✓',modifier:'Modifié ✓',supprimer:'Ligne supprimée'}[op]+(r.arrivant?' · fiche « nouvel arrivant » créée':''));
    if(r.arrivant&&typeof syncOuLecture==='function')syncOuLecture(false);
    majCollab();return true;
  }catch(e){toast('Échec : '+(e.message||'?'),true);return false}
}
function collabDepart(nom){
  const d=prompt('Date de départ de '+nom+' (AAAA-MM-JJ) :\n\nLa personne sortira des listes de saisie des outils à partir du lendemain. Son historique est gardé.',collabAuj());
  if(d===null)return;if(!/^\d{4}-\d{2}-\d{2}$/.test(d.trim())){toast('Date attendue au format AAAA-MM-JJ',true);return}
  const [a,m,j]=d.trim().split('-').map(Number),dt=new Date(a,m-1,j);
  if(dt.getFullYear()!==a||dt.getMonth()!==m-1||dt.getDate()!==j){toast('Cette date n’existe pas',true);return}
  collabOp('depart',nom,{date:d.trim()});
}
function collabNouvelle(){collabEdit=null;collabForm({})}
function collabModifier(nom){const c=collabData.liste.find(x=>x.nom===nom);if(!c)return;collabEdit=nom;collabForm(c)}
function collabForm(c){
  const m=document.getElementById('m-collab');if(!m)return;
  document.getElementById('mc-titre').textContent=collabEdit?'Modifier — '+collabEdit:'Nouvelle entrée';
  const g=id=>document.getElementById(id);
  g('mc-nom').value=c.nom||'';g('mc-nom').disabled=!!collabEdit;
  g('mc-agence').value=c.agence||agenceChoisie||'';g('mc-secteur').value=c.secteur||'';
  g('mc-date').value=collabAuj();g('mc-date-l').style.display=collabEdit?'none':'';
  g('mc-cond').checked=!!c.conducteur;g('mc-qhp').checked=collabEdit?!!c.qhp:true;g('mc-diff').checked=!!c.diffusion;
  g('mc-arr-l').style.display=collabEdit?'none':'';g('mc-arr').checked=!collabEdit;
  g('mc-del').style.display=collabEdit?'':'none';
  m.classList.add('open');
}
async function collabEnregistrer(){
  const g=id=>document.getElementById(id);
  const nom=g('mc-nom').value.replace(/\s+/g,' ').trim();
  if(!nom){toast('Le nom est obligatoire (NOM Prénom)',true);return}
  const d={agence:g('mc-agence').value,secteur:g('mc-secteur').value.trim(),conducteur:g('mc-cond').checked,qhp:g('mc-qhp').checked,diffusion:g('mc-diff').checked};
  let ok;
  if(collabEdit)ok=await collabOp('modifier',collabEdit,d);
  else ok=await collabOp('entree',nom,Object.assign(d,{date:g('mc-date').value,arrivant:g('mc-arr').checked,statut:g('mc-statut').value}));
  if(ok)closeModal();
}
async function collabSupprimer(){
  if(!collabEdit)return;
  if(!confirm('Supprimer la ligne « '+collabEdit+' » du Référentiel ?\n\nÀ réserver à une erreur de saisie. Pour quelqu’un qui quitte CDES, utilise plutôt « Départ » : son historique reste rattaché.'))return;
  if(await collabOp('supprimer',collabEdit))closeModal();
}
function bulMoisCourantSur(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function bulBilanLu(an){const brut=kpiVal(bulBilanCle(an,agenceChoisie));if(!brut)return null;try{return JSON.parse(brut)}catch(e){return null}}
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
  const hC=Number(c.heures)||0, hI=Number(i.heures)||0;
  const tgCalc=hC?((Number(c.joursArret)||0)*1000/hC).toFixed(2).replace('.',','):null, tfCalc=hC?((Number(c.accArret)||0)*1e6/hC).toFixed(2).replace('.',','):null;
  const tgCalcI=hI?((Number(i.joursArret)||0)*1000/hI).toFixed(2).replace('.',','):null, tfCalcI=hI?((Number(i.accArret)||0)*1e6/hI).toFixed(2).replace('.',','):null;
  const portee=agenceChoisie?('agence '+agenceChoisie):'CDES — toutes agences';
  const ans=[anCour-1,anCour-2,anCour-3].map(a=>'<option'+(String(a)===bilanAn?' selected':'')+'>'+a+'</option>').join('');
  const inp=(id,v,ph)=>'<input type="number" min="0" step="any" id="'+id+'" value="'+(v===undefined||v===null||v===''?'':esc(String(v)))+'" placeholder="'+(ph||'')+'" style="width:100%">';
  let h='<p class="small muted" style="margin:0 0 8px">Colonne N-1 du bulletin · portée : <b>'+esc(portee)+'</b>. Le classeur n’a pas les mois d’avant 2026 : tape ici les <b>totaux de l’année</b>, tels qu’ils figurent dans ton bulletin. Ils remplacent la colonne de gauche du tableau « Reporting » (écran et PDF). Le sélecteur d’agence en haut de page choisit la portée (Global = CDES entière).</p>'
    +'<div class="row" style="align-items:center;gap:8px;margin-bottom:8px"><label class="f" style="margin:0">Année</label><select id="bl-an" style="width:120px" onchange="bilanAn=this.value;renderTodo()">'+ans+'</select>'
    +(o?'<span class="apill">saisi'+(o.maj?' · '+esc(frDateCourt(String(o.maj).slice(0,10))):'')+'</span>':'<span class="apill" style="background:#fff3e0;color:#9a5b00">rien de saisi</span>')+'</div>'
    +'<div class="agb-scroll"><table class="atab bl-tab"><thead><tr><th></th><th>CDES</th><th>Intérim</th></tr></thead><tbody>'
    +BILAN_CHAMPS.map(([k,lib])=>'<tr><th style="text-align:left">'+esc(lib)+'</th><td>'+inp('bl-c-'+k,c[k])+'</td><td>'+inp('bl-i-'+k,i[k])+'</td></tr>').join('')
    +'<tr><th style="text-align:left">Heures travaillées <span class="muted" style="font-weight:400">(pour Tg / Tf)</span></th><td>'+inp('bl-c-heures',c.heures,'ex. 150000')+'</td><td>'+inp('bl-i-heures',i.heures,'heures intérim')+'</td></tr>'
    +'<tr><th style="text-align:left">Taux de gravité (Tg)</th><td>'+inp('bl-c-tg',c.tg,tgCalc!==null?'calculé : '+tgCalc:'à taper, ou heures')+'</td><td>'+inp('bl-i-tg',i.tg,tgCalcI!==null?'calculé : '+tgCalcI:'à taper, ou heures')+'</td></tr>'
    +'<tr><th style="text-align:left">Taux de fréquence (Tf)</th><td>'+inp('bl-c-tf',c.tf,tfCalc!==null?'calculé : '+tfCalc:'à taper, ou heures')+'</td><td>'+inp('bl-i-tf',i.tf,tfCalcI!==null?'calculé : '+tfCalcI:'à taper, ou heures')+'</td></tr>'
    +'</tbody></table></div>'
    +'<div class="row no-print" style="margin-top:10px;gap:8px"><button class="btn btn-primary btn-sm" onclick="enregistrerBilan()">Enregistrer</button>'
    +(o?'<button class="btn btn-ghost btn-sm" onclick="effacerBilan()">Effacer ce bilan</button>':'')
    +'<span class="hint" style="margin:0">Tg / Tf : la valeur tapée fait foi ; case vide = calcul depuis les heures (Tg = jours d’arrêt × 1 000 / heures · Tf = AT avec arrêt × 10⁶ / heures).</span></div>';
  return h;
}
function enregistrerBilan(){
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  const g=id=>{const e=document.getElementById(id);if(!e)return '';const v=e.value.trim();return v===''?'':Number(v.replace(',','.'))};
  const cdes={},interim={};let rempli=false;
  BILAN_CHAMPS.forEach(([k])=>{const a=g('bl-c-'+k),b=g('bl-i-'+k);if(a!=='')cdes[k]=a;if(b!=='')interim[k]=b;if(a!==''||b!=='')rempli=true});
  const hh=g('bl-c-heures');if(hh!=='')cdes.heures=hh;
  const hi=g('bl-i-heures');if(hi!=='')interim.heures=hi;
  ['tg','tf'].forEach(k=>{const v=g('bl-c-'+k);if(v!==''&&!isNaN(v)){cdes[k]=v;rempli=true}
    const w=g('bl-i-'+k);if(w!==''&&!isNaN(w)){interim[k]=w;rempli=true}});
  if(!rempli&&hh===''&&hi===''){toast('Rien à enregistrer : remplis au moins une case',true);return}
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
  return '<p class="hint" style="margin:0 0 6px">Affichés en tête du bulletin, une ligne par point.</p>'
    +'<div class="fm-l">'+mois.map(k=>{const v=String(kpiVal('faits.'+k)||'');return '<div class="fm-i"><b>'+esc(typeof bulLib==='function'?bulLib(k):k)+'</b><div class="small">'+(v?esc(v).replace(/\n/g,'<br>'):'<span class="muted">rien de saisi</span>')+'</div><button class="btn btn-ghost btn-sm no-print" onclick="bulEditerFaits(\''+k+'\')">✏️</button></div>'}).join('')+'</div>';
}
function todoVu(k){conf.todoVus=conf.todoVus||{};conf.todoVus[k]=1;saveConfLS();renderTodo()}
