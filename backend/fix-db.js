const pool = require('./src/config/db');

async function fixDatabase() {
  console.log("🔧 Checking and fixing database tables...");

  try {
    // 1. Create the notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          notification_id INT AUTO_INCREMENT PRIMARY KEY,
          message VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ 'notifications' table is ready.");

    // 2. Safely add requires_ppt to classes
    try {
      await pool.query("ALTER TABLE classes ADD COLUMN requires_ppt BOOLEAN DEFAULT FALSE");
      console.log("✅ Added 'requires_ppt' column to classes table.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("ℹ️ 'requires_ppt' column already exists.");
      } else {
        throw err;
      }
    }

    // 3. Safely add presentation_link to registrations
    try {
      await pool.query("ALTER TABLE registrations ADD COLUMN presentation_link VARCHAR(500) DEFAULT NULL");
      console.log("✅ Added 'presentation_link' column to registrations table.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("ℹ️ 'presentation_link' column already exists.");
      } else {
        throw err;
      }
    }

    console.log("🎉 Database is fully updated and ready to go!");
  } catch (err) {
    console.error("❌ Database error:", err);
  } 
  
  process.exit();
}

fixDatabase();