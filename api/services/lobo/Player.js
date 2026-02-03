class Player {
  #name;
  #id;
  #position; // Still useful to know who the "admin" is, but they play too
  #role;
  #alive;
  #vote; // Who they voted for during the day
  #nightAction; // Who they targeted at night
  #isConnected; // Track connection status
  #hasUsedSavePotion;
  #hasUsedKillPotion;
  #isMarkedByPyro;

  constructor(name, id, position) {
    this.#name = name;
    this.#id = id;
    this.#position = position;
    this.#role = null;
    this.#alive = true; // New: Everyone starts alive
    this.#vote = null;
    this.#nightAction = null;
    this.#isConnected = true;
    this.#hasUsedSavePotion = false;
    this.#hasUsedKillPotion = false;
    this.#isMarkedByPyro = false;
  }

  // ... Getters ...
  get name() {
    return this.#name;
  }
  get id() {
    return this.#id;
  }
  get role() {
    return this.#role;
  }
  get isAlive() {
    return this.#alive;
  }
  get vote() {
    return this.#vote;
  }
  get nightAction() {
    return this.#nightAction;
  }
  get position() {
    return this.#position;
  }
  get isConnected() {
    return this.#isConnected;
  }
  get hasUsedSavePotion() {
    return this.#hasUsedSavePotion;
  }
  get hasUsedKillPotion() {
    return this.#hasUsedKillPotion;
  }
  get isMarkedByPyro() {
    return this.#isMarkedByPyro;
  }

  set role(role) {
    this.#role = role;
  }
  set vote(targetId) {
    this.#vote = targetId;
  }
  set nightAction(targetId) {
    this.#nightAction = targetId;
  }
  set position(newPosition) {
    this.#position = newPosition;
  }

  setConnected(connected) {
    this.#isConnected = connected;
  }

  updateSocketId(newId) {
    this.#id = newId;
    this.#isConnected = true;
  }

  useSavePotion() {
    this.#hasUsedSavePotion = true;
  }

  useKillPotion() {
    this.#hasUsedKillPotion = true;
  }

  die() {
    this.#alive = false;
  }

  markByPyro() {
    this.#isMarkedByPyro = true;
  }

  unmarkByPyro() {
    this.#isMarkedByPyro = false;
  }

  resetRoundData() {
    this.#vote = null;
    this.#nightAction = null;
  }

  toPublicObject() {
    return {
      id: this.id,
      name: this.name, // Ensure this matches what you use in React
      position: this.position,
      isAlive: this.isAlive,
      isConnected: this.isConnected,
      isMarkedByPyro: this.isMarkedByPyro,
    };
  }

  // Private data (sent only to this player)
  toPrivateObject() {
    return {
      ...this.toPublicObject(),
      role: this.#role,
      hasUsedSavePotion: this.hasUsedSavePotion,
      hasUsedKillPotion: this.hasUsedKillPotion,
    };
  }
}

module.exports = Player;
