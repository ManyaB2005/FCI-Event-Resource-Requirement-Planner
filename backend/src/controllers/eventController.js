const pool = require('../config/db');
const { sendClassNotification } = require('../utils/emailService');

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
  const { name, description, start_date, end_date } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO events (name, description, start_date, end_date) VALUES (?, ?, ?, ?)',
      [name, description, start_date, end_date]
    );
    await pool.query('INSERT INTO notifications (message, type) VALUES (?, ?)', [`New Event Announced: ${name}`, 'announcement']);
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
  const { name, batch } = req.body; 
  try {
    const [result] = await pool.query(
      'INSERT INTO class_folders (event_id, name, batch) VALUES (?, ?, ?)', 
      [eventId, name, batch || null]
    );
    res.status(201).json({ message: "Folder created", folder_id: result.insertId });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ message: "Failed to create folder" });
  }
};

exports.deleteFolder = async (req, res) => {
  const { folderId } = req.params;
  try {
    await pool.query('DELETE FROM class_folders WHERE folder_id = ?', [folderId]);
    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ message: "Failed to delete folder. Ensure classes inside are deleted first." });
  }
};

// --- CLASS CRUD ---
exports.createClass = async (req, res) => {
  const { folderId } = req.params;
  const { name, date, time, venue, seat_limit, requires_ppt, drive_link, resources } = req.body;
  
  try {
    // 1. Save the class to the database
    const [result] = await pool.query(
      'INSERT INTO classes (folder_id, name, date, time, venue, seat_limit, requires_ppt, drive_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [folderId, name, date, time, venue, seat_limit, requires_ppt, drive_link]
    );
    const classId = result.insertId;

    // Save resources if any exist
    if (resources && resources.length > 0) {
      for (let res of resources) {
        await pool.query(
          'INSERT INTO resources (class_id, name, quantity) VALUES (?, ?, ?)',
          [classId, res.name, res.quantity]
        );
      }
    }

    // --- AUTOMATION START ---
    
    // 2. Post to the Updates/Notification Feed automatically
    const announcementMsg = `New Class Added: ${name} is scheduled for ${new Date(date).toLocaleDateString()} at ${venue || 'TBA'}.`;
    await pool.query('INSERT INTO notifications (message, type) VALUES (?, ?)', [announcementMsg, 'announcement']);

    // 3. Fetch all active student emails
    const [students] = await pool.query('SELECT email FROM users WHERE role = "student"');
    const studentEmails = students.map(s => s.email);

    // 4. Send the email (runs in background)
    if (studentEmails.length > 0) {
      sendClassNotification(name, date, time, venue, studentEmails);
    }

    // --- AUTOMATION END ---

    res.status(201).json({ message: "Class created, feed updated, and emails sent!", class_id: classId });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ message: "Failed to create class" });
  }
};

exports.updateClass = async (req, res) => {
  const { classId } = req.params;
  const { name, date, time, venue, seat_limit, resources, requires_ppt, drive_link } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    
    await connection.query(
      'UPDATE classes SET name=?, date=?, time=?, venue=?, seat_limit=?, requires_ppt=?, drive_link=? WHERE class_id=?',
      [name, date, time, venue, seat_limit || 0, requires_ppt || false, drive_link || null, classId]
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