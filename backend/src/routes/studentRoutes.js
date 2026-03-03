const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyToken = require('../middleware/authMiddleware');
const { 
  getAvailableClasses, getMyRegistrations, getNotifications, registerForClass, submitPresentationEmail 
} = require('../controllers/studentController');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } 
});

router.get('/notifications', verifyToken, getNotifications);
router.get('/classes', verifyToken, getAvailableClasses);
router.post('/classes/:classId/register', verifyToken, registerForClass);
router.get('/my-registrations', verifyToken, getMyRegistrations);
router.post('/classes/:classId/ppt-email', verifyToken, upload.single('presentation'), submitPresentationEmail);

module.exports = router;