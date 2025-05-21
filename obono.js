/* =======================================================================
   O  B  O  N  O   ·   Night-Shift   (v5)
   -----------------------------------------------------------------------
   • Tâches cochables
   • Notes catégorisées
   • Résumé auto-généré (éditable)
   • Données conservées en local-storage
   ==================================================================== */
(() => {               // IIFE ⇒ tout reste proprement dans une closure
/* ────────────────────────── 1. CONFIG ─────────────────────────────── */

const SLOTS = [
  {id:'arrivee',     label:'Arrivée'},
  {id:'soiree',      label:'Soirée'},
  {id:'nuit',        label:'Nuit'},
  {id:'matinee',     label:'Matinée'},
  {id:'finmatinee',  label:'Fin de matinée'}
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

/* ──────────────────────── 2. LOCAL-STORAGE ────────────────────────── */

const DONE_KEY = 'obono.done';
const NOTE_KEY = 'obono.notes';
const CAT_KEY  = 'obono.cats';

const doneSet = new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]'));
const notes   = JSON.parse(localStorage.getItem(NOTE_KEY) || '{}');
const cats    = JSON.parse(localStorage.getItem(CAT_KEY)  || '{}');

function saveState(){
  localStorage.setItem(DONE_KEY, JSON.stringify([...doneSet]));
  localStorage.setItem(NOTE_KEY, JSON.stringify(notes));
  localStorage.setItem(CAT_KEY , JSON.stringify(cats));
}

/* ───────────────────────── 3. RÉFÉRENCES DOM ──────────────────────── */

const elLists      = document.getElementById('lists');
const elProgress   = document.getElementById('progressBar');
const elProgressLb = document.getElementById('progressLabel');
const elAppBar     = document.querySelector('.app-bar');
const elIntro      = document.getElementById('intro');
const elEnterBtn   = document.getElementById('enterBtn');

const elNoteModal  = document.getElementById('noteModal');
const elNoteTask   = document.getElementById('noteTask');
const elUserNote   = document.getElementById('userNote');
const elCatSel     = document.getElementById('noteCategory');
const elCloseNote  = document.getElementById('closeModal');

const elSummaryBtn = document.getElementById('summaryBtn');
const elReportModal = document.getElementById('reportModal');
const elReportOut   = document.getElementById('reportOut');
const elCopyReport  = document.getElementById('copyReport');
const elCloseReport = document.getElementById('closeReport');

const elResetBtn   = document.getElementById('resetBtn');
const elToday      = document.getElementById('today');

/* ───────────────────────── 4. OBSERVER REVEAL ─────────────────────── */

const revealObs = new IntersectionObserver(
  entries => entries.forEach(e => e.target.classList.toggle('active', e.isIntersecting)),
  { threshold: .15 }
);

/* ───────────────────────── 5. CONSTRUCTION UI ─────────────────────── */

function buildSections(){
  SLOTS.forEach(slot=>{
    const section = document.createElement('section');
    section.className = 'slot reveal';
    section.dataset.slot = slot.id;
    section.innerHTML = `<h2><i data-lucide="folder"></i>${slot.label}</h2><ul class="task-list"></ul>`;
    elLists.appendChild(section);
    revealObs.observe(section);
  });
}

function renderTasks(){
  document.querySelectorAll('.task-list').forEach(ul=>ul.innerHTML='');

  TASKS.forEach((task, idx)=>{
    const li = document.createElement('li');
    li.className = `task reveal delay-${idx%6}` + (doneSet.has(idx) ? ' completed':'');
    li.dataset.i = idx;

    li.innerHTML = `
      <span class="label">${task.text}</span>
      <button class="note-btn" title="Notes" aria-label="Notes" data-i="${idx}">
        <i data-lucide="file-text"></i>
      </button>
    `;

    li.addEventListener('click', handleToggle);
    li.querySelector('.note-btn').addEventListener('click', e=>{
      e.stopPropagation(); openNote(idx);
    });

    document.querySelector(`section[data-slot="${task.slot}"] ul`).appendChild(li);
    revealObs.observe(li);
  });

  lucide.createIcons();
}

/* ─────────────────────── 6. TÂCHES & PROGRÈS ──────────────────────── */

function handleToggle(e){
  const i = +e.currentTarget.dataset.i;
  doneSet.has(i) ? doneSet.delete(i) : doneSet.add(i);
  saveState();
  e.currentTarget.classList.toggle('completed');
  updateProgress(true);
}

function updateProgress(pulse=false){
  const pct = Math.round(doneSet.size / TASKS.length * 100);
  elProgress.style.width = pct + '%';
  elProgressLb.textContent = pct + ' %';
  if(pulse){
    elProgress.classList.remove('pulse'); void elProgress.offsetWidth;
    elProgress.classList.add('pulse');
  }
}

/* ─────────────────────── 7. MODAL NOTE ────────────────────────────── */

elCatSel.innerHTML = CATEGORIES.map(c=>`<option>${c}</option>`).join('');
let currentIdx = null;

function openNote(i){
  currentIdx = i;
  elNoteTask.textContent = TASKS[i].text;
  elUserNote.value = notes[i] || '';
  elCatSel.value = cats[i] || CATEGORIES.at(-1);
  elNoteModal.classList.remove('hidden');
  elUserNote.focus();
}

function closeNote(){
  if(currentIdx !== null){
    const val = elUserNote.value.trim();
    const cat = elCatSel.value;
    if(val){
      notes[currentIdx] = val;
      cats[currentIdx]  = cat;
    }else{
      delete notes[currentIdx];
      delete cats[currentIdx];
    }
    saveState();
    currentIdx = null;
  }
  elNoteModal.classList.add('hidden');
}

elCloseNote.addEventListener('click', closeNote);
elNoteModal.addEventListener('click', e=>{ if(e.target === elNoteModal) closeNote(); });

/* ─────────────────────── 8. MODAL RÉSUMÉ ──────────────────────────── */

function buildReport(){
  // regrouper les notes par catégorie
  const bucket = {}; CATEGORIES.forEach(c=>bucket[c]=[]);
  Object.keys(notes).forEach(i=>{
    const cat = cats[i] || CATEGORIES.at(-1);
    bucket[cat].push(notes[i]);
  });

  // composer la chaîne finale
  let txt = `SHIFT du : ${new Date().toLocaleDateString('fr-FR')}\n\n`;
  CATEGORIES.forEach(cat=>{
    txt += `- ${cat} :\n`;
    const arr = bucket[cat];
    if(arr.length){
      arr.forEach(n=>txt += `   • ${n.replace(/\n/g,' ')}\n`);
    } else {
      txt += '   •\n';
    }
  });
  txt += '\nSignature\n';

  elReportOut.value = txt;
  elCopyReport.textContent = 'Copier';
  elReportModal.classList.remove('hidden');
}

elSummaryBtn.addEventListener('click', buildReport);
elCopyReport.addEventListener('click', ()=>{
  navigator.clipboard.writeText(elReportOut.value).then(()=>{
    elCopyReport.textContent = 'Copié !';
  });
});
elCloseReport.addEventListener('click', ()=>elReportModal.classList.add('hidden'));

/* ─────────────────────── 9. INTRO & RESET ─────────────────────────── */

elEnterBtn.addEventListener('click', ()=>{
  elIntro.classList.add('fade-out');
  elAppBar.classList.add('show');
});
elIntro.addEventListener('keydown', e=>{
  if(e.key === 'Enter') elEnterBtn.click();
});
elToday.textContent = new Date().toLocaleDateString('fr-FR',{
  weekday:'long', year:'numeric', month:'long', day:'numeric'
});

elResetBtn.addEventListener('click', ()=>{
  elResetBtn.classList.add('reset-spin');
  setTimeout(()=>elResetBtn.classList.remove('reset-spin'), 600);

  doneSet.clear();
  Object.keys(notes).forEach(k=>delete notes[k]);
  Object.keys(cats ).forEach(k=>delete cats [k]);
  saveState();
  renderTasks();
  updateProgress(true);
});

/* ─────────────────────── 10. INIT ─────────────────────────────────── */

buildSections();
renderTasks();
updateProgress();

/* IIFE end */})();