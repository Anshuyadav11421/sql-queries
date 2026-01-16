const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateAuditLogs() {
  try {
    const db = await connectMongo();
    await connectSql();

    const auditLogs = await db.collection("auditLogs").find().toArray();

    await sql.query(`
      IF NOT EXISTS (
        SELECT * FROM sysobjects WHERE name = 'audit_logs' AND xtype = 'U'
      )
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
          ${log.action || null},
          ${log.userEmail || null},
          ${log.ipAddress || null},
          ${log.userAgent || null},
          ${log.timestamp ? new Date(log.timestamp) : null}
        )
      `;
    }

    console.log(` Audit logs migrated: ${auditLogs.length}`);

  } catch (err) {
    console.error(" AuditLogs migration failed:", err);
  } finally {
    
    await closeMongo();
    await closeSql();
  }
}


module.exports = migrateAuditLogs;
