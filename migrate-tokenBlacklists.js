const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateTokenBlacklist() {
  try {
    const db = await connectMongo();
    await connectSql();

    const tokens = await db
      .collection("tokenBlacklist")
      .find({})
      .toArray();

    console.log(" Blacklisted tokens found:", tokens.length);

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
          ${t.token || null},
          ${t.userId || null},
          ${t.expiresAt ? new Date(t.expiresAt) : null},
          ${t.createdAt ? new Date(t.createdAt) : null}
        )
      `;
    }

    console.log(" Token blacklist migrated successfully");

  } catch (err) {
    console.error(" Token blacklist migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}
module.exports = migrateTokenBlacklist;

