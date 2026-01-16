const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateCalendars() {
  try {
    const db = await connectMongo();
    await connectSql();

    const calendars = await db
      .collection("calendars")
      .find({})
      .toArray();

    console.log(" Calendars found:", calendars.length);

    for (const c of calendars) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM calendars WHERE mongo_id = ${c._id.toString()}
        )
        INSERT INTO calendars (
          mongo_id,
          title,
          description,
          start_date,
          end_date,
          start_time,
          end_time,
          type,
          status,
          reminder,
          related_to,
          related_id,
          created_by,
          is_recurring,
          location,
          created_at,
          updated_at
        )
        VALUES (
          ${c._id.toString()},
          ${c.title || null},
          ${c.description || null},
          ${c.startDate ? new Date(c.startDate) : null},
          ${c.endDate ? new Date(c.endDate) : null},
          ${c.startTime || null},
          ${c.endTime || null},
          ${c.type || null},
          ${c.status || null},
          ${c.reminder ?? null},
          ${c.relatedTo || null},
          ${c.relatedId || null},
          ${c.createdBy || null},
          ${c.isRecurring ? 1 : 0},
          ${c.location || null},
          ${c.createdAt ? new Date(c.createdAt) : null},
          ${c.updatedAt ? new Date(c.updatedAt) : null}
        )
      `;
    }

    console.log(" Calendars migrated successfully");

  } catch (err) {
    console.error(" Calendar migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}


module.exports = migrateCalendars;
