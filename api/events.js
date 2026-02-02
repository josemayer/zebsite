const game = require("./services/lobo/game");

const events = (io, socket) => {
  socket.on("disconnecting", () => {
    socket.rooms.forEach((roomCode) => {
      if (roomCode !== socket.id) {
        try {
          const codeStr = String(roomCode);
          const room = game.getRoom(codeStr);

          if (room) {
            const player = room.findPlayerById(socket.id);
            if (player) {
              // If game has started, mark as disconnected but keep in room
              if (room.phase && room.phase !== "LOBBY") {
                player.setConnected(false);
                console.log(`Player ${player.name} disconnected (game in progress)`);
                io.to(codeStr).emit("player_list_update", room.getAllPlayers());
              } else {
                // Game hasn't started, remove player
                game.leaveRoom(codeStr, socket.id);
                const updatedRoom = game.getRoom(codeStr);
                if (updatedRoom) {
                  io.to(codeStr).emit("player_left", updatedRoom.getAllPlayers());
                }
                console.log(`Player ${player.name} left room ${codeStr}`);
              }
            }
          }
        } catch (error) {
          console.error("Disconnect Cleanup Error:", error.message);
        }
      }
    });
  });

  socket.on("kick_player", (data) => {
    const { roomCode, playerId } = data;
    const codeStr = String(roomCode); // Standardize
    try {
      const room = game.kickPlayer(codeStr, playerId, socket.id);
      const playerSocket = io.sockets.sockets.get(playerId);

      if (playerSocket) {
        playerSocket.emit("player_kicked");
        playerSocket.leave(codeStr); // Standardize
      }

      io.to(codeStr).emit("player_left", room.getAllPlayers());
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("create_new_room", (data) => {
    const { roomData, playerData } = data;
    try {
      const room = game.createNewRoom(roomData.capacity, roomData.roles, io);
      const codeStr = String(room.code); // Standardize

      const playerObj = {
        name: playerData.name,
        id: socket.id,
        position: playerData.position,
      };

      game.joinRoom(codeStr, playerObj);
      socket.join(codeStr); // Join as String

      console.log(`[SERVER] Room Created: ${codeStr}. Host joined channel.`);

      socket.emit("room_created", {
        code: room.code, // Frontend can keep number/string as it wants
        capacity: room.capacity,
        players: room.getAllPlayers(),
        roles: room.roles,
        joinedPlayer: playerObj,
      });
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("join_room", (playerData) => {
    const { name, position, roomCode } = playerData;
    const codeStr = String(roomCode); // Standardize IMMEDIATELY
    try {
      const room = game.joinRoom(codeStr, { name, id: socket.id, position });

      socket.join(codeStr); // Join as String
      console.log(`[SERVER] Player ${name} joined channel: ${codeStr}`);

      const player = room.findPlayerById(socket.id);
      const wasReconnecting = player && !player.isConnected;
      
      if (wasReconnecting) {
        player.setConnected(true);
        console.log(`[SERVER] Player ${name} reconnected to room ${codeStr}`);
      }

      socket.emit("room_joined", {
        code: room.code,
        capacity: room.capacity,
        players: room.getAllPlayers(),
        joinedPlayer: { name, id: socket.id, position },
      });

      // Notify all players of updated list
      io.to(codeStr).emit("player_joined", room.getAllPlayers());

      // If game has started and player reconnected, send current state
      if (wasReconnecting && room.phase && room.phase !== "LOBBY") {
        room.broadcastUpdate();
      }
    } catch (error) {
      console.error(`[SERVER] Join Room Error: ${error.message}`);
      socket.emit("error", error.message);
    }
  });

  socket.on("connect", () => {
    // When socket connects/reconnects, check if player needs to be restored
    // This will be handled when they rejoin the room via join_room event
  });

  socket.on("leave_room", (roomCode) => {
    const codeStr = String(roomCode);
    try {
      const room = game.leaveRoom(codeStr, socket.id);
      socket.leave(codeStr);
      socket.emit("room_left");
      if (room) {
        io.to(codeStr).emit("player_left", room.getAllPlayers());
      }
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("game_action", (payload) => {
    // Find the current room the socket is in (excluding its own private room)
    const rooms = Array.from(socket.rooms);
    const roomCode = rooms.find((r) => r !== socket.id);

    if (roomCode) {
      const codeStr = String(roomCode);
      const room = game.getRoom(codeStr);
      if (room) {
        const result = room.handleAction(socket.id, payload);
        if (result && result.message) {
          socket.emit("action_feedback", result.message);
        }
      }
    }
  });

  socket.on("send_chat_message", (data) => {
    const { message } = data;
    if (!message || message.trim().length === 0) return;

    // Find the current room the socket is in (excluding its own private room)
    const rooms = Array.from(socket.rooms);
    const roomCode = rooms.find((r) => r !== socket.id);

    if (roomCode) {
      const codeStr = String(roomCode);
      const room = game.getRoom(codeStr);
      if (room && room.phase === "DAY") {
        const player = room.findPlayerById(socket.id);
        if (player && player.isAlive) {
          const chatMessage = {
            sender: player.name,
            message: message.trim(),
            timestamp: new Date().toISOString(),
          };

          // Add to room's chat history and broadcast message
          room.addChatMessage(chatMessage);
          io.to(codeStr).emit("chat_message", chatMessage);

          // Special rule: drunk role dies instantly if they speak
          try {
            const role = player.role;
            if (role === "drunk") {
              // Chat-caused death handled by room helper; call directly (we know it's implemented)
              room.handleChatDeath(player.id);
              // Broadcast updated game state after the death handling
              room.broadcastUpdate();
            }
          } catch (err) {
            console.error("[SERVER] Error processing drunk chat death:", err);
          }
        }
      }
    }
  });

  socket.on("start_game", (roomCode) => {
    const codeStr = String(roomCode);
    console.log(">>> [SERVER] start_game received for room:", codeStr);
    try {
      const room = game.getRoom(codeStr);
      if (room) {
        console.log(">>> [SERVER] Room found! Starting game logic...");
        room.startGame();
      } else {
        console.log(">>> [SERVER] Room not found for code:", codeStr);
        socket.emit("error", "Sala não encontrada no servidor.");
      }
    } catch (e) {
      console.error(">>> [SERVER] Error in start_game:", e.message);
      socket.emit("error", e.message);
    }
  });
};

module.exports = events;
