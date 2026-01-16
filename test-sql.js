const sql = require("mssql/msnodesqlv8");

const config = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};" +
    "Server=(localdb)\\MSSQLLocalDB;" +
    "Database=crm_sql;" +
    "Trusted_Connection=Yes;"
};

sql.connect(config)
  .then(() => {
    console.log(" SQL LocalDB Connected successfully");
    return sql.close();
  })
  .catch(err => {
    console.error(" SQL Error:", err);
  });

  