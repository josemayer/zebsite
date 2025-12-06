const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
});

const VALID_COMMANDS = ["on", "off", "restart"];

/**
 * Send a Minecraft server command to Redis queue
 * @param {string} command - "on", "off", "restart"
 */
async function setState(command) {
  if (!VALID_COMMANDS.includes(command)) {
    throw { statusCode: 400, message: "Invalid state" };
  }

  // Push command to Redis list
  await redis.rpush("mc_commands_queue", command);

  return {
    state: command,
    details: "Command queued successfully",
  };
}

module.exports = {
  setState,
};
