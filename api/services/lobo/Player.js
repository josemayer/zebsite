class Player {
  #name;
  #id;
  #position;
  #role;

  constructor(name, id, position) {
    this.#name = name;
    this.#id = id;
    this.#position = position;
    this.#role = undefined;
  }

  get name() {
    return this.#name;
  }

  get id() {
    return this.#id;
  }

  get position() {
    return this.#position;
  }

  get role() {
    return this.#role;
  }

  set role(role) {
    this.#role = role;
  }

  isHost() {
    return this.#position === "host";
  }

  setHost() {
    this.#position = "host";
  }

  toObject() {
    return {
      name: this.#name,
      id: this.#id,
      position: this.#position,
      role: this.#role,
    };
  }
}

module.exports = Player;
