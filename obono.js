/*===== SECTIONS, TASKS, PRESET_NOTES identiques =====*/

/*========== STORAGE utilitaires identiques ==========*/
const DONE_KEY='obono.done',NOTE_KEY='obono.notes';
const loadDone=()=>new Set(JSON.parse(localStorage.getItem(DONE_KEY)||'[]'));
const saveDone=set=>localStorage.setItem(DONE_KEY,JSON.stringify([...set]));
const loadNotes=()=>JSON.parse(localStorage.getItem(NOTE_KEY)||'{}');
const saveNotes=obj=>localStorage.setItem(NOTE_KEY,JSON.stringify(obj));
let doneSet=loadDone(),userNotes=loadNotes();

/*========== DOM refs ==========*/
const lists=document.getElementById('lists');
const progressBar=document.getElementById('progressBar');
const progressLabel=document.getElementById('progressLabel');
const modal=document.getElementById('noteModal');
const noteTask=document.getElementById('noteTask');
const defaultNoteEl=document.getElementById('defaultNote');
const userNoteTA=document.getElementById('userNote');
const appBar=document.querySelector('.app-bar');

/*========== IntersectionObserver (réutilisé) ==========*/
const revealObs=new IntersectionObserver(e=>{
  e.forEach(x=>x.target.classList.toggle('active',x.isIntersecting));
},{threshold:.15});

/*========== Build sections ==========*/
SLOTS.forEach(s=>{
  const sec=document.createElement('section');
  sec.className='slot reveal';sec.dataset.slot=s.id;
  sec.innerHTML=`<h2><i data-lucide="folder"></i>${s.label}</h2><ul class="task-list"></ul>`;
  lists.appendChild(sec);revealObs.observe(sec);
});

/*========== Render tasks ==========*/
function renderTasks(){
  document.querySelectorAll('.task-list').forEach(ul=>ul.innerHTML='');
  TASKS.forEach((t,i)=>{
    const li=document.createElement('li');
    li.className=`task reveal delay-${i%6}`+(doneSet.has(i)?' completed':'');
    li.innerHTML=`<span class="label">${t.text}</span>`;

    /* --- single click : toggle immédiat --- */
    li.addEventListener('click',()=>toggle(i,li));

    /* --- double click : ouvre la note, n’interfère pas --- */
    li.addEventListener('dblclick',e=>{
      e.stopPropagation();openModal(i);
    });

    document.querySelector(`section[data-slot="${t.slot}"] .task-list`).appendChild(li);
    revealObs.observe(li);
  });
  lucide.createIcons();
}

/*========== Toggle / progress instantané ==========*/
function toggle(idx,li){
  doneSet.has(idx)?doneSet.delete(idx):doneSet.add(idx);
  saveDone(doneSet);
  li.classList.toggle('completed');

  /* rejoue l’animation */
  li.classList.remove('tick');void li.offsetWidth;li.classList.add('tick');

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

/*========== Modal notes (identique) ==========*/
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
    if(v)userNotes[current]=v;else delete userNotes[current];
    saveNotes(userNotes);current=null;
  }
  modal.classList.remove('open');modal.classList.add('hidden');
}
document.getElementById('closeModal').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});

/*========== Reset (inchangé) ==========*/
const resetBtn=document.getElementById('resetBtn');
resetBtn.addEventListener('click',()=>{
  resetBtn.classList.add('reset-spin');setTimeout(()=>resetBtn.classList.remove('reset-spin'),600);
  doneSet.clear();userNotes={};saveDone(doneSet);saveNotes(userNotes);
  renderTasks();updateProgress(true);
});

/*========== Intro & date (inchangé) ==========*/
document.getElementById('today').textContent=
  new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
document.getElementById('enterBtn').addEventListener('click',()=>{
  document.getElementById('intro').classList.add('fade-out');
  appBar.classList.add('show');appBar.classList.remove('hidden');
});

/*========== Init ==========*/
renderTasks();updateProgress();