
const { Queue } = require('bullmq');
const connection = require('../config');

const queue = new Queue('scheduler-queue', { connection });


exports.sendMessage = async function (message) {    
    //Change the message as per requirement
    // --------- example of Message -----------
    //  const message = {
    //   "comparisonExpression": "==",
    //   "comparisonKey": "currentBalnace",
    //   "comparisonValue": "180",
    //   "consentHandle": "4c4e5ea7-9874-490e-9f42-ace2ffffc11c",
    //   "cronExpression": "0 * * * * *",
    //   "limit": "1",
    //   "queueName": "testSchedulerQueue4",
    //   "id" : Unique ID,
    //   }  
       try {
        await queue.add('scheduler-job', message, {
            attempts: 3,  // Number of times the job will be retried upon failure
            backoff: 1000 // Time (in ms) between retries
        });
        console.log('Message sent to queue:', message);
       } catch (error) {
        console.log("ERROR while creating queue: ",error);
        let errorBody = {
          message: error.message || "Internal Server Error",
          error: true,
          errorMessage: error.message,
          statusCode: error.statusCode || 500,
        };
        throw errorBody;
       }
  }