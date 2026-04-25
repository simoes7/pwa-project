// db.js
const mysql = require('mysql2');

// Create a connection pool to handle reconnels and timeouts automatically
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pwa-project',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the pool.promise() if you want to use async/await, 
// but for compatibility with existing code we export the pool directly
module.exports = pool;

console.log('MySQL Connection Pool created.');
