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

async function migrate() {
  await mongoClient.connect();
  await sql.connect(sqlConfig);

  const db = mongoClient.db("crm_db");

  const leads = await db.collection("leads").find().toArray();

  for (const l of leads) {
    await sql.query`
      IF NOT EXISTS (
        SELECT 1 FROM leads WHERE mongo_id = ${l._id.toString()}
      )
      INSERT INTO leads (
        mongo_id,
        contact_person,
        company_name,
        email,
        phone,
        industry,
        lead_source,
        status,
        priority,
        estimated_value,
        is_active,
        assigned_to_group,
        created_at,
        updated_at
      )
      VALUES (
        ${l._id.toString()},
        ${l.contactPerson || null},
        ${l.companyName || null},
        ${l.email || null},
        ${l.phone || null},
        ${l.industry || null},
        ${l.leadSource || null},
        ${l.status || null},
        ${l.priority || null},
        ${l.estimatedValue ?? 0},
        ${l.isActive ? 1 : 0},
        ${l.assignedToGroup || null},
        ${l.createdAt ? new Date(l.createdAt) : null},
        ${l.updatedAt ? new Date(l.updatedAt) : null}
      )
    `;
  }

  console.log("MongoDB  SQL Server LEADS migration completed");

  await mongoClient.close();
  await sql.close();
}

migrate().catch(console.error);


