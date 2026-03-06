const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middleware/authMiddleware'); // You imported it as verifyToken

// Route 1: Available Classes
router.get('/classes', verifyToken, studentController.getAvailableClasses);

// Route 2: Register
router.post('/classes/:classId/register', verifyToken, studentController.registerForClass);

// Route 3: My Registrations
router.get('/my-registrations', verifyToken, studentController.getMyRegistrations);

// Route 4: Mark as Uploaded (Using verifyToken instead of authMiddleware)
router.put('/registrations/:registrationId/upload', verifyToken, studentController.markAsUploaded);

module.exports = router;