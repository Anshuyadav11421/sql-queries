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

async function migrateDemoRequests() {
  try {
    await mongoClient.connect();
    await sql.connect(sqlConfig);

    const db = mongoClient.db("crm_db");



    const demoRequests = await db
      .collection("demo_requests")
      .find({})
      .toArray();

    console.log("Demo requests found:", demoRequests.length);

    for (const d of demoRequests) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM demo_requests WHERE mongo_id = ${d._id.toString()}
        )
        INSERT INTO demo_requests (
          mongo_id,
          name,
          email,
          phone,
          company,
          employees,
          demo_date,
          demo_time,
          status,
          submitted_at,
          processed_at,
          processed_by,
          created_at,
          updated_at
        )
        VALUES (
          ${d._id.toString()},
          ${d.name || null},
          ${d.email || null},
          ${d.phone || null},
          ${d.company || null},
          ${d.employees || null},
          ${d.date ? new Date(d.date) : null},
          ${d.time || null},
          ${d.status || null},
          ${d.submittedAt ? new Date(d.submittedAt) : null},
          ${d.processedAt ? new Date(d.processedAt) : null},
          ${d.processedBy || null},
          ${d.createdAt ? new Date(d.createdAt) : null},
          ${d.updatedAt ? new Date(d.updatedAt) : null}
        )
      `;
    }

    console.log("Demo requests migrated successfully");
    process.exit(0);
  } catch (err) {
    console.error("Demo request migration failed:", err);
    process.exit(1);
  }
}

migrateDemoRequests();
