const APP_VERSION='V3.12.2';   // 19/10/2026 — arrivants : dates lues au bon jour (ISO Sheets), lignes stables, deux modifications coup sur coup gardées ; V3.11.1 : correctif « tout débranché » (lecture légère de l'éditeur avec son code, synchro enchaînée) ; V3.11 16/10 : retours avant tests : recherche élargie (synonymes, racines, fautes), recherche IA (chrono, cache, repli), page d'un flash redessinée (image cliquable, vidéo + quiz en encadrés, vignette YouTube), images des flashs par lot (pdf.js embarqué), quiz proposé par l'IA, oublis sur l'accueil ; + V3.8 intérimaires, V3.7 collaborateurs, V3.6 oublis, V3.5.1 flashs, V3.4 rapidité
const LS='ihse_v2', LS_CONF='ihse_conf_v2';
const EPOCH='1970-01-01T00:00:00.000Z';
function nowISO(){return new Date().toISOString()}
const todayISO=new Date().toISOString().slice(0,10);
const MOIS_S=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const MOIS_L=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
function uid(){return 't'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function toast(m,e){const t=document.getElementById('toast');t.textContent=m;t.className=(e?'err ':'')+'show';clearTimeout(t._t);t._t=setTimeout(()=>t.className='',2600)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
/* V3.12.1 : une date peut arriver en « 2026-09-13T22:00:00.000Z » (cellule convertie par Sheets, minuit Paris = 22 h UTC la veille) : on la lit à l'heure locale, jamais par slice(0,10) */
function jourDe(v){v=String(v||'').trim();if(!v)return '';if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;if(/^\d{4}-\d{2}-\d{2}T/.test(v)){const d=new Date(v);if(!isNaN(d))return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}return v.slice(0,10)}
function frDate(iso){if(!iso)return '';const j=jourDe(iso);const d=new Date(j+'T00:00');if(isNaN(d))return iso;return d.getDate()+' '+MOIS_S[d.getMonth()]+' '+d.getFullYear()}
function frDateCourt(iso){if(!iso)return '';const d=new Date(iso);if(isNaN(d))return '';return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')}

/* ==================== OUTILS PAR DÉFAUT ==================== */
const CATS=['Pour évaluer les risques','Pour prévenir les risques','Pour sensibiliser les nouveaux arrivants','Culture HSE','Outils service HSE'];
const CAT_HSE='Outils service HSE';
const DEF_OUTILS=[
 // — Pour évaluer les risques —
 {id:'pdp',cat:'Pour évaluer les risques',ico:'📄',nom:'Rédaction PDP / PPSPS / Protocole',desc:'Plan de prévention, PPSPS, protocole chargement-déchargement — Word à la trame CDES',url:''},
 {id:'pae',cat:'Pour évaluer les risques',ico:'🌿',nom:'PAE — Plan d’Assurance Environnement',desc:'Rédaction du PAE du chantier',url:''},
 {id:'paq',cat:'Pour évaluer les risques',ico:'📐',nom:'PAQ — Plan d’Assurance Qualité',desc:'Rédaction du PAQ du chantier',url:''},
 // — Pour prévenir les risques (Vigiminute en premier) —
 {id:'vigiminute',cat:'Pour prévenir les risques',ico:'👁️',nom:'Vigiminute',desc:'Signaler une situation en une minute — choisis ton formulaire',links:[]},
 {id:'vms',cat:'Pour prévenir les risques',ico:'🧭',nom:'VMS — visites managériales',desc:'Visites managériales de sécurité et envoi au plan d’actions',url:''},
 {id:'crhse',cat:'Pour prévenir les risques',ico:'📝',nom:'CR / Observations HSE',desc:'Compte-rendu de visite HSE, envoi au plan d’actions',url:'https://outilshse.github.io/ObservationsHSE/'},
 {id:'emargement',cat:'Pour prévenir les risques',ico:'✍️',nom:'Fiche d’émargement QHP',desc:'Quart d’Heure Prévention : émargement signable au doigt',url:''},
 // — Pour sensibiliser les nouveaux arrivants —
 {id:'accueilsecu',cat:'Pour sensibiliser les nouveaux arrivants',ico:'🦺',nom:'Fiche d’accueil SSE',desc:'Accueil des nouveaux arrivants et intérimaires',url:'https://outilshse.github.io/FicheAccueilSecurite/'},
 {id:'fformation',cat:'Pour sensibiliser les nouveaux arrivants',ico:'🎓',nom:'Fiches de formation au poste',desc:'Choisis la fiche selon le poste de travail',links:[]},
 {id:'autoconduite',cat:'Pour sensibiliser les nouveaux arrivants',ico:'🚜',nom:'Autorisation de conduite',desc:'Autorisations de conduite ponctuelles',url:''},
 {id:'pretmat',cat:'Pour sensibiliser les nouveaux arrivants',ico:'🤝',nom:'Prêt de matériel',desc:'Convention et fiche de prêt pour les conducteurs extérieurs',url:''},
 {id:'modeop',cat:'Pour prévenir les risques',ico:'📚',nom:'Banque documentaire',desc:'Flashs Santé-Sécurité et modes opératoires, cherchables par mot clé',url:''},
 // — Culture HSE —
 {id:'retex',cat:'Culture HSE',ico:'📘',nom:'RETEX chantiers',desc:'Bilans de fin de chantier : ce qu’on retient de chaque chantier',url:''},
 // — Outils service HSE (visibles via la case dédiée) —
 {id:'analyseacc',cat:CAT_HSE,ico:'🚨',nom:'Analyse d’accident',desc:'Recueil des faits, arbre des causes, rapport',url:'https://outilshse.github.io/AnalyseAccident/',hse:true},
 {id:'suiviqhp',cat:CAT_HSE,ico:'📋',nom:'Suivi des QHP',desc:'Fiches, bilan mensuel et annuel des Quarts d’Heure Prévention',url:'',hse:true},
 {id:'suivivigi',cat:CAT_HSE,ico:'📊',nom:'Suivi des Vigiminutes',desc:'Taux de réalisation hebdo par chantier et par bateau',url:'https://outilshse.github.io/Vigiminutes/',hse:true},
 {id:'repapp',cat:CAT_HSE,ico:'✍️',nom:'Reporting HSE',desc:'Saisie : mensuel, accidentologie, santé-environnement, flashs, objectifs',url:'',hse:true},
 {id:'reporting',cat:CAT_HSE,ico:'🗂️',nom:'Sheets de reporting',desc:'Accès direct aux classeurs Google',links:[],hse:true}
].map((o,i)=>Object.assign({url:'',links:[],hse:false},o,{ordre:(i+1)*10,maj:EPOCH,masque:false}));

/* ==================== KPI : DÉFINITIONS ==================== */
const SECTIONS=[
 {id:'secu',ico:'🛡️',titre:'Sécurité & accidents',kpis:[
   {cle:'secu.dernierAccident',lib:'Date du dernier accident avec arrêt',type:'date'},
   {cle:'secu.accArret',lib:'AT avec arrêt (année)',type:'num',mauvaisSi:v=>v>0},
   {cle:'secu.accSansArret',lib:'AT sans arrêt (année)',type:'num'},
   {cle:'secu.soins',lib:'AT bénins / soins (année)',type:'num'},
   {cle:'secu.presqu',lib:'Presqu’accidents (année)',type:'num'},
   {cle:'secu.joursArret',lib:'Jours d’arrêt (année)',type:'num'},
   {cle:'secu.heures',lib:'Heures travaillées (année)',type:'num',cache:true},
   {cle:'secu.note',lib:'Point sécurité significatif du mois',type:'txt',cache:true}]},
 {id:'qhp',ico:'📋',titre:'Quarts d’Heure Prévention',auto:true,kpis:[]},
 {id:'vms',ico:'🧭',titre:'Visites managériales (VMS)',kpis:[
   {cle:'vms.mois',lib:'VMS réalisées ce mois',type:'num'},
   {cle:'vms.objMois',lib:'Objectif mensuel',type:'num'},
   {cle:'vms.annee',lib:'VMS réalisées (année)',type:'num'}]},
 {id:'vigi',ico:'👁️',titre:'Vigiminutes & observations',kpis:[
   {cle:'vigi.tauxHebdo',lib:'Participation Vigiminutes (semaine)',type:'pct',bonSi:v=>v>=80},
   {cle:'vigi.remontees',lib:'Remontées Vigiminutes (année)',type:'num'},
   {cle:'vigi.traitees',lib:'Remontées traitées',type:'pct',bonSi:v=>v>=80}]},
 {id:'form',ico:'🎓',titre:'Formation au poste & accueils HSE',kpis:[
   {cle:'form.fiches',lib:'Fiches de formation au poste réalisées (année)',type:'num'},
   {cle:'form.accueils',lib:'Accueils HSE réalisés (année)',type:'num'},
   {cle:'form.arrivants',lib:'Nouveaux arrivants sur la période (année)',type:'num'}]},
 {id:'pret',ico:'🤝',titre:'Prêt de matériel',kpis:[
   {cle:'pret.mois',lib:'Prêts de matériel remis ce mois',type:'num'},
   {cle:'pret.annee',lib:'Prêts de matériel remis (année)',type:'num'},
   {cle:'pret.enCours',lib:'Engins actuellement prêtés',type:'num'}]},
 {id:'sante',ico:'🩺',titre:'Santé',kpis:[
   {cle:'sante.mp',lib:'Maladies professionnelles déclarées (année)',type:'num',mauvaisSi:v=>v>0},
   {cle:'sante.campagnes',lib:'Campagnes de mesures d’exposition (année)',type:'num'},
   {cle:'sante.sensibs',lib:'Sensibilisations santé (année)',type:'num'},
   {cle:'sante.note',lib:'Point santé significatif du mois',type:'txt',cache:true}]},
 {id:'env',ico:'🌱',titre:'Environnement',kpis:[
   {cle:'env.evenements',lib:'Événements environnementaux significatifs (année)',type:'num',mauvaisSi:v=>v>0},
   {cle:'env.sensibs',lib:'Sensibilisations environnement (année)',type:'num'},
   {cle:'env.dechetsT',lib:'Tonnage de déchets (année)',type:'num',cache:true},
   {cle:'env.dechetsVal',lib:'Part valorisée des déchets',type:'pct',bonSi:v=>v>=70,cache:true},
   {cle:'env.confReg',lib:'Taux de conformité réglementaire (veille SSE)',type:'pct',bonSi:v=>v>=90},
   {cle:'env.note',lib:'Point environnement significatif du mois',type:'txt',cache:true}]},
 {id:'flash',ico:'📣',titre:'Animation & culture HSE',kpis:[
   {cle:'flash.securite',lib:'Flashs Sécurité (année)',type:'num'},
   {cle:'flash.sante',lib:'Flashs Santé (année)',type:'num'},
   {cle:'flash.env',lib:'Flashs Environnement (année)',type:'num'},
   {cle:'flash.retex',lib:'Flashs RETEX suite AT (année)',type:'num'}]},
 /* Les KPI MASE ne sont plus une section du tableau de bord : ils vivent dans la
    carte MASE du bandeau. On garde leurs définitions ici pour l'écran de réglages. */
 {id:'mase',ico:'🏅',titre:'Certification MASE',horsDash:true,kpis:[
   {cle:'mase.avancement',lib:'Note obtenue à l’audit MASE',type:'pct',bonSi:v=>v>=70},
   {cle:'mase.agence',lib:'Agence concernée',type:'txt'},
   {cle:'mase.certUrl',lib:'Lien vers le certificat (PDF ou image)',type:'txt'}]}
];
/* ---------------------------------------------------------------------------
 * SOMMAIRE — les indicateurs sont rangés en familles, une seule affichée à la
 * fois. Tout reste construit dans la page (donc l'impression sort tout, et la
 * recherche du navigateur trouve tout) : on ne fait que masquer. Ajouter une
 * section au tableau de bord = l'inscrire ici, sinon elle atterrit dans la
 * dernière famille plutôt que de disparaître.
 * ------------------------------------------------------------------------- */
const FAMILLES=[
 {id:'acc',   ico:'🛡️', titre:'Accidentologie',        secs:['secu']},
 {id:'terr',  ico:'👁️', titre:'Terrain',                secs:['vigi','vms','pret']},
 {id:'anim',  ico:'📋', titre:'Animation QHP',          secs:['qhp','flash']},
 {id:'arriv', ico:'🎓', titre:'Nouveaux arrivants',     secs:['form']},
 {id:'se',    ico:'🌱', titre:'Santé & environnement',  secs:['sante','env']}
];
function familleDe(idSection){
  const f=FAMILLES.find(x=>x.secs.indexOf(idSection)>=0);
  return f?f.id:FAMILLES[FAMILLES.length-1].id;
}
let famActive=(function(){try{return localStorage.getItem('hse_famille')||FAMILLES[0].id}catch(e){return FAMILLES[0].id}})();
function setFamille(id){
  if(!FAMILLES.some(f=>f.id===id))id=FAMILLES[0].id;
  famActive=id;
  try{localStorage.setItem('hse_famille',id)}catch(e){}
  appliquerFamille();
  const b=document.getElementById('fam-'+id);
  if(b&&b.scrollIntoView)b.scrollIntoView({block:'nearest',inline:'nearest'});
}
function appliquerFamille(){
  document.querySelectorAll('#dash-body .fam').forEach(d=>{
    d.hidden=(d.getAttribute('data-fam')!==famActive)});
  document.querySelectorAll('#dash-body .fambar button').forEach(b=>{
    b.classList.toggle('on',b.id==='fam-'+famActive)});
}
function barreFamilles(){
  return '<div class="fambar no-print">'+FAMILLES.map(f=>
    '<button id="fam-'+f.id+'" class="'+(f.id===famActive?'on':'')+'" onclick="setFamille(\''+f.id+'\')">'
    +f.ico+' <span>'+esc(f.titre)+'</span></button>').join('')+'</div>';
}
const MOIS_C=['J','F','M','A','M','J','J','A','S','O','N','D'];
const KPI_INDEX={};SECTIONS.forEach(s=>s.kpis.forEach(k=>KPI_INDEX[k.cle]=k));
/* valeurs de démonstration tant que rien n'est branché ni saisi */
const DEMO={'secu.dernierAccident':'2026-03-12','secu.accArret':1,'secu.accSansArret':3,'secu.soins':3,'secu.presqu':9,'secu.joursArret':81,'secu.heures':95313,'secu.echeances':'VGP grue — sept. · Audit MASE à blanc — nov.',
 'vigi.tauxHebdo':86,'vigi.remontees':118,'vigi.traitees':92,
 'form.fiches':6,
 'pret.mois':2,'pret.annee':7,'pret.enCours':3,
 'vms.mois':2,'vms.objMois':4,'vms.annee':17,
 'sante.mp':0,'sante.campagnes':2,'sante.sensibs':4,'sante.note':'Campagne bruit atelier en cours',
 'env.evenements':0,'env.sensibs':3,
 'secu.note':'Chute de plain-pied atelier — reprise du marquage au sol','env.note':'Bac de rétention fuel remplacé sur la base de Nantes',
 'mase.avancement':78.2,'mase.agence':'Île-de-France','mase.certUrl':'',
 'mase.debut':'2026-06-05','mase.fin':'2027-06-04','mase.num':'N 2026-1066',
 'mase.ax1':80,'mase.ax2':76.9,'mase.ax3':77.7,'mase.ax4':78.6,'mase.ax5':77.8,
 'env.confReg':88,'flash.securite':9,'flash.sante':3,'flash.env':2,'flash.retex':2};
/* démo du reporting central (mêmes colonnes que le classeur « Indicateurs SSE ») */
const DEMO_REP={calculeLe:null,dernierArret:'2026-03-12',mois:[
 {k:'2026-01',vmsCd:3,vmsAd:1,dechetsT:18.4,dechetsVal:62,trajet:0,mp:0,qhpEff:116,qhpPart:72,arrivants:14,heures:14651,accArret:0,accSans:1,benins:0,joursArret:0,vms:1,accueils:12,visites:5,vigiAtt:84,vigiRecu:67,formations:0},
 {k:'2026-02',vmsCd:2,vmsAd:2,dechetsT:22.1,dechetsVal:58,trajet:1,mp:0,qhpEff:116,qhpPart:88,arrivants:5,heures:15263,accArret:0,accSans:1,benins:2,joursArret:0,vms:1,accueils:4,visites:7,vigiAtt:84,vigiRecu:74,formations:1},
 {k:'2026-03',vmsCd:4,vmsAd:1,dechetsT:31.6,dechetsVal:66,trajet:0,mp:0,qhpEff:118,qhpPart:81,arrivants:4,heures:17886,accArret:0,accSans:0,benins:0,joursArret:0,vms:1,accueils:4,visites:5,vigiAtt:83,vigiRecu:68,formations:2},
 {k:'2026-04',vmsCd:3,vmsAd:3,dechetsT:27.3,dechetsVal:71,trajet:0,mp:1,qhpEff:118,qhpPart:95,arrivants:9,heures:15566,accArret:1,accSans:0,benins:0,joursArret:20,vms:1,accueils:8,visites:7,vigiAtt:93,vigiRecu:75,formations:1},
 {k:'2026-05',vmsCd:5,vmsAd:2,dechetsT:35.2,dechetsVal:74,trajet:1,mp:0,qhpEff:118,qhpPart:70,arrivants:3,heures:14970,accArret:0,accSans:1,benins:1,joursArret:31,vms:2,accueils:3,visites:6,vigiAtt:74,vigiRecu:60,formations:3},
 {k:'2026-06',vmsCd:4,vmsAd:1,dechetsT:29.8,dechetsVal:79,trajet:0,mp:0,qhpEff:120,qhpPart:99,arrivants:2,heures:16978,accArret:0,accSans:0,benins:0,joursArret:30,vms:2,accueils:2,visites:4,vigiAtt:105,vigiRecu:86,formations:2}],
 remontees:{total:118,traitees:109,pc:92,presqu:9,
  sd:71,bp:14,
  parType:[{d:'Situation dangereuse',n:71},{d:'Point d’amélioration',n:24},{d:'Bonne pratique',n:14},{d:'Presqu’accident',n:9}],
  sdParMois:[{k:'2026-01',n:9},{k:'2026-02',n:4},{k:'2026-03',n:5},{k:'2026-04',n:13},{k:'2026-05',n:20},{k:'2026-06',n:20}],
  bpParMois:[{k:'2026-01',n:2},{k:'2026-02',n:1},{k:'2026-03',n:1},{k:'2026-04',n:3},{k:'2026-05',n:4},{k:'2026-06',n:3}],
  parDomaine:[{d:'Sécurité',n:96},{d:'Réglementaire',n:9},{d:'Environnement',n:7},{d:'Santé',n:6}],
  parMois:[{k:'2026-01',n:16},{k:'2026-02',n:6},{k:'2026-03',n:8},{k:'2026-04',n:21},{k:'2026-05',n:33},{k:'2026-06',n:34}]},
 zones:{parZone:{main:2,cheville:2,jambe:1,dos:1},blessants:6,total:7,analyses:{total:7,faites:5,pc:71},
  hipo:2,categories:{interim:1,soustraitant:1,externes:2},
  rqs:[{d:'RQS N°3 : Port des EPI',n:3},{d:'RQS N°1',n:2},{d:'RQS N°7',n:1}],actions:{total:5,faites:2,retard:1,prochaines:[{t:'Remplacer les extincteurs des 2 pelles',e:'2026-07-31',q:'Chef de chantier',tard:true},{t:'Ligne de jet sur les bouées',e:'2026-09-15',q:'Conducteur de travaux',tard:false},{t:'Formaliser la formation au poste faucardage',e:'2026-09-30',q:'Service HSE',tard:false}]},typologies:[
  {d:'Blessure par un outil à main',n:1},{d:'Choc / Heurt avec un objet fixe',n:1},{d:'Accident de la route en mission',n:1},
  {d:'Chute de plain-pied',n:1},{d:'Blessé suite à un effondrement / chute d’objet',n:1},{d:'Chute de hauteur',n:1}]},
 postes:[{k:'2026-01',poste:'Faucardage',n:2},{k:'2026-02',poste:'Conduite d’engin amphibie',n:1},
  {k:'2026-03',poste:'Élagage / abattage',n:2},{k:'2026-04',poste:'Faucardage',n:1},
  {k:'2026-05',poste:'Travaux en berge',n:2},{k:'2026-05',poste:'Conduite d’engin amphibie',n:1},
  {k:'2026-06',poste:'Maintenance atelier',n:2}]};

/* démo des objectifs SSE : deux mesurés automatiquement, un saisi à la main,
   un sans indicateur chiffré (avancement apprécié au smiley) */
const DEMO_OBJ={annee:'2026',moisConnus:6,calculeLe:null,objectifs:[
 {id:'o1',num:'3',domaine:'SECURITE',intitule:'Poursuivre l’analyse des risques à travers les Vigiminutes',
  pc:97,smiley:'🙂',
  inds:[{lib:'Participation Vigiminutes',cle:'auto.vigiPart',auto:true,unite:'pct',agg:'moyenne',sens:'sup',cible:80,
         annee:87,pc:109,trims:[{t:1,cumul:82,pc:103},{t:2,cumul:87,pc:109},{t:3,cumul:null,pc:null},{t:4,cumul:null,pc:null}]},
        {lib:'Remontées Vigiminutes',cle:'auto.remontees',auto:true,unite:'nb',agg:'somme',sens:'sup',cible:260,
         annee:118,pc:91,trims:[{t:1,cumul:30,pc:46},{t:2,cumul:118,pc:91},{t:3,cumul:null,pc:null},{t:4,cumul:null,pc:null}]}],
  trims:[{t:1,pc:75,smiley:'🙂',calcule:'🙂',force:false,commentaire:''},
         {t:2,pc:100,smiley:'😀',calcule:'😀',force:false,commentaire:'Bonne dynamique depuis avril.'},
         {t:3,pc:null,smiley:'',calcule:'',force:false,commentaire:''},
         {t:4,pc:null,smiley:'',calcule:'',force:false,commentaire:''}]},
 {id:'o2',num:'4',domaine:'SECURITE',intitule:'Assurer, pour 100 % des AT, l’analyse avec le salarié',
  pc:71,smiley:'😐',
  inds:[{lib:'Événements analysés',cle:'auto.analyses',auto:true,unite:'pct',agg:'dernier',sens:'sup',cible:100,
         annee:71,pc:71,trims:[{t:1,cumul:60,pc:60},{t:2,cumul:71,pc:71},{t:3,cumul:null,pc:null},{t:4,cumul:null,pc:null}]}],
  trims:[{t:1,pc:60,smiley:'😐',calcule:'😐',force:false,commentaire:''},
         {t:2,pc:71,smiley:'😐',calcule:'😐',force:false,commentaire:'Deux analyses de mai encore à finaliser.'},
         {t:3,pc:null,smiley:'',calcule:'',force:false,commentaire:''},
         {t:4,pc:null,smiley:'',calcule:'',force:false,commentaire:''}]},
 {id:'o3',num:'12',domaine:'ENVIRONNEMENT',intitule:'100 % des chantiers équipés de bacs de rétention',
  pc:80,smiley:'🙂',
  inds:[{lib:'Bacs de rétention distribués',cle:'',auto:false,unite:'nb',agg:'somme',sens:'sup',cible:20,
         annee:8,pc:80,trims:[{t:1,cumul:3,pc:60},{t:2,cumul:8,pc:80},{t:3,cumul:null,pc:null},{t:4,cumul:null,pc:null}]},
        {lib:'Non-conformités relevées',cle:'',auto:false,unite:'nb',agg:'somme',sens:'inf',cible:0,
         annee:2,pc:0,trims:[{t:1,cumul:0,pc:100},{t:2,cumul:2,pc:0},{t:3,cumul:null,pc:null},{t:4,cumul:null,pc:null}]}],
  trims:[{t:1,pc:80,smiley:'🙂',calcule:'🙂',force:false,commentaire:''},
         {t:2,pc:40,smiley:'😐',calcule:'😟',force:true,commentaire:'2 NC sur un même chantier, traitées depuis.'},
         {t:3,pc:null,smiley:'',calcule:'',force:false,commentaire:''},
         {t:4,pc:null,smiley:'',calcule:'',force:false,commentaire:''}]},
 {id:'o4',num:'7',domaine:'SECURITE',intitule:'Réaliser 1 Plan Interne d’Urgence pour le dépôt et 1 exercice incendie',
  pc:null,smiley:'',texte:'- Existence du PUI (Oui/Non)\n- Exercice réalisé (Oui/Non)',inds:[],
  trims:[{t:1,pc:null,smiley:'😐',calcule:'',force:true,commentaire:''},
         {t:2,pc:null,smiley:'🙂',calcule:'',force:true,commentaire:'Trame du PUI rédigée, exercice prévu en septembre.'},
         {t:3,pc:null,smiley:'',calcule:'',force:false,commentaire:''},
         {t:4,pc:null,smiley:'',calcule:'',force:false,commentaire:''}]}
]};
/* démo : ventilation par agence du reporting */
DEMO_REP.agences=[{code:'IDF',lib:'Agence CDES Île-de-France'},
                  {code:'NA',lib:'Agence CDES Nouvelle-Aquitaine'},
                  {code:'BPL',lib:'Agence CDES Bretagne – Pays de la Loire'}];
(function(){
  const part=(f,g)=>({
    mois:DEMO_REP.mois.map(m=>{const o={k:m.k};
      Object.keys(m).forEach(c=>{if(c!=='k')o[c]=Math.round((Number(m[c])||0)*f)});return o}),
    remontees:DEMO_REP.remontees?Object.assign({},DEMO_REP.remontees,{
      total:Math.round(DEMO_REP.remontees.total*f),sd:Math.round(DEMO_REP.remontees.sd*f),
      bp:Math.round(DEMO_REP.remontees.bp*f),traitees:Math.round(DEMO_REP.remontees.traitees*f),
      parMois:DEMO_REP.remontees.parMois.map(x=>({k:x.k,v:x.n,n:Math.round(x.n*f)})),
      sdParMois:DEMO_REP.remontees.sdParMois.map(x=>({k:x.k,n:Math.round(x.n*f)}))}):null,
    zones:g?DEMO_REP.zones:null,
    dernierArret:g?DEMO_REP.dernierArret:null});
  DEMO_REP.parAgence={IDF:part(.62,true),NA:part(.24,false),BPL:part(.14,false)};
  DEMO_REP.nonReparti={mois:[],remontees:null,zones:null,dernierArret:null};
})();

const DEMO_QHP={objPart:80,mois:(function(){const out=[];const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-11);
  const nb=[6,8,7,9,5,8,10,7,9,8,6,7],part=[62,71,68,80,55,74,83,69,81,77,60,72];
  for(let i=0;i<12;i++){out.push({k:d.toISOString().slice(0,7),nb:nb[i],part:part[i],vus:Math.round(part[i]*1.16),eff:116});d.setMonth(d.getMonth()+1)}
  return out})(),agences:[{a:'IDF',vus:78,eff:106,pc:74},{a:'NA',vus:3,eff:4,pc:75},{a:'BPL',vus:5,eff:7,pc:71}]};

/* ==================== ÉTAT ==================== */
let state={outils:[],kpi:{},kpiMaj:{},tombOutils:{},modeop:[],tombModeop:{},arrivants:[]};
/* `lecture` = mot de passe de consultation tapé par l'utilisateur, `deverrouille`
   = cet appareil l'a déjà fait valider par le serveur. Ni l'un ni l'autre ne
   voyage dans la page ou dans config.js : ils vivent dans CE navigateur. */
let conf={webhook:'',secret:'',appareil:'',autoSync:true,affHSE:false,lecture:'',deverrouille:false,deverrouilleLe:'',expireJours:30,partage:false};
/* V28 — LES LIENS DE BRANCHEMENT DES OUTILS. Règle du service HSE : un seul mot de
   passe pour les collaborateurs, celui de l'intranet. Une fois le verrou passé,
   le serveur envoie les liens « …/#config=… » des outils (prêt, QHP, PDP…) et la
   page les pose sur les tuiles : l'outil s'ouvre déjà branché, personne ne tape
   rien. Ces liens contiennent des secrets : ils vivent EN MÉMOIRE seulement —
   jamais dans localStorage — et s'effacent quand on verrouille l'appareil. */
let liensOutils={};
function lienOutil(o){if(o&&o.id==='repapp')return 'hse.html';   // V3.3.4 : le Reporting fait partie du dépôt (l'ancien dépôt Reporting-HSE est abandonné)
  const l=liensOutils&&liensOutils[o.id];return (typeof l==='string'&&/^https:\/\//.test(l))?l:(o.url||'')}
let qhpAuto=null, repAuto=null, objAuto=null, tuileEnCours=null;
let periode='annee', moisChoisi='';
/* '' = Global (toutes agences confondues) */
let agenceChoisie='';

function load(){
  try{const r=localStorage.getItem(LS);if(r){const s=JSON.parse(r);if(s&&typeof s==='object')state=Object.assign(state,s)}}catch(e){}
  try{const c=JSON.parse(localStorage.getItem('ihse_cache_v1')||'null');if(c){if(c.qhp&&Array.isArray(c.qhp.mois))qhpAuto=c.qhp;if(c.obj)objAuto=c.obj;if(c.rep&&Array.isArray(c.rep.mois))repAuto=c.rep}}catch(e){}   // V3.3.2
  if(!Array.isArray(state.outils))state.outils=[];
  if(!state.kpi)state.kpi={};if(!state.kpiMaj)state.kpiMaj={};if(!state.tombOutils)state.tombOutils={};
  if(!Array.isArray(state.modeop))state.modeop=[];if(!state.tombModeop)state.tombModeop={};
  // outils retirés du système par décision : on les efface partout, une bonne fois
  // fusion des outils par défaut : on ajoute ceux qui manquent, sans écraser
  completerDefauts();
  state.outils.forEach(o=>{if(!Array.isArray(o.links))o.links=[];o.hse=(o.hse===true||o.hse==='oui')});
  try{const c=localStorage.getItem(LS_CONF);if(c)conf=Object.assign(conf,JSON.parse(c))}catch(e){}
  if(conf.periode)periode=conf.periode;
  if(conf.moisChoisi)moisChoisi=conf.moisChoisi;}
/* Les tuiles livrées AVEC la page. Une nouvelle version peut en ajouter (le prêt
   de matériel, septembre 2026) ; le serveur, lui, ne connaît que celles qui y ont
   déjà été synchronisées. Sans ce rappel après chaque synchro, une tuile toute
   neuve s'afficherait à l'ouverture puis disparaîtrait dès que les données
   arrivent. Une tuile supprimée exprès (pierre tombale) ne revient jamais. */
function completerDefauts(){
  DEF_OUTILS.forEach(d=>{
    if(state.outils.some(o=>o.id===d.id)||state.tombOutils[d.id])return;
    state.outils.push(JSON.parse(JSON.stringify(d)));
  });
  /* La tuile « Modes opératoires » devient « Banque documentaire » : elle
     accueille aussi les flashs. On ne renomme que si elle porte encore son nom
     d'origine — un nom choisi par le service HSE n'est jamais écrasé. */
  const bq=state.outils.find(o=>o.id==='modeop');
  if(bq&&bq.nom==='Modes opératoires'){
    bq.nom='Banque documentaire';bq.ico='📚';
    bq.desc='Flashs Santé-Sécurité et modes opératoires, cherchables par mot clé';
    bq.maj=nowISO();
  }
}
function save(){try{localStorage.setItem(LS,JSON.stringify(state))}catch(e){}}
function saveConfLS(){try{localStorage.setItem(LS_CONF,JSON.stringify(conf))}catch(e){}}
function webhookLecture(){return conf.webhook||CONFIG.WEBHOOK_URL||''}
function demoMode(){return !webhookLecture()&&!Object.keys(state.kpi).length}
/* Les actions saisies dans le Reporting (écran Santé & Environnement) priment sur
   la valeur tapée dans Réglages : elles sont comptées côté serveur, par agence. */
function kpiVal(cle){
  const r=repData();
  if(r&&r.autres&&r.autres[cle]!==undefined)return r.autres[cle];
  if(state.kpi[cle]!==undefined&&state.kpi[cle]!=='')return state.kpi[cle];
  return demoMode()?DEMO[cle]:undefined}
function qhpData(){if(qhpAuto&&Array.isArray(qhpAuto.mois))return qhpAuto;return demoMode()?DEMO_QHP:null}
/* Vue du reporting selon l'agence choisie. Le serveur envoie le global ET la
   ventilation ; on n'a qu'à piocher. Une agence sans données renvoie une vue
   vide plutôt que le global, sinon on lirait les chiffres d'une autre agence. */
function repGlobal(){return repAuto||(demoMode()?DEMO_REP:null)}
function repData(){
  const g=repGlobal();
  if(!g||!agenceChoisie)return g;
  const v=g.parAgence&&g.parAgence[agenceChoisie];
  return v?Object.assign({},g,v):{mois:[],remontees:null,zones:null,dernierArret:null};
}
/* Les trois agences sont une constante de l'entreprise : la bascule doit être là
   même si le serveur n'a pas encore renvoyé de ventilation, sinon elle disparaît
   sans dire pourquoi et on croit que la fonction n'existe pas. */
const AGENCES_CDES=[{code:'IDF',lib:'Agence CDES Île-de-France'},
                    {code:'NA', lib:'Agence CDES Nouvelle-Aquitaine'},
                    {code:'BPL',lib:'Agence CDES Bretagne – Pays de la Loire'}];
function agencesDispo(){const g=repGlobal();return (g&&Array.isArray(g.agences)&&g.agences.length)?g.agences:AGENCES_CDES}
/* le serveur ventile-t-il vraiment ? (Apps Script V17 ou plus) */
function ventilationDispo(){const g=repGlobal();return !!(g&&g.parAgence)}
function setAgence(a){agenceChoisie=a;conf.agence=a;saveConfLS();renderDash();renderEssentiels();majBascule();
  if(typeof arrivFiltre!=='undefined'){arrivFiltre.agence=a||'';if(document.getElementById('v-arriv').classList.contains('active'))renderArrivants()}
  try{if(document.getElementById('v-retex').classList.contains('active')&&typeof renderRetex==='function')renderRetex();}catch(e){}
  try{if(document.getElementById('v-rem').classList.contains('active'))renderRemontees();if(document.getElementById('v-hse').classList.contains('active'))renderTodo()}catch(e){}
}
function objData(){return objAuto||(demoMode()?DEMO_OBJ:null)}
/* Les mois exploitables : dès qu'une seule donnée du mois est renseignée.
   On ne se limite plus aux heures travaillées, sinon le sélecteur de mois
   reste vide tant que la paie n'a pas été saisie. */
const CHAMPS_MOIS=['heures','effectif','accArret','accSans','benins','trajet','joursArret','mp',
                   'vigiAtt','vigiRecu','qhpEff','qhpPart','vms','accueils','visites','formations','prets'];
function repMoisRemplis(){
  const r=repData();
  if(!r||!Array.isArray(r.mois))return [];
  const avecDonnees=r.mois.filter(m=>CHAMPS_MOIS.some(c=>Number(m[c])>0));
  return avecDonnees.length?avecDonnees:r.mois;
}
/* la liste proposée dans le menu déroulant : les mois connus, et à défaut
   les mois de l'année en cours jusqu'à aujourd'hui — le menu existe toujours */
function moisProposables(){
  const l=repMoisRemplis();
  if(l.length)return l;
  const out=[],d=new Date(),an=d.getFullYear();
  for(let i=0;i<=d.getMonth();i++)out.push({k:an+'-'+String(i+1).padStart(2,'0')});
  return out;
}
function moisLabel(k){return MOIS_L[Number(String(k).slice(5,7))-1]||k}
function setPeriode(p){periode=p;conf.periode=p;saveConfLS();renderDash()}
function setMois(k){
  if(!k){setPeriode('annee');return}          // « Choisir un mois… » = retour à l'année
  moisChoisi=k;conf.moisChoisi=k;
  periode='mois';conf.periode='mois';
  saveConfLS();renderDash();
}
/* la ligne du mois affiché : celui choisi, sinon le dernier mois rempli */
function ligneMois(rows){
  if(!rows||!rows.length)return null;
  if(moisChoisi){const m=rows.find(x=>x.k===moisChoisi);if(m)return m}
  return rows[rows.length-1];
}
/* état visuel de la bascule + liste des mois disponibles */
/* bascule d'agence, à côté de Mois / Année */
function majAgences(){
  const box=document.getElementById('pg-agences');if(!box)return;
  const l=agencesDispo();
  if(!l.length){box.innerHTML='';box.style.display='none';return}
  box.style.display='';
  box.innerHTML='<button'+(agenceChoisie?'':' class="on"')+' onclick="setAgence(\'\')">Global</button>'+
    l.map(a=>'<button'+(agenceChoisie===a.code?' class="on"':'')+' onclick="setAgence(\''+a.code+'\')" title="'+esc(a.lib||a.code)+'">'+esc(a.code)+'</button>').join('');
}

function majBascule(){
  majAgences();
  const bm=document.getElementById('pg-mois'),ba=document.getElementById('pg-annee'),sel=document.getElementById('pg-choixmois');
  if(!bm||!ba)return;
  bm.className=(periode==='mois')?'on':'';
  ba.className=(periode==='annee')?'on':'';
  if(!sel)return;
  const rows=moisProposables();
  if(!rows.length){sel.style.display='none';return}
  const courant=(periode==='mois')?(ligneMois(rows)||{}).k:'';
  sel.innerHTML='<option value="">📅 Choisir un mois…</option>'+
    rows.map(m=>'<option value="'+m.k+'"'+(m.k===courant?' selected':'')+'>'+esc(moisLabel(m.k))+'</option>').join('');
  sel.style.display='';
  sel.classList.toggle('inactif',periode!=='mois');
}

/* ==================== NAVIGATION ==================== */
function go(v){
  if((v==='v-hse'||v==='v-reglages')&&!estEditeur())v='v-hub';   // la zone HSE et les réglages n'existent que pour l'éditeur (V3.3.2)
  document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));document.getElementById(v).classList.add('active');
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.id==='nav-'+v.replace(/^v-/,'')));
  if(v==='v-hub'){renderTiles();renderDash()}
  if(v==='v-reglages')renderReglages();
  if(v==='v-modeop'){renderBanque();if(!banque.charge&&!banque.enCours)chargerBanque(false)}
  if(v==='v-arriv')renderArrivants();
  if(v==='v-rem'&&typeof renderRemontees==='function')renderRemontees();
  if(v==='v-qhp'&&typeof renderQhp==='function')renderQhp();
  if(v==='v-retex'&&typeof renderRetex==='function'){retexVue.id=null;renderRetex()}
  if(v==='v-hse'&&typeof renderTodo==='function')renderTodo();
  document.body.classList.remove('menuopen');
  majNav();
  window.scrollTo(0,0)}
