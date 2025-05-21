/* ==========================================================
   O B O N O · Night-Shift – v4
   (curseur neutre, icône claire, sélecteur revu, résumé éditable)
========================================================== */

/* ---------- Config ---------- */
const SLOTS=[
  {id:'arrivee',label:'Arrivée'},
  {id:'soiree',label:'Soirée'},
  {id:'nuit',label:'Nuit'},
  {id:'matinee',label:'Matinée'},
  {id:'finmatinee',label:'Fin de matinée'}
];

const TASKS=[
 ['arrivee','Passation des infos'],['arrivee','Caisse'],['arrivee','Piscine'],
 ['arrivee',"Imprimer l'état d'occupation et d'hébergement"],
 ['soiree','Fermeture du spa (21 h)'],['soiree','Serviettes piscine'],
 ['soiree','Première ronde – chambres non arrivées'],
 ['soiree','Préparer les arrivées du lendemain'],
 ['soiree','Régler le volume musique'],['soiree',"Fermer la porte de l'hôtel"],
 ['soiree','Ronde de fermeture'],
 ['nuit','Trier les tickets resto/bar'],['nuit','Préparer le mail Medialog'],
 ['nuit','Ménage (plus aucun client)'],['nuit','Clôture de caisse à 2 h'],
 ['nuit','Envoyer le mail Medialog'],['nuit','Temps calme'],
 ['matinee',"Ouvrir la porte d'entrée"],['matinee','Mise en place petit-déj'],
 ['matinee','VAD Expedia / Staycation'],['matinee',"Ronde d'ouverture"],
 ['finmatinee','Caisse après clôture matin'],['finmatinee','Sortir les poubelles'],
 ['finmatinee',"Noter l'heure de fin"],['finmatinee','Finito pipo']
].map(([slot,text])=>({slot,text}));

const CATS=['Retour client','Délogement','No-show','Caisse','Etages','Technique','Proposition Tarifaire','Autre info importante'];

/* ---------- Storage ---------- */
const DONE_KEY='obono.done',NOTE_KEY='obono.notes',CAT_KEY='obono.cats';
const done =new Set(JSON.parse(localStorage.getItem(DONE_KEY)||'[]'));
const notes=JSON.parse(localStorage.getItem(NOTE_KEY)||'{}');
const cats =JSON.parse(localStorage.getItem(CAT_KEY) ||'{}');
const save =()=>{localStorage.setItem(DONE_KEY,JSON.stringify([...done]));
                 localStorage.setItem(NOTE_KEY,JSON.stringify(notes));
                 localStorage.setItem(CAT_KEY ,JSON.stringify(cats));};

/* ---------- DOM refs ---------- */
const lists=document.getElementById('lists');
const progressBar=document.getElementById('progressBar'),progressLbl=document.getElementById('progressLabel');
const intro=document.getElementById('intro'),enterBtn=document.getElementById('enterBtn'),appBar=document.querySelector('.app-bar');
const noteModal=document.getElementById('noteModal'),noteTask=document.getElementById('noteTask'),
      userTA=document.getElementById('userNote'),catSel=document.getElementById('noteCategory');
const reportModal=document.getElementById('reportModal'),reportOut=document.getElementById('reportOut');
const resetBtn=document.getElementById('resetBtn'),summaryBtn=document.getElementById('summaryBtn');

/* ---------- Build sections ---------- */
SLOTS.forEach(s=>{
  const sec=document.createElement('section');
  sec.className='slot reveal';sec.dataset.slot=s.id;
  sec.innerHTML=`<h2><i data-lucide="folder"></i>${s.label}</h2><ul class="task-list"></ul>`;
  lists.appendChild(sec);
});

