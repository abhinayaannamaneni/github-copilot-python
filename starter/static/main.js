// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let hintedCells = new Set();
let timerInterval = null;
let elapsedSeconds = 0;
let currentDifficulty = 'medium';
let darkMode = localStorage.getItem('sudoku_dark_mode') === 'true';

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function initializeDarkMode() {
  if (darkMode) {
    document.body.classList.add('dark-mode');
    updateDarkModeButton();
  }
}

function toggleDarkMode() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('sudoku_dark_mode', darkMode);
  updateDarkModeButton();
}

function updateDarkModeButton() {
  const btn = document.getElementById('dark-mode-toggle');
  btn.innerText = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  document.getElementById('timer').innerText = `Time: ${formatTime(elapsedSeconds)}`;
}

function getScores() {
  const scores = localStorage.getItem('sudoku_scores');
  return scores ? JSON.parse(scores) : [];
}

function saveScore(playerName, time, difficulty) {
  const scores = getScores();
  scores.push({ playerName, time, difficulty, timestamp: new Date().getTime() });
  scores.sort((a, b) => a.time - b.time);
  localStorage.setItem('sudoku_scores', JSON.stringify(scores.slice(0, 100)));
  displayScoreboard();
}

function displayScoreboard(filterDifficulty = '') {
  const scores = getScores();
  const filtered = filterDifficulty 
    ? scores.filter(s => s.difficulty === filterDifficulty)
    : scores;
  const top10 = filtered.slice(0, 10);
  
  const scoreList = document.getElementById('score-list');
  scoreList.innerHTML = '';
  
  top10.forEach((score, index) => {
    const li = document.createElement('li');
    li.innerText = `${score.playerName} - ${formatTime(score.time)} (${score.difficulty})`;
    scoreList.appendChild(li);
  });
  
  if (top10.length > 0) {
    document.getElementById('scoreboard').style.display = 'block';
  }
}

function promptForPlayerName() {
  const name = prompt('Enter your name for the scoreboard:');
  if (name && name.trim()) {
    saveScore(name.trim(), elapsedSeconds, currentDifficulty);
  }
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  hintedCells = new Set();
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  stopTimer();
  const difficultySelect = document.getElementById('difficulty');
  currentDifficulty = difficultySelect ? difficultySelect.value : 'medium';
  const res = await fetch(`/new?difficulty=${encodeURIComponent(currentDifficulty)}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  document.getElementById('message').innerText = '';
  startTimer();
}

async function getHint() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/hint', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const { row, col, value } = data;
  const idx = row * SIZE + col;
  const inp = inputs[idx];
  inp.value = value;
  inp.disabled = true;
  inp.className = 'sudoku-cell hint';
  hintedCells.add(idx);
  msg.style.color = '#1976d2';
  msg.innerText = 'Hint provided!';
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (incorrect.size === 0) {
    msg.style.color = '#388e3c';
    msg.innerText = `🎉 Congratulations! You solved it in ${formatTime(elapsedSeconds)}!`;
    stopTimer();
    setTimeout(() => promptForPlayerName(), 500);
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

// Wire buttons
window.addEventListener('load', () => {
  initializeDarkMode();
  document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('hint').addEventListener('click', getHint);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('score-filter').addEventListener('change', (e) => {
    displayScoreboard(e.target.value);
  });
  // Load and display scoreboard on page load
  displayScoreboard();
  // initialize
  newGame();
});