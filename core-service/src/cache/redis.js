const { createClient } = require('redis');
const config = require('../config/config');

// Create a Redis client
const redisClient = createClient({
  url: config.redisUrl
});

redisClient.on('connect', () => {
  console.log('🔗 Successfully connected to the Redis server.');
});

redisClient.on('error', (err) => {
  console.error('🔴 Redis Client Error', err);
});

// Connect the client. It will automatically try to reconnect if the connection is lost.
redisClient.connect();

module.exports = redisClient;