const { connectMongo, closeMongo } = require("./db/mongo");
const { sql, connectSql, closeSql } = require("./db/sql");

async function migrateLeadNotes() {
  let inserted = 0;

  try {
    const db = await connectMongo();
    await connectSql();

    const leads = await db
      .collection("leads")
      .find({ "notes.0": { $exists: true } })
      .toArray();

    for (const lead of leads) {
      for (const note of lead.notes) {
        let content, createdBy, createdAt, noteMongoId;

        if (typeof note === "string") {
          content = note;
          createdBy = null;
          createdAt = lead.createdAt || null;
          noteMongoId = null;
        }
        else if (typeof note === "object" && note !== null) {
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

    console.log(` Lead notes migrated successfully: ${inserted}`);

  } catch (err) {
    console.error(" Lead notes migration failed:", err);
  } finally {
    await closeMongo();
    await closeSql();
  }
}


module.exports = migrateLeadNotes;
