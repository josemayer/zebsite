const db = require("./db");
const helper = require("../helper");
const bcrypt = require("bcrypt");

async function createPost(title, content, authorId) {
  try {
    const query =
      "INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3) RETURNING *";
    const result = await db.query(query, [title, content, authorId]);

    return helper.singleOrNone(result);
  } catch (err) {
    throw err;
  }
}

async function listPosts() {
  try {
    const query =
      "SELECT p.id, p.title, u.username as author FROM posts as p, users as u WHERE p.author_id = u.id";
    const result = await db.query(query);

    return helper.emptyOrRows(result);
  } catch (err) {
    throw err;
  }
}

async function showPostDetails(id) {
  try {
    const query =
      "SELECT p.*, u.username as author FROM posts as p, users as u WHERE p.author_id = u.id AND p.id = $1";
    const result = await db.query(query, [id]);

    const post = helper.singleOrNone(result);

    if (!post) throw { statusCode: 404, message: "Post not found" };

    return post;
  } catch (err) {
    throw err;
  }
}

async function deletePost(id) {
  try {
    const verifyQuery = "SELECT * FROM posts WHERE id = $1";
    const verifyResult = await db.query(verifyQuery, [id]);

    const post = helper.singleOrNone(verifyResult);

    if (!post) throw { statusCode: 404, message: "Post not found" };

    const query = "DELETE FROM posts WHERE id = $1";
    const result = await db.query(query, [id]);

    return result;
  } catch (err) {
    throw err;
  }
}

function filterData(data) {
  if (!data) return data;

  if (data.author_id) delete data.author_id;

  return data;
}

module.exports = {
  createPost,
  listPosts,
  showPostDetails,
  deletePost,
};
