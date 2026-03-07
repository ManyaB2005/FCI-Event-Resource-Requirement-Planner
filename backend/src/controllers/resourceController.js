// backend/src/controllers/resourceController.js
const pool = require('../config/db');

// Get all resources for a specific class
exports.getResourcesByClass = async (req, res) => {
    const { classId } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM resources WHERE class_id = ? ORDER BY created_at DESC', [classId]);
        res.json(rows);
    } catch (error) {
        console.error("Fetch resources error:", error);
        res.status(500).json({ message: "Error fetching resources" });
    }
};

// Add a new resource requirement
exports.addResource = async (req, res) => {
    const { classId } = req.params;
    const { name, quantity, unit } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: "Item name is required" });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO resources (class_id, name, quantity, unit) VALUES (?, ?, ?, ?)',
            [classId, name, quantity || 1, unit || 'pieces']
        );
        res.status(201).json({ resource_id: result.insertId, message: "Resource added successfully" });
    } catch (error) {
        console.error("Add resource error:", error);
        res.status(500).json({ message: "Error adding resource" });
    }
};

// Update status (planned, ordered, confirmed)
exports.toggleResourceStatus = async (req, res) => {
    const { resourceId } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE resources SET status = ? WHERE resource_id = ?', [status, resourceId]);
        res.json({ message: `Resource marked as ${status}` });
    } catch (error) {
        console.error("Update resource error:", error);
        res.status(500).json({ message: "Error updating status" });
    }
};

// Delete a resource requirement
exports.deleteResource = async (req, res) => {
    const { resourceId } = req.params;
    try {
        await pool.query('DELETE FROM resources WHERE resource_id = ?', [resourceId]);
        res.json({ message: "Resource deleted" });
    } catch (error) {
        console.error("Delete resource error:", error);
        res.status(500).json({ message: "Error deleting resource" });
    }
};