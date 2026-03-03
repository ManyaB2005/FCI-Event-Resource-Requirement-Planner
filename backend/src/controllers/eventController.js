const pool = require('../config/db');
const nodemailer = require('nodemailer');

// Set up the email sender
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalEvents] = await pool.query('SELECT COUNT(*) as count FROM events');
    const [upcomingEvents] = await pool.query('SELECT COUNT(*) as count FROM events WHERE status = "planned"');
    const [resources] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN status="confirmed" THEN 1 ELSE 0 END) as confirmed FROM resources');

    res.json({
      totalEvents: totalEvents[0].count,
      upcomingEvents: upcomingEvents[0].count,
      resourcesPlanned: resources[0].total || 0,
      resourcesCompleted: resources[0].confirmed || 0,
      completionRate: resources[0].total ? Math.round((resources[0].confirmed / resources[0].total) * 100) : 0
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const [events] = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
    const [folders] = await pool.query('SELECT * FROM class_folders');
    const [classes] = await pool.query('SELECT * FROM classes');
    const [resources] = await pool.query('SELECT * FROM resources');

    const formattedEvents = events.map(event => {
      const eventFolders = folders.filter(f => f.event_id === event.event_id).map(folder => {
        const folderClasses = classes.filter(c => c.folder_id === folder.folder_id).map(cls => {
          const classResources = resources.filter(r => r.class_id === cls.class_id).map(r => ({
            ...r, completed: r.status === 'confirmed'
          }));
          return { ...cls, resources: classResources };
        });
        return { ...folder, classes: folderClasses };
      });
      return { ...event, folders: eventFolders };
    });

    res.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

// --- EVENT CRUD ---
exports.createEvent = async (req, res) => {
  const { name, type, description, start_date, end_date } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO events (name, type, description, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
      [name, type || 'Training', description, start_date, end_date]
    );
    await pool.query('INSERT INTO notifications (message) VALUES (?)', [`New Event Announced: ${name}`]);
    res.status(201).json({ message: "Event created successfully", event_id: result.insertId });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
};

exports.updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const { name, type } = req.body;
  try {
    await pool.query('UPDATE events SET name = ?, type = ? WHERE event_id = ?', [name, type, eventId]);
    res.json({ message: "Event updated successfully" });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
};

exports.deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  try {
    await pool.query('DELETE FROM events WHERE event_id = ?', [eventId]);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Failed to delete event. Please ensure all classes inside are deleted first." });
  }
};

// --- FOLDER CRUD ---
exports.createFolder = async (req, res) => {
  const { eventId } = req.params;
  const { name } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO class_folders (event_id, name) VALUES (?, ?)', [eventId, name]);
    res.status(201).json({ message: "Folder created", folder_id: result.insertId });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ message: "Failed to create folder" });
  }
};

// --- CLASS CRUD ---
exports.createClass = async (req, res) => {
  const { folderId } = req.params;
  const { name, date, time, venue, trainer_name, seat_limit, requires_ppt } = req.body;
  
  try {
    const [result] = await pool.query(
      `INSERT INTO classes (folder_id, name, date, time, venue, trainer_name, seat_limit, requires_ppt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [folderId, name, date, time, venue, trainer_name, seat_limit || 0, requires_ppt || false]
    );
    
    await pool.query('INSERT INTO notifications (message) VALUES (?)', [`New Class Scheduled: ${name} on ${date}`]);
    
    try {
        const [students] = await pool.query("SELECT email FROM users WHERE role = 'student' AND is_active = TRUE");
        if (students.length > 0) {
            const emailList = students.map(s => s.email).join(',');
            const mailOptions = {
                from: process.env.EMAIL_USER, to: process.env.EMAIL_USER, bcc: emailList,
                subject: `📢 New Class Scheduled: ${name}`,
                text: `Hello,\n\nA new class has just been scheduled!\n\nDetails:\n- Topic: ${name}\n- Date: ${date}\n- Time: ${time}\n- Venue: ${venue}\n\nLog in to your dashboard to register!\n\nBest,\nFCI Administration`
            };
            await transporter.sendMail(mailOptions);
        }
    } catch (emailErr) {
        console.error("Failed to send broadcast email:", emailErr);
    }

    res.status(201).json({ message: "Class created!", class_id: result.insertId });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ message: "Failed to create class" });
  }
};

exports.updateClass = async (req, res) => {
  const { classId } = req.params;
  const { name, date, time, venue, seat_limit, resources, requires_ppt } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      'UPDATE classes SET name=?, date=?, time=?, venue=?, seat_limit=?, requires_ppt=? WHERE class_id=?',
      [name, date, time, venue, seat_limit || 0, requires_ppt || false, classId]
    );

    await connection.query('DELETE FROM resources WHERE class_id=?', [classId]);
    if (resources && resources.length > 0) {
      const resourceValues = resources.map(r => [classId, r.name, r.quantity || 1, r.unit || 'pcs', r.status || 'planned']);
      await connection.query('INSERT INTO resources (class_id, name, quantity, unit, status) VALUES ?', [resourceValues]);
    }

    await connection.commit();
    res.json({ message: "Class updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating class:", error);
    res.status(500).json({ message: "Failed to update class" });
  } finally {
    connection.release();
  }
};

exports.deleteClass = async (req, res) => {
  const { classId } = req.params;
  try {
    await pool.query('DELETE FROM classes WHERE class_id = ?', [classId]);
    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ message: "Failed to delete class" });
  }
};

// --- RESOURCE MASTER LIST ---
exports.getAllResources = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.resource_id, r.name as resource_name, r.quantity, r.unit, r.status,
        c.name as class_name, c.date as class_date, c.venue,
        e.name as event_name
      FROM resources r
      JOIN classes c ON r.class_id = c.class_id
      JOIN class_folders f ON c.folder_id = f.folder_id
      JOIN events e ON f.event_id = e.event_id
      ORDER BY c.date ASC
    `;
    const [resources] = await pool.query(query);
    res.json(resources);
  } catch (error) {
    console.error("Error fetching master resources:", error);
    res.status(500).json({ message: "Failed to fetch resource master list" });
  }
};

exports.updateResourceStatus = async (req, res) => {
  const { resourceId } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE resources SET status = ? WHERE resource_id = ?', [status, resourceId]);
    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// Add a single resource directly from the Planning Dashboard
exports.addSingleResource = async (req, res) => {
  const { classId } = req.params;
  const { name, quantity } = req.body;
  try {
    await pool.query(
      'INSERT INTO resources (class_id, name, quantity, unit, status) VALUES (?, ?, ?, "pcs", "planned")',
      [classId, name, quantity || 1]
    );
    res.status(201).json({ message: "Resource added successfully" });
  } catch (error) {
    console.error("Error adding resource:", error);
    res.status(500).json({ message: "Failed to add resource" });
  }
};