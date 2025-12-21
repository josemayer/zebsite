const Redis = require("ioredis");
const { v4: uuidv4 } = require("uuid");

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
});

const VALID_PROPERTIES = [
  "max-players",
  "motd",
  "difficulty",
  "gamemode",
  "whitelist",
  "online-mode",
  "allow-flight",
  "view-distance",
];

/**
 * Internal helper to send request and wait for response
 */
async function requestWorker(command) {
  const requestId = uuidv4();
  const replyTo = `mc_response:${requestId}`;

  const payload = JSON.stringify({ command, reply_to: replyTo });
  await redis.rpush("mc_commands_queue", payload);

  // Wait 10 seconds for the worker to respond
  const result = await redis.blpop(replyTo, 10);

  if (!result) {
    throw new Error("Worker timeout");
  }

  return JSON.parse(result[1]);
}

/**
 * Generic helper for commands with arguments
 */
async function requestWorkerWithArgs(command, args = []) {
  const requestId = uuidv4();
  const replyTo = `mc_response:${requestId}`;

  const payload = JSON.stringify({
    command,
    args,
    reply_to: replyTo,
  });

  await redis.rpush("mc_commands_queue", payload);
  const result = await redis.blpop(replyTo, 15); // Slightly longer timeout for disk-heavy tasks

  if (!result) throw new Error("Worker timeout");
  return JSON.parse(result[1]);
}

async function getStatus() {
  return await requestWorker("getstatus");
}

async function getProperties() {
  const fullProps = await requestWorker("getprops");

  // Filter only allowed properties
  const filtered = {};
  VALID_PROPERTIES.forEach((prop) => {
    if (fullProps[prop] !== undefined) {
      filtered[prop] = fullProps[prop];
    }
  });

  return { properties: filtered };
}

/**
 * Send a Minecraft server command to Redis queue
 * @param {string} command - "on", "off", "restart"
 */
async function setState(command) {
  const valid_states = ["on", "off", "restart"];
  if (!valid_states.includes(command)) {
    throw { statusCode: 400, message: "Invalid state" };
  }

  // Use the new JSON format so the worker stays happy
  const payload = JSON.stringify({ command: command });
  await redis.rpush("mc_commands_queue", payload);

  return {
    state: command,
    details: "Command queued successfully",
  };
}

/**
 * Change Minecraft server properties sending command to Redis queue
 * @param {object} properties - Object with properties to change
 * Example: { "max-players": 20, "motd": "Welcome to my server!" }
 *
 */
async function setProperties(properties) {
  const entries = Object.entries(properties);

  const { results, validProps, hasError } = entries.reduce(
    (acc, [property, value]) => {
      if (!VALID_PROPERTIES.includes(property)) {
        acc.results.push({
          property,
          status: "failed",
          message: "Invalid property",
        });
        acc.hasError = true;
      } else {
        acc.results.push({
          property,
          value,
          status: "success",
          details: "Property will be applied",
        });

        let formattedValue = String(value);
        if (formattedValue.includes(" ")) {
          formattedValue = formattedValue.replace(/ /g, "__SPACE__");
        }

        acc.validProps.push(`${property}=${formattedValue}`);
      }
      return acc;
    },
    { results: [], validProps: [], hasError: false }
  );

  if (validProps.length > 0) {
    const payload = JSON.stringify({
      command: "setprop",
      args: validProps,
    });
    await redis.rpush("mc_commands_queue", payload);
  }

  return hasError
    ? { results, allowedProperties: VALID_PROPERTIES }
    : { results };
}

// --- Backup Services ---
async function listBackups() {
  return await requestWorker("listbackups");
}

async function createBackup() {
  return await requestWorker("backup");
}

async function deleteBackup(filename) {
  return await requestWorkerWithArgs("delbackup", [filename]);
}

async function restoreBackup(filename) {
  return await requestWorkerWithArgs("restore", [filename]);
}

async function renameBackup(oldName, newName) {
  return await requestWorkerWithArgs("rename", [oldName, newName]);
}

// --- World & Admin Services ---
async function resetWorld(seed = null) {
  const args = seed ? ["--seed", seed] : [];
  return await requestWorkerWithArgs("newmap", args);
}

async function setVersion(version) {
  return await requestWorkerWithArgs("setversion", [version]);
}

async function kickPlayer(player) {
  return await requestWorkerWithArgs("kick", [player]);
}

async function banPlayer(player, reason = "Banned by admin") {
  return await requestWorkerWithArgs("ban", [player, reason]);
}

module.exports = {
  setState,
  setProperties,
  getStatus,
  getProperties,
  listBackups,
  createBackup,
  deleteBackup,
  restoreBackup,
  renameBackup,
  resetWorld,
  setVersion,
  kickPlayer,
  banPlayer,
};
