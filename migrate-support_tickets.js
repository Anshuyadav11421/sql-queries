const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateSupportTickets() {
  try {
    const db = await connectMongo();
    await connectSql();

    const tickets = await db
      .collection("supports_tickets")
      .find({})
      .toArray();

    console.log(" Support tickets found:", tickets.length);

    for (const t of tickets) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM support_tickets WHERE mongo_id = ${t._id.toString()}
        )
        INSERT INTO support_tickets (
          mongo_id,
          ticket_id,
          customer_user_id,
          company_id,
          company_name,
          created_by,
          customer_name,
          customer_email,
          customer_phone,
          title,
          description,
          priority,
          status,
          category,
          assigned_to,
          assigned_to_name,
          resolution,
          resolved_by,
          resolved_by_name,
          resolved_at,
          can_customer_delete,
          customer_notified,
          admin_notified,
          last_reply_at,
          created_at,
          updated_at
        )
        VALUES (
          ${t._id.toString()},
          ${t.ticketId || null},
          ${t.customerUserId || null},
          ${t.companyId || null},
          ${t.companyName || null},
          ${t.createdBy || null},
          ${t.customerName || null},
          ${t.customerEmail || null},
          ${t.customerPhone || null},
          ${t.title || null},
          ${t.description || null},
          ${t.priority || null},
          ${t.status || null},
          ${t.category || null},
          ${t.assignedTo || null},
          ${t.assignedToName || null},
          ${t.resolution || null},
          ${t.resolvedBy || null},
          ${t.resolvedByName || null},
          ${t.resolvedAt ? new Date(t.resolvedAt) : null},
          ${t.canCustomerDelete ? 1 : 0},
          ${t.customerNotified ? 1 : 0},
          ${t.adminNotified ? 1 : 0},
          ${t.lastReplyAt ? new Date(t.lastReplyAt) : null},
          ${t.createdAt ? new Date(t.createdAt) : null},
          ${t.updatedAt ? new Date(t.updatedAt) : null}
        )
      `;

      if (Array.isArray(t.replies)) {
        for (const r of t.replies) {
          await sql.query`
            INSERT INTO support_ticket_replies (
              ticket_mongo_id,
              message,
              replied_by,
              replied_by_role,
              replied_by_user_id,
              is_staff,
              created_at
            )
            VALUES (
              ${t._id.toString()},
              ${r.message || null},
              ${r.repliedBy || null},
              ${r.repliedByRole || null},
              ${r.repliedByUserId || null},
              ${r.isStaff ? 1 : 0},
              ${r.createdAt ? new Date(r.createdAt) : null}
            )
          `;
        }
      }
    }

    console.log(" Support tickets & replies migrated successfully");

  } catch (err) {
    console.error(" Support ticket migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}

module.exports = migrateSupportTickets;
