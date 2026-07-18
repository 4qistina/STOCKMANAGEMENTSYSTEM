const pool = require('../configuration/db');

async function findAll() {
    const result = await pool.query('SELECT * FROM users');
    return result.rows;
}

async function findById(userID) {
    const result = await pool.query('SELECT * FROM users WHERE userID = $1', [userID]);
    return result.rows[0];
}

async function findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
}

async function insert({ userFullname, username, userPassword, role }) {
    const result = await pool.query(
        `INSERT INTO users ("userFullname", "username", "userPassword", "role") VALUES ($1, $2, $3, $4) RETURNING *`,
        [userFullname, username, userPassword, role]
    );
    
    return result.rows[0];
}

async function update(userID, { userFullname, role }) {
  const result = await pool.query(
    `UPDATE users SET "userFullname" = $1, "role" = $2 WHERE "userID" = $3 RETURNING *`,
    [userFullname, role, userID]
  );
  return result.rows[0];
}

async function remove(userID) {
  await pool.query('DELETE FROM users WHERE "userID" = $1', [userID]);
}

module.exports = { findAll, findAll, findByUsername, insert, update, remove };