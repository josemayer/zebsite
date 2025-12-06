const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  verifyAdminRole,
} = require("../middlewares/authenticateToken");
const mineService = require("../services/mine");

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

module.exports = router;
