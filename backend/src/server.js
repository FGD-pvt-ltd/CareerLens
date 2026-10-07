require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Graceful database connection attempt
connectDB();

// Start Server
app.listen(PORT, () => {
  console.log(`ProfiQ Backend Server running on port ${PORT}`);
});
