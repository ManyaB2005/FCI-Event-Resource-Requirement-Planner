const express = require('express');
const router = express.Router();
// Ensure this path points exactly to your authController.js
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// If line 13 was crashing, it's because one of these handlers was undefined
router.post('/register', authController.register);
router.post('/login', authController.login);

router.put('/profile', verifyToken, authController.updateProfile);
router.put('/password', verifyToken, authController.changePassword);
router.delete('/account', verifyToken, authController.deleteAccount);

module.exports = router;