/* ===== SECTIONS & TÂCHES =============================================== */
const SLOTS=[
  {id:'arrivee',label:'Arrivée'},{id:'soiree',label:'Soirée'},
  {id:'nuit',label:'Nuit'},{id:'matinee',label:'Matinée'},
  {id:'finmatinee',label:'Fin de matinée'}
];

const TASKS=[ /* même tableau que précédemment */ ].map(([slot,text])=>({slot,text}));

const PRESET_NOTES = Array(TASKS.length).fill("");

/* ===== STORAGE ========================================================= */
const DONE_KEY='obono.done', NOTE_KEY='obono.notes';
const loadDone = () => new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]'));
const saveDone = set  => localStorage.setItem(DONE_KEY, JSON.stringify([...set]));
const loadNotes = () => JSON.parse(localStorage.getItem(NOTE_KEY) || '{}');
const saveNotes = obj => localStorage.setItem(NOTE_KEY, JSON.stringify(obj));

let doneSet   = loadDone();
let userNotes = loadNotes();

/* ===== DOM REFS ======================================================== */
const lists          = document.getElementById('lists');
const progressBar    = document.getElementById('progressBar');
const progressLabel  = document.getElementById('progressLabel');
const appBar         = document.querySelector('.app-bar');
const modal          = document.getElementById('noteModal');
const noteTask       = document.getElementById('noteTask');
const defaultNoteEl  = document.getElementById('defaultNote');
const userNoteTA     = document.getElementById('userNote');

/* ===== OBSERVER pour reveal infini ===================================== */
const obs = new IntersectionObserver(ents=>{
  ents.forEach(e=>e.target.classList.toggle('active', e.isIntersecting));
},{threshold:.15});

/* ===== CONSTRUCTION SECTIONS ========================================== */
SLOTS.forEach(s=>{
  const sec=document.createElement('section');
  sec.className='slot reveal'; sec.dataset.slot=s.id;
  sec.innerHTML=`<h2><i data-lucide="folder"></i>${s.label}</h2><ul class="task-list"></ul>`;
  lists.appendChild(sec); obs.observe(sec);
});

/* ===== RENDER TÂCHES =================================================== */
function renderTasks(){
  document.querySelectorAll('.task-list').forEach(ul=>ul.innerHTML='');
  TASKS.forEach((t,i)=>{
    const li=document.createElement('li');
    li.className=`task reveal delay-${i%6}`+(doneSet.has(i)?' completed':'');
    li.innerHTML=`<span class="label">${t.text}</span>`;
    li.dataset.index=i;
    li.addEventListener('click', handleClick);
    document.querySelector(`section[data-slot="${t.slot}"] .task-list`).appendChild(li);
    obs.observe(li);
  });
  lucide.createIcons();
}

/* ===== SINGLE vs DOUBLE CLICK (SANS DÉLAI VISUEL) ===================== */
let lastEl = null;
let lastTime = 0;
const THRESHOLD = 350;      // ms

function handleClick(e){
  const li   = e.currentTarget;
  const idx  = +li.dataset.index;
  const now  = Date.now();

  if(lastEl === li && now - lastTime < THRESHOLD){
    openModal(idx);
    lastEl = null; lastTime = 0;
    return;
  }

  toggle(idx, li);
  lastEl = li; lastTime = now;
}

/* ===== TOGGLE & PROGRESS ============================================== */
function toggle(idx, li){
  doneSet.has(idx) ? doneSet.delete(idx) : doneSet.add(idx);
  saveDone(doneSet);
  li.classList.toggle('completed');
  li.classList.remove('tick'); void li.offsetWidth; li.classList.add('tick');
  updateProgress(true);
}
function updateProgress(pulse=false){
  const pct=Math.round(doneSet.size / TASKS.length * 100);
  progressBar.style.width=pct+'%';
  progressLabel.textContent=pct+' %';
  if(pulse){
    progressBar.classList.remove('pulse'); void progressBar.offsetWidth;
    progressBar.classList.add('pulse');
  }
}

/* ===== MODAL NOTES ===================================================== */
let current = null;
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
    saveNotes(userNotes); current=null;
  }
  modal.classList.remove('open'); modal.classList.add('hidden');
}
document.getElementById('closeModal').addEventListener('click', closeModal);
modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });

/* ===== RESET =========================================================== */
document.getElementById('resetBtn').addEventListener('click', e=>{
  const btn=e.currentTarget;
  btn.classList.add('reset-spin');
  setTimeout(()=>btn.classList.remove('reset-spin'),600);
  doneSet.clear(); userNotes={};
  saveDone(doneSet); saveNotes(userNotes);
  renderTasks(); updateProgress(true);
});

/* ===== INTRO & DATE ==================================================== */
const intro   = document.getElementById('intro');
const enterBtn= document.getElementById('enterBtn');

function launchApp(){
  intro.classList.add('fade-out');
  appBar.classList.add('show'); appBar.classList.remove('hidden');
}
enterBtn.addEventListener('click', launchApp);
intro.addEventListener('keydown', e=>{ if(e.key==='Enter') launchApp(); });
enterBtn.focus();

document.getElementById('today').textContent =
  new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

/* ===== INIT ============================================================ */
renderTasks(); updateProgress();