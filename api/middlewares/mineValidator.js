const validateMinecraftBusinessRules = (configs) => {
  const errors = [];

  const hasValue = (val) => {
    if (val === undefined || val === null || val === "") return false;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  };

  if (configs.MC_VERSION && !/^\d+\.\d+(\.\d+)?$/.test(configs.MC_VERSION)) {
    errors.push("MC_VERSION must be a valid semver (e.g., 1.21.1)");
  }

  const isPluginServer = ["PAPER", "SPIGOT"].includes(configs.TYPE);
  const isModdedServer = ["FORGE", "FABRIC"].includes(configs.TYPE);

  if (
    isPluginServer &&
    (hasValue(configs.CURSEFORGE_FILES) || hasValue(configs.MODRINTH_PROJECTS))
  ) {
    errors.push(
      `TYPE ${configs.TYPE} is for Plugins. Use SPIGET_RESOURCES instead of Mod lists.`
    );
  }

  if (isModdedServer && hasValue(configs.SPIGET_RESOURCES)) {
    errors.push(
      `TYPE ${configs.TYPE} is for Mods. Use CURSEFORGE_FILES or MODRINTH_PROJECTS instead of Plugins.`
    );
  }

  if (configs.MODPACK_PLATFORM === "AUTO_CURSEFORGE") {
    if (!isModdedServer) {
      errors.push(
        "MODPACK_PLATFORM=AUTO_CURSEFORGE requires a modded TYPE (FORGE/FABRIC/etc)."
      );
    }

    if (hasValue(configs.CF_PAGE_URL) && hasValue(configs.CURSEFORGE_FILES)) {
      errors.push(
        "Cannot use CF_PAGE_URL (Modpack) and CURSEFORGE_FILES (Individual Mods) together."
      );
    }

    if (hasValue(configs.CF_EXCLUDE_MODS) && !hasValue(configs.CF_PAGE_URL)) {
      errors.push(
        "You need CF_PAGE_URL modpack URL to exclude mods from modpack"
      );
    }
  }

  if (configs.MEMORY) {
    const memVal = parseInt(configs.MEMORY);
    if (memVal < 1) errors.push("MEMORY must be at least 1G.");
    if (isModdedServer && memVal < 2) {
      errors.push(
        "Modded servers (Forge/Fabric) require at least 2G of RAM to boot."
      );
    }
  }

  return errors;
};

const validateConfig = (req, res, next) => {
  const { configs } = req.body;
  const restrictedKeys = ["DOCKER_HOST", "PATH", "PWD", "CF_API_KEY"]; // Keys users shouldn't touch

  if (!configs || typeof configs !== "object") {
    return res.status(400).json({ message: "Invalid configs format." });
  }

  const keys = Object.keys(configs);

  // Security Rule: Restricted Environment Variables
  const hasRestricted = keys.some((k) => restrictedKeys.includes(k));
  if (hasRestricted) {
    return res.status(403).json({
      message:
        "Security Error: Attempted to modify restricted system variables.",
    });
  }

  const errors = validateMinecraftBusinessRules(configs);
  if (errors.length > 0) {
    return res
      .status(422)
      .json({ message: "Configuration with validation error", errors });
  }

  next();
};

module.exports = { validateConfig };
