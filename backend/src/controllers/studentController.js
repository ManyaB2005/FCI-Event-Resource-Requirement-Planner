const pool = require('../config/db');

// 1. Fetch ALL available classes for the student to join
exports.getAvailableClasses = async (req, res) => {
  try {
    // LEFT JOIN ensures classes show even if folder/event links are missing
    // We select c.name AS class_name to keep it consistent for the frontend
    const [rows] = await pool.query(`
      SELECT 
        c.*, 
        c.name AS class_name,
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
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    
    // Check seat limits
    const [classData] = await connection.query(
      `SELECT seat_limit, (SELECT COUNT(*) FROM registrations WHERE class_id = ?) as current_count FROM classes WHERE class_id = ? FOR UPDATE`,
      [classId, classId]
    );

    if (classData.length === 0) throw new Error("Class not found");
    const { seat_limit, current_count } = classData[0];

    if (seat_limit > 0 && current_count >= seat_limit) {
      throw new Error("Class is fully booked");
    }

    // IMPORTANT: Check if your table uses 'user_id' or 'student_id'. 
    // Based on your previous error, I am using 'user_id' to match your INSERT.
    await connection.query(
      'INSERT INTO registrations (class_id, user_id) VALUES (?, ?)', 
      [classId, userId]
    );
    
    await connection.commit();
    res.status(201).json({ message: "Successfully registered!" });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "You are already registered." });
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// 3. Get my enrolled classes with full details
exports.getMyRegistrations = async (req, res) => {
  const userId = req.user.id;
  try {
    // FIX: Changed 'WHERE student_id' to 'WHERE user_id' to match your registration logic
    const [rows] = await pool.query(`
      SELECT 
        r.registration_id, 
        r.presentation_link, 
        c.class_id,
        c.name AS class_name, 
        c.date, 
        c.time, 
        c.venue, 
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