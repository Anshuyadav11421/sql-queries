const { closeMongo } = require("./db/mongo");
const { closeSql } = require("./db/sql");

async function runMigration(name, migrateFn) {
  console.log("\n==============================");
  console.log(` Starting: ${name}`);
  console.log("==============================");

  const start = Date.now();
  await migrateFn();
  console.log(` Completed: ${name} (${((Date.now() - start) / 1000).toFixed(2)}s)`);
}

async function migrateAll() {
  console.log("\n MongoDB → SQL Server Migration Started");

  await runMigration("Users", require("./migrate-users"));
  await runMigration("Companies", require("./migrate-companies"));
  await runMigration("Products", require("./migrate-products"));
  await runMigration("Customers", require("./migrate-customers"));
  await runMigration("Leads", require("./migrate-leads"));
  await runMigration("Lead Notes", require("./migrate-notes"));
  await runMigration("Calendars", require("./migrate-calendars"));
  await runMigration("Tasks", require("./migrate-tasks"));
  await runMigration("Communications", require("./migrate-communications"));
  await runMigration("Notifications", require("./migrate-notifications"));
  await runMigration("Demo Requests", require("./migrate-demorequests"));
  await runMigration("Support Tickets", require("./migrate-support_tickets"));
  await runMigration("Token Blacklists", require("./migrate-tokenBlacklists"));
  await runMigration("User Activities", require("./migrate-user-activities"));
  await runMigration("Audit Logs", require("./migrate-auditLogs"));

  console.log("\n All migrations completed successfully 🎉");
}

migrateAll()
  .catch(err => {
    console.error("\n Migration stopped due to error:", err.message);
  })
  .finally(async () => {
    await closeMongo();
    await closeSql();
  });
