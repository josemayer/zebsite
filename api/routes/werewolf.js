const express = require("express");
const router = express.Router();
const werewolfService = require("../services/werewolf");

router.get("/", async function (req, res, next) {
  res.json({ message: "Werewolf API" });
});

router.get("/roles", async function (req, res, next) {
  res.json(werewolfService.roles());
});

router.get("/roles/:role", async function (req, res, next) {
  try {
    res.json(werewolfService.role(req.params.role));
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

module.exports = router;
