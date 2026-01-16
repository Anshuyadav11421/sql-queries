const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateCommunications() {
  try {
    const db = await connectMongo();
    await connectSql();

    const communications = await db
      .collection("communications")
      .find({})
      .toArray();

    console.log(" Communications found:", communications.length);

    for (const c of communications) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM communications WHERE mongo_id = ${c._id.toString()}
        )
        INSERT INTO communications (
          mongo_id,
          type,
          subject,
          content,
          recipient,
          status,
          created_by,
          sent_at,
          created_at,
          updated_at
        )
        VALUES (
          ${c._id.toString()},
          ${c.type || null},
          ${c.subject || null},
          ${c.content || null},
          ${c.recipient || null},
          ${c.status || null},
          ${c.createdBy || null},
          ${c.sentAt ? new Date(c.sentAt) : null},
          ${c.createdAt ? new Date(c.createdAt) : null},
          ${c.updatedAt ? new Date(c.updatedAt) : null}
        )
      `;
    }

    console.log(" Communications migrated successfully");

  } catch (err) {
    console.error(" Communications migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}


module.exports = migrateCommunications;