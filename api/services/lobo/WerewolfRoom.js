const Room = require("./Room");
const roleAPI = require("../werewolf");

class WerewolfRoom extends Room {
  #roles;
  #phase;
  #timer;
  #timerInterval;
  #io;
  #gameLog;
  #winMessage;
  #chatHistory;
  #gameStarted;
  #currentVotes; // Track live votes during voting phases
  #roleConfirmations;
  #pyroMarked;
  #winningTeam;
  #nextPhaseAfterHunter;

  constructor(code, capacity, roles, io) {
    super(code, capacity);
    this.#roles = roles;
    this.#io = io;
    this.#phase = "LOBBY";
    this.#timer = 0;
    this.#gameLog = [];
    this.#winMessage = null;
    this.#roleConfirmations = new Set();
    this.#chatHistory = [];
    this.#currentVotes = new Map(); // playerId -> targetId
    this.#pyroMarked = new Set(); // playerIds marked by pyromancers
    this.#winningTeam = null;
    this.#nextPhaseAfterHunter = null;
    console.log(
      `[DEBUG] WerewolfRoom created. Code: ${code}, Capacity: ${capacity}`
    );
  }

  get phase() {
    return this.#phase;
  }

  broadcastUpdate() {
    this.#broadcastUpdate();
  }

  // --- CORE GAME LOOP ---

  startGame() {
    console.log(`[DEBUG] Attempting to startGame in Room: ${this.code}`);

    if (this.players.length !== this.capacity) {
      console.error(
        `[DEBUG] Start failed: Players(${this.players.length}) !== Capacity(${this.capacity})`
      );
      throw new Error("Aguardando mais jogadores...");
    }

    try {
      this.assignRoles();
      console.log(`[DEBUG] Roles assigned to ${this.players.length} players.`);
      // Reset pyromancer marks when a new game starts
      this.#pyroMarked.clear();
      this.players.forEach((p) => p.unmarkByPyro && p.unmarkByPyro());

      this.startRoleRevealPhase();
      console.log(`[DEBUG] startRoleRevealPhase() called successfully.`);
    } catch (err) {
      console.error(`[DEBUG] CRITICAL ERROR during startGame:`, err);
    }
  }

  assignRoles() {
    const roleArray = this.#frequencyObjToArray(this.#roles);
    const shuffledRoles = this.#shuffle(roleArray);

    this.players.forEach((player, index) => {
      player.role = shuffledRoles[index];
      console.log(
        `[DEBUG] Player ${player.name} assigned role: ${player.role}`
      );
    });

    this.#gameStarted = true;
  }

  startRoleRevealPhase() {
    console.log(`[DEBUG] Entering ROLE_REVEAL Phase for Room ${this.code}`);
    this.#phase = "ROLE_REVEAL";
    this.#timer = 20; // 20 seconds for players to read their roles
    this.#roleConfirmations = new Set(); // Reset confirmations
    this.#broadcastUpdate();
    this.#startTimer(() => this.startNightPhase());
  }

  confirmRole(playerId) {
    if (this.#phase !== "ROLE_REVEAL") return;

    this.#roleConfirmations.add(playerId);
    console.log(
      `[DEBUG] Player ${playerId} confirmed role. Total confirmations: ${
        this.#roleConfirmations.size
      }/${this.players.length}`
    );

    // If all players have confirmed, start night phase immediately
    if (this.#roleConfirmations.size === this.players.length) {
      console.log(
        `[DEBUG] All players confirmed roles. Starting night phase early.`
      );
      if (this.#timerInterval) clearInterval(this.#timerInterval);
      this.startNightPhase();
    } else {
      this.#broadcastUpdate();
    }
  }

  // --- PHASE MANAGEMENT ---

  startNightPhase() {
    console.log(`[DEBUG] Entering NIGHT Phase for Room ${this.code}`);
    this.#phase = "NIGHT";
    this.#timer = 30;
    this.players.forEach((p) => p.resetRoundData());
    this.#clearVotes(); // Clear previous votes

    this.#broadcastUpdate();

    this.#startTimer(() => {
      console.log(`[DEBUG] Night timer expired. Resolving night actions...`);
      this.resolveNight();
    });
  }

