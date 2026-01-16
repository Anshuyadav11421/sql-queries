const { MongoClient } = require("mongodb");
const sql = require("mssql/msnodesqlv8");

const mongoClient = new MongoClient("mongodb://localhost:27017");
const MONGO_DB = "crm_db";           
const MONGO_COLLECTION = "products";

const sqlConfig = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};" +
    "Server=(localdb)\\MSSQLLocalDB;" +
    "Database=crm_sql;" +
    "Trusted_Connection=Yes;"
};

async function migrateProducts() {
  try {
    await mongoClient.connect();
    await sql.connect(sqlConfig);

    const db = mongoClient.db(MONGO_DB);
    const products = await db
      .collection(MONGO_COLLECTION)
      .find({})
      .toArray(); 

    console.log(` Found ${products.length} products\n`);

    for (const p of products) {
      console.log(" Inserting:", p.name);
                    
      
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM products WHERE mongo_id = ${p._id.toString()}
        )
        BEGIN
          INSERT INTO products (
            mongo_id,
            name,
            color,
            icon,
            is_active,
            company_mongo_id,
            created_by,
            created_at,
            updated_at
          )
          VALUES (
            ${p._id.toString()},
            ${p.name},
            ${p.color},
            ${p.icon},
            ${p.isActive ? 1 : 0},
            ${p.companyId},
            ${p.createdBy},
            ${new Date(p.createdAt)},
            ${new Date(p.updatedAt)}
          )
        END
      `;
    }

    console.log("\n Products migrated successfully (Direct Mongo to SQL)");
    process.exit(0);

  } catch (err) {
    console.error(" Migration error:", err);
    process.exit(1);
  }
}

migrateProducts();
