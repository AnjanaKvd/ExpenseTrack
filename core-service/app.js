const express = require('express');

// Initialize the Express app
const app = express();

// --- Middleware ---
// 1. Enable JSON body parsing for incoming requests
app.use(express.json());

// 2. A simple logger to see incoming requests in the console
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- API Routes ---
// Mount the version 1 API routes
const apiV1 = require('./src/api/v1');
app.use('/api/v1', apiV1);


// --- Health Check Endpoint ---
// A simple route to check if the service is alive
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Export the app module for server.js to use
module.exports = app;