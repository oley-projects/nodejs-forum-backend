const jwt = require('jsonwebtoken');
const dotenvConf = require('dotenv').config();
const TOKEN_KEY = dotenvConf.parsed.TOKEN_KEY;

module.exports = (req, res, next) => {
  const authHeaders = req.get('Authorization');
  if (!authHeaders) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  const token = authHeaders.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, TOKEN_KEY);
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};