/* V3 — barre de navigation : l'entrée HSE n'apparaît qu'avec le code éditeur */
function majNav(){
  const ed=estEditeur();
  const b=document.getElementById('nav-hse');if(b)b.style.display=ed?'':'none';
  const r=document.getElementById('nav-reglages');if(r)r.style.display=ed?'':'none';       // V3.3.2 : plus de ⚙️ pour un lecteur
  document.body.classList.toggle('est-editeur',ed);
  const v=document.getElementById('apropos-volet');if(v)v.textContent='Intranet HSE CDES · '+APP_VERSION;
  const c=document.getElementById('opt-partage-volet');if(c)c.checked=!!conf.partage;
}
/* V3.3.4 — ZONE HSE en briques (terrain.js ▸ renderTodo). Le Reporting n'est plus
   affiché dans un cadre : il s'ouvre dans son propre onglet (hse.html), où il retrouve
   seul le code éditeur de cet appareil (même adresse, même stockage local). */
/* ==================== PORTAIL ==================== */
const ICONES={'pretmat':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="10" height="8" rx="1.5"/><path d="M3 12.5h10M8 9V6.5"/><g stroke="#C25A08"><path d="M16 9.5h4.5M18.5 7.5l2 2-2 2"/><path d="M20.5 15.5H16M18 13.5l-2 2 2 2"/></g></svg>','pdp':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V3.5h6V5"/><g stroke="#C25A08"><path d="M9 13.5l2.3 2.3L16 11"/></g></svg>','pae':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8l4 4V20.5H6z"/><path d="M14 3.5V8h4"/><g stroke="#C25A08"><path d="M10 17c0-3.2 2.2-5 5-5 0 3.2-2.2 5-5 5zM10 17c1-1.6 2.4-2.8 4-3.4"/></g></svg>','paq':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8l4 4V20.5H6z"/><path d="M14 3.5V8h4"/><g stroke="#C25A08"><path d="M12.5 13.5c1.3 0 2-.7 3-.7s1.7.7 3 .7c0 3-1.4 4.8-3 5.5-1.6-.7-3-2.5-3-5.5z"/></g></svg>','vigiminute':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7"/><path d="M12 6.5V4M10 3.5h4"/><g stroke="#C25A08"><path d="M12 13.5l3.2-2.4"/></g></svg>','vms':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="2.6"/><path d="M4.5 19c0-3 2-4.8 4.5-4.8S13.5 16 13.5 19"/><circle cx="16" cy="9" r="2"/><path d="M15.5 14.5c2.4 0 4 1.6 4 4.1"/><g stroke="#C25A08"><path d="M15.6 17.7l1.3 1.3 2.3-2.4"/></g></svg>','crhse':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h12v17H6z"/><path d="M9 8h6M9 11.5h6"/><g stroke="#C25A08"><path d="M12.5 18.5l5.5-5.5 1.8 1.8-5.5 5.5-2.3.5z"/></g></svg>','emargement':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h12v8.5H9.5L6 16.5v-3H4z"/><g stroke="#C25A08"><path d="M13 19.5c1.4-1.8 2.6.9 4.6-1M19 12.5l1.5 1.5"/></g></svg>','accueilsecu':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.5" cy="7.5" r="3"/><path d="M4 20c0-3.6 2.4-5.6 5.5-5.6 1 0 1.9.2 2.7.6"/><g stroke="#C25A08"><path d="M14.5 14.2c1 0 1.6-.6 2.4-.6s1.4.6 2.4.6c0 2.6-1.1 4.2-2.4 4.8-1.3-.6-2.4-2.2-2.4-4.8z"/></g></svg>','fformation':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="11" rx="1.8"/><path d="M12 16v3M8.5 19h7"/><circle cx="9" cy="9.3" r="1.7"/><path d="M6.2 13.5c.5-1.4 1.6-2 2.8-2s2.3.6 2.8 2"/><g stroke="#C25A08"><path d="M14.8 9.6l1.4 1.4 2.4-2.5"/></g></svg>','autoconduite':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15.5V10h6l1.5 3v2.5"/><circle cx="6.5" cy="18" r="1.7"/><circle cx="11" cy="18" r="1.7"/><path d="M15 8v8.5M15 16.5h4.5"/><g stroke="#C25A08"><path d="M17 6.5l1.3 1.3 2.3-2.4"/></g></svg>','retex':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M17.5 3.5l.3 3 3-.3"/><g stroke="#C25A08"><path d="M12.8 7.5l-3 5h2.6l-1.6 4 4.6-5.8h-2.7l2-3.2z"/></g></svg>','analyseacc':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5L21 19.5H3z"/><g stroke="#C25A08"><path d="M12 10v4M12 16.6v.01"/></g></svg>','planning':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="14" rx="1.8"/><path d="M4 10.5h16M8.5 4v4M15.5 4v4"/><g stroke="#C25A08"><path d="M9.5 15l2 2 3.5-3.5"/></g></svg>','suiviqhp':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5h15M7.5 19.5v-5M11.5 19.5v-9M15.5 19.5v-7"/><g stroke="#C25A08"><circle cx="17.5" cy="7" r="2.6"/><path d="M16.5 7l.8.8 1.4-1.5"/></g></svg>','suivivigi':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12.5c2.4-3.8 5.6-5.7 8.5-5.7s6.1 1.9 8.5 5.7c-2.4 3.8-5.6 5.7-8.5 5.7s-6.1-1.9-8.5-5.7z"/><g stroke="#C25A08"><path d="M7.5 14.5l2.8-2.8 1.9 1.9 4-4M16.2 9.6h2.4v2.4"/></g></svg>','reporting':'<svg viewBox="0 0 24 24" fill="none" stroke="#1F6FB2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="1.8"/><path d="M4 9.5h16M9.5 9.5V20"/><g stroke="#C25A08"><rect x="13" y="13" width="4" height="4" rx=".8" fill="#C25A08" stroke="none"/></g></svg>'};
function outilsTries(){return state.outils.filter(o=>!o.supprime).sort((a,b)=>(a.ordre||0)-(b.ordre||0))}
function iconeHtml(o){const s=ICONES[o.id];return '<span class="ti'+(s?'':' emo')+'">'+(s||esc(o.ico||'🧰'))+'</span>'}
const CAT_COUL={'Pour évaluer les risques':'#C25A08','Pour prévenir les risques':'#1F6FB2','Pour sensibiliser les nouveaux arrivants':'#158A52','Culture HSE':'#7A4FC0','Outils service HSE':'#2E86C8'};
function tuileHtml(o){
  if(o.id==='modeop')return '<div class="tile" onclick="go(\'v-modeop\')" title="Banque documentaire — flashs et modes opératoires">'+iconeHtml(o)+'<span class="tn">'+esc(o.nom)+'</span></div>'
  if(o.id==='retex')return '<div class="tile" onclick="go(\'v-retex\')" title="RETEX de fin de chantier">'+iconeHtml(o)+'<span class="tn">'+esc(o.nom)+'</span></div>'   // V3.3.3;
  const liens=(o.links||[]).filter(l=>l&&l.u);
  if(liens.length)return '<div class="tile menu" onclick="openLiens(\''+o.id+'\')" title="'+esc(o.nom)+'">'+iconeHtml(o)+'<span class="tn">'+esc(o.nom)+'</span><span class="men">▾ '+liens.length+'</span></div>';
  const u=lienOutil(o);   // V28 : le lien de branchement reçu du serveur l'emporte sur l'adresse nue
  if(u)return '<a class="tile'+(u!==o.url?' branche':'')+'" href="'+esc(u)+'" target="_blank" rel="noopener" title="'+esc(o.nom)+(u!==o.url?' — s’ouvre déjà branché':'')+'">'+iconeHtml(o)+'<span class="tn">'+esc(o.nom)+'</span></a>';
  return '<div class="tile off" onclick="tuileSansLien(\''+o.id+'\')" title="Lien à renseigner dans Réglages ▸ Outils du portail">'+iconeHtml(o)+'<span class="tn">'+esc(o.nom)+'</span></div>'}
/* ==================== CERTIFICATION MASE ====================
 * Note d'audit, période de validité, certificat et synoptique : tout est
 * paramétrable depuis les Réglages du Reporting (une fois par an). */
const MASE_LOGO='img/mase_logo.png';
const MASE_CERT='img/mase_certificat.jpg';
const MASE_AXES=[
  {k:'mase.ax1',l:'Engagement de la direction',d:80.0},
  {k:'mase.ax2',l:'Compétences et qualifications',d:76.9},
  {k:'mase.ax3',l:'Organisation du travail',d:77.7},
  {k:'mase.ax4',l:'Efficacité du système de management',d:78.6},
  {k:'mase.ax5',l:'Bilan et amélioration continue',d:77.8}];
function maseVal(cle,defaut){
  const v=kpiVal(cle);
  return (v===undefined||v===''||isNaN(Number(v)))?defaut:Number(v);
}
function maseTexte(cle,defaut){
  const v=kpiVal(cle);
  return (v===undefined||v==='')?defaut:String(v);
}
/* synoptique : le pentagone des 5 axes de l'audit, dessiné à la volée */
function synoptiqueMase(taille,avecTextes){
  const W=avecTextes?Math.round(taille*1.9):taille, H=taille;
  const R=avecTextes?(H/2-54):(taille/2-10), cx=W/2, cy=H/2+(avecTextes?6:0);
  const axes=MASE_AXES.map(a=>({l:a.l,v:maseVal(a.k,a.d)}));
  const n=axes.length, ang=i=>(-Math.PI/2)+i*2*Math.PI/n;
  const pt=(i,f)=>[cx+Math.cos(ang(i))*R*f, cy+Math.sin(ang(i))*R*f];
  let g='';
  [0.25,0.5,0.75,1].forEach(f=>{
    g+='<polygon points="'+axes.map((_,i)=>pt(i,f).map(v=>v.toFixed(1)).join(',')).join(' ')+
       '" fill="none" stroke="rgba(31,111,178,'+(f===1?'.45':'.20')+')"/>';
  });
  axes.forEach((_,i)=>{const p=pt(i,1);g+='<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="rgba(31,111,178,.20)"/>'});
  const pts=axes.map((a,i)=>pt(i,Math.max(0,Math.min(100,a.v))/100).map(v=>v.toFixed(1)).join(',')).join(' ');
  g+='<polygon points="'+pts+'" fill="rgba(46,134,200,.22)" stroke="#1F6FB2" stroke-width="2.4" stroke-linejoin="round"/>';
  axes.forEach((a,i)=>{const p=pt(i,Math.max(0,Math.min(100,a.v))/100);
    g+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4" fill="#1F6FB2"/>'});
  if(avecTextes){
    axes.forEach((a,i)=>{
      const p=pt(i,1.16), an=ang(i);
      const anc=Math.abs(Math.cos(an))<0.25?'middle':(Math.cos(an)>0?'start':'end');
      g+='<text x="'+p[0].toFixed(1)+'" y="'+p[1].toFixed(1)+'" text-anchor="'+anc+'" font-size="11.5" style="fill:#4c6379">'+
         esc(a.l.length>30?a.l.slice(0,29)+'…':a.l)+'</text>';
      g+='<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+15).toFixed(1)+'" text-anchor="'+anc+'" font-size="12.5" font-weight="700" style="fill:#1F6FB2">'+
         String(a.v).replace('.',',')+' %</text>';
    });
  }
  return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" height="100%" role="img" aria-label="Synoptique de l’audit MASE">'+g+'</svg>';
}
function carteMase(){
  const note=maseVal('mase.avancement',78.2);
  const agence=maseTexte('mase.agence','Île-de-France');
  const deb=maseTexte('mase.debut','2026-06-05'), fin=maseTexte('mase.fin','2027-06-04');
  const num=maseTexte('mase.num','N 2026-1066');
  const bon=note>=70;
  let h='<div class="kpi mase">';
  h+='<img class="mase-logo" src="'+MASE_LOGO+'" alt="MASE Île-de-France Normandie Centre">';
  h+='<div class="mase-note '+(bon?'ok':'mid')+'">'+String(note).replace('.',',')+'<span>%</span></div>';
  h+='<div class="l">Note obtenue à l’audit MASE'+(agence?' — '+esc(agence):'')+'</div>';
  h+='<div class="mase-dates">Certifié du <b>'+esc(frDate(deb))+'</b> au <b>'+esc(frDate(fin))+'</b>'+
     (num?'<br><span class="hint">certificat '+esc(num)+'</span>':'')+'</div>';
  h+='<div class="mase-vign">'+
     '<button onclick="zoomMase(\'cert\')" title="Voir le certificat"><img src="'+MASE_CERT+'" alt="Certificat MASE"><span>Certificat</span></button>'+
     '<button onclick="zoomMase(\'syn\')" title="Voir le synoptique de l’audit"><span class="syn">'+synoptiqueMase(150,false)+'</span><span>Synoptique</span></button>'+
     '</div></div>';
  return h;
}
function zoomMase(quoi){
  const b=document.getElementById('m-zoom-corps');
  if(quoi==='cert'){
    const u=kpiVal('mase.certUrl');
    b.innerHTML='<img src="'+MASE_CERT+'" alt="Certificat MASE" style="width:100%;border-radius:12px">'+
      (u&&/^https?:\/\//i.test(String(u))?'<p style="text-align:center;margin-top:10px"><a class="btn btn-ghost btn-sm" href="'+esc(String(u))+'" target="_blank" rel="noopener">Ouvrir le PDF ↗</a></p>':'');
  }else{
    b.innerHTML='<h3 style="text-align:center;margin-bottom:6px">Synoptique de l’audit — total '+String(maseVal('mase.avancement',78.2)).replace('.',',')+' %</h3>'+
      '<div style="max-width:720px;margin:0 auto">'+synoptiqueMase(430,true)+'</div>';
  }
  document.getElementById('m-zoom').classList.add('open');
}

/* ==================== BANQUE DOCUMENTAIRE ====================
 * Deux sources, une seule liste et une seule recherche :
 *  · les documents déposés dans les dossiers Drive « Flashs Santé-Sécurité »
 *    et « Modes opératoires » — le catalogue se fait tout seul, personne ne
 *    remplit de fiche ;
 *  · les liens saisis à la main (OneDrive, SharePoint…), comme avant.
 * La recherche porte sur le titre, le NOM DU FICHIER, les mots-clés, la
 * famille et l'activité. Au bout d'un instant, elle interroge en plus le
 * CONTENU des documents : Drive sait lire le texte des PDF, même scannés. */
const BQ_FAMILLES={flash:{lib:'Flash Santé-Sécurité',court:'Flashs',ico:'📣'},
                   modeop:{lib:'Mode opératoire',court:'Modes opératoires',ico:'📘'}};
/* Le code couleur des flashs, celui des supports eux-mêmes. */
const BQ_TYPES={ataa:{lib:'AT avec arrêt',c:'#C22B22'},atsa:{lib:'AT sans arrêt',c:'#C25A08'},
                presqu:{lib:'Presqu’accident',c:'#C25A08'},sd:{lib:'Situation dangereuse',c:'#B4720A'},
                prev:{lib:'Prévention',c:'#1F6FB2'},env:{lib:'Environnement',c:'#158A52'},
                /* V3.3.7 : types de la convention CDES servis par la Banque V3 (BP, RETEX AT) */
                bp:{lib:'Bonne pratique',c:'#158A52'},at:{lib:'Accident du travail',c:'#C25A08'}};
const DEMO_BANQUE=[
 {id:'f1',famille:'flash',type:'ataa',titre:'Écrasement de la main lors d’un levage',date:'2026-07',fichier:'2026-07 FLASH ATAA - Ecrasement de la main lors d un levage.pdf',url:'#',mots:'levage, main, élingue'},
 {id:'f2',famille:'flash',type:'prev',titre:'Règle qui sauve n°2 — opérations de levage',date:'2026-05',fichier:'2026-05 FLASH RQS2 - Operations de levage.pdf',url:'#',mots:'ligne de tir'},
 {id:'f3',famille:'flash',type:'env',titre:'Stockage des produits chimiques',date:'2026-03',fichier:'2026-03 FLASH ENV - Stockage des produits chimiques.pdf',url:'#',mots:'rétention'},
 {id:'f4',famille:'flash',type:'presqu',titre:'Chute à l’eau — fret fluvial',date:'2026-02',fichier:'2026-02 FLASH PAT - Chute a l eau fret fluvial.pdf',url:'#',mots:''},
 {id:'m1',famille:'modeop',activite:'Dragage',titre:'Dragage mécanique en canal — pelle sur ponton',date:'2026-04-12',fichier:'MO EXE - Dragage mecanique en canal - Ind A.pdf',url:'#',mots:''},
 {id:'m2',famille:'modeop',activite:'Faucardage',titre:'Faucardage des berges — Truxor',date:'2026-03-05',fichier:'MO EXE - Faucardage des berges Truxor - Ind B.pdf',url:'#',mots:''},
 {id:'m3',famille:'modeop',activite:'Battage de pieux',titre:'Battage de pieux métalliques',date:'2026-08-01',fichier:'MO EXE - Battage de pieux metalliques - Ind A.pdf',url:'#',mots:'vibrofonceur'}];

let banque={docs:[],charge:false,enCours:false,erreur:'',erreurs:[],quand:''};
let bqTexte={q:'',ids:{},cherche:false};
let bqFiltre={fam:'modeop',sec:'',an:''};   // V3.5 : l'écran Documents = les modes opératoires ; les flashs sont dans l'Espace QHP
let bqTimer=null;

function banqueUrl(){return CONFIG.BANQUE_URL||''}

/* Les liens saisis à la main rejoignent la même liste que les documents Drive :
   pour celui qui cherche, un document est un document. */
function banqueManuels(){
  return (state.modeop||[]).filter(m=>!m.supprime).map(m=>({
    id:m.id,famille:'modeop',type:'',activite:m.activite||'',titre:m.titre||'',
    date:String(m.date||''),fichier:'',url:m.url||'',mots:m.note||'',ext:'lien',manuel:true}));
}
function banqueData(){
  const auto=banque.docs||[];
  const man=banqueManuels();
  /* Les exemples ne servent qu'avant tout branchement : dès que le service a
     répondu, ses dossiers font foi — même s'ils sont vides. */
  if(!auto.length&&!man.length&&!banque.charge&&demoMode())return DEMO_BANQUE.slice();
  return auto.concat(man);
}

async function chargerBanque(force){
  if(!banqueUrl()||banque.enCours)return;
  banque.enCours=true;banque.erreur='';
  if(force)renderBanque();
  try{
    const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),60000);
    const r=await fetch(banqueUrl(),{method:'POST',redirect:'follow',signal:ctrl.signal,
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action:force?'scan':'catalogue'})});
    clearTimeout(t);
    const j=JSON.parse(await r.text());
    if(!j.ok)throw new Error(j.erreur||'Erreur du service');
    banque.docs=(j.data&&j.data.docs)||[];
    banque.erreurs=(j.data&&j.data.erreurs)||[];
    banque.quand=j.heure||nowISO();banque.charge=true;
    banque.texteDispo=!(j.data&&j.data.texteDispo===false);           // Banque V3 (SharePoint) : pas de recherche dans le texte
  }catch(e){
    banque.erreur=(e&&e.name==='AbortError')?'Le service de la banque ne répond pas (délai dépassé)'
      :('Banque injoignable — '+(e&&e.message||'vérifie l’adresse dans config.js'));
  }finally{banque.enCours=false;renderBanque();
    try{if(document.getElementById('v-qhp').classList.contains('active')&&typeof renderQhp==='function')renderQhp()}catch(e){}}
}
/* ---------- V3.5 — RECHERCHE IA (flashs et modes opératoires) ----------
   La page envoie la question et la liste des titres qu'elle a (rien de nominatif) ;
   le serveur de l'intranet interroge l'IA avec sa propre clé et rend les documents
   choisis, dans l'ordre, avec une courte raison. */
