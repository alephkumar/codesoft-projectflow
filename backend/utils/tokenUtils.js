const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'projectflow_fallback_jwt_secret_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'projectflow_fallback_jwt_refresh_secret_key_12345';

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken };
