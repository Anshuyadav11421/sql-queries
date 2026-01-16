const { MongoClient } = require("mongodb");
const sql = require("mssql/msnodesqlv8");

const mongoClient = new MongoClient("mongodb://localhost:27017");

const sqlConfig = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};" +
    "Server=(localdb)\\MSSQLLocalDB;" +
    "Database=crm_sql;" +
    "Trusted_Connection=Yes;"
};

async function migrateCompanies() {
  try {
    await mongoClient.connect();
    await sql.connect(sqlConfig);

    const db = mongoClient.db("crm_db");

    const doc = await db.collection("companies").findOne({});

    if (!doc || !Array.isArray(doc.companies)) {
      throw new Error(" companies array not found in MongoDB");
    }

    const companies = doc.companies;
    console.log(`Found ${companies.length} companies`);

    for (const c of companies) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM companies WHERE mongo_id = ${c._id}
        )
        INSERT INTO companies (
          mongo_id, name, slug,
          contact_email, contact_phone, status,


          admin_email, admin_password, admin_is_generated,

          plan_name, leads_limit, users_limit, customers_limit,
          storage_limit, email_limit, sms_limit,
          plan_start_date, plan_end_date,

          current_leads, current_users, current_customers,
          storage_used, emails_sent, sms_sent, last_reset,

          timezone, currency, language,
          primary_color,

          created_by, created_at, updated_at
        )
        VALUES (
          ${c._id},
          ${c.name},
          ${c.slug},

          ${c.contactEmail || null},
          ${c.contactPhone || null},
          ${c.status},

          ${c.adminCredentials?.email || null},
          ${c.adminCredentials?.password || null},
          ${c.adminCredentials?.isGenerated ? 1 : 0},

          ${c.plan?.name || null},
          ${c.plan?.leadsLimit ?? null},
          ${c.plan?.usersLimit ?? null},
          ${c.plan?.customersLimit ?? null},
          ${c.plan?.storageLimit ?? null},
          ${c.plan?.emailLimit ?? null},
          ${c.plan?.smsLimit ?? null},
          ${c.plan?.startDate ? new Date(c.plan.startDate) : null},
          ${c.plan?.endDate ? new Date(c.plan.endDate) : null},

          ${c.usage?.currentLeads ?? null},
          ${c.usage?.currentUsers ?? null},
          ${c.usage?.currentCustomers ?? null},
          ${c.usage?.storageUsed ?? null},
          ${c.usage?.emailsSent ?? null},
          ${c.usage?.smsSent ?? null},
          ${c.usage?.lastReset ? new Date(c.usage.lastReset) : null},

          ${c.settings?.timezone || null},
          ${c.settings?.currency || null},
          ${c.settings?.language || null},

          ${c.branding?.primaryColor || null},

          ${c.createdBy || null},
          ${new Date(c.createdAt)},
          ${new Date(c.updatedAt)} AS updated_at 
        )
      `;
    }

    console.log(" Companies migrated successfully");
    process.exit(0);

  } catch (err) {
    console.error(" Migration error:", err);
    process.exit(1);
  }
}

migrateCompanies();