/* V3.9.4 — l'IA traduit la question en mots du métier ; la page cherche elle-même (OU entre les mots,
   classés par nombre de mots trouvés). Une centaine de jetons par question : plus d'erreur 413. */
async function iaMots(q){const r=await appelRetente({action:'ia-mots',appareil:conf.appareil||'appareil',data:{q:q}},60000);return {mots:(r&&r.mots)||[],cache:!!(r&&r.cache)}}
function iaClasser(docs,mots,foinDe){
  const ms=mots.map(m=>bqNet(m)).filter(Boolean);
  return docs.map(d=>{const foin=foinDe(d);let n=0;ms.forEach(m=>{if(bqCorrespond([m],foin))n++});return n?{d,n}:null}).filter(Boolean)
    .sort((a,b)=>b.n-a.n||String(b.d.date||'').localeCompare(String(a.d.date||''))).map(x=>Object.assign({},x.d,{_ia:x.n+' mot'+(x.n>1?'s':'')+' sur '+ms.length}));
}
async function rechercheIA(q,docs){
  return appelRetente({action:'recherche-ia',appareil:conf.appareil||'appareil',data:{q:q,
    docs:docs.map(d=>({i:d.id,t:d.titre||d.fichier||'',y:bqTypeLib(d),s:d.secteur||'',d:String(d.date||'').slice(0,10),m:d.mots||''}))}},75000);
}
let bqIA={q:'',ids:[],pq:{},enCours:false,err:''};
/* V3.9 — le petit chronomètre des recherches IA (« recherche en cours… 12 s ») */
let chronoIA=null;
function chronoIATick(){const els=document.querySelectorAll('[data-chrono]');if(!els.length){clearInterval(chronoIA);chronoIA=null;return}els.forEach(el=>{el.textContent=Math.round((Date.now()-Number(el.dataset.chrono||Date.now()))/1000)+' s'})}
function chronoIAStart(){if(!chronoIA)chronoIA=setInterval(chronoIATick,1000)}
async function bqLancerIA(){
  const q=((document.getElementById('bq-q')||{}).value||'').trim();
  if(q.length<3){toast('Écris d’abord ta question (3 lettres au moins)',true);return}
  bqIA={q:q,ids:[],pq:{},mots:[],enCours:true,err:'',debut:Date.now()};renderBanque();chronoIAStart();
  try{const r=await iaMots(q);bqIA.mots=r.mots;bqIA.cache=r.cache;bqIA.duree=Math.round((Date.now()-bqIA.debut)/1000);if(!r.mots.length)bqIA.err='l’IA n’a pas compris la question'}
  catch(e){bqIA.err=e.message||'erreur'}
  finally{bqIA.enCours=false;renderBanque()}
}
function bqFinIA(){bqIA={q:'',ids:[],pq:{},mots:[],enCours:false,err:''};const i=document.getElementById('bq-q');if(i)i.value='';bqTexte={q:'',ids:{},cherche:false};renderBanque()}
function rafraichirBanque(){bqTexte={q:'',ids:{},cherche:false};chargerBanque(true)}

/* Recherche dans le CONTENU : on ne dérange le serveur qu'après une petite
   pause de frappe, et seulement à partir de trois lettres. */
function bqChercheTexte(q){
  if(bqTimer)clearTimeout(bqTimer);
  const t=String(q||'').trim();
  if(t.length<3||!banqueUrl()||banque.texteDispo===false){bqTexte={q:'',ids:{},cherche:false};return}
  if(bqTexte.q===t)return;
  bqTimer=setTimeout(async()=>{
    bqTexte={q:t,ids:{},cherche:true};renderBanque();
    try{
      const r=await fetch(banqueUrl(),{method:'POST',redirect:'follow',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({action:'texte',q:t})});
      const j=JSON.parse(await r.text());
      const ids={};
      if(j.ok&&j.data&&Array.isArray(j.data.ids))j.data.ids.forEach(id=>{ids[id]=1});
      if(bqTexte.q===t){bqTexte.ids=ids;bqTexte.cherche=false;renderBanque()}
    }catch(e){if(bqTexte.q===t){bqTexte.cherche=false;renderBanque()}}
  },600);
}
function bqSaisie(){
  const q=(document.getElementById('bq-q')||{}).value||'';
  bqChercheTexte(q);renderBanque();
}
function bqSetFam(f){bqFiltre.fam=f;bqFiltre.sec='';renderBanque()}
function bqSetSec(v){bqFiltre.sec=v;renderBanque()}
function bqSetAn(v){bqFiltre.an=v;renderBanque()}

/* V3.9 — RECHERCHE ÉLARGIE : un mot proche compte comme le mot lui-même. Trois élargissements,
   sans IA, instantanés : (1) les SYNONYMES du métier (chute à l'eau ↔ noyade, gilet, ponton…) ;
   (2) la RACINE du mot (gilets → gilet, élingues → elingu) ; (3) une FAUTE d'une lettre
   (biodiversité / biodiverstié). Le même moteur sert la banque documentaire et les flashs. */
const SYNONYMES=[
  ['chute a l eau','noyade','gilet','gilet de sauvetage','ponton','homme a la mer','berge','passerelle','eau'],
  ['levage','elingue','elinguage','grue','charge suspendue','treuil','palonnier','manutention mecanique'],
  ['chaleur','canicule','forte chaleur','coup de chaleur','hydratation','soleil','ete'],
  ['froid','grand froid','gel','verglas','hypothermie','hiver'],
  ['electricite','electrique','ligne electrique','arc electrique','consignation','haute tension'],
  ['bruit','sonore','protection auditive','bouchons','casque anti bruit'],
  ['epi','equipement de protection','casque','gants','lunettes','chaussures de securite','harnais','gilet'],
  ['travail en hauteur','hauteur','echelle','echafaudage','harnais','garde corps','chute de hauteur','nacelle'],
  ['engin','pelle','chargeuse','excavatrice','conduite d engin','vigie','angle mort','recul'],
  ['circulation','pieton','coactivite','plan de circulation','manoeuvre','angle mort','gilet haute visibilite'],
  ['amiante','poussiere','silice','fibres','masque','ffp'],
  ['produit chimique','chimique','fds','hydrocarbure','carburant','deversement','pollution','gasoil','huile'],
  ['incendie','feu','extincteur','explosion','atex','point chaud','permis feu'],
  ['biodiversite','environnement','faune','flore','especes','nature','dechets','tri','protegee','nidification'],
  ['bateau','navire','barge','pousseur','marinier','embarcation','navigation','fluvial','amarrage','bollard','cordage','aussiere','ecluse'],
  ['drague','dragage','curage','sediments','vase','faucardage','clapet','refoulement'],
  ['atelier','meule','meulage','soudure','soudage','tronconnage','disqueuse','etabli'],
  ['accident','presque accident','incident','blessure','premiers secours','sst','secouriste','trousse'],
  ['tms','troubles musculo','port de charge','posture','dos','manutention manuelle','lombalgie'],
  ['vigiminute','vigi','remontee','situation dangereuse','bonne pratique'],
  ['tempete','vent','orage','intemperie','meteo','crue','inondation','vigilance'],
  ['alcool','drogue','stupefiant','addiction','ethylotest'],
  ['sous traitant','sous traitance','plan de prevention','pdp','protocole','coactivite','entreprise exterieure'],
  ['vehicule','conduite','route','trajet','ceinture','telephone au volant','somnolence','permis']];
/* V3.9.4 — les mots creux d'une phrase (« je cherche un flash sur la biodiversité ») ne comptent pas */
const MOTS_CREUX=new Set(('je tu il on nous vous ils cherche cherches recherche voudrais veux aimerais trouve trouver montre montrer donne donner ai as a avoir etre est sont suis '+
  'un une des le la les l du de d au aux et ou mais donc or ni car que qui quoi dont ce cet cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs '+
  'sur sous dans en par pour avec sans chez vers entre contre pas plus moins tres tout tous toute toutes quel quelle quels quelles comment pourquoi quand '+
  'flash flashs flashes document documents doc docs fiche fiches procedure procedures mode modes operatoire operatoires modop modops qhp theme sujet propos concernant '+
  'il y faut faire est ce qu').split(' '));
function bqMots(q){return bqNet(q).split(' ').filter(m=>m&&m.length>=2&&!MOTS_CREUX.has(m))}
function bqRacine(m){m=String(m||'');if(m.length<5)return m;return m.replace(/(aux|eaux|ees|es|s|x|e)$/,'')}
function bqProche(a,b){                       // une faute d'une lettre (ajout, oubli, remplacement ou inversion), mots d'au moins 5 lettres
  if(a===b)return true;if(Math.abs(a.length-b.length)>1||a.length<5)return false;
  let i=0,j=0,d=0;
  while(i<a.length&&j<b.length){
    if(a[i]===b[j]){i++;j++;continue}
    if(++d>1)return false;
    if(a.length>b.length)i++;else if(b.length>a.length)j++;
    else if(a[i]===b[j+1]&&a[i+1]===b[j]){i+=2;j+=2}else{i++;j++}
  }
  return d+(a.length-i)+(b.length-j)<=1;
}
/* les variantes d'un mot tapé : lui-même, sa racine, les synonymes de son groupe */
function bqVariantes(m){
  const out=new Set([m]);const r=bqRacine(m);if(r.length>=4)out.add(r);
  SYNONYMES.forEach(g=>{if(g.some(x=>x===m||(m.length>=4&&(x.indexOf(m)>=0||bqRacine(x)===r))||bqProche(x,m)))g.forEach(x=>out.add(x))});
  return [...out];
}
/* la requête correspond-elle au texte ? rend 0 (non), 1 (mot exact), 2 (par élargissement) */
function bqCorrespond(mots,foin){
  if(!mots.length)return 1;
  if(mots.every(m=>foin.indexOf(m)>=0))return 1;
  const jetons=foin.split(' ');
  const ok=mots.every(m=>bqVariantes(m).some(v=>foin.indexOf(v)>=0)||(m.length>=5&&jetons.some(j=>bqProche(m,j))));
  return ok?2:0;
}
/* ce que la recherche a compris, pour le dire à l'écran : « gilet → noyade, ponton… » */
function bqElargissements(mots){
  return mots.map(m=>{const v=bqVariantes(m).filter(x=>x!==m&&x!==bqRacine(m)).slice(0,5);return v.length?esc(m)+' → '+v.map(esc).join(', '):''}).filter(Boolean).join(' · ');
}
function bqNet(v){return String(v==null?'':v).toLowerCase()
  .replace(/[àâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[îï]/g,'i').replace(/[ôö]/g,'o')
  .replace(/[ûùü]/g,'u').replace(/ç/g,'c').replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim()}
/* Le filtre « secteur » : pour un flash, le secteur servi par la Banque V3 (Général ·
   Fret fluvial · Bathymétrie · Atelier) ; sans lui, le type. Pour un mode opératoire,
   le domaine. Le TYPE d'un flash reste la pastille de couleur. */
function bqSecond(d){return d.famille==='flash'?(d.secteur||(BQ_TYPES[d.type]?BQ_TYPES[d.type].lib:'Non typé'))
                                               :(d.activite||'Général')}
function bqTypeLib(d){return d.famille==='flash'?(BQ_TYPES[d.type]?BQ_TYPES[d.type].lib:'Flash'):(d.activite||'Mode opératoire')}
function bqCouleur(d){return d.famille==='flash'?((BQ_TYPES[d.type]||{}).c||'#7b8fa3'):'#1F6FB2'}
/* « 2026-07 » se lit « juil. 2026 » ; une date complète garde son jour. */
function bqDate(d){
  const s=String(d||'');if(!s)return '';
  if(/^\d{4}-\d{2}$/.test(s)){const dd=new Date(s+'-01T00:00');return isNaN(dd)?s:MOIS_S[dd.getMonth()]+' '+dd.getFullYear()}
  if(/^\d{4}$/.test(s))return s;
  return frDate(s.slice(0,10))}

function renderBanque(){
  const box=document.getElementById('bq-liste');if(!box)return;
  const tous=banqueData();
  const mots=bqMots((document.getElementById('bq-q')||{}).value||'');

  /* les deux menus déroulants se remplissent avec ce qui existe vraiment */
  const dansFam=tous.filter(d=>!bqFiltre.fam||d.famille===bqFiltre.fam);
  const seconds=[...new Set(dansFam.map(bqSecond))].sort((a,b)=>a.localeCompare(b,'fr'));
  const annees=[...new Set(tous.map(d=>String(d.date||'').slice(0,4)).filter(Boolean))].sort().reverse();
  const selS=document.getElementById('bq-sec');
  if(selS)selS.innerHTML='<option value="">'+(bqFiltre.fam==='flash'?'Tous les secteurs':bqFiltre.fam==='modeop'?'Tous les domaines':'Secteur ou domaine')+'</option>'
    +seconds.map(s=>'<option'+(bqFiltre.sec===s?' selected':'')+'>'+esc(s)+'</option>').join('');
  const selA=document.getElementById('bq-an');
  if(selA)selA.innerHTML='<option value="">Toutes les années</option>'
    +annees.map(a=>'<option'+(bqFiltre.an===a?' selected':'')+'>'+esc(a)+'</option>').join('');
  document.querySelectorAll('.bqfam').forEach(b=>{b.classList.toggle('on',b.dataset.f===bqFiltre.fam)});

  /* V3.5 : résultats de la recherche IA (tant que la question tapée n'a pas changé) */
  const qBrut=((document.getElementById('bq-q')||{}).value||'').trim();
  const iaActive=!!(bqIA.q&&bqIA.q===qBrut&&(bqIA.enCours||(bqIA.mots||[]).length||bqIA.err));
  const foinDe=d=>bqNet([d.titre,d.fichier,d.mots,bqSecond(d),BQ_FAMILLES[d.famille]?BQ_FAMILLES[d.famille].lib:'',d.dossier].join(' '));
  const cadre=tous.filter(d=>{
    if(bqFiltre.fam&&d.famille!==bqFiltre.fam)return false;
    if(bqFiltre.sec&&bqSecond(d)!==bqFiltre.sec)return false;
    if(bqFiltre.an&&String(d.date||'').slice(0,4)!==bqFiltre.an)return false;
    return true});
  let partiel=false;
  const simple=()=>{
    let l=cadre.filter(d=>!mots.length||bqCorrespond(mots,foinDe(d))||!!bqTexte.ids[d.id]);
    if(!l.length&&mots.length>1){partiel=true;l=cadre.filter(d=>mots.some(m=>bqCorrespond([m],foinDe(d))))}   // V3.9.4 : aucun document avec TOUS les mots → ceux qui en ont certains
    return l.map(d=>{const foin=foinDe(d);const c=mots.length?(partiel?(mots.filter(m=>bqCorrespond([m],foin)).length?2:0):bqCorrespond(mots,foin)):1;
      return Object.assign({},d,{_texte:!c,_elargi:c===2,_n:partiel?mots.filter(m=>bqCorrespond([m],foin)).length:0})})};
  const list=((iaActive&&!bqIA.err&&!bqIA.enCours)?iaClasser(cadre,bqIA.mots,foinDe):simple()).sort((a,b)=>(b._n||0)-(a._n||0)||((a._texte?2:a._elargi?1:0)-(b._texte?2:b._elargi?1:0))
    ||String(b.date||'').localeCompare(String(a.date||''))
    ||String(a.titre||'').localeCompare(String(b.titre||''),'fr'));

  let h='';
  if(iaActive)h+='<div class="ia-band">✨ Recherche IA : « '+esc(bqIA.q)+' »'+(bqIA.enCours?' — <i>l’IA réfléchit… <span data-chrono="'+(bqIA.debut||0)+'">0 s</span></i>':bqIA.err?' — ⚠️ '+esc(bqIA.err)+' <i>(résultats de la recherche simple ci-dessous)</i>':' → <b>'+bqIA.mots.map(esc).join('</b>, <b>')+'</b> — '+list.length+' document'+(list.length>1?'s':'')+(bqIA.cache?' <span class="muted">(réponse mémorisée)</span>':bqIA.duree?' <span class="muted">('+bqIA.duree+' s)</span>':''))+' <button class="btn btn-ghost btn-sm" onclick="bqFinIA()">✕ Effacer</button></div>';
  else if(partiel)h+='<p class="hint">🔎 Aucun document ne contient tous ces mots : voici ceux qui en contiennent certains, les plus complets d’abord.</p>';
  else if(mots.length&&list.some(d=>d._elargi)){const el=bqElargissements(mots);if(el)h+='<p class="hint">🔎 Recherche élargie : '+el+'</p>'}
  if(banque.erreur)h+='<div class="secempty" style="border-color:rgba(194,43,34,.4);color:#C22B22">⚠️ '+esc(banque.erreur)+'</div>';
  else if(!banqueUrl())h+='<div class="secempty">🔌 La banque n’est pas encore branchée : l’adresse du service se colle une seule fois dans le fichier <b>config.js</b>, ligne <b>BANQUE_URL</b>. En attendant, seuls les liens ajoutés à la main s’affichent ici.</div>';
  (banque.erreurs||[]).forEach(e=>{h+='<div class="secempty" style="margin-top:8px">⚠️ '+esc(e)+'</div>'});

  if(!list.length){
    h+='<div class="secempty" style="margin-top:10px">📚 '+(tous.length
      ?'Aucun document ne correspond à cette recherche.'
      :'La banque est vide. Dépose un PDF dans le dossier « Flashs Santé-Sécurité » ou « Modes opératoires » : il apparaîtra ici tout seul.')+'</div>';
    box.innerHTML=h;majCompteurBanque(0,tous.length);return;
  }
  h+='<div class="bqlist">';
  list.forEach(d=>{
    const coul=bqCouleur(d),fam=BQ_FAMILLES[d.famille]||{lib:'Document',ico:'📄'};
    const lien=(d.url&&d.url!=='#')
      ?'<a class="btn btn-primary btn-sm" href="'+esc(d.url)+'" target="_blank" rel="noopener">Ouvrir ↗</a>'
      :'<span class="hint">lien à renseigner</span>';
    const src=d.srcUrl?'<a class="btn btn-ghost btn-sm" href="'+esc(d.srcUrl)+'" target="_blank" rel="noopener" title="Fichier modifiable">'+esc((d.srcExt||'source').toUpperCase())+' ↗</a>':'';
    const edit=d.manuel?'<button class="btn btn-ghost btn-sm edit-mo" onclick="openMO(\''+esc(d.id)+'\')" title="Modifier ce lien">✏️</button>':'';
    const meta=[bqDate(d.date),
                d.fichier||(d.manuel?'lien externe':''),
                d.ko?Math.max(1,Math.round(d.ko/1024*10)/10)+' Mo':''].filter(Boolean);
    h+='<div class="bqdoc" style="border-left-color:'+coul+'">'+
       '<div class="bqmain">'+
         '<div class="bqbadges"><span class="bqb" style="background:'+coul+'">'+esc(bqTypeLib(d))+'</span>'+
         (d.famille==='flash'&&d.secteur&&d.secteur!=='Général'?'<span class="bqf">'+esc(d.secteur)+'</span>':'')+
         '<span class="bqf">'+fam.ico+' '+esc(fam.lib)+'</span>'+
         (d._texte?'<span class="bqf bqtxt">📄 trouvé dans le texte</span>':'')+'</div>'+
         '<div class="bqt">'+esc(d.titre||d.fichier||'Sans titre')+'</div>'+
         (d._ia?'<div class="bqia">✨ '+esc(d._ia)+'</div>':'')+
         '<div class="bqm">'+esc(meta.join(' · '))+(d.mots?' · <i>'+esc(d.mots)+'</i>':'')+'</div>'+
       '</div><div class="bqact">'+lien+src+edit+'</div></div>';
  });
  h+='</div>';
  if(bqTexte.cherche)h+='<p class="hint">⏳ Recherche dans le texte des documents…</p>';
  box.innerHTML=h;
  document.querySelectorAll('.edit-mo').forEach(b=>{b.style.display=estEditeur()?'':'none'});
  majCompteurBanque(list.length,tous.length);
}
function majCompteurBanque(n,total){
  const el=document.getElementById('bq-compte');if(!el)return;
  const quand=banque.quand?' · catalogue du '+new Date(banque.quand).toLocaleString('fr-FR').slice(0,16):'';
  el.textContent=(n===total?total+' document'+(total>1?'s':''):n+' document'+(n>1?'s':'')+' sur '+total)+quand;
}

/* --- liens saisis à la main : inchangé, sauf qu'ils vivent dans la banque --- */
let moEnCours=null;
function openMO(id){
  if(!estEditeur()){toast('Seul un appareil éditeur peut modifier la banque',true);return}
  moEnCours=id||null;
  const m=id?(state.modeop||[]).find(x=>x.id===id):null;
  document.getElementById('mo-titre').textContent=m?'Modifier le lien':'Ajouter un lien externe';
  document.getElementById('mo-f-act').value=m?(m.activite||''):'';
  document.getElementById('mo-f-titre').value=m?(m.titre||''):'';
  document.getElementById('mo-f-date').value=m?String(m.date||'').slice(0,10):'';
  document.getElementById('mo-f-url').value=m?(m.url||''):'';
  document.getElementById('mo-f-note').value=m?(m.note||''):'';
  document.getElementById('mo-del').style.display=id?'':'none';
  document.getElementById('m-mo').classList.add('open');
}
function saveMO(){
  const act=document.getElementById('mo-f-act').value.trim();
  const titre=document.getElementById('mo-f-titre').value.trim();
  const url=document.getElementById('mo-f-url').value.trim();
  if(!act||!titre||!url){toast('Activité, titre et lien sont obligatoires',true);return}
  let m=moEnCours?state.modeop.find(x=>x.id===moEnCours):null;
  if(!m){m={id:'mo'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)};state.modeop.push(m)}
  m.activite=act;m.titre=titre;m.url=url;
  m.date=document.getElementById('mo-f-date').value||'';
  m.note=document.getElementById('mo-f-note').value.trim();
  m.maj=nowISO();
  save();closeModal();renderBanque();toast('Enregistré ✓');syncAuto();
}
function supprMO(){
  if(!moEnCours)return;
  const m=state.modeop.find(x=>x.id===moEnCours);
  if(!confirm('Retirer « '+(m?m.titre:'')+' » de la banque ?\nLe document lui-même n’est pas touché.'))return;
  state.tombModeop[moEnCours]=nowISO();
  state.modeop=state.modeop.filter(x=>x.id!==moEnCours);
  save();closeModal();renderBanque();toast('Retiré de la banque');syncAuto();
}

function estEditeur(){return !!(conf.webhook&&conf.secret)}

