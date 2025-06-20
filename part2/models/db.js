const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',v
  user: 'root',
  password: '', // added password field
  database: 'DogWalkService',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
