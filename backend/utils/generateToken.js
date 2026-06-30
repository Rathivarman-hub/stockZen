const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'syncstocksupersecret', {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
