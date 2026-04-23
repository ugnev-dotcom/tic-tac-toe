const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { addToQueue, handleDisconnect, activeGames, socketRoom } = require('./matchmaking');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('find-game', () => {
    addToQueue(socket, io);
  });

  socket.on('make-move', ({ cellIndex }) => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;

    const room = activeGames.get(roomId);
    if (!room) return;

    const { game, players } = room;
    const symbol = Object.keys(players).find((s) => players[s] === socket.id);
    if (symbol !== game.getState().currentTurn) return;

    const result = game.makeMove(cellIndex);
    if (!result.valid) return;

    io.to(roomId).emit('move-made', {
      cellIndex,
      symbol: result.symbol,
      board: result.board,
      currentTurn: game.getState().currentTurn,
    });

    if (result.winner) {
      io.to(roomId).emit('game-over', { winner: result.winner });
    } else if (result.isDraw) {
      io.to(roomId).emit('game-over', { winner: null });
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    handleDisconnect(socket, io);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
