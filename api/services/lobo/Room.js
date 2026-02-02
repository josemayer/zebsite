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
      console.error("CHECK HERE");
      console.trace();
      throw new Error("Player is not an instance of Player");
    }

    if (this.#havePlayer(player)) {
      throw new Error("Player already in room");
    }

    this.#players.push(player);
  }

  removePlayer(playerId) {
    const playerIndex = this.#players.findIndex((p) => p.id === playerId);

    if (playerIndex === -1) {
      throw new Error("Player not found in room");
    }

    const playerToRemove = this.#players[playerIndex];
    this.#players.splice(playerIndex, 1);

    // If the host left, assign the next person as host
    if (!this.isEmpty() && playerToRemove.position === "host") {
      this.#players[0].position = "host";
    }
  }

  /**
   * Returns plain objects for Socket.io
   * Uses #players (the raw instances) to avoid the getter loop
   */
  getAllPlayers() {
    return this.#players.map((p) => p.toPublicObject());
  }

  // This provides the raw Class Instances to your game logic (WerewolfRoom)
  get players() {
    return this.#players;
  }

  get host() {
    return this.#players.find((p) => p.position === "host");
  }

  playersWithoutHost() {
    return this.#players.filter((p) => p.position !== "host");
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

  findPlayerByName(name) {
    return this.#players.find((p) => p.name === name);
  }

  findPlayerById(playerId) {
    return this.#players.find((p) => p.id === playerId);
  }
}

module.exports = Room;
