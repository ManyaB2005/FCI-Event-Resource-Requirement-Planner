const pool = require('../config/db');

exports.getAllRegistrations = async (req, res) => {
    // Security check
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }

    try {
        // FIXED: Strictly joining on u.user_id to prevent the ER_BAD_FIELD_ERROR
        const query = `
            SELECT 
                r.registration_id,
                u.name AS student_name,
                u.email AS student_email,
                u.batch AS student_batch,
                c.name AS class_name,
                c.date AS class_date,
                c.requires_ppt,
                c.class_type,
                e.name AS event_name,
                r.presentation_link
            FROM registrations r
            LEFT JOIN users u ON r.user_id = u.user_id
            LEFT JOIN classes c ON r.class_id = c.class_id
            LEFT JOIN class_folders f ON c.folder_id = f.folder_id
            LEFT JOIN events e ON f.event_id = e.event_id
            WHERE u.name IS NOT NULL
            ORDER BY c.name ASC, u.name ASC
        `;
        
        const [rows] = await pool.query(query);

        // Grouping logic for the Admin Page
        const groupedData = rows.reduce((acc, reg) => {
            const className = reg.class_name || "Unassigned Class";
            if (!acc[className]) acc[className] = [];
            
            // Logic for PPT/PDF Status
            let pptStatus = "N/A";
            if (reg.requires_ppt) {
                pptStatus = (reg.presentation_link && reg.presentation_link.trim() !== "") 
                            ? "Uploaded" 
                            : "Not Uploaded";
            }

            acc[className].push({
                id: reg.registration_id,
                student: reg.student_name,
                email: reg.student_email,
                batch: reg.student_batch,
                status: pptStatus,
                event: reg.event_name || "General",
                class_type: reg.class_type || "offline" 
            });
            return acc;
        }, {});

        res.json(groupedData);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ message: "Server error while fetching registrations." });
    }
};

// ... keep your existing registerForEvent and submitPresentationLink functions below ...

exports.registerForEvent = async (req, res) => {
    const { class_id } = req.body;
    const user_id = req.user.id;

    try {
        const [existing] = await pool.query(
            'SELECT registration_id FROM registrations WHERE user_id = ? AND class_id = ?',
            [user_id, class_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "You are already registered for this class." });
        }

        await pool.query(
            'INSERT INTO registrations (user_id, class_id) VALUES (?, ?)',
            [user_id, class_id]
        );

        res.status(201).json({ message: "Successfully registered!" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.submitPresentationLink = async (req, res) => {
    const registrationId = req.params.id;
    const { presentation_link } = req.body;
    const user_id = req.user.id;

    try {
        const [result] = await pool.query(
            'UPDATE registrations SET presentation_link = ? WHERE registration_id = ? AND user_id = ?',
            [presentation_link || "COMPLETED", registrationId, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Registration not found or unauthorized." });
        }

        res.status(200).json({ message: "Status updated successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};