const express = require('express');
const router = express.Router();
const registerService = require('../services/register');

// Register route
router.post('/', async function(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await registerService.register(username, password);
    res.json(result);
  } catch (err) {
    console.error(`Error during registration:`, err.message);
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = router;
