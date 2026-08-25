require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  MONGODB_URI: process.env.MONGODB_URI || '',
  USE_IN_MEMORY_DB: process.env.USE_IN_MEMORY_DB === 'true' || !process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET || 'dev-insecure-jwt-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  BCRYPT_SALT_ROUNDS: 12,

  CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY || '',

  REDIS_URL: process.env.REDIS_URL || '',

  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

module.exports = env;
