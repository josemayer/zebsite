function roles() {
  return {
    roles: [
      {
        name: "werewolf",
        title: "Lobo",
        description:
          "Você é um lobo, membro da equipe dos lobos. Você deve acordar todas as noites e escolher uma vítima para matar. Você ganha quando a quantidade de lobos sobreviventes é igual ou maior que a quantidade de aldeões sobreviventes.",
        team: "werewolf",
        night: true,
      },
      {
        name: "doctor",
        title: "Médico",
        description:
          "Você é um médico, membro da equipe dos aldeões. Você deve acordar todas as noites e escolher um jogador para salvar. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: true,
      },
      {
        name: "villager",
        title: "Aldeão",
        description:
          "Você é um aldeão, membro da equipe dos aldeões. Você não tem nenhuma habilidade especial e deve permanecer dormindo durante a noite. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: false,
      },
      {
        name: "seer",
        title: "Vidente",
        description:
          "Você é um vidente, membro da equipe dos aldeões. Você deve acordar todas as noites e escolher um jogador para ver sua função. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: true,
      },
      {
        name: "witch",
        title: "Bruxa",
        description:
          "Você é uma bruxa, membro da equipe dos aldeões. Você possui duas poções: uma benigna e outra maligna, as quais você pode usar uma única vez durante a noite. A benigna garante proteção, por uma noite, a um jogador; já a maligna mata um jogador. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: true,
      },
      {
        name: "hunter",
        title: "Caçador",
        description:
          "Você é um caçador, membro da equipe dos aldeões. Quando você morre, você pode escolher um jogador para matar. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: false,
      },
      {
        name: "drunk",
        title: "Bêbado",
        description:
          "Você é um bêbado, membro da equipe dos aldeões. Você deve permanecer calado durante todo o jogo, sendo morto caso fale. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: false,
      },
      {
        name: "suicidal",
        title: "Suicida",
        description:
          "Você é um suicida, membro da equipe dos suicidas. Você deve se matar por votação da aldeia. Você ganha isoladamente quando todos votarem em você para morrer, caso contrário, se morrer por qualquer outro motivo, você perde.",
        team: "suicidal",
        night: false,
      },
      {
        name: "pyromaniac",
        title: "Piromaníaco",
        description:
          "Você é um piromaníaco, membro da equipe dos piromaníacos. Você deve acordar todas as noites e escolher um jogador para jogar gasolina. Caso todos os jogadores vivos estejam marcados com gasolina, você pode atear fogo. Você ganha isoladamente quando todos os jogadores restantes estiverem marcados.",
        team: "pyromaniac",
        night: false,
      },
    ],
  };
}

function role(name) {
  const rolesArr = roles();
  const role = rolesArr.roles.find((role) => role.name === name);

  if (!role) {
    throw new Error("Role not found");
  }

  return role;
}

module.exports = {
  roles,
  role,
};
