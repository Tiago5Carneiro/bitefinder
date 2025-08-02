const Database = require("../config/database");

async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");

    await Database.initializeDatabase();

    console.log("✅ Database migrations completed successfully!");
    console.log("📊 All tables and indexes have been created");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await Database.close();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("🎉 Migration finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
