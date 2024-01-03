function roles() {
  return {
    "roles": [
      {
        "name": "werewolf",
        "title": "Lobo",
        "description": "You are a werewolf. You are a member of the werewolf team. You are a night role. You may vote to kill one player each night. You win when all the villagers are dead or nothing can prevent this from happening.",
        "team": "werewolf",
        "night": true,
      },
      {
        "name": "healthcare",
        "title": "Médico",
        "description": "",
        "team": "villager",
        "night": true,
      },
      {
       "name": "villager",
       "title": "Aldeão",
        "description": "You are a villager. You are a member of the villager team. You are a day role. You may vote to kill one player each day. You win when all the werewolves are dead or nothing can prevent this from happening.",
        "team": "villager",
        "night": false,
      },
      {
        "name": "seer",
        "title": "Vidente",
        "description": "You are a seer. You are a member of the villager team. You are a night role. You may choose one player each night. You will be told if that player is a werewolf or not. You win when all the werewolves are dead or nothing can prevent this from happening.",
        "team": "villager",
        "night": true,
      },
      {
        "name": "witch",
        "title": "Bruxa",
        "description": "",
        "team": "villager",
        "night": true,
      },
      {
        "name": "hunter",
        "title": "Caçador",
        "description": "",
        "team": "villager",
        "night": false,
      },
      {
        "name": "drunk",
        "title": "Bêbado",
        "desc": "",
        "team": "villager",
        "night": false,
      },
      {
        "name": "suicidal",
        "title": "Suicida",
        "desc": "",
        "team": "suicidal",
        "night": false,
      },
      {
        "name": "pyro",
        "title": "Piromaníaco",
        "desc": "",
        "team": "pyro",
        "night": false,
      }
    ]
  }
}

module.exports = {
  roles
};
