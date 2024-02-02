const Player = require("./Player");

class Room {
  #players;
  #code;
  #capacity;

  constructor(code, capacity) {
    this.#code = code;
    this.#capacity = capacity;
    this.#players = [];
  }

  addPlayer(player) {
    if (this.#isFull()) {
      throw new Error("Room is full");
    }

    if (!(player instanceof Player)) {
      throw new Error("Player is not an instance of Player");
    }

    if (this.#havePlayer(player)) {
      throw new Error("Player already in room");
    }

    this.#players.push(player);
  }

  removePlayer(playerId) {
    const playerToRemove = this.#players.find((p) => p.id === playerId);

    if (!playerToRemove) {
      throw new Error("Player not found in room");
    }

    this.#players = this.#players.filter((p) => p.id !== playerId);

    if (!this.isEmpty() && playerToRemove.isHost()) {
      this.#players[0].setHost();
    }
  }

  get host() {
    return this.#players.find((p) => p.isHost());
  }

  get players() {
    return this.#players.map((p) => p.toObject());
  }

  playersWithoutHost() {
    return this.#players.filter((p) => !p.isHost());
  }

  get code() {
    return this.#code;
  }

  get capacity() {
    return this.#capacity;
  }

  #isFull() {
    return this.#players.length >= this.#capacity;
  }

  isEmpty() {
    return this.#players.length === 0;
  }

  #havePlayer(player) {
    return this.#players.some((p) => p.id === player.id);
  }
}

module.exports = Room;
