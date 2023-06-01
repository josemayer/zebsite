const db = require('./db');
const helper = require('../helper');
const bcrypt = require('bcrypt');

async function register(username, password) {
  try {
    // Check if the username is already taken
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    const existingUser = helper.singleOrNone(result);
    if (existingUser) {
      throw { statusCode: 400, message: 'Username already taken' };
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const insertQuery = 'INSERT INTO users (username, password) VALUES ($1, $2)';
    await db.query(insertQuery, [username, hashedPassword]);

    return { message: 'Registration successful' };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  register
};
