const bcrypt = require("bcryptjs");
const { pool } = require("./database");

async function createUser(stoneId, name, password) {
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    ,
    [stoneId, name, passwordHash]
  );

  return result.rows[0];
}

async function loginUser(stoneId, password) {
  const result = await pool.query(
    ,
    [stoneId]
  );

  if (!result.rows[0]) return null;

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) return null;

  return {
    id: user.id,
    stone_id: user.stone_id,
    name: user.name,
    avatar: user.avatar
  };
}

module.exports = { createUser, loginUser };
