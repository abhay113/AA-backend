const express = require('express')
const cors = require('cors');
const app = express();
const apiRoutes = require('./routes/index')
const responseTime = require('response-time');
// const { Sequelize } = require('sequelize');
// const sequelizeConfig = require('./config');
require('./scheduler_queue/consumer');
require('./fiRequest_queue/addFiRequestQueue');

const connection = require('./config');
const { Queue } = require('bullmq');
const { createBullBoard } = require('bull-board')
const { BullMQAdapter } = require('bull-board/bullMQAdapter')


// const queueMQ = new QueueMQ('queueMQName')
const queueMQ = new Queue('scheduler-queue', { connection });

const fiRequestqueueMQ = new Queue('fiRequest-queue', { connection });

const { router} = createBullBoard([
  new BullMQAdapter(queueMQ),new BullMQAdapter(fiRequestqueueMQ)
])


app.use(responseTime());

require('dotenv').config();

// eslint-disable-next-line no-undef
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// const allowedOrigin = '';

// const corsOptions = {
//   origin: allowedOrigin, 
//   optionsSuccessStatus: 200, 
// };

app.use(cors());
app.use(express.json());
app.use(apiRoutes);

app.use('/admin/queues', router)

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