  resolveNight() {
    const protectedPlayers = new Set();
    const wolfVotes = [];
    const witchKills = [];
    const huntersToTrigger = []; // Collect hunters here
    const logs = [];

    // Process all night actions
    this.players
      .filter((p) => p.isAlive && p.nightAction)
      .forEach((player) => {
        const roleData = roleAPI.role(player.role);
        const actionData = player.nightAction;
        console.log(
          `[DEBUG] Processing night action for ${player.name}:`,
          actionData
        );

        if (roleData.power) {
          switch (roleData.power.action) {
            case "save":
              protectedPlayers.add(actionData.targetId);
              break;
            case "kill":
              // Only wolves vote - their kills are collective
              if (player.role === "werewolf") {
                wolfVotes.push(actionData.targetId);
              } else {
                // Other killers (like witch with kill potion) act independently
                witchKills.push({
                  killerId: player.id,
                  targetId: actionData.targetId,
                  killerRole: player.role,
                });
              }
              break;
            case "mix":
              if (actionData.potion === "benign") {
                if (!player.hasUsedSavePotion) {
                  protectedPlayers.add(actionData.targetId);
                  player.useSavePotion();
                } else {
                  console.log(
                    `[DEBUG] Witch ${player.name} tried to use save potion but it was already consumed.`
                  );
                }
              }
              if (actionData.potion === "malign") {
                if (!player.hasUsedKillPotion) {
                  witchKills.push({
                    killerId: player.id,
                    targetId: actionData.targetId,
                    killerRole: player.role,
                  });
                  player.useKillPotion();
                } else {
                  console.log(
                    `[DEBUG] Witch ${player.name} tried to use kill potion but it was already consumed.`
                  );
                }
              }
              break;
          }
        }
      });

    // Resolve wolf pack vote
    const wolfVictimId = this.#getMostFrequent(wolfVotes);

    // Process wolf kill
    if (wolfVictimId && !protectedPlayers.has(wolfVictimId)) {
      const victim = this.players.find((v) => v.id === wolfVictimId);
      if (victim) {
        victim.die();
        const victimRole = roleAPI.role(victim.role).title;
        logs.push([`${victim.name} (${victimRole}) foi encontrado morto.`]);
        console.log(`[DEBUG] Wolf pack killed: ${victim.name} (${victimRole})`);
        if (victim.role === "hunter") huntersToTrigger.push(victim);
      }
    }

    // Process independent witch kills
    witchKills.forEach(({ targetId, killerRole }) => {
      if (!protectedPlayers.has(targetId)) {
        const victim = this.players.find((v) => v.id === targetId);
        if (victim && victim.isAlive) {
          victim.die();
          const victimRole = roleAPI.role(victim.role).title;
          const killerTitle = roleAPI.role(killerRole).title;
          logs.push(`${victim.name} (${victimRole}) foi encontrado morto.`);
          console.log(
            `[DEBUG] ${killerTitle} killed: ${victim.name} (${victimRole})`
          );
          if (victim.role === "hunter") huntersToTrigger.push(victim);
        }
      }
    });

    // If no deaths occurred, log peaceful night
    const hadDeaths =
      (wolfVictimId && !protectedPlayers.has(wolfVictimId)) ||
      witchKills.some(({ targetId }) => !protectedPlayers.has(targetId));

    if (!hadDeaths) {
      console.log(`[DEBUG] Night resolve: No deaths.`);
      logs.push(["A noite foi tranquila."]);
    }

    this.#gameLog.push(logs);

    // PRIORITY 1: Check if game ended BEFORE hunter shoots
    if (this.checkWinCondition()) return;

    // PRIORITY 2: If hunters died, trigger the first one
    if (huntersToTrigger.length > 0) {
      this.#triggerHunterMoment(huntersToTrigger[0], () =>
        this.startDayPhase()
      );
      return;
    }

