const pool = require('../config/db');

// 1. Fetch ALL available classes for the student to join
exports.getAvailableClasses = async (req, res) => {
  try {
    // LEFT JOIN ensures classes show even if folder/event links are missing
    // c.* safely ignores seat_limit since it's removed from the database
    const [rows] = await pool.query(`
      SELECT 
        c.*, 
        c.name AS class_name,
        c.class_type,
        f.name AS folder_name, 
        e.name AS event_name 
      FROM classes c
      LEFT JOIN class_folders f ON c.folder_id = f.folder_id
      LEFT JOIN events e ON f.event_id = e.event_id
      ORDER BY c.date ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching available classes:", error);
    res.status(500).json({ message: "Error fetching classes" });
  }
};

// 2. Register for a Class
exports.registerForClass = async (req, res) => {
  const { classId } = req.params;
  const userId = req.user.id;

  try {
    // Check if the class actually exists first
    const [classData] = await pool.query(
      `SELECT class_id FROM classes WHERE class_id = ?`,
      [classId]
    );

    if (classData.length === 0) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Insert registration directly (No seat limits to check anymore!)
    await pool.query(
      'INSERT INTO registrations (class_id, user_id) VALUES (?, ?)', 
      [classId, userId]
    );
    
    res.status(201).json({ message: "Successfully registered!" });
  } catch (error) {
    // Safely handle if they double-click or try to register twice
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "You are already registered." });
    }
    
    console.error("Registration Error:", error);
    res.status(400).json({ message: "Failed to register for class." });
  }
};

// 3. Get my enrolled classes with full details
exports.getMyRegistrations = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.registration_id, 
        r.presentation_link, 
        c.class_id,
        c.name AS class_name, 
        c.date, 
        c.time, 
        c.venue, 
        c.class_type,
        c.drive_link, 
        c.requires_ppt
      FROM registrations r
      INNER JOIN classes c ON r.class_id = c.class_id
      WHERE r.user_id = ?
    `, [userId]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Error fetching registrations" });
  }
};

// 4. Manual "Mark as Uploaded"
exports.markAsUploaded = async (req, res) => {
  const { registrationId } = req.params;
  try {
    await pool.query(
      'UPDATE registrations SET presentation_link = "COMPLETED" WHERE registration_id = ?',
      [registrationId]
    );
    res.json({ message: "Marked as uploaded" });
  } catch (error) {
    console.error("Upload status error:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// 5. Submit Presentation Link (kept for backward compatibility)
exports.submitPresentationLink = async (req, res) => {
  const classId = req.params.id; 
  const { presentation_link } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await pool.query(
      'UPDATE registrations SET presentation_link = ? WHERE class_id = ? AND user_id = ?',
      [presentation_link, classId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Registration not found." });
    }

    res.status(200).json({ message: "Link saved successfully." });
  } catch (error) {
    console.error("Error submitting link:", error);
    res.status(500).json({ message: "Server error" });
  }
};