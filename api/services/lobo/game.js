const Player = require("./Player");
const WerewolfRoom = require("./WerewolfRoom");

const activeRooms = [];

function getRoom(code) {
  // Use == (double equals) to allow "5687" to match 5687
  return activeRooms.find((room) => room.code == code);
}

function createNewRoom(capacity, roles, io) {
  let roomId = generateRoomId();
  // Pass IO to the room so it can broadcast timer updates internally
  const room = new WerewolfRoom(roomId, capacity, roles, io);
  activeRooms.push(room);
  return room;
}

function deleteRoom(roomId) {
  const roomCode = parseInt(roomId);
  const roomIndex = activeRooms.findIndex((room) => room.code === roomCode);
  if (roomIndex !== -1) {
    activeRooms.splice(roomIndex, 1);
  }
}

function joinRoom(roomId, playerData) {
  const room = getRoom(roomId);
  if (!room) throw new Error("Sala não encontrada");

  // Check if player with same name exists (reconnection)
  const existingPlayer = room.findPlayerByName(playerData.name);
  if (existingPlayer && !existingPlayer.isConnected) {
    // Reconnecting player - update socket ID
    existingPlayer.updateSocketId(playerData.id);
    return room;
  }

  // CRITICAL: Convert the raw data from the socket into a REAL Player instance
  const player = new Player(
    playerData.name,
    playerData.id,
    playerData.position
  );

  room.addPlayer(player);
  return room;
}

function leaveRoom(roomId, playerId) {
  const code = parseInt(roomId);
  const room = activeRooms.find((r) => r.code === code);
  if (!room) throw new Error("Sala não encontrada");

  room.removePlayer(playerId);

  if (room.isEmpty()) {
    deleteRoom(roomId);
    return null;
  }

  return room;
}

function kickPlayer(roomId, playerId, hostId) {
  const room = getRoom(roomId);
  if (!room) throw new Error("Sala não encontrada");

  // Assuming position 'host' check
  const host = room.players.find((p) => p.id === hostId);
  if (!host || host.position !== "host") {
    throw new Error("Apenas o anfitrião pode expulsar jogadores");
  }

  if (playerId === hostId) {
    throw new Error("Você não pode se expulsar");
  }

  room.removePlayer(playerId);
  return room;
}

function isActiveRoom(roomId) {
  return activeRooms.some((room) => room.code === parseInt(roomId));
}

function generateRoomId() {
  let roomId = Math.floor(1000 + Math.random() * 9000); // 4 digit code
  let tries = 100;

  while (isActiveRoom(roomId) && tries > 0) {
    tries--;
    roomId = Math.floor(1000 + Math.random() * 9000);
  }

  if (tries === 0) throw new Error("Servidor lotado");
  return roomId;
}

module.exports = {
  createNewRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  kickPlayer,
  getRoom,
  isActiveRoom,
};
