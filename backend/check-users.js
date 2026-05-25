const db = require('./db');

db.query('SELECT id, name, email, role FROM users;', (err, results) => {
  if (err) {
    console.error(err);
  } else {
    console.log(results);
  }
  process.exit(0);
});
