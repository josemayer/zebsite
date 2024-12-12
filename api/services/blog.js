const db = require("./db");
const helper = require("../helper");
const bcrypt = require("bcrypt");

async function createPost(data, authorId) {
  try {
    const { title, subtitle, category_id, content } = data;

    const now = new Date().toISOString();

    const query =
      "INSERT INTO posts (title, subtitle, category_id, content, author_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *";
    const result = await db.query(query, [
      title,
      subtitle,
      category_id,
      content,
      authorId,
      now,
      now,
    ]);

    return helper.singleOrNone(result);
  } catch (err) {
    throw err;
  }
}

async function listPosts() {
  try {
    const query =
      "SELECT p.id, p.title, p.subtitle, u.username as author FROM posts as p, users as u WHERE p.author_id = u.id ORDER BY p.id DESC";
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
    await verifyPostExistence(id);

    const query = "DELETE FROM posts WHERE id = $1";
    const result = await db.query(query, [id]);

    return { id };
  } catch (err) {
    throw err;
  }
}

async function editPost(id, newData) {
  try {
    await verifyPostExistence(id);

    const updateKeys = Object.keys(newData);
    const allowedKeys = ["title", "subtitle", "category_id", "content"];

    if (
      updateKeys.length === 0 ||
      !updateKeys.some((key) => allowedKeys.includes(key))
    )
      throw {
        statusCode: 403,
        message: `None of your keys are allowed. Consider these fields to edit: ${allowedKeys.join(
          ", "
        )}`,
      };

    let query = "UPDATE posts SET ";
    let newValues = [];

    // query builder
    Object.entries(newData).forEach(([key, value], i) => {
      if (allowedKeys.includes(key)) {
        query += `${key} = \$${i + 1}, `;
        newValues.push(value);
      }
    });
    query = query.slice(0, -2);
    query += ` WHERE id = \$${newValues.length + 1}`;
    newValues.push(id);

    await db.query(query, newValues);

    return { id };
  } catch (err) {
    throw err;
  }
}

async function verifyPostExistence(id) {
  const verifyQuery = "SELECT * FROM posts WHERE id = $1";
  const verifyResult = await db.query(verifyQuery, [id]);

  const post = helper.singleOrNone(verifyResult);

  if (!post) throw { statusCode: 404, message: "Post not found" };

  return post;
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
  editPost,
};
