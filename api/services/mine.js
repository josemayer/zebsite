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
  const validProperties = [
    "max-players",
    "motd",
    "difficulty",
    "gamemode",
    "whitelist",
    "online-mode",
    "allow-flight",
    "view-distance",
  ];

  const entries = Object.entries(properties);

  const { results, validProps, hasError } = entries.reduce(
    (acc, [property, value]) => {
      if (!validProperties.includes(property)) {
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
        if (value.contains(" ")) {
          value = `"${value}"`;
        }
        acc.validProps.push(`${property}=${value}`);
      }
      return acc;
    },
    { results: [], validProps: [], hasError: false }
  );

  if (validProps.length > 0) {
    const command = `setprop ${validProps.join(" ")}`;
    await redis.rpush("mc_commands_queue", command);
  }

  if (hasError) {
    return { results, allowedProperties: validProperties };
  }
  return { results };
}

module.exports = {
  setState,
  setProperties,
};
