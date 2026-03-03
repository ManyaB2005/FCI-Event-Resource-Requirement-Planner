const nodemailer = require('nodemailer');
require('dotenv').config(); // This line is vital!

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // It looks here for the .env value
    pass: process.env.EMAIL_PASS  // It looks here for the 16-character code
  }
});

// Add this "Test" block to see if it works immediately when you start the server
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Mailer Error: Check your .env file and App Password");
    console.log(error);
  } else {
    console.log("✅ Mailer Success: Your server can now send PPT/PDF notifications!");
  }
});

module.exports = transporter;