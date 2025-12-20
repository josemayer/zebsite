const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  verifyAdminRole,
} = require("../middlewares/authenticateToken");
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

module.exports = router;
