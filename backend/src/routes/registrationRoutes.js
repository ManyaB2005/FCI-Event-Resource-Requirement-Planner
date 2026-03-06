const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route for Admin to get grouped list (Admin Sidebar -> Registrations)
router.get('/all', verifyToken, registrationController.getAllRegistrations);

// Route for Students to register
router.post('/register', verifyToken, registrationController.registerForEvent);

// Route for Students to mark as uploaded
router.put('/:id/upload', verifyToken, registrationController.submitPresentationLink);

module.exports = router;