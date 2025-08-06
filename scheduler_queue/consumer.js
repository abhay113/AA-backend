const { Worker } = require('bullmq');
const connection = require('../config');
const {postScheduler} = require('../services/FIU.service')
const worker = new Worker('scheduler-queue', async job => { //Use the same queue name as used in the producer
    console.log('Processing job:', job.id, 'with data:', job.data);
    // Add your processing logic here
    //The logic for received message to be written here
   try {
    await postScheduler(job.data) //scheduler api call

   } catch (error) {
    console.log("error in consumer ",error);
    const errorResp={
        error:true,
        messae : error.message,
        statusCode : 500
    }
    throw errorResp;
   }
  }, { connection });
  
  worker.on('completed', job => {
    console.log(`Job with id ${job.id} has been completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Job with id ${job.id} has failed with error:`, err);
  });
  