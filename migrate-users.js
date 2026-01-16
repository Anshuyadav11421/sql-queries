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

async function migrateUsers() {
  await mongoClient.connect();
  await sql.connect(sqlConfig);

  const db = mongoClient.db("crm_db");

  const users = await db.collection("users").find().toArray();

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

  console.log(" MongoDB USERS successfully migrated to SQL Server");

  await mongoClient.close();
  await sql.close();
}

migrateUsers().catch(console.error);
