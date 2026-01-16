const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateLeads() {
  try {
    const db = await connectMongo();
    await connectSql();

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

    console.log(" Leads migrated successfully");

  } catch (err) {
    console.error(" Leads migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}


module.exports = migrateLeads;
