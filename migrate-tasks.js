const {MongoClient} = require("mongodb");

const sql = require("mssql/msnodesqlv8");

const sqlConfig = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};" +
    "Server=(localdb)\\MSSQLLocalDB;" +
    "Database=crm_sql;" +
    "Trusted_Connection=Yes;"
};

const mongoClient = new MongoClient("mongodb://localhost:27017");

async function migrateTasks() {
  try {
    await mongoClient.connect();
    await sql.connect(sqlConfig);

    const db = mongoClient.db("crm_db");

    const tasks = await db.collection("tasks").find({}).toArray();

    console.log("Tasks found:", tasks.length);

    for (const t of tasks) {
      await sql.query`
        IF NOT EXISTS (
          SELECT 1 FROM tasks WHERE mongo_id = ${t._id.toString()}
        )
        INSERT INTO tasks (
          mongo_id,
          title,
          description,
          type,
          status,
          priority,
          due_date,
          due_time,
          email_notification,
          notify_ten_min,
          notify_fifteen_min,
          notify_five_min,
          assigned_to,
          related_to,
          related_id,
          created_by,
          created_at,
          updated_at
        )
        VALUES (
          ${t._id.toString()},
          ${t.title || null},
          ${t.description || null},
          ${t.type || null},
          ${t.status || null},
          ${t.priority || null},
          ${t.dueDate ? new Date(t.dueDate) : null},
          ${t.dueTime || null},  
          ${t.emailNotification ? 1 : 0},
          ${t.notificationsSent?.tenMin ? 1 : 0},
          ${t.notificationsSent?.fifteenMin ? 1 : 0},
          ${t.notificationsSent?.fiveMin ? 1 : 0},
          ${t.assignedTo || null},
          ${t.relatedTo || null},
          ${t.relatedId || null},
          ${t.createdBy || null},
          ${t.createdAt ? new Date(t.createdAt) : null},
          ${t.updatedAt ? new Date(t.updatedAt) : null}
        )
      `;
    }

    console.log(" Tasks migrated successfully");
    process.exit(0);
  } catch (err) {
    console.error(" Task migration failed:", err);
    process.exit(1);
  }
}

migrateTasks();
