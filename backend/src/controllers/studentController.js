const pool = require('../config/db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.getAvailableClasses = async (req, res) => {
  try {
    const query = `
      SELECT c.class_id, c.name as class_name, c.date, c.time, c.venue, c.seat_limit,
        f.name as folder_name, e.name as event_name, e.type as event_type,
        (SELECT COUNT(*) FROM registrations r WHERE r.class_id = c.class_id) as current_enrollment
      FROM classes c
      JOIN class_folders f ON c.folder_id = f.folder_id
      JOIN events e ON f.event_id = e.event_id
      ORDER BY c.date ASC
    `;
    const [classes] = await pool.query(query);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch classes" });
  }
};

exports.registerForClass = async (req, res) => {
  const { classId } = req.params;
  const userId = req.user.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [classData] = await connection.query(
      `SELECT seat_limit, (SELECT COUNT(*) FROM registrations WHERE class_id = ?) as current_count FROM classes WHERE class_id = ? FOR UPDATE`,
      [classId, classId]
    );

    if (classData.length === 0) throw new Error("Class not found");
    const { seat_limit, current_count } = classData[0];

    if (seat_limit > 0 && current_count >= seat_limit) {
      throw new Error("Class is fully booked");
    }

    await connection.query('INSERT INTO registrations (class_id, user_id) VALUES (?, ?)', [classId, userId]);
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

exports.getNotifications = async (req, res) => {
  try {
    const [notifications] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5');
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

exports.getMyRegistrations = async (req, res) => {
  const userId = req.user.id;
  try {
    const query = `
      SELECT c.class_id, c.name as class_name, c.date, c.venue, c.requires_ppt, r.presentation_link
      FROM registrations r
      JOIN classes c ON r.class_id = c.class_id
      WHERE r.user_id = ?
      ORDER BY c.date ASC
    `;
    const [myClasses] = await pool.query(query, [userId]);
    res.json(myClasses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
};

exports.submitPresentationEmail = async (req, res) => {
  const { classId } = req.params;
  const file = req.file;
  const studentName = req.user.name || "A Student";

  if (!file) return res.status(400).json({ message: "No file uploaded." });

  try {
    const [classData] = await pool.query('SELECT name FROM classes WHERE class_id = ?', [classId]);
    const className = classData.length > 0 ? classData[0].name : "Unknown Class";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECEIVER,
      subject: `New Presentation: ${className} - ${studentName}`,
      text: `${studentName} has submitted their presentation for: ${className}.\n\nFind the file attached.`,
      attachments: [{ filename: file.originalname, content: file.buffer }]
    };

    await transporter.sendMail(mailOptions);
    await pool.query('UPDATE registrations SET presentation_link = ? WHERE class_id = ? AND user_id = ?', [file.originalname, classId, req.user.id]);

    res.json({ message: "Presentation emailed to the trainer!" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
};