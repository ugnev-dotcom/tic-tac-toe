# Tic Tac Toe

Real-time multiplayer Tic Tac Toe in the browser, powered by WebSockets.

## How to Play

1. Open the game and click **Find Game** — you'll be matched with the next available player.
2. You're randomly assigned **X** or **O**. X always goes first.
3. Take turns clicking cells. The first to get three in a row wins.
4. If all nine cells fill without a winner, it's a draw.
5. Click **Play Again** to jump straight into a new match.

## Tech Stack

- **Node.js** — server runtime
- **Express** — serves static files
- **Socket.io** — real-time bidirectional communication
- **HTML / CSS / JavaScript** — no frameworks, no build step

## Run Locally

```bash
git clone <repo-url>
cd tic-tac-toe
npm install
node server.js
```

Open [http://localhost:3000](http://localhost:3000) in two browser tabs to play against yourself.

## How It Works

The server maintains all game state — board, turn order, and win detection. The browser never trusts itself to validate a move; it only sends a cell index and waits for the server's verdict.

When two players click **Find Game**, the matchmaking module pairs them into a private Socket.io room. All game events (`game-start`, `move-made`, `game-over`) are emitted only to that room, so multiple games can run in parallel without interference.

If a player disconnects mid-game, the opponent is notified immediately and can search for a new match.
