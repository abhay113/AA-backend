
const { Queue, Worker } = require('bullmq');
const connection = require('../config');

const fiRequestqueueMQ = new Queue('fiRequest-queue', { connection });
// const postFIRequest = require('../services/FIU.service')
const fiuService = require('../services/FIU.service')

exports.fiRequestAddQueue = async function (body) {    
    try {
      for (const consentHandle of body.data) {
        await fiRequestqueueMQ.add("apiTask", { 
          consentHandle: consentHandle, 
          realm: body.realm,
          group:body.group
      });
      }
      console.log("All UUIDs added to queue");
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

  const worker = new Worker(
    "fiRequest-queue",
    async (job) => {
      const data  = job.data;
      try {
        console.log(`Processing consentHandle: ${data}`);
        console.log("jsonparse",JSON.stringify(data))
        
        const result = await fiuService.postFIRequest(data.consentHandle, data.realm, data.group)
        console.log("result",result)
        return result

      } catch (error) {
        console.error(`Error processing ${data}:`, error.message);
      }
    },
    { connection }
  );
  
  worker.on("completed", (job) => {
    console.log(`Job for consentHandle ${job.data.consentHandle} completed`);
  });
  
  worker.on("failed", (job, err) => {
    console.error(`Job for consentHandle ${job.data.consentHandle} failed:`, err.message);
  });