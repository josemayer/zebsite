const { Pool } = require("pg");
const config = require("../config");
const pool = new Pool(config.db);

/**
 * Query the database using the pool
 * @param {*} query
 * @param {*} params
 *
 * @see https://node-postgres.com/features/pooling#single-query
 */
async function query(query, params) {
  const { rows, fields } = await pool.query(query, params);

  return rows;
}

/**
 * Gracefully terminate the pool
 */
async function close() {
  await pool.end();
  console.log("PostgreSQL pool has ended");
}

module.exports = {
  query,
  close,
};
