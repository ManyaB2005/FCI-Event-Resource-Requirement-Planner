// backend/controllers/registrationController.js
const db = require('../config/db'); // Your database connection

exports.registerForEvent = async (req, res) => {
    const { event_id } = req.body;
    const student_id = req.user.id; // Taken from JWT token

    try {
        // 1. Check if already registered
        const [existing] = await db.execute(
            'SELECT id FROM registrations WHERE student_id = ? AND event_id = ?',
            [student_id, event_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "You are already registered for this class." });
        }

        // 2. Insert the registration
        await db.execute(
            'INSERT INTO registrations (student_id, event_id, created_at) VALUES (?, ?, NOW())',
            [student_id, event_id]
        );

        res.status(201).json({ message: "Successfully registered!" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// This is what the Admin calls to see the "Folders"
exports.getAdminRegistrations = async (req, res) => {
    try {
        const query = `
             darkness SELECT 
                r.id, 
                u.name AS student_name, 
                e.title AS event_name, 
                r.created_at,
                r.presentation_link
            FROM registrations r
            JOIN users u ON r.student_id = u.id
            JOIN events e ON r.event_id = e.id
            ORDER BY e.title ASC, r.created_at DESC
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching registrations" });
    }
};