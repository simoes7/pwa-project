// db.js
require('dotenv').config();
const mysql = require('mysql2');

// Create a connection pool to handle reconnels and timeouts automatically
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mehdidb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the pool.promise() if you want to use async/await, 
// but for compatibility with existing code we export the pool directly
module.exports = pool;

console.log('MySQL Connection Pool created.');
