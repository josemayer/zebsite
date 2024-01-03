const game = require("./services/lobo/game");

const events = (io, socket) => {
  socket.on("disconnecting", (reason) => {
    if (reason != "transport close") {
      const rooms = socket.rooms;
      rooms.forEach((room) => {
        try {
          if (room !== socket.id) {
            const roomObj = game.leaveRoom(room, socket.id);
            socket.leave(room);
            socket.broadcast.to(room).emit("player_left", roomObj.players);
          }
        } catch (error) {
          console.error(error.message);
        }
      });
    }
  });

  socket.on("create_new_room", (data) => {
    const { roomData, playerData } = data;
    const { name, position } = playerData;
    const { capacity, roles } = roomData;

    try {
      const room = game.createNewRoom(capacity, roles);
      const id = socket.id;

      const playerObj = {
        name: name,
        id: id,
        position: position,
      };

      game.joinRoom(room.code, playerObj);
      socket.join(room.code);

      socket.emit("room_created", { code: room.code, players: room.players, roles: room.roles, joinedPlayer: playerObj });
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("join_room", (playerData) => {
    const { name, position, roomCode } = playerData;
    const id = socket.id;

    const playerObj = {
      name: name,
      id: id,
      position: position,
    };

    try {
      const roomCodeNumb = parseInt(roomCode);
      const room = game.joinRoom(roomCodeNumb, playerObj);
      socket.join(roomCodeNumb);
      socket.emit("room_joined", { code: room.code, players: room.players, joinedPlayer: playerObj});
      socket.broadcast.to(roomCodeNumb).emit("player_joined", room.players);
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("leave_room", (roomCode) => {
    const id = socket.id;
    const roomCodeNumb = parseInt(roomCode);

    try {
      const room = game.leaveRoom(roomCodeNumb, id);
      socket.leave(roomCodeNumb);
      socket.emit("room_left");
      socket.broadcast.to(roomCodeNumb).emit("player_left", room.players);
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("start_game", (roomCode) => {
    const roomCodeNumb = parseInt(roomCode);

    try {
      const room = game.startGame(roomCodeNumb);
      const players = room.players;

      players.forEach((player) => {
        if (player.position === "host") {
          io.to(player.id).emit("game_started_host", { players: players });
        } else {
          io.to(player.id).emit("game_started_player", { playerRole: player.role });
        }
      });
    } catch (error) {
      socket.emit("error", error.message);
    }
  });
}

module.exports = events;
