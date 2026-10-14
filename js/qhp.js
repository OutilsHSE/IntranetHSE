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
function renderQhp(){
  const box=document.getElementById('v-qhp');if(!box)return;
  if(qhpThemeOuvert){renderQhpTheme();return}
  const l=qhpThemes().filter(t=>t.actif||estEditeur());
  let h='<div class="arr-head"><div><h2>🎓 Espace QHP</h2><p class="small muted" style="margin:2px 0 0">Les quarts d’heure prévention, thème par thème : la vidéo, le flash, le quiz — et l’émargement à portée de main.</p></div>'
    +'<div class="arr-kpis">'+boutonEmargement('btn-sm')+(estEditeur()?'<button class="btn btn-primary btn-sm no-print" onclick="qhpEditer()">＋ Nouveau thème</button>':'')+'</div></div>';
  if(!l.length)h+='<div class="secempty">Aucun thème pour l’instant.'+(estEditeur()?' Clique sur « ＋ Nouveau thème » : un titre, le mois, le lien de la vidéo, celui du flash, et quelques questions.':' Le service HSE les ajoute au fil des mois.')+'</div>';
  else h+='<div class="qhp-grid">'+l.map(t=>'<div class="qhp-card'+(t.actif?'':' off')+'" onclick="qhpOuvrir(\''+esc(t.id)+'\')">'
    +'<div class="qhp-mois">'+esc(qhpMoisLib(t.mois)||'—')+(t.actif?'':' · <i>masqué</i>')+'</div><div class="qhp-titre">'+esc(t.titre||'Sans titre')+'</div>'
    +'<div class="qhp-badges">'+(t.video?'<span>🎬 vidéo</span>':'')+(t.flash?'<span>⚡ flash</span>':'')+((t.quiz||[]).length?'<span>❓ quiz · '+t.quiz.length+'</span>':'')+'</div></div>').join('')+'</div>';
  box.innerHTML=h;
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
  h+='<div class="card qhp-sec"><h3>⚡ Le flash</h3>'+(t.flash?(/\.pdf(\?|$)/i.test(t.flash)?'<div class="qhp-pdf"><iframe src="'+esc(t.flash)+'" title="Flash" loading="lazy"></iframe></div>':'')+'<a class="btn btn-primary" href="'+esc(t.flash)+'" target="_blank" rel="noopener">⚡ Ouvrir le flash</a>':'<p class="muted">Pas de flash associé.</p>')+'</div>';
  h+='<div class="card qhp-sec qhp-quiz"><h3>❓ Le quiz'+(quiz.length?' <span class="apill">'+quiz.length+' question'+(quiz.length>1?'s':'')+'</span>':'')+'</h3>';
  if(!quiz.length)h+='<p class="muted">Pas de quiz pour ce thème.</p>';
  else{
    quiz.forEach((q,i)=>{
      const rep=qhpRep[i];
      h+='<div class="qq'+(rep===undefined?'':(rep===q.b?' bon':' faux'))+'"><div class="qq-q">'+(i+1)+'. '+esc(q.q||'')+'</div><div class="qq-r">'
        +(q.r||[]).map((r,j)=>'<button class="qq-b'+(rep===undefined?'':(j===q.b?' juste':(j===rep?' choisi':'')))+'" '+(rep===undefined?'onclick="qhpRepondre('+i+','+j+')"':'disabled')+'>'+esc(r)+'</button>').join('')
        +'</div>'+(rep!==undefined?'<div class="qq-e">'+(rep===q.b?'✅ Bonne réponse !':'❌ La bonne réponse : <b>'+esc((q.r||[])[q.b]||'')+'</b>')+(q.e?' — '+esc(q.e):'')+'</div>':'')+'</div>';
    });
    const n=Object.keys(qhpRep).length, bons=quiz.filter((q,i)=>qhpRep[i]===q.b).length;
    if(n>=quiz.length)h+='<div class="qq-score">Score : <b>'+bons+' / '+quiz.length+'</b> '+(bons===quiz.length?'🏆 Parfait !':(bons>=quiz.length/2?'🙂 Pas mal — relis le flash pour le reste.':'🙁 Revois le flash et retente !'))+' <button class="btn btn-ghost btn-sm" onclick="qhpRep={};renderQhp()">↻ Recommencer</button></div>';
  }
  h+='</div></div>';
  h+='<div class="qhp-foot no-print"><p>Le QHP est fait ? </p>'+boutonEmargement('')+'</div>';
  box.innerHTML=h;
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
  document.getElementById('m-qtheme').classList.add('open');
}
function qhpEnregistrer(){
  const g=k=>document.getElementById(k).value.trim();
  const titre=g('mq-titre');if(!titre){toast('Donne un titre au thème',true);return}
  const quiz=texteVersQuiz(g('mq-quiz'));
  if(g('mq-quiz')&&!quiz.length){toast('Quiz : il faut au moins une question « Q: » avec deux réponses « - »',true);return}
  const o={id:qhpEnCours||('qt'+Date.now().toString(36)),maj:nowISO(),titre,mois:g('mq-mois'),video:g('mq-video'),flash:g('mq-flash'),note:g('mq-note'),quiz,actif:document.getElementById('mq-actif').checked};
  state.qhpThemes=(state.qhpThemes||[]).filter(x=>x.id!==o.id).concat([o]);
  save();closeModal();qhpThemeOuvert=o.id;qhpRep={};renderQhp();toast('Thème enregistré ✓ (synchro en cours)');
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
