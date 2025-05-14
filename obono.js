const SLOTS = [
  { id: '21h45-22h', label: '21h45 – 22h' },
  { id: '22h-00h', label: '22h – 00h' },
  { id: '00h-5h', label: '00h – 05h' },
  { id: '5h30-6h30', label: '05h30 – 06h30' },
  { id: '6h-7h', label: '06h – 07h' },
  { id: '7h-7h15', label: '07h – 07h15' },
  { id: 'tout', label: 'Pendant tout le shift' }
];

const TASKS = [
  ['21h45-22h', "Passation + imprimer état d'occupation et hébergement + caisse"],
  ['22h-00h', 'Ronde intérieure/extérieure, ranger terrasse, vider cendriers'],
  ['22h-00h', 'Vérifier chambres derniers clients (odeur/température)'],
  ['22h-00h', "Imprimer l'état d'occupation"],
  ['22h-00h', 'Éteindre la musique'],
  ['22h-00h', 'Effectuer les derniers check-in'],
  ['22h-00h', 'Chercher chariot linge piscine (nettoyage / séchage / pliage)'],
  ['22h-00h', "Fermer la porte d'entrée (clé bureautique)"],
  ['00h-5h', 'Nettoyage lobby, WC réception, bibliothèque, salon manoir'],
  ['00h-5h', 'Pliage serviettes piscine et réassort'],
  ['00h-5h', "Remplir bouteilles d'eau pour les étages"],
  ['00h-5h', 'Clôture journalière + main courante (≥ 2 h)'],
  ['00h-5h', 'Envoyer rapports Medialog'],
  ['00h-5h', '(Mercredi) Imprimer listing Spa week-end'],
  ['00h-5h', 'Nettoyer gobelets salle de bain'],
  ['00h-5h', 'Ronde générale (finir par le spa)'],
  ['00h-5h', 'Bon boissons'],
  ['5h30-6h30', 'Cuissons petits-déjeuners'],
  ['5h30-6h30', 'Mise en place buffet PDJ'],
  ['5h30-6h30', 'Relever températures frigos / congèles'],
  ['5h30-6h30', 'Rapport de shift Slack'],
  ['6h-7h', "Imprimer l'état d'hébergement"],
  ['6h-7h', 'VAD Expedia'],
  ['6h-7h', 'Early PDJ (si besoin)'],
  ['6h-7h', 'Vérifier arrivées du jour'],
  ['6h-7h', 'Transmettre consignes PDJ (6 h 45)'],
  ['6h-7h', "Ouvrir portes de l'hôtel + entrée"],
  ['7h-7h15', 'Caisse avec la personne du matin'],
  ['7h-7h15', 'Passation des consignes'],
  ['tout', "Sécurité de l'établissement"],
  ['tout', 'Répondre aux demandes clients'],
  ['tout', 'Intégrations / réservations (si temps)'],
  ['tout', 'Traiter emails (si temps)'],
  ['tout', 'Tâches du cahier de consignes'],
  ['tout', 'Entretien réception & lobby'],
  ['tout', '(Dim.-lun.) Vérif réservations J+8 + mail rappel'],
  ['tout', 'Si calme : voir doc “De quoi s’occuper”'],
  ['tout', 'Traçabilité nettoyage réception']
].map(([slot, text]) => ({ slot, text }));

const DONE_KEY = 'obono.done';
const loadDone = () => new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]'));
const saveDone = set => localStorage.setItem(DONE_KEY, JSON.stringify([...set]));

let doneSet = loadDone();

const lists = document.getElementById('lists');
const progressBar = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');

SLOTS.forEach(s => {
  const section = document.createElement('section');
  section.className = 'slot';
  section.dataset.slot = s.id;
  section.innerHTML = `<h2><i data-lucide="clock"></i>${s.label}</h2><ul class="task-list"></ul>`;
  lists.appendChild(section);
});

function renderTasks() {
  document.querySelectorAll('.task-list').forEach(ul => ul.innerHTML = '');

  TASKS.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = 'task' + (doneSet.has(i) ? ' completed' : '');
    li.dataset.i = i;
    li.innerHTML = `<span class="label">${t.text}</span>`;
    li.addEventListener('click', () => toggle(i, li));
    document.querySelector(`section[data-slot="${t.slot}"] .task-list`).appendChild(li);
  });

  lucide.createIcons();
}

function toggle(i, li) {
  if (doneSet.has(i)) {
    doneSet.delete(i);
    li.classList.remove('completed');
  } else {
    doneSet.add(i);
    li.classList.add('completed');
  }
  saveDone(doneSet);
  updateProgress();
}

function updateProgress() {
  const pct = Math.round(doneSet.size / TASKS.length * 100);
  progressBar.style.width = pct + '%';
  progressLabel.textContent = pct + ' %';
}

document.getElementById('today').textContent =
  new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

document.getElementById('enterBtn').addEventListener('click', () => {
  const intro = document.getElementById('intro');
  const appBar = document.querySelector('.app-bar');
  intro.classList.add('fade-out');
  intro.addEventListener('transitionend', () => {
    intro.remove();
    appBar.classList.remove('hidden');
  });
});

renderTasks();
updateProgress();