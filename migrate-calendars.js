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

async function migrateCalendars() {
  try {
    await mongoClient.connect();
    await sql.connect(sqlConfig);

    const db = mongoClient.db("crm_db");



    const calendars = await db.collection("calendars").find({}).toArray();

    console.log("Calendars found:", calendars.length);

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
    process.exit(0);
  } catch (err) {
    console.error(" Calendar migration failed:", err);
    process.exit(1);
  }
}

migrateCalendars();
