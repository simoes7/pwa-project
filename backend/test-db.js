const mysql = require('mysql2/promise');
mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'pwa-project'})
  .then(async c => {
    try {
      await c.query("ALTER TABLE audit_logs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;");
      console.log('Altered audit_logs collation successfully.');
    } catch(err) {
      console.error('Error:', err);
    } finally {
      c.end();
    }
  });