/* ---------- Render tasks ---------- */
function renderTasks(){
  document.querySelectorAll('.task-list').forEach(u=>u.innerHTML='');
  TASKS.forEach((t,i)=>{
    const li=document.createElement('li');
    li.className=`task reveal delay-${i%6}`+(done.has(i)?' completed':'');
    li.dataset.i=i;
    li.innerHTML=`<span class="label">${t.text}</span>
      <button class="note-btn" aria-label="Notes" data-i="${i}">
        <i data-lucide="file-text"></i>
      </button>`;
    li.addEventListener('click',toggleTask);
    li.querySelector('.note-btn').addEventListener('click',e=>{
      e.stopPropagation();openNote(i);
    });
    document.querySelector(`section[data-slot="${t.slot}"] ul`).appendChild(li);
  });
  lucide.createIcons();
}

/* ---------- Task toggle ---------- */
function toggleTask(e){
  const i=+e.currentTarget.dataset.i;
  done.has(i)?done.delete(i):done.add(i);
  save();e.currentTarget.classList.toggle('completed');
  updateProgress(true);
}

/* ---------- Progress ---------- */
function updateProgress(pulse=false){
  const pct=Math.round(done.size/TASKS.length*100);
  progressBar.style.width=pct+'%';progressLbl.textContent=pct+' %';
  if(pulse){progressBar.classList.remove('pulse');void progressBar.offsetWidth;
            progressBar.classList.add('pulse');}
}

/* ---------- Note modal ---------- */
catSel.innerHTML=CATS.map(c=>`<option>${c}</option>`).join('');
let current=null;
function openNote(i){
  current=i;noteTask.textContent=TASKS[i].text;
  userTA.value=notes[i]||'';catSel.value=cats[i]||CATS.at(-1);
  noteModal.classList.remove('hidden');
}
function closeNote(){
  if(current!==null){
    const v=userTA.value.trim(),c=catSel.value;
    if(v){notes[current]=v;cats[current]=c;}else{delete notes[current];delete cats[current];}
    save();current=null;
  }
  noteModal.classList.add('hidden');
}
document.getElementById('closeModal').addEventListener('click',closeNote);
noteModal.addEventListener('click',e=>{if(e.target===noteModal)closeNote();});

/* ---------- Summary (rapport) ---------- */
function buildReport(){
  const bucket={};CATS.forEach(c=>bucket[c]=[]);
  Object.keys(notes).forEach(i=>{
    const cat=cats[i]||CATS.at(-1);bucket[cat].push(notes[i]);
  });
  let txt=`SHIFT du : ${new Date().toLocaleDateString('fr-FR')}\n\n`;
  CATS.forEach(c=>{
    txt+=`- ${c} :\n`;
    bucket[c].length?bucket[c].forEach(n=>txt+=`   • ${n.replace(/\n/g,' ')}\n')
                    :txt+='   •\n';
  });
  txt+='\nSignature\n';
  reportOut.value=txt;
  document.getElementById('copyReport').textContent='Copier';
  reportModal.classList.remove('hidden');
}
summaryBtn.addEventListener('click',buildReport);

document.getElementById('copyReport').addEventListener('click',()=>{
  navigator.clipboard.writeText(reportOut.value).then(()=>{
    document.getElementById('copyReport').textContent='Copié !';
  });
});
document.getElementById('closeReport').addEventListener('click',
  ()=>reportModal.classList.add('hidden'));

/* ---------- Intro + reset ---------- */
enterBtn.addEventListener('click',()=>{intro.classList.add('fade-out');appBar.classList.add('show');});
intro.addEventListener('keydown',e=>{if(e.key==='Enter')enterBtn.click();});
document.getElementById('today').textContent=
  new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
resetBtn.addEventListener('click',()=>{
  resetBtn.classList.add('reset-spin');setTimeout(()=>resetBtn.classList.remove('reset-spin'),600);
  done.clear();for(const k of Object.keys(notes))delete notes[k];
  for(const k of Object.keys(cats ))delete cats [k];
  save();renderTasks();updateProgress(true);
});

/* ---------- Intersection reveal ---------- */
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>e.target.classList.toggle('active',e.isIntersecting));
},{threshold:.15});
new MutationObserver(()=>document.querySelectorAll('.reveal').forEach(el=>obs.observe(el)))
  .observe(lists,{childList:true,subtree:true});

/* ---------- Init ---------- */
renderTasks();updateProgress();