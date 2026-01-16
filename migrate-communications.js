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

async function migrateCommunications() {
  try {
    await mongoClient.connect();
    await sql.connect(sqlConfig);

    const db = mongoClient.db("crm_db");

    const communications = await db
      .collection("communications")
      .find({})
      .toArray();

    console.log("Communications found:", communications.length);

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
    process.exit(0);
  } catch (err) {
    console.error(" Communications migration failed:", err);
    process.exit(1);
  }
}

migrateCommunications();
