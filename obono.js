/* ====================================================================
   O B O N O  –  Shift-helper  v2
   Génère un rapport structuré (voir photo) à partir des notes saisies.
   ==================================================================== */

/* ----- 1.  CONFIG --------------------------------------------------- */
const SLOTS = [
  {id:'arrivee',    label:'Arrivée'},
  {id:'soiree',     label:'Soirée'},
  {id:'nuit',       label:'Nuit'},
  {id:'matinee',    label:'Matinée'},
  {id:'finmatinee', label:'Fin de matinée'}
];

const TASKS = [
 ['arrivee','Passation des infos'],
 ['arrivee','Caisse'],
 ['arrivee','Piscine'],
 ['arrivee',"Imprimer l'état d'occupation et d'hébergement"],
 ['soiree','Fermeture du spa (21 h)'],
 ['soiree','Serviettes piscine'],
 ['soiree','Première ronde – vérifier les chambres non arrivées'],
 ['soiree','Préparer les arrivées du lendemain'],
 ['soiree','Régler le volume de la musique'],
 ['soiree',"Fermer la porte de l'hôtel une fois le personnel parti"],
 ['soiree','Ronde de fermeture'],
 ['nuit','Trier les tickets resto/bar'],
 ['nuit','Préparer le mail Medialog'],
 ['nuit','Ménage dès que plus aucun client'],
 ['nuit','Clôture de caisse à 2 h'],
 ['nuit','Envoyer le mail Medialog'],
 ['nuit','Temps calme'],
 ['matinee',"Ouvrir la porte d'entrée"],
 ['matinee','Mise en place petit-déj'],
 ['matinee','VAD Expedia / Staycation'],
 ['matinee',"Ronde d'ouverture"],
 ['finmatinee','Caisse après clôture matin'],
 ['finmatinee','Sortir les poubelles'],
 ['finmatinee',"Noter l'heure de fin"],
 ['finmatinee','Finito pipo']
].map(([slot,text])=>({slot,text}));

/*—  Catégories du rapport (photo)  —*/
const REPORT_CATEGORIES = [
  'Retour client',
  'Délogement',
  'No-show',
  'Caisse',
  'Etages',
  'Technique',
  'Proposition Tarifaire',
  'Autre info importante'
];

/* ---------- 2.  STORAGE -------------------------------------------- */
const DONE_KEY    = 'obono.done';
const NOTE_KEY    = 'obono.notes';
const CAT_KEY     = 'obono.noteCats';

const doneSet     = new Set(JSON.parse(localStorage.getItem(DONE_KEY)  || '[]'));
const userNotes   = JSON.parse(localStorage.getItem(NOTE_KEY) || '{}');
const noteCats    = JSON.parse(localStorage.getItem(CAT_KEY) || '{}');

const saveDone    = ()=>localStorage.setItem(DONE_KEY,  JSON.stringify([...doneSet]));
const saveNotes   = ()=>localStorage.setItem(NOTE_KEY, JSON.stringify(userNotes));
const saveCats    = ()=>localStorage.setItem(CAT_KEY,  JSON.stringify(noteCats));

/* ---------- 3.  DOM COURANTS --------------------------------------- */
const lists        = document.getElementById('lists');
const progressBar  = document.getElementById('progressBar');
const progressLbl  = document.getElementById('progressLabel');
const intro        = document.getElementById('intro');
const enterBtn     = document.getElementById('enterBtn');
const appBar       = document.querySelector('.app-bar');

const noteModal    = document.getElementById('noteModal');
const noteTaskLbl  = document.getElementById('noteTask');
const defaultNote  = document.getElementById('defaultNote');
const userTA       = document.getElementById('userNote');
const catSelect    = document.getElementById('noteCategory');

const reportBtn    = document.getElementById('reportBtn');
const reportModal  = document.getElementById('reportModal');
const reportOut    = document.getElementById('reportOut');
const copyReport   = document.getElementById('copyReport');

/* ---------- 4.  BUILD SECTIONS & TASKS ----------------------------- */
const obs = new IntersectionObserver(e =>
  e.forEach(x=>x.target.classList.toggle('active',x.isIntersecting)),{threshold:.15});

function buildSections(){
  SLOTS.forEach(s=>{
    const sec=document.createElement('section');
    sec.className='slot reveal';sec.dataset.slot=s.id;
    sec.innerHTML=`<h2><i data-lucide="folder"></i>${s.label}</h2><ul class="task-list"></ul>`;
    lists.appendChild(sec);obs.observe(sec);
  });
}

