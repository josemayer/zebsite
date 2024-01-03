const Room = require('./Room');
const Player = require('./Player');
const WerewolfRoom = require('./WerewolfRoom');

const activeRooms = [];

function createNewRoom(capacity, roles) {
  try {
    let roomId = generateRoomId();
    const room = new WerewolfRoom(roomId, capacity, roles);
    activeRooms.push(room);
    return room;
  } catch (e) {
    throw new Error(e);
    return undefined;
  }
}

function deleteRoom(roomId) {
  if (!isActiveRoom(roomId)) {
    throw new Error('Room does not exist');
  }

  const roomIndex = activeRooms.findIndex(room => room.code === roomId);
  activeRooms.splice(roomIndex, 1);
}

function createPlayer(name, id, position) {
  return new Player(name, id, position);
}

function joinRoom(roomId, playerData) {
  if (!isActiveRoom(roomId)) {
    throw new Error('Room does not exist');
  }

  const { name, id, position } = playerData;
  const player = createPlayer(name, id, position);

  const room = activeRooms.find(room => room.code === roomId);
  room.addPlayer(player);

  return room;
}

function leaveRoom(roomId, playerId) {
  if (!isActiveRoom(roomId)) {
    throw new Error('Room does not exist');
  }

  const room = activeRooms.find(room => room.code === roomId);
  room.removePlayer(playerId);

  if (room.isEmpty()) {
    deleteRoom(roomId);
  }

  return room;
}

function startGame(roomId) {
  if (!isActiveRoom(roomId)) {
    throw new Error('Room does not exist');
  }

  try {
    const room = activeRooms.find(room => room.code === roomId);
    room.assignRoles();
  } catch (e) {
    throw new Error(e);
  }

  return room;
}

function isActiveRoom(roomId) {
  if (activeRooms.find(room => room.code === roomId) !== undefined) {
    return true;
  }
  return false;
}

function generateRoomId() {
  let roomId = Math.floor(Math.random() * 10000);

  const tries = 10000;

  while (isActiveRoom(roomId) && tries > 0) {
    tries--;
    roomId = (roomId + 1) % 10000;
  }

  if (tries === 0) {
    throw new Error('No available rooms');
  }

  return roomId;
}

module.exports = {
  createNewRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  startGame
};
