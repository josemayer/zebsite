const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticateToken');

router.get('/', authenticateToken, (req, res) => {
  res.json({ message: `You are logged in` });
});

module.exports = router;
