const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

async function ensureAdminUser() {
  try {
    const email = 'admin@fci.com';
    const password = 'admin123';
    
    // 1. Generate the fresh hash
    const newHash = await bcrypt.hash(password, 10);
    
    // 2. Check if the user already exists
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length > 0) {
      // User exists, just update the password
      await pool.query(
        "UPDATE users SET password_hash = ?, is_active = TRUE WHERE email = ?",
        [newHash, email]
      );
      console.log("✅ Admin user found. Password successfully updated to: admin123");
    } else {
      // User is missing, let's create them!
      await pool.query(
        "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'admin', TRUE)",
        ['Admin', email, newHash]
      );
      console.log("✅ Admin user was missing. Successfully created new admin account with password: admin123");
    }
  } catch (err) {
    console.error("❌ Database error:", err);
  } 
  
  process.exit(); // Closes the script
}

ensureAdminUser();