    // PRIORITY 3: Move to day
    this.startDayPhase();
  }

  #triggerHunterMoment(victim, nextPhaseFn) {
    this.#phase = "HUNTER_MOMENT";
    this.#nextPhaseAfterHunter = nextPhaseFn; // Store the "callback"
    this.#timer = 15;
    this.#gameLog.push([
      `${victim.name} (${
        roleAPI.role(victim.role).title
      }) tem um último fôlego para atirar!`,
    ]);
    this.#broadcastUpdate();
    this.#startTimer(() => {
      this.#resolveHunterEnd();
    });
  }

  #resolveHunterEnd() {
    if (this.#timerInterval) clearInterval(this.#timerInterval);

    if (!this.checkWinCondition() && this.#nextPhaseAfterHunter) {
      const transition = this.#nextPhaseAfterHunter;
      this.#nextPhaseAfterHunter = null; // Clear it
      transition(); // Run startDayPhase or startNightPhase
    }
  }

  startDayPhase() {
    console.log(`[DEBUG] Entering DAY Phase for Room ${this.code}`);
    // Use helper to check for end game before starting day to avoid duplication
    if (this.#endGameIfNeeded()) {
      return;
    }

    this.#phase = "DAY";
    this.#timer = 60;
    this.#broadcastUpdate();
    this.#startTimer(() => this.startVotingPhase());
  }

  startVotingPhase() {
    console.log(`[DEBUG] Entering VOTING Phase for Room ${this.code}`);
    this.#phase = "VOTING";
    this.#timer = 20;
    this.players.forEach((p) => p.resetRoundData());
    this.#clearVotes(); // Clear previous votes
    this.#broadcastUpdate();
    this.#startTimer(() => this.resolveVoting());
  }

  resolveVoting() {
    const votes = this.players
      .filter((p) => p.isAlive && p.vote)
      .map((p) => p.vote);

    const victimId = this.#getMostFrequent(votes);

    if (victimId) {
      const victim = this.players.find((p) => p.id === victimId);
      if (victim) {
        victim.die();
        const victimRole = roleAPI.role(victim.role).title;
        this.#gameLog.push([
          `${victim.name} (${victimRole}) foi executado pela aldeia.`,
        ]);
        console.log(`[DEBUG] Village executed: ${victim.name} (${victimRole})`);

        // Special rule: if the executed player is suicidal, they win SOLO the game.
        // If multiple suicidals exist, only the one executed by the village wins.
        if (victim.role === "suicidal") {
          // Announce solo suicidal victory
          const message = `${victim.name} (SUICIDA) venceu sozinho!`;
          console.log(
            `[DEBUG] Suicidal solo-win triggered by village execution: ${victim.name}`
          );
          this.#endGame(message, "SUICIDAL", victim.name);
          return;
        }

        // Check win condition BEFORE letting hunter shoot
        if (this.checkWinCondition()) return;

        // Hunter logic consistency
        if (victim.role === "hunter") {
          this.#triggerHunterMoment(victim, () => this.startNightPhase());
          return;
        }
      }
    } else {
      this.#gameLog.push(["Ninguém foi executado hoje."]);
    }

    if (!this.checkWinCondition()) {
      this.startNightPhase();
    }
  }

  checkWinCondition() {
    return this.#endGameIfNeeded();
  }

  #defineWinnerPlayers(teamKey, soloWinPlayer = undefined) {
    const winners = [];

    this.players.forEach((player) => {
      const role = roleAPI.role(player.role);
      switch (teamKey) {
        case "VILLAGE":
          if (role.team == "villager") winners.push(player.name);
          break;
        case "WOLVES":
          if (role.team == "werewolf") winners.push(player.name);
          break;
        case "PYRO":
          if (role.team == "pyromancer") winners.push(player.name);
          break;
        case "SUICIDAL":
          if (role.team == "suicidal" && soloWinPlayer === player.name)
            winners.push(player.name);
          break;
      }
    });

    return winners;
  }

  #endGame(message, teamKey, soloWinPlayer = undefined) {
    this.#phase = "GAMEOVER";
    this.#winMessage = message;
    this.#winningTeam = this.#defineWinnerPlayers(teamKey, soloWinPlayer);

    if (this.#timerInterval) {
      clearInterval(this.#timerInterval);
      this.#timerInterval = null;
    }
    this.#timer = 0;
    this.#broadcastUpdate();
  }

  // --- Update Win Condition Checks ---
  #endGameIfNeeded() {
    const { wolves, villagers } = this.#getAliveCounts();

    if (wolves === 0) {
      this.#endGame("A Vila prevaleceu e eliminou o mal!", "VILLAGE");
      return true;
    }

    if (wolves >= villagers) {
      this.#endGame("Os Lobos dominaram a vila!", "WOLVES");
      return true;
    }
    return false;
  }

  // --- INTERACTION HANDLER ---

  handleAction(playerId, actionPayload) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return;
    // Allow a dead hunter to act during HUNTER_MOMENT (final shot).
    if (
      !player.isAlive &&
      !(this.#phase === "HUNTER_MOMENT" && player.role === "hunter")
    )
      return;

    // Handle role confirmation during ROLE_REVEAL phase
    if (
      this.#phase === "ROLE_REVEAL" &&
      actionPayload.action === "confirm_role"
    ) {
      this.confirmRole(playerId);
      return;
    }

    if (this.#phase === "NIGHT") {
      const roleData = roleAPI.role(player.role);
      player.nightAction = actionPayload;

      // --- Pyromancer actions ---
      if (player.role === "pyromancer") {
        // Mark action: persistently mark a target for future explosion
        if (actionPayload.action === "mark" && actionPayload.targetId) {
          const target = this.players.find(
            (p) => p.id === actionPayload.targetId
          );
          if (!target || !target.isAlive) {
            return { message: "Alvo inválido." };
          }
          if (this.#pyroMarked.has(target.id)) {
            return { message: `${target.name} já está marcado.` };
          }

          // Mark the target
          target.markByPyro();
          this.#pyroMarked.add(target.id);
          this.#broadcastUpdate();
          return { message: `${target.name} marcado com sucesso.` };
        }

        // Explode action: attempt to detonate all marked players (only allowed when all non-pyro alive are marked)
        if (actionPayload.action === "explode") {
          const aliveNonPyros = this.players.filter(
            (p) => p.isAlive && p.role !== "pyromancer"
          );

          for (const id of this.#pyroMarked) {
            const p = this.players.find((player) => player.id === id);
            if (!p || !p.isAlive) this.#pyroMarked.delete(id);
          }

          const activeMarks = aliveNonPyros.filter((p) =>
            this.#pyroMarked.has(p.id)
          );

          if (activeMarks.length < aliveNonPyros.length) {
            return {
              message: "Nem todos os alvos vivos foram marcados ainda.",
            };
          }

          const explosionLogs = [];
          activeMarks.forEach((v) => {
            v.die();
            const victimRole = roleAPI.role(v.role).title;
            explosionLogs.push(
              `${v.name} (${victimRole}) foi explodido pelo piromante.`
            );
            console.log(`[DEBUG] Pyro exploded: ${v.name} (${victimRole})`);
          });
          this.#gameLog.push(explosionLogs);

          // Declare pyromancers as winners (collective team)
          const pyroTeam = this.players
            .filter((p) => p.role === "pyromancer")
            .map((p) => p.name);
          const message = `Piromantes (${pyroTeam.join(", ")}) venceram!`;
          this.#endGame(message, "PYRO");
          return;
        }
      }

      // Track wolf votes in real-time
      if (player.role === "werewolf" && actionPayload.targetId) {
        const target = this.players.find(
          (p) => p.id === actionPayload.targetId
        );

        // Block if target is also a werewolf
        if (target && target.role === "werewolf") {
          console.log(
            `[SECURITY] Wolf ${player.name} tried to vote for ally ${target.name}`
          );
          return { message: "Você não pode votar em um aliado!" };
        }

        this.#currentVotes.set(player.id, actionPayload.targetId);
        console.log(
          `[VOTE DEBUG] Wolf ${player.name} voted for ${actionPayload.targetId}`
        );
        this.#broadcastUpdate();
      }

      if (roleData.power?.action === "reveal") {
        const target = this.players.find(
          (p) => p.id === actionPayload.targetId
        );
        if (target) {
          const targetRole = roleAPI.role(target.role);
          return { message: `${target.name} é ${targetRole.title}` };
        }
      }
    } else if (this.#phase === "VOTING") {
      player.vote = actionPayload.targetId;
      // Track village votes in real-time
      if (actionPayload.targetId) {
        this.#currentVotes.set(player.id, actionPayload.targetId);
        console.log(
          `[VOTE DEBUG] Villager ${player.name} voted for ${actionPayload.targetId}`
        );
        this.#broadcastUpdate();
      }
    } else if (this.#phase === "HUNTER_MOMENT" && player.role === "hunter") {
      const target = this.players.find((p) => p.id === actionPayload.targetId);
      if (target && target.isAlive) {
        target.die();
        const targetRole = roleAPI.role(target.role).title;
        this.#gameLog.push([
          `O Caçador disparou e levou ${target.name} (${targetRole}) junto!`,
        ]);
        this.#resolveHunterEnd();
      }
    }
  }

  // --- HELPERS ---

  // Helper: compute alive counts for wolves and villagers
  #getAliveCounts() {
    const wolves = this.players.filter(
      (p) => p.role === "werewolf" && p.isAlive
    ).length;
    const villagers = this.players.filter(
      (p) => p.role !== "werewolf" && p.isAlive
    ).length;
    return { wolves, villagers };
  }

  #startTimer(callback) {
    if (this.#timerInterval) clearInterval(this.#timerInterval);
    this.#timerInterval = setInterval(() => {
      this.#timer--;
      this.#broadcastUpdate();
      if (this.#timer <= 0) {
        clearInterval(this.#timerInterval);
        callback();
      }
    }, 1000);
  }

  #broadcastUpdate() {
    const roomString = String(this.code);

    // --- CRITICAL DEBUG LOGS ---
    const socketsInRoom = this.#io.sockets.adapter.rooms.get(roomString);
    const numListeners = socketsInRoom ? socketsInRoom.size : 0;
    console.log(
      `[BROADCAST DEBUG] Room ${roomString} | Phase: ${this.#phase} | Timer: ${
        this.#timer
      } | Clients in Room Channel: ${numListeners}`
    );

    const currentVoteCounts = this.#getVoteCounts();

    const publicState = {
      phase: this.#phase,
      timer: this.#timer,
      alivePlayers:
        this.#phase === "GAMEOVER"
          ? this.players.map((p) => ({
              id: p.id,
              name: p.name,
              isAlive: p.isAlive,
              role: p.role, // reveal the internal role string at gameover
              roleTitle: roleAPI.role(p.role).title,
            }))
          : this.getAllPlayers(),
      actionLogs: this.#gameLog,
      winnerTeam: this.#winningTeam,
      winMessage: this.#winMessage,
      chatHistory: this.#chatHistory,
      roleConfirmations:
        this.#phase === "ROLE_REVEAL"
          ? Array.from(this.#roleConfirmations)
          : null,
      voteCounts: this.#phase === "VOTING" ? currentVoteCounts : null, // <--- CHANGED
    };

    // Emit to room
    this.#io.to(roomString).emit("game_update", publicState);

    console.log("public state:", publicState);

    // Private data
    this.players.forEach((p) => {
      const roleData = roleAPI.role(p.role);
      let teammates = [];

      if (p.role === "werewolf" || p.role === "pyromancer") {
        teammates = this.players
          .filter((m) => m.role === p.role && m.id !== p.id)
          .map((m) => m.name);
      }

      const visiblePrivateVotes =
        this.#phase === "NIGHT" && p.role === "werewolf"
          ? currentVoteCounts
          : null;

      this.#io.to(p.id).emit("player_secret_data", {
        roleInfo: roleData,
        teammates,
        isAlive: p.isAlive,
        hasUsedSavePotion: !!p.hasUsedSavePotion,
        hasUsedKillPotion: !!p.hasUsedKillPotion,
        voteCounts: visiblePrivateVotes,
        isMarked: this.#pyroMarked.has(p.id),
        markedPlayers:
          p.role === "pyromancer" ? Array.from(this.#pyroMarked) : [],
      });
    });
  }

  #getMostFrequent(arr) {
    if (arr.length === 0) return null;
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    let maxCount = 0;
    let candidates = [];

    // Find the maximum count and collect all items with that count
    for (const [item, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        candidates = [item];
      } else if (count === maxCount) {
        candidates.push(item);
      }
    }

    // If there's a tie (multiple candidates with the same max count), return null
    // Only return a winner if there's a clear majority (no ties)
    return candidates.length === 1 ? candidates[0] : null;
  }

  #shuffle(array) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  }

  // Get current vote counts for live display
  #getVoteCounts() {
    const counts = {};
    for (const [voterId, targetId] of this.#currentVotes.entries()) {
      if (!counts[targetId]) {
        counts[targetId] = 0;
      }
      counts[targetId]++;
    }
    return counts;
  }

  // Clear votes when starting new voting phases
  #clearVotes() {
    this.#currentVotes.clear();
  }

  #frequencyObjToArray(obj) {
    const array = [];
    Object.entries(obj).forEach(([key, value]) => {
      for (let i = 0; i < value; i++) array.push(key);
    });
    return array;
  }

  // Chat functionality
  addChatMessage(message) {
    this.#chatHistory.push(message);
    // Keep only last 50 messages to prevent memory issues
    if (this.#chatHistory.length > 50) {
      this.#chatHistory = this.#chatHistory.slice(-50);
    }
  }

  /**
   * Handle an immediate death caused by chat (e.g., drunk role speaking).
   * This centralizes the death logic so logs, hunter reaction and win checks run as usual.
   */
  handleChatDeath(playerId) {
    const victim = this.players.find((p) => p.id === playerId);
    if (!victim || !victim.isAlive) return;

    // Kill the player and log the event
    victim.die();
    const victimRole = roleAPI.role(victim.role).title;
    this.#gameLog.push([
      `${victim.name} (${victimRole}) foi encontrado morto após falar.`,
    ]);
    console.log(`[DEBUG] Chat death: ${victim.name} (${victimRole})`);

    // Continue with normal win checks (day/night flow will proceed from current phase)
    this.checkWinCondition();
  }

  get chatHistory() {
    return this.#chatHistory;
  }
}

module.exports = WerewolfRoom;
