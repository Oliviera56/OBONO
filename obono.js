/* ===== SECTIONS & TÂCHES ============================================== */
const SLOTS=[ /* … même contenu … */ ];
const TASKS=[ /* … même contenu … */ ].map(([slot,text])=>({slot,text}));
const PRESET_NOTES=Array(TASKS.length).fill("");

/* ===== STORAGE ======================================================== */
const DONE_KEY='obono.done', NOTE_KEY='obono.notes';
const loadDone =()=>new Set(JSON.parse(localStorage.getItem(DONE_KEY)||'[]'));
const saveDone =s=>localStorage.setItem(DONE_KEY,JSON.stringify([...s]));
const loadNotes=()=>JSON.parse(localStorage.getItem(NOTE_KEY)||'{}');
const saveNotes=o=>localStorage.setItem(NOTE_KEY,JSON.stringify(o));
let doneSet=loadDone(), userNotes=loadNotes();

/* ===== DOM ============================================================ */
const lists=document.getElementById('lists');
const progressBar=document.getElementById('progressBar');
const progressLabel=document.getElementById('progressLabel');
const appBar=document.querySelector('.app-bar');
const modal=document.getElementById('noteModal');
const noteTask=document.getElementById('noteTask');
const defaultNoteEl=document.getElementById('defaultNote');
const userNoteTA=document.getElementById('userNote');

/* ===== REVEAL OBSERVER =============================================== */
const obs=new IntersectionObserver(e=>{
  e.forEach(x=>x.target.classList.toggle('active',x.isIntersecting));
},{threshold:.15});

/* ===== BUILD SECTIONS ================================================= */
SLOTS.forEach(s=>{
  const sec=document.createElement('section');
  sec.className='slot reveal';sec.dataset.slot=s.id;
  sec.innerHTML=`<h2><i data-lucide="folder"></i>${s.label}</h2><ul class="task-list"></ul>`;
  lists.appendChild(sec);obs.observe(sec);
});

/* ===== RENDER TASKS =================================================== */
function renderTasks(){
  document.querySelectorAll('.task-list').forEach(ul=>ul.innerHTML='');
  TASKS.forEach((t,i)=>{
    const li=document.createElement('li');
    li.className=`task reveal delay-${i%6}`+(doneSet.has(i)?' completed':'');
    li.innerHTML=`<span class="label">${t.text}</span>`;
    li.dataset.i=i;
    li.addEventListener('click',handleClick,{passive:true});
    document.querySelector(`section[data-slot="${t.slot}"] ul`).appendChild(li);
    obs.observe(li);
  });
  lucide.createIcons();
}

/* ===== CLICK / DOUBLE-CLICK LOGIC (150 ms) ============================ */
let lastEl=null, lastTime=0;
const DBL=150;  // fenêtre double-clic en ms

function handleClick(e){
  const el=e.currentTarget;
  const idx=+el.dataset.i;
  const now=performance.now();

  if(el===lastEl && (now-lastTime)<=DBL){
    openModal(idx);
    lastEl=null;lastTime=0;
  }else{
    toggle(idx,el);
    lastEl=el;lastTime=now;
  }
}

/* ===== TOGGLE & PROGRESS ============================================= */
function toggle(i,el){
  doneSet.has(i)?doneSet.delete(i):doneSet.add(i);
  saveDone(doneSet);
  el.classList.toggle('completed');
  el.classList.remove('tick');void el.offsetWidth;el.classList.add('tick');
  updateProgress(true);
}
function updateProgress(pulse=false){
  const pct=Math.round(doneSet.size/TASKS.length*100);
  progressBar.style.width=pct+'%';
  progressLabel.textContent=pct+' %';
  if(pulse){
    progressBar.classList.remove('pulse');void progressBar.offsetWidth;
    progressBar.classList.add('pulse');
  }
}

/* ===== MODAL NOTES ==================================================== */
let current=null;
function openModal(i){
  current=i;
  noteTask.textContent=TASKS[i].text;
  defaultNoteEl.textContent=PRESET_NOTES[i]||'—';
  userNoteTA.value=userNotes[i]||'';
  modal.classList.remove('hidden');modal.classList.add('open');
}
function closeModal(){
  if(current!==null){
    const v=userNoteTA.value.trim();
    if(v)userNotes[current]=v; else delete userNotes[current];
    saveNotes(userNotes);current=null;
  }
  modal.classList.remove('open');modal.classList.add('hidden');
}
document.getElementById('closeModal').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});

/* ===== RESET ========================================================== */
document.getElementById('resetBtn').addEventListener('click',e=>{
  const btn=e.currentTarget;
  btn.classList.add('reset-spin');setTimeout(()=>btn.classList.remove('reset-spin'),600);
  doneSet.clear();userNotes={};saveDone(doneSet);saveNotes(userNotes);
  renderTasks();updateProgress(true);
});

/* ===== INTRO & DATE =================================================== */
const intro=document.getElementById('intro'), enterBtn=document.getElementById('enterBtn');
function launchApp(){intro.classList.add('fade-out');appBar.classList.add('show');appBar.classList.remove('hidden');}
enterBtn.addEventListener('click',launchApp);
intro.addEventListener('keydown',e=>{if(e.key==='Enter')launchApp();});
enterBtn.focus();
document.getElementById('today').textContent=
  new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

/* ===== INIT =========================================================== */
renderTasks();updateProgress();