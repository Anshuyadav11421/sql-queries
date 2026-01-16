const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateNotifications() {
  try {
    const db = await connectMongo();
    await connectSql();

    const notifications = await db
      .collection("notifications")
      .find({})
      .toArray();

    console.log(" Notifications found:", notifications.length);

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

  } catch (err) {
    console.error(" Notifications migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}


module.exports = migrateNotifications;
