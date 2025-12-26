const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  verifyAdminRole,
} = require("../middlewares/authenticateToken");
const { validateConfig } = require("../middlewares/mineValidator");
const mineService = require("../services/mine");

// GET /mine/status
router.get(
  "/status",
  [authenticateToken, verifyAdminRole],
  async function (req, res) {
    try {
      const result = await mineService.getStatus();
      return res.status(200).json(result);
    } catch (err) {
      console.error(`Error fetching minecraft status:`, err.message);
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Internal server error" });
    }
  }
);

// GET /mine/properties
router.get(
  "/properties",
  [authenticateToken, verifyAdminRole],
  async function (req, res) {
    try {
      const result = await mineService.getProperties();
      return res.status(200).json(result);
    } catch (err) {
      console.error(`Error fetching minecraft properties:`, err.message);
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Internal server error" });
    }
  }
);

// PUT /mine/state
router.put(
  "/state",
  [authenticateToken, verifyAdminRole],
  async function (req, res) {
    try {
      const { state } = req.body;

      if (!state) {
        return res.status(400).json({ message: "Missing 'state' in body" });
      }

      const validStates = ["on", "off", "restart"];
      if (!validStates.includes(state)) {
        return res.status(400).json({
          message: `Invalid state. Allowed: ${validStates.join(", ")}`,
        });
      }

      const result = await mineService.setState(state);

      return res.status(200).json({
        message: `Server state transition initiated`,
        state: result.state,
        details: result.details,
      });
    } catch (err) {
      console.error(`Error during minecraft server state change:`, err.message);
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Internal server error" });
    }
  }
);

// PUT /mine/properties
router.put(
  "/properties",
  [authenticateToken, verifyAdminRole],
  async function (req, res) {
    try {
      const { properties } = req.body;

      if (!properties) {
        return res
          .status(400)
          .json({ message: "Missing 'properties' in body" });
      }

      const result = await mineService.setProperties(properties);

      return res.status(200).json({
        message: `Server properties change initiated`,
        details: result,
      });
    } catch (err) {
      console.error(
        `Error during minecraft server properties change:`,
        err.message
      );
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Internal server error" });
    }
  }
);

// GET /mine/backups
router.get(
  "/backups",
  [authenticateToken, verifyAdminRole],
  async (req, res) => {
    try {
      const result = await mineService.listBackups();
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /mine/backups
router.post(
  "/backups",
  [authenticateToken, verifyAdminRole],
  async (req, res) => {
    try {
      const result = await mineService.createBackup();
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /mine/backups/restore
router.post(
  "/backups/restore",
  [authenticateToken, verifyAdminRole],
  async (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename)
        return res.status(400).json({ message: "Filename is required" });
      const result = await mineService.restoreBackup(filename);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /mine/backups/rename
router.put(
  "/backups/rename",
  [authenticateToken, verifyAdminRole],
  async function (req, res) {
    try {
      const { filename, newName } = req.body;

      if (!filename || !newName) {
        return res.status(400).json({
          message: "Missing 'filename' (source) or 'newName' (target) in body",
        });
      }

      const result = await mineService.renameBackup(filename, newName);

      return res.status(200).json(result);
    } catch (err) {
      console.error(`Error renaming backup:`, err.message);
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Internal server error" });
    }
  }
);

// DELETE /mine/backups/{filename}
router.delete(
  "/backups/:filename",
  [authenticateToken, verifyAdminRole],
  async (req, res) => {
    try {
      const result = await mineService.deleteBackup(req.params.filename);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /mine/players/kick
router.post(
  "/players/kick",
  [authenticateToken, verifyAdminRole],
  async (req, res) => {
    try {
      const { player } = req.body;
      const result = await mineService.kickPlayer(player);
      res.json({ message: `Kick command sent for ${player}`, details: result });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /mine/players/ban
router.post(
  "/players/ban",
  [authenticateToken, verifyAdminRole],
  async (req, res) => {
    try {
      const { player, reason } = req.body;
      const result = await mineService.banPlayer(player, reason);
      res.json({ message: `Ban command sent for ${player}`, details: result });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /mine/version
router.put(
  "/version",
  [authenticateToken, verifyAdminRole],
  async (req, res) => {
    try {
      const { version } = req.body;
      const result = await mineService.setVersion(version);
      res.json({ message: `Version update to ${version} initiated` });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /mine/world/reset
router.post(
  "/world/reset",
  [authenticateToken, verifyAdminRole],
  async (req, res) => {
    try {
      const { seed } = req.body;
      await mineService.resetWorld(seed);
      res.json({ message: "World reset initiated" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /mine/live
router.get("/live", [authenticateToken, verifyAdminRole], async (req, res) => {
  try {
    const result = await mineService.getLiveInfo();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /mine/backups
router.get(
  "/backups",
  [authenticateToken, verifyAdminRole],
  async (req, res) => {
    try {
      const result = await mineService.listBackups();
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /mine/config
router.put(
  "/config",
  [authenticateToken, verifyAdminRole, validateConfig],
  async function (req, res) {
    try {
      const result = await mineService.configServer(req.body.configs);
      return res.status(200).json({
        message: "Server configuration update initiated",
        details: result,
      });
    } catch (err) {
      console.error(`Error during minecraft config update:`, err.message);
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message || "Internal server error" });
    }
  }
);

// GET /mine/config
router.get(
  "/config",
  [authenticateToken, verifyAdminRole],
  async (req, res) => {
    try {
      const result = await mineService.getServerConfig();
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