function renderTiles(){
  majNav();
  const term=(document.getElementById('t-search').value||'').toLowerCase();
  const box=document.getElementById('tiles-box');
  const correspond=o=>(o.nom+' '+(o.desc||'')).toLowerCase().includes(term);
  const cats=[...CATS];outilsTries().forEach(o=>{if(o.cat&&!cats.includes(o.cat))cats.push(o.cat)});
  let h='';
  cats.filter(c=>c!==CAT_HSE).forEach(cat=>{
    const list=outilsTries().filter(o=>!o.masque&&!o.hse&&(o.cat||'Culture HSE')===cat&&correspond(o));
    if(!list.length)return;
    const coul=CAT_COUL[cat]||'#8fa6bd';
    h+='<div class="rub"><div class="rt" style="color:'+coul+'"><span class="dot" style="background:'+coul+'"></span><span class="rtxt">'+esc(cat)+'</span></div><div class="rtiles">';
    list.forEach(o=>{h+=tuileHtml(o)});
    h+='</div></div>'});
  // la case service HSE vit en bas, juste au-dessus de sa section — V3.3.2 : ÉDITEUR SEULEMENT
  // (un lecteur ne voit ni la case ni les tuiles ; le serveur V29.5 ne lui envoie d'ailleurs ni les tuiles HSE ni leurs liens)
  if(estEditeur())h+='<label class="hsetoggle no-print" title="Afficher les outils utilisés par le service HSE"><input type="checkbox" id="t-hse" '+(conf.affHSE?'checked':'')+' onchange="setAffHSE(this.checked)"> 🛠<span class="htxt"> Outils du service HSE</span></label>';
  if(estEditeur()&&conf.affHSE){
    const list=outilsTries().filter(o=>!o.masque&&(o.hse||(o.cat||'')===CAT_HSE)&&correspond(o));
    if(list.length){
      h+='<div class="rub"><div class="rt" style="color:'+CAT_COUL[CAT_HSE]+'"><span class="dot" style="background:'+CAT_COUL[CAT_HSE]+'"></span><span class="rtxt">'+esc(CAT_HSE)+'</span></div><div class="rtiles">';
      list.forEach(o=>{h+=tuileHtml(o)});
      h+='</div></div>'}}
  box.innerHTML=h||'<div class="empty"><div class="big">🧰</div>Aucun outil ne correspond.</div>'}
function setAffHSE(v){if(!estEditeur())return;conf.affHSE=!!v;saveConfLS();renderTiles()}
function basculerVolet(){
  if(window.innerWidth<=920){document.body.classList.toggle('menuopen');return}
  document.body.classList.toggle('voletReduit');
  conf.voletReduit=document.body.classList.contains('voletReduit');saveConfLS()}
function openLiens(id){
  const o=state.outils.find(x=>x.id===id);if(!o)return;
  if(o.hse&&!estEditeur())return;
  const liens=(o.links||[]).filter(l=>l&&l.u);
  document.getElementById('ml-titre').textContent=o.nom;
  document.getElementById('ml-sous').textContent=o.desc||'';
  document.getElementById('ml-list').innerHTML=liens.map(l=>'<a class="btn btn-primary btn-block lienbtn" href="'+esc(l.u)+'" target="_blank" rel="noopener" onclick="closeModal()">'+esc(l.t||l.u)+'</a>').join('')
    ||'<p class="hint">Aucun lien pour le moment — ajoute-les dans Réglages ▸ Outils du portail.</p>';
  document.getElementById('m-liens').classList.add('open')}
function tuileSansLien(id){toast('Lien pas encore renseigné — Réglages ▸ Outils du portail',true)}

/* ==================== DASHBOARD ==================== */
function fmtKpi(def,v){
  if(v===undefined||v===null||v==='')return '—';
  if(def.type==='pct')return Math.round(Number(v))+'<span style="font-size:60%"> %</span>';
  if(def.type==='date')return esc(frDate(String(v)));
  if(def.type==='txt')return esc(String(v));
  const n=Number(v);return isNaN(n)?esc(String(v)):n.toLocaleString('fr-FR')}
function classeKpi(def,v){
  if(v===undefined||v===null||v==='')return '';
  const n=Number(v);
  if(def.bonSi&&!isNaN(n))return def.bonSi(n)?'good':'mid';
  if(def.mauvaisSi&&!isNaN(n))return def.mauvaisSi(n)?'bad':'good';
  return ''}
function gauge(pc,cls){
  const C=2*Math.PI*34, p=Math.max(0,Math.min(100,Number(pc)||0))/100;
  return '<svg class="gauge" viewBox="0 0 84 84" role="img" aria-label="'+Math.round(pc)+' %">'+
    '<circle class="gbg" cx="42" cy="42" r="34"/>'+
    '<circle class="gfg '+cls+'" cx="42" cy="42" r="34" stroke-dasharray="'+(C*p).toFixed(1)+' '+C.toFixed(1)+'"/>'+
    '<text x="42" y="48" font-size="22" text-anchor="middle" fill="#14283e">'+Math.round(pc)+'<tspan font-size="11" fill="#5c7188"> %</tspan></text></svg>'}
function classeGauge(k){return k==='good'?'c-ok':k==='bad'?'c-bad':k==='mid'?'c-mid':'c-neutre'}
function kpiTile(def){
  const v=kpiVal(def.cle);
  const maj=state.kpiMaj[def.cle];
  const k=classeKpi(def,v);
  if(def.type==='pct'&&v!==undefined&&v!==null&&v!==''&&!isNaN(Number(v)))
    return '<div class="kpi '+k+'">'+gauge(Number(v),classeGauge(k))+'<div class="l">'+esc(def.lib)+'</div>'+(maj?'<div class="m">maj '+esc(frDateCourt(maj))+'</div>':'')+'</div>';
  return '<div class="kpi '+k+'">'+
    '<div class="v'+(def.type==='txt'?' txt':'')+'">'+fmtKpi(def,v)+'</div>'+
    '<div class="l">'+esc(def.lib)+'</div>'+
    (maj?'<div class="m">maj '+esc(frDateCourt(maj))+'</div>':'')+'</div>'}
