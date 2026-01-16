const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

const MONGO_COLLECTION = "products";

async function migrateProducts() {
  try {
    const db = await connectMongo();
    await connectSql();

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
          ${p.name || null},
          ${p.color || null},
          ${p.icon || null},
          ${p.isActive ? 1 : 0},
          ${p.companyId || null},
          ${p.createdBy || null},
          ${p.createdAt ? new Date(p.createdAt) : null},
          ${p.updatedAt ? new Date(p.updatedAt) : null}
        )
      `;
    }

    console.log(" Products migrated successfully");

  } catch (err) {
    console.error(" Products migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}


module.exports = migrateProducts;
