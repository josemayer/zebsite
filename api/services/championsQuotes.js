const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function getWithPage(page = 1) {
  const offset = helper.getOffset(page, config.listPerPage);
  const rows = await db.query(
    'SELECT id, quote, champion FROM champions_quotes OFFSET $1 LIMIT $2', 
    [offset, config.listPerPage]
  );
  const data = helper.emptyOrRows(rows);
  const meta = {page};

  return {
    data,
    meta
  }
}

function validateCreate(championQuote) {
  let messages = [];

  console.log(championQuote);

  if (!championQuote) {
    messages.push('No object is provided');
  }

  if (!championQuote.championQuote) {
    messages.push('Champion quote is empty');
  }

  if (!championQuote.champion) {
    messages.push('Champion is empty');
  }

  if (championQuote.championQuote && championQuote.championQuote.length > 255) {
    messages.push('Champion quote cannot be longer than 255 characters');
  }

  if (championQuote.champion && championQuote.champion.length > 255) {
    messages.push('Champion name cannot be longer than 255 characters');
  }

  if (messages.length) {
    let error = new Error(messages.join());
    error.statusCode = 400;

    throw error;
  }
}

async function create(championQuote){
  validateCreate(championQuote);

  const result = await db.query(
    'INSERT INTO champions_quotes(quote, champion) VALUES ($1, $2) RETURNING *',
    [championQuote.championQuote, championQuote.champion]
  );
  let message = 'Error in creating champion quote';

  if (result.length) {
    message = 'Champion quote created successfully';
  }

  return {message};
}

module.exports = {
  getWithPage,
  create
}
