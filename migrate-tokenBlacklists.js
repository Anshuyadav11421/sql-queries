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

async function migrateTokenBlacklist() {
  try {
    await mongoClient.connect();
    await sql.connect(sqlConfig);

    const db = mongoClient.db("crm_db");

    const tokens = await db
      .collection("tokenBlacklist")
      .find({})
      .toArray();

    console.log("Blacklisted tokens found:", tokens.length);

    for (const t of tokens) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM token_blacklist WHERE mongo_id = ${t._id.toString()}
        )
        INSERT INTO token_blacklist (
          mongo_id,
          token,
          user_id,
          expires_at,
          created_at
        )
        VALUES (
          ${t._id.toString()},
          ${t.token},
          ${t.userId || null},
          ${t.expiresAt ? new Date(t.expiresAt) : null},
          ${t.createdAt ? new Date(t.createdAt) : null}
        )
      `;
    }

    console.log(" Token blacklist migrated successfully");
    process.exit(0);
  } catch (err) {
    console.error(" Token blacklist migration failed:", err);
    process.exit(1);
  }
}

migrateTokenBlacklist();                           