function dernierArret(){const r=repData();const v=(r&&r.dernierArret)||kpiVal('secu.dernierAccident')||'';
  const t=String(v).replace(/^"|"$/g,'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(t)?t:''}
function joursSans(){
  const d=dernierArret();
  if(!d)return null;
  const t=new Date(String(d)+'T00:00');if(isNaN(t))return null;
  return Math.max(0,Math.floor((Date.now()-t.getTime())/86400000))}
function renderDash(){
  majBascule();
  const banner=document.getElementById('dash-banner');
  if(demoMode())banner.innerHTML='<div class="banner">🧪 <b>Données de démonstration.</b> Les vrais chiffres arriveront dès que l’appli <b>Reporting HSE</b> sera branchée — cette page est en consultation seule.</div>';
  else if(!webhookLecture())banner.innerHTML='<div class="banner info">📌 Données enregistrées sur cet appareil uniquement. Branche le webhook (Réglages) pour les partager avec tout le monde.</div>';
  else banner.innerHTML='';
  let h=barreFamilles();
  SECTIONS.filter(sec=>!sec.horsDash).forEach(sec=>{
    h+='<div class="fam" data-fam="'+familleDe(sec.id)+'">';
    h+='<div class="card"><h2>'+sec.ico+' '+esc(sec.titre)+'</h2>';
    h+=vignetteSignificatif(sec.id);
    if(sec.id==='secu'){
      const rep=repData(), rows=repMoisRemplis(), cur=ligneMois(rows);
      h+='<div class="kpis">';
      const dA=dernierArret();
      if(dA)h+='<div class="kpi"><div class="v" style="font-size:23px;line-height:1.25;padding-top:6px">'+esc(frDate(String(dA)))+'</div><div class="l">Date du dernier accident avec arrêt</div><div class="m">🤖 depuis les incidents déclarés</div></div>';
      else h+=kpiTile(KPI_INDEX['secu.dernierAccident']);
      if(rep&&cur){
        const S=k=>rows.reduce((s,m)=>s+(Number(m[k])||0),0);
        const src=(periode==='mois')?cur:{accArret:S('accArret'),accSans:S('accSans'),benins:S('benins'),
          trajet:S('trajet'),joursArret:S('joursArret'),heures:S('heures'),mp:S('mp')};
        const suf=(periode==='mois')?' — '+moisLabel(cur.k):' — année';
        /* Un TF/TG calculé sur un seul mois n'a aucun sens (un accident sur 15 000 h
           donnerait 64). L'usage est le taux CUMULÉ depuis janvier : c'est lui qu'on
           affiche, même quand on regarde un mois en particulier. */
        const jusqua=rows.slice(0,Math.max(0,rows.findIndex(m=>m.k===cur.k))+1);
        const C=k=>jusqua.reduce((s,m)=>s+(Number(m[k])||0),0);
        const tHeures=(periode==='mois')?C('heures'):S('heures');
        const tAcc=(periode==='mois')?C('accArret'):S('accArret');
        const tJours=(periode==='mois')?C('joursArret'):S('joursArret');
        const tSans=(periode==='mois')?C('accSans'):S('accSans');
        const sufT=(periode==='mois')?' — cumulé à fin '+moisLabel(cur.k).toLowerCase():' — année';
        const t=(v,l,cls)=>'<div class="kpi '+(cls||'')+'"><div class="v">'+(v===undefined?'—':Number(v).toLocaleString('fr-FR'))+'</div><div class="l">'+esc(l+suf)+'</div><div class="m">🤖 reporting central</div></div>';
        /* V3.8 : seuils du service HSE — vert = 0, rouge au-delà de 5 AT avec arrêt / 50 jours d'arrêt, orange entre */
        const seuil=(v,r)=>{v=Number(v)||0;return v===0?'good':(v>r?'bad':'moyen')};
        h+=t(src.accArret,'AT avec arrêt',seuil(src.accArret,5));
        h+=t(src.accSans,'AT sans arrêt',seuil(src.accSans,5));
        h+=t(src.benins,'AT bénins / soins',seuil(src.benins,10));
        h+=t(src.trajet,'AT de trajet',seuil(src.trajet,2));
        h+=t(src.joursArret,'Jours d’arrêt',seuil(src.joursArret,50));
        const zn=rep.zones||{};
        if(zn.hipo!==undefined)
          h+='<div class="kpi '+(zn.hipo>0?'bad':'good')+'"><div class="v">'+zn.hipo+'</div><div class="l">Événements à haut potentiel (HIPO) — année</div><div class="m">🤖 fiches d’incident</div></div>';
        const cg=zn.categories;
        if(cg&&(cg.externes>0||zn.total>0))
          h+='<div class="kpi '+(cg.externes>0?'bad':'good')+'"><div class="v">'+(cg.externes||0)+'</div><div class="l">Dont intérimaires / sous-traitants — année</div><div class="m">'+(cg.externes>0?(cg.interim||0)+' intérim · '+(cg.soustraitant||0)+' sous-traitance':'🤖 fiches d’incident')+'</div></div>';
        /* V3.8 : AT des intérimaires (année) + Tf / Tg intérim cumulés quand les heures intérim sont saisies au mensuel.
           Règle du service HSE : 1 AT intérimaire = rouge, 0 = vert. */
        const ipa=(rep.interimParAn||{})[String(cur.k).slice(0,4)]||null;
        const iAcc=ipa?(Number(ipa.accArret)||0):(S('intAccArret')||0), iSans=ipa?(Number(ipa.accSans)||0):(S('intAccSans')||0);
        const iH=(periode==='mois')?C('intHeures'):S('intHeures'), iAccC=(periode==='mois')?C('intAccArret'):S('intAccArret'), iJ=(periode==='mois')?C('intJoursArret'):S('intJoursArret');
        if(rep.interimParAn||iH>0){
          h+='<div class="kpi '+(iAcc>0?'bad':'good')+'"><div class="v">'+iAcc+'</div><div class="l">AT avec arrêt — intérimaires — année</div><div class="m">'+(iSans?iSans+' sans arrêt · ':'')+'🤖 fiches d’incident (catégorie intérimaire)</div></div>';
          if(iH>0){
            h+='<div class="kpi '+(iAccC>0?'bad':'good')+'"><div class="v">'+String((Math.round(iAccC*1e6/iH*10)/10)).replace('.',',')+'</div><div class="l">Tf intérim'+esc(sufT)+'</div><div class="m">'+iH.toLocaleString('fr-FR')+' h intérim</div></div>';
            h+='<div class="kpi '+(iJ>0?'bad':'good')+'"><div class="v">'+String((Math.round(iJ*1000/iH*100)/100)).replace('.',',')+'</div><div class="l">Tg intérim'+esc(sufT)+'</div><div class="m">'+iJ.toLocaleString('fr-FR')+' jour'+(iJ>1?'s':'')+' d’arrêt intérim</div></div>';
          }
        }
        if(tHeures>0){
          h+='<div class="kpi"><div class="v">'+String((Math.round(tAcc*1e6/tHeures*10)/10)).replace('.',',')+'</div><div class="l">Taux de fréquence (TF1)'+esc(sufT)+'</div>'+
             (periode==='mois'?'<div class="m">cumul janvier → '+esc(moisLabel(cur.k).toLowerCase())+'</div>':'')+'</div>';
          h+='<div class="kpi"><div class="v">'+String((Math.round((tAcc+tSans)*1e6/tHeures*10)/10)).replace('.',',')+'</div><div class="l">Taux de fréquence global (TF2)'+esc(sufT)+'</div>'+
             '<div class="m">avec et sans arrêt'+(periode==='mois'?' · cumul janvier → '+esc(moisLabel(cur.k).toLowerCase()):'')+'</div></div>';
          h+='<div class="kpi"><div class="v">'+String((Math.round(tJours*1000/tHeures*100)/100)).replace('.',',')+'</div><div class="l">Taux de gravité (TG)'+esc(sufT)+'</div>'+
             (periode==='mois'?'<div class="m">cumul janvier → '+esc(moisLabel(cur.k).toLowerCase())+'</div>':'')+'</div>'}
        h+='</div>';
        // courbes TF / TG cumulées sur l'année
        let ch=0,cj=0;const tf=[],tg=[];let cum=0;
        rows.forEach(m=>{ch+=Number(m.heures)||0;cj+=Number(m.joursArret)||0;cum+=Number(m.accArret)||0;
          tf.push({k:m.k,v:ch?cum*1e6/ch:0});tg.push({k:m.k,v:ch?cj*1000/ch:0})});
        h+='<div class="duo">'+ligneChart('Taux de fréquence cumulé',tf,1)+ligneChart('Taux de gravité cumulé',tg,2)+'</div>';
      }else{
        sec.kpis.filter(k=>!k.cache&&k.cle!=='secu.dernierAccident').forEach(k=>h+=kpiTile(k));
        const acc=Number(kpiVal('secu.accArret')),heures=Number(kpiVal('secu.heures'));
        if(!isNaN(acc)&&heures>0){const tfv=Math.round(acc*1e6/heures*10)/10;
          h+='<div class="kpi"><div class="v">'+String(tfv).replace('.',',')+'</div><div class="l">Taux de fréquence (TF1)</div><div class="m">'+heures.toLocaleString('fr-FR')+' h travaillées</div></div>'}
        const ja=Number(kpiVal('secu.joursArret'));
        if(!isNaN(ja)&&heures>0){const tgv=Math.round(ja*1000/heures*100)/100;
          h+='<div class="kpi"><div class="v">'+String(tgv).replace('.',',')+'</div><div class="l">Taux de gravité (TG)</div></div>'}
        h+='</div>';
        h+='<p class="hint" style="margin-top:8px">📈 Les courbes mensuelles TF / TG arriveront automatiquement avec le branchement du classeur « Reporting indicateurs SSE » — rien à saisir.</p>'}
      h+=situationsDangereuses();
      h+=zonesLesees();
      h+=tauxAnalyses();
      h+=reglesQuiSauvent();
      h+=actionsCorrectives();
      h+=pyramideBird()}
    else if(sec.id==='qhp'){h+=renderQhpSection()}
    else if(sec.id==='form'){
      const rep=repData(), rows=repMoisRemplis(), cur=ligneMois(rows);
      const avecF=rep&&cur&&rows.some(m=>m.formations!==undefined&&m.formations!=='');
      const avecA=rep&&cur&&rows.some(m=>m.accueils!==undefined&&m.accueils!=='');
      if(avecF||avecA){
        const S=k=>rows.reduce((s,m)=>s+(Number(m[k])||0),0);
        const mois=(periode==='mois');
        const suf=mois?' — '+moisLabel(cur.k):' — année';
        const vF=mois?(Number(cur.formations)||0):S('formations');
        const vA=mois?(Number(cur.accueils)||0):S('accueils');
        const vN=mois?(Number(cur.arrivants)||0):S('arrivants');
        const nSaisi=Number(kpiVal('form.arrivants'));
        const arriv=vN>0?vN:(mois?0:(isNaN(nSaisi)?0:nSaisi));
        h+='<div class="kpis">';
        h+='<div class="kpi"><div class="v">'+vF+'</div><div class="l">Fiches de formation au poste'+esc(suf)+'</div><div class="m">🤖 registre des formations</div></div>';
        h+='<div class="kpi"><div class="v">'+vA+'</div><div class="l">Accueils HSE réalisés'+esc(suf)+'</div><div class="m">🤖 registre des accueils</div></div>';
        if(arriv>0){
          const pc=Math.min(100,Math.round(vA/arriv*100));
          h+='<div class="kpi '+(pc>=100?'good':pc>=80?'mid':'bad')+'">'+gauge(pc,pc>=100?'c-ok':pc>=80?'c-mid':'c-bad')+'<div class="l">Nouveaux arrivants accueillis ('+vA+'/'+arriv+')</div></div>';
        }else h+=kpiTile(KPI_INDEX['form.arrivants']);
        h+='<div class="kpi"><div class="v">'+S('formations')+'</div><div class="l">Fiches réalisées — année</div><div class="m">🤖 registre des formations</div></div>';
        h+='</div>';
        h+='<div class="duo">'+ligneChart('Fiches de formation par mois',rows.map(m=>({k:m.k,v:Number(m.formations)||0})),0)+
              ligneChart('Accueils HSE par mois',rows.map(m=>({k:m.k,v:Number(m.accueils)||0})),0)+'</div>';
      }else{
        h+='<div class="kpis">'+sec.kpis.filter(k=>!k.cache).map(kpiTile).join('')+'</div>';
        h+='<p class="hint" style="margin-top:8px">🤖 Ces compteurs se rempliront tout seuls dès que le collecteur sera branché sur le registre des formations et des accueils.</p>'}}
    else if(sec.id==='pret'){
      const rep=repData(), rows=repMoisRemplis(), cur=ligneMois(rows);
      const vide=v=>v===undefined||v===null||v==='';
      const avecP=!!(rep&&cur&&rows.some(m=>!vide(m.prets)||!vide(m.pretsEnCours)));
      if(avecP){
        const S=k=>rows.reduce((s,m)=>s+(Number(m[k])||0),0);
        const parMois=(periode==='mois');
        const suf=parMois?' — '+moisLabel(cur.k):' — année';
        const dernier=rows[rows.length-1];
        h+='<div class="kpis">';
        h+='<div class="kpi"><div class="v">'+(parMois?(Number(cur.prets)||0):S('prets'))+'</div><div class="l">Prêts de matériel remis'+esc(suf)+'</div><div class="m">🤖 classeur des prêts</div></div>';
        // en vue « année », la tuile du mois EST déjà celle de l'année : pas de doublon
        if(parMois)h+='<div class="kpi"><div class="v">'+S('prets')+'</div><div class="l">Prêts de matériel remis — année</div><div class="m">🤖 classeur des prêts</div></div>';
        /* « encore dehors » est un ÉTAT de fin de mois, jamais un cumul : on prend la
           valeur du mois regardé, on n'additionne pas les mois entre eux. */
        const etat=parMois?cur:dernier;
        const dehors=Number(etat.pretsEnCours)||0;
        h+='<div class="kpi '+(dehors>0?'mid':'good')+'"><div class="v">'+dehors+'</div><div class="l">'+
           (etat===dernier?'Engins actuellement prêtés':'Engins encore dehors fin '+esc(moisLabel(etat.k).toLowerCase()))+
           '</div><div class="m">🤖 classeur des prêts</div></div>';
        h+='</div>';
        h+='<div class="duo">'+
             ligneChart('Prêts remis par mois',rows.map(m=>({k:m.k,v:Number(m.prets)||0})),0)+
             ligneChart('Engins dehors en fin de mois',rows.map(m=>({k:m.k,v:Number(m.pretsEnCours)||0})),0)+
           '</div>';
      }else{
        h+='<div class="kpis">'+sec.kpis.filter(k=>!k.cache).map(kpiTile).join('')+'</div>';
        h+='<p class="hint" style="margin-top:8px">🤝 Ces compteurs se remplissent tout seuls dès que l’outil <b>Prêt de matériel</b> est branché. Un prêt est compté le mois où l’engin est <b>remis</b> ; « actuellement prêtés » compte ceux dont la période de mise à disposition court encore.</p>'}}
    else if(sec.id==='vms'){
      const rep=repData(), rows=repMoisRemplis(), cur=ligneMois(rows);
      if(rep&&cur){
        const tot=rows.reduce((s,m)=>s+(Number(m.vms)||0),0);
        const vm=(periode==='mois')?(Number(cur.vms)||0):tot;
        const suf=(periode==='mois')?' — '+moisLabel(cur.k):' — année';
        h+='<div class="kpis">';
        h+='<div class="kpi"><div class="v">'+vm+'</div><div class="l">VMS réalisées'+esc(suf)+'</div><div class="m">🤖 reporting central</div></div>';
        h+=kpiTile(KPI_INDEX['vms.objMois']);
        h+='<div class="kpi"><div class="v">'+tot+'</div><div class="l">VMS réalisées — année</div><div class="m">🤖 reporting central</div></div>';
        h+='</div>';
        const o=Number(kpiVal('vms.objMois'));
        if(o>0){const mv=Number(cur.vms)||0;const pc=Math.min(100,Math.round(mv/o*100));
          h+='<div class="bar '+(mv>=o?'ok':'warn')+'" style="margin-top:12px"><i style="width:'+pc+'%"></i></div><p class="hint">'+mv+' / '+o+' VMS sur '+esc(moisLabel(cur.k))+' ('+pc+' %)</p>'}
      }else{
        h+='<div class="kpis">'+sec.kpis.filter(k=>!k.cache).map(kpiTile).join('')+'</div>';
        const mv2=Number(kpiVal('vms.mois')),o2=Number(kpiVal('vms.objMois'));
        if(!isNaN(mv2)&&o2>0){const pc=Math.min(100,Math.round(mv2/o2*100));
          h+='<div class="bar '+(mv2>=o2?'ok':'warn')+'" style="margin-top:12px"><i style="width:'+pc+'%"></i></div><p class="hint">'+mv2+' / '+o2+' VMS ce mois ('+pc+' %)</p>'}}}
    else if(sec.id==='vigi'){
      const rep=repData();
      h+='<div class="kpis">';
      const rws=repMoisRemplis(), sAtt=rws.reduce((s,m)=>s+(Number(m.vigiAtt)||0),0), sRec=rws.reduce((s,m)=>s+(Number(m.vigiRecu)||0),0);
      if(sAtt>0){const pcv=Math.round(sRec/sAtt*100);
        h+='<div class="kpi '+(pcv>=80?'good':'bad')+'">'+gauge(pcv,pcv>=80?'c-ok':'c-bad')+'<div class="l">Participation Vigiminutes ('+sRec+'/'+sAtt+') — année</div><div class="m">🤖 reporting central</div></div>'}
      else h+=kpiTile(KPI_INDEX['vigi.tauxHebdo']);
      if(rep&&rep.remontees){
        const r=rep.remontees;
        const pm=(r.parMois||[]);const curM=pm[pm.length-1];
        const nb=(periode==='mois'&&curM)?curM.n:r.total;
        const suf=(periode==='mois'&&curM)?' — '+moisLabel(curM.k):' — année';
        h+='<div class="kpi"><div class="v">'+Number(nb).toLocaleString('fr-FR')+'</div><div class="l">Remontées Vigiminutes'+esc(suf)+'</div><div class="m">🤖 reporting central</div></div>';
        h+='<div class="kpi '+(r.pc>=80?'good':'mid')+'">'+gauge(r.pc,r.pc>=80?'c-ok':'c-mid')+'<div class="l">Remontées traitées ('+r.traitees+'/'+r.total+')</div><div class="m">🤖 reporting central</div></div>';
        if(r.bp!==undefined){
          const bpm=(periode==='mois'&&Array.isArray(r.bpParMois)&&curM)?(r.bpParMois.find(x=>x.k===curM.k)||{n:0}).n:r.bp;
          h+='<div class="kpi good"><div class="v">'+bpm+'</div><div class="l">Bonnes pratiques remontées'+esc(suf)+'</div><div class="m">🤖 classeur Vigiminutes</div></div>'}
        h+='</div>';
        if(r.parType&&r.parType.length){h+='<h3>Répartition des remontées par type — année</h3>'+barresH(r.parType)}
        if(r.parDomaine&&r.parDomaine.length){h+='<h3>Répartition des remontées par domaine — année</h3>'+barresH(r.parDomaine)}
      }else{
        h+=kpiTile(KPI_INDEX['vigi.remontees'])+kpiTile(KPI_INDEX['vigi.traitees'])+'</div>'}}
    else if(sec.id==='env'){
      const rep=repData(), rows=repMoisRemplis(), cur=ligneMois(rows);
      const avecD=rep&&cur&&rows.some(m=>Number(m.dechetsT)>0);
      h+='<div class="kpis">';
      h+=sec.kpis.filter(k=>!k.cache).map(kpiTile).join('');
      if(avecD){
        const S=k=>rows.reduce((s,m)=>s+(Number(m[k])||0),0);
        const mois=(periode==='mois');
        const tonnes=mois?(Number(cur.dechetsT)||0):S('dechetsT');
        const suf=mois?' — '+moisLabel(cur.k):' — année';
        /* la part valorisée est une moyenne PONDÉRÉE par le tonnage : faire la
           moyenne des pourcentages mensuels donnerait le même poids à un mois
           à 2 tonnes qu'à un mois à 40. */
        const src=(mois&&cur)?[cur]:rows;
        let tt=0,tv=0;
        src.forEach(m=>{const t=Number(m.dechetsT)||0,v=Number(m.dechetsVal)||0;if(t>0&&v>0){tt+=t;tv+=t*v/100}});
        const pcv=tt>0?Math.round(tv/tt*100):null;
        h+='<div class="kpi"><div class="v">'+String(Math.round(tonnes*10)/10).replace('.',',')+'</div><div class="l">Tonnage de déchets'+esc(suf)+'</div><div class="m">🤖 reporting central</div></div>';
        if(pcv!==null)h+='<div class="kpi '+(pcv>=70?'good':pcv>=50?'mid':'bad')+'">'+gauge(pcv,pcv>=70?'c-ok':pcv>=50?'c-mid':'c-bad')+'<div class="l">Part valorisée'+esc(suf)+'</div><div class="m">moyenne pondérée par le tonnage</div></div>';
      }
      h+='</div>';
      if(avecD){
        h+='<div class="duo">'+
             ligneChart('Tonnage de déchets par mois',rows.map(m=>({k:m.k,v:Number(m.dechetsT)||0})),1)+
             ligneChart('Part valorisée par mois (%)',rows.map(m=>({k:m.k,v:Number(m.dechetsVal)||0})),0)+
           '</div>';
      }else h+='<p class="hint" style="margin-top:8px">♻️ Le tonnage de déchets et la part valorisée s’afficheront ici dès qu’ils seront saisis mois par mois dans l’appli <b>Reporting HSE</b>.</p>'}
    else if(sec.id==='sante'){
      const rep=repData(), rows=repMoisRemplis(), cur=ligneMois(rows);
      const avecMp=rep&&cur&&rows.some(m=>m.mp!==undefined&&m.mp!=='');
      h+='<div class="kpis">';
      if(avecMp){
        const S=k=>rows.reduce((s,m)=>s+(Number(m[k])||0),0);
        const mois=(periode==='mois');
        const v=mois?(Number(cur.mp)||0):S('mp');
        h+='<div class="kpi '+(v>0?'bad':'good')+'"><div class="v">'+v+'</div><div class="l">Maladies professionnelles déclarées'+esc(mois?' — '+moisLabel(cur.k):' — année')+'</div><div class="m">🤖 reporting central</div></div>';
      }else h+=kpiTile(KPI_INDEX['sante.mp']);
      h+=sec.kpis.filter(k=>!k.cache&&k.cle!=='sante.mp').map(kpiTile).join('');
      h+='</div>'}
    else if(sec.id==='flash'){
      const rep=repData(), rows=repMoisRemplis(), cur=ligneMois(rows);
      h+='<div class="kpis">';
      if(rep&&cur&&rows.some(m=>m.visites!==undefined&&m.visites!=='')){
        const S=k=>rows.reduce((s,m)=>s+(Number(m[k])||0),0);
        const mois=(periode==='mois');
        h+='<div class="kpi"><div class="v">'+(mois?(Number(cur.visites)||0):S('visites'))+'</div><div class="l">CR / observations HSE'+esc(mois?' — '+moisLabel(cur.k):' — année')+'</div><div class="m">🤖 classeur CR Observations HSE</div></div>';
      }
      h+=sec.kpis.filter(k=>!k.cache).map(kpiTile).join('')+'</div>';
      const fl=[{d:'Sécurité',n:kpiVal('flash.securite')},{d:'Santé',n:kpiVal('flash.sante')},{d:'Environnement',n:kpiVal('flash.env')},{d:'RETEX suite AT',n:kpiVal('flash.retex')}];
      if(fl.some(x=>x.n!==undefined&&x.n!==''))h+='<h3>Répartition des flashs par domaine — année</h3>'+barresH(fl)}
    else{h+='<div class="kpis">'+sec.kpis.filter(k=>!k.cache).map(kpiTile).join('')+'</div>';
      if(sec.id==='form')h+='<p class="hint" style="margin-top:8px">📈 L’évolution mensuelle sur l’année arrivera automatiquement avec le branchement du classeur des fiches de formation.</p>'}
    /* le raccourci vers le suivi des nouveaux arrivants s'affiche quelle que soit
       la façon dont la section a été rendue (démo, branché, agence…) */
    if(sec.id==='form')h+=raccourciArrivants();
    h+='</div></div>'});
  h+=carteObjectifs();
  document.getElementById('dash-body').innerHTML=h;
  appliquerFamille();
  renderEssentiels();animerChiffres()}
/* courbe simple (une série) : TF / TG cumulés */
function ligneChart(titre,serie,dec){
  if(!serie.length)return '';
  const W=520,H=150,padL=10,padB=24,padT=18;
  const max=Math.max(...serie.map(p=>p.v),0.001);
  const X=i=>padL+i*((W-padL*2)/Math.max(1,serie.length-1));
  const Y=v=>H-padB-(H-padB-padT)*v/max;
  let pts='',dots='';
  serie.forEach((p,i)=>{pts+=(i?' ':'')+X(i).toFixed(1)+','+Y(p.v).toFixed(1);
    dots+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(p.v).toFixed(1)+'" r="3.5" fill="#1F6FB2"><title>'+esc(moisLabel(p.k))+' : '+String(p.v.toFixed(dec)).replace('.',',')+'</title></circle>';
    if(i===serie.length-1)dots+='<text x="'+X(i).toFixed(1)+'" y="'+(Y(p.v)-9)+'" font-size="12" font-weight="700" text-anchor="end" fill="#14283e">'+String(p.v.toFixed(dec)).replace('.',',')+'</text>';
    dots+='<text x="'+X(i).toFixed(1)+'" y="'+(H-7)+'" font-size="9.5" text-anchor="middle" fill="#5c7188">'+esc(MOIS_S[Number(p.k.slice(5,7))-1].replace('.',''))+'</text>'});
  return '<div class="chart"><svg viewBox="0 0 '+W+' '+H+'">'+
    '<line x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(W-padL)+'" y2="'+(H-padB)+'" stroke="rgba(15,45,80,.18)"/>'+
    '<polyline points="'+pts+'" fill="none" stroke="#1F6FB2" stroke-width="2.2" stroke-linejoin="round" />'+dots+'</svg>'+
    '<p class="hint" style="text-align:center;margin-top:2px">'+esc(titre)+'</p></div>'}
/* barres horizontales : répartition par domaine (couleurs validées mode sombre) */
const DOM_COUL=['#1F6FB2','#C25A08','#7A4FC0','#158A52','#2E86C8'];
function barresH(data){
  const max=Math.max(...data.map(d=>Number(d.n)||0),1);
  return '<div class="hbars">'+data.map((d,i)=>{
    const c=DOM_COUL[i%DOM_COUL.length];
    return '<div class="hb"><span class="hl">'+esc(d.d)+'</span><span class="ht2"><i style="width:'+Math.round((Number(d.n)||0)/max*100)+'%;background:'+c+';box-shadow:0 0 8px '+c+'88"></i></span><span class="hv">'+(d.n===undefined||d.n===''?'—':Number(d.n).toLocaleString('fr-FR'))+'</span></div>'}).join('')+'</div>'}
/* pyramide de Bird : de l'accident à la remontée terrain */
/* =====================================================================
 *  BONHOMME CDES — la silhouette de la fiche d'analyse d'accident,
 *  reprise telle quelle pour la carte des zones lésées (repère 427x1079).
 * =================================================================== */
const BH_IMG='img/bonhomme.png';
const BH_W=427,BH_H=1079;
const BH_POINTS={tete:[212,92],visage:[212,150],cou:[212,207],epaule:[112,245],bras:[56,425],
  main:[55,615],thorax:[212,415],dos:[212,515],hanche:[212,580],jambe:[140,695],
  cheville:[116,953],pied:[92,1040],multiple:[212,700]};
const BH_LIB={tete:'Tête / Arcade',visage:'Visage / Yeux',cou:'Cou / Nuque',epaule:'Épaules',
  bras:'Bras / Coude',main:'Main / Doigts',thorax:'Thorax / Abdomen',dos:'Dos / Lombaires',
  hanche:'Hanche / Bassin',jambe:'Jambe / Genou',cheville:'Cheville',pied:'Pied / Orteils',
  multiple:'Plusieurs zones'};
function bhLib(z){return BH_LIB[z]||z}
function bonhommeCDES(parZone,opts){
  opts=opts||{};const haut=opts.hauteur||360,M=50;
  const VB=(-M)+' -10 '+(BH_W+M*2)+' '+(BH_H+20);
  let marques='';
  Object.keys(parZone||{}).forEach(z=>{
    const nb=parZone[z],p=BH_POINTS[z];
    if(!nb||!p||z==='aucune')return;
    const fort=nb>=2,c=fort?'#1F6FB2':'#2E86C8',r=fort?33:27;
    marques+='<g class="bh-z">'+
      '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(r+14)+'" fill="'+c+'" opacity=".18"/>'+
      '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+r+'" fill="'+c+'" opacity=".95" stroke="#ffffff" stroke-width="5"/>'+
      '<text x="'+p[0]+'" y="'+(p[1]+12)+'" text-anchor="middle" font-size="33" font-weight="700" style="fill:#ffffff" font-family="Barlow Condensed,Arial">'+nb+'</text>'+
      '<title>'+esc(bhLib(z))+' : '+nb+' cas</title></g>';
  });
  return '<svg class="bonhomme" viewBox="'+VB+'" height="'+haut+'" role="img" aria-label="Zones du corps lésées">'+
    '<image href="'+BH_IMG+'" x="0" y="0" width="'+BH_W+'" height="'+BH_H+'"/>'+marques+'</svg>';
}
/* suivi des actions correctives issues des analyses d'accident */
/* part des événements pour lesquels l'analyse (arbre des causes / typologie + cause)
   a effectivement été menée jusqu'au bout dans l'outil d'analyse */
function tauxAnalyses(){
  const rep=repData();const a=rep&&rep.zones&&rep.zones.analyses?rep.zones.analyses:null;
  if(!a||!a.total)return '';
  const ok=a.pc>=90, moyen=a.pc>=60;
  return '<h3 style="margin-top:18px">🔎 Analyse des événements</h3><div class="kpis">'+
    '<div class="kpi '+(ok?'good':moyen?'mid':'bad')+'">'+gauge(a.pc,ok?'c-ok':moyen?'c-mid':'c-bad')+
    '<div class="l">Événements analysés ('+a.faites+'/'+a.total+')</div><div class="m">🤖 fiches d’incident</div></div>'+
    '<div class="kpi"><div class="v">'+(a.total-a.faites)+'</div><div class="l">analyse'+((a.total-a.faites)>1?'s':'')+' encore à mener</div></div>'+
    '</div>'}

function actionsCorrectives(){
  const rep=repData();const a=rep&&rep.zones&&rep.zones.actions?rep.zones.actions:null;
  if(!a||!a.total)return '';
  const ouvertes=a.total-a.faites;
  let h='<h3 style="margin-top:18px">🛠 Actions correctives</h3><div class="kpis">';
  h+='<div class="kpi '+(a.retard?'bad':'good')+'"><div class="v">'+a.retard+'</div><div class="l">en retard</div><div class="m">🤖 fiches d’incident</div></div>';
  h+='<div class="kpi"><div class="v">'+ouvertes+'</div><div class="l">encore ouvertes</div></div>';
  h+='<div class="kpi good"><div class="v">'+a.faites+'</div><div class="l">réalisées</div></div>';
  h+='</div>';
  if(a.prochaines&&a.prochaines.length){
    h+='<div class="tblwrap" style="margin-top:10px"><table class="mini"><thead><tr><th>Action</th><th>Qui</th><th>Échéance</th></tr></thead><tbody>';
    a.prochaines.forEach(x=>{
      h+='<tr'+(x.tard?' class="tard"':'')+'><td>'+esc(x.t)+'</td><td>'+esc(x.q||'—')+'</td>'+
         '<td>'+esc(frDate(String(x.e)))+(x.tard?' ⚠️':'')+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  return h;
}
/* carte « Zones du corps lésées », alimentée par la table INCIDENTS du reporting */
function zonesLesees(){
  const rep=repData();const z=rep&&rep.zones?rep.zones:null;
  if(!z||!z.parZone||!Object.keys(z.parZone).length)
    return '<h3 style="margin-top:18px">🧍 Zones du corps lésées</h3>'+
      '<p class="hint">Elles s’afficheront dès les premiers incidents saisis dans l’appli <b>Reporting HSE</b>.</p>';
  const cles=Object.keys(z.parZone).sort((a,b)=>z.parZone[b]-z.parZone[a]);
  let h='<h3 style="margin-top:18px">🧍 Zones du corps lésées <span class="hint" style="font-weight:400">— '+
    z.blessants+' blessure'+(z.blessants>1?'s':'')+' sur '+z.total+' incident'+(z.total>1?'s':'')+'</span></h3>';
  h+='<div class="zl"><div class="zl-bh">'+bonhommeCDES(z.parZone,{hauteur:330})+
     '<div class="zl-chips">'+cles.map(k=>'<b>'+esc(bhLib(k))+'<em>'+z.parZone[k]+'</em></b>').join('')+'</div></div>';
  h+='<div class="zl-side">';
  if(z.typologies&&z.typologies.length)
    h+='<div class="hint" style="margin-bottom:6px">⚠️ Typologies de risque</div>'+barresH(z.typologies.map(t=>({d:t.d,n:t.n})));
  h+='</div></div>';
  return h;
}
function pyramideBird(){
  const rows=repMoisRemplis();const S=k=>rows.length?rows.reduce((s,m)=>s+(Number(m[k])||0),0):undefined;
  const niveaux=[
    {v:S('accArret')!==undefined?S('accArret'):kpiVal('secu.accArret'),l:'AT avec arrêt',s:'le plus grave',c:'#C22B22'},
    {v:S('accSans')!==undefined?S('accSans'):kpiVal('secu.accSansArret'),l:'AT sans arrêt',s:'soins, pas d’arrêt',c:'#C25A08'},
    {v:S('benins')!==undefined?S('benins'):kpiVal('secu.soins'),l:'AT bénins / soins',s:'petits soins',c:'#B4720A'},
    {v:(repData()&&repData().remontees?repData().remontees.presqu:kpiVal('secu.presqu')),l:'Presqu’accidents',s:'passé tout près',c:'#2E86C8'},
    {v:(repData()&&repData().remontees?repData().remontees.total:kpiVal('vigi.remontees')),l:'Remontées Vigiminutes',s:'signalé avant l’accident',c:'#1F6FB2'}];
  const num=v=>(v===undefined||v===''||isNaN(Number(v)))?null:Number(v);
  const base=num(niveaux[4].v);
  const W=560,HL=44,GAP=7,H=niveaux.length*(HL+GAP)+12;
  let svg='',y=6;
  niveaux.forEach((n,i)=>{
    const wTop=90+i*88, wBot=90+(i+1)*88;
    const x1t=(W-wTop)/2, x2t=x1t+wTop, x1b=(W-wBot)/2, x2b=x1b+wBot;
    const v=num(n.v);
    svg+='<path d="M'+x1t+' '+y+' L'+x2t+' '+y+' L'+x2b+' '+(y+HL)+' L'+x1b+' '+(y+HL)+' Z" fill="'+n.c+'">'+
         '<title>'+esc(n.l)+' : '+(v===null?'—':v)+'</title></path>';
    svg+='<text x="'+(W/2)+'" y="'+(y+HL/2+7)+'" font-size="20" font-weight="800" style="fill:#ffffff" '+
         'text-anchor="middle" font-family="Barlow Condensed,Arial">'+(v===null?'—':v.toLocaleString('fr-FR'))+'</text>';
    y+=HL+GAP});
  let leg='';
  niveaux.forEach(n=>{
    const v=num(n.v);
    const ratio=(base&&v&&v>0&&n.l.indexOf('Remontées')<0)?('1 pour '+Math.round(base/v)+' remontées'):'';
    leg+='<li style="border-left-color:'+n.c+'">'+
         '<span class="bl-v" style="color:'+n.c+'">'+(v===null?'—':v.toLocaleString('fr-FR'))+'</span>'+
         '<span class="bl-t"><b>'+esc(n.l)+'</b><i>'+esc(ratio||n.s)+'</i></span></li>';
  });
  return '<h3 style="margin-top:18px">Pyramide de Bird — de la remontée à l’accident</h3>'+
    '<div class="bird"><div class="bird-svg chart" role="img" aria-label="Pyramide de Bird">'+
    '<svg viewBox="0 0 '+W+' '+H+'">'+svg+'</svg></div><ul class="bird-leg">'+leg+'</ul></div>';
}
/* ---- vignette « point significatif du mois » en tête des encadrés S / S / E ---- */
const SIGNIF={secu:{cle:'secu.note',ico:'🛡️',lib:'Point sécurité significatif',ton:'sig-secu'},
              sante:{cle:'sante.note',ico:'🩺',lib:'Point santé significatif',ton:'sig-sante'},
              env:{cle:'env.note',ico:'🌱',lib:'Point environnement significatif',ton:'sig-env'}};
function vignetteSignificatif(id){
  const d=SIGNIF[id];if(!d)return '';
  const v=kpiVal(d.cle);
  const vide=(v===undefined||v===null||String(v).trim()==='');
  if(vide)return '';
  const corps=esc(String(v));
  return '<div class="signif '+d.ton+'">'+
         '<span class="sig-ico" aria-hidden="true">'+d.ico+'</span>'+
         '<div class="sig-txt"><div class="sig-lib">'+esc(d.lib)+' — '+esc(periode==='mois'&&moisChoisi?moisLabel(moisChoisi):'mois en cours')+'</div>'+
         '<p class="sig-corps">'+corps+'</p></div>'+
         '</div>'}

/* ---- situations dangereuses, tous outils confondus (Vigiminutes + VMS) ----
   Vigiminutes : remontées typées « SD ». VMS : conditions dangereuses (CD) et
   actes dangereux (AD) relevés en visite — les points positifs sont exclus à la
   source par l'appli VMS, ils ne remontent donc jamais ici. */
function sdGlobal(){
  const rep=repData();if(!rep)return null;
  const rows=repMoisRemplis(), mois=(periode==='mois'), cur=ligneMois(rows);
  const src=(mois&&cur)?[cur]:rows;
  const cd=src.reduce((s,m)=>s+(Number(m.vmsCd)||0),0);
  const ad=src.reduce((s,m)=>s+(Number(m.vmsAd)||0),0);
  let vigi=0;
  const r=rep.remontees;
  if(r){
    if(mois&&cur&&Array.isArray(r.sdParMois)){const x=r.sdParMois.find(z=>z.k===cur.k);vigi=x?x.n:0}
    else vigi=Number(r.sd)||0}
  const total=vigi+cd+ad;
  if(!total&&!rows.length)return null;
  return {vigi:vigi,cd:cd,ad:ad,total:total,
          suf:(mois&&cur)?' — '+moisLabel(cur.k):' — année',
          parMois:rows.map(m=>{
            const x=(r&&Array.isArray(r.sdParMois))?r.sdParMois.find(z=>z.k===m.k):null;
            return {k:m.k,v:(x?x.n:0)+(Number(m.vmsCd)||0)+(Number(m.vmsAd)||0)}})}}

function situationsDangereuses(){
  const d=sdGlobal();if(!d)return '';
  let h='<h3 style="margin-top:18px">⚠️ Situations dangereuses — tous outils confondus</h3><div class="kpis">';
  h+='<div class="kpi"><div class="v">'+d.total+'</div><div class="l">Situations dangereuses'+esc(d.suf)+'</div><div class="m">Vigiminutes + VMS</div></div>';
  h+='<div class="kpi"><div class="v">'+d.vigi+'</div><div class="l">dont remontées Vigiminutes</div><div class="m">🤖 classeur Vigiminutes</div></div>';
  h+='<div class="kpi"><div class="v">'+d.cd+'</div><div class="l">dont conditions dangereuses (VMS)</div><div class="m">🤖 classeur VMS</div></div>';
  h+='<div class="kpi"><div class="v">'+d.ad+'</div><div class="l">dont actes dangereux (VMS)</div><div class="m">🤖 classeur VMS</div></div>';
  h+='</div>';
  if(d.parMois.some(x=>x.v>0))
    h+='<div class="duo">'+ligneChart('Situations dangereuses par mois',d.parMois,0)+'</div>';
  return h}

/* ---- répartition des accidents par règle qui sauve ---- */
function reglesQuiSauvent(){
  const rep=repData();const l=rep&&rep.zones&&Array.isArray(rep.zones.rqs)?rep.zones.rqs:[];
  if(!l.length)return '';
  return '<h3 style="margin-top:18px">🛟 Règles qui sauvent concernées</h3>'+barresH(l)+
    '<p class="hint">Une règle qui revient est un signal : c\'est là qu\'il faut remettre de l\'animation.</p>'}

/* ---- objectifs SSE et leur avancement mesuré ----
   Chaque objectif porte des lignes d'indicateur avec une cible annuelle. Les
   valeurs sont saisies mois par mois dans le Reporting ; ici on montre le bilan
   par trimestre, celui du trimestre en cours par défaut. */
const DOM_OBJ={'SECURITE':{ico:'🛡️',lib:'Sécurité',c:'var(--cyan)'},
  'SÉCURITÉ':{ico:'🛡️',lib:'Sécurité',c:'var(--cyan)'},
  'SANTE':{ico:'🩺',lib:'Santé',c:'var(--violet)'},'SANTÉ':{ico:'🩺',lib:'Santé',c:'var(--violet)'},
  'ENVIRONNEMENT':{ico:'🌱',lib:'Environnement',c:'var(--ok)'},
  'CULTURE SSE':{ico:'📣',lib:'Culture SSE',c:'var(--accent)'}};
function trimCourant(){
  const r=repData(), rows=repMoisRemplis();
  const k=(periode==='mois'&&moisChoisi)?moisChoisi:(rows.length?rows[rows.length-1].k:'');
  const m=k?Number(k.slice(5,7)):new Date().getMonth()+1;
  return Math.min(4,Math.max(1,Math.ceil(m/3)))}

function carteObjectifs(){
  const d=objData();
  if(!d||!d.objectifs||!d.objectifs.length)return '';
  const t=trimCourant();
  let h='<div class="card"><h2>🎯 Objectifs SSE '+esc(String(d.annee||''))+'</h2>';
  const chiffres=d.objectifs.filter(o=>o.pc!==null&&o.pc!==undefined);
  h+='<div class="kpis">';
  h+='<div class="kpi"><div class="v">'+d.objectifs.length+'</div><div class="l">Objectifs fixés</div></div>';
  if(chiffres.length){
    const moy=Math.round(chiffres.reduce((s,o)=>s+o.pc,0)/chiffres.length);
    h+='<div class="kpi '+(moy>=100?'good':moy>=75?'mid':'bad')+'">'+gauge(Math.min(100,moy),moy>=100?'c-ok':moy>=75?'c-mid':'c-bad')+'<div class="l">Avancement moyen — T'+t+'</div><div class="m">sur '+chiffres.length+' objectif'+(chiffres.length>1?'s':'')+' chiffré'+(chiffres.length>1?'s':'')+'</div></div>';
    const atteints=chiffres.filter(o=>o.pc>=100).length;
    h+='<div class="kpi good"><div class="v">'+atteints+'</div><div class="l">Objectifs atteints</div></div>';
    const retard=chiffres.filter(o=>o.pc<50).length;
    h+='<div class="kpi '+(retard?'bad':'good')+'"><div class="v">'+retard+'</div><div class="l">En retard</div></div>';
  }
  h+='<div class="kpi"><div class="v">'+(d.objectifs.length-chiffres.length)+'</div><div class="l">Sans avancement mesuré</div><div class="m">appréciés à la main</div></div>';
  h+='</div>';
  let aPoser=0;
  d.objectifs.forEach(o=>(o.inds||[]).forEach(x=>{if(x.cible===null||x.cible===undefined||x.cible==='')aPoser++}));
  if(aPoser)h+='<p class="hint" style="margin-top:10px">🎯 '+aPoser+' indicateur'+(aPoser>1?'s':'')+
    ' attend'+(aPoser>1?'ent leur':' sa')+' cible — sans elle, aucune progression ne peut être calculée.</p>';

  const par={};d.objectifs.forEach(o=>{const k=String(o.domaine||'AUTRE');(par[k]=par[k]||[]).push(o)});
  Object.keys(par).forEach(dom=>{
    const meta=DOM_OBJ[dom]||{ico:'🎯',lib:dom,c:'var(--cyan)'};
    h+='<h3 style="margin-top:18px">'+meta.ico+' '+esc(meta.lib)+'</h3>';
    par[dom].forEach(o=>{
      const q=(o.trims&&o.trims[t-1])||{};
      h+='<div class="objx" style="border-left-color:'+meta.c+'">';
      h+='<div class="ox-h"><span class="ox-n">N°'+esc(String(o.num||''))+'</span>'+
         '<span class="ox-t">'+esc(o.intitule||'')+'</span>'+
         '<span class="ox-s" title="'+esc(q.force?'apprécié à la main':'calculé depuis les indicateurs')+'">'+esc(q.smiley||'·')+(q.force?'<i>✍️</i>':'')+'</span></div>';
      (o.inds||[]).forEach(x=>{
        const qi=(x.trims&&x.trims[t-1])||{};
        const val=qi.cumul, pc=qi.pc, u=x.unite==='pct'?' %':'';
        const sansCible=(x.cible===null||x.cible===undefined||x.cible==='');
        h+='<div class="ox-i"><span class="oi-b">'+(x.auto?'🤖':'✍️')+'</span>'+
           '<span class="oi-l">'+esc(x.lib||'')+'</span>';
        /* Les trois colonnes de droite sont TOUJOURS rendues, même vides : sinon une
           valeur sans cible glisse sous la colonne des pourcentages et se lit « 6 % ». */
        if(val!==null&&val!==undefined)
          h+='<span class="oi-v">'+esc(String(val).replace('.',','))+u+
             (sansCible?'':'<i> / '+(x.sens==='inf'?'≤ ':'')+esc(String(x.cible))+u+'</i>')+'</span>';
        else h+='<span class="oi-v muted">—</span>';
        if(sansCible)
          h+='<span class="oi-bar sans"><em>cible à poser</em></span><span class="oi-pc"></span>';
        else if(pc!==null&&pc!==undefined)
          h+='<span class="oi-bar"><i class="'+(pc>=100?'ok':pc>=75?'mid':'bad')+'" style="width:'+Math.min(100,pc)+'%"></i></span>'+
             '<span class="oi-pc '+(pc>=100?'ok':pc>=75?'mid':'bad')+'">'+pc+' %</span>';
        else
          h+='<span class="oi-bar"></span><span class="oi-pc"></span>';
        h+='</div>';
      });
      if(!(o.inds||[]).length&&o.texte)h+='<p class="hint" style="margin:6px 0 0">📏 '+esc(o.texte)+'</p>';
      if(q.commentaire)h+='<p class="hint" style="margin:6px 0 0">💬 '+esc(q.commentaire)+'</p>';
      h+='</div>';
    });
  });
  h+='<p class="hint" style="margin-top:12px">Bilan au <b>trimestre T'+t+'</b>. Les cibles portent sur l’année : pour les indicateurs qu’on cumule, l’atteinte est mise au prorata des mois déjà saisis.</p>';
  if(d.calculeLe)h+='<div class="majline">calculé le '+esc(new Date(d.calculeLe).toLocaleString('fr-FR'))+'</div>';
  return h+'</div>'}

/* participation QHP calculée depuis le reporting central (colonnes qhpEff / qhpPart),
   quand le classeur de suivi QHP n'est pas branché */
function qhpDepuisReporting(){
  const rows=repMoisRemplis();if(!rows.length)return null;
  const mois=(periode==='mois'), cur=ligneMois(rows);
  const src=mois&&cur?[cur]:rows;
  const eff=src.reduce((s,m)=>s+(Number(m.qhpEff)||0),0);
  const part=src.reduce((s,m)=>s+(Number(m.qhpPart)||0),0);
  if(!eff)return null;
  return {eff:eff,part:part,pc:Math.round(part/eff*100),
          suf:(mois&&cur)?' — '+moisLabel(cur.k):' — année'}}

/* bandeau des chiffres essentiels, tout en haut du hub */
function renderEssentiels(){
  if(typeof renderBulletin==='function'){renderBulletin();return}   // V3.2 : accueil « bulletin HSE » (js/bulletin.js)
  const box=document.getElementById('ess-box');if(!box)return;
  const js=joursSans();
  const q=qhpData();const cur=q?(q.mois[q.mois.length-1]||{}):null;
  let h='';
  if(agenceChoisie){
    const a=agencesDispo().find(x=>x.code===agenceChoisie);
    const nom=esc(a?a.lib:agenceChoisie);
    h+=ventilationDispo()
      ? '<div class="banner info" style="margin-bottom:10px">🏢 Vue <b>'+nom+'</b> — les chiffres ci-dessous ne concernent que cette agence.</div>'
      : '<div class="banner" style="margin-bottom:10px">⚠️ <b>'+nom+'</b> — le serveur ne renvoie pas encore la ventilation par agence. Déploie la <b>nouvelle version</b> du script Apps Script (Déployer ▸ Gérer les déploiements ▸ ✏️ ▸ Nouvelle version), puis synchronise.</div>';
  }
  h+='<div class="kpis" style="margin-bottom:11px">';
  h+='<div class="kpi hero2"><div class="v">'+(js===null?'—':js.toLocaleString('fr-FR'))+'</div><div class="l">jour'+(js>1?'s':'')+' sans accident avec arrêt'+(dernierArret()?' — dernier le '+esc(frDate(String(dernierArret()))):'')+'</div></div>';
  h+='</div><div class="ess">';
  const qVide=q&&q.mois.every(m=>!(m.nb>0));
  const obj=(q&&q.objPart)||Number(kpiVal('qhp.objPart'))||80;
  if(q&&cur&&!qVide)
    h+='<div class="kpi '+(cur.part>=obj?'good':'bad')+'">'+gauge(cur.part||0,cur.part>=obj?'c-ok':'c-bad')+'<div class="l">Participation QHP — obj. '+obj+' %</div><div class="m">'+esc(moisLabel(cur.k))+' · '+(cur.nb||0)+' QHP</div></div>';
  else{
    /* le classeur de suivi QHP n'est pas (encore) branché : on retombe sur les colonnes
       qhpEff / qhpPart du reporting central, qui suffisent à calculer le taux. */
    const r=qhpDepuisReporting();
    if(r)h+='<div class="kpi '+(r.pc>=obj?'good':'bad')+'">'+gauge(r.pc,r.pc>=obj?'c-ok':'c-bad')+'<div class="l">Participation QHP ('+r.part+'/'+r.eff+')'+esc(r.suf)+'</div><div class="m">🤖 reporting central</div></div>';
    else if(q)h+='<div class="kpi"><div class="v">⏳</div><div class="l">Participation QHP</div><div class="m">en attente des premiers QHP saisis dans l’appli de suivi</div></div>';
    else h+='<div class="kpi"><div class="v">—</div><div class="l">Participation QHP</div><div class="m">classeur de suivi QHP pas encore branché</div></div>'}
  const vr=repMoisRemplis(), vAtt=vr.reduce((s,m)=>s+(Number(m.vigiAtt)||0),0), vRec=vr.reduce((s,m)=>s+(Number(m.vigiRecu)||0),0);
  const vp=vAtt>0?Math.round(vRec/vAtt*100):kpiVal('vigi.tauxHebdo');
  if(vp!==undefined&&vp!==''&&!isNaN(Number(vp)))h+='<div class="kpi '+(Number(vp)>=80?'good':'bad')+'">'+gauge(Number(vp),Number(vp)>=80?'c-ok':'c-bad')+'<div class="l">Participation Vigiminutes'+(vAtt>0?' ('+vRec+'/'+vAtt+')':'')+'</div>'+(vAtt>0?'<div class="m">🤖 reporting central</div>':'')+'</div>';
  else h+='<div class="kpi"><div class="v">—</div><div class="l">Participation Vigiminutes</div></div>';
  h+=carteMase();
  h+='</div>';
  box.innerHTML=h}

/* petit compteur animé sur les nombres entiers */
function animerChiffres(){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('#v-hub .kpi .v').forEach(el=>{
    const t=el.textContent.trim();
    if(!/^[\d\u202f\u00a0 ]+$/.test(t))return;
    const fin=Number(t.replace(/[\u202f\u00a0 ]/g,''));
    if(!isFinite(fin)||fin<=1)return;
    const d0=performance.now(),dur=600;
    (function pas(now){
      const p=Math.min(1,((now||performance.now())-d0)/dur), e=1-Math.pow(1-p,3);
      el.textContent=Math.round(fin*e).toLocaleString('fr-FR');
      if(p<1)requestAnimationFrame(pas);else el.textContent=fin.toLocaleString('fr-FR');
    })(d0)})}
/* ---- section QHP (auto) ---- */
function renderQhpSection(){
  const q=qhpData();
  if(!q)return '<div class="secempty">📡 Les indicateurs QHP se calculent automatiquement depuis le classeur du suivi QHP.<br>Côté Apps Script « Intranet HSE », renseigne la propriété <code>QHP_SHEET_ID</code> puis branche le webhook : rien à saisir à la main.</div>';
  if(q.mois.every(m=>!(m.nb>0)))return '<div class="secempty">⏳ Branché et prêt — les chiffres apparaîtront dès les premiers QHP saisis dans l’appli « Suivi des QHP ».</div>';
  const cur=q.mois[q.mois.length-1]||{};
  const okp=cur.part>=q.objPart;
  let h='<div class="kpis">';
  h+='<div class="kpi"><div class="v">'+(cur.nb??'—')+'</div><div class="l">QHP réalisés ce mois</div></div>';
  h+='<div class="kpi '+(okp?'good':'bad')+'">'+gauge(cur.part||0,okp?'c-ok':'c-bad')+'<div class="l">Participation ('+(cur.vus??'?')+'/'+(cur.eff??'?')+') — objectif '+q.objPart+' %</div></div>';
  const tot=q.mois.reduce((s,m)=>s+(m.nb||0),0);
  h+='<div class="kpi"><div class="v">'+tot+'</div><div class="l">QHP sur 12 mois</div></div>';
  h+='</div>';
  h+='<div class="bar '+(okp?'ok':'warn')+'" style="margin-top:12px"><i style="width:'+Math.min(100,cur.part||0)+'%"></i><span class="seuil" style="left:'+Math.min(100,q.objPart)+'%"></span></div>';
  h+=barChart(q.mois);
  if(q.agences&&q.agences.length){
    h+='<h3>Par agence — mois en cours</h3><div class="tbl-wrap"><table><thead><tr><th>Agence</th><th style="text-align:center">Vus / effectif</th><th style="text-align:center">Taux</th></tr></thead><tbody>';
    q.agences.forEach(a=>{h+='<tr><td><b>'+esc(a.a)+'</b></td><td style="text-align:center">'+a.vus+'/'+a.eff+'</td><td style="text-align:center"><span class="pill '+(a.pc>=q.objPart?'ok':a.pc>=50?'mid':'warn')+'">'+a.pc+' %</span></td></tr>'});
    h+='</tbody></table></div>'}
  h+=qhpParConducteur(q);
  h+=qhpParCollaborateur(q);
  if(qhpAuto&&qhpAuto.calculeLe)h+='<div class="majline">calculé le '+esc(new Date(qhpAuto.calculeLe).toLocaleString('fr-FR'))+'</div>';
  return h}
/* en-tête des 12 mois : l'initiale du mois, l'année quand elle change */
function enteteMois(mois){
  let h='';
  mois.forEach((m,i)=>{
    const an=String(m.k).slice(2,4), chg=(i===0)||String(mois[i-1].k).slice(0,4)!==String(m.k).slice(0,4);
    h+='<th class="mcol" title="'+esc(moisLabel(m.k)+' '+String(m.k).slice(0,4))+'">'+esc(MOIS_C[Number(String(m.k).slice(5,7))-1])+(chg?'<i>'+an+'</i>':'')+'</th>';
  });
  return h}
/* ===========================================================================
 *  SUIVI DES NOUVEAUX ARRIVANTS — ouvert à tout le monde
 *  Quatre jalons par personne : accueil SSE, autorisation de conduite,
 *  signature du plan de prévention du premier chantier, compétence validée.
 *  Un clic coche le jalon et enregistre LA DATE du jour. Rien ne se supprime
 *  ici : le serveur refuse la suppression et journalise chaque écriture.
 * ========================================================================= */
/* Chaque jalon a ses ÉTAPES INTERMÉDIAIRES : entre « rien de fait » et « fait »,
   une autorisation de conduite est d’abord rédigée, puis mise à la signature.
   La liste vit ICI, dans la page : en ajouter une ne demande aucun redéploiement
   du script — le serveur range ce qu’on lui donne, sans le comprendre. */
const JALONS=[
 {c:'accueilSSE',   ico:'👷', lib:'Accueil SSE',              court:'Accueil SSE',       auto:true},
 {c:'competence',   ico:'🎓', lib:'Fiche de formation au poste', court:'Formation au poste', auto:true},
 {c:'autorisation', ico:'🚜', lib:'Autorisation de conduite',  court:'Autorisation',      auto:true},
 {c:'pdp',          ico:'📄', lib:'PDP du 1er chantier signé', court:'PDP 1er chantier',  auto:false}
];
/* Une couleur par agence — la même partout : liseré de la fiche, pastille, légende. */
const AGENCES_COUL={IDF:'#1F6FB2', NA:'#C25A08', BPL:'#7A4FC0'};
/* Les étapes arrivent du serveur en objet ; une vieille fiche n’en a pas du tout. */
function arrivEtapes(a){
  const e=a&&a.etapes;
  if(!e)return{};
  if(typeof e==='string'){try{return JSON.parse(e)||{}}catch(x){return{}}}
  return (typeof e==='object')?e:{};
}
function etapeDe(a,champ){return String(arrivEtapes(a)[champ]||'')}
function libEtape(j,v){const e=(j.etapes||[]).find(x=>x.v===v);return e?e.lib:''}
let arrivFiltre={statut:'',agence:'',incomplets:false,anciens:false}, arrivEnCours=null;
function arrivants(){return (state.arrivants||[]).slice().sort((a,b)=>
  jourDe(b.arrivee).localeCompare(jourDe(a.arrivee))||String(a.nom||'').localeCompare(String(b.nom||''),'fr'))}   // V3.12.1 : tri sur le JOUR, stable quelle que soit la forme de la date
function arrivComplet(a){return JALONS.every(j=>String(a[j.c]||'').trim()!=='')}
function arrivVisibles(){
  return arrivants().filter(a=>
    (!arrivFiltre.statut||a.statut===arrivFiltre.statut)&&
    (!arrivFiltre.agence||(a.agence||'')===arrivFiltre.agence)&&
    (!arrivFiltre.incomplets||!arrivComplet(a)));
}
function setArrivFiltre(champ,val){
  if(champ==='incomplets')arrivFiltre.incomplets=!arrivFiltre.incomplets;
  else if(champ==='anciens')arrivFiltre.anciens=!arrivFiltre.anciens;
  else arrivFiltre[champ]=val;
  renderArrivants();
}
/* --- envoi au serveur : ouvert, donc aucun mot de passe requis --- */
async function envoyerArrivants(items,msg){
  if(!webhookLecture()){toast('Le suivi n’est pas branché : renseigne config.js',true);return false}
  try{
    const j=await appel({action:'arrivants-maj',appareil:conf.appareil||nomAppareil(),data:{arrivants:items}});
    if(j.data&&Array.isArray(j.data.arrivants)){state.arrivants=j.data.arrivants;
      /* V3.12.1 : ce qu'on a cliqué PENDANT l'aller-retour n'est pas encore dans la réponse du serveur
         (sa propre demande est en route) : on le remet par-dessus, sinon la case « sautait ». */
      Object.keys(jalonsEnvoi).forEach(k=>{const e=jalonsEnvoi[k];if(!e||typeof e!=='object')return;if(items.some(it=>it.id===e.id&&it[e.champ]!==undefined))return;
        const a=state.arrivants.find(x=>x.id===e.id);if(a){a[e.champ]=e.val;a.etapes=e.etapes}})}
    save();renderArrivants();if(typeof renderDash==='function')renderDash();
    /* Le serveur refuse une personne déjà suivie avec le MÊME statut. On ne
       laisse pas l'utilisateur dans le doute : on le dit, et on lui ouvre la
       fiche qui existe déjà pour qu'il la complète plutôt que d'en créer une. */
    if(j.doublons&&j.doublons.length){
      const d=j.doublons[0];
      toast(d.nom+' est déjà suivi(e) en « '+d.statut+' »'+(d.poste?' — '+d.poste:'')+' : voici sa fiche',true);
      setTimeout(()=>openArrivant(d.id),400);
      return false;
    }
    toast(msg||'Enregistré ✓');return true;
  }catch(e){
    if(e&&e.verrou){oublierVerrou();montrerVerrou('Le mot de passe a changé. Redemande-le au service HSE.');return false}
    toast('Échec : '+(e.message||'?'),true);return false}
}
function nomAppareil(){
  return (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?'Téléphone':'PC')+' '+Math.random().toString(36).slice(2,6);
}
/* Cocher la case = le jalon est FAIT, à la date du jour ; la décocher le remet
   à faire. Dans les deux cas l’étape intermédiaire tombe : un jalon fait n’est
   plus « en cours de signature », et un jalon qu’on rouvre repart de zéro.
   On met à jour l’écran TOUT DE SUITE, sans attendre le serveur : la réponse
   écrase ensuite l’état local, donc rien ne peut rester de travers. */
function cocherJalon(id,champ,coche){
  const a=(state.arrivants||[]).find(x=>x.id===id); if(!a)return;
  const j=JALONS.find(x=>x.c===champ); if(!j)return;
  const date=coche?new Date().toISOString().slice(0,10):'';
  const et=Object.assign({},arrivEtapes(a)); delete et[champ];
  a[champ]=date; a.etapes=et; renderArrivants();
  envoyerArrivants([{id:id,[champ]:date,etapes:et}], (coche?'✓ ':'↩ ')+j.lib+' — '+a.nom);
}
/* L’étape intermédiaire : elle n’a de sens que tant que le jalon n’est pas fait. */
function setEtape(id,champ,val){
  const a=(state.arrivants||[]).find(x=>x.id===id); if(!a)return;
  const j=JALONS.find(x=>x.c===champ); if(!j)return;
  const et=Object.assign({},arrivEtapes(a));
  if(val)et[champ]=val; else delete et[champ];
  a.etapes=et; renderArrivants();
  envoyerArrivants([{id:id,etapes:et}],
    (val?libEtape(j,val):'À faire')+' — '+j.lib+' de '+a.nom);
}
function openArrivant(id){
  const a=id?(state.arrivants||[]).find(x=>x.id===id):null;
  arrivEnCours=a?a.id:null;
  document.getElementById('ma-titre').textContent=a?('Fiche de '+a.nom):'Nouvel arrivant';
  const v=(k,d)=>{const el=document.getElementById(k);let x=(a&&a[d]!==undefined&&a[d]!==null)?a[d]:'';if(el.type==='date')x=jourDe(x);el.value=x};   // V3.12.1 : un champ date reçoit un jour, jamais un ISO
  v('ma-nom','nom');v('ma-poste','poste');v('ma-arrivee','arrivee');v('ma-tuteur','tuteur');
  v('ma-chantier','chantier');v('ma-debut','accDebut');v('ma-fin','accFin');
  v('ma-notions','notions');v('ma-notes','notes');
  document.getElementById('ma-statut').value=(a&&a.statut)||'Nouvel embauché';
  document.getElementById('ma-agence').value=(a&&a.agence)||'';
  document.getElementById('ma-acq').value=(a&&a.acquisition)||'';
  document.getElementById('ma-auto').value=(a&&a.autonomie)||'';
  document.getElementById('m-arriv').classList.add('open');
}
/* RETIRER UNE FICHE — réservé aux appareils ÉDITEURS (ceux qui ont le secret).
   Tout le monde peut cocher et ajouter ; retirer, non : sur une page ouverte à
   tous, une fausse manip effacerait le suivi d'un collègue. La ligne reçoit une
   pierre tombale dans le classeur — elle est récupérable, et la collecte de nuit
   ne la recrée pas depuis l'accueil sécurité d'origine. */
async function supprimerArrivant(id){
  const a=(state.arrivants||[]).find(x=>x.id===id); if(!a)return;
  if(!estEditeur()){toast('Seul un appareil éditeur peut retirer une fiche',true);return}
  if(!confirm('Retirer « '+(a.nom||'cette fiche')+' » du suivi des nouveaux arrivants ?\n\nLa ligne reste dans l’onglet ARRIVANTS du classeur : tu peux la remettre à la main si besoin.'))return;
  try{
    const j=await appel({secret:conf.secret,action:'arrivants-suppr',
      appareil:conf.appareil||nomAppareil(),data:{ids:[id]}});
    if(j.data&&Array.isArray(j.data.arrivants))state.arrivants=j.data.arrivants;
    save();renderArrivants();if(typeof renderDash==='function')renderDash();
    toast(j.supprimes?('🗑️ '+(a.nom||'Fiche')+' retiré(e)'):'Cette fiche était déjà retirée');
  }catch(e){
    if(e&&e.verrou){oublierVerrou();montrerVerrou('Le mot de passe a changé. Redemande-le au service HSE.');return}
    toast('Échec : '+(e.message||'?'),true);
  }
}
function saveArrivant(){
  const g=k=>document.getElementById(k).value.trim();
  const nom=g('ma-nom');
  if(!nom){toast('Renseigne le nom',true);return}
  const o={nom:nom,statut:g('ma-statut'),agence:g('ma-agence'),poste:g('ma-poste'),
    arrivee:g('ma-arrivee'),tuteur:g('ma-tuteur'),chantier:g('ma-chantier'),
    accDebut:g('ma-debut'),accFin:g('ma-fin'),notions:g('ma-notions'),
    acquisition:g('ma-acq'),autonomie:g('ma-auto'),notes:g('ma-notes'),source:'intranet'};
  if(arrivEnCours)o.id=arrivEnCours;
  closeModal();
  envoyerArrivants([o],arrivEnCours?'Fiche mise à jour ✓':'Arrivant ajouté ✓');
}
/* --- le raccourci affiché dans la famille « Nouveaux arrivants » du tableau de bord --- */
function raccourciArrivants(){
  const tous=arrivants(), inc=tous.filter(a=>!arrivComplet(a));
  let h='<div class="row no-print" style="margin-top:12px;align-items:center;gap:8px">'
    +'<button class="btn btn-primary btn-sm" onclick="go(\'v-arriv\')">👷 Ouvrir le suivi des nouveaux arrivants</button>'
    +'<span class="hint" style="margin:0">'+(tous.length
       ? tous.length+' fiche(s) suivie(s)'+(inc.length?' · <b>'+inc.length+' parcours à compléter</b>':' · tous les parcours sont complets ✅')
       : 'Aucune fiche pour l’instant — les accueils sécurité en créent automatiquement.')+'</span></div>';
  if(inc.length)h+='<div class="qtags" style="margin-top:8px">'+inc.slice(0,12).map(a=>
    '<span class="qtag" title="'+esc(JALONS.filter(j=>!String(a[j.c]||'').trim()).map(j=>j.lib).join(' · '))+'">'
    +esc(a.nom)+' <b>'+JALONS.filter(j=>String(a[j.c]||'').trim()).length+'/'+JALONS.length+'</b></span>').join('')
    +(inc.length>12?'<span class="qtag">+'+(inc.length-12)+'</span>':'')+'</div>';
  return h;
}
/* --- l'écran --- */
/* ===========================================================================
 *  SUIVI DES NOUVEAUX ARRIVANTS — V3.1 (09/10/2026)
 *  Décisions du service HSE : un TABLEAU PAR AGENCE, les points contrôlés en
 *  colonnes, une case à TROIS ÉTATS (à faire ☐ · fait ✅ à la date du jour ·
 *  NA — non concerné), plus d'étapes intermédiaires dans la page, pas de NA
 *  automatique. Un parcours complet sort du tableau après 3 mois ; le bouton
 *  « Archiver » (éditeur) retire ces fiches (pierre tombale, comme la 🗑️).
 *  Côté classeur : rien ne bouge — le NA s'écrit « NA » dans la colonne du
 *  jalon (serveur V28.5), une date reste une date.
 * ========================================================================= */
const ARRIV_MOIS_SORTIE=3;                         // parcours complet : disparaît après N mois
function estNA(v){return String(v||'').trim().toUpperCase()==='NA'}
function jalonEtat(a,c){const v=String(a[c]||'').trim();return !v?'todo':(estNA(v)?'na':'fait')}
function jalonJour(a,c){return jourDe(a[c])}
/* date de référence d'une fiche : le dernier jalon daté, sinon l'arrivée, sinon la dernière modif */
function arrivDateRef(a){
  let d='';JALONS.forEach(j=>{const v=jalonJour(a,j.c);if(/^\d{4}-\d{2}-\d{2}$/.test(v)&&v>d)d=v});
  return d||jourDe(a.arrivee)||jourDe(a.maj)||'';
}
function arrivAncien(a){
  if(!arrivComplet(a))return false;
  const d=arrivDateRef(a);if(!d)return false;
  const lim=new Date();lim.setMonth(lim.getMonth()-ARRIV_MOIS_SORTIE);
  return d<lim.toISOString().slice(0,10);
}
/* V3.3.2 — Clic sur une case : un PETIT MENU explicite (retour du service HSE : le
   cycle de 3 clics n'était pas devinable). Choix : ✅ fait aujourd'hui ·
   📅 fait à une autre date · — non concerné · ☐ à faire. L'écran est mis à
   jour tout de suite ; la case montre un petit sablier tant que le serveur
   n'a pas répondu, puis la réponse écrase l'état local. */
const jalonsEnvoi={};                          // id|champ → true pendant l'envoi
function jalonMenu(ev,id,champ){
  if(ev)ev.stopPropagation();
  fermerJalonMenu();
  const a=(state.arrivants||[]).find(x=>x.id===id); if(!a)return;
  const j=JALONS.find(x=>x.c===champ); if(!j)return;
  const et=jalonEtat(a,champ), v=jalonJour(a,champ);
  const auj=new Date().toISOString().slice(0,10);
  const m=document.createElement('div'); m.className='jmenu'; m.id='jmenu';
  m.innerHTML='<div class="jm-t">'+esc(j.lib)+'<span>'+esc(a.nom)+'</span></div>'
    +(et!=='fait'||v!==auj?'<button class="jm-b" onclick="poserJalon(\''+esc(id)+'\',\''+j.c+'\',\''+auj+'\')">✅ Fait aujourd’hui</button>':'')
    +'<label class="jm-b jm-date">📅 Fait le <input type="date" value="'+(et==='fait'?v:'')+'" max="'+auj+'" onchange="poserJalon(\''+esc(id)+'\',\''+j.c+'\',this.value)" onclick="event.stopPropagation()"></label>'
    +(et!=='na'?'<button class="jm-b" onclick="poserJalon(\''+esc(id)+'\',\''+j.c+'\',\'NA\')">— Non concerné</button>':'')
    +(et!=='todo'?'<button class="jm-b jm-off" onclick="poserJalon(\''+esc(id)+'\',\''+j.c+'\',\'\')">☐ Remettre à faire</button>':'')
    +'<button class="jm-b jm-x" onclick="fermerJalonMenu()">Annuler</button>';
  document.body.appendChild(m);
  const b=ev&&ev.currentTarget?ev.currentTarget.getBoundingClientRect():{left:40,bottom:120,top:100};
  const w=240, x=Math.max(8,Math.min(window.innerWidth-w-8,b.left)), y=(b.bottom+8+230>window.innerHeight)?Math.max(8,b.top-8-230):b.bottom+6;
  m.style.left=x+'px'; m.style.top=(y+window.scrollY)+'px';
  setTimeout(()=>document.addEventListener('click',fermerJalonMenu,{once:true}),0);
}
function fermerJalonMenu(){const m=document.getElementById('jmenu');if(m)m.remove()}
async function poserJalon(id,champ,val){
  fermerJalonMenu();
  const a=(state.arrivants||[]).find(x=>x.id===id); if(!a)return;
  const j=JALONS.find(x=>x.c===champ); if(!j)return;
  if(val&&val!=='NA'&&!/^\d{4}-\d{2}-\d{2}$/.test(val))return;
  const etapes=Object.assign({},arrivEtapes(a)); delete etapes[champ];
  a[champ]=val; a.etapes=etapes;
  jalonsEnvoi[id+'|'+champ]={id,champ,val,etapes}; renderArrivants();
  const msg=(val==='NA'?'— Non concerné : ':(val?'✓ '+frDate(val)+' : ':'↩ À faire : '))+j.lib+' — '+a.nom;
  try{await envoyerArrivants([{id:id,[champ]:val,etapes:etapes}],msg)}
  finally{delete jalonsEnvoi[id+'|'+champ]; renderArrivants()}
}
/* compatibilité : l'ancien nom reste utilisable (tests, raccourcis) — il ouvre le menu */
function cyclerJalon(id,champ){jalonMenu(null,id,champ)}
async function archiverArrivants(){
  if(!estEditeur()){toast('Seul un appareil éditeur peut archiver',true);return}
  const anciens=arrivants().filter(arrivAncien);
  if(!anciens.length){toast('Rien à archiver : aucun parcours complet de plus de '+ARRIV_MOIS_SORTIE+' mois');return}
  if(!confirm('Archiver '+anciens.length+' fiche(s) dont le parcours est complet depuis plus de '+ARRIV_MOIS_SORTIE+' mois ?\n\n'
    +anciens.slice(0,10).map(a=>'• '+a.nom).join('\n')+(anciens.length>10?'\n• …':'')
    +'\n\nLes lignes restent dans l’onglet ARRIVANTS du classeur (pierre tombale).'))return;
  try{
    const j=await appel({secret:conf.secret,action:'arrivants-suppr',appareil:conf.appareil||nomAppareil(),data:{ids:anciens.map(a=>a.id)}});
    if(j.data&&Array.isArray(j.data.arrivants))state.arrivants=j.data.arrivants;
    save();renderArrivants();if(typeof renderDash==='function')renderDash();
    toast('🗄 '+(j.supprimes||anciens.length)+' fiche(s) archivée(s)');
  }catch(e){
    if(e&&e.verrou){oublierVerrou();montrerVerrou('Le mot de passe a changé. Redemande-le au service HSE.');return}
    toast('Échec : '+(e.message||'?'),true);
  }
}
const AGENCES_ORDRE=[{code:'IDF',lib:'Agence Île-de-France'},{code:'NA',lib:'Agence Nouvelle-Aquitaine'},{code:'BPL',lib:'Agence Bretagne – Pays de la Loire'},{code:'',lib:'Sans agence'}];
function renderArrivants(){
  const box=document.getElementById('v-arriv'); if(!box)return;
  const tous=arrivants(), complets=tous.filter(arrivComplet).length, anciens=tous.filter(arrivAncien).length;
  const visibles=arrivVisibles().filter(a=>arrivFiltre.anciens||!arrivAncien(a));
  let h='<div class="arr-head">'
    +'<div><h2>👷 Nouveaux arrivants</h2>'
    +'<p class="small muted" style="margin:2px 0 0">Clique sur une case pour choisir : <b>✅ fait aujourd’hui</b>, <b>📅 fait à une autre date</b>, <b>— non concerné</b> ou <b>☐ à faire</b>. '
    +'🤖 = coché tout seul par l’outil correspondant ; le PDP se coche à la main. Rien ne s’efface ici, tout est tracé.</p></div>'
    +'<div class="arr-kpis">'
    +'<span class="ak"><b>'+tous.length+'</b> suivis</span>'
    +'<span class="ak ok"><b>'+complets+'</b> complets</span>'
    +'<span class="ak '+(tous.length-complets?'bad':'ok')+'"><b>'+(tous.length-complets)+'</b> à compléter</span>'
    +'</div></div>';
  h+='<div class="row no-print arr-bar">'
    +'<button class="btn btn-primary btn-sm" onclick="openArrivant()">＋ Ajouter</button>'
    +'<select class="fsel" onchange="setArrivFiltre(\'statut\',this.value)">'
    +['','Nouvel embauché','Nouveau poste de travail','Intérimaire','Stagiaire / alternant']
      .map(x=>'<option value="'+esc(x)+'"'+(arrivFiltre.statut===x?' selected':'')+'>'+(x||'Tous les statuts')+'</option>').join('')
    +'</select>'
    +'<button class="btn btn-ghost btn-sm'+(arrivFiltre.incomplets?' on':'')+'" onclick="setArrivFiltre(\'incomplets\')">'+(arrivFiltre.incomplets?'☑':'☐')+' À compléter seulement</button>'
    +(anciens?'<button class="btn btn-ghost btn-sm'+(arrivFiltre.anciens?' on':'')+'" onclick="setArrivFiltre(\'anciens\')" title="Parcours complets depuis plus de '+ARRIV_MOIS_SORTIE+' mois : sortis du tableau">'+(arrivFiltre.anciens?'☑':'☐')+' Anciens ('+anciens+')</button>':'')
    +(estEditeur()&&anciens?'<button class="btn btn-ghost btn-sm arr-arch" onclick="archiverArrivants()" title="Retire du suivi les parcours complets de plus de '+ARRIV_MOIS_SORTIE+' mois">🗄 Archiver ('+anciens+')</button>':'')
    +'</div>';
  const groupes=AGENCES_ORDRE.filter(g=>!arrivFiltre.agence||g.code===arrivFiltre.agence);
  let rien=true;
  groupes.forEach(g=>{
    const l=visibles.filter(a=>(AGENCES_COUL[a.agence]?a.agence:'')===g.code);
    if(!l.length&&(g.code===''||arrivFiltre.agence))return;     // « sans agence » n'apparaît que si elle a des fiches
    if(!l.length){h+='<div class="agb ag-'+(g.code||'X')+'"><div class="agb-h"><span class="agb-nom">'+esc(g.lib)+'</span><span class="agb-n muted">aucun arrivant en cours</span></div></div>';return}
    rien=false;
    const nc=l.filter(arrivComplet).length;
    h+='<div class="agb ag-'+(g.code||'X')+'"><div class="agb-h"><span class="agb-nom">'+esc(g.lib)+'</span>'
      +'<span class="agb-n">'+l.length+' personne'+(l.length>1?'s':'')+' · <b>'+nc+'</b> parcours complet'+(nc>1?'s':'')+'</span></div>';
    h+='<div class="agb-scroll"><table class="atab"><thead><tr><th class="c-nom">Collaborateur</th><th class="c-date">Arrivée</th>';
    JALONS.forEach(j=>{h+='<th class="c-j" title="'+esc(j.lib)+'">'+j.ico+'<span>'+esc(j.court||j.lib)+'</span>'+(j.auto?'<i title="Coché automatiquement par l’outil">🤖</i>':'')+'</th>'});
    h+='<th class="c-etat">État</th><th class="c-act no-print"></th></tr></thead><tbody>';
    l.forEach(a=>{
      const faits=JALONS.filter(j=>jalonEtat(a,j.c)!=='todo').length, complet=arrivComplet(a);
      h+='<tr class="'+(complet?'ok':'')+(arrivAncien(a)?' ancien':'')+'">'
        +'<td class="c-nom"><div class="an">'+esc(a.nom)+'</div><div class="asub"><span class="apill">'+esc(a.statut||'—')+'</span>'+(a.poste?' <span class="amut">'+esc(a.poste)+'</span>':'')+'</div></td>'
        +'<td class="c-date">'+(a.arrivee?esc(frDate(a.arrivee)):'<span class="muted">—</span>')+'</td>';
      JALONS.forEach(j=>{
        const et=jalonEtat(a,j.c), v=jalonJour(a,j.c);
        const envoi=!!jalonsEnvoi[a.id+'|'+j.c];
        const lib=et==='fait'?'✓ '+frDate(v):(et==='na'?'NA':'');
        const tt=j.lib+' : '+(et==='fait'?'fait le '+frDate(v):(et==='na'?'non concerné':'à faire'))+' — clic : changer';
        h+='<td class="c-j"><button class="jc '+et+(envoi?' envoi':'')+'" onclick="jalonMenu(event,\''+esc(a.id)+'\',\''+j.c+'\')" title="'+esc(tt)+'">'+(lib||'<i></i>')+(envoi?'<em class="jsab" title="Enregistrement en cours…">⏳</em>':'')+'</button></td>';
      });
      h+='<td class="c-etat">'+(complet?'<span class="aok">✔ complet</span>':'<span class="aprog2"><b>'+faits+'</b>/'+JALONS.length+'<i style="width:'+Math.round(100*faits/JALONS.length)+'%"></i></span>')+'</td>'
        +'<td class="c-act no-print"><button class="btn btn-ghost btn-sm" onclick="openArrivant(\''+esc(a.id)+'\')" title="Détails de la fiche (tuteur, chantier, notes)">✏️</button>'
        +(estEditeur()?'<button class="btn btn-ghost btn-sm apoub" onclick="supprimerArrivant(\''+esc(a.id)+'\')" title="Retirer cette fiche du suivi">🗑️</button>':'')+'</td></tr>';
    });
    h+='</tbody></table></div></div>';
  });
  if(rien&&!tous.length)h+='<div class="secempty">Aucun arrivant pour l’instant. Les accueils sécurité déjà saisis créent leur fiche automatiquement à la prochaine collecte ; sinon, ajoute-les à la main.</div>';
  else if(rien)h+='<div class="secempty">Aucune fiche ne correspond à ce filtre.</div>';
  h+='<p class="hint" style="margin-top:12px">Un parcours complet sort du tableau après '+ARRIV_MOIS_SORTIE+' mois (case « Anciens » pour les revoir). '
    +(estEditeur()?'« Archiver » et la 🗑️ retirent une fiche du suivi ; la ligne reste dans l’onglet <b>ARRIVANTS</b> du classeur et la collecte de nuit ne la fait pas revenir.'
    :'Seul un appareil éditeur peut retirer ou archiver une fiche : ici tout le monde peut cocher et ajouter, personne ne peut effacer le suivi d’un collègue.')+'</p>';
  box.innerHTML=h;
}

/* ===========================================================================
 *  LES DEUX TABLEAUX QHP — version lisible
 *  Objectif du service HSE : voir d'un coup d'œil QUI ne participe pas, et où en
 *  sont TOUS les conducteurs. Les grilles mois par mois existent toujours,
 *  mais repliées : on ne les ouvre que pour vérifier un cas précis.
 *  Ce bloc ne dépend que de esc() et de MOIS_C : il est repris tel quel dans
 *  l'appli Reporting, pour que les deux écrans racontent la même chose.
 * ========================================================================= */
let qhpGroupe = (function(){try{return localStorage.getItem('hse_qhp_groupe')||'secteur'}catch(e){return 'secteur'}})();
function setQhpGroupe(g){
  qhpGroupe=(g==='agence')?'agence':'secteur';
  try{localStorage.setItem('hse_qhp_groupe',qhpGroupe)}catch(e){}
  if(typeof renderDash==='function')renderDash();
}
function qbar(pc,cls){
  return '<span class="qbar '+(cls||'')+'"><i style="width:'+Math.max(0,Math.min(100,pc))+'%"></i></span>';
}
function moisCourt(k){
  return MOIS_C[Number(String(k).slice(5,7))-1]+String(k).slice(2,4);
}
/* ---- 1. les conducteurs de travaux ---- */
function qhpParConducteur(q){
  const l=(q.conducteurs||[]);
  if(!l.length)return '';
  const actifs=l.filter(c=>c.total>0).length;
  const max=Math.max(1,...l.map(c=>c.total||0));
  let h='<h3 style="margin-top:20px">👷 Les conducteurs de travaux <span class="hint" style="font-weight:400">— QHP animés sur 12 mois glissants</span></h3>';
  h+='<div class="qlist">';
  l.forEach(c=>{
    h+='<div class="qrow'+(c.total?'':' vide')+'">'
      +'<span class="qn">'+esc(c.nom)+'<span class="qag">'+esc(c.agence||'')+'</span></span>'
      +qbar(c.total/max*100,c.total?'':'nul')
      +'<span class="qv">'+c.total+'</span>'
      +'<span class="qd">'+(c.chantiers||0)+' chantier'+((c.chantiers||0)>1?'s':'')
      +' · '+(c.participants||0)+' participation'+((c.participants||0)>1?'s':'')+'</span>'
      +'</div>';
  });
  h+='</div>';
  h+='<p class="hint"><b>'+actifs+'</b> conducteur(s) sur '+l.length+' ont animé au moins un QHP. '
    +'Ceux qui sont à zéro restent affichés en pâle : ce sont eux qu\'il faut relancer.</p>';
  if(q.condInconnus&&q.condInconnus.length)
    h+='<p class="hint">⚠️ Animateur non reconnu dans la liste des collaborateurs : '+q.condInconnus.map(x=>esc(x.t)+' ('+x.n+')').join(', ')+' — corrige l’orthographe dans la fiche QHP pour qu’il compte.</p>';
  h+='<details class="grille-det"><summary>Voir le détail mois par mois</summary>';
  h+='<div class="tbl-wrap" style="margin-top:8px"><table class="grille"><thead><tr><th>Conducteur</th><th class="sec">Agence</th>'+enteteMois(q.mois)+'<th style="text-align:center">Total</th><th style="text-align:center">Chantiers</th></tr></thead><tbody>';
  l.forEach(c=>{
    h+='<tr'+(c.total?'':' class="pale"')+'><td><b>'+esc(c.nom)+'</b></td><td class="sec">'+esc(c.agence)+'</td>';
    c.mois.forEach(n=>{h+='<td class="mcol">'+(n?'<b>'+n+'</b>':'<span class="z">·</span>')+'</td>'});
    h+='<td style="text-align:center"><b>'+c.total+'</b></td><td style="text-align:center">'+(c.chantiers||0)+'</td></tr>';
  });
  h+='</tbody></table></div></details>';
  return h}
/* ---- 2. la participation des collaborateurs ---- */
function qhpParCollaborateur(q){
  const l=q.collaborateurs||[];
  if(!l.length)return '';
  const obj=q.objAn||6;
  const atteint=l.filter(c=>c.total>=obj).length;
  const zero=l.filter(c=>c.total===0).length;
  const parGroupe=(cle)=>{const g={};l.forEach(c=>{const k=(cle==='agence'?(c.agence||'—'):(c.secteur||'Sans groupe'));(g[k]=g[k]||[]).push(c)});return g};

  let h='<h3 style="margin-top:22px">🧑‍🤝‍🧑 La participation des collaborateurs '
      +'<span class="hint" style="font-weight:400">— objectif '+obj+' QHP par an</span></h3>';

  /* les trois chiffres qui répondent à la question « qui ne participe pas ? » */
  h+='<div class="kpis" style="margin-bottom:12px">';
  h+='<div class="kpi"><div class="v">'+l.length+'</div><div class="l">Collaborateurs suivis</div></div>';
  h+='<div class="kpi '+(atteint>=l.length/2?'good':'')+'"><div class="v">'+atteint+'</div><div class="l">Ont atteint les '+obj+' QHP</div></div>';
  h+='<div class="kpi '+(zero?'bad':'good')+'"><div class="v">'+zero+'</div><div class="l">N’ont suivi aucun QHP</div></div>';
  h+='</div>';

  /* le même tableau, au choix par secteur ou par agence */
  h+='<div class="seg no-print" style="margin-bottom:10px">'
    +'<button class="'+(qhpGroupe==='secteur'?'on':'')+'" onclick="setQhpGroupe(\'secteur\')">Par secteur</button>'
    +'<button class="'+(qhpGroupe==='agence'?'on':'')+'" onclick="setQhpGroupe(\'agence\')">Par agence</button></div>';
  const grp=parGroupe(qhpGroupe);
  h+='<div class="qlist">';
  Object.keys(grp).sort((a,b)=>a.localeCompare(b,'fr')).forEach(g=>{
    const gl=grp[g], ok=gl.filter(c=>c.total>=obj).length, rien=gl.filter(c=>c.total===0).length;
    const pc=gl.length?Math.round(ok/gl.length*100):0;
    h+='<div class="qrow">'
      +'<span class="qn">'+esc(g)+'<span class="qag">'+gl.length+'</span></span>'
      +qbar(pc,pc>=80?'ok':pc>=40?'mid':'bad')
      +'<span class="qv">'+pc+' %</span>'
      +'<span class="qd">'+ok+' à l’objectif'+(rien?' · <b class="rouge">'+rien+' à zéro</b>':'')+'</span>'
      +'</div>';
  });
  h+='</div>';

  /* la liste d'action : ceux qui sont sous l'objectif, les pires d'abord */
  const sous=l.filter(c=>c.total<obj).sort((a,b)=>a.total-b.total||a.nom.localeCompare(b.nom,'fr'));
  if(sous.length){
    h+='<details class="grille-det" open><summary>🚩 À relancer — '+sous.length+' collaborateur(s) sous les '+obj+' QHP</summary>';
    h+='<div class="qtags">'+sous.map(c=>'<span class="qtag'+(c.total?'':' zero')+'" title="'
      +esc((c.secteur||'—')+' · '+(c.agence||'—'))+'">'+esc(c.nom)+' <b>'+c.total+'</b></span>').join('')+'</div>';
    h+='<p class="hint">Le chiffre est le nombre de QHP suivis sur 12 mois. En rouge, ceux qui n’apparaissent dans aucune fiche.</p></details>';
  } else {
    h+='<p class="hint">✅ Tout le monde a atteint l’objectif de '+obj+' QHP sur les 12 derniers mois.</p>';
  }

  /* la grille complète, repliée */
  h+='<details class="grille-det"><summary>Voir le détail collaborateur par collaborateur ('+l.length+')</summary>';
  h+='<div class="tbl-wrap" style="margin-top:8px"><table class="grille"><thead><tr><th>Collaborateur</th><th class="sec">'
    +(qhpGroupe==='agence'?'Agence':'Groupe')+'</th>'+enteteMois(q.mois)+'<th style="text-align:center">Total</th><th style="text-align:center"></th></tr></thead><tbody>';
  Object.keys(grp).sort((a,b)=>a.localeCompare(b,'fr')).forEach(g=>{
    grp[g].slice().sort((a,b)=>a.nom.localeCompare(b.nom,'fr')).forEach(c=>{
      h+='<tr><td>'+esc(c.nom)+'</td><td class="sec">'+esc(g)+'</td>';
      c.mois.forEach(v=>{h+='<td class="mcol">'+(v===1?'<span class="v">✓</span>':v===0?'<span class="z">·</span>':'<span class="na">–</span>')+'</td>'});
      const st=c.total===0?'<span title="aucun QHP">🚫</span>':(c.total<obj?'<span title="sous l’objectif">⚠️</span>':'<span title="objectif tenu">✅</span>');
      h+='<td style="text-align:center"><b>'+c.total+'</b></td><td style="text-align:center">'+st+'</td></tr>';
    });
  });
  h+='</tbody></table></div><p class="hint">✓ = a suivi au moins un QHP ce mois-là · « · » = aucun · « – » = hors période ou neutralisé (arrêt, congés) dans l’appli Suivi QHP.</p></details>';
  return h}
/* diagramme en barres : QHP réalisés sur 12 mois (une seule série, teinte unique) */
function barChart(mois){
  const W=720,H=200,padL=8,padB=26,padT=20;
  const max=Math.max(1,...mois.map(m=>m.nb||0));
  const bw=Math.floor((W-padL*2)/mois.length)-6;
  let bars='';
  mois.forEach((m,i)=>{
    const x=padL+i*((W-padL*2)/mois.length)+3;
    const bh=Math.round((H-padB-padT)*(m.nb||0)/max);
    const y=H-padB-bh;
    const lbl=MOIS_S[Number(m.k.slice(5,7))-1].replace('.','');
    bars+='<rect class="cb" x="'+x+'" y="'+y+'" width="'+bw+'" height="'+Math.max(bh,2)+'" rx="3"><title>'+esc(MOIS_L[Number(m.k.slice(5,7))-1]+' '+m.k.slice(0,4))+' : '+(m.nb||0)+' QHP · participation '+(m.part??'?')+' %</title></rect>';
    bars+='<text x="'+(x+bw/2)+'" y="'+(y-5)+'" font-size="11" text-anchor="middle" fill="#14283e">'+(m.nb||0)+'</text>';
    bars+='<text x="'+(x+bw/2)+'" y="'+(H-8)+'" font-size="10.5" text-anchor="middle">'+esc(lbl)+'</text>'});
  return '<div class="chart" role="img" aria-label="QHP réalisés par mois sur 12 mois"><svg viewBox="0 0 '+W+' '+H+'">'+
    '<defs><linearGradient id="gradbar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4A9BD8"/><stop offset="100%" stop-color="#1F6FB2"/></linearGradient></defs>'+
    '<line x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(W-padL)+'" y2="'+(H-padB)+'" stroke="rgba(15,45,80,.18)" stroke-width="1"/>'+bars+'</svg>'+
    '<p class="hint" style="text-align:center;margin-top:2px">QHP réalisés par mois — 12 derniers mois</p></div>'}

/* ==================== RÉGLAGES ==================== */
function renderReglages(){
  document.body.classList.toggle('est-editeur',estEditeur());
  document.getElementById('sy-url').value=conf.webhook||'';
  document.getElementById('sy-secret').value=conf.secret||'';
  document.getElementById('sy-appareil').value=conf.appareil||'';
  document.getElementById('branchement-box').style.display=(conf.webhook||CONFIG.WEBHOOK_URL)?'':'none';
  if(!syncEnCours)syncEtat(webhookLecture()
    ?(conf.dernierSync?('Dernière synchro : '+new Date(conf.dernierSync).toLocaleString('fr-FR')):'Configuré — pas encore synchronisé')
    :'Non configuré — la page travaille en local sur cet appareil','muted');
  document.getElementById('apropos').textContent='Intranet HSE CDES — version '+APP_VERSION+(CONFIG.WEBHOOK_URL?' · webhook lecture intégré':'');
  const box=document.getElementById('tl-list');
  const list=outilsTries();
  box.innerHTML=list.map((o,i)=>'<div class="tl'+(o.masque?' masque':'')+'">'+
    '<span class="ti2">'+(ICONES[o.id]||esc(o.ico||'🧰'))+'</span>'+
    '<span class="n2"><b>'+esc(o.nom)+(o.hse?' <span class="pill mid">HSE</span>':'')+(o.masque?' <span class="pill n">masqué</span>':'')+'</b><span>'+((o.links&&o.links.length)?('menu · '+o.links.length+' lien'+(o.links.length>1?'s':'')):(o.url?esc(o.url):'⚠ lien à renseigner'))+'</span></span>'+
    '<button title="Monter" onclick="bougeTuile(\''+o.id+'\',-1)">▲</button>'+
    '<button title="Descendre" onclick="bougeTuile(\''+o.id+'\',1)">▼</button>'+
    '<button title="'+(o.masque?'Afficher':'Masquer')+'" onclick="masqueTuile(\''+o.id+'\')">'+(o.masque?'👁':'🚫')+'</button>'+
    '<button title="Modifier" onclick="openTuile(\''+o.id+'\')">✏️</button></div>').join('')||'<p class="hint">Aucun outil.</p>'}
function bougeTuile(id,dir){
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  const list=outilsTries();const i=list.findIndex(o=>o.id===id);const j=i+dir;
  if(i<0||j<0||j>=list.length)return;
  const a=list[i],b=list[j];const t=a.ordre;a.ordre=b.ordre;b.ordre=t;a.maj=nowISO();b.maj=nowISO();
  save();renderReglages();renderTiles();syncAuto()}
function masqueTuile(id){if(!estEditeur()){toast('Réservé au service HSE',true);return}const o=state.outils.find(x=>x.id===id);if(!o)return;o.masque=!o.masque;o.maj=nowISO();save();renderReglages();renderTiles();syncAuto()}
let tuileLiens=[];
function openTuile(id){
  if(!estEditeur()){toast('Réservé au service HSE',true);return}
  tuileEnCours=id||null;
  const o=id?state.outils.find(x=>x.id===id):null;
  document.getElementById('mt-titre').textContent=o?'Modifier l’outil':'Nouvel outil';
  document.getElementById('mt-ico').value=o?(o.ico||''):'🧰';
  document.getElementById('mt-nom').value=o?o.nom:'';
  document.getElementById('mt-desc').value=o?(o.desc||''):'';
  document.getElementById('mt-url').value=o?(o.url||''):'';
  document.getElementById('mt-hse').checked=o?!!o.hse:false;
  tuileLiens=o&&Array.isArray(o.links)?JSON.parse(JSON.stringify(o.links)):[];
  renderMtLinks();
  const cats=[...CATS];state.outils.forEach(x=>{if(x.cat&&!cats.includes(x.cat))cats.push(x.cat)});
  document.getElementById('mt-cat').innerHTML=cats.map(c=>'<option'+(o&&o.cat===c?' selected':'')+'>'+esc(c)+'</option>').join('');
  document.getElementById('mt-del').style.display=id?'':'none';
  document.getElementById('m-tuile').classList.add('open')}
function renderMtLinks(){
  document.getElementById('mt-links').innerHTML=tuileLiens.map((l,i)=>
    '<div class="mt-lrow"><input type="text" placeholder="Libellé (ex. Chantier Vives-Eaux)" value="'+esc(l.t||'')+'" oninput="tuileLiens['+i+'].t=this.value">'+
    '<input type="text" placeholder="https://…" value="'+esc(l.u||'')+'" oninput="tuileLiens['+i+'].u=this.value.trim()">'+
    '<button class="lx" title="Retirer" onclick="delLien('+i+')">✕</button></div>').join('')}
function addLien(){tuileLiens.push({t:'',u:''});renderMtLinks();
  const rows=document.querySelectorAll('#mt-links .mt-lrow');const der=rows[rows.length-1];if(der)der.querySelector('input').focus()}
function delLien(i){tuileLiens.splice(i,1);renderMtLinks()}
function saveTuile(){
  const nom=document.getElementById('mt-nom').value.trim();
  if(!nom){toast('Renseigne le nom',true);return}
  let url=document.getElementById('mt-url').value.trim();
  if(url&&!/^https?:\/\//i.test(url)){toast('Le lien doit commencer par https://',true);return}
  let o;
  if(tuileEnCours){o=state.outils.find(x=>x.id===tuileEnCours)}
  else{o={id:uid(),ordre:(Math.max(0,...state.outils.map(x=>x.ordre||0))+10)};state.outils.push(o)}
  const liens=tuileLiens.map(l=>({t:String(l.t||'').trim(),u:String(l.u||'').trim()})).filter(l=>l.u);
  for(const l of liens){if(!/^https?:\/\//i.test(l.u)){toast('Chaque lien du menu doit commencer par https://',true);return}}
  o.nom=nom;o.desc=document.getElementById('mt-desc').value.trim();
  o.ico=document.getElementById('mt-ico').value.trim()||'🧰';
  o.cat=document.getElementById('mt-cat').value;o.url=url;o.links=liens;
  o.hse=document.getElementById('mt-hse').checked;o.maj=nowISO();
  save();closeModal();renderReglages();renderTiles();toast('Outil enregistré ✓');syncAuto()}
function supprTuile(){
  if(!tuileEnCours)return;
  const o=state.outils.find(x=>x.id===tuileEnCours);
  if(!confirm('Supprimer « '+(o?o.nom:'')+' » du portail ?'))return;
  state.tombOutils[tuileEnCours]=nowISO();
  state.outils=state.outils.filter(x=>x.id!==tuileEnCours);
  save();closeModal();renderReglages();renderTiles();toast('Outil supprimé');syncAuto()}
function closeModal(){document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'))}
document.addEventListener('mousedown',e=>{document.querySelectorAll('.modal.open').forEach(m=>{if(e.target===m)closeModal()})});

/* ==================== SYNCHRONISATION ====================
 * Même logique que le suivi QHP : fusion élément par élément, l'horodatage
 * « maj » le plus récent gagne, une suppression est une pierre tombale.
 * Deux niveaux : action 'lecture' (sans mot de passe, tout le monde) et
 * action 'sync' (mot de passe requis, appareils « éditeurs »).           */
let syncEnCours=false, syncTimer=null;
function syncEtat(txt,cls){const el=document.getElementById('sync-etat');if(el)el.innerHTML='<span class="'+(cls||'')+'">'+esc(txt)+'</span>'}
function verifierUrl(u){
  u=String(u||'').trim();
  if(!u)return "Renseigne l'adresse du webhook.";
  if(/\/dev\/?$/.test(u))return "Cette adresse finit par /dev : c'est l'adresse de TEST. Il te faut celle qui finit par /exec — Déployer ▸ Gérer les déploiements ▸ copier l'URL de l'application Web.";
  return ''}
/* V3.9.6 — CHRONOMÈTRE : chaque appel au serveur est noté (action, temps vu par le navigateur,
   temps réellement passé par le script = « duree » dans la réponse, poids). ⏱ en bas du volet.
   Quand le navigateur voit 15 s pour un appel que le script a traité en 2 s, le problème est
   entre le poste et Google (réseau, proxy), pas dans l'intranet. */
const CHRONO=[];
function chronoNote(action,ms,serveur,ko,erreur){CHRONO.push({t:new Date(),action,ms,serveur,ko,erreur});if(CHRONO.length>40)CHRONO.shift();try{chronoRendu()}catch(e){}}
function chronoRendu(){
  const el=document.getElementById('chrono-vol');if(!el)return;
  const l=CHRONO.slice(-12).reverse();
  const lent=CHRONO.filter(c=>c.ms>8000).length;
  el.innerHTML='<details'+(lent?' open':'')+'><summary title="Temps de chaque appel au serveur : navigateur / script">⏱ Temps de réponse'+(lent?' <b class="rouge">'+lent+' lent'+(lent>1?'s':'')+'</b>':'')+'</summary><table class="chrono-tab"><tr><th>h</th><th>appel</th><th>navigateur</th><th>script</th><th>ko</th></tr>'
    +l.map(c=>'<tr class="'+(c.erreur?'err':c.ms>8000?'lent':'')+'"><td>'+c.t.toTimeString().slice(0,8)+'</td><td>'+esc(c.action)+'</td><td><b>'+(c.ms/1000).toFixed(1)+' s</b></td><td>'+(c.serveur!=null?(c.serveur/1000).toFixed(1)+' s':'—')+'</td><td>'+(c.ko!=null?c.ko:'')+'</td></tr>').join('')
    +'</table><p class="hint" style="margin:4px 0 0">Navigateur ≫ script = réseau ou proxy entre ce poste et Google. Copie d’écran à envoyer au service HSE.</p></details>';
}
async function appel(payload,ms){
  const url=(payload.action==='lecture'||payload.action==='verrou')?webhookLecture():(conf.webhook||webhookLecture());
  /* Toute requête emporte le mot de passe connu de cet appareil, sauf celles qui
     en portent déjà un (la synchro éditeur, le test de connexion). */
  if(payload.secret===undefined&&conf.lecture)payload=Object.assign({},payload,{secret:conf.lecture});
  const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),ms||45000);
  const t0=Date.now(), act=String(payload.action||'?');
  try{
    const r=await fetch(url,{method:'POST',redirect:'follow',signal:ctrl.signal,
      headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const txt=await r.text();
    let j;try{j=JSON.parse(txt)}catch(e){chronoNote(act,Date.now()-t0,null,Math.round(txt.length/1024),'page');throw new Error(diagnosticHtml(txt,r.status))}
    chronoNote(act,Date.now()-t0,typeof j.duree==='number'?j.duree:null,Math.round(txt.length/1024),j.ok?'':'erreur');
    if(!j.ok){const err=new Error(j.erreur||'Erreur serveur');err.verrou=!!j.verrou;throw err}
    return j}
  catch(e){
    if(e&&e.name==='AbortError'){chronoNote(act,Date.now()-t0,null,null,'délai');throw new Error('Le serveur ne répond pas (délai dépassé)')}
    if(e instanceof TypeError){chronoNote(act,Date.now()-t0,null,null,'injoignable');throw new Error("Impossible de joindre l'adresse. "+(verifierUrl(url)||'Vérifie ta connexion internet et le déploiement « Tout le monde »'))}
    throw e}
  finally{clearTimeout(t)}}
/* V3.9 — quand le serveur rend une page au lieu d'un JSON, on dit CE QU'IL a rendu :
   une page d'erreur Apps Script (le script a planté : la ligne est dans Apps Script ▸
   Exécutions), une page de connexion Google (déploiement pas « Tout le monde »), ou
   un portail réseau. Le message reste court et ne montre pas le HTML. */
function diagnosticHtml(txt,status){
  const t=String(txt||''),bas=t.toLowerCase();
  const titre=(/<title[^>]*>([^<]{1,120})<\/title>/i.exec(t)||[])[1];
  if(/accounts\.google\.com|servicelogin|connexion|sign in/i.test(bas)&&/google/.test(bas))return 'Le serveur demande une connexion Google : vérifie « Qui a accès : Tout le monde » dans le déploiement';
  if(/script\.google\.com|apps script|google apps script|exception|erreur de script|script error|dépassé le temps|exceeded maximum execution/i.test(bas))
    return 'Le script a rencontré une erreur (page d’erreur Apps Script'+(titre?' : « '+titre.trim()+' »':'')+') — la ligne est dans Apps Script ▸ Exécutions';
  if(status===404||/page introuvable|page not found|unable to open the file/i.test(bas))return 'Google a répondu « Page introuvable » (incident passager côté Google : la demande est renvoyée automatiquement)';
  if(status&&status>=500)return 'Serveur Google indisponible ('+status+'), réessaie dans un instant';
  return 'Réponse inattendue du serveur'+(titre?' (« '+titre.trim()+' »)':status?' (HTTP '+status+')':'')+' — vérifie « Qui a accès : Tout le monde » dans le déploiement';
}
/* V3.9.1 — les erreurs PASSAGÈRES de Google (« Page introuvable », « unable to open the file »,
   5xx, délai) se réessaient toutes seules, 2 fois, avec une pause qui s'allonge. Réservé aux
   demandes qu'on peut rejouer sans risque (recherche IA, envoi d'une image, quiz IA). */
function erreurPassagere(e){return /Page introuvable|unable to open|Réponse inattendue|indisponible \(5\d\d|ne répond pas/i.test(String(e&&e.message||e||''))}
async function appelRetente(payload,ms,n){
  let derniere;n=n===undefined?2:n;
  for(let i=0;i<=n;i++){
    try{return await appel(payload,ms)}
    catch(e){derniere=e;if(!erreurPassagere(e)||i===n)throw e;await new Promise(r=>setTimeout(r,2000*(i+1)))}
  }
  throw derniere;
}
function kpiPayload(){
  const out=[];const vus={};
  Object.keys(state.kpiMaj).forEach(cle=>{out.push({cle,maj:state.kpiMaj[cle],valeur:state.kpi[cle]===undefined?'':state.kpi[cle]});vus[cle]=1});
  Object.keys(state.kpi).forEach(cle=>{if(!vus[cle])out.push({cle,maj:EPOCH,valeur:state.kpi[cle]})});
  return out}
function outilsPayload(){
  const tombes=Object.keys(state.tombOutils).map(id=>({id,maj:state.tombOutils[id],supprime:true}));
  return state.outils.map(o=>Object.assign({},o,{maj:o.maj||EPOCH})).concat(tombes)}
function modeopPayload(){
  const tombes=Object.keys(state.tombModeop||{}).map(id=>({id,maj:state.tombModeop[id],supprime:true}));
  return (state.modeop||[]).map(m=>Object.assign({},m,{maj:m.maj||EPOCH})).concat(tombes)}
function appliquer(d,origine){
  /* V3.11.1 — garde-fou : sur un appareil ÉDITEUR, la lecture légère du démarrage ne remplace
     jamais ses tuiles ni ses liens de branchement par une réponse plus pauvre (celle d'un
     lecteur) ; elle ne fait qu'ajouter. Les tuiles font foi côté éditeur : c'est lui qui les
     envoie au serveur par la synchronisation qui suit. */
  const lectureEd=origine==='lecture-editeur';
  if(!lectureEd&&Array.isArray(d.outils)&&d.outils.length)state.outils=d.outils.map(o=>Object.assign({masque:false},o,{masque:o.masque===true||o.masque==='oui',hse:o.hse===true||o.hse==='oui',links:Array.isArray(o.links)?o.links:[]}));
  if(d.tombOutils&&typeof d.tombOutils==='object')state.tombOutils=d.tombOutils;
  completerDefauts();          // les tuiles de la version en cours ne disparaissent pas à la synchro
  state.outils.forEach(o=>{if(!Array.isArray(o.links))o.links=[]});
  /* V3.3.4 : une valeur saisie PENDANT que la synchro était en route (plus récente que
     celle du serveur) n'est plus écrasée par la réponse — elle repart au tour suivant. */
  if(d.kpi&&typeof d.kpi==='object'){
    const locK=state.kpi||{}, locM=state.kpiMaj||{}, srvM=(d.kpiMaj&&typeof d.kpiMaj==='object')?d.kpiMaj:{};
    const garder=Object.keys(locM).filter(k=>locM[k]&&(!srvM[k]||String(locM[k])>String(srvM[k])));
    state.kpi=d.kpi; state.kpiMaj=Object.assign({},srvM);
    garder.forEach(k=>{state.kpi[k]=locK[k];state.kpiMaj[k]=locM[k]});
  }else if(d.kpiMaj&&typeof d.kpiMaj==='object')state.kpiMaj=d.kpiMaj;
  /* on ne garde que des blocs bien formés : un souci serveur ne doit jamais casser la page */
  if(d.qhp&&Array.isArray(d.qhp.mois))qhpAuto=d.qhp;
  if(d.obj&&Array.isArray(d.obj.objectifs))objAuto=d.obj;
  if(d.rep&&Array.isArray(d.rep.mois))repAuto=d.rep;
  /* V3.3.2 : les indicateurs sont gardés sur l'appareil → à l'ouverture suivante, le
     bulletin s'affiche TOUT DE SUITE avec les derniers chiffres connus, puis se met à
     jour quand le serveur répond (plus d'écran vide pendant 5 à 10 s). */
  try{localStorage.setItem('ihse_cache_v1',JSON.stringify({qhp:qhpAuto,obj:objAuto,rep:repAuto,quand:nowISO()}))}catch(e){}
  if(Array.isArray(d.arrivants))state.arrivants=d.arrivants;
  if(Array.isArray(d.remontees))state.remontees=d.remontees;        // V3.3
  if(Array.isArray(d.retex))state.retex=d.retex;                    // V3.3.3
  if(Array.isArray(d.qhpThemes))state.qhpThemes=d.qhpThemes;        // V3.3 p3
  if(d.tombQhpThemes&&typeof d.tombQhpThemes==='object')state.tombQhpThemes=d.tombQhpThemes;
  if(d.todo&&typeof d.todo==='object')state.todo=d.todo;
  if(d.oublis&&typeof d.oublis==='object')state.oublis=d.oublis;   // V3.6 (éditeur)             // V3.3 (éditeur)
  if(Array.isArray(d.modeop))state.modeop=d.modeop;
  if(d.liens&&typeof d.liens==='object'&&!Array.isArray(d.liens))liensOutils=lectureEd?Object.assign({},liensOutils,d.liens):d.liens;   // V28 — en mémoire seulement ; V3.11.1 : fusion sur l'éditeur
  if(typeof d.expireJours==='number'){conf.expireJours=d.expireJours;saveConfLS()}        // V28.3
  if(d.tombModeop&&typeof d.tombModeop==='object')state.tombModeop=d.tombModeop;
  save();
  /* V3 : l'écran ouvert se met à jour lui aussi (les données arrivent APRÈS le verrou) */
  /* V3.3.4 : jamais pendant qu'on écrit dans une case de l'écran (commentaire de remontée…) :
     on attend qu'on en sorte, et on garde la position de la page. */
  const ecr=document.activeElement;
  if(ecr&&/^(INPUT|TEXTAREA|SELECT)$/.test(ecr.tagName)&&ecr.closest('main')){
    if(!window.__rafraichirIntranet){window.__rafraichirIntranet=true;ecr.addEventListener('blur',()=>{setTimeout(()=>{window.__rafraichirIntranet=false;const y=window.scrollY;rafraichirEcranActif();window.scrollTo(0,y)},300)},{once:true})}
    return;
  }
  rafraichirEcranActif();
}
function rafraichirEcranActif(){
  try{const act=document.querySelector('.view.active');
    if(act&&act.id==='v-arriv')renderArrivants();
    if(act&&act.id==='v-rem'&&typeof renderRemontees==='function')renderRemontees();
    if(act&&act.id==='v-qhp'&&typeof renderQhp==='function')renderQhp();
    if(act&&act.id==='v-hse'&&typeof renderTodo==='function')renderTodo();
    if(act&&act.id==='v-modeop')renderBanque();if(act&&act.id==='v-retex'&&typeof renderRetex==='function')renderRetex();}catch(e){}
}
async function syncOuLecture(manuel,lectureSeule){
  if(!webhookLecture()){if(manuel)toast('Renseigne d’abord l’adresse du webhook',true);return false}
  if(syncEnCours)return false;
  syncEnCours=true;syncEtat('⏳ Synchronisation…','muted');
  chargement(true);
  try{
    let j;
    if(conf.webhook&&conf.secret&&!lectureSeule){
      j=await appel({secret:conf.secret,action:'sync',appareil:conf.appareil||'appareil',
        data:{outils:outilsPayload(),kpi:kpiPayload(),modeop:modeopPayload(),qhpThemes:(typeof qhpThemesPayload==='function'?qhpThemesPayload():[])}})}
    else{
      /* V3.11.1 — la lecture LÉGÈRE d'un appareil éditeur part avec le code éditeur (le serveur
         l'accepte aussi comme mot de passe de consultation, V27) : elle rend donc les tuiles et les
         liens du service HSE. Sans ça, le serveur la prenait pour un lecteur, répondait sans les
         liens HSE, et la page écrasait ses tuiles branchées → « tout est débranché ». */
      const p={action:'lecture',appareil:conf.appareil||'visiteur'};
      if(conf.webhook&&conf.secret)p.secret=conf.secret;
      j=await appel(p)}
    appliquer(j.data||{},lectureSeule&&conf.webhook&&conf.secret?'lecture-editeur':'');
    conf.dernierSync=nowISO();saveConfLS();
    try{
      renderTiles();
      if(document.getElementById('v-hub').classList.contains('active'))renderDash();
      if(document.getElementById('v-reglages').classList.contains('active'))renderReglages();
      if(document.getElementById('v-modeop').classList.contains('active'))renderBanque();
    }catch(eAff){
      console.error('Erreur d’affichage après synchro :',eAff);
      syncEtat('✅ Synchronisé — ⚠️ affichage : '+(eAff.message||'?')+' (recharge la page)','muted');
      if(manuel)toast('Synchronisé, mais souci d’affichage — recharge la page (F5)',true);
      return true;
    }
    syncEtat('✅ Synchronisé à '+new Date().toLocaleTimeString('fr-FR').slice(0,5),'muted');
    if(manuel)toast('À jour ✓');
    return true}
  catch(e){
    /* Le mot de passe de consultation a changé côté serveur (ou a été posé
       depuis la dernière visite) : on referme, on oublie, on redemande. */
    if(e&&e.verrou){oublierVerrou();montrerVerrou('Le mot de passe a changé. Redemande-le au service HSE.');return false}
    syncEtat('⚠️ '+(e.message||'échec'),'muted');
    if(manuel)toast('Échec : '+(e.message||'?'),true);
    return false}
  finally{syncEnCours=false;chargement(false)}}
/* V3.4 — SABLIER. Tant qu'il n'y a encore rien à montrer (première ouverture, appareil
   qui vient d'être déverrouillé), un sablier plein écran dit que ça charge. Ensuite,
   seule la pastille 🔄 tourne pendant la mise à jour : on peut lire et travailler. */
function aDesDonnees(){return !!(repAuto||qhpAuto||(state.arrivants&&state.arrivants.length)||(state.remontees&&state.remontees.length))}
function chargement(on){
  const pill=document.getElementById('sync-pill');if(pill)pill.classList.toggle('tourne',!!on);
  let s=document.getElementById('sablier');
  if(on&&!aDesDonnees()&&!document.body.classList.contains('verrouille')){
    if(!s){s=document.createElement('div');s.id='sablier';s.setAttribute('role','status');
      s.innerHTML='<div class="sab-box"><div class="sab-rond" aria-hidden="true"></div><b>Chargement des données…</b><span>Première ouverture sur cet appareil : quelques secondes.</span></div>';
      document.body.appendChild(s)}
  }else if(!on&&s)s.remove();
}
function syncAuto(){
  if(!(conf.webhook&&conf.secret)||conf.autoSync===false)return;
  clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncOuLecture(false),2500)}
async function testerWebhook(){
  const u=document.getElementById('sy-url').value.trim(),s=document.getElementById('sy-secret').value.trim();
  const pb=verifierUrl(u||CONFIG.WEBHOOK_URL);
  if(pb){syncEtat('⚠️ '+pb,'muted');toast('Adresse incorrecte',true);return}
  syncEtat('⏳ Test en cours…','muted');
  const old={w:conf.webhook,s:conf.secret};conf.webhook=u;conf.secret=s;
  try{const j=await appel({secret:s,action:'ping',appareil:conf.appareil||'test'},25000);
    syncEtat('✅ Connexion OK'+(j.editeur?' · droits éditeur reconnus':' · lecture seule'),'muted');
    toast('Connexion réussie ✓')}
  catch(e){conf.webhook=old.w;conf.secret=old.s;syncEtat('⚠️ '+(e.message||'échec'),'muted');toast('Échec : '+(e.message||'?'),true)}}
function saveSync(){
  const u=document.getElementById('sy-url').value.trim();
  if(u){const pb=verifierUrl(u);if(pb){syncEtat('⚠️ '+pb,'muted');toast('Adresse incorrecte',true);return}}
  conf.webhook=u;
  conf.secret=document.getElementById('sy-secret').value.trim();
  conf.appareil=document.getElementById('sy-appareil').value.trim()||'appareil';
  saveConfLS();renderReglages();toast('Synchronisation enregistrée ✓');
  if(webhookLecture())syncOuLecture(true)}
function oublierSync(){
  if(!confirm('Effacer l’adresse et le mot de passe de synchronisation sur CET appareil ?\nLes données locales sont conservées.'))return;
  conf.webhook='';conf.secret='';saveConfLS();renderReglages();toast('Paramètres effacés')}
/* --- liens de partage --- */
function b64url(txt){return btoa(unescape(encodeURIComponent(txt))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function deb64url(t){let b=String(t).replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';return decodeURIComponent(escape(atob(b)))}
function copier(l,msg){
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(l).then(()=>toast(msg)).catch(()=>prompt('Copie ce lien :',l));
  else prompt('Copie ce lien :',l)}
function copierLienLecture(){copier(location.origin+location.pathname,'Lien copié ✓ — envoie-le à qui tu veux')}
function copierBranchement(){
  if(!conf.webhook||!conf.secret){toast('Configure d’abord adresse + mot de passe',true);return}
  const l=location.origin+location.pathname+'#config='+b64url(JSON.stringify({u:conf.webhook,s:conf.secret}));
  copier(l,'Lien éditeur copié ✓ — par SMS ou Teams uniquement')}
function appliquerLienBranchement(){
  const h=location.hash||'';const m=h.match(/[#&]config=([^&]+)/);
  if(!m)return false;
  try{
    const o=JSON.parse(deb64url(m[1]));
    if(!o.u)return false;
    conf.webhook=o.u;conf.secret=o.s||'';conf.autoSync=true;
    if(!conf.appareil)conf.appareil=(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?'Téléphone':'PC')+' '+Math.random().toString(36).slice(2,6);
    saveConfLS();
    history.replaceState(null,'',location.pathname);
    setTimeout(()=>toast('Appareil branché en éditeur ✓'),700);
    return true}
  catch(e){toast('Lien de branchement illisible',true);return false}}

/* ==================== EXPORT / IMPORT ==================== */
function dl(name,content,type){const b=new Blob([content],{type:type||'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();URL.revokeObjectURL(a.href)}
function exportJSON(){if(!estEditeur()){toast('Réservé au service HSE',true);return}dl('sauvegarde-intranet-hse-'+todayISO+'.json',JSON.stringify({state,conf:{appareil:conf.appareil}},null,2),'application/json');toast('Sauvegarde téléchargée')}
function importJSON(inp){if(!estEditeur()){toast('Réservé au service HSE',true);inp.value='';return}const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(!j.state)throw 0;if(!confirm('Remplacer les données actuelles ?'))return;state=Object.assign({outils:[],kpi:{},kpiMaj:{},tombOutils:{}},j.state);save();renderReglages();renderTiles();toast('Restauré ✓')}catch(e){toast('Fichier invalide',true)}};r.readAsText(f);inp.value=''}

/* ==================== LE VERROU DE CONSULTATION ======================
 * Ce qui protège vraiment les données, c'est le SERVEUR : tant qu'il n'a pas le
 * bon mot de passe, il ne renvoie rien. Cet écran n'est que la porte d'entrée —
 * mais il ne dessine AUCUNE donnée avant que le serveur ait dit oui, même celles
 * qui traînent dans le cache de l'appareil.
 * Un appareil déverrouillé le reste : on ne retape le mot de passe que si le
 * service HSE le change, ou si on verrouille l'appareil exprès (Réglages).
 * Hors ligne : un appareil déjà déverrouillé continue d'afficher son cache — il a
 * prouvé qu'il connaissait le mot de passe ; un appareil neuf, lui, reste dehors. */
let synchrosLancees=false;
function ouvrirAppli(){
  if(CONFIG.CONFIG_INVALIDE){try{const b=document.getElementById('dash-banner');if(b)b.innerHTML='<div class="banner" style="margin-bottom:10px">⚠️ <b>config.js n’a pas d’adresse de serveur valide</b> (il contient encore le modèle « COLLE_ICI_L_ADRESSE_EXEC »). Sur GitHub, ouvre <code>config.js</code> et remplace-le par l’adresse <code>…/exec</code> du script « Intranet HSE CDES ». En attendant, la page est en démonstration.</div>'}catch(e){}}
  document.body.classList.remove('verrouille');
  const v=document.getElementById('verrou'); if(v)v.style.display='none';
  renderTiles();renderDash();
}
function montrerVerrou(msg){
  document.body.classList.add('verrouille');
  const v=document.getElementById('verrou'); if(!v)return;
  const lg=document.getElementById('logo-verrou');
  if(lg&&window.__LOGO__)lg.src=window.__LOGO__;
  v.style.display='flex';
  const m=document.getElementById('vr-msg'); if(m)m.textContent=msg||'';
  const i=document.getElementById('vr-mdp'); if(i){i.value='';setTimeout(()=>{try{i.focus()}catch(e){}},120)}
}
function oublierVerrou(){conf.lecture='';conf.deverrouille=false;conf.deverrouilleLe='';liensOutils={};qhpAuto=null;repAuto=null;objAuto=null;try{localStorage.removeItem('ihse_cache_v1')}catch(e){}try{indexedDB.deleteDatabase('ihse_images')}catch(e){}saveConfLS()}   // V3.9.2 : les images gardées dans le navigateur partent avec le verrou
function verrouExpire(){
  const n=Number(conf.expireJours); if(!(n>0))return false;
  const t=Date.parse(conf.deverrouilleLe||''); if(!isFinite(t))return true;   // déverrouillé avant la V28.3 : on redemande une fois
  return (Date.now()-t)>n*864e5;
}
/* Réglages ▸ « appareil partagé » */
function reglerPartage(on){
  conf.partage=!!on;saveConfLS();
  ['opt-partage','opt-partage-volet'].forEach(id=>{const e=document.getElementById(id);if(e)e.checked=!!on});
  toast(on?'Appareil partagé : le mot de passe sera demandé à chaque ouverture.':'Appareil personnel : le mot de passe reste mémorisé.');
}
/* Renvoie 'ok' · 'refus' (mot de passe faux) · 'reseau' (serveur injoignable). */
async function essayerMotDePasse(mdp){
  try{
    /* V28.2 : vérification légère ('verrou'), sans attendre les indicateurs — ils
       arrivent par la synchro lancée juste après l'ouverture. Un serveur d'avant
       la V28.2 ne connaît pas 'verrou' : on retombe alors sur 'lecture'. */
    let j;
    try{ j=await appel({action:'verrou',appareil:conf.appareil||'visiteur',secret:mdp},25000); }
    catch(e){ if(e&&e.verrou)throw e; j=await appel({action:'lecture',appareil:conf.appareil||'visiteur',secret:mdp},25000); }
    conf.lecture=mdp;conf.deverrouille=true;conf.deverrouilleLe=nowISO();
    if(typeof j.expireJours==='number')conf.expireJours=j.expireJours;
    saveConfLS();
    if(j.data)appliquer(j.data);
    else if(j.liens&&typeof j.liens==='object'&&!Array.isArray(j.liens))liensOutils=j.liens;
    return 'ok';
  }catch(e){return (e&&e.verrou)?'refus':'reseau'}
}
async function validerVerrou(){
  const i=document.getElementById('vr-mdp'), b=document.getElementById('vr-btn'), m=document.getElementById('vr-msg');
  const mdp=(i.value||'').trim();
  if(!mdp){m.textContent='Tape le mot de passe.';return}
  b.disabled=true;b.textContent='Vérification…';m.textContent='';
  const r=await essayerMotDePasse(mdp);
  b.disabled=false;b.textContent='Entrer';
  if(r==='ok'){ouvrirAppli();lancerSynchros();toast('Bienvenue ✓')}
  else if(r==='refus'){m.textContent='Mot de passe incorrect.';try{i.select()}catch(e){}}
  else m.textContent='Serveur injoignable. Vérifie ta connexion, puis réessaie.';
}
/* Depuis les Réglages : rendre un appareil (tablette de chantier, PC partagé) à
   son état neuf. On efface AUSSI le cache : sinon les données resteraient lisibles
   dans le navigateur de la personne suivante. */
function verrouillerAppareil(){
  if(!confirm('Verrouiller cet appareil ?\n\nLe mot de passe sera redemandé à la prochaine ouverture, et les données gardées en cache ici seront effacées.'))return;
  oublierVerrou();
  try{localStorage.removeItem(LS)}catch(e){}
  location.reload();
}
function lancerSynchros(){
  if(synchrosLancees||!webhookLecture())return;
  synchrosLancees=true;
  const pill=document.getElementById('sync-pill'); if(pill)pill.style.display='';
  /* V3.10 : au démarrage, l'éditeur fait d'abord une LECTURE (légère, ~1 s de script) pour afficher
     tout de suite, puis sa synchronisation complète 3 s plus tard, en arrière-plan. */
  /* V3.11.1 : la synchronisation complète part QUAND la lecture est finie (et plus « 3 s après ») :
     sur le réseau CDES la lecture prend souvent 3 à 5 s, et la synchro lancée pendant qu'elle
     tournait était refusée par le garde-fou syncEnCours → jamais synchronisé avant 5 min. */
  if(conf.webhook&&conf.secret){setTimeout(()=>{Promise.resolve(syncOuLecture(false,true)).catch(()=>{}).then(()=>setTimeout(()=>syncOuLecture(false),300))},50)}
  else setTimeout(()=>syncOuLecture(false),50);          // V3.4 : sans attendre
  setInterval(()=>{if(!document.hidden)syncOuLecture(false)},300000);
  window.addEventListener('online',()=>syncOuLecture(false));
}
async function demarrer(){
  try{const cb=document.getElementById('opt-partage');if(cb)cb.checked=!!conf.partage}catch(e){}
  // pas de webhook : mode démonstration, il n'y a rien à protéger
  if(!webhookLecture()){ouvrirAppli();return}
  /* V28.3 — appareil PARTAGÉ (tablette de chantier, PC commun) : le mot de passe
     est redemandé à chaque ouverture et rien ne reste en cache. */
  if(conf.partage&&conf.deverrouille){oublierVerrou();try{localStorage.removeItem(LS)}catch(e){}}
  /* V28.3 — expiration : au-delà de N jours (servi par le serveur, 30 par défaut),
     on redemande le mot de passe. 0 = jamais. */
  if(conf.deverrouille&&verrouExpire()){oublierVerrou();montrerVerrou('Par sécurité, le mot de passe est redemandé tous les '+conf.expireJours+' jours.');return}
  // appareil déjà déverrouillé : on ouvre tout de suite, même hors ligne
  if(conf.deverrouille){ouvrirAppli();lancerSynchros();return}
  montrerVerrou(conf.partage?'Appareil partagé : mot de passe demandé à chaque ouverture.':'');
  /* Essai à blanc, sans mot de passe : si le verrou n'est pas posé côté serveur,
     personne ne doit être embêté — la page s'ouvre comme avant. */
  const r=await essayerMotDePasse('');
  if(r==='ok'){ouvrirAppli();lancerSynchros()}
  else if(r==='reseau')montrerVerrou('Serveur injoignable. Vérifie ta connexion, puis réessaie.');
}

/* ==================== DÉMARRAGE ==================== */
window.__LOGO__='img/logo_cdes.png';
document.getElementById('logo').src=window.__LOGO__;
load();
appliquerLienBranchement();
if(conf.periode==='mois')periode='mois';
if(conf.voletReduit)document.body.classList.add('voletReduit');
if(conf.agence&&['IDF','NA','BPL'].includes(conf.agence)){agenceChoisie=conf.agence;arrivFiltre.agence=conf.agence}   // V3 : l'agence choisie est mémorisée sur l'appareil
demarrer();
window.addEventListener('hashchange',()=>{
  if(/[#&]config=/.test(location.hash||'')){
    if(appliquerLienBranchement()){document.getElementById('sync-pill').style.display='';renderReglages();setTimeout(()=>syncOuLecture(false),400)}}});
