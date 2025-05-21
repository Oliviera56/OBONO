/* =====================================================================
   O B O N O · Night-Shift v6  (sélecteur custom & icône claire)
   =================================================================== */
(() => {
/* ---------- CONFIG -------------------------------------------------- */
const CATS = ['Retour client','Délogement','No-show','Caisse','Etages','Technique','Proposition Tarifaire','Autre info importante'];
/* …  SLOTS, TASKS, storage, refs idem v5 … */

/* ---------- CRÉE LE MENU CATÉGORIE ---------------------------------- */
const catDisplay     = document.getElementById('catDisplay');
const catDisplayText = document.getElementById('catDisplayText');
const catOptionsUL   = document.getElementById('catOptions');

catOptionsUL.innerHTML = CATS.map(c=>`<li>${c}</li>`).join('');
let catOpen   = false;
let currentIdx = null;

/* toggle menu */
catDisplay.addEventListener('click', ()=>{
  catOpen = !catOpen;
  catOptionsUL.classList.toggle('hidden', !catOpen);
});

/* clic sur une catégorie */
catOptionsUL.addEventListener('click', e=>{
  if(e.target.tagName!=='LI') return;
  const val = e.target.textContent;
  catSelect(val);
  catOpen=false;
  catOptionsUL.classList.add('hidden');
});

/* sélection programmée (ouverture note) */
function catSelect(val){
  catDisplayText.textContent = val;
  [...catOptionsUL.children].forEach(li=>li.classList.toggle('sel', li.textContent===val));
}

/* ---------- NOTE MODAL (modifié) ----------------------------------- */
function openNote(i){
  currentIdx = i;
  elNoteTask.textContent = TASKS[i].text;
  elUserNote.value = notes[i] || '';
  catSelect(cats[i] || CATS.at(-1));
  elNoteModal.classList.remove('hidden');
  elUserNote.focus();
}

function closeNote(){
  if(currentIdx!==null){
    const noteVal = elUserNote.value.trim();
    const catVal  = catDisplayText.textContent;
    if(noteVal){
      notes[currentIdx]=noteVal;
      cats[currentIdx]=catVal;
    }else{
      delete notes[currentIdx]; delete cats[currentIdx];
    }
    saveState(); currentIdx=null;
  }
  elNoteModal.classList.add('hidden');
  catOpen=false; catOptionsUL.classList.add('hidden');
}
/* close on outside click */
elNoteModal.addEventListener('click', e=>{
  if(e.target===elNoteModal) closeNote();
});

/* ---------- BUILD TASKS (icône note déjà plus claire) -------------- */
/* … même code que v5 pour buildSections, renderTasks, résumé, reset… */

/* ---------- INIT --------------------------------------------------- */
/* buildSections(), renderTasks(), updateProgress() comme avant */
})();