const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

async function connectDB() {
  let uri = env.MONGODB_URI;

  if (env.USE_IN_MEMORY_DB) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('[db] MONGODB_URI not set - using in-memory MongoDB instance');
  }

  await mongoose.connect(uri);
  console.log(`[db] connected (${env.USE_IN_MEMORY_DB ? 'in-memory' : 'external'})`);

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connectDB, disconnectDB };
