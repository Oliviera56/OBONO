/* ===== SECTIONS & TÂCHES ================================================= */
const SLOTS=[
  {id:'arrivee',label:'Arrivée'},{id:'soiree',label:'Soirée'},
  {id:'nuit',label:'Nuit'},{id:'matinee',label:'Matinée'},
  {id:'finmatinee',label:'Fin de matinée'}
];

const TASKS=[
  ['arrivee','Passation des infos'],['arrivee','Caisse'],['arrivee','Piscine'],['arrivee',"Imprimer l'état d'occupation et d'hébergement"],
  ['soiree','Fermeture du spa (21 h)'],['soiree','Serviettes piscine'],['soiree','Première ronde – vérifier les chambres non arrivées'],['soiree','Préparer les arrivées du lendemain (pochettes, cartes, bons boissons/soins)'],['soiree','Régler le volume de la musique'],['soiree',"Fermer la porte de l'hôtel une fois le personnel parti"],['soiree','Ronde de fermeture'],
  ['nuit','Trier les tickets du restaurant et du bar'],['nuit','Préparer le mail du rapport Medialog'],['nuit','Ménage dès que plus aucun client n’est présent'],['nuit','Clôture de caisse à 2 h'],['nuit','Envoyer le mail Medialog'],['nuit','Temps calme'],
  ['matinee',"Ouvrir la porte d'entrée"],['matinee','Mise en place du petit-déjeuner'],['matinee','VAD Expedia / Staycation'],['matinee',"Ronde d'ouverture"],
  ['finmatinee','Caisse après clôture avec le matin'],['finmatinee','Sortir les poubelles'],['finmatinee',"Noter l'heure de fin"],['finmatinee','Finito pipo']
].map(([slot,text])=>({slot,text}));

const PRESET_NOTES = Array(TASKS.length).fill("");

/* ===== LOCAL STORAGE ===================================================== */
const DONE_KEY='obono.done', NOTE_KEY='obono.notes';
const loadDone = () => new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]'));
const saveDone = set  => localStorage.setItem(DONE_KEY, JSON.stringify([...set]));
const loadNotes = () => JSON.parse(localStorage.getItem(NOTE_KEY) || '{}');
const saveNotes = obj => localStorage.setItem(NOTE_KEY, JSON.stringify(obj));

let doneSet   = loadDone();
let userNotes = loadNotes();

/* ===== DOM RÉFÉRENCES ==================================================== */
const lists         = document.getElementById('lists');
const progressBar   = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');
const appBar        = document.querySelector('.app-bar');

const modal         = document.getElementById('noteModal');
const noteTask      = document.getElementById('noteTask');
const defaultNoteEl = document.getElementById('defaultNote');
const userNoteTA    = document.getElementById('userNote');

/* ===== REVEAL OBSERVER (scroll up & down) ================================ */
const revealObs = new IntersectionObserver(entries=>{
  entries.forEach(e=>e.target.classList.toggle('active', e.isIntersecting));
},{threshold:.15});

/* ===== CONTRUCTION DES SECTIONS ========================================= */
SLOTS.forEach(s=>{
  const section=document.createElement('section');
  section.className='slot reveal'; section.dataset.slot=s.id;
  section.innerHTML=`<h2><i data-lucide="folder"></i>${s.label}</h2><ul class="task-list"></ul>`;
  lists.appendChild(section);
  revealObs.observe(section);
});

/* ===== AFFICHAGE DES TÂCHES ============================================ */
function renderTasks(){
  document.querySelectorAll('.task-list').forEach(ul=>ul.innerHTML='');
  TASKS.forEach((t,i)=>{
    const li=document.createElement('li');
    li.className=`task reveal delay-${i%6}`+(doneSet.has(i)?' completed':'');
    li.innerHTML=`<span class="label">${t.text}</span>`;
    li.addEventListener('click', ()=>toggle(i,li));
    li.addEventListener('dblclick',e=>{e.stopPropagation();openModal(i);});
    document.querySelector(`section[data-slot="${t.slot}"] .task-list`).appendChild(li);
    revealObs.observe(li);
  });
  lucide.createIcons();
}

/* ===== TOGGLE & PROGRESS ================================================= */
function toggle(idx, li){
  doneSet.has(idx) ? doneSet.delete(idx) : doneSet.add(idx);
  saveDone(doneSet);
  li.classList.toggle('completed');
  li.classList.remove('tick'); void li.offsetWidth; li.classList.add('tick');
  updateProgress(true);
}
function updateProgress(pulse=false){
  const pct=Math.round(doneSet.size / TASKS.length * 100);
  progressBar.style.width = pct + '%';
  progressLabel.textContent = pct + ' %';
  if(pulse){
    progressBar.classList.remove('pulse'); void progressBar.offsetWidth;
    progressBar.classList.add('pulse');
  }
}

/* ===== MODAL NOTES ======================================================= */
let current=null;
function openModal(i){
  current=i;
  noteTask.textContent = TASKS[i].text;
  defaultNoteEl.textContent = PRESET_NOTES[i] || '—';
  userNoteTA.value = userNotes[i] || '';
  modal.classList.remove('hidden'); modal.classList.add('open');
}
function closeModal(){
  if(current!==null){
    const v=userNoteTA.value.trim();
    if(v) userNotes[current]=v; else delete userNotes[current];
    saveNotes(userNotes);
    current=null;
  }
  modal.classList.remove('open'); modal.classList.add('hidden');
}
document.getElementById('closeModal').addEventListener('click', closeModal);
modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });

/* ===== RESET ============================================================= */
document.getElementById('resetBtn').addEventListener('click', e=>{
  const btn=e.currentTarget;
  btn.classList.add('reset-spin');
  setTimeout(()=>btn.classList.remove('reset-spin'),600);
  doneSet.clear(); userNotes={};
  saveDone(doneSet); saveNotes(userNotes);
  renderTasks(); updateProgress(true);
});

/* ===== INTRO (clic & touche Entrée) ===================================== */
const intro      = document.getElementById('intro');
const enterBtn   = document.getElementById('enterBtn');

function launchApp(){
  intro.classList.add('fade-out');
  appBar.classList.add('show'); appBar.classList.remove('hidden');
}
enterBtn.addEventListener('click', launchApp);

/* touche Entrée n’importe où sur l’intro */
intro.addEventListener('keydown', e=>{
  if(e.key==='Enter') launchApp();
});

/* focus initial pour capter Enter immédiatement */
enterBtn.focus();

/* ===== DATE COURANTE ===================================================== */
document.getElementById('today').textContent =
  new Date().toLocaleDateString('fr-FR', {weekday:'long',year:'numeric',month:'long',day:'numeric'});

/* ===== INIT ============================================================== */
renderTasks(); updateProgress();