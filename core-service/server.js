// Import the main app configuration
const app = require('./app');

// Import environment variables
const config = require('./src/config/config');

// Start the server and listen on the configured port
app.listen(config.port, () => {
  console.log(`✅ Core service is running on http://localhost:${config.port}`);
});