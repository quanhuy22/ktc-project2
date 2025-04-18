const { MongoClient } = require("mongodb");

const uri = 'mongodb+srv://ktxadmin:ktx123123@ktxcluster.xtwowk7.mongodb.net/?retryWrites=true&w=majority&appName=KTXCluster';
const client = new MongoClient(uri);

async function connectDB() {
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
  return client.db("ktx"); // tên DB
}

module.exports = { connectDB, client };