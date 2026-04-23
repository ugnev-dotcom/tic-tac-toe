const { randomUUID } = require('crypto');
const TicTacToeGame = require('./game');

const queue = [];
const activeGames = new Map(); // roomId -> { game, players: { X: socketId, O: socketId } }
const socketRoom = new Map();  // socketId -> roomId

function addToQueue(socket, io) {
  if (queue.length > 0) {
    const opponent = queue.shift();

    const roomId = randomUUID();
    const symbols = Math.random() < 0.5 ? ['X', 'O'] : ['O', 'X'];
    const [opponentSymbol, joinerSymbol] = symbols;

    opponent.join(roomId);
    socket.join(roomId);

    const game = new TicTacToeGame();
    activeGames.set(roomId, {
      game,
      players: { [opponentSymbol]: opponent.id, [joinerSymbol]: socket.id },
    });
    socketRoom.set(opponent.id, roomId);
    socketRoom.set(socket.id, roomId);

    opponent.emit('game-start', { symbol: opponentSymbol, roomId });
    socket.emit('game-start', { symbol: joinerSymbol, roomId });
  } else {
    queue.push(socket);
    socket.emit('waiting');
  }
}

function removeFromQueue(socket) {
  const index = queue.indexOf(socket);
  if (index !== -1) {
    queue.splice(index, 1);
  }
}

function handleDisconnect(socket, io) {
  removeFromQueue(socket);

  const roomId = socketRoom.get(socket.id);
  if (!roomId) return;

  socketRoom.delete(socket.id);

  const room = activeGames.get(roomId);
  if (!room) return;

  // Notify opponent
  for (const [, socketId] of Object.entries(room.players)) {
    if (socketId !== socket.id) {
      io.to(socketId).emit('opponent-left');
      socketRoom.delete(socketId);
      break;
    }
  }

  activeGames.delete(roomId);
}

module.exports = { addToQueue, removeFromQueue, handleDisconnect, activeGames, socketRoom };
