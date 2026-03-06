const pool = require('../config/db');

// Fetch all updates (Newest first)
exports.getUpdates = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (error) {
    console.error("Error fetching updates:", error);
    res.status(500).json({ message: "Server error fetching updates." });
  }
};

// Admin posts a new announcement
exports.postUpdate = async (req, res) => {
  const { message, type } = req.body;
  if (req.user.role !== 'admin') return res.status(403).json({ message: "Only admins can post announcements." });

  try {
    await pool.query('INSERT INTO notifications (message, type) VALUES (?, ?)', [message, type || 'announcement']);
    res.status(201).json({ message: "Announcement posted successfully!" });
  } catch (error) {
    console.error("Error posting update:", error);
    res.status(500).json({ message: "Failed to post announcement." });
  }
};