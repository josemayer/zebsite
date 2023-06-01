const express = require('express');
const router = express.Router();
const championsQuotes = require('../services/championsQuotes');

router.get('/', async function(req, res, next) {
  try {
    res.json(await championsQuotes.getWithPage(req.query.page));
  } catch (err) {
    console.error(`Error getting champions quotes: `, err.message);
    res.status(err.statusCode || 500).json({'message': err.message});
  }
});

router.post('/', async function(req, res, next) {
  try {
    res.json(await championsQuotes.create(req.body));
  } catch (err) {
    console.error(`Error on posting champion quote: `, err.message);
    res.status(err.statusCode || 500).json({'message': err.message});
  }
});

module.exports = router;
