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

async function migrateUserActivity() {
  try {
    await mongoClient.connect();
    await sql.connect(sqlConfig);

    const db = mongoClient.db("crm_db");

    const activities = await db
      .collection("userActivity")
      .find({})
      .toArray();

    console.log("User activities found:", activities.length);

    for (const a of activities) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM user_activity WHERE mongo_id = ${a._id.toString()}
        )
        INSERT INTO user_activity (
          mongo_id,
          user_id,
          action,
          module,
          description,
          ip_address,
          user_agent,
          metadata,
          created_at
        )
        VALUES (
          ${a._id.toString()},
          ${a.userId || null},
          ${a.action || null},
          ${a.module || null},
          ${a.description || null},
          ${a.ipAddress || null},
          ${a.userAgent || null},
          ${a.metadata ? JSON.stringify(a.metadata) : null},
          ${a.createdAt ? new Date(a.createdAt) : new Date()}
        )
      `;
    }

    console.log(" User activity migrated successfully");
    process.exit(0);
  } catch (err) {
    console.error(" User activity migration failed:", err);
    process.exit(1);
  }
}

migrateUserActivity();
