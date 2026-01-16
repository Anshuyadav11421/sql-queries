const sql = require("mssql/msnodesqlv8");

const sqlConfig = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};" +
    "Server=(localdb)\\MSSQLLocalDB;" +
    "Database=crm_sql;" +
    "Trusted_Connection=Yes;"
};

let pool;

async function connectSql() {
  if (!pool) {
    pool = await sql.connect(sqlConfig);
    console.log(" SQL Server connected");
  }
  return pool;
}

async function closeSql() {
  if (pool) {
    await sql.close();
    pool = null;
    console.log(" SQL Server closed");
  }
}

module.exports = { sql, connectSql, closeSql };
