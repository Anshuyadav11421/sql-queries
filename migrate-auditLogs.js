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

async function migrateAuditLogs() {
  try {
    await mongoClient.connect();
    await sql.connect(sqlConfig);

    const db = mongoClient.db("crm_db");
    const auditLogs = await db.collection("auditLogs").find().toArray();

    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs')
      
      CREATE TABLE audit_logs (
        id INT IDENTITY PRIMARY KEY,
        mongo_id VARCHAR(50) UNIQUE,
        action VARCHAR(50),
        user_email VARCHAR(150),
        ip_address VARCHAR(50),
        user_agent VARCHAR(MAX),
        timestamp DATETIME
      )
    `);

    for (const log of auditLogs) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM audit_logs WHERE mongo_id = ${log._id.toString()}
        )
        INSERT INTO audit_logs (
          mongo_id,
          action,
          user_email,
          ip_address,
          user_agent,
          timestamp
        )
        VALUES (
          ${log._id.toString()},
          ${log.action},
          ${log.userEmail},
          ${log.ipAddress},
          ${log.userAgent},
          ${new Date(log.timestamp)}
        )
      `;
    }

    console.log(`Audit logs migrated: ${auditLogs.length}`);
    process.exit(0);
  } catch (err) {
    console.error(" AuditLogs migration failed:", err);
    process.exit(1);
  }
}

migrateAuditLogs();
