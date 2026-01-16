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
  const customers = await db.collection("customers").find().toArray();

  for (const c of customers) {
    await sql.query`
      IF NOT EXISTS (
        SELECT 1 FROM customers WHERE mongo_id = ${c._id.toString()}
      )
      INSERT INTO customers (
        mongo_id,
        name,
        email,
        phone,
        company_name,
        created_at,
        updated_at
      ) VALUES (
        ${c._id.toString()},
        ${c.name || null},
        ${c.email || null},
        ${c.phone || null},
        ${c.companyName || null},
        ${c.createdAt ? new Date(c.createdAt) : null},
        ${c.updatedAt ? new Date(c.updatedAt) : null}
      )
    `;
  }

  console.log("CUSTOMERS migration completed"); 

  await mongoClient.close();
  await sql.close();
}

migrate().catch(console.error);
