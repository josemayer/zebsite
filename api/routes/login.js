const express = require('express');
const router = express.Router();
const loginService = require('../services/login');

// Login route
router.post('/', async function(req, res, next) {
  try {
    const { username, password } = req.body;
    const token = await loginService.login(username, password);
    res.json({ token });
  } catch (err) {
    console.error(`Error during login:`, err.message);
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

module.exports = router;
