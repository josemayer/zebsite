const db = require("../../services/db");

async function resetDatabase() {
  await db.query(
    "TRUNCATE TABLE users, posts, champions_quotes RESTART IDENTITY CASCADE"
  );
}

async function resetUsers() {
  await db.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
}

async function resetPosts() {
  await db.query("TRUNCATE TABLE posts RESTART IDENTITY CASCADE");
}

module.exports = { resetDatabase, resetUsers, resetPosts };
