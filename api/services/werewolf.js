function roles() {
  return {
    "roles": [
      {
        "name": "werewolf",
        "title": "Werewolf",
        "description": "You are a werewolf. You are a member of the werewolf team. You are a night role. You may vote to kill one player each night. You win when all the villagers are dead or nothing can prevent this from happening.",
        "team": "werewolf",
        "night": true,
      },
      {
        "name": "villager",
        "title": "Villager",
        "description": "You are a villager. You are a member of the villager team. You are a day role. You may vote to kill one player each day. You win when all the werewolves are dead or nothing can prevent this from happening.",
        "team": "villager",
        "night": false,
      },
      {
        "name": "seer",
        "title": "Seer",
        "description": "You are a seer. You are a member of the villager team. You are a night role. You may choose one player each night. You will be told if that player is a werewolf or not. You win when all the werewolves are dead or nothing can prevent this from happening.",
        "team": "villager",
        "night": true,
      },
    ]
  }
}

module.exports = {
  roles
};
