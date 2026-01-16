const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateUserActivity() {
  try {
    const db = await connectMongo();
    await connectSql();

    const activities = await db
      .collection("userActivity")
      .find({})
      .toArray();

    console.log(" User activities found:", activities.length);

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

  } catch (err) {
    console.error(" User activity migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}

module.exports = migrateUserActivity;
