/**
 * FIU Middleware Application - Main Entry Point
 * 
 * This is the main Express.js application server for the Financial Information User (FIU) middleware.
 * It handles financial data processing, authentication, and API routing.
 * 
 * Features:
 * - Express.js web server with CORS support
 * - BullMQ job queues for background processing
 * - Redis connection for caching and queue management
 * - Response time monitoring
 * - Bull Board for queue monitoring dashboard
 * 
 * Dependencies:
 * - Express.js for web server
 * - BullMQ for job queue management
 * - Redis for caching and queue storage
 * - Various custom routes and middleware
 * 
 * @author FIU Development Team
 * @version 1.0.0
 * - Express.js web server with CORS support
 */

// Core Express.js dependencies
const express = require('express')
const cors = require('cors');
const app = express();

// Application routes and middleware
const apiRoutes = require('./routes/index')
const responseTime = require('response-time');

// Database configuration (currently commented out)
// const { Sequelize } = require('sequelize');
// const sequelizeConfig = require('./config');

// Background job processing consumers
require('./scheduler_queue/consumer');
require('./fiRequest_queue/addFiRequestQueue');

// Redis connection and BullMQ setup
const connection = require('./config');
const { Queue } = require('bullmq');

// Bull Board for queue monitoring dashboard
const { createBullBoard } = require('bull-board')
const { BullMQAdapter } = require('bull-board/bullMQAdapter')

// Initialize job queues
// const queueMQ = new QueueMQ('queueMQName') // Legacy queue (commented)
const queueMQ = new Queue('scheduler-queue', { connection });
const fiRequestqueueMQ = new Queue('fiRequest-queue', { connection });

// Create Bull Board dashboard with both queues
const { router} = createBullBoard([
  new BullMQAdapter(queueMQ),new BullMQAdapter(fiRequestqueueMQ)
])

// Middleware setup
app.use(responseTime()); // Add response time headers

// Load environment variables
require('dotenv').config();

// Disable TLS certificate validation (for development/testing)
// eslint-disable-next-line no-undef
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// CORS configuration (currently using default settings)
// Commented out custom CORS configuration for specific origins
// const allowedOrigin = '';
// const corsOptions = {
//   origin: allowedOrigin, 
//   optionsSuccessStatus: 200, 
// };

// Express middleware configuration
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(apiRoutes); // Mount API routes

// Bull Board dashboard route for queue monitoring
app.use('/admin/queues', router)

// Health check endpoint
app.get('/',function(req,res){
  res.send('Hello');
})


// Create Sequelize instance
// const sequelize = new Sequelize(sequelizeConfig.development);

// (async () => {
//   try {
//     await sequelize.authenticate().then(async () => {
//       console.log('Database connection has been established successfully.');
//       await sequelize.sync( ) //{ force: true } { alter: true } 
//         .then(() => {
//           console.log('Models synced successfully');
//         })
//         .catch((error) => {
//           console.error('Error syncing models:', error);
//         });
//     });

//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//   }
// })();

// Synchronize models with the database (creates tables if they don't exist)
// (async () => {
//   try {
//     await sequelize.sync();
//     console.log('All models were synchronized successfully.');
//   } catch (error) {
//     console.error('Unable to synchronize the models:', error);
//   }
// })();

// eslint-disable-next-line no-undef
const server = app.listen(process.env.PORT, function () {
  console.log('Server is listening at http://' + server.address().address + ':' + server.address().port)
})