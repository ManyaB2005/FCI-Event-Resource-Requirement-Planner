// backend/src/routes/resourceRoutes.js
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { verifyToken } = require('../middleware/authMiddleware');

// Using verifyToken to ensure only admins can manipulate the logistics
router.get('/class/:classId', verifyToken, resourceController.getResourcesByClass);
router.post('/class/:classId', verifyToken, resourceController.addResource);
router.put('/:resourceId/status', verifyToken, resourceController.toggleResourceStatus);
router.delete('/:resourceId', verifyToken, resourceController.deleteResource);

module.exports = router;