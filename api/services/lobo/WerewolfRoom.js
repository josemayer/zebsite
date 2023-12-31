const Room = require('./Room');

class WerewolfRoom extends Room {
  #roles;

  constructor(code, capacity, roles) {
    const rolesQuantity = Object.values(roles).reduce((acc, cur) => acc + cur, 0);
    if (rolesQuantity !== capacity - 1) {
      throw new Error('Roles quantity is not equal to capacity without host');
    }

    super(code, capacity);
    this.#roles = roles;
  }

  get roles() {
    return this.#roles;
  }

  assignRoles() {
    const roleArray = this.#frequencyObjToArray(this.#roles);
    const shuffledRoles = this.#shuffle(roleArray);
    this.playersWithoutHost().forEach((player, index) => {
      player.role = shuffledRoles[index];
    });
  }

  #shuffle(array) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffledArray[i];
      shuffledArray[i] = shuffledArray[j];
      shuffledArray[j] = temp;
    }
    return shuffledArray;
  }

  #frequencyObjToArray(obj) {
    const array = [];
    Object.entries(obj).forEach(entry => {
      const [key, value] = entry;
      for (let i = 0; i < value; i++) {
        array.push(key);
      }
    });
    return array;
  }
}

module.exports = WerewolfRoom;
