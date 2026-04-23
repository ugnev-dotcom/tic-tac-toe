const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const socket = io();

const statusEl = document.getElementById('status');
const findGameBtn = document.getElementById('find-game-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const cells = document.querySelectorAll('.cell');

let mySymbol = null;
let roomId = null;
let currentTurn = null;
let board = Array(9).fill(null);

// ── Helpers ──────────────────────────────────────────────────────────────────

function setStatus(text, turnSymbol = null) {
  statusEl.textContent = text;
  statusEl.className = '';
  if (turnSymbol) {
    statusEl.classList.add(`turn-${turnSymbol}`, 'pulsing');
  }
}

function setSearching(searching) {
  findGameBtn.disabled = searching;
  findGameBtn.classList.toggle('searching', searching);
}

function setBoardEnabled(enabled) {
  cells.forEach((cell) => {
    cell.disabled = !enabled || cell.textContent !== '';
  });
}

function placeSymbol(index, symbol) {
  const cell = cells[index];
  cell.textContent = symbol;
  cell.classList.add(symbol, 'placed');
  cell.disabled = true;
  cell.addEventListener('animationend', () => cell.classList.remove('placed'), { once: true });
}

function resetBoard() {
  board = Array(9).fill(null);
  cells.forEach((cell) => {
    cell.textContent = '';
    cell.className = 'cell';
    cell.disabled = true;
  });
  playAgainBtn.hidden = true;
  mySymbol = null;
  roomId = null;
  currentTurn = null;
}

function highlightWinner(winnerSymbol) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] === winnerSymbol && board[b] === winnerSymbol && board[c] === winnerSymbol) {
      [a, b, c].forEach((i) => cells[i].classList.add('winner'));
      break;
    }
  }
}

function updateTurnStatus(turn) {
  if (turn === mySymbol) {
    setStatus('Your turn', turn);
  } else {
    setStatus("Opponent's turn", turn);
  }
}

// ── UI events ─────────────────────────────────────────────────────────────────

findGameBtn.addEventListener('click', () => {
  setSearching(true);
  resetBoard();
  setStatus('Searching for opponent...');
  socket.emit('find-game');
});

playAgainBtn.addEventListener('click', () => {
  playAgainBtn.hidden = true;
  setSearching(true);
  resetBoard();
  setStatus('Searching for opponent...');
  socket.emit('find-game');
});

cells.forEach((cell) => {
  cell.addEventListener('click', () => {
    if (currentTurn !== mySymbol) return;
    const index = parseInt(cell.dataset.index);
    socket.emit('make-move', { cellIndex: index, roomId });
  });
});

// ── Socket events ─────────────────────────────────────────────────────────────

socket.on('waiting', () => {
  setStatus('Waiting for another player...');
});

socket.on('game-start', ({ symbol, roomId: id }) => {
  mySymbol = symbol;
  roomId = id;
  currentTurn = 'X';
  setSearching(false);
  setStatus(currentTurn === mySymbol ? 'Your turn (X goes first)' : "Opponent's turn (X goes first)", currentTurn);
  setBoardEnabled(currentTurn === mySymbol);
});

socket.on('move-made', ({ cellIndex, symbol, board: updatedBoard, currentTurn: nextTurn }) => {
  board = updatedBoard;
  placeSymbol(cellIndex, symbol);
  currentTurn = nextTurn;
  setBoardEnabled(currentTurn === mySymbol);
  updateTurnStatus(currentTurn);
});

socket.on('game-over', ({ winner }) => {
  setBoardEnabled(false);
  setStatus(''); // clear pulse before setting result
  if (winner) {
    highlightWinner(winner);
    setStatus(winner === mySymbol ? 'You win!' : 'You lose!');
  } else {
    setStatus("It's a draw!");
  }
  setSearching(false);
  playAgainBtn.hidden = false;
});

socket.on('opponent-left', () => {
  setBoardEnabled(false);
  setStatus('Opponent disconnected.');
  setSearching(false);
  playAgainBtn.hidden = false;
});
