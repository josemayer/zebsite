const db = require("../../services/db");

async function resetDatabase() {
  await db.query(
    "TRUNCATE TABLE users, posts, champions_quotes RESTART IDENTITY CASCADE"
  );
}

module.exports = { resetDatabase };
