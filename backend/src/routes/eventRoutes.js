const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { 
  getDashboardStats, 
  getAllEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  createFolder, 
  createClass, 
  updateClass, 
  deleteClass,
  getAllResources, 
  updateResourceStatus,
  addSingleResource
} = require('../controllers/eventController');

// Admin Dashboard Stats
router.get('/dashboard', verifyToken, getDashboardStats);

// Resource Master List
router.get('/master-resources', verifyToken, getAllResources);
router.put('/resources/:resourceId/status', verifyToken, updateResourceStatus);

// Events
router.get('/', verifyToken, getAllEvents);
router.post('/', verifyToken, createEvent);
router.put('/:eventId', verifyToken, updateEvent);
router.delete('/:eventId', verifyToken, deleteEvent);

// Folders
router.post('/:eventId/folders', verifyToken, createFolder);

// Classes
router.post('/folders/:folderId/classes', verifyToken, createClass);
router.put('/classes/:classId', verifyToken, updateClass);
router.delete('/classes/:classId', verifyToken, deleteClass);

//Checlist
router.post('/classes/:classId/resources', verifyToken, addSingleResource);

module.exports = router;