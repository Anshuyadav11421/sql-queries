const { MongoClient } = require("mongodb");
const sql = require("mssql/msnodesqlv8");

const sqlConfig = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};" +
    "Server=(localdb)\\MSSQLLocalDB;" +
    "Database=crm_sql;" +
    "Trusted_Connection=Yes;"
};

async function migrate() {
  const mongo = new MongoClient("mongodb://localhost:27017");
  await mongo.connect();
  await sql.connect(sqlConfig);

  const leads = await mongo
    .db("crm_db")
    .collection("leads")
    .find({ "notes.0": { $exists: true } })
    .toArray();

  let inserted = 0;

  for (const lead of leads) {
    for (const note of lead.notes) {
      let content, createdBy, createdAt, noteMongoId;

      if (typeof note === "string") {
        content = note;
        createdBy = null;
        createdAt = lead.createdAt || null;
        noteMongoId = null;
      }

      else if (typeof note === "object") {
        content = note.content;
        createdBy = note.createdBy || null;
        createdAt = note.createdAt || null;
        noteMongoId = note._id?.toString() || null;
      }

      if (!content || content.trim() === "") continue;

      await sql.query`
        INSERT INTO lead_notes (
          note_mongo_id,
          lead_mongo_id,
          content,
          created_by,
          created_at
        )
        VALUES (
          ${noteMongoId},
          ${lead._id.toString()},
          ${content},
          ${createdBy},
          ${createdAt ? new Date(createdAt) : null}
        )
      `;

      inserted++;
    }
  }

  console.log(` ALL notes migrated successfully: ${inserted}`);

  await mongo.close();
  await sql.close();
}

migrate().catch(console.error);
