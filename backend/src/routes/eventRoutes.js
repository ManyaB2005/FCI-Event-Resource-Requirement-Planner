const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  getDashboardStats, 
  getAllEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  deleteFolder, 
  createFolder, 
  createClass, 
  updateClass, 
  deleteClass,
  getAllResources, 
  updateResourceStatus,
  addSingleResource
} = require('../controllers/eventController');

// Admin Dashboard Stats
router.get('/dashboard', verifyToken, eventController.getDashboardStats);
// Resource Master List
router.get('/master-resources', verifyToken, getAllResources);
router.put('/resources/:resourceId/status', verifyToken, updateResourceStatus);

// Events
router.get('/', verifyToken, getAllEvents);
router.post('/', verifyToken, createEvent);
router.put('/:eventId', verifyToken, updateEvent);

// Folders
router.post('/:eventId/folders', verifyToken, createFolder);

// Classes
router.post('/folders/:folderId/classes', verifyToken, createClass);
router.put('/classes/:classId', verifyToken, updateClass);

//Checlist
router.post('/classes/:classId/resources', verifyToken, addSingleResource);

router.delete('/:eventId', verifyToken, eventController.deleteEvent);
router.delete('/folders/:folderId', verifyToken, eventController.deleteFolder);
router.delete('/classes/:classId', verifyToken, eventController.deleteClass);
module.exports = router;