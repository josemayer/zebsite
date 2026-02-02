/**
 * Role System Definition
 * type: "TARGET_ONE" (standard selection), "WITCH_POWERS" (multi-stage), "PASSIVE" (no night action)
 * action: The internal keyword the server uses to resolve the night
 */

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
        power: { type: "TARGET_ONE", action: "kill" },
      },
      {
        name: "doctor",
        title: "Médico",
        description:
          "Você é um médico, membro da equipe dos aldeões. Você deve acordar todas as noites e escolher um jogador para salvar. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: true,
        power: { type: "TARGET_ONE", action: "save" },
      },
      {
        name: "villager",
        title: "Aldeão",
        description:
          "Você é um aldeão, membro da equipe dos aldeões. Você não tem nenhuma habilidade especial e deve permanecer dormindo durante a noite. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: false,
        power: null,
      },
      {
        name: "seer",
        title: "Vidente",
        description:
          "Você é um vidente, membro da equipe dos aldeões. Você deve acordar todas as noites e escolher um jogador para ver sua função. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: true,
        power: { type: "TARGET_ONE", action: "reveal" },
      },
      {
        name: "witch",
        title: "Bruxa",
        description:
          "Você é uma bruxa, membro da equipe dos aldeões. Você possui duas poções: uma benigna e outra maligna, as quais você pode usar uma única vez durante a noite. A benigna garante proteção, por uma noite, a um jogador; já a maligna mata um jogador. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: true,
        power: { type: "WITCH_POWERS", action: "mix" },
      },
      {
        name: "hunter",
        title: "Caçador",
        description:
          "Você é um caçador, membro da equipe dos aldeões. Quando você morre, você pode escolher um jogador para matar. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: false,
        power: { type: "ON_DEATH", action: "revenge_kill" },
      },
      {
        name: "drunk",
        title: "Bêbado",
        description:
          "Você é um bêbado, membro da equipe dos aldeões. Você deve permanecer calado durante todo o jogo, sendo morto caso fale. Você ganha quando todos os times inimigos (lobos, suicidas e piromaníacos) estiverem mortos.",
        team: "villager",
        night: false,
        power: null,
      },
      {
        name: "suicidal",
        title: "Suicida",
        description:
          "Você é um suicida, membro da equipe dos suicidas. Você deve se matar por votação da aldeia. Você ganha isoladamente quando todos votarem em você para morrer, caso contrário, se morrer por qualquer outro motivo, você perde.",
        team: "suicidal",
        night: false,
        power: null,
      },
      {
        name: "pyromancer",
        title: "Piromaníaco",
        description:
          "Você é um piromaníaco, membro da equipe dos piromaníacos. Você deve acordar todas as noites e escolher um jogador para jogar gasolina. Caso todos os jogadores vivos estejam marcados com gasolina, você pode atear fogo. Você ganha isoladamente quando todos os jogadores restantes estiverem marcados.",
        team: "pyromancer",
        night: true, // Switched to true as they usually act at night
        power: { type: "TARGET_ONE", action: "mark" },
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
