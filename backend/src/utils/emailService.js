const nodemailer = require('nodemailer');

const sendClassNotification = async (className, date, time, venue, studentEmails) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"FCI Planner Admin" <${process.env.EMAIL_USER}>`,
      bcc: studentEmails, // bcc hides student emails from each other for privacy!
      subject: `📢 New Class Announced: ${className}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #334155;">
          <h2 style="color: #4f46e5;">A new class has been scheduled!</h2>
          <p>Hello,</p>
          <p>A new class has just been added to the FCI Planner schedule. Here are the details:</p>
          <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Class Topic:</strong> ${className}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${time || 'TBA'}</p>
            <p style="margin: 5px 0;"><strong>Venue:</strong> ${venue || 'TBA'}</p>
          </div>
          <p>Log in to your dashboard to view the full details.</p>
          <br/>
          <p>Best regards,<br/>FCI Administration</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Automated email sent successfully.");
  } catch (error) {
    console.error("❌ Error sending automated email:", error);
  }
};

module.exports = { sendClassNotification };