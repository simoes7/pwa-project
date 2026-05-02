// createAdmin.js — Creates the admin user and assigns them to the 'bank' service
// Usage: node createAdmin.js
const bcrypt = require('bcrypt');
const db = require('./db');

const adminName     = 'Admin';
const adminEmail    = 'admin@admin.com';
const adminPassword = 'password'; // Change before production!
const adminService  = 'bank';     // Default service assignment

async function createAdmin() {
  try {
    // 1. Check if admin already exists
    db.query('SELECT * FROM users WHERE email = ?', [adminEmail], async (err, results) => {
      if (err) { console.error('Database error:', err); process.exit(1); }

      if (results.length > 0) {
        console.log('ℹ️  Admin user already exists!');
        process.exit(0);
      }

      // 2. Hash the password
      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // 3. Insert admin user
      const insertUser = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
      db.query(insertUser, [adminName, adminEmail, hashedPassword, 'admin'], (err, result) => {
        if (err) { console.error('Failed to insert admin:', err); process.exit(1); }

        const adminId = result.insertId;
        console.log(`✅ Admin user created (id=${adminId})`);

        // 4. Assign admin to the default service in staff_assignments
        const insertAssign = 'INSERT IGNORE INTO staff_assignments (user_id, service_id) VALUES (?, ?)';
        db.query(insertAssign, [adminId, adminService], (err) => {
          if (err) { console.error('Failed to create staff assignment:', err); process.exit(1); }

          console.log(`✅ Admin assigned to service: '${adminService}'`);
          console.log(`   Email:    ${adminEmail}`);
          console.log(`   Password: ${adminPassword}`);
          console.log(`   Role:     admin`);
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

createAdmin();
