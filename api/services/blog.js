const db = require("./db");
const helper = require("../helper");
const bcrypt = require("bcrypt");

async function createPost(title, content, authorId) {
  try {
    // Insert the new post into the database
    const query =
      "INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3) RETURNING *";
    const result = await db.query(query, [title, content, authorId]);

    return helper.singleOrNone(result);
  } catch (err) {
    throw err;
  }
}

module.exports = {
  createPost,
};
