require('dotenv').config();
const app = require('./app');
const prisma = require('./config/db');

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Database connection check
async function testDbConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to PostgreSQL database via Prisma.');
  } catch (error) {
    console.error('Database connection failed 💥:', error.message);
    process.exit(1);
  }
}

testDbConnection();

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}...`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
});

// Handle unhandled rejections
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});
