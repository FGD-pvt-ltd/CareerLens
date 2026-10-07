const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/profiq';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB Connection Notice: ${error.message} (Server running without active DB connection)`);
  }
};

module.exports = connectDB;
