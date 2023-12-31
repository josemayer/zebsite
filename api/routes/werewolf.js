const express = require('express');
const router = express.Router();
const werewolfService = require('../services/werewolf');

router.get('/', async function(req, res, next) {
  res.json({ message: 'Werewolf API' });
});

router.get('/roles', async function(req, res, next) {
  res.json(werewolfService.roles());
});

module.exports = router;
