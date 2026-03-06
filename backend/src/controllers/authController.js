const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password, role, batch } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role, batch) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'student', batch || null]
    );
    res.status(201).json({ message: "User created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. LOGIN (Updated to send 'batch' to the frontend)
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!password) return res.status(400).json({ message: "Please provide a password." });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    if (!user.password_hash) return res.status(500).json({ message: "Password missing in DB." });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const actualUserId = user.user_id || user.id;

    // ADDED 'batch' to the token
    const token = jwt.sign(
      { id: actualUserId, role: user.role, name: user.name, email: user.email, batch: user.batch },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ADDED 'batch' to the user response object
    res.json({ 
      token, 
      user: { 
        id: actualUserId, 
        name: user.name, 
        role: user.role, 
        email: user.email, 
        batch: user.batch 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id; 
  try {
    // Note: If your primary key is user_id instead of id, change 'id = ?' to 'user_id = ?' below
    await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ? OR user_id = ?', [name, email, userId, userId]);
    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile." });
  }
};
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ? OR user_id = ?', [userId, userId]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) return res.status(401).json({ message: "Incorrect current password" });

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ? OR user_id = ?', [hashedNew, userId, userId]);
    
    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update password." });
  }
};
exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;
  try {
    await pool.query('DELETE FROM users WHERE id = ? OR user_id = ?', [userId, userId]);
    res.json({ message: "Account deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account." });
  }
};