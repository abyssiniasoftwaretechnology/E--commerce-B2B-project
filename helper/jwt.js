const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}

/**
 * Generate JWT token for a user
 * @param {Object} payload - object containing user info (id, username)
 * @param {string} expiresIn - optional, defaults to 1h
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = "1h") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = { generateToken };
