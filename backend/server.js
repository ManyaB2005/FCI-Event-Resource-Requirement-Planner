const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DEBUGGER: This will show every request in your terminal
app.use((req, res, next) => {
  console.log(`${req.method} request to: ${req.url}`);
  next();
});

// Route Imports - Pointing to your src/routes folder
const authRoutes = require('./src/routes/auth');
const eventRoutes = require('./src/routes/eventRoutes');
const studentRoutes = require('./src/routes/studentRoutes');

// API Routes
app.use('/api/auth', authRoutes); // This makes http://localhost:5000/api/auth/login work
app.use('/api/events', eventRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/updates', require('./src/routes/updateRoutes'));
app.use('/api/registrations', require('./src/routes/registrationRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});