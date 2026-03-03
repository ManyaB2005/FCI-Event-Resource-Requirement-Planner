const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// This matches POST http://localhost:5000/api/auth/login
router.post('/login', authController.login);

// This matches POST http://localhost:5000/api/auth/register
router.post('/register', authController.register);

module.exports = router;