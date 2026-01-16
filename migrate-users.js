const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateUsers() {
  try {
    const db = await connectMongo();
    await connectSql();

    const users = await db
      .collection("users")
      .find()
      .toArray();

    for (const u of users) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM users WHERE mongo_id = ${u._id.toString()}
        )
        INSERT INTO users (
          mongo_id,
          name,
          email,
          phone,
          role,
          department,
          login_method,
          company_id,
          tenant_id,
          is_active,
          is_super_admin,
          super_admin_level,
          can_manage_super_admins,
          created_by,
          created_at,
          updated_at
        )
        VALUES (
          ${u._id.toString()},
          ${u.name || null},
          ${u.email || null},
          ${u.phone || null},
          ${u.role || null},
          ${u.department || null},
          ${u.loginMethod || null},
          ${u.companyId || null},
          ${u.tenantId || null},
          ${u.isActive ? 1 : 0},
          ${u.isSuperAdmin ? 1 : 0},
          ${u.superAdminLevel ?? 0},
          ${u.canManageSuperAdmins ? 1 : 0},
          ${u.createdBy || null},
          ${u.createdAt ? new Date(u.createdAt) : null},
          ${u.updatedAt ? new Date(u.updatedAt) : null}
        )
      `;
    }

    console.log(" Users migrated successfully");

  } catch (err) {
    console.error(" Users migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}

module.exports = migrateUsers;