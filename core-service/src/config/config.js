require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  // Add other configurations like DB_URL, REDIS_URL etc. here
};

module.exports = config;