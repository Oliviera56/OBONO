/* =====================================================================
   O  B  O  N  O   ·   Night-Shift   —   JavaScript v6
   ===================================================================== */
(() => {
/* ───────────── 1. CONFIGURATION ──────────────────────────────────── */
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
 ['soiree','Première ronde – chambres non arrivées'],
 ['soiree','Préparer les arrivées du lendemain'],
 ['soiree','Régler le volume musique'],
 ['soiree',"Fermer la porte de l'hôtel"],
 ['soiree','Ronde de fermeture'],
 ['nuit','Trier les tickets resto/bar'],
 ['nuit','Préparer le mail Medialog'],
 ['nuit','Ménage (plus aucun client)'],
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

const CATEGORIES = [
  'Retour client',
  'Délogement',
  'No-show',
  'Caisse',
  'Etages',
  'Technique',
  'Proposition Tarifaire',
  'Autre info importante'
];

/* ───────────── 2. LOCAL-STORAGE ──────────────────────────────────── */
const DONE_KEY='obono.done', NOTE_KEY='obono.notes', CAT_KEY='obono.cats';

const doneSet = new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]'));
const notes   = JSON.parse(localStorage.getItem(NOTE_KEY) || '{}');
const cats    = JSON.parse(localStorage.getItem(CAT_KEY)  || '{}');

function saveState(){
  localStorage.setItem(DONE_KEY, JSON.stringify([...doneSet]));
  localStorage.setItem(NOTE_KEY, JSON.stringify(notes));
  localStorage.setItem(CAT_KEY , JSON.stringify(cats));
}

/* ───────────── 3. RÉFÉRENCES DOM ────────────────────────────────── */
const $ = sel => document.querySelector(sel);
const lists        = $('#lists');
const progressBar  = $('#progressBar');
const progressLbl  = $('#progressLabel');

const intro        = $('#intro');
const enterBtn     = $('#enterBtn');
const appBar       = $('.app-bar');
const todayLbl     = $('#today');
const resetBtn     = $('#resetBtn');
const summaryBtn   = $('#summaryBtn');

const noteModal    = $('#noteModal');
const noteTaskLbl  = $('#noteTask');
const userTA       = $('#userNote');

const catDisplay      = $('#catDisplay');
const catDisplayText  = $('#catDisplayText');
const catOptions      = $('#catOptions');

const closeNoteBtn = $('#closeModal');

const reportModal  = $('#reportModal');
const reportTA     = $('#reportOut');
const copyReport   = $('#copyReport');
const closeReport  = $('#closeReport');

/* ───────────── 4. OBSERVER “REVEAL” ──────────────────────────────── */
const revealObs = new IntersectionObserver(
  es => es.forEach(e=>e.target.classList.toggle('active', e.isIntersecting)),
  {threshold:.15}
);

/* ───────────── 5. CONSTRUCTION UI ───────────────────────────────── */
function buildSections(){
  SLOTS.forEach(s=>{
    const sec=document.createElement('section');
    sec.className='slot reveal'; sec.dataset.slot=s.id;
    sec.innerHTML=`<h2><i data-lucide="folder"></i>${s.label}</h2><ul class="task-list"></ul>`;
    lists.appendChild(sec);
    revealObs.observe(sec);
  });
}

function renderTasks(){
  document.querySelectorAll('.task-list').forEach(u=>u.innerHTML='');

  TASKS.forEach((t,i)=>{
    const li=document.createElement('li');
    li.className=`task reveal delay-${i%6}`+(doneSet.has(i)?' completed':'');
    li.dataset.i=i;
    li.innerHTML=`
      <span class="label">${t.text}</span>
      <button class="note-btn" aria-label="Notes" data-i="${i}">
        <i data-lucide="file-text"></i>
      </button>`;
    li.addEventListener('click',toggleTask);
    li.querySelector('.note-btn').addEventListener('click',e=>{
      e.stopPropagation(); openNote(i);
    });
    document.querySelector(`section[data-slot="${t.slot}"] ul`).appendChild(li);
    revealObs.observe(li);
  });

  lucide.createIcons();
}

/* ───────────── 6. PROGRESSION & TOGGLE ───────────────────────────── */
function updateProgress(pulse=false){
  const pct=Math.round(doneSet.size/TASKS.length*100);
  progressBar.style.width=pct+'%';
  progressLbl.textContent=pct+' %';
  if(pulse){
    progressBar.classList.remove('pulse'); void progressBar.offsetWidth;
    progressBar.classList.add('pulse');
  }
}

function toggleTask(e){
  const i=+e.currentTarget.dataset.i;
  doneSet.has(i)?doneSet.delete(i):doneSet.add(i);
  saveState();
  e.currentTarget.classList.toggle('completed');
  updateProgress(true);
}

/* ───────────── 7. SÉLECTEUR CATÉGORIE CUSTOM ─────────────────────── */
catOptions.innerHTML = CATEGORIES.map(c=>`<li>${c}</li>`).join('');
let catMenuOpen=false;

catDisplay.addEventListener('click',()=>{
  catMenuOpen=!catMenuOpen;
  catOptions.classList.toggle('hidden',!catMenuOpen);
});

catOptions.addEventListener('click',e=>{
  if(e.target.tagName!=='LI') return;
  setCategory(e.target.textContent);
  catMenuOpen=false;catOptions.classList.add('hidden');
});

/* fermer menu si clic hors cat-wrapper */
document.addEventListener('click',e=>{
  if(!catDisplay.parentElement.contains(e.target)){
    catMenuOpen=false;catOptions.classList.add('hidden');
  }
});

function setCategory(val){
  catDisplayText.textContent=val;
  [...catOptions.children].forEach(li=>li.classList.toggle('sel', li.textContent===val));
}

/* ───────────── 8. MODAL NOTE ─────────────────────────────────────── */
let currentIdx=null;

function openNote(i){
  currentIdx=i;
  noteTaskLbl.textContent=TASKS[i].text;
  userTA.value=notes[i]||'';
  setCategory(cats[i]||CATEGORIES.at(-1));
  noteModal.classList.remove('hidden');
  userTA.focus();
}

function closeNote(){
  if(currentIdx!==null){
    const text=userTA.value.trim();
    const cat=catDisplayText.textContent;
    if(text){
      notes[currentIdx]=text;
      cats[currentIdx]=cat;
    }else{
      delete notes[currentIdx];
      delete cats[currentIdx];
    }
    saveState();
    currentIdx=null;
  }
  noteModal.classList.add('hidden');
  catMenuOpen=false;catOptions.classList.add('hidden');
}

closeNoteBtn.addEventListener('click',closeNote);
noteModal.addEventListener('click',e=>{if(e.target===noteModal)closeNote();});

/* ───────────── 9. MODAL RÉSUMÉ ───────────────────────────────────── */
function buildReport(){
  const bucket={};CATEGORIES.forEach(c=>bucket[c]=[]);
  Object.keys(notes).forEach(i=>{
    const cat=cats[i]||CATEGORIES.at(-1);
    bucket[cat].push(notes[i]);
  });

  let txt=`SHIFT du : ${new Date().toLocaleDateString('fr-FR')}\n\n`;
  CATEGORIES.forEach(cat=>{
    txt+=`- ${cat} :\n`;
    const arr=bucket[cat];
    (arr.length?arr:['']).forEach(n=>txt+=`   • ${n.replace(/\n/g,' ')}\n`);
  });
  txt+='\nSignature\n';

  reportTA.value=txt;
  copyReport.textContent='Copier';
  reportModal.classList.remove('hidden');
}

summaryBtn.addEventListener('click',buildReport);
copyReport.addEventListener('click',()=>{
  navigator.clipboard.writeText(reportTA.value).then(()=>{
    copyReport.textContent='Copié !';
  });
});
closeReport.addEventListener('click',()=>reportModal.classList.add('hidden'));

/* ───────────── 10. INTRO & RESET ─────────────────────────────────── */
enterBtn.addEventListener('click',()=>{
  intro.classList.add('fade-out');
  appBar.classList.add('show');
});
intro.addEventListener('keydown',e=>{if(e.key==='Enter')enterBtn.click();});
todayLbl.textContent=new Date().toLocaleDateString('fr-FR',{
  weekday:'long',year:'numeric',month:'long',day:'numeric'
});

resetBtn.addEventListener('click',()=>{
  resetBtn.classList.add('reset-spin');
  setTimeout(()=>resetBtn.classList.remove('reset-spin'),600);

  doneSet.clear(); Object.keys(notes).forEach(k=>delete notes[k]);
  Object.keys(cats).forEach(k=>delete cats[k]);
  saveState(); renderTasks(); updateProgress(true);
});

/* ───────────── 11. RÉVÉLATION SUR AJOUTS ─────────────────────────── */
new MutationObserver(()=>{
  document.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));
}).observe(lists,{childList:true,subtree:true});

/* ───────────── 12. INIT ──────────────────────────────────────────── */
buildSections();
renderTasks();
updateProgress();

/* fin IIFE */})();