const db = require('./db');
const helper = require('../helper');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

async function login(username, password) {
  try {
    // Retrieve the user from the database based on the username
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    
    const user = helper.singleOrNone(result);

    // Check if the user exists and the password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    // Generate a JWT token with an expiration time
    const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '1h' });
    return token;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  login
};
