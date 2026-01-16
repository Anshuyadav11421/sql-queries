const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateCustomers() {
  try {
    const db = await connectMongo();
    await connectSql();

    const customers = await db
      .collection("customers")
      .find()
      .toArray();

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
        )
        VALUES (
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

    console.log(" Customers migrated successfully");

  } catch (err) {
    console.error(" Customers migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}


module.exports = migrateCustomers;
