const game = require("./services/lobo/game");

const events = (io, socket) => {
  socket.on("disconnecting", () => {
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
  });

  socket.on("create_new_room", (data) => {
    const { roomData, playerData } = data;
    const { name, position } = playerData;
    const { capacity } = roomData;

    const room = game.createNewRoom(capacity);
    const id = socket.id;

    const playerObj = {
      name: name,
      id: id,
      position: position,
    };

    game.joinRoom(room.code, playerObj);
    socket.join(room.code);

    socket.emit("room_created", { code: room.code, players: room.players });
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
      socket.emit("room_joined", { code: room.code, players: room.players });
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
}

module.exports = events;
