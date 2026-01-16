const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateCompanies() {
  try {
    const db = await connectMongo();
    await connectSql();

    const doc = await db.collection("companies").findOne({});

    if (!doc || !Array.isArray(doc.companies)) {
      throw new Error(" companies array not found in MongoDB");
    }

    const companies = doc.companies;
    console.log(` Found ${companies.length} companies`);

    for (const c of companies) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM companies WHERE mongo_id = ${c._id.toString()}
        )
        INSERT INTO companies (
          mongo_id,
          name,
          slug,

          contact_email,
          contact_phone,
          status,

          admin_email,
          admin_password,
          admin_is_generated,

          plan_name,
          leads_limit,
          users_limit,
          customers_limit,
          storage_limit,
          email_limit,
          sms_limit,
          plan_start_date,
          plan_end_date,

          current_leads,
          current_users,
          current_customers,
          storage_used,
          emails_sent,
          sms_sent,
          last_reset,

          timezone,
          currency,
          language,
          primary_color,

          created_by,
          created_at,
          updated_at
        )
        VALUES (
          ${c._id.toString()},
          ${c.name || null},
          ${c.slug || null},

          ${c.contactEmail || null},
          ${c.contactPhone || null},
          ${c.status || null},

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
          ${c.createdAt ? new Date(c.createdAt) : null},
          ${c.updatedAt ? new Date(c.updatedAt) : null}
        )
      `;
    }

    console.log(" Companies migrated successfully");

  } catch (err) {
    console.error(" Companies migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}


module.exports = migrateCompanies;
