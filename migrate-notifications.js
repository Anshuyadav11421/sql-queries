const { MongoClient } = require("mongodb");
const sql = require("mssql/msnodesqlv8");

const sqlConfig = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};" +
    "Server=(localdb)\\MSSQLLocalDB;" +
    "Database=crm_sql;" +
    "Trusted_Connection=Yes;"
};

const mongoClient = new MongoClient("mongodb://localhost:27017");

async function migrateNotifications() {
  try {
    await mongoClient.connect();
    await sql.connect(sqlConfig);

    const db = mongoClient.db("crm_db");

    const notifications = await db
      .collection("notifications")
      .find({})
      .toArray();

    console.log("Notifications found:", notifications.length);

    for (const n of notifications) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM notifications WHERE mongo_id = ${n._id.toString()}
        )
        INSERT INTO notifications (
          mongo_id,
          title,
          message,
          type,
          user_id,
          lead_id,
          is_read,
          priority,
          actionable,
          action_view,
          created_at
        )
        VALUES (
          ${n._id.toString()},
          ${n.title || null},
          ${n.message || null},
          ${n.type || null},

          ${n.userId || null},
          ${n.leadId || null},
          ${n.isRead ? 1 : 0},
          ${n.priority || null},
          ${n.actionable ? 1 : 0},
          ${n.actionView || null},
          ${n.createdAt ? new Date(n.createdAt) : null}
        )
      `;
    }

    console.log(" Notifications migrated successfully");
    process.exit(0); 
       
  } catch (err) {
    console.error(" Notifications migration failed:", err);
    process.exit(1);
  }
}

migrateNotifications();
