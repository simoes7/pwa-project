const bcrypt = require('bcrypt');
const db = require('./db');

// The admin details you want to create
const adminName = 'Admin';
const adminEmail = 'admin@admin.com';
const adminPassword = 'password'; // Change this if you want a different admin password

async function createAdmin() {
  try {
    // 1. Check if admin already exists
    db.query('SELECT * FROM users WHERE email = ?', [adminEmail], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        process.exit(1);
      }

      if (results.length > 0) {
        console.log('Admin user already exists!');
        process.exit(0);
      }

      // 2. Hash the password
      console.log('Hashing password...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      // 3. Insert into the database with the role of 'admin'
      const query = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
      db.query(query, [adminName, adminEmail, hashedPassword, 'admin'], (err, result) => {
        if (err) {
          console.error('Failed to insert admin:', err);
          process.exit(1);
        }

        console.log('✅ Admin user successfully created!');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log(`Role: admin`);
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

createAdmin();