function renderTasks(){
  document.querySelectorAll('.task-list').forEach(u=>u.innerHTML='');
  TASKS.forEach((t,i)=>{
    const li=document.createElement('li');
    li.className=`task reveal delay-${i%6}`+(doneSet.has(i)?' completed':'');
    li.dataset.i=i;
    li.innerHTML=`<span class="label">${t.text}</span>
                  <button class="note-btn" title="Notes" aria-label="Notes" data-i="${i}">🗒️</button>`;
    li.addEventListener('click',toggleTask);
    li.querySelector('.note-btn').addEventListener('click',e=>{
      e.stopPropagation();openNote(i);
    });
    document.querySelector(`section[data-slot="${t.slot}"] ul`).appendChild(li);
    obs.observe(li);
  });
  lucide.createIcons();
}

/* ---------- 5.  LOGIQUE TÂCHE / PROGRÈS ---------------------------- */
function toggleTask(e){
  const i=+e.currentTarget.dataset.i;
  doneSet.has(i)?doneSet.delete(i):doneSet.add(i);
  saveDone();
  e.currentTarget.classList.toggle('completed');
  updateProgress(true);
}
function updateProgress(pulse=false){
  const pct=Math.round(doneSet.size/TASKS.length*100);
  progressBar.style.width=pct+'%';progressLbl.textContent=pct+' %';
  if(pulse){progressBar.classList.remove('pulse');void progressBar.offsetWidth;progressBar.classList.add('pulse');}
}

/* ---------- 6.  MODAL NOTES ---------------------------------------- */
let current=null;
catSelect.innerHTML=REPORT_CATEGORIES.map(c=>`<option>${c}</option>`).join('');
function openNote(i){
  current=i;
  noteTaskLbl.textContent=TASKS[i].text;
  defaultNote.textContent='—';
  userTA.value=userNotes[i]||'';
  catSelect.value=noteCats[i]||REPORT_CATEGORIES[REPORT_CATEGORIES.length-1];
  noteModal.classList.remove('hidden');noteModal.classList.add('open');
}
function closeNote(){
  if(current!==null){
    const txt=userTA.value.trim();
    const cat=catSelect.value;
    if(txt){userNotes[current]=txt;noteCats[current]=cat;}
    else {delete userNotes[current];delete noteCats[current];}
    saveNotes();saveCats();current=null;
  }
  noteModal.classList.remove('open');noteModal.classList.add('hidden');
}
document.getElementById('closeModal').addEventListener('click',closeNote);
noteModal.addEventListener('click',e=>{if(e.target===noteModal)closeNote();});

/* ---------- 7.  RAPPORT DE SHIFT ----------------------------------- */
reportBtn.addEventListener('click',generateReport);
copyReport.addEventListener('click',()=>{
  navigator.clipboard.writeText(reportOut.value).then(()=>copyReport.textContent='Copié !');
});
document.getElementById('closeReport').addEventListener('click',()=>reportModal.classList.add('hidden'));

function generateReport(){
  /*  regroupement notes -> catégories  */
  const buckets={};REPORT_CATEGORIES.forEach(c=>buckets[c]=[]);
  Object.keys(userNotes).forEach(i=>{
    const cat=noteCats[i]||REPORT_CATEGORIES.at(-1);
    buckets[cat].push(userNotes[i]);
  });

  /*  construis la chaîne finale  */
  let txt=`SHIFT du : ${new Date().toLocaleDateString('fr-FR')}\n\n`;
  REPORT_CATEGORIES.forEach(cat=>{
    txt+=`- ${cat} :\n`;
    buckets[cat].forEach(n=>txt+=`   • ${n.replace(/\n/g,' ')}\n`);
    if(!buckets[cat].length) txt+='   •\n';
  });
  txt+=`\nSignature\n`;
  reportOut.value=txt;
  copyReport.textContent='Copier';
  reportModal.classList.remove('hidden');
}

/* ---------- 8.  INTRO + RESET -------------------------------------- */
enterBtn.addEventListener('click',()=>{intro.classList.add('fade-out');appBar.classList.add('show');});
intro.addEventListener('keydown',e=>{if(e.key==='Enter')enterBtn.click();});
document.getElementById('today').textContent=
  new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

document.getElementById('resetBtn').addEventListener('click',()=>{
  doneSet.clear();for(const k of[NOTE_KEY,CAT_KEY])localStorage.removeItem(k);
  Object.keys(userNotes).forEach(k=>delete userNotes[k]);
  Object.keys(noteCats).forEach(k=>delete noteCats[k]);
  saveDone();renderTasks();updateProgress(true);
});

/* ---------- 9.  INIT ------------------------------------------------ */
buildSections();renderTasks();updateProgress();