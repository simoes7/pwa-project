const db = require('./db');

db.query("UPDATE users SET role = 'super_admin' WHERE name = 'Super Admin' OR email LIKE '%superadmin%';", (err, results) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Updated to super_admin', results.affectedRows);
  }
  process.exit(0);
});
