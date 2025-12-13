const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authenticateToken");

router.get("/", authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    service: req.user.service,
    role: req.user.role,
  });
});

module.exports = router;
