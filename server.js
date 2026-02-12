const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Game state storage
const rooms = new Map();
const players = new Map(); // socketId -> {roomCode, playerName}

// Generate unique room code
function generateRoomCode() {
    return 'CHEM' + Math.floor(Math.random() * 9000 + 1000);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('====================================');
    console.log('New client connected:', socket.id);
    console.log('Transport:', socket.conn.transport.name);
    console.log('Client address:', socket.handshake.address);
    console.log('====================================');

    // Send confirmation back to client
    socket.emit('connectionConfirmed', { 
        socketId: socket.id,
        message: 'Connected to ChemRace server' 
    });

    // Test message handler
    socket.on('testMessage', (data) => {
        console.log('📨 Test message received:', data);
        socket.emit('testResponse', { 
            received: data, 
            serverTime: Date.now(),
            message: 'Server is working!' 
        });
        console.log('📤 Test response sent');
    });

    // Create a new room
    socket.on('createRoom', ({ playerName, difficulty }) => {
        console.log('=== CREATE ROOM REQUEST ===');
        console.log('Player name:', playerName);
        console.log('Difficulty:', difficulty);
        console.log('Socket ID:', socket.id);
        
        const roomCode = generateRoomCode();
        console.log('Generated room code:', roomCode);
        
        const room = {
            code: roomCode,
            host: socket.id,
            players: [{
                id: socket.id,
                name: playerName,
                score: 0,
                ready: false,
                isHost: true
            }],
            difficulty: difficulty,
            gameState: 'waiting', // waiting, playing, finished
            currentRound: 0,
            currentQuestion: null,
            roundStartTime: null
        };

        rooms.set(roomCode, room);
        players.set(socket.id, { roomCode, playerName });
        socket.join(roomCode);

        console.log('Emitting roomCreated event to client');
        socket.emit('roomCreated', {
            roomCode,
            room
        });

        console.log(`Room ${roomCode} created by ${playerName}`);
        console.log('=== END CREATE ROOM ===');
    });

    // Join existing room
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        if (room.gameState !== 'waiting') {
            socket.emit('error', { message: 'Game already in progress' });
            return;
        }

        if (room.players.length >= 8) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }

        const player = {
            id: socket.id,
            name: playerName,
            score: 0,
            ready: false,
            isHost: false
        };

        room.players.push(player);
        players.set(socket.id, { roomCode, playerName });
        socket.join(roomCode);

        // Notify all players in room
        io.to(roomCode).emit('playerJoined', {
            player,
            room
        });

        socket.emit('joinedRoom', { room });

        console.log(`${playerName} joined room ${roomCode}`);
    });

    // Start game (host only)
    socket.on('startGame', ({ roomCode }) => {
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        if (room.host !== socket.id) {
            socket.emit('error', { message: 'Only host can start the game' });
            return;
        }

        if (room.players.length < 1) {
            socket.emit('error', { message: 'Need at least 1 player' });
            return;
        }

        room.gameState = 'playing';
        room.currentRound = 1;

        // Notify all players to start
        io.to(roomCode).emit('gameStarted', { room });

        console.log(`Game started in room ${roomCode}`);
    });

    // Request next question
    socket.on('requestQuestion', ({ roomCode }) => {
        const room = rooms.get(roomCode);

        if (!room) return;

        room.roundStartTime = Date.now();
        
        // Generate question on server side so all players get the same one
        const difficulties = ['easy', 'medium', 'hard'];
        const questionBank = {
            easy: 15,   // Number of questions in each difficulty
            medium: 35,
            hard: 50
        };
        
        // Generate a random question index based on difficulty
        const questionCount = questionBank[room.difficulty] || 15;
        const questionIndex = Math.floor(Math.random() * questionCount);
        
        // Store the question index for this round
        room.currentQuestionIndex = questionIndex;

        // Send signal to start round with the specific question index
        io.to(roomCode).emit('startRound', {
            round: room.currentRound,
            timestamp: room.roundStartTime,
            questionIndex: questionIndex,
            difficulty: room.difficulty
        });
        
        console.log(`Room ${roomCode} - Round ${room.currentRound} - Question ${questionIndex} (${room.difficulty})`);
    });

    // Submit answer
    socket.on('submitAnswer', ({ roomCode, isCorrect, timeTaken, points }) => {
        const room = rooms.get(roomCode);
        const playerData = players.get(socket.id);

        if (!room || !playerData) return;

        // Find player and update score
        const player = room.players.find(p => p.id === socket.id);
        if (player && isCorrect) {
            player.score += points;
        }

        // Broadcast score update to all players
        io.to(roomCode).emit('scoreUpdate', {
            playerId: socket.id,
            playerName: playerData.playerName,
            score: player.score,
            isCorrect,
            timeTaken
        });

        console.log(`${playerData.playerName} answered (${isCorrect ? 'correct' : 'incorrect'}) - Score: ${player.score}`);
    });

    // Next round
    socket.on('nextRound', ({ roomCode }) => {
        const room = rooms.get(roomCode);

        if (!room || room.host !== socket.id) return;

        room.currentRound++;

        if (room.currentRound > 5) {
            // Game finished
            room.gameState = 'finished';
            io.to(roomCode).emit('gameFinished', {
                players: room.players.sort((a, b) => b.score - a.score)
            });
        } else {
            // Continue to next round
            io.to(roomCode).emit('proceedToNextRound', {
                round: room.currentRound
            });
        }
    });

    // Player ready for next round
    socket.on('playerReady', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.ready = true;
        }

        // Check if all players are ready
        const allReady = room.players.every(p => p.ready);
        
        if (allReady) {
            // Reset ready status
            room.players.forEach(p => p.ready = false);
            
            room.currentRound++;

            if (room.currentRound > 5) {
                room.gameState = 'finished';
                io.to(roomCode).emit('gameFinished', {
                    players: room.players.sort((a, b) => b.score - a.score)
                });
            } else {
                room.roundStartTime = Date.now();
                io.to(roomCode).emit('startRound', {
                    round: room.currentRound,
                    timestamp: room.roundStartTime
                });
            }
        } else {
            // Notify waiting for other players
            io.to(roomCode).emit('waitingForPlayers', {
                readyCount: room.players.filter(p => p.ready).length,
                totalCount: room.players.length
            });
        }
    });

    // Get room list (for lobby)
    socket.on('getRooms', () => {
        const availableRooms = Array.from(rooms.values())
            .filter(room => room.gameState === 'waiting')
            .map(room => ({
                code: room.code,
                playerCount: room.players.length,
                difficulty: room.difficulty,
                hostName: room.players[0].name
            }));

        socket.emit('roomsList', { rooms: availableRooms });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const playerData = players.get(socket.id);

        if (playerData) {
            const { roomCode, playerName } = playerData;
            const room = rooms.get(roomCode);

            if (room) {
                // Remove player from room
                room.players = room.players.filter(p => p.id !== socket.id);

                if (room.players.length === 0) {
                    // Delete empty room
                    rooms.delete(roomCode);
                    console.log(`Room ${roomCode} deleted (empty)`);
                } else {
                    // If host left, assign new host
                    if (room.host === socket.id) {
                        room.host = room.players[0].id;
                        room.players[0].isHost = true;
                    }

                    // Notify remaining players
                    io.to(roomCode).emit('playerLeft', {
                        playerId: socket.id,
                        playerName,
                        room
                    });
                }
            }

            players.delete(socket.id);
        }

        console.log('Client disconnected:', socket.id);
    });
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', rooms: rooms.size, players: players.size });
});

// Serve the game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'organic_chem_game.html'));
});

server.listen(PORT, () => {
    console.log(`ChemRace server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to play`);
});
