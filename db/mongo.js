const { MongoClient } = require("mongodb");

const client = new MongoClient("mongodb://localhost:27017");
let db;

async function connectMongo() {
  if (!client.topology?.isConnected()) {
    await client.connect();
    db = client.db("crm_db");
    console.log(" MongoDB connected");
  }
  return db;
}

async function closeMongo() {
  if (client.topology?.isConnected()) {
    await client.close();
    console.log(" MongoDB closed");
  }
}

module.exports = { connectMongo, closeMongo };
