const express = require('express');
const router = express.Router();
const updateController = require('../controllers/updateController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, updateController.getUpdates);
router.post('/', verifyToken, updateController.postUpdate);

module.exports = router;