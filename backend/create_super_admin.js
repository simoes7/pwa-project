const bcrypt = require('bcrypt');
const db = require('./db');

const createSuperAdmin = async () => {
  try {
    const email = 'superadmin@example.com';
    const rawPassword = 'password123';
    const hashed = await bcrypt.hash(rawPassword, 10);

    const checkQuery = 'SELECT id FROM users WHERE email = ?';
    db.query(checkQuery, [email], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        process.exit(1);
      }

      if (results.length > 0) {
        // Update existing user to super_admin and set new password
        const updateQuery = "UPDATE users SET role = 'super_admin', password = ? WHERE email = ?";
        db.query(updateQuery, [hashed, email], (err) => {
          if (err) {
            console.error('Failed to update user:', err);
          } else {
            console.log('Super Admin account updated successfully!');
            console.log('Email:', email);
            console.log('Password:', rawPassword);
          }
          process.exit(0);
        });
      } else {
        // Insert new super admin
        const insertQuery = "INSERT INTO users (name, email, password, phone_number, role, is_active) VALUES (?, ?, ?, ?, 'super_admin', 1)";
        db.query(insertQuery, ['Super Admin', email, hashed, '1234567890'], (err) => {
          if (err) {
            console.error('Failed to create super admin:', err);
          } else {
            console.log('Super Admin account created successfully!');
            console.log('Email:', email);
            console.log('Password:', rawPassword);
          }
          process.exit(0);
        });
      }
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    process.exit(1);
  }
};

createSuperAdmin();
