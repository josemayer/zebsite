const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
});


/**
 * Send a Minecraft server command to Redis queue
 * @param {string} command - "on", "off", "restart"
 */
async function setState(command) {
  const valid_states = ["on", "off", "restart"];
  if (!valid_states.includes(command)) {
    throw { statusCode: 400, message: "Invalid state" };
  }

  // Push command to Redis list
  await redis.rpush("mc_commands_queue", command);

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
  const validProperties = ["max-players", "motd", "difficulty", "gamemode", "whitelist", "online-mode", "allow-flight", "view-distance"];
  const results = [];
  let has_error = false;
  for (const [property, value] of Object.entries(properties)) {
    if (!validProperties.includes(property)) {
      results.push({ property: property, status: "failed", message: "Invalid property" });
      has_error = true;
      continue;
    }

    const command = `setprop ${property} ${value}`;

    // Push command to Redis list
    await redis.rpush("mc_commands_queue", command);

    results.push({ property: property, value: value, status: "success", details: "Property change command queued successfully" });
  }

  if (has_error) {
    return { results, allowedProperties: validProperties };
  }
  return { results };
}

module.exports = {
  setState,
  setProperties,
};
