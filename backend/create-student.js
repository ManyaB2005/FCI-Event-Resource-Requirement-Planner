const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

async function ensureStudentUser() {
  try {
    const email = 'student@fci.com';
    const password = 'student123'; // Setting a dedicated student password
    
    const newHash = await bcrypt.hash(password, 10);
    
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length > 0) {
      await pool.query(
        "UPDATE users SET password_hash = ?, is_active = TRUE WHERE email = ?",
        [newHash, email]
      );
      console.log("✅ Student account updated! Password is now: student123");
    } else {
      await pool.query(
        "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'student', TRUE)",
        ['Test Student', email, newHash]
      );
      console.log("✅ Student account created! Password is: student123");
    }
  } catch (err) {
    console.error("❌ Database error:", err);
  } 
  
  process.exit();
}

ensureStudentUser();