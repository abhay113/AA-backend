/* global process token error*/
var Q = require('q');
let FIUDao = require('../dao/FIU.dao');
let SequelizeDao = require('../dao/sequelize.dao');
let axios = require('axios');
const https = require('https');

let { v4: uuid } = require('uuid');
const fs = require('fs');
const xml2js = require('xml2js');
const client = require('@jsreport/nodejs-client')(process.env.JSREPORT_URL, process.env.JSREPORT_USERNAME, process.env.JSREPORT_PASSWORD)
// const json2csv = require('json2csv').Parser;
const xmlJs = require('xml-js');
const csvConveter = require("json-2-csv");
const realmDao = require('../dao/realm.dao');
// const Redis = require('ioredis');
const redis = require('redis');
const { promisify } = require('util');
// const logger = require('../utils/logger');

const AWS = require('aws-sdk');
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const jwt = require('jsonwebtoken');
const FIUService = require('./FIU.service');
const FormData = require('form-data');
// const { json } = require('express');
// const { async } = require('q');
// const { blob } = require('node:stream/consumers');
const moment = require('moment-timezone');
const crypto = require('crypto');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront')
// const headers = {
//  Authorization: 'Basic ' + process.env.FIU_PASS,
//   "fiu-client-id": 'GXCDFIU001'
// };
const Buffer = require('buffer').Buffer;

// Configure AWS SDK with your credentials

AWS.config.region = process.env.AWS_REGION;
var s3Client = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// const redisClient = new Redis({
//   host: '127.0.0.1',
//   port: 6379,
// });
const kms = new AWS.KMS({
  region: process.env.AWS_REGION, // replace with your region
});
const redisClient = redis.createClient({
  // url: `redis://redis:6379`
});

const GET_ASYNC = promisify(redisClient.get).bind(redisClient);
const SET_ASYNC = promisify(redisClient.set).bind(redisClient);

// const xml2csv = require('xml2csv');

require('dotenv').config();
// let { createClient } = require('@supabase/supabase-js');
const { errorResponses } = require('../utils/messageCode.json');
// const { async } = require('q');


// let supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
let ver = process.env.VERSION;

const { sendMessage } = require('../scheduler_queue/producer');

const jwsSignature = require('./keycloak.service')

const fiRequestAddQueue = require('../fiRequest_queue/addFiRequestQueue')
/*
 * @author: adarsh
 * @description: POST consent.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.postConsent = async function (body, realm, group) {
  try {
    console.log("Inside post consent service");
    // console.log(`consentDetail 1 ${body.ConsentDetail}`, body.ConsentDetail);

    let consentDets = body.ConsentDetail
    console.log("consentDets : 80 ", consentDets);
    let DataConsumer = await SequelizeDao.getAllData('DATA_CONSUMER', { realm: realm })
      .then(function (result) {
        console.log(`Wrapper function result:${JSON.stringify(result)}`);
        return result;
      })
      .catch(function (error) {
        console.error(`Error in wrapper function:${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
        // throw err;
      });

    DataConsumer = { id: DataConsumer[0].id, type: DataConsumer[0].type }

    let aggregator_id = await SequelizeDao.getDataByCondition('AGGREGATOR', ['aggregator_id'])
      .then(function (result) {
        // console.log('Wrapper function result:', result);
        return JSON.parse(JSON.stringify(result, null, 2));
      })
      .catch(function (error) {
        console.error(`Error in wrapper function:${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
        // throw err;
      });

    if (aggregator_id.error) {
      console.log(`${aggregator_id.error}`);
      throw aggregator_id.error;
    }

    let AAUrlByAAId = await SequelizeDao.getAllData('AGGREGATOR', { aggregator_id: body.ConsentDetail.aggregator_id })
      .then(function (result) {
        return result;
      })
      .catch(function (error) {
        console.error(`Error in wrapper function:${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
        // throw err;
      });
    if (AAUrlByAAId.error) {
      console.log(`${AAUrlByAAId.error}`);
      throw AAUrlByAAId.error;
    }

    let consent_request_id = uuid();
    let txnid = uuid();
    let now = new Date();
    let timestamp = now.toISOString();

    let consentBody = {
      ver: ver,
      txnid: txnid,
      timestamp: timestamp,
      correlation_id: body.correlation_id,
      ConsentDetail: body.ConsentDetail,
      Customer_id: body.ConsentDetail.Customer.id,
      consent_request_id: consent_request_id,
      consentStatus: "PENDING",
      aggregator_id: body.ConsentDetail.aggregator_id,
      realm: realm,
      group: group
    };
    console.log("consentBody : 160 ", consentBody);
    let customerUniqueId = uuid();
    let customerBody = {
      id: customerUniqueId,
      customer_id: consentBody.Customer_id,
      aggregator_id: consentBody.aggregator_id,
      realm: realm,
      group: group
    };

    let consentDetailId = uuid();
    let consentDetailBody = {
      ...body.ConsentDetail,
      id: consentDetailId,
      timestamp: timestamp,
      correlation_id: body.correlation_id,
      consent_request_id: consent_request_id,
      DataConsumer: DataConsumer,
      consentStatus: "PENDING",
      aggregator_id: body.ConsentDetail.aggregator_id,
      customer_id: consentBody.Customer_id,
      ver: ver,
      count: body.ConsentDetail.Frequency.value,
      frequency_limit: body.ConsentDetail.Frequency.unit,
      realm: realm,
      group: group
    };
    console.log("consentDetailBody : 187 ", consentDetailBody);
    consentDets.DataConsumer = DataConsumer;
    const mobileNumber = consentBody.Customer_id.split('@')[0];
    console.log("mobileNumber",mobileNumber)
    consentDets.Customer.Identifiers = [
      {
        "type": "MOBILE",
        "value": mobileNumber
      }
      // {
      //   "type": "EMAIL",
      //   "value": "xyz@gmail.com"
      // }
    ]
    console.log("consentDets : 199", consentDets);
    delete consentDets.aggregator_id;
    delete consentDets.product_id;
    delete consentDets.customer_ref;
    console.log("consentDets : 202", consentDets);
    let FIUBody = {
      ver: ver,
      txnid: txnid,
      timestamp: timestamp,
      ConsentDetail: consentDets
    };

    let realmData = await SequelizeDao.getAllData('REALM_CONFIG', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    console.log("realmConfigData----------->",realmData)

    let FIU_BASE_URL = realmData[0].fiuBaseURL;

    console.log("FIU_BASE_URL---->",FIU_BASE_URL)

    console.log(`FIU body 1:${JSON.stringify(FIUBody)}`);

    // let result;

    let AAresponseData;

    try {
      const agent = new https.Agent({
        rejectUnauthorized: false
      });

      const headers = {
        Authorization: 'Basic ' + process.env.FIU_PASS,
        "fiu-client-id": DataConsumer.id
      };

      console.log("headers---->",headers)

      const response = await axios.post(FIU_BASE_URL + "consent", FIUBody, { httpsAgent: agent, headers: headers });
      console.log("FIU Module response:", response);
      AAresponseData = response.data;
      let consentHandle = AAresponseData.ConsentHandle;
      AAresponseData.data_consumer = DataConsumer;
      AAresponseData.AABaseUrl = AAUrlByAAId[0].webview_url
      AAresponseData.aggregator_id = AAUrlByAAId[0].aggregator_id
      AAresponseData.consent_request_id = consent_request_id
      let consentHandleBody = {
        txnid: txnid,
        consentHandle: consentHandle,
        Customer: AAresponseData.Customer,
        ver: AAresponseData.ver,
        correlation_id: body.correlation_id,
        timestamp: timestamp,
        consent_request_id: consent_request_id,
        realm: realm,
        group: group
      };

      try {
        try {
          console.log("LINE 246");
          console.log(`customer: ${JSON.stringify(customerBody)}`);
          await SequelizeDao.insertData(customerBody, "CUSTOMER_DETAIL");
        } catch (error) {
          console.error(`Error inserting customer detail:${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[500].message,
            error: errorResponses[500].error,
            errorMessage: error.message,
            statusCode: errorResponses[500].statusCode,
          };
          throw errorBody;
          // throw new Error(error);
        }

        try {
          console.log("LINE 262");
          await SequelizeDao.insertData(consentBody, "CONSENT_REQUEST");
        } catch (error) {
          console.error(`Error inserting consent request:${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
          // throw new Error(error);
        }

        try {
          console.log("LINE 277");
          console.log(`consentHandleBody:${JSON.stringify(consentHandleBody)}`);
          await SequelizeDao.insertData(consentHandleBody, "CONSENT_HANDLE");
        } catch (error) {
          console.error(`Error inserting consent handle: ${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
          // throw new Error(error);
        }


        try {
          console.log(" LINE : 289 ", consentDetailBody);
          consentDetailBody.consentHandle = consentHandle;
          console.log(`consentDetailBody:${JSON.stringify(consentDetailBody)}`);
          await SequelizeDao.insertData(consentDetailBody, "CONSENT_REQUEST_DETAIL");
        } catch (error) {
          console.error(`Error inserting consent request detail:${error}`);
          console.log(" LINE : 295 ", consentDetailBody);

          // throw new Error(error);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
        }



        try {
          console.log("LINE 313");
          consentDetailBody.consentHandle = consentHandle;
          // eslint-disable-next-line no-undef
          let replicaBody = newConsentReplica(consentDetailBody);
          console.log(`consentDetailBody:${JSON.stringify(replicaBody)}`);
          await SequelizeDao.insertData(replicaBody, "CONSENT_REQUEST_REPLICA");
        } catch (error) {
          console.error(`Error inserting consent request detail:${error}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
          // throw new Error(error);
        }


        try {
          await SequelizeDao.insertData({ consentHandle: consentHandle, realm: realm, group: group }, "CONSENT");
        } catch (error) {
          console.error(`Error inserting consent handle in consent: ${JSON.stringify(error)}`);
          console.log(`Error inserting consent handle in consent: ${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
          // throw new Error(error);
        }

      } catch (error) {
        console.error(`Error while performing db operation:${error}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
        // throw new Error(error);
      }

      await redisClient.del(`consents_${group}`);

      const responseBody = {
        message: "success in posting consent",
        error: false,
        statusCode: 200,
        data: AAresponseData,
      };

      return responseBody;

    } catch (error) {
      console.error(`An error occurred while posting consent: ${JSON.stringify(error)}`);
      let responseBody;

      responseBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error,
        statusCode: errorResponses[500].statusCode,
      };
      throw responseBody;
    }

  } catch (error) {
    console.error(`An error occurred while posting consent: ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};


// eslint-disable-next-line no-undef
newConsentReplica = function (consentBody) {
  let newConsent = {
    id: consentBody.id,
    timestamp: consentBody.timestamp,
    consent_start: consentBody.consentStart || null,
    consent_expiry: consentBody.consentExpiry || null,
    consent_mode: consentBody.consentMode || null,
    fetch_type: consentBody.fetchType || null,
    consent_types: consentBody.consentTypes || null,
    correlation_id: consentBody.correlation_id || null,
    fi_types: consentBody.fiTypes || null,
    data_consumer: consentBody.DataConsumer || null,
    customer: consentBody.Customer || null,
    purpose: consentBody.Purpose || null,
    fi_data_range: consentBody.FIDataRange || null,
    data_life: consentBody.DataLife || null,
    frequency: consentBody.Frequency || null,
    data_filter: consentBody.DataFilter || null,
    ver: consentBody.ver || null,
    consent_id: consentBody.consentId || null,
    consent_request_id: consentBody.consent_request_id || null,
    aggregator_id: consentBody.aggregator_id || null,
    digital_signature: consentBody.digitalSignature || null,
    consent_status: consentBody.consentStatus || null,
    consent_handle: consentBody.consentHandle || null,
    customer_id: consentBody.customer_id || null,
    frequency_limit: consentBody.frequency_limit || null,
    realm: consentBody.realm || null,
    group: consentBody.group || null,
    customer_ref: consentBody.customer_ref || null,
  }

  return newConsent;
}


/*
 * @author: adarsh
 * @description: POST FI request .
 * @param: {} req.param will contain FI details.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.postFIRequest = async function (consentHandle, realm, group, queueName) {
  try {
    console.log("postFIRequest called");
    
    console.log("queueName : ",queueName);
    console.log("Inside postFI request service : 440");
    let queueid = '';
    let AAresponseData;

    let DataConsumer = await SequelizeDao.getAllData('DATA_CONSUMER', { realm: realm })
      .then(function (result) {
        console.log(`Wrapper function result:${JSON.stringify(result)}`);
        return result;
      })
      .catch(function (error) {
        console.error(`Error in wrapper function:${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
        // throw err;
      });

    try {
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      console.log("agent :",agent);

      let realmData = await SequelizeDao.getAllData('REALM_CONFIG', { realm: realm })
      .then(function (result) {
        console.log(`Wrapper function result:${JSON.stringify(result)}`);
        return result;
      })
      .catch(function (error) {
        console.error(`Error in wrapper function:${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
        // throw err;
      });

      console.log("realmConfigData----------->",realmData)

      const FIU_BASE_URL = realmData[0].fiuBaseURL

      console.log("FIU_BASE_URL----------->",FIU_BASE_URL)
      
      console.log("LINE : 448");
      // const response = await axios.post(process.env.FIU_BASE_URL + 'FI/Request/' + consentHandle, { httpsAgent: agent });
      await axios.get(FIU_BASE_URL + 'FI/Request/' + consentHandle, {
        httpsAgent: agent, headers: {
          'Authorization': 'Basic ' + process.env.FIU_PASS,
          'Content-Type': 'application/json',
          "fiu-client-id": DataConsumer[0].id
        }
      })
        .then(async response => {
          console.log("LINE : 457",response.data);
          AAresponseData = response.data;
          console.log("AAresponseData :",AAresponseData);
          
          console.log(`FI Request response: 459 ${JSON.stringify(AAresponseData)}`);
          let consentRequestUpdate = {
            sessionId: AAresponseData.sessionId,
            firequest_status: "DONE"
          };
          console.log("consentRequestUpdate :",consentRequestUpdate);
          
          let consentRequestReplicaUpdate = {
            session_id: AAresponseData.sessionId,
            firequest_status: "DONE"
          };
          console.log("consentRequestReplicaUpdate : ",consentRequestReplicaUpdate);
          
          try {
            console.log("LINE : 469");
            await SequelizeDao.updateData(consentRequestUpdate, 'CONSENT_REQUEST_DETAIL', { consentHandle: consentHandle, group: group });
          } catch (error) {
            console.error(`An error occurred while updating consent request detail: 472 ${JSON.stringify(error)}`);
            let errorBody = {
              message: errorResponses[400].message,
              error: errorResponses[400].error,
              errorMessage: error.message,
              statusCode: errorResponses[400].statusCode,
            };
            throw errorBody;
          }
          try {
            console.log("LINE : 482");
            await SequelizeDao.updateData(consentRequestReplicaUpdate, 'CONSENT_REQUEST_REPLICA', { consent_handle: consentHandle, group: group });
          } catch (error) {
            console.error(`An error occurred while updating consent request detail:485  ${JSON.stringify(error)}`);
            let errorBody = {
              message: errorResponses[400].message,
              error: errorResponses[400].error,
              errorMessage: error.message,
              statusCode: errorResponses[400].statusCode,
            };
            throw errorBody;
          }
        })
        .catch(error => {
          console.error(`Error in fi request API: 496 ${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[500].message,
            error: errorResponses[500].error,
            errorMessage: error.message,
            statusCode: errorResponses[500].statusCode,
          };
          throw errorBody;
        });

      // AAresponseData = response.data;
      // console.log(`${JSON.stringify(AAresponseData)}`);
    } catch (error) {
      console.error(`FI Request error: 509 ${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    }

    let sessionId = AAresponseData.sessionId;
    let consentId = AAresponseData.consentId;
    console.log("sessionId ,consentId : ",sessionId,consentId);
    
    let coresult = await SequelizeDao.getAllData('CONSENT_REQUEST_DETAIL', { consentId: consentId, realm: realm, group: group })
      .then(function (result) {
        console.log(`Wrapper function result: ${JSON.stringify(result)}`);
        return result
      })
      .catch(function (error) {
        console.error(`Error getting CONSENT_REQUEST_DETAIL: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      });

    console.log(`coresult >>>>>>>>: ${JSON.stringify(coresult)}`);

    let customer_id = coresult[0].Customer.id;
    let correlationId = coresult[0].correlation_id
    console.log(`customer id: ${customer_id}`);
    let FIRequest_id = uuid();
    let now = new Date();
    let timestamp = now.toISOString();
    let txnid = uuid();
    let aggregator_id;
    let FIDataRange;
    let consentDetail;
    let fiTypes

    let FIsessionBody = {
      consentId: consentId,
      FIRequest_id: FIRequest_id,
      sessionId: sessionId,
      ver: ver,
      timestamp: timestamp,
      txnid: txnid,
      aggregator_id: coresult[0].aggregator_id,
      FIStatus: "PENDING",
      correlation_id: correlationId,
      realm: realm,
      group: group
    };

    console.log("FIsessionBody insert in FI_sessionmgmntTable--->651",FIsessionBody)

    try {
      await SequelizeDao.insertData(FIsessionBody, "FI_SESSIONMGMNT");
    } catch (error) {
      console.error(`Error inserting FI session: ${JSON.stringify(error)}`);
      console.error(`Error inserting FI session: ${JSON.stringify(error)}`);
      // let responseBody;

      await redisClient.del(`fi-request_${group}`);  //+ filters

      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }

    // let FIcondition = {
    //   FIRequest_id: FIRequest_id,
    // };

    try {
      consentDetail = await SequelizeDao.getAllData('CONSENT_REQUEST_DETAIL', { consentId: consentId, realm: realm, group: group })
        .then(function (result) {
          console.log(`Wrapper function result: ${result}`);
          return result;
        })
        .catch(function (error) {
          console.error(`Error in wrapper function: ${error}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
          // throw err;
        });

      console.log(`Console details: ${consentDetail}`);
      console.log("Console details:", consentDetail);
      aggregator_id = consentDetail[0].aggregator_id;
      FIDataRange = consentDetail[0].FIDataRange
      fiTypes = consentDetail[0].fiTypes

    } catch (error) {
      console.error(`Error while fetching consent details: ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    }
    if (queueName && queueName.length > 0) {
      // --------- Adding queueid fron Schdule table to firequest table -----------
      try {
        const scheduleid = await SequelizeDao.findOnee('SCHEDULER', { consentHandle: consentHandle, queueName: queueName })
          .then(function (result) {
            console.log(`get schedule from result : ${result}`);
            return result;
          })
          .catch(function (error) {
            console.error(`Error in getting data from schedule table: ${error}`);
            let errorBody = {
              message: errorResponses[400].message,
              error: errorResponses[400].error,
              errorMessage: error.message,
              statusCode: errorResponses[400].statusCode,
            };
            throw errorBody;
          });
        queueid = scheduleid.dataValues.id;
        console.log("queueid : 640 ", queueid);

      } catch (error) {
        console.error(`Error : ${error}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      }

      // ----------------------------------------------------------------------
    }


    let FIreqbody = {
      txnid: uuid(),
      sessionId: sessionId,
      consentId: consentId,
      customer_id: customer_id,
      FIStatus: "PENDING",
      aggregator_id: aggregator_id,
      FIDataRange: FIDataRange,
      ver: ver,
      timestamp: timestamp,
      FIRequest_id: FIRequest_id,
      fiTypes: fiTypes,
      correlation_id: coresult[0].correlation_id,
      Consent: {
        id: consentDetail[0].consentId,
        digitalSignature: consentDetail[0].digitalSignature
      },
      realm: realm,
      group: group,
      consentHandle: consentDetail[0].consentHandle,
      queueid: queueid || "", //(queueName && queueName.length > 0) ? queueid:'',
      customer_ref: coresult[0].customer_ref,
      fetchType: consentDetail[0].fetchType
    };

    console.log("Insert if request FIreqbody--->769",FIreqbody)

    try {
      await SequelizeDao.insertData(FIreqbody, "FI_REQUEST");
    } catch (error) {
      console.error(`Error updating FI request: ${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    }

    try {
      // eslint-disable-next-line no-undef
      let replicaBody = newFiRequestReplica(FIreqbody);
      replicaBody.fi_types = fiTypes;
      replicaBody.fetchType = consentDetail[0].fetchType;
      replicaBody.customer_ref = coresult[0].customer_ref;
      console.log("Insert in FI_REQUEST_REPLICA replicaBody--->788",replicaBody)
      await SequelizeDao.insertData(replicaBody, "FI_REQUEST_REPLICA");
    } catch (error) {
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }


    let responseBody;
    await redisClient.del(`fi-request_${group}`)  //+ filters

    if (!AAresponseData) {
      const error = new Error("AA data not found");
      responseBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
    } else {
      responseBody = {
        message: "success in posting request",
        error: false,
        statusCode: 200,
        data: AAresponseData,
      };
    }

    return responseBody;
  } catch (error) {
    console.error(`${error}`);
    console.error(`An error occurred while posting consent: ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

// eslint-disable-next-line no-undef
newFiRequestReplica = function (FIreqbody) {
  let newFiRequest = {
    timestamp: FIreqbody.timestamp,
    txnid: FIreqbody.txnid,
    fi_data_range_from: FIreqbody.FIDataRange.from || null,
    fi_data_range_to: FIreqbody.FIDataRange.to || null,
    consent: FIreqbody.Consent || null,
    ver: FIreqbody.ver || null,
    session_id: FIreqbody.sessionId || null,
    consent_id: FIreqbody.consentId || null,
    consent_handle: FIreqbody.consentHandle || null,
    fi_request_id: FIreqbody.FIRequest_id || null,
    aggregator_id: FIreqbody.aggregator_id || null,
    customer_id: FIreqbody.customer_id || null,
    correlation_id: FIreqbody.correlation_id || null,
    fi_status: FIreqbody.FIStatus || null,
    session_status: FIreqbody.sessionStatus || null,
    fi_types: FIreqbody.fiTypes || null,
    realm: FIreqbody.realm || null,
    group: FIreqbody.group || null
  }

  return newFiRequest;
}

/*
* @author: adarsh
* @description: GET STATUS .
* @param: {} req.param will contain consent detail.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/
exports.getStatusByConsentHandle = async function (consentHandle, realm, group) {
  try {
    const cacheKey = JSON.stringify(consentHandle);
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      console.log("fetching cache");
      const parsedData = JSON.parse(reply);
      return parsedData;
    }

    let DataConsumer = await SequelizeDao.getAllData('DATA_CONSUMER', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    console.log("DataConsumer--------->",DataConsumer)

    try {
      const agent = new https.Agent({
        rejectUnauthorized: false
      });

      let now = new Date();
      let timestamp = now.toISOString();

      let realmData = await SequelizeDao.getAllData('REALM_CONFIG', { realm: realm })
      .then(function (result) {
        console.log(`Wrapper function result:${JSON.stringify(result)}`);
        return result;
      })
      .catch(function (error) {
        console.error(`Error in wrapper function:${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
        // throw err;
      });

      console.log("realmConfigData----------->",realmData)

      const FIU_BASE_URL = realmData[0].fiuBaseURL

      console.log("FIU_BASE_URL----------->",FIU_BASE_URL)

      const headers = {
        Authorization: 'Basic ' + process.env.FIU_PASS,
        "fiu-client-id": DataConsumer[0].id
      };

      console.log("headers-------->",headers)

      // const result = await axios.get(process.env.FIU_BASE_URL + 'consent/handle/' + consentHandle, { httpsAgent: agent });
      const result = await axios.post(FIU_BASE_URL + 'consent/handle', {
        "ver": "2.0.0",
        "timestamp": timestamp,
        "txnid": uuid(),
        "ConsentHandle": consentHandle
      }, { httpsAgent: agent, headers: headers })


      if (!result.data) {
        const error = new Error("Consent handle not found")
        let errorBody = {
          message: errorResponses[404].message,
          error: errorResponses[404].error,
          errorMessage: error.message,
          statusCode: errorResponses[404].statusCode,
        };
        throw errorBody;
      }

      const AAresponseData = result.data;
      console.log(`responseeee ${AAresponseData}`);

      const consentHandleBody = {
        consentStatus: AAresponseData.ConsentStatus.status === "APPROVED" ? "ACTIVE" : AAresponseData.ConsentStatus.status,
        consentId: AAresponseData.ConsentStatus.id,
        consentHandle: consentHandle,
        realm: realm
      };

      console.log("consentHandleBody-------->",consentHandleBody)

      const handleCondition = {
        consentHandle: consentHandle,
        group: group
      };

      try {
        try {
          await SequelizeDao.updateData(consentHandleBody, 'CONSENT_HANDLE', handleCondition);
        } catch (error) {
          console.error(`An error occurred while updating consent handle: ${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
        }
        try {
          await SequelizeDao.updateData(consentHandleBody, 'CONSENT', handleCondition);
        } catch (error) {
          console.error(`An error occurred while updating consent: ${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
        }
        try {
          await SequelizeDao.updateData(consentHandleBody, 'CONSENT_REQUEST', handleCondition);
        } catch (error) {
          console.error(`An error occurred while updating consent request: ${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
        }
        try {
          await SequelizeDao.updateData(consentHandleBody, 'CONSENT_REQUEST_DETAIL', handleCondition);
        } catch (error) {
          console.error(`An error occurred while updating consent request detail: ${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
        }
        try {
          let consentHandleReplicaBody = {
            consent_status: AAresponseData.ConsentStatus.status,
            consent_id: AAresponseData.ConsentStatus.id,
            consent_handle: consentHandle,
          };
          let handleConditionReplica = {
            consent_handle: consentHandle,
            group: group
          };
          await SequelizeDao.updateData(consentHandleReplicaBody, 'CONSENT_REQUEST_REPLICA', handleConditionReplica);
        } catch (error) {
          console.error(`An error occurred while updating consent request detail: ${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
        }
      } catch (error) {
        console.error(`Error updating data: ${error}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      }

      console.log(`${consentHandleBody}`);

      const responseBody = {
        message: 'success in getting status',
        error: false,
        statusCode: 200,
        data: AAresponseData,
      };

      await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

      return responseBody;
    } catch (error) {
      console.log(error);
      if (error.statusCode) {
        return {
          message: error.message,
          error: true,
          statusCode: error.statusCode,
        };
      } else {
        return {
          message: 'An error occurred while getting consent status',
          error: true,
          statusCode: 500,
        };
      }
    }
  } catch (error) {
    console.log(`${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};



/*
* @author: adarsh
* @description: POST consent Notification.
* @param: {} req.param will contain .
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/

exports.postConsentNotification = async function (body, auth) {
  console.log("Inside fiu service - Update consent status", body);

  const params = {
    SecretId: process.env.FIUARN
  };
  const getSecret = await getSecretKey(params);
  console.log('getSecret', getSecret);
  console.log('AUTH', auth);
  const authHeaderValue = auth.split(" ")
  const Buffer = require('buffer').Buffer;
  const decodedString = Buffer.from(authHeaderValue[1], 'base64').toString('utf-8');
  console.log(decodedString);
  const authString = decodedString.split(':');
  if (authString[0] === getSecret.CLIENTID && authString[1] === getSecret.CLIENTSECERT) {
    let notification_id = uuid();
    let realm;


    let consentStatusBody = {
      ver: body.ver,
      txnid: body.txnid,
      timestamp: body.timestamp,
      notificationType: "Consent Notification",
      Notifier: body.Notifier,
      ConsentStatusNotification: body.ConsentStatusNotification,
      consentId: body.ConsentStatusNotification.consentId,
      aggregator_id: body.Notifier.id,
      notification_id: notification_id,
      consentHandle: body.ConsentStatusNotification.consentHandle
    };

    await SequelizeDao.getAllData("CONSENT_HANDLE", { consentHandle: body.ConsentStatusNotification.consentHandle }).then(function (result) {
      // console.log(`realm result: ${JSON.stringify(result[0].realm)}`);
      realm = result[0].realm;
      console.log(`realm: ${realm}`);
      // realm = 'vdcap';
      // return result;
    }).catch(function (err) {
      console.error(`Error in wrapper function: ${err}`);
      throw err;
    });

    console.log(`realm: ${JSON.stringify(realm)}`);
    console.log(`consent handle: ${JSON.stringify(body.ConsentStatusNotification.consentHandle)}`);


    let consentUpdateBody = {
      consentStatus: body.ConsentStatusNotification.consentStatus,
      consentId: body.ConsentStatusNotification.consentId,
      consentHandle: body.ConsentStatusNotification.consentHandle,
    };

    let consentBody = {
      status: body.ConsentStatusNotification.consentStatus,
      consentId: body.ConsentStatusNotification.consentId,
      consentHandle: body.ConsentStatusNotification.consentHandle,
    };

    let updateCondition = {
      // consentId: body.ConsentStatusNotification.consentId,
      consentHandle: body.ConsentStatusNotification.consentHandle
    };

    console.log("body.ConsentStatusNotification.consentStatus",body.ConsentStatusNotification.consentStatus)

    // if(body.ConsentStatusNotification.consentStatus === 'REVOKED' || body.ConsentStatusNotification.consentStatus === 'EXPIRED') {
    //   try {
    //     console.log("consentStatus revoked or expired",data);
    //     const modelName = 'fiu_data_flow';
    //     const data = await SequelizeDao.deleteFIData_publicSchema(modelName,{consent_handle_id:body.ConsentStatusNotification.consentHandle});
    //     console.log("deleteFIData",data);
    //   } catch (error) {
    //     console.error(`Error deleting consent data: ${JSON.stringify(error)}`);
    //     let errorBody = {
    //       message: errorResponses[400].message,
    //       error: errorResponses[400].error,
    //       errorMessage: error.message,
    //       statusCode: errorResponses[400].statusCode,
    //     };
    //     throw errorBody;
    //   }
    // }
    
    try {
      try {
        await SequelizeDao.updateData(consentUpdateBody, "CONSENT_HANDLE", updateCondition);
      } catch (error) {
        console.error(`Error updating CONSENT_HANDLE: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[400].message,
          error: errorResponses[400].error,
          errorMessage: error.message,
          statusCode: errorResponses[400].statusCode,
        };
        throw errorBody;
      }
      try {
        await SequelizeDao.updateData(consentUpdateBody, "CONSENT_REQUEST", updateCondition);
      } catch (error) {
        console.error(`Error updating CONSENT_REQUEST: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[400].message,
          error: errorResponses[400].error,
          errorMessage: error.message,
          statusCode: errorResponses[400].statusCode,
        };
        throw errorBody;
      }
      try {
        await SequelizeDao.updateData(consentUpdateBody, "CONSENT_REQUEST_DETAIL", updateCondition);
      } catch (error) {
        console.error(`Error updating CONSENT_REQUEST_DETAIL: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[400].message,
          error: errorResponses[400].error,
          errorMessage: error.message,
          statusCode: errorResponses[400].statusCode,
        };
        throw errorBody;
      }
      try {
        let consentUpdateReplicaBody = {
          consent_status: body.ConsentStatusNotification.consentStatus,
          consent_id: body.ConsentStatusNotification.consentId,
          consent_handle: body.ConsentStatusNotification.consentHandle,
        };
        let updateReplicaCondition = {
          consent_handle: body.ConsentStatusNotification.consentHandle
        };
        await SequelizeDao.updateData(consentUpdateReplicaBody, "CONSENT_REQUEST_REPLICA", updateReplicaCondition);
      } catch (error) {
        console.error(`Error updating CONSENT_REQUEST_REPLICA: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[400].message,
          error: errorResponses[400].error,
          errorMessage: error.message,
          statusCode: errorResponses[400].statusCode,
        };
        throw errorBody;
      }
      try {
        await SequelizeDao.updateData(consentBody, "CONSENT", updateCondition);
      } catch (error) {
        console.error(`Error updating CONSENT: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[400].message,
          error: errorResponses[400].error,
          errorMessage: error.message,
          statusCode: errorResponses[400].statusCode,
        };
        throw errorBody;
      }
      try {
        await SequelizeDao.updateData({ consentId: body.ConsentStatusNotification.consentId, aggregator_id: body.Notifier.id }, "NOTIFICATION", { txnid: body.txnid });
      } catch (error) {
        console.error(`Error updating Notification: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[400].message,
          error: errorResponses[400].error,
          errorMessage: error.message,
          statusCode: errorResponses[400].statusCode,
        };
        throw errorBody;
      }
    } catch (error) {
      console.error(`Error updating consent data: ${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }

      try {
        let result = await SequelizeDao.insertData(consentStatusBody, "NOTIFICATION");
        console.log(`Notification response: ${JSON.stringify(result)}`);

        let responseBody;

        if (result.error) {
          responseBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: result.error.message,
            statusCode: errorResponses[400].statusCode,
          };

        } else {
          responseBody = {
            message: "Success in sending consent notification",
            statusCode: 200,
            response: "OK",
            ver: body.ver,
            timestamp: body.timestamp,
            txnid: body.txnid
          };
        }
        // let consentId = body.ConsentStatusNotification.consentId
        // const agent = new https.Agent({
        //   rejectUnauthorized: false,
        // });

        // let response = await axios.get('http://localhost:3003/api/fiu/v1/consent/' + consentId, { httpsAgent: agent })
        // console.log("consent Id called successfully", response);
        // var consentHandle = body.ConsentStatusNotification.consentHandle
        // FIUService.getConsentInfoFromAggregator(consentHandle, consentId)
        //   .then(function (result) {
        //     console.log(' fetched consent info successfully');
        //     // res.status(result.statusCode).send(result);
        //   })
        //   .catch(function (err) {
        //     console.log("Error in  get consent info controller", err);
        //     // res.status(err.statusCode).send(err);
        //   });


        let fiRequestEnabled = await SequelizeDao.getAllData("CONFIGURATION", { realm: realm });
        console.log("FI AUTOMATION", fiRequestEnabled[0].dataValues.fi_request)

        if (fiRequestEnabled[0].dataValues.fi_request === true) {
          let consentHandle = body.ConsentStatusNotification.consentHandle;
          try {
            // const agent = new https.Agent({
            //   rejectUnauthorized: false,
            // });
            // let response = await axios.post(process.env.FIU_MW_URL + '/api/v1/fi/request/' + consentHandle, { httpsAgent: agent })
            await FIUService.postFIRequest(consentHandle, realm)
              .then(function (result) {
                // console.log(' Error in post fi request');
                // eslint-disable-next-line no-undef
                res.status(result.statusCode).send(result);
              })
              .catch(function (err) {
                console.log(" Error in post fi request", err);
                // eslint-disable-next-line no-undef
                res.status(err.statusCode).send(err);
              });
            console.log("FI request called successfully");
          } catch (error) {
            console.error("Error calling FI request:", error);
            console.log("FI request not called");
            let errorBody = {
              message: errorResponses[500].message,
              error: errorResponses[500].error,
              errorMessage: error.message,
              statusCode: errorResponses[500].statusCode,
            };
            throw errorBody;
          }
        }

        return responseBody;
      } catch (error) {
        console.error(`Notification error: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      }
  } else {
    let errorBody = {
      message: "Unauthorized access",
      error: true,
      errorMessage: error,
      statusCode: 400,
    };
    throw errorBody;
  }

};

exports.getConsentInfoFromAggregator = async function (consentHandle, consentId) {
  try {
    const cacheKey = "consent_info" + consentId;
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    let now = new Date();
    let timestamp = now.toISOString();

    // const result = await axios.get(process.env.FIU_BASE_URL_V2 + 'consent/information/' + consentHandle + '/' + consentId, { httpsAgent: agent, headers: headers });
    const result = await axios.post(process.env.FIU_BASE_URL_V2 + 'consent/information', {
      "ver": "2.0.0",
      "timestamp": timestamp,
      "txnid": uuid(),
      "consentId": consentId
    }, { httpsAgent: agent });

    const AAresponseData = result.data;
    console.log("responseeee", AAresponseData);

    if (!AAresponseData) {
      const error = new Error("No consent information found")
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      throw errorBody;
      // throw { statusCode: 404, message: "No consent information found" };
    }

    let str = AAresponseData.signedConsent;
    let arr = str.split('.');
    let digitalSignature = arr[2];
    const consentArtifact = jwt.decode(AAresponseData.signedConsent);
    console.log("decoded data:", consentArtifact);

    let linkedAccounts = consentArtifact.Accounts

    let consentBody = {
      ver: AAresponseData.ver,
      txnid: AAresponseData.txnid,
      consentId: consentId,
      consentStatus: AAresponseData.status,
      timestamp: AAresponseData.createTimestamp,
      signedConsent: AAresponseData.signedConsent,
      consentUse: AAresponseData.ConsentUse,
      digitalSignature: digitalSignature,
      accounts: linkedAccounts
    }

    let consentRequestDetail = {
      digitalSignature: digitalSignature,
      consentId: consentId
    }

    let consentCondition = {
      consentId: consentId
    };

    try {
      await SequelizeDao.updateData(consentBody, "CONSENT", consentCondition);
    } catch (error) {
      console.error("Error updating consent:", error);
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }

    try {
      await SequelizeDao.updateData(consentRequestDetail, "CONSENT_REQUEST_DETAIL", consentCondition);
    } catch (error) {
      console.error("Error updating consent request detail:", error);
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }

    try {
      await SequelizeDao.updateData(consentRequestDetail, "CONSENT_REQUEST_REPLICA", consentCondition);
    } catch (error) {
      console.error("Error updating consent request detail:", error);
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }

    console.log(consentBody);

    const responseBody = {
      message: "success in getting financial info",
      error: false,
      statusCode: 200,
      data: AAresponseData
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.log(error);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

/*
 * @author: adarsh
 * @description: GET FI by session id.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.getFinancialInfo = async function (sessionId, res, group,realm) {
  try {
    const cacheKey = JSON.stringify(sessionId);
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }

    let DataConsumer = await SequelizeDao.getAllData('DATA_CONSUMER', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    let realmData = await SequelizeDao.getAllData('REALM_CONFIG', { realm: realm })
      .then(function (result) {
        console.log(`Wrapper function result:${JSON.stringify(result)}`);
        return result;
      })
      .catch(function (error) {
        console.error(`Error in wrapper function:${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
        // throw err;
      });

      console.log("realmConfigData----------->",realmData)

      const FIU_BASE_URL = realmData[0].fiuBaseURL

      console.log("FIU_BASE_URL----------->",FIU_BASE_URL)

    const headers = {
      Authorization: 'Basic ' + process.env.FIU_PASS,
      "fiu-client-id": DataConsumer[0].id
    };

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    let response = await axios.get(FIU_BASE_URL + 'api/v1/FI/Fetch/' + sessionId, { httpsAgent: agent, headers: headers });
    // https://fiuuat.electronicpay.in:9071/api/v1/FI/Fetch/{sessionId}
    let AAresponseData = response.data;

    console.log("Fetch details:", AAresponseData);

    // let result = await supabase
    //   .from('fi_request')
    //   .select('*')
    //   .match({ sessionId: sessionId })
    //   .then(({ data, error }) => {
    //     if (error) {
    //       throw error;
    //     } else {
    //       return data;
    //     }
    //   });

    let result = await SequelizeDao.getAllData("FI_REQUEST", { sessionId: sessionId, group: group });


    let consentId = result[0].consentId;
    let FIRequest_id = result[0].FIRequest_id;

    // let decryptedFI = AAresponseData.FI[0].data[0].decryptedFI;

    let sessionBody = {
      ver: AAresponseData.ver,
      txnid: AAresponseData.txnid,
      timestamp: AAresponseData.timestamp,
      FI: AAresponseData.FI[0],
      fipID: AAresponseData.FI[0].fipID,
      data: AAresponseData.FI[0].data,
      KeyMaterial: AAresponseData.FI[0].KeyMaterial,
      encryptedFI: AAresponseData.FI[0].data[0].encryptedFI,
      // decryptedFI: decryptedFI,
      sessionId: sessionId,
      consentId: consentId,
      FIRequest_id: FIRequest_id,
      group: group
    };

    try {
      await SequelizeDao.insertData(sessionBody, 'FINANCIAL_INFORMATION');
    } catch (error) {
      console.error(`Error inserting financial information: ${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }

    let responseBody;

    if (!response.data) {
      const error = new Error("Financial Info Not Found")
      responseBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };

      return responseBody;
    }

    responseBody = {
      message: 'success in getting financial info',
      error: false,
      statusCode: 200,
      data: AAresponseData
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);


    return responseBody;

  } catch (error) {
    console.error(`An error occurred while getting financial info: ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};




/*
 * @author: adarsh
 * @description: POST FI Notification.
 * @param: {} req.param will contain .
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.postFINotification = async function (body) {
  console.log("Inside fiu service - Update consent status");

  let notification_id = uuid();
  let sessionId = body.FIStatusNotification.sessionId;
  let sessionStatus = body.FIStatusNotification.sessionStatus;
  let realm;

  let FIStatusBody = {
    ver: ver,
    txnid: body.txnid,
    timestamp: body.timestamp,
    notificationType: "FI Notification",
    Notifier: body.Notifier,
    FIStatusNotification: body.FIStatusNotification,
    notification_id: notification_id,
    sessionId: sessionId,
    // realm: realm
  };


  console.log(`sessionId: ${sessionId}`);

  let FIUpdateBody = {
    FIStatus: FIStatusBody.FIStatusNotification.FIStatusResponse[0].Accounts[0].FIStatus,
    sessionStatus: sessionStatus,
    FIStatusResponse: body.FIStatusNotification.FIStatusResponse
  };

  console.log("FIUpdateBody--------->",FIUpdateBody)

  let FI_ReplicaUpdateBody = {
    fi_status: FIStatusBody.FIStatusNotification.FIStatusResponse[0].Accounts[0].FIStatus,
    session_status: sessionStatus,
    fi_status_response: body.FIStatusNotification.FIStatusResponse
  };


  if(sessionStatus === 'COMPLETED' || sessionStatus === 'ACTIVE') {
    const fiResponse = body.FIStatusNotification.FIStatusResponse
    // eslint-disable-next-line no-unused-vars
    console.log("response-->",fiResponse)
    const totalAccounts = fiResponse.reduce((count, item) => count + item.Accounts.length, 0);

    console.log("count--->",totalAccounts)
    console.log("response-->",fiResponse)
    FI_ReplicaUpdateBody = {
      fi_status: FIStatusBody.FIStatusNotification.FIStatusResponse[0].Accounts[0].FIStatus,
      session_status: sessionStatus,
      fi_status_response: body.FIStatusNotification.FIStatusResponse,
      no_of_accounts: totalAccounts
    };
    console.log("ifcondition-FI_ReplicaUpdateBody",FI_ReplicaUpdateBody);
  }

  console.log("FI_ReplicaUpdateBody--------->",FI_ReplicaUpdateBody)

  let updateCondition = {
    sessionId: sessionId,
  };

  let replicaUpdateCondition = {
    session_id: sessionId,
  };

  try {
    await SequelizeDao.updateData(FIUpdateBody, "FI_SESSIONMGMNT", updateCondition);
    await SequelizeDao.updateData(FIUpdateBody, "FI_REQUEST", updateCondition);
    await SequelizeDao.updateData(FI_ReplicaUpdateBody, "FI_REQUEST_REPLICA", replicaUpdateCondition);
    // await FIUDao.updateData(FIUpdateBody, "financial_information", updateCondition);

    console.log(`FIStatusBody: ${JSON.stringify(FIStatusBody)}`);

    let result = await SequelizeDao.insertData(FIStatusBody, "NOTIFICATION");
    console.log(`FI Notification: ${result}`);

    const findSessionId = await SequelizeDao.findOnee('FI_REQUEST', { sessionId: sessionId });
          console.log("findSessionId :1557", findSessionId);

      if (!findSessionId) {
            console.log("findSessionId has no data");

        let errorBody = {
              message: errorResponses[500].message,
              error: errorResponses[500].error,
              errorMessage: error.message,
              statusCode: errorResponses[500].statusCode,
          };
          throw errorBody;
      }


    realm = findSessionId.dataValues.realm

    let DataConsumer = await SequelizeDao.getAllData('DATA_CONSUMER', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    const headers = {
      Authorization: 'Basic ' + process.env.FIU_PASS,
      "fiu-client-id": DataConsumer[0].id
    };
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    console.log("sessionId,FIStatus",sessionId, FIStatusBody.FIStatusNotification.FIStatusResponse[0].Accounts[0].FIStatus)
    const fiStatus = FIStatusBody.FIStatusNotification.FIStatusResponse[0].Accounts[0].FIStatus;
    console.log("fiStatus-----1550",fiStatus)

    if(findSessionId.dataValues.queueid) {

    let comparison_status = '';
    let queueid;
      if (fiStatus === 'READY') {
        try {
          await new Promise(resolve => setTimeout(resolve, 60000));
          let response = await axios.get(process.env.FIU_BASE_URL_V2 + 'crypto/decrypt/' + sessionId, { httpsAgent: agent, headers: headers });
          console.log("received xml data : 1499", response.data.FI);
          const consolidatedJson = await getConsolidatedFIdata(response.data.FI);

          console.log("consolidatedJson ------>",consolidatedJson)
          // ------- GET CONSENT HANDLE BY SESSION ID ---------------
          const findSessionId = await SequelizeDao.findOnee('FI_REQUEST', { sessionId: sessionId });
          console.log("findSessionId :1557", findSessionId);

          if (!findSessionId) {
            console.log("findSessionId has no data");

            let errorBody = {
              message: errorResponses[500].message,
              error: errorResponses[500].error,
              errorMessage: error.message,
              statusCode: errorResponses[500].statusCode,
            };
            throw errorBody;
          }
          
          const CONSENT_HANDLE = findSessionId.dataValues.consentHandle;
          queueid = findSessionId.dataValues.queueid;
          realm = findSessionId.dataValues.realm
          console.log("CONSENT_HANDLE : 1572", CONSENT_HANDLE);
          // ----------------------------------------
          // ------------GET DATA FROM SCHEDULE TABLE BY CONSENT HANDLE ----------------------
          // --- GET QUNAME FROM SCHEDULAR TABLE -----
          const queueNameData = await SequelizeDao.findOnee('SCHEDULER', { id: queueid });
          console.log("queueNameData: 2235",queueNameData)
          if (!queueNameData) {
            console.log(" No data found");
            let errorBody = {
              message: errorResponses[500].message,
              error: errorResponses[500].error,
              errorMessage: error.message,
              statusCode: errorResponses[500].statusCode,
            };
            throw errorBody;
          }
          const queueName = queueNameData.dataValues.queueName;
          console.log("getScheduleData :2246",queueName)
          // ---------------------------------------
          const getScheduleData = await SequelizeDao.findOnee('SCHEDULER', { consentHandle: CONSENT_HANDLE, queueName: queueName });
          console.log("getScheduleData :1557", getScheduleData);

          if (!getScheduleData) {
            console.log("getScheduleData has no data");

            let errorBody = {
              message: errorResponses[500].message,
              error: errorResponses[500].error,
              errorMessage: error.message,
              statusCode: errorResponses[500].statusCode,
            };
            throw errorBody;
          }
          // ----------------------------------------

          // -------- COMPARISON LOGIC ADDED HERE --------------
          const comparisonKey = getScheduleData.dataValues.comparisonKey;
          console.log("comparisonKey :2267", comparisonKey);
          const summaryData = consolidatedJson.Account.Summary[0];
          console.log("summaryData :2269", summaryData);
          // eslint-disable-next-line no-prototype-builtins
          if (summaryData.hasOwnProperty(comparisonKey)) {
            console.log("ifffffff  hasOwnProperty :2271");
            const comparisonValue = summaryData[comparisonKey];
            console.log("comparisonValue :2273", comparisonValue);
            const expression = getScheduleData.dataValues.comparisonExpression;
            console.log("expression :2275", expression);
            const comparevalue = getScheduleData.dataValues.comparisonValue;
            console.log("comparevalue :2277", comparevalue);
            if (eval(`${comparisonValue} ${expression} ${comparevalue}`)) {
              console.log("eval----ifcondition :2279");
              if (comparisonValue == comparevalue) {
                console.log("TRUE : 1647 Adequate", `${comparisonValue} ${expression} ${comparevalue}`);
                comparison_status = 'Adequate';

              } else {
                console.log("TRUE : 1649 Surplus", comparisonKey, `${comparisonValue} ${expression} ${comparevalue}`);
                comparison_status = 'Surplus';

              }
            } else {
              // console.log("FALSE : 5780 Deficit", `${currentBalance} ${expression} ${comparevalue}`);
              console.log("FALSE : 5780 Deficit", `${expression} ${comparevalue}`);
              comparison_status = 'Deficit';
            }
          } else {
            comparison_status = 'FAILED';
            console.log(`${comparisonKey} does not exist.`);
          }

      } catch (error) {
        console.error("Error calling API : 1509", error);
        comparison_status = 'FAILED';
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        comparison_status = 'FAILED';
        throw errorBody;
      }
      }else {
        comparison_status = 'FAILED';
      }
      
      const  fi_request_update = {
          comparison_status: comparison_status
        }
        console.log("fi_request_update: 2297--->",fi_request_update)
        console.log("queueid: 2298--->",queueid)
        try {
          await SequelizeDao.updateData(fi_request_update, 'FI_REQUEST', { queueid: queueid });
        } catch (error) {
          console.error(`An error occurred while updating fi request comparison_status : 1666  ${JSON.stringify(error)}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
        }
      }else {
        if(fiStatus === 'READY') {
          try {
            await new Promise(resolve => setTimeout(resolve, 60000));
            let response = await axios.get(process.env.FIU_BASE_URL_V2 + 'crypto/decrypt/' + sessionId, { httpsAgent: agent, headers: headers });
            console.log("received xml data : 1499", response.data.FI);
            const consolidatedJson = await getConsolidatedFIdata(response.data.FI);
            
            if(consolidatedJson) {
              console.log("if--consolidatedJson-- 3296")
              try {
                const getWebhookURL = await SequelizeDao.findOnee('REALM_CONFIG', { realm: realm });
                console.log("getWebhookURL---->",getWebhookURL)
                const weburl = getWebhookURL.dataValues.webhook_url;
                console.log("weburl-->",weburl)
  
                if(weburl) {
                   const body = {
                    data: {
                      "fiData": consolidatedJson.fiData ? consolidatedJson.fiData : [],
                      "sessionId": sessionId
                    }
                  }
                  console.log("body---------->",body)
                  console.log("getWebhookURL.dataValues.header",getWebhookURL.dataValues.header)
                  // const httpHeader = await JSON.parse(getWebhookURL.dataValues.header)
                  let header = {}
                  if(getWebhookURL.dataValues.header) {
                    header = await JSON.parse(getWebhookURL.dataValues.header.replace(/'/g, '"'))
                  }
                  
                  console.log("header---->",header)
                  const result = await axios.post(weburl, body, { headers: header });
                  console.log("result : ", result);
                  //  return result
  
                  let responseBody;
  
                  responseBody = {
                    message: "Successfully sent fi Data",
                    error: false,
                    statusCode: 200,
                    data: result.message,
                  };
                  return responseBody;
                }
              
      
              } catch (error) {
                console.error(`An error occurred while post calll to webhook url : 1693  ${JSON.stringify(error)}`);
                let errorBody = {
                  message: errorResponses[400].message,
                  error: errorResponses[400].error,
                  errorMessage: error.message,
                  statusCode: errorResponses[400].statusCode,
                };
  
                  // Check if error.response exists for Axios-specific error details
                if (error.response) {
                  console.error(`HTTP Status: ${error.response.status}`);
                  console.error(`Response data: ${JSON.stringify(error.response.data)}`);
                }
                throw errorBody;
              }
            }
  
          } catch (error) {
            console.error("Error calling API : 1509", error);
            // comparison_status = 'FAILED';
            let errorBody = {
              message: errorResponses[500].message,
              error: errorResponses[500].error,
              errorMessage: error.message,
              statusCode: errorResponses[500].statusCode,
            };
            // comparison_status = 'FAILED';
            throw errorBody;
          }
        }
      }

        // -------- Webhook url call ---------

        // try {
        //   const getWebhookURL = await SequelizeDao.findOnee('REALM_CONFIG', { realm: realm });
        //   const weburl = getWebhookURL.dataValues.webhook_url;
        //   const body = {
        //     data: consolidatedJson,
        //     status: comparison_status
        //   }
        //   const header = {}
        //   const result = await axios.post(weburl, body, header);
        //   console.log("result : ", result);

        // } catch (error) {
        //   console.error(`An error occurred while post calll to webhook url : 1693  ${JSON.stringify(error)}`);
        //   let errorBody = {
        //     message: errorResponses[400].message,
        //     error: errorResponses[400].error,
        //     errorMessage: error.message,
        //     statusCode: errorResponses[400].statusCode,
        //   };
        //   throw errorBody;
        // }
        // ----------------------------------


      // ------------------------------------------------------
    //  ------------------------END OF IF CONDITION ------------------------------------

    // }

    let responseBody;

    if (result.error) {
      responseBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: result.error.message,
        statusCode: errorResponses[400].statusCode,
      };
    } else {
      responseBody = {
        message: "Success in sending consent notification",
        error: false,
        statusCode: 200,
        data: result.data,
      };
    }

    return responseBody;
  } catch (error) {
    console.error(`Error in FI Notification: ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

/*
 * @author: gokul
 * @description: This is a webhook which will be invoked by FIU module when it receives the consent information.
 * @param: {} req body should have consent details as per Rebit API standard.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */
exports.postConsentInformation = async function (consentDetailBody, auth) {
  var deferred = Q.defer();
  let responseBody;
  let errorBody;
  try {
    const params = {
      SecretId: process.env.FIUARN
    };
    const getSecret = await getSecretKey(params);
    console.log('getSecret', getSecret);
    console.log('AUTH', auth);
    const authHeaderValue = auth.split(" ")
    const Buffer = require('buffer').Buffer;
    const decodedString = Buffer.from(authHeaderValue[1], 'base64').toString('utf-8');
    console.log(decodedString);
    const authString = decodedString.split(':');
    if (authString[0] === getSecret.CLIENTID && authString[1] === getSecret.CLIENTSECERT) {
      let consentHandleDetail = await SequelizeDao.getAllData('CONSENT_HANDLE', { consentId: consentDetailBody.consentId })
        .then(function (result) {
          console.log(`Wrapper function result: ${result}`);
          return result;
        })
        .catch(function (error) {
          console.error(`Error in wrapper function: ${error}`);
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
        });
      console.log(`consent: ${JSON.stringify(consentDetailBody)}`);
      let str = consentDetailBody.signedConsent;
      let arr = str.split('.');
      let digitalSignature = arr[2];
      console.log('consentDetailBody.signedConsent', consentDetailBody.signedConsent);
      if (!consentDetailBody.signedConsent || consentDetailBody.signedConsent == '') {
        const error = new Error('Bad Request')
        const errorBody = {
          message: errorResponses[400].message,
          error: errorResponses[400].error,
          errorMessage: error.message,
          statusCode: errorResponses[400].statusCode,
        }
        return errorBody;
      }
      const consentArtifact = jwt.decode(consentDetailBody.signedConsent);
      console.log("decoded data:", consentArtifact);
      let linkedAccounts = consentArtifact.Accounts
      let consentBody = {
        ...consentDetailBody,
        consentHandle: consentHandleDetail[0].consentHandle,
        digitalSignature: digitalSignature,
        accounts: linkedAccounts
      }
      try {
        await SequelizeDao.updateData({ digitalSignature: digitalSignature }, "CONSENT_REQUEST_DETAIL", { consentHandle: consentHandleDetail[0].consentHandle });
      } catch (error) {
        console.error(`Error inserting consent request detail: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[400].message,
          error: errorResponses[400].error,
          errorMessage: error.message,
          statusCode: errorResponses[400].statusCode,
        };
        throw errorBody;
      }
      try {
        await SequelizeDao.updateData({ digital_signature: digitalSignature }, "CONSENT_REQUEST_REPLICA", { consent_handle: consentHandleDetail[0].consentHandle });
      } catch (error) {
        console.error(`Error updating consent replica: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[400].message,
          error: errorResponses[400].error,
          errorMessage: error.message,
          statusCode: errorResponses[400].statusCode,
        };
        throw errorBody;
      }
      await SequelizeDao.updateData(consentBody, "CONSENT", { consentHandle: consentHandleDetail[0].consentHandle });
      responseBody = {
        message: "Success",
        error: false,
        statusCode: 200,
      };
      deferred.resolve(responseBody);

    }
  } catch (error) {
    console.error(`Error inserting consent: ${error}`);
    // throw new Error("An error occurred while inserting consent");
    errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    deferred.reject(errorBody);
  }
  return deferred.promise;
};

/*
 * @author: gokul
 * @description: This is a webhook which will be invoked by FIU module when it receives the financial information.
 * @param: {} req body should have consent details as per Rebit API standard.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */
exports.postFIdata = async function (sessionId, FIBody) {
  var deferred = Q.defer();
  let responseBody;
  let errorBody;
  try {
    console.log(`Financial info: ${JSON.stringify(FIBody)}`);
    // let sessionId = FIBody.sessionId;
    // let id = uuid();
    let consentId;
    let fiRequestId; //FIRequest_id
    let realm;
    let group;

    let requestData = await SequelizeDao.getAllData("FI_REQUEST", { sessionId: sessionId });
    console.log('requestData', requestData);
    if (requestData.length == 0) {
      const error = new Error('No Data Found')
      const errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      }
      return errorBody;
    }
    consentId = requestData[0].consentId;
    fiRequestId = requestData[0].FIRequest_id;
    realm = requestData[0].realm;
    group = requestData[0].group;

    let fiInformationBody = {
      ...FIBody,
      id: uuid(),
      sessionId: sessionId,
      consentId: consentId,
      FIRequest_id: fiRequestId,
      realm: realm,
      group: group
    }

    await SequelizeDao.insertData(fiInformationBody, "FINANCIAL_INFORMATION");
    responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
    };
    deferred.resolve(responseBody);
  } catch (error) {
    console.error(`Error inserting financial information: ${error}`);
    // throw new Error("An error occurred while inserting consent");
    errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    deferred.reject(errorBody);
  }
  return deferred.promise;
};

/*
 * @author: adarsh
 * @description: GET consent by consentId .
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.getConsentInfoByConsentId = async function (consentId, group,realm) {
  try {
    const cacheKey = "consent_" + consentId;
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }

    let DataConsumer = await SequelizeDao.getAllData('DATA_CONSUMER', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    let realmData = await SequelizeDao.getAllData('REALM_CONFIG', { realm: realm })
      .then(function (result) {
        console.log(`Wrapper function result:${JSON.stringify(result)}`);
        return result;
      })
      .catch(function (error) {
        console.error(`Error in wrapper function:${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
        // throw err;
      });

      console.log("realmConfigData----------->",realmData)

      const FIU_BASE_URL = realmData[0].fiuBaseURL

      console.log("FIU_BASE_URL----------->",FIU_BASE_URL)

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const headers = {
      Authorization: 'Basic ' + process.env.FIU_PASS,
      "fiu-client-id": DataConsumer[0].id
    };

    let now = new Date();
    let timestamp = now.toISOString();

    // const result = await axios.get(process.env.FIU_BASE_URL + 'consent/information/' + consentId, { httpsAgent: agent });
    const result = await axios.post(FIU_BASE_URL + 'consent/information/', {
      "ver": "2.0.0",
      "timestamp": timestamp,
      "txnid": uuid(),
      "consentId": consentId
    }, { httpsAgent: agent, headers: headers })

    const AAresponseData = result.data;
    console.log("responseeee", AAresponseData);

    if (!AAresponseData) {
      const error = new Error("No consent information found")
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      throw errorBody;
      // throw { statusCode: 404, message: "No consent information found" };
    }

    let str = AAresponseData.signedConsent;
    let arr = str.split('.');
    let digitalSignature = arr[2];
    const consentArtifact = jwt.decode(AAresponseData.signedConsent);
    console.log("decoded data:", consentArtifact);

    let linkedAccounts = consentArtifact.Accounts

    let consentBody = {
      ver: AAresponseData.ver,
      txnid: AAresponseData.txnid,
      consentId: consentId,
      consentStatus: AAresponseData.status,
      timestamp: AAresponseData.createTimestamp,
      signedConsent: AAresponseData.signedConsent,
      consentUse: AAresponseData.ConsentUse,
      digitalSignature: digitalSignature,
      accounts: linkedAccounts
    }

    let consentRequestDetail = {
      digitalSignature: digitalSignature,
      consentId: consentId
    }

    let consentCondition = {
      consentId: consentId,
      group: group
    };

    try {
      await SequelizeDao.updateData(consentBody, "CONSENT", consentCondition);
    } catch (error) {
      console.error("Error updating consent:", error);
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }

    try {
      await SequelizeDao.updateData(consentRequestDetail, "CONSENT_REQUEST_DETAIL", consentCondition);
    } catch (error) {
      console.error("Error updating consent request detail:", error);
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }

    try {
      await SequelizeDao.updateData(consentRequestDetail, "CONSENT_REQUEST_REPLICA", consentCondition);
    } catch (error) {
      console.error("Error updating consent request detail:", error);
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }

    console.log(consentBody);

    const responseBody = {
      message: "success in getting financial info",
      error: false,
      statusCode: 200,
      data: AAresponseData
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.log(error);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

/*
 * @author: adarsh
 * @description: GET consents by filters .
 * @param: {} req.param will contain filters.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.getFiRequestsByFilters = async function (filters, group, realm) {
  try {
    console.log("Inside filter service");

    const cacheKey = JSON.stringify(`fi-request_${group}`);  //+ filters
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }

    let page = 1;
    let pageSize = process.env.DEFAULT_PAGE_SIZE;

    if (filters.page) {
      page = filters.page;
      delete filters.page;

      let offset = (page - 1) * pageSize;
      // let from = (page - 1) * pageSize;
      // let to = (page * pageSize) - 1;

      const result = await SequelizeDao.getPaginatedFIrequest(filters, pageSize, offset);
      // const countResult = await SequelizeDao.getCount('FI_REQUEST');

      // result['totalCount'] = result.count;

      let responseBody;

      if (result.error) {
        if (result.error.statusCode == 401) {
          responseBody = {
            message: errorResponses[401].message,
            error: errorResponses[401].error,
            errorMessage: result.error.message,
            statusCode: errorResponses[401].statusCode,
          };
        } else if (result.error.statusCode == 404) {
          responseBody = {
            message: errorResponses[404].message,
            error: errorResponses[404].error,
            errorMessage: result.error.message,
            statusCode: errorResponses[404].statusCode,
          };
        }
        return responseBody;
      } else {
        responseBody = {
          message: 'success',
          error: false,
          statusCode: 200,
          result: {
            data: result,
            totalCount: result.count
          }
        };
        await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
        return responseBody;
      }
    } else {
      const result = await SequelizeDao.getFiRequestsByFilters(filters, group, realm);
      console.log("getFiRequestsByFilters response:", result);
      let responseBody;

      if (result.error) {
        if (result.error.statusCode == 401) {
          responseBody = {
            message: errorResponses[401].message,
            error: errorResponses[401].error,
            errorMessage: result.error.message,
            statusCode: errorResponses[401].statusCode,
          };
        } else if (result.error.statusCode == 404) {
          responseBody = {
            message: errorResponses[404].message,
            error: errorResponses[404].error,
            errorMessage: result.error.message,
            statusCode: errorResponses[404].statusCode,
          };
        }
        return responseBody;
      } else {
        responseBody = {
          message: 'success',
          error: false,
          statusCode: 200,
          result: {
            data: result
          }
        };
        await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
        return responseBody;
      }
    }
  } catch (error) {
    console.log(error);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};


/*
 * @author: adarsh
 * @description: GET consents by filters .
 * @param: {} req.param will contain filters.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */
exports.getConsentsByFilters = async function (filters, group,realm) {
  try {
    const cacheKey = JSON.stringify(`consents_${group}`);  //+ filters

    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }

    let page = 1;
    let pageSize = process.env.DEFAULT_PAGE_SIZE;

    if (filters.page) {
      page = filters.page;
      delete filters.page;

      let offset = (page - 1) * pageSize;
      // let from = (page - 1) * pageSize;
      // let to = page * pageSize - 1;

      // const result = await FIUDao.getPaginatedConsents(filters, from, to);

      const result = await SequelizeDao.getPaginatedConsents(filters, pageSize, offset);

      // await FIUDao.getCount('consent_request_detail').then(function (countResult) {
      // result['totalCount'] = countResult.count;
      // }).catch(function (err) {
      //   console.log(err);
      //   throw err;
      // });

      let responseBody;

      if (result.error) {
        if (result.error.statusCode == 401) {
          responseBody = {
            message: errorResponses[401].message,
            error: errorResponses[401].error,
            errorMessage: result.error.message,
            statusCode: errorResponses[401].statusCode,
          };
        } else if (result.error.statusCode == 404) {
          responseBody = {
            message: errorResponses[404].message,
            error: errorResponses[404].error,
            errorMessage: result.error.message,
            statusCode: errorResponses[404].statusCode,
          };
        }
        throw responseBody;
      } else {
        responseBody = {
          message: 'success',
          error: false,
          statusCode: 200,
          result: {
            data: result,
            totalCount: result.count
          }
        };
        await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
        return responseBody;
      }
    } else {
      console.log("filters:", filters);
      const result = await SequelizeDao.getConsentsByFilters(filters, group,realm);

      await SequelizeDao.getCount('CONSENT_REQUEST_REPLICA', { group: group , realm: realm}).then(function (countResult) {
        result['totalCount'] = countResult.count;
      }).catch(function (error) {
        console.error(`CONSENT_REQUEST_DETAIL get count error ${error}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      });

      let responseBody;

      if (result.error) {
        if (result.error.statusCode == 401) {
          responseBody = {
            message: errorResponses[401].message,
            error: errorResponses[401].error,
            errorMessage: result.error.message,
            statusCode: errorResponses[401].statusCode,
          };
        } else if (result.error.statusCode == 404) {
          responseBody = {
            message: errorResponses[404].message,
            error: errorResponses[404].error,
            errorMessage: result.error.message,
            statusCode: errorResponses[404].statusCode,
          };
        }
        throw responseBody;
      } else {
        responseBody = {
          message: 'success',
          error: false,
          statusCode: 200,
          result: {
            data: result,
            totalCount: result.totalCount
          }
        };
        await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
        return responseBody;
      }
    }
  } catch (error) {
    console.error(`Error in getConsentsByFilters: ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

exports.getConsentsCount = async function (group,realm) {
  try {
    const cacheKey = `consents/count_${group}`;
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }
    let statusCount = {};
    let condition;
    if (group == 'admin') {
      condition = {realm:realm};
    } else {
      condition = {
        group: group,
        realm:realm
      };
    }
    await SequelizeDao.getAllDataWithCounts(condition).then(function (result) {
      for (let i = 0; i < result.length; i++) {
        console.log("Count result:", result);
        result[i].status_count = parseInt(result[i].status_count)
        statusCount['statusDetail'] = result;
      }
    }).catch(function (error) {
      console.error(`CONSENT_REQUEST_DETAIL get statusDetail error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
    await SequelizeDao.getCount('CONSENT_REQUEST_REPLICA', condition).then(function (countResult) {
      statusCount['totalCount'] = countResult;
    }).catch(function (error) {
      console.error(`CONSENT_REQUEST_DETAIL get count error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
    console.log("new api response:", statusCount);
    let responseBody = {
      message: 'success in getting financial info',
      error: false,
      statusCode: 200,
      data: statusCount,
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
    return responseBody;
    // await SequelizeDao.getCount('CONSENT_REQUEST_DETAIL').then(function (countResult) {
    //   result['totalCount'] = countResult.count;
  } catch (error) {
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}

exports.getRequestCount = async function (group,realm) {
  try {
    const cacheKey = `fi/requests/count_${group}`;
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }
    let statusCount = {};
    let condition;
    if (group == 'admin') {
      condition = {realm:realm};
    } else {
      condition = {
        group: group,
        realm:realm
      };
    }
    await SequelizeDao.getAllDataWithFI_RequestCounts(condition).then(function (result) {
      for (let i = 0; i < result.length; i++) {
        console.log("Count result:", result);
        result[i].status_count = parseInt(result[i].status_count)
        statusCount['statusDetail'] = result;
      }
      // console.log("Count result:", result);
      // statusCount['statusDetail'] = result;
    }).catch(function (error) {
      console.error(`FI_REQUEST get statusDetail error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
    await SequelizeDao.getCount('FI_REQUEST', condition).then(function (countResult) {
      statusCount['totalCount'] = countResult;
    }).catch(function (error) {
      console.error(`FI_REQUEST get count error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
    console.log("new api response:", statusCount);
    let responseBody = {
      message: 'success in getting financial info',
      error: false,
      statusCode: 200,
      data: statusCount,
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
    return responseBody;
  } catch (error) {
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}

/*
 * @author: adarsh
 * @description: GET consents by consent ID .
 * @param: {} req.param will nothing.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.getConsentsByConsentRequestId = async function (consent_request_id, realm) {
  try {
    const cacheKey = "consents_" + consent_request_id;
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      console.log("fetching cache");
      const parsedData = JSON.parse(reply);
      return parsedData;
    }

    var consentRequestDetail = await SequelizeDao.getAllData("CONSENT_REQUEST_DETAIL", { consent_request_id: consent_request_id, realm: realm });
    console.log("consentRequestDetail:", consentRequestDetail[0].dataValues);
    var consentDetail = await SequelizeDao.getAllData("CONSENT", { consentHandle: consentRequestDetail[0].consentHandle, realm: realm });
    console.log("consentDetail:", consentDetail[0].accounts);
    if (consentDetail[0].accounts && consentDetail[0].accounts.length) {
      consentRequestDetail[0].dataValues.accounts = consentDetail[0].accounts;
    }
    console.log("responseDetail:", consentRequestDetail);

    if (!consentRequestDetail || consentRequestDetail.length === 0) {
      // Handle the "consentRequestId not found" error
      const error = new Error("Consent Request ID not found")
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      return errorBody;
    }
    const getconsentDetail = await SequelizeDao.getAllData("CONSENT", { consentHandle: consentRequestDetail[0].consentHandle, realm: realm });

    if (getconsentDetail[0].accounts && getconsentDetail[0].accounts.length) {
      consentRequestDetail[0].dataValues.accounts = getconsentDetail[0].accounts;
    }


    if (consentRequestDetail.error) {
      const { statusCode, message, errorMessage, error } = consentRequestDetail.error;
      return {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
    }

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: consentRequestDetail,
      },
    };
    return responseBody;
  } catch (error) {
    console.error(`Error in getConsentsByConsentRequestId ${error}`);
    let errorBody;
    errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };

    throw errorBody;
  }
}

/*
  * @author: adarsh
  * @description: XMl converter.
  * @param: {} req.param will nothing.
  * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
  */

exports.xmlConverter = async function (sessionId,realm) {
  var deferred = Q.defer();
  try {

    // eslint-disable-next-line no-undef
    let DataConsumer = await SequelizeDao.getAllData('DATA_CONSUMER', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    let realmData = await SequelizeDao.getAllData('REALM_CONFIG', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    console.log("realmConfigData----------->",realmData)

    const FIU_BASE_URL = realmData[0].fiuBaseURL

    console.log("FIU_BASE_URL----------->",FIU_BASE_URL)

    const headers = {
      Authorization: 'Basic ' + process.env.FIU_PASS,
      "fiu-client-id": DataConsumer[0].id
    };

    let response = await axios.get(FIU_BASE_URL + 'crypto/decrypt/' + sessionId, { httpsAgent: agent, headers: headers });
    console.log(response.data);
    // let AAresponseData = response.data;
    let decryptedFI = response.data;

    let json = xmlJs.xml2json(decryptedFI, { compact: true, spaces: 4 });

    // Extract the records from the parsed JSON
    let records = JSON.parse(json);
    console.log(`Records ${records}`);

    let csvData = await csvConveter.json2csv(records);
    console.log(`dataaa ${csvData}`);

    // Convert CSV data to JSON
    // let jsonData = await csvConveter.csv2jsonAsync(csvData, { delimiter: ',' });

    // fs.writeFileSync("./output.csv", csvData);

    // res.setHeader('Content-Type', 'text/csv');
    // res.setHeader('Content-Disposition', 'attachment; filename=financial_info.csv');

    // Send the CSV file as response
    // let fileStream = fs.createReadStream('./output.csv');
    // fileStream.pipe(res);

    let responseBody;
    responseBody = {
      message: 'success',
      error: false,
      statusCode: 200,
      result: {
        data: csvData
      }
    }

    deferred.resolve(responseBody);

  } catch (error) {
    console.error(`Error in xmlConverter: ${error}`);

    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    deferred.reject(errorBody);
  }
  return deferred.promise;

};

/*
  * @author: abhishek
  * @description: XMl converter.
  * @param: {} req.param will nothing.
  * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
  */
exports.xmlConverterToPdf = async function (sessionId,realm,body) {
  var deferred = Q.defer();
  try {

    let DataConsumer = await SequelizeDao.getAllData('DATA_CONSUMER', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    let realmData = await SequelizeDao.getAllData('REALM_CONFIG', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    console.log("realmConfigData----------->",realmData)

    const FIU_BASE_URL = realmData[0].fiuBaseURL

    console.log("FIU_BASE_URL----------->",FIU_BASE_URL)

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const headers = {
      Authorization: 'Basic ' + process.env.FIU_PASS,
      "fiu-client-id": DataConsumer[0].id
    };
    let consolidatedJson
    if(body.fetchType === "onetime") {
      const findFIData = await SequelizeDao.findOnee("FI_DATA", {sessionId:sessionId})
      console.log("data.dataValues--->",findFIData)
      if(findFIData && findFIData.dataValues) {
        const getData = await decryptData(findFIData.dataValues.fi_data.encryptedData,findFIData.dataValues.fi_data.encryptedDek,findFIData.dataValues.fi_data.iv)
        console.log("getData--->",getData)
        consolidatedJson = getData
      }else {

      let response = await axios.get(FIU_BASE_URL + 'crypto/decrypt/' + sessionId, { httpsAgent: agent, headers: headers });
      console.log("received xml data:", response.data.FI);
      // let fiData = response.data.FI;
      // const parser = new xml2js.Parser({});
      consolidatedJson = await getConsolidatedFIdata(response.data.FI);//{ fiData: [] };
      let now = new Date();
      let timestamp = now.toISOString();
      const findData = await SequelizeDao.findOnee("FI_DATA", {sessionId:sessionId})
      console.log("consolidatedJson before if",consolidatedJson)
      if(findData == null) {
        console.log("consolidatedJson.fiData",consolidatedJson.fiData.length)
        // const encryptedData = await encryptData(consolidatedJson)
        console.log("findData--->",findData)

        // const secretKey = 'mySecretKey';
        const secretParams = {
          SecretId: process.env.KMSsecretARN
        };
        const getSecretData = await getSecretKey(secretParams);
        const keyId = getSecretData[realm]
        const encryptedData = await encryptData(consolidatedJson,keyId);

        const consentData = await SequelizeDao.findOnee("CONSENT_REQUEST_REPLICA", {session_id:sessionId})
        const consent = consentData.dataValues
        console.log("consentData-->",consentData)

        console.log("encryptedData-->",encryptedData)
        const body = {
          id:uuid(),
          sessionId: sessionId,
          fi_data: encryptedData,
          timestamp: timestamp,
          ver:response.data.ver,
          consent_id: consent.consent_id,
          realm:consent.realm,
          group:consent.group
        }
        console.log("body-->",body)
        const data = await SequelizeDao.insertData(body,"FI_DATA")
        console.log("data---->",data)
        
        if(data) {
          try {
            const createScheduleBody = {
              "queueName": body.id,
              "scheduleTime": consent.consent_expiry,
              "sessionId": sessionId,
              "consent_id": consent.consent_id
            }
            console.log("reqBodyofScheduleCreate------>", createScheduleBody)
            // Sending POST request to scheduler API
            const response = await axios.post(process.env.SCHEDULER_BASE_URL + 'schedulers', createScheduleBody);
            console.log("create scheduler successfully:", response);
            console.log("process.env.SCHEDULER_BASE_URL+`schedulers/${body.queueName}/jobs", process.env.SCHEDULER_BASE_URL + `schedulers/${body.queueName}/jobs`)
            console.log("process.env.FI_DATA_NOTIFICATION_WEBHOOK_URL",process.env.FI_DATA_NOTIFICATION_WEBHOOK_URL)
            try {
              // const currentDate = new Date();
              // currentDate.setMinutes(currentDate.getMinutes() + 1); // Add 1 minute
              // const formattedDate = currentDate.toISOString();
              // console.log(formattedDate);
              let reqBody = {
                    "jobName": "fiRequest Notification",
                    "jobData": {
                        "url": process.env.FI_DATA_NOTIFICATION_WEBHOOK_URL,
                        "method": "POST",
                        "data": {
                            "queuename":createScheduleBody.queueName,
                            "sessionId": createScheduleBody.sessionId
                        }
                    },
                    "scheduleTime":createScheduleBody.scheduleTime     
                }
                //createScheduleBody.scheduleTime
              console.log("reqBodyOfJobCreate------>",reqBody)
              // Sending POST request to scheduler API
              const response = await axios.post(process.env.SCHEDULER_BASE_URL + `schedulers/${createScheduleBody.queueName}/jobs`, reqBody);
              console.log("create scheduler successfully:", response.data);

            } catch (error) {
              console.error("Error while creating scheduler", error.response);
              throw new Error("Failed to create scheduler");
            }
        } catch (error) {
          console.error("Error while creating scheduler", error.response);
          throw new Error("Failed to create scheduler");
        }
        }

      }else {
        const findFIData = await SequelizeDao.findOnee("FI_DATA", {sessionId:sessionId})
        console.log("data.dataValues--->",findFIData.dataValues)
        if(findFIData.dataValues) {
          const getData = await decryptData(findFIData.dataValues.fi_data.encryptedData,findFIData.dataValues.fi_data.encryptedDek,findFIData.dataValues.fi_data.iv)
          console.log("getData--->",getData)
          consolidatedJson = getData
        }
      }
      }
    }else {
      if(body.fetchType === "periodic") {
      if(body.dataType=="new") {
      let response = await axios.get(FIU_BASE_URL + 'crypto/decrypt/' + sessionId, { httpsAgent: agent, headers: headers });
      console.log("received xml data:", response.data.FI);
      // let fiData = response.data.FI;
      // const parser = new xml2js.Parser({});
      consolidatedJson = await getConsolidatedFIdata(response.data.FI);//{ fiData: [] };
      const findData = await SequelizeDao.findOnee("FI_DATA", {sessionId:sessionId})
      console.log("consolidatedJson before if",consolidatedJson)
      if(findData == null) {
        console.log("consolidatedJson.fiData",consolidatedJson.fiData.length)
        // const encryptedData = await encryptData(consolidatedJson)
        console.log("findData--->",findData)

        // const secretKey = 'mySecretKey';
        const secretParams = {
          SecretId: process.env.KMSsecretARN
        };
        const getSecretData = await getSecretKey(secretParams);
        const keyId = getSecretData[realm]
        const encryptedData = await encryptData(consolidatedJson,keyId);

        const consentData = await SequelizeDao.findOnee("CONSENT_REQUEST_REPLICA", {session_id:sessionId})
        const consent = consentData.dataValues
        console.log("consentData-->",consentData)
        
        let now = new Date();
        let timestamp = now.toISOString();
        console.log("encryptedData-->",encryptedData)
        const body = {
          id:uuid(),
          sessionId: sessionId,
          fi_data: encryptedData,
          timestamp: timestamp,
          ver:response.data.ver,
          consent_id: consent.consent_id,
          realm:consent.realm,
          group:consent.group
        }
        console.log("body-->",body)
        const data = await SequelizeDao.insertData(body,"FI_DATA")
        console.log("data---->",data)
        
        if(data) {
          try {
            const createScheduleBody = {
              "queueName": body.id,
              "scheduleTime": consent.consent_expiry,
              "sessionId": sessionId,
              "consent_id": consent.consent_id
            }
            console.log("reqBodyofScheduleCreate------>", createScheduleBody)
            // Sending POST request to scheduler API
            const response = await axios.post(process.env.SCHEDULER_BASE_URL + 'schedulers', createScheduleBody);
            console.log("create scheduler successfully:", response);
            console.log("process.env.SCHEDULER_BASE_URL+`schedulers/${body.queueName}/jobs", process.env.SCHEDULER_BASE_URL + `schedulers/${body.queueName}/jobs`)
            console.log("process.env.FI_DATA_NOTIFICATION_WEBHOOK_URL",process.env.FI_DATA_NOTIFICATION_WEBHOOK_URL)
            try {
              let reqBody = {
                    "jobName": "fiRequest Notification",
                    "jobData": {
                        "url": process.env.FI_DATA_NOTIFICATION_WEBHOOK_URL,
                        "method": "POST",
                        "data": {
                            "queuename":createScheduleBody.queueName,
                            "sessionId": createScheduleBody.sessionId
                        }
                    },
                    "scheduleTime":createScheduleBody.scheduleTime
                }
              
              console.log("reqBodyOfJobCreate------>",reqBody)
              // Sending POST request to scheduler API
              const response = await axios.post(process.env.SCHEDULER_BASE_URL + `schedulers/${createScheduleBody.queueName}/jobs`, reqBody);
              console.log("create scheduler successfully:", response.data);

            } catch (error) {
              console.error("Error while creating scheduler", error.response);
              throw new Error("Failed to create scheduler");
            }
        } catch (error) {
          console.error("Error while creating scheduler", error.response);
          throw new Error("Failed to create scheduler");
        }
        }
      }
      }
      if(body.dataType=="old") {
        const findFIData = await SequelizeDao.findOnee("FI_DATA", {sessionId:sessionId})
        console.log("data.dataValues--->",findFIData.dataValues)
        if(findFIData.dataValues) {
          const getData = await decryptData(findFIData.dataValues.fi_data.encryptedData,findFIData.dataValues.fi_data.encryptedDek,findFIData.dataValues.fi_data.iv)
          console.log("getData--->",getData)
          consolidatedJson = getData
        }else {
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: "Data not found",
            statusCode: errorResponses[400].statusCode,
          };
          throw errorBody;
        }
      }
      }
    }
    // for (let index = 0; index < fiData.length; index++) {
    //   for (let j = 0; j < fiData[index].data.length; j++) {
    //     let decryptedFI = fiData[index].data[j].decryptedFI;



    //     parser.parseString(decryptedFI, function (err, result) {

    //       const flattenedData = flattenAttributes(result);
    //       const jsonData = JSON.stringify(flattenedData);
    //       console.log("converted json results", jsonData);
    //       consolidatedJson.fiData.push(jsonData)
    //       // json = jsonData;
    //     });
    //   }

    // }
    // let decryptedFI = response.data;
    // let json;

    // let json = xmlJs.xml2json(decryptedFI, { compact: true, spaces: 4 });

    // console.log("XML to JSON data:", json);

    // Extract the records from the parsed JSON
    // let records = JSON.parse(json);
    // console.log(`Records ${json}`);

    // const parser = new xml2js.Parser({});

    // parser.parseString(decryptedFI, function (err, result) {

    //   const flattenedData = flattenAttributes(result);
    //   const jsonData = JSON.stringify(flattenedData);
    //   console.log("converted json results", jsonData);
    //   json = jsonData;
    // });

    const pdfReport = await client.render({
      template: {
        name: 'deposit-report'
      },
      data: consolidatedJson
    });

    const bodyBuffer = await pdfReport.body()
    // Set the appropriate response headers for downloading the PDF
    // res.set('Content-Type', 'application/pdf');
    // res.set('Content-Disposition', 'attachment; filename="report.pdf"');


    // console.log("typeof", typeof(bodyBuffer));
    // fs.writeFileSync('report.pdf', bodyBuffer);

    let responseBody;
    responseBody = {
      message: 'success',
      error: false,
      statusCode: 200,
      result: {
        data: bodyBuffer,
      }
    }

    deferred.resolve(responseBody);

  } catch (error) {
    console.error(`Error in xmlConverter: ${error}`);
    // throw new Error('An error occurred while generating CSV');
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    deferred.reject(errorBody);
  }
  return deferred.promise;
};

async function encryptData(data,secretKey) {
  try {
    console.log('SecretKey:', secretKey);

    // Generate a random Data Encryption Key (DEK)
    const { Plaintext: dek, CiphertextBlob: encryptedDek } = await kms
      .generateDataKey({
        KeyId: secretKey, // Your key ARN
        KeySpec: 'AES_256',
      })
      .promise();

    // Generate a random IV (12 bytes for GCM)
    const iv = crypto.randomBytes(16);

    // Encrypt the data locally using the DEK
    const cipher = crypto.createCipheriv('aes-256-cbc', dek, iv);
    let encryptedData = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encryptedData += cipher.final('base64');

    // Get the authentication tag from the cipher
    // const authTag = cipher.getAuthTag();

    // Return encrypted data, encrypted DEK, IV, and authentication tag
    return {
      encryptedData: encryptedData,
      encryptedDek: encryptedDek.toString('base64'), // Encrypted DEK
      iv: iv.toString('base64'), // IV used during encryption
    };
  } catch (err) {
    console.error('Error encrypting data:', err);
  }
}

async function decryptData(encryptedData,encryptedDek,iv) {
  try {
    const { Plaintext: dek } = await kms
    .decrypt({
      CiphertextBlob: Buffer.from(encryptedDek, 'base64'),
    })
    .promise();

    // Convert iv and authTag to Buffers
    iv = Buffer.from(iv, 'base64');
    // authTag = Buffer.from(authTag, 'base64');

    // Create a decipher instance using GCM mode
    const decipher = crypto.createDecipheriv('aes-256-cbc', dek, iv);
    // decipher.setAuthTag(authTag);

    let decryptedData = decipher.update(encryptedData, 'base64', 'utf8');
    decryptedData += decipher.final('utf8');

    return JSON.parse(decryptedData);
  } catch (err) {
    console.error('Error decrypting data:', err);
  }
}

async function getConsolidatedFIdata(entireData) {
  let fiData = entireData;
  const parser = new xml2js.Parser({});
  let consolidatedJson = { fiData: [] };
  for (let index = 0; index < fiData.length; index++) {
    for (let j = 0; j < fiData[index].data.length; j++) {
      let decryptedFI = fiData[index].data[j].decryptedFI;



      parser.parseString(decryptedFI, function (err, result) {

        const flattenedData = flattenAttributes(result);
        console.log("flattenedData",flattenedData)
        const jsonData = JSON.stringify(flattenedData);
        console.log("converted json results", jsonData);
        consolidatedJson.fiData.push(flattenedData)
        // json = jsonData;
      });
    }
  }
  console.log("consolidatedJson:", consolidatedJson);
  return consolidatedJson;
}

function flattenAttributes(obj) {
  if (obj && typeof obj === 'object') {
    if (obj.$) {
      Object.assign(obj, obj.$);
      delete obj.$;
    }
    Object.keys(obj).forEach(key => {
      obj[key] = flattenAttributes(obj[key]);
    });
  }
  return obj;
}

/**
 * @author: Gokul
 * @description: POST, generates deposit report.
 * @param: {} req.param will contain json converted from xml.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */
exports.generateDepositReport = async function (reportData) {
  const res = await client.render({
    template: {
      name: 'deposit-report'
    },
    data: reportData
  }).then(async (res) => {
    const bodyBuffer = await res.body();
    console.log(bodyBuffer);
    // fs.writeFileSync(`./reports/${reportData.project_report_id}_report.pdf`, bodyBuffer);
    let responseBody;
    responseBody = {
      message: 'success',
      error: false,
      statusCode: 200,
      result: {
        data: bodyBuffer,
      }
    }
    return responseBody
  })
    .catch((error) => {
      console.log(error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;

    });

  return res;
}


/**
 * @author: Gokul
 * @description: POST logout user.
 * @param: {} req.param will contain nothing.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.logoutUser = async function (body) {
  var deferred = Q.defer();

  // master token was used here;
  let realm_id = body.realm_id;
  let user_id = body.user_id;
  // userDao.getUserInEachRealmByUsername(body.username).then(async function (result) {

  console.log(`Request body: ${body}`);

  // let userData = result.data;

  // for(let i = 0; i < userData.length; i++) {
  let logoutResult = await logoutUserFromRealm(token, realm_id, user_id);

  if (logoutResult?.error) {
    const error = new Error("An error occured while logging out user");
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    deferred.resolve(errorBody);
  }
  // }

  let responseBody = {
    message: 'success',
    error: false,
    errorMessage: 'success',
    statusCode: 200
  }

  deferred.resolve(responseBody);


  // }).catch(function(err) {
  //     console.log(err);
  //     winston.error('Error in logoutUser service', err);
  //     deferred.reject(err);
  // })

  return deferred.promise;
}

async function logoutUserFromRealm(token, realmId, userId) {

  var deferred = Q.defer();


  realmDao.logoutUser(token, realmId, userId).then(function (result) {

    console.log(result, '----');

    if (result?.error) {
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: result.error,
        statusCode: errorResponses[400].statusCode,
      };
      deferred.resolve(errorBody);
    } else if (result?.errorMessage) {
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: result.errorMessage,
        statusCode: errorResponses[400].statusCode,
      };
      deferred.resolve(errorBody);
    } else {
      let responseBody = {
        message: 'success',
        error: false,
        errorMessage: 'success',
        statusCode: 200
      }
      deferred.resolve(responseBody);
    }

  }).catch(function (err) {
    console.error(`Logout Error: ${err}`);
    // winston.error('Error in logoutUser service', err);
    deferred.reject(err);
  })

  return deferred.promise;
}

/*
  * @author: adarsh
  * @description: GET TableDataByValue .
  * @param: {} req.param will nothing.
  * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
  */

exports.getTableDataByValue = function (tableName, columnName, columnValue) {
  return new Promise((resolve) => {


    console.log("Inside getTableDataByValue service");

    FIUDao.getTableDataByValue(tableName, columnName, columnValue)
      .then(function (result) {
        let responseBody;

        if (result.error) {
          let errorBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: result.error.message,
            statusCode: errorResponses[400].statusCode,
          };
          resolve(errorBody);
        } else {
          if (result.data && result.data.length > 0) {
            responseBody = {
              message: "success",
              error: false,
              statusCode: 200,
              result: {
                data: result.data
              }
            };
            resolve(responseBody);
          } else {
            const error = new Error("No Data Found");
            let errorBody = {
              message: errorResponses[404].message,
              error: errorResponses[404].error,
              errorMessage: error.message,
              statusCode: errorResponses[404].statusCode,
            };
            resolve(errorBody);
          }
        }
      })
      .catch(function (error) {
        console.error(`Error in getTableDataByValue service: ${error}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
        // reject(err);
      });
  });
};

/*
  * @author: adarsh
  * @description: GET all aggregators .
  * @param: {} req.param will nothing.
  * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
  */

exports.getAllAggregators = async function (realm) {
  console.log("INSIDE AGGREGATOR SERVICE");
  try {
    const cacheKey = "aggregators"
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    const aggregators = await SequelizeDao.getAllData('AGGREGATOR', { status : 'ACTIVE' }, [['aggregator_id', 'DESC']]);

    const LinkedAggregators = await SequelizeDao.getAllData('FIU_AGGREGATOR', { status : 'ACTIVE', realmName: realm });

    console.log("LinkedAggregators",LinkedAggregators)

    aggregators.forEach((aggregator) => {
      const filter = LinkedAggregators.filter(
        (link) => link.aggregator_id === aggregator.dataValues.aggregator_id
      );
      aggregator.dataValues.link = filter.length > 0; // Add the `link` key to dataValues
    });

    console.log("aggregators----->",aggregators)


    if (aggregators.error) {
      const { statusCode, message, errorMessage, error } = aggregators.error;
      return {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
    }

    console.log("Aggregators", aggregators);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: aggregators,
      },
    };
    // eslint-disable-next-line no-undef
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 1);

    return responseBody;
  } catch (error) {
    console.error(`Error in getAllAggregators ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

exports.getDecryptedFI = async function (sessionId,realm) {
  try {
    const cacheKey = JSON.stringify(sessionId);
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }

    let DataConsumer = await SequelizeDao.getAllData('DATA_CONSUMER', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    let realmData = await SequelizeDao.getAllData('REALM_CONFIG', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    console.log("realmConfigData----------->",realmData)

    const FIU_BASE_URL = realmData[0].fiuBaseURL

    console.log("FIU_BASE_URL----------->",FIU_BASE_URL)

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const headers = {
      Authorization: 'Basic ' + process.env.FIU_PASS,
      "fiu-client-id": DataConsumer[0].id
    };

    let responseBody

    await axios
      .get(FIU_BASE_URL + '/api/v1/crypto/decrypt/' + sessionId, { httpsAgent: agent, headers: headers })
      .then((response) => {
        const AAresponseData = response.data;
        console.log("Fetch details:", AAresponseData);

        responseBody = {
          message: 'success in getting financial info',
          error: false,
          statusCode: 200,
          data: AAresponseData,
        };

      })

      .catch((error) => {
        console.error(`An error occurred while getting financial info: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      });

    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;

  }
};

/*
  * @author: adarsh
  * @description: GET all Purpose codes .
  * @param: {} req.param will nothing.
  * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
  */

exports.getAllPurposeCodes = async function () {
  console.log("INSIDE PURPOSE CODES SERVICE");
  try {
    const cacheKey = "purposeCodes"
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    const purposeCodes = await SequelizeDao.getAllData('PURPOSE_CODE', {});

    if (purposeCodes.error) {
      const { statusCode, message, errorMessage, error } = purposeCodes.error;
      return {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
    }

    console.log("PURPOSE CODES", purposeCodes);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: purposeCodes,
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get all purpose codes ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

/*
  * @author: adarsh
  * @description: GET all consent modes .
  * @param: {} req.param will nothing.
  * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
  */

exports.getAllConsentModes = async function () {
  console.log("INSIDE consent Modes SERVICE");
  try {
    const cacheKey = "consentModes";
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    const consentModes = await SequelizeDao.getAllData('CONSENT_MODE', {});

    if (consentModes.error) {
      const { statusCode, message, errorMessage, error } = consentModes.error;
      return {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
    }

    console.log("CONSENT MODES", consentModes);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: consentModes,
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get all consentModess ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

/*
  * @author: adarsh
  * @description: GET all consent types .
  * @param: {} req.param will nothing.
  * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
  */

exports.getAllConsentTypes = async function () {
  console.log("INSIDE consent types SERVICE");
  try {
    const cacheKey = "consentTypes";
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    const consentTypes = await SequelizeDao.getAllData('CONSENT_TYPE', {});

    if (consentTypes.error) {
      const { statusCode, message, errorMessage, error } = consentTypes.error;
      return {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
    }

    console.log("CONSENT TYPES", consentTypes);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: consentTypes,
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get all consentTypes ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

/*
  * @author: adarsh
  * @description: GET all fi types .
  * @param: {} req.param will nothing.
  * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
  */

exports.getAllFiTypes = async function () {
  console.log("INSIDE fi types SERVICE");
  try {
    const cacheKey = "fiTypes";
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    const fiTypes = await SequelizeDao.getAllData('FI_TYPE', {});

    if (fiTypes.error) {
      const { statusCode, message, errorMessage, error } = fiTypes.error;
      return {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
    }

    console.log("FI TYPES", fiTypes);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: fiTypes,
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get all fiTypes ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

/*
  * @author: adarsh
  * @description: GET all data filters operators .
  * @param: {} req.param will nothing.
  * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
  */

exports.getAllOperators = async function () {
  console.log("INSIDE fi types SERVICE");
  try {

    const cacheKey = "operators"
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    const operators = await SequelizeDao.getAllData('OPERATORS', {});

    if (operators.error) {
      const { statusCode, message, errorMessage, error } = operators.error;
      return {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
    }

    console.log("OPERATORS", operators);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: operators,
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get all operators ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

/*
 * @author: adarsh
 * @description: POST bulk consent.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */


exports.postBulkConsent = async function (consentsArray, group, realm) {  //, redirectURL, sessionid
  try {
    console.log("GROUP :",group);
    
    if (!group || group == null) {
      throw {
        message: "Error posting bulk consent, missing group details",
        error: true,
        statusCode: 500,
      };
    }
    console.log("Inside postBulkConsent service");

    // Define the parameters for fetching the secret value
    const params = {
      // SecretId: process.env.SECRETKEYARN
      SecretId: process.env.AASECRETKEYARN
    };

    const correlationId = uuid();

    const sessionid = uuid();

    const results = [];
    console.log("realm---------->",realm)
    const getRedirectURL = await SequelizeDao.getWebUrl('REALM_CONFIG', { realm });
    let redirectURL = getRedirectURL[0].successRedirectURL;
    console.log("redirectURL-------->",redirectURL)
    let webURL = getRedirectURL[0].web_url + '/fiu/consents';

    console.log("ABOUT TO HIT POST CONSENT")
    for (const consent of consentsArray) {
      consent.correlation_id = correlationId;
      try {
        const result = await FIUService.postConsent(consent, realm, group);
        console.log('result', result);
        let fi = result.data.data_consumer.id
        const AES_ALGO = 'aes-256-cbc';

        let baseUrl = result.data.AABaseUrl;
        let consentHandles = [];
        consentHandles.push(result.data.ConsentHandle);
        const getSecret = await getSecretKey(params);
        console.log("aggregator_id 4497 : ",result.data.aggregator_id);        
        console.log("getSecret 4499: ",getSecret);
        let matchedValue;
        //** 
        // if (result.data.aggregator_id in getSecret) {
        //   matchedValue = getSecret[result.data.aggregator_id];
        // }*/ FOR FIRST LOGIC
        console.log("realm : 4517",realm);
        // **
        // console.log("getSecret[realm] : 4518",getSecret[realm]);
        // const realmData = getSecret[realm];
        // console.log("realmData : 4520",realmData);
        // const specificValue = realmData[result.data.aggregator_id];
        // console.log("specificValue : 4521",specificValue);
        // matchedValue = specificValue;*/ FOR SECOND 
        
        const getAggData = getSecret[result.data.aggregator_id

        ];
        console.log("getAggData 4535 : ",getAggData);
        const parsedData = JSON.parse(getAggData);
        console.log("parsedData : 4536",parsedData);
        const realmData = parsedData[realm];
        console.log("realmData :4537",realmData);
        matchedValue = realmData
        console.log('matchedValuec4541', matchedValue);
        if (matchedValue !== '' && matchedValue !== undefined) {
          console.log("matchedValue : 4506",matchedValue);
          
          const secretKey = matchedValue;

          // date conversion
          const formattedUTCDate = await convertToUTC(result.data.timestamp);

          const salt = formattedUTCDate;
          const payload = `txnid=${result.data.txnid}&sessionid=${sessionid}&srcref=${consentHandles}&userid=${result.data.Customer.id}&redirect=${redirectURL}`;

          const encData = await encrypt(payload, salt, secretKey, AES_ALGO);
          let xoredFI;
          if (encData) {
            // console.log('Encrypted & encoded data:', encData);
            // console.log('Decrypted data (to verify):', await decrypt(encData, salt, secretKey, AES_ALGO));

            xoredFI = await encryptValueToXor(fi, salt);
            // console.log('Xored FI:', xoredFI);
            // console.log('Xored FI (reversed):', await decryptXoredValue(xoredFI, salt));
          }

          const finalUrl = `${baseUrl}?ecreq=${encData}&reqdate=${formattedUTCDate}&fi=${xoredFI}`;

          result.data.AARedirectURL = finalUrl;
          result.data.successRedirectURL = redirectURL;
        } else {
          result.data.successRedirectURL = webURL;
        }

        results.push(result);


      } catch (error) {
        console.error(`An error occurred while posting consent: ${JSON.stringify(error)}`);
        results.push({
          message: `Error in posting consent`,
          error: true,
          errorMessage: error.message,
        });
      }
    }
    await redisClient.del(`consents_${group}`)
    if (results.some((result) => result.error)) {
      throw {
        message: "Error posting bulk consent",
        error: true,
        statusCode: 500,
      };
    } else {
      const responseBody = {
        message: "Bulk consent posting completed",
        error: false,
        statusCode: 200,
        data: results,
      };

      let consentHandle = results[0].data.ConsentHandle
      console.log(">>>>>", results[0].data.ConsentHandle)

      let correlationBody = {
        correlation_id: correlationId
      }

      let corr_condition = {
        consentHandle: consentHandle
      }
      console.log(">>>>>!", corr_condition)
      console.log(">>>>>#", correlationBody)




      await SequelizeDao.updateData(correlationBody, "CONSENT_REQUEST_DETAIL", corr_condition);
      // console.error(`Error adding product: ${JSON.stringify(error)}`);

      // await SequelizeDao.updateData(correlationBody, "CONSENT_REQUEST_REPLICA");
      // // console.error(`Error adding product: ${JSON.stringify(error)}`);

      await SequelizeDao.updateData(correlationBody, "CONSENT_REQUEST", corr_condition);
      // console.error(`Error adding product: ${JSON.stringify(error)}`);


      return responseBody;
    }
  } catch (error) {
    console.error(`An error occurred in the postBulkConsent function: ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

async function getSecretKey(params) {
  var deferred = Q.defer();
  // Create an instance of the Secrets Manager service
  const secretsManager = new AWS.SecretsManager();
  let secretValue;
  // Fetch the secret value from Secrets Manager
  secretsManager.getSecretValue(params, function (err, data) {
    // let secretValue;
    if (err) {
      console.log("Error fetching secret:", err);
    } else {
      if ('SecretString' in data) {
        secretValue = data.SecretString;
        // console.log("Secret value:", secretValue);
        deferred.resolve(JSON.parse(secretValue));

        // Process the secret value as needed
      } else {
        // const binarySecretData = data.SecretBinary;
        // console.log("Binary secret data:", binarySecretData);
        // Process the binary secret data as needed
      }
    }
  });

  return deferred.promise;
}

async function convertToUTC(reqdate) {
  const dateObj = new Date(reqdate);

  const dd = String(dateObj.getUTCDate()).padStart(2, '0');
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getUTCFullYear();
  const hh = String(dateObj.getUTCHours()).padStart(2, '0');
  const min = String(dateObj.getUTCMinutes()).padStart(2, '0');
  // eslint-disable-next-line no-unused-vars
  const ss = String(dateObj.getUTCSeconds()).padStart(2, '0');
  const ms = String(dateObj.getUTCMilliseconds()).padStart(3, '0');

  const formattedDate = `${dd}${mm}${yyyy}${hh}${min}${ms}`;

  return formattedDate;
}

//AES256 encryption
async function encrypt(strToEncrypt, salt, secretKey, AES_ALGO) {
  const iv = Buffer.alloc(16, 0); // Initialization vector

  try {
    const key = crypto.pbkdf2Sync(secretKey, salt, 65536, 32, 'sha256');
    const cipher = crypto.createCipheriv(AES_ALGO, key, iv);
    let encrypted = cipher.update(strToEncrypt, 'utf8', 'base64url');
    encrypted += cipher.final('base64url');
    return encrypted;
  } catch (e) {
    console.error('Encryption error:', e);
    return null;
  }
}

// async function decrypt(strToDecrypt, salt, secretKey, AES_ALGO) {
//   const iv = Buffer.alloc(16, 0); // Initialization vector

//   try {
//       const key = crypto.pbkdf2Sync(secretKey, salt, 65536, 32, 'sha256');
//       const decipher = crypto.createDecipheriv(AES_ALGO, key, iv);
//       let decrypted = decipher.update(strToDecrypt, 'base64', 'utf8');
//       decrypted += decipher.final('utf8');
//       return decrypted;
//   } catch (e) {
//       console.error('Decryption error:', e);
//       return null;
//   }
// }

// base64/XOR encryption
async function encryptValueToXor(value, key) {
  const xorKeyBuffer = Buffer.from(key, 'utf8');
  const valueBuffer = Buffer.from(value, 'utf8');
  const resultBuffer = Buffer.alloc(valueBuffer.length);

  for (let i = 0; i < valueBuffer.length; i++) {
    resultBuffer[i] = valueBuffer[i] ^ xorKeyBuffer[i % xorKeyBuffer.length];
  }

  return resultBuffer.toString('base64url');
}

// async function decryptXoredValue(xoredValue, key) {
//   const xorKeyBuffer = Buffer.from(key, 'utf8');
//   const xoredValueBuffer = Buffer.from(xoredValue, 'base64');
//   const resultBuffer = Buffer.alloc(xoredValueBuffer.length);

//   for (let i = 0; i < xoredValueBuffer.length; i++) {
//       resultBuffer[i] = xoredValueBuffer[i] ^ xorKeyBuffer[i % xorKeyBuffer.length];
//   }

//   return resultBuffer.toString('utf8');
// }

/*
 * @author: adarsh
 * @description: POST product.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */
exports.postProduct = async function (body, realm, group) {
  try {
    console.log("Inside postProduct service");

    // const existingProduct = await SequelizeDao.getAllData("PRODUCT", {
    //   productName: body.productName, realm: realm, group: group
    // });

    // if (existingProduct) {
    //   let responseBody = {
    //     message: "Product already exists. Please choose a different product name.",
    //     error: true,
    //     statusCode: 409, // Conflict status code
    //   };
    //   throw responseBody;
    // }

    let product_id = uuid();
    let txnid = uuid();
    let now = new Date();
    let timestamp = now.toISOString();

    console.log("BODY", body);

    let productBody = {
      txnid: txnid,
      created_at: timestamp,
      productDetail: body.ConsentDetail,
      productName: body.productName,
      product_id: product_id,
      status: body.status,
      realm: realm,
      group: group
    };

    try {
      await SequelizeDao.insertData(productBody, "PRODUCT");
    } catch (error) {
      console.error(`Error adding product: ${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    }

    await redisClient.del("products");
    await redisClient.del("products_" + product_id)


    let responseBody = {
      message: "Success in posting product",
      error: false,
      statusCode: 200,
      data: {
        product_name: body.productName,
        product_id: product_id,
      },
    };

    return responseBody;
  } catch (error) {
    console.error(`An error occurred while adding product: ${JSON.stringify(error)}`);
    if (error.statusCode && error.message && error.error) {
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    } else {
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;

    }
  }
};




/*
 * @author: adarsh
 * @description: DELETE product.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.deleteProduct = async function (product_id, realm, group) {
  try {
    console.log("Inside deleteProduct service");

    let condition;
    if (group == 'admin') {
      condition = {
        product_id: product_id,
        realm: realm
      };
    } else {
      condition = {
        product_id: product_id,
        realm: realm,
        group: group
      };
    }

    let product = await SequelizeDao.deleteData("PRODUCT", condition);

    if (!product) {
      throw new Error("Product not found");
    }
    await redisClient.del("products");


    let responseBody = {
      message: "Product deleted successfully",
      error: false,
      statusCode: 200,
    };

    return responseBody;

  } catch (error) {
    console.error(`An error occurred while deleting product: ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    throw errorBody;

  }
};


/*
 * @author: adarsh
 * @description: UPDATE product.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */


exports.updateProduct = async function (productBody, product_id, realm, group) {
  try {
    console.log("Inside updateProduct service");

    let productDetail = productBody.ConsentDetail;
    let productName = productBody.productName;

    let condition;
    if (group == 'admin') {
      condition = {
        product_id: product_id,
        realm: realm
      };
    } else {
      condition = {
        product_id: product_id,
        realm: realm,
        group: group
      };
    }

    let existingProduct = await SequelizeDao.getAllData("PRODUCT", condition);
    console.log("exist", existingProduct)

    if (!existingProduct || existingProduct.length === 0) {
      const error = new Error("Product not found");
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      throw errorBody;
    }

    existingProduct.productDetail = productDetail;
    existingProduct.productName = productName;
    existingProduct.status = productBody.status; // Update the productName property
    // Update the productName property
    existingProduct.updated_at = new Date().toISOString();

    await SequelizeDao.updateData(existingProduct, "PRODUCT", condition);

    await redisClient.del("products");
    await redisClient.del("products_" + product_id)

    let responseBody = {
      message: "Product updated successfully",
      error: false,
      statusCode: 200,
      data: {
        product_id: product_id
      },
    };

    return responseBody;

  } catch (error) {
    console.error(`An error occurred while updating product: ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    throw errorBody;

  }
};


/*
 * @author: adarsh
 * @description: get product details by id.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */



exports.getProductDetailsbyId = async function (product_id, realm, group) {
  try {
    const cacheKey = "products_" + product_id;
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    let condition;
    if (group == 'admin') {
      condition = {
        product_id: product_id,
        realm: realm
      };
    } else {
      condition = {
        product_id: product_id,
        realm: realm,
        group: group
      };
    }
    let productDetails = await SequelizeDao.getAllData("PRODUCT", condition);

    if (!productDetails || productDetails.length === 0) {
      const error = new Error("Product not found");
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      return errorBody;

    }

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: productDetails[0],
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get product by id: ${error.message}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
    // throw error;
  }
};



/*
 * @author: adarsh
 * @description: get all product details.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.getAllProductDetails = async function (realm, group) {
  try {
    let responseBody;
    const cacheKey = `products_${group}`;
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    let condition;
    if (group == 'admin') {
      condition = {
        realm: realm
      };
    } else {
      condition = {
        realm: realm,
        group: group
      };
    }

    const productDetails = await SequelizeDao.getAllData("PRODUCT", condition);


    if (!productDetails || productDetails.length === 0) {
      responseBody = {
        message: "No Products!",
        error: false,
        statusCode: 200,
        result: {
          data: {},
        },
      };
      return responseBody;

    }

    console.log("PRODUCT", productDetails);

    responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: productDetails,
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get product by id ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;

  }
};

/*
 * @author: adarsh
 * @description: UPDATE product.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */


exports.updateAggregatorStatus = async function (aggregatorBody, aggregator_id,realm) {
  try {
    console.log("Inside updateAggregator service");


    const aggregator = await SequelizeDao.findOnee("AGGREGATOR",{ aggregator_id: aggregator_id })

    console.log("aggregator",aggregator.dataValues)
    if(aggregatorBody.status === 'ACTIVE') {
      const alreadyInFIUAggregator = await SequelizeDao.findOnee("FIU_AGGREGATOR",{ aggregator_id: aggregator_id , realmName :realm})
      console.log("alreadyfindOne",alreadyInFIUAggregator)

      if(alreadyInFIUAggregator == null){
        aggregator.dataValues['id'] = uuid();
        aggregator.dataValues['realmName'] = realm;
        console.log("aggregator.dataValues",aggregator.dataValues)
        const fiu_aggregator = await SequelizeDao.insertData(aggregator.dataValues, "FIU_AGGREGATOR");
        console.log("fiu_aggregator",fiu_aggregator)
      }

      let responseBody = {
        message: "Aggregator updated successfully",
        error: false,
        statusCode: 200,
        data: {
          aggregator_id: aggregator_id
        },
      };
  
      return responseBody;

    }else {
      const aggregator = await SequelizeDao.deleteData("FIU_AGGREGATOR",{ aggregator_id: aggregator_id , realmName :realm});
      console.log("aggregator",aggregator)
    }


    // if (!result || result[0] === 0) {
    //   const error = new Error("Invalid Aggregator ID")
    //   let errorBody = {
    //     message: errorResponses[404].message,
    //     error: errorResponses[404].error,
    //     errorMessage: error.message,
    //     statusCode: errorResponses[404].statusCode,
    //   };
    //   throw errorBody;

    // }

    let responseBody = {
      message: "Aggregator updated successfully",
      error: false,
      statusCode: 200,
      data: {
        aggregator_id: aggregator_id
      },
    };

    return responseBody;
  } catch (error) {
    console.error(`An error occurred while updating aggregator: ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[404].message,
      error: errorResponses[404].error,
      errorMessage: error.message,
      statusCode: errorResponses[404].statusCode,
    };
    throw errorBody;

  }
};

/*
 * @author: adarsh
 * @description: UPDATE product.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and resultconsentHandle (data, count, page etc).
 */

exports.setDefaultAggregator = async function (aggregatorBody, aggregator_id) {
  try {
    console.log("Inside setDefaultAggregator service");
    let result;
    let defaultAggregators = await SequelizeDao.getAllData("AGGREGATOR", { default_aggregator: true });

    if (!defaultAggregators.length) {
      result = await SequelizeDao.updateData({ default_aggregator: true }, "AGGREGATOR", { aggregator_id: aggregator_id });
    } else {
      let currentDefaultAggregator = defaultAggregators[0];
      result = await SequelizeDao.updateData({ default_aggregator: false }, "AGGREGATOR", { aggregator_id: currentDefaultAggregator.aggregator_id });
      let newDefaultAggregator = aggregator_id;
      result = await SequelizeDao.updateData({ default_aggregator: true }, "AGGREGATOR", { aggregator_id: newDefaultAggregator });
    }

    if (!result || result[0] === 0) {
      const error = new Error('Invalid Aggregator Id')
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      throw errorBody;
    }
    await redisClient.del("aggregators");

    let responseBody = {
      message: "Default Aggregator updated successfully.",
      error: false,
      statusCode: 200,
      data: {
        aggregator_id: aggregator_id
      },
    };

    return responseBody;
  } catch (error) {
    console.error(`An error occurred while setting default aggregator: ${error.message}`);
    let errorBody = {
      message: errorResponses[404].message,
      error: errorResponses[404].error,
      errorMessage: error.message,
      statusCode: errorResponses[404].statusCode,
    };
    throw errorBody;

  }
};

/*
 * @author: Gokul
 * @description: get all configurations.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

exports.getAllConfigurations = async function (realm, group) {
  try {
    const cacheKey = `all_configurations_${group}`;
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }

    const configurations = await SequelizeDao.getAllData("CONFIGURATION", { realm: realm });

    if (!configurations || configurations.length === 0) {
      const error = new Error("Configurations not found");
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      return errorBody;

    }

    console.log("CONFIGURATION", configurations);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: configurations,
      },
    };

    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error while fetching configurations: ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;

  }
};


exports.authServerGenerateSession = async function (product_id, realm_id) {
  try {

    const credentials = await SequelizeDao.getAllData("AUTHORIZATION", {});
    console.log("credentials", credentials)

    if (!credentials || credentials.length === 0) {
      const error = new Error("Authorization credentials not found");
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }

    const headers = {
      'Content-Type': 'application/json',
      'client_Id': credentials[0].client_id,
      'x-correlation-id': credentials[0].correlation_id,
      'grant_type': credentials[0].grant_type,
      'client_secret': credentials[0].client_secret,
      'product_id': product_id

    };

    const response = await axios.post(`http://internal-eps-internal-alb-333730115.ap-south-1.elb.amazonaws.com:3004/api/fiu/v1/${realm_id}/session`, {}, { headers });

    console.log("Generated Session response", response.data);

    const responseBody = {
      message: 'Success in generating session',
      error: false,
      statusCode: 200,
      data: response.data,
    };

    return responseBody;
  } catch (error) {
    console.error(`An error occurred while generating session: ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};


exports.brandingConfiguration = async function (body, fileInfo, realm, group) {
  try {
    console.log('Inside service');
    console.log('Inside create project service');
    console.log("body", body);
    console.log("file information:", fileInfo);

    let config_id = uuid();
    console.log("config_id", config_id);

    let imageLink = [];
    if (fileInfo) {
      imageLink = await addFilesToS3(fileInfo, 'image', config_id, group);
      console.log("imageLink:", imageLink);
    }

    let configFile = {
      imageLink: imageLink[0].data.Location,
      body: body
    };

    // console.log("CONFIG", configFile);

    let configBody = {
      config_id: config_id,
      branding_config: configFile,
      group: group,
      realm: realm
    };
    console.log("CONFIG", configBody);

    try {
      await SequelizeDao.insertData(configBody, "CONFIGURATION");
    } catch (error) {
      console.error('Error in adding data in Sequelize:', error);
      throw new Error('An error occurred while adding data in Sequelize.');
    }

    return {
      message: 'Success in adding branding configuration',
      error: false,
      statusCode: 200,
      data: {}
    };
  } catch (error) {
    console.error('Error in brandingConfiguration:', error);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};



async function addFilesToS3(array, key, config_id, group,realm) {
  var deferred = Q.defer();
  let imageLink = [];
  console.log("array:", array.length);

  try {
    // for (let i = 0; i < array.length; i++) {
    const fileContent = fs.readFileSync(array.path);
    let uploadParams;

    console.log("realm :5155 ",realm);
    const dbResp = await SequelizeDao.getAllData("REALM_CONFIG", { realm: realm });
    console.log("logoPath : 5156 ",dbResp);
    if (dbResp.length === 0) {
      const notFoundError = {
        status: "error",
        statusCode: 404,
        message: 'realm data not found.'
      };
      throw notFoundError;
    }

    const logoPathData = dbResp[0];
    console.log("logoPath : 5167 ",logoPathData);
    const dataValues = logoPathData.dataValues;
    console.log("datavalues.logoPath : ",dataValues?.logopath);
    console.log("5171 : ",'/growxcd/' + `${group}/logo`);
    console.log("5172 : ",`/${dataValues.logopath}${group}/logo`);
    uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `/${dataValues.logopath}${group}/logo`,
      Body: fileContent,
      ContentType: array.mimetype
    };

    console.log("uploadParams", uploadParams);

    try {
      const res = await uploadFiles(uploadParams, key);
      console.log("file upload response:", res);
      imageLink.push(res);
      await createInvalidation(uploadParams.Key)
    } catch (err) {
      console.error('Error in addFilesToS3:', err);
      deferred.reject({
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: err.message,
        statusCode: errorResponses[500].statusCode,
      });
    }
    // }
  } catch (error) {
    deferred.reject({
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    });
  }

  deferred.resolve(imageLink);

  return deferred.promise;
}

async function uploadFiles(params) {
  var deferred = Q.defer();

  s3Client.upload(params, async (err, data) => {
    if (err) {
      console.error('Error in uploadFiles:', err);
      deferred.reject({
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: err.message,
        statusCode: errorResponses[500].statusCode,
      });
      // deferred.reject({
      //   status: 500,
      //   error: 'Internal Server Error',
      //   message: 'An error occurred while uploading files to S3.'
      // });
    } else {
      deferred.resolve({
        status: 200,
        message: 'File uploaded successfully',
        data: data
      });
    }
  });

  return deferred.promise;
}


exports.getBrandConfiguration = async function (realm, group) {
  console.log("INSIDE GET BRAND CONFIGURATION SERVICE");
  try {
    const cacheKey = `configuration_${group}`;
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    const brandConfigs = await SequelizeDao.getAllData('CONFIGURATION', { group: group , realm: realm});

    if (brandConfigs.errorBody || brandConfigs[0] === null) {
      const error = new Error('Data Not Found')
      return {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
    }

    console.log("Brand Configuration", brandConfigs);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: brandConfigs,
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get all purpose codes ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;

  }
};

exports.updateBrandingConfiguration = async function (body, fileInfo, realm, group, config_id) {
  var deferred = Q.defer();
  console.log('Inside update branding configuration service');
  console.log("config_id", config_id);
  console.log("body", body);
  console.log("file information:", fileInfo);

  try {
    let imageLink = [];
    if (fileInfo) {
      imageLink = await addFilesToS3(fileInfo, 'image', config_id, group,realm);
      console.log("imageLink:", imageLink);
    }
    let existingConfig = await SequelizeDao.getAllData("CONFIGURATION", { config_id: config_id, group: group });
    console.log("existingConfig", existingConfig)
    let existingImageLink = existingConfig ? existingConfig[0].branding_config.imageLink : null;
    let existingBody = existingConfig ? existingConfig[0].branding_config.body : null;

    console.log("existingConfig", existingBody);

    let configFile = {
      imageLink: imageLink.length > 0 ? imageLink[0].data.Location : existingImageLink,
      body: JSON.stringify(body) === '{}' ? existingBody : body
    };


    let configBody = {
      branding_config: configFile,
    };
    console.log("CONFIG", configBody);

    try {
      await SequelizeDao.updateData(configBody, "CONFIGURATION", { config_id: config_id, group: group });
    } catch (error) {
      console.error('Error in updating data in Sequelize:', error);
      throw new Error('An error occurred while updating data in Sequelize.');
    }

    deferred.resolve({
      message: 'Success in updating branding configuration',
      error: false,
      status: 200,
      data: {}
    });
  } catch (error) {
    console.error('Error in updateBrandingConfiguration:', error);
    deferred.reject({
      status: 500,
      error: 'Internal Server Error',
      message: 'An error occurred while processing the request.'
    });
  }

  return deferred.promise;
}

exports.automateFiRequest = async function (body, config_id, group) {
  try {
    console.log("Inside setDefaultAggregator service");

    let automateBody = {
      fi_request: body.fi_request
    }

    console.log("Automatebody", automateBody)

    let FiReqAutomation = await SequelizeDao.updateData(automateBody, "CONFIGURATION", { config_id: config_id, group: group });
    console.log("automation", FiReqAutomation)

    let responseBody = {
      message: "FI request automated successfully.",
      error: false,
      statusCode: 200,
    };

    return responseBody;
  } catch (error) {
    console.error(`An error occurred while automating FI request: ${error.message}`);
    let errorBody = {
      message: errorResponses[404].message,
      error: errorResponses[404].error,
      errorMessage: error.message,
      statusCode: errorResponses[404].statusCode,
    };
    throw errorBody;
  }
};

exports.postDraftProduct = async function (body) {
  try {
    console.log("Inside postDraftProduct service");

    let product_id = body.product_id

    if (body.product_id) {
      let productBody = {
        productName: body.productName,
        productDetail: body.ConsentDetail,
        status: body.status
      };

      try {
        await SequelizeDao.updateData(productBody, "PRODUCT", {
          product_id: body.product_id, realm: body.realm, group: body.group
        });
      } catch (error) {
        console.error(`Error updating product: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      }
      await redisClient.del("products");
      await redisClient.del("products_" + product_id)

      let responseBody = {
        message: "Success in updating product",
        error: false,
        statusCode: 200,
        data: {
          product_name: body.productName,
          product_id: body.product_id,
        },
      };
      return responseBody;
    } else {
      let product_id = uuid();
      let txnid = uuid();
      let now = new Date();
      let timestamp = now.toISOString();

      console.log("BODY", body);

      let productBody = {
        txnid: txnid,
        created_at: timestamp,
        productDetail: body.ConsentDetail,
        productName: body.productName,
        product_id: product_id,
        status: body.status,
        realm: body.realm,
        group: body.group
      };

      try {
        await SequelizeDao.insertData(productBody, "PRODUCT");
      } catch (error) {
        console.error(`Error adding product: ${JSON.stringify(error)}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      }
      await redisClient.del("products");
      await redisClient.del("products_" + product_id)


      let responseBody = {
        message: "Success in posting draft product",
        error: false,
        statusCode: 200,
        data: {
          product_name: body.productName,
          product_id: product_id,
        },
      };

      return responseBody;
    }
  } catch (error) {
    console.error(
      `An error occurred while adding/updating product: ${JSON.stringify(
        error
      )}`
    );
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

/*
 * @author: adarsh
 * @description: get aggragtor details by id.
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */



exports.getAggregatorDetailsbyId = async function (aggregator_id) {
  try {
    const cacheKey = "aggregator_" + aggregator_id;
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    let aggregatorDetails = await SequelizeDao.getAllData("AGGREGATOR", { aggregator_id: aggregator_id });

    if (!aggregatorDetails || aggregatorDetails.length === 0) {
      const error = new Error("Aggregator Data not found");
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      return errorBody;
    }

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: aggregatorDetails[0],
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get aggregtor by id: ${error.message}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};


exports.updateAggregatorDetailsById = async function (aggregatorBody, aggregator_id) {
  try {
    console.log("Inside updateAggregatorDetailsById service");

    const result = await SequelizeDao.updateData(aggregatorBody, "AGGREGATOR", { aggregator_id: aggregator_id });

    if (!result || result[0] === 0) {
      const error = new Error('Data not updated')
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      return errorBody;
    }
    let responseBody = {
      message: "Aggregator updated successfully",
      error: false,
      statusCode: 200,
      data: {
        aggregator_id: aggregator_id
      },
    };

    return responseBody;
  } catch (error) {
    console.error(`An error occurred while updating aggregator: ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

exports.getAllMasterTableData = async function () {
  console.log("INSIDE getAllMasterTableData SERVICE");
  try {
    const allData = {};

    const fiTypes = await SequelizeDao.getAllData('FI_TYPE', {});
    const operators = await SequelizeDao.getAllData('OPERATORS', {});
    const consentTypes = await SequelizeDao.getAllData('CONSENT_TYPE', {});
    const consentModes = await SequelizeDao.getAllData('CONSENT_MODE', {});
    const purposeCodes = await SequelizeDao.getAllData('PURPOSE_CODE', {});
    const aggregators = await SequelizeDao.getAllData('AGGREGATOR', {});
    const fiStatus = await SequelizeDao.getAllData('FI_STATUS', {});

    if (fiTypes.error) {
      const { statusCode, message, errorMessage, error } = fiTypes.error;
      let errorBody = {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
      throw errorBody;
    }
    if (operators.error) {
      const { statusCode, message, errorMessage, error } = operators.error;
      let errorBody = {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
      throw errorBody;

    } if (consentTypes.error) {
      const { statusCode, message, errorMessage, error } = consentTypes.error;
      let errorBody = {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
      throw errorBody;

    } if (consentModes.error) {
      const { statusCode, message, errorMessage, error } = consentModes.error;
      let errorBody = {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
      throw errorBody;

    } if (purposeCodes.error) {
      const { statusCode, message, errorMessage, error } = purposeCodes.error;
      let errorBody = {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
      throw errorBody;

    }
    if (aggregators.error) {
      const { statusCode, message, errorMessage, error } = aggregators.error;
      let errorBody = {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
      throw errorBody;

    }

    if (fiStatus.error) {
      const { statusCode, message, errorMessage, error } = fiStatus.error;
      let errorBody = {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
      throw errorBody;

    }
    allData.fiTypes = fiTypes;
    allData.operators = operators;
    allData.consentTypes = consentTypes;
    allData.consentModes = consentModes;
    allData.purposeCodes = purposeCodes;
    allData.aggregators = aggregators;
    allData.fiStatus = fiStatus;


    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: allData,
      },
    };

    return responseBody;
  } catch (error) {
    console.error(`Error in get all master table data fiTypes ${error}`);

    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};


exports.getFIRequestBySessionId = async function (session) {
  try {
    const cacheKey = "firequest_session" + session;
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    let fiRequestDetails = await SequelizeDao.getAllData("FI_REQUEST_REPLICA", { session_id: session });
    if (!fiRequestDetails || fiRequestDetails.length === 0) {
      const error = new Error("FI Request not found");
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      throw errorBody;
    }

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: fiRequestDetails[0],
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get aggregtor by id: ${error.message}`);
    throw error;
  }
};


exports.getAnalyticstBySessionId = async function (sessionId,realm) {
  var deferred = Q.defer()
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const getSessionData = await SequelizeDao.getAllData("FI_REQUEST_REPLICA", { session_id: sessionId })

    if (getSessionData.error || getSessionData.length == 0) {
      const error = new Error('Bad Request');
      return {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
    }

    let DataConsumer = await SequelizeDao.getAllData('DATA_CONSUMER', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    let realmData = await SequelizeDao.getAllData('REALM_CONFIG', { realm: realm })
    .then(function (result) {
      console.log(`Wrapper function result:${JSON.stringify(result)}`);
      return result;
    })
    .catch(function (error) {
      console.error(`Error in wrapper function:${JSON.stringify(error)}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });

    console.log("realmConfigData----------->",realmData)

    const FIU_BASE_URL = realmData[0].fiuBaseURL

    console.log("FIU_BASE_URL----------->",FIU_BASE_URL)

    const header = {
      Authorization: 'Basic ' + process.env.FIU_PASS,
      "fiu-client-id": DataConsumer[0].id
    };

    const decryptResponse = await axios.get(FIU_BASE_URL + 'crypto/decrypt/' + sessionId, { httpsAgent: agent, headers: header });
    const decryptedFI = decryptResponse.data;

    // //TODO: comment below and uncomment above code for removing hardcode data
    // const decryptedFI = `<?xml version='1.0' encoding='UTF-8'?><Account xmlns="http://api.rebit.org.in/FISchema/deposit" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" type="deposit" maskedAccNumber="XXXX9854" version="1.1" linkedAccRef="74a6c4ae-4d45-4851-804e-ca5c241eca77" xsi:schemaLocation="http://api.rebit.org.in/FISchema/deposit.xsd">
    // <Profile>
    // <Holders type="SINGLE">
    // <Holder name="VISHALKUMAR RAMESHBHAI PATEL" dob="1998-02-01" mobile="7490857999" nominee="REGISTERED" address="" email="NA" pan="EKLPP5116H" ckycCompliance="true"/>
    // </Holders>
    // </Profile>
    // <Summary currentBalance="174.78" currency="INR" exchgeRate="1" balanceDateTime="2024-01-20T03:01:21+05:30" type="SAVINGS" branch="VANTHWADI, GUJARAT" ifscCode="BARB0VANTHW" micrCode="387012530" openingDate="2017-02-20" currentODLimit="0.00" drawingLimit="0.00" status="ACTIVE">
    // <Pending amount="0.0"/>
    // </Summary>
    // <Transactions startDate="2023-06-01" endDate="2023-12-31">
    //     <Transaction type="CREDIT" mode="OTHERS" amount="12762.0" currentBalance="12815.49" transactionTimestamp="2023-08-05T15:42:29+05:30" valueDate="2023-08-05" txnId="S38361762" narration="NEFT-33175256091DC-RECICLAR TECHNOLOGIE" reference="231205000193"/>
    //   </Transactions>
    // </Account>`




    console.log("Decrypt data:", decryptedFI)

    const tempFilePath = await createXmlFile(decryptedFI, sessionId);
    const formData = new FormData();
    const file = await fs.createReadStream(tempFilePath);
    formData.append('file', file, `${sessionId}.xml`);
    // const params = {
    //   Bucket: 'temp-analytics-fiu',
    //   Key: `sample.xml`, // Name of the file in the bucket
    //   Body: decryptedFI,
    //   ContentType: 'text/xml' // Set the content type as XML
    // };
    // const formData = new FormData();
    // const file = await s3Client.getObject({ Bucket: params.Bucket, Key: `temp.xml` }).promise();
    // await formData.append('file', file.Body);

    // await s3Client.getObject({ Bucket: params.Bucket, Key: `temp.xml` }, (err, data) => {
    //   if (err) {
    //     console.error("Error getting XML file from S3:", err);
    //   } else {
    //     // Add the XML file to the FormData object
    //     formData.append('file', data.Body, {
    //       filename: `temp.xml`,
    //       contentType: 'application/xml'
    //     });

    //     // You can now use formData in your HTTP request, for example:
    //     // axios.post(url, formData, { headers: formData.getHeaders() })
    //     // Or use it with other libraries like 'request'
    //   }
    // });

    //TODO: fetch clientId, clientSecret from env variables
    const params = {
      SecretId: process.env.BSACREDSARN
    };
    const getSecret = await getSecretKey(params);
    const headers = {
      'Content-Type': 'multipart/form-data',
      'clientId': getSecret.CLIENTID,
      'clientSecret': getSecret.CLIENTSECERT
    };

    await axios.post(`${process.env.SM_BASE_URL}/uploadBankStatementXmlFiles`, formData, { headers })
      .then(async function (result) {
        console.log("File upload response:", result.data);
        if (result.data.responseCode === 'SRS016') {
          const referenceId = result.data.data.referenceId;
          // const referenceId = '67f69a0b-00b9-4ad7-8bcd-6ebebeb20d50'
          console.log("referenceId:", referenceId);
          await SequelizeDao.updateData({ bsa_reference_id: referenceId, bsa_report_status: "IN-PROGRESS" }, "FI_REQUEST_REPLICA", { session_id: sessionId })
          deferred.resolve({
            message: 'Acknowledged',
            error: false,
            statusCode: 200,
            referenceId: referenceId
          })

        } else {
          deferred.reject({
            message: 'An error occurred while generating ID',
            error: true,
            errorMessage: result.data.responseMessage,
            statusCode: 500,
          });
        }
      })
      .catch(function (error) {
        console.error(`Error in file upload API: ${error}`);
        deferred.reject({
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        });
      });
  } catch (error) {
    console.error(`Error in file upload: ${error}`);
    deferred.reject({
      message: 'An error occurred while generating CSV',
      error: true,
      errorMessage: error.message,
      statusCode: 500,
    });
  }
  return deferred.promise;
};

function createXmlFile(xmlData, fileName) {
  return new Promise((resolve, reject) => {
    const tempFilePath = `temp/${fileName}.xml`;
    fs.writeFile(tempFilePath, xmlData, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(tempFilePath);
      }
    });
  });
}


// const params = {
//   Bucket: 'temp-analytics-fiu',
//   Key: `sample.xml`, // Name of the file in the bucket
//   Body: decryptedFI,
//   ContentType: 'text/xml' // Set the content type as XML
// };

// s3Client.upload(params, async (err, data) => {
//   if (err) {
//     console.error('Error in uploadFiles:', err);
//     deferred.reject({
//       message: errorResponses[500].message,
//       error: errorResponses[500].error,
//       errorMessage: err.message,
//       statusCode: errorResponses[500].statusCode,
//     });
//   } else {
//   console.log("s3Response:", data);
//   const uploadedFile = await s3Client.getObject({ Bucket: params.Bucket, Key: data.Key }).promise();
//   console.log("s3 File:", uploadedFile);
//   const formData = new FormData();
//   console
//   formData.append('file', uploadedFile.Body,{
//     filename: `${data.Key}.xml`, // Name of the file being uploaded
//   });
//   console.log("FormData:",formData);
//   const headers = {
//     'Content-Type': 'multipart/form-data',
//     'clientId': 'd612731dc3eb63e4b6fd9263639e8281',
//     'clientSecret': '977872eb1de9179bd2fa48dfb37cb5aefe0a64f8bd5828c004ae4ff229a6b4d2'
//   };
//   await axios.post(`https://sm-bsa-sandbox.scoreme.in/bsa/external/uploadBankStatementXmlFiles`, formData, { headers })
//     .then(async response => {
//       console.log("Scoreme apiResponse:", response.data);
//       if (response.data.referenceId) {

//       }
//     })
//     .catch(error => {

//     });

// }
// });

exports.getConsentTrail = async function (correlation_id) {
  console.log("INSIDE GET CONSENT TRAIL SERVICE");
  try {
    const cacheKey = "consent_trail_" + correlation_id;
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }

    let finalResponseData = [
      {
        stage: 'Successfully Requested Consent',
        status: '',
        date: '',
        time: ''
      }, {
        stage: 'Pending Approval from User',
        status: '',
        date: '',
        time: ''
      }, {
        stage: 'Pending Request For FI',
        status: '',
        date: '',
        time: ''
      }, {
        stage: 'Pending Fetch FI',
        status: '',
        date: '',
        time: ''
      }
    ];
    let consentStatus = await SequelizeDao.getAllData('CONSENT_REQUEST_REPLICA', { correlation_id: correlation_id });
    console.log('consentStatus', consentStatus);
    if (consentStatus.errorBody || consentStatus.length === 0) {
      const error = new Error('Data Not Found')
      return {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
    }

    let getFiNotification = await SequelizeDao.getAllData('NOTIFICATION', { sessionId: consentStatus[0].session_id })

    let getFiStatus = await SequelizeDao.getAllData('FI_REQUEST_REPLICA', { correlation_id: correlation_id })

    let getConsentTime = await getFormattedDateTime(consentStatus[0].timestamp)
    let getFiNotificationTime = getFiNotification[0] !== undefined && await getFormattedDateTime(getFiNotification[0].timestamp)
    let getFiTime = getFiStatus[0] !== undefined && await getFormattedDateTime(getFiStatus[0].timestamp)
    console.log('getConsentTime', getConsentTime, getFiTime);

    if (consentStatus[0].consent_status == 'PENDING') {
      finalResponseData[0].status = 'ACTIVE';
      finalResponseData[0].date = getConsentTime[0],
        finalResponseData[0].time = getConsentTime[1]
    } else if (consentStatus[0].consent_status == 'ACTIVE') {
      finalResponseData[0].status = 'ACTIVE';
      finalResponseData[0].date = getConsentTime[0],
        finalResponseData[0].time = getConsentTime[1],
        finalResponseData[1].stage = 'Successfully Approved from User'
      finalResponseData[1].status = consentStatus[0].consent_status;
      finalResponseData[1].date = getConsentTime[0],
        finalResponseData[1].time = getConsentTime[1]
    } else if (consentStatus[0].consent_status == 'REVOKED') {
      finalResponseData[0].status = 'ACTIVE';
      finalResponseData[0].date = getConsentTime[0],
        finalResponseData[0].time = getConsentTime[1],
        finalResponseData[1].stage = 'Revoked by the User'
      finalResponseData[1].status = 'ACTIVE';
      finalResponseData[1].date = getConsentTime[0],
        finalResponseData[1].time = getConsentTime[1]
    } else if (consentStatus[0].consent_status == 'PAUSED') {
      finalResponseData[0].status = 'ACTIVE';
      finalResponseData[0].date = getConsentTime[0],
        finalResponseData[0].time = getConsentTime[1],
        finalResponseData[1].stage = 'Paused by the User'
      finalResponseData[1].status = 'ACTIVE';
      finalResponseData[1].date = getConsentTime[0],
        finalResponseData[1].time = getConsentTime[1]
    }

    if (getFiStatus[0] !== undefined) {
      if (getFiStatus[0].fi_status == 'PENDING') {
        finalResponseData[2].stage = 'Successfully Requested For FI'
        finalResponseData[2].status = 'READY';
        finalResponseData[2].date = getFiNotificationTime[0],
          finalResponseData[2].time = getFiNotificationTime[1]
      } else if (getFiStatus[0].fi_status == 'READY') {
        finalResponseData[2].stage = 'Successfully Requested For FI'
        finalResponseData[2].status = 'READY';
        finalResponseData[2].date = getFiNotificationTime[0],
          finalResponseData[2].time = getFiNotificationTime[1],
          finalResponseData[3].stage = 'Successfully Fetched FI'
        finalResponseData[3].status = getFiStatus[0].fi_status;
        finalResponseData[3].date = getFiTime[0],
          finalResponseData[3].time = getFiTime[1]
      }
    }

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: finalResponseData,
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get consent trail ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;

  }
};

async function getFormattedDateTime(timestamp) {
  const momentObject = moment(timestamp);
  const formattedDate = momentObject.format('DD MMMM YYYY');
  const formattedTime = momentObject.format('HH:mm:ss A');
  return [formattedDate, formattedTime];
}


exports.customerCount = async function (group,realm) {
  try {
    const cacheKey = `customer/count_${group}`;
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }
    let statusCount = {};
    let condition;
    if (group == 'admin') {
      condition = {realm:realm};
    } else {
      condition = {
        group: group,
        realm: realm
      };
    }
    await SequelizeDao.getCount('CUSTOMER_DETAIL', condition).then(function (countResult) {
      statusCount['totalCount'] = parseInt(countResult);
    }).catch(function (error) {
      console.error(`get cutomer count error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
    console.log("new api response:", statusCount);
    let responseBody = {
      message: 'success in getting customer count',
      error: false,
      statusCode: 200,
      data: statusCount,
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
    return responseBody;
  } catch (error) {
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}


exports.fiTypesCount = async function (group,realm) {
  try {
    const cacheKey = `fiTypes/count_${group}`;
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }

    let statusCount = {};
    let condition;
    if (group == 'admin') {
      condition = {realm:realm};
    } else {
      condition = {
        group: group,
        realm:realm
      };
    }
    await SequelizeDao.fiTypesCount(condition).then(function (result) {
      if (result.length == 0) {
        statusCount['statusDetail'] = result;
      } else {
        for (let i = 0; i < result.length; i++) {
          console.log("Count result:", result);
          result[i].fi_types = result[i].fi_types[0]
          result[i].fi_types_count = parseInt(result[i].fi_types_count)
          statusCount['statusDetail'] = result;
        }
      }
    }).catch(function (error) {
      console.error(`get fytype count statusDetail error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });

    await SequelizeDao.getCount('CONSENT_REQUEST_REPLICA', condition).then(function (countResult) {
      console.log('countResult', typeof (countResult), parseInt(countResult));
      statusCount['totalCount'] = parseInt(countResult);
    }).catch(function (error) {
      console.error(`FI_REQUEST get count error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
    console.log("new api response:", statusCount);
    let responseBody = {
      message: 'success in getting fi types count',
      error: false,
      statusCode: 200,
      data: statusCount,
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
    return responseBody;
  } catch (error) {
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}


exports.getAggregatorsByFiRequest = async function (group,realm) {
  try {
    const cacheKey = `fi/requests/aggregators/count_${group}`;
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }
    let statusCount = {};
    let condition;
    if (group == 'admin') {
      condition = {realm:realm};
    } else {
      condition = {
        group: group,
        realm: realm
      };
    }
    await SequelizeDao.getAggregatorsByFiRequest(condition).then(function (result) {
      let transformedResponse = {};
      let array = [];
      for (let i = 0; i < result.length; i++) {
        console.log("Count result:", result);

        const { aggregator_id, fi_types, fi_types_aggregator_count } = result[i];

        if (!transformedResponse[aggregator_id]) {
          transformedResponse[aggregator_id] = { aggregator_id };
        }
        for (let j = 0; j < fi_types.length; j++) {
          const fiType = fi_types[j];
          if (!transformedResponse[aggregator_id][fiType]) {
            transformedResponse[aggregator_id][fiType] = 0;
          }
          transformedResponse[aggregator_id][fiType] += parseInt(fi_types_aggregator_count);
        }
      }
      for (const aggregator_id in transformedResponse) {
        array.push(transformedResponse[aggregator_id]);
      }
      statusCount['statusDetail'] = array;

    }).catch(function (error) {
      console.error(`FI_REQUEST get statusDetail error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
    let responseBody = {
      message: 'success in getting aggregator by fi request',
      error: false,
      statusCode: 200,
      data: statusCount,
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
    return responseBody;
  } catch (error) {
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}


exports.getAggregatorsByConsent = async function (group,realm) {
  try {
    const cacheKey = `consent/aggregators/count_${group}`;
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }
    let statusCount = {};

    await SequelizeDao.getAggregatorsByConsent(group,realm).then(function (result) {
      let transformedResponse = {};
      let array = [];
      for (let i = 0; i < result.length; i++) {
        console.log("Count result:", result);

        const { aggregator_id, fi_types, fi_types_aggregator_count } = result[i];

        if (!transformedResponse[aggregator_id]) {
          transformedResponse[aggregator_id] = { aggregator_id };
        }
        for (let j = 0; j < fi_types.length; j++) {
          const fiType = fi_types[j];
          if (!transformedResponse[aggregator_id][fiType]) {
            transformedResponse[aggregator_id][fiType] = 0;
          }
          transformedResponse[aggregator_id][fiType] += parseInt(fi_types_aggregator_count);
        }
      }
      for (const aggregator_id in transformedResponse) {
        array.push(transformedResponse[aggregator_id]);
      }
      statusCount['statusDetail'] = array;

    }).catch(function (error) {
      console.error(`get aggregator by consent statusDetail error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
    let responseBody = {
      message: 'success in getting aggregator by consent',
      error: false,
      statusCode: 200,
      data: statusCount,
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
    return responseBody;
  } catch (error) {
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}


exports.getConsentExpiryCount = async function (group,realm) {
  try {
    const cacheKey = `consent_expiry/count_${group}`;
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }
    let statusCount = {};
    await SequelizeDao.getConsentExpiryCount(group,realm).then(function (result) {
      if (result.length == 0) {
        statusCount['statusDetail'] = result;
      } else {
        for (let i = 0; i < result.length; i++) {
          console.log("Count result:", result);
          result[i].consent_expiry_count = parseInt(result[i].consent_expiry_count)
          statusCount['statusDetail'] = result;
        }
      }
    }).catch(function (error) {
      console.error(`Expiry count get statusDetail error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
    console.log("new api response:", statusCount);
    let responseBody = {
      message: 'success in getting expiry count',
      error: false,
      statusCode: 200,
      data: statusCount,
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
    return responseBody;
  } catch (error) {
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}


exports.getFiTypesByFiRequest = async function (group,realm) {
  try {
    const cacheKey = `fi/types/count_${group}`;
    const reply = await GET_ASYNC(cacheKey);
    if (reply) {
      console.log('Using cached data');
      const parsedData = JSON.parse(reply);
      console.log(`PARSED: ${parsedData}`);
      return parsedData;
    }
    let statusCount = {};
    let condition;
    if (group == 'admin') {
      condition = {realm: realm};
    } else {
      condition = {
        group: group,
        realm: realm
      };
    }
    await SequelizeDao.getFiTypesByFiRequest(condition).then(function (result) {

      let transformedResponse = {};
      let array = [];
      for (let i = 0; i < result.length; i++) {
        console.log("Count result:", result);

        const { fi_data_range_from, fi_types, fi_types_count } = result[i];

        if (!transformedResponse[fi_data_range_from]) {
          transformedResponse[fi_data_range_from] = { fi_data_range_from };
        }
        for (let j = 0; j < fi_types.length; j++) {
          const fiType = fi_types[j];
          if (!transformedResponse[fi_data_range_from][fiType]) {
            transformedResponse[fi_data_range_from][fiType] = 0;
          }
          transformedResponse[fi_data_range_from][fiType] += parseInt(fi_types_count);
        }
      }
      for (const fi_data_range_from in transformedResponse) {
        array.push(transformedResponse[fi_data_range_from]);
      }
      statusCount['statusDetail'] = array;
    }).catch(function (error) {
      console.error(`FI_REQUEST get statusDetail error ${error}`);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
    let responseBody = {
      message: 'success in getting financial info',
      error: false,
      statusCode: 200,
      data: statusCount,
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);
    return responseBody;
  } catch (error) {
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}


exports.getRole = async function (roleId) {
  console.log("INSIDE GETROLES SERVICE");
  try {
    const cacheKey = `role_${roleId}`
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    const roles = await SequelizeDao.getAllData('ROLES', { role_id: roleId });

    if (roles.error) {
      const { statusCode, message, errorMessage, error } = roles.error;
      return {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
    }

    console.log("ROLES", roles);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: roles,
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get roles ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};


exports.getAllRoles = async function (group) {
  console.log("INSIDE GET ALL ROLES SERVICE");
  try {
    const cacheKey = `all_roles_${group}`
    const reply = await GET_ASYNC(cacheKey);

    if (reply) {
      const parsedData = JSON.parse(reply);
      return parsedData;
    }
    const roles = await SequelizeDao.getAllData('ROLES', {});

    if (roles.error) {
      const { statusCode, message, errorMessage, error } = roles.error;
      return {
        message: message,
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
      };
    }

    console.log("ROLES", roles);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: roles,
      },
    };
    await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get roles ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
};

exports.deleteBrandingConfiguration = async function (realm, config_id) {
  try {
    console.log("Inside deleteBrandingConfiguration service");
    let configuration = await SequelizeDao.deleteData("CONFIGURATION", { config_id: config_id });
    if (!configuration) {
      throw new Error("configuration not found");
    }
    await redisClient.del("configurations");
    let responseBody = {
      message: "Configuration deleted successfully",
      error: false,
      statusCode: 200,
    };
    return responseBody;
  } catch (error) {
    console.error(`An error occurred while deleting product: ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    throw errorBody;
  }
};

async function createInvalidation(path) {
  const client = new CloudFrontClient({ region: process.env.AWS_REGION })

  const params = {
    DistributionId: process.env.UAT_DISTRIBUTION_ID,//distributionId,
    InvalidationBatch: {
      CallerReference: String(new Date().getTime()),
      Paths: {
        Quantity: 1,
        Items: [path]
      }
    }
  }

  const createInvalidationCommand = new CreateInvalidationCommand(params)

  const response = await client.send(createInvalidationCommand)

  console.log('Posted cloudfront invalidation, response is:')
  console.log(response)

}

exports.bsaReportDownload = async function (body) {
  try {
    let responseBody;
    const params = {
      SecretId: process.env.BSACREDSARN
    };
    const getSecret = await getSecretKey(params);
    console.log('getSecret', getSecret);
    console.log('body', body);
    const excelUrl = body.excelUrl;
    await axios.get(excelUrl, {
      //TODO: fetch clientId, clientSecret from env variables
      headers: {
        'clientId': getSecret.CLIENTID,
        'clientSecret': getSecret.CLIENTSECERT
      },
      responseType: 'stream',
    }).then(async function (urlResponse) {
      console.log(" URL response:", typeof urlResponse);

      // console.log('response', urlResponse.data);
      // const resp = await pipeline(urlResponse.data, writer);
      const getSessionData = await SequelizeDao.getAllData("FI_REQUEST_REPLICA", { bsa_reference_id: body.referenceId });
      console.log('getSessionData', getSessionData.length);
      if (getSessionData.error || getSessionData.length == 0) {
        const error = new Error('Bad Request');
        let errorBody = {
          message: errorResponses[400].message,
          error: errorResponses[400].error,
          errorMessage: error.message,
          statusCode: errorResponses[400].statusCode,
        };
        throw errorBody;
      }

      const getConsentExpiry = await SequelizeDao.getAllData("CONSENT_REQUEST_REPLICA", { session_id: getSessionData[0].session_id });
      console.log('getConsentExpiry', getConsentExpiry[0].consent_expiry);
      let balanceDateTime = getConsentExpiry[0].consent_expiry;
      const dateObject = moment(balanceDateTime).tz('UTC');
      const date = dateObject.format('YYYY-MM-DD');

      // let imageLink = []
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `BSA/Scoremi/${date}/${body.referenceId}_BSA_Report.xlsx`, //${date}
        Body: urlResponse.data,
        // Expires: expirationUTC, //'2024-04-19T06:45:21.052Z',
        // Prefix: `BSA/Scoremi/${referenceId}_BSA_Report.xlsx`
      }
      // const metadata = await s3Client.headObject(params).promise();
      // console.log('metadata',metadata);
      const s3Res = await uploadFiles(params)
      if (s3Res.status == 200) {
        // imageLink.push(s3Res);
        const updateBody = {
          bsa_report_link: s3Res.data.Location,
          bsa_report_status: "READY"
        }
        await SequelizeDao.updateData(updateBody, "FI_REQUEST_REPLICA", { bsa_reference_id: body.referenceId })
      }

      responseBody = {
        message: 'Acknowledged',
        error: false,
        statusCode: 200
      }
    }).catch(function (urlError) {
      console.error("url Error:", urlError);
      let errorBody = {
        message: urlError.message,
        error: true,
        errorMessage: urlError.errorMessage,
        statusCode: urlError.statusCode,
      };
      throw errorBody;
    });
    return responseBody;

  }
  catch (error) {
    console.error(`Error in file upload: ${error}`);
    let errorBody = {
      message: error.message,
      error: true,
      errorMessage: error.errorMessage,
      statusCode: error.statusCode,
    };
    throw errorBody;
  }
};

exports.getBsaReport = async function (session_id) {
  console.log("INSIDE GET BSA REPORT SERVICE");
  try {
    const getReport = await SequelizeDao.getAllData('FI_REQUEST_REPLICA', { session_id: session_id });

    if (getReport.error || getReport.length == 0) {
      const error = new Error('Bad Request');
      return {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
    }

    console.log("getReport", getReport);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: getReport[0].bsa_report_link,
      },
    };
    return responseBody;
  } catch (error) {
    console.error(`Error in get bsa report ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}

exports.sendSms = async function (body) {
  console.log("INSIDE GET SMS SERVICE");
  try {
    const getReport = await SequelizeDao.getAllData('ENTITY_CONFIGURATION', { group: body.group, sms_avail: true });
    const url = process.env.SMSURL;
    const authKey = process.env.SMSAUTHKEY;

    const reqBody = {
      "template_id": getReport[0].template_id,
      "sender": getReport[0].sender_id,
      "short_url": '0',
      "recipients": [
        {
          "mobiles": body.customer_id,
          "VAR1": "We would like to inform you that the consent process has been successfully initiated. Your participation is essential to proceed further. Thankyou",
        }
      ]
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey
      }
    };
    try {
      // Sending POST request to MSG91 API
      const response = await axios.post(url, reqBody, config);
      console.log("SMS sent successfully:", response.data);
      const responseBody = {
        message: "Success",
        error: false,
        statusCode: 200
      };
      return responseBody;
    } catch (error) {
      console.error("Error sending SMS:", error.response.data);
      throw new Error("Failed to send SMS");
    }
  } catch (error) {
    console.error(`Error in get sms ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}

exports.schedulerNotificationAPICall = async function (body) {
  try {
    
    console.log("schedulerNotificationAPICall called ");
    console.log("body :",body);

    // const params = {
    //   SecretId: process.env.FIUARN
    // };
    // console.log("params : ",params);
    
    // const getSecret = await getSecretKey(params);    
    // console.log('getSecret', getSecret);
    // console.log('AUTH', auth);

    // const authHeaderValue = auth.split(" ")
    // console.log("authHeaderValue : ",authHeaderValue);
    
    // const Buffer = require('buffer').Buffer;
    // const decodedString = Buffer.from(authHeaderValue[1], 'base64').toString('utf-8');
    // console.log("decodedString :",decodedString);
    
    // console.log(decodedString);
    // const authString = decodedString.split(':');
    // console.log("authString : ",authString);
    
    // if (authString[0] === getSecret.CLIENTID && authString[1] === getSecret.CLIENTSECERT) {

      let consentHandle = body.consentHandle;
      let queueName = body.queuename;
      console.log("consentHandle,queueName : ",consentHandle,queueName);
      
      // await schedulerNotification(consentHandle);  //FUNCTION CALL 

      // FOR GETTING REALM AND GROUP OF CONSENTHANDLE
      const findConsentHandle = await SequelizeDao.findOnee('CONSENT_HANDLE', { consentHandle: consentHandle });
      console.log("findConsentHandle :5590", findConsentHandle);

      if (!findConsentHandle) {
        console.log("findConsentHandle has no data");
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: errorResponses.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      }
      const realm = findConsentHandle.dataValues.realm;
      const group = findConsentHandle.dataValues.group;
      console.log("5595 : realm", realm, " group :", group, " consentHandle :", consentHandle);

      try {
        // FI RQUEST FUNCTION CALL
        const result = await FIUService.postFIRequest(consentHandle, realm, group, queueName);
        console.log('FI Request saved successfully');

        const session_id = result.data.sessionId;
        console.log("session_id :5643 ", session_id);
        const response = {
          statusCode :200,
          error: false,
          message: "webhook called successfully"
        }
        return await response// Return the result 

      } catch (error) {
        console.log("Error in postFIRequest:", error);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      }

    
      

    // }
    // const response = await axios.post(`https://url`, body, headers); //Update url for schedler notification

    // if (response) {
    //   const mockschedulerResponse = {
    //     "schedulerId": "ee71b5b8-a040-42f6-bd45-3a3740e0c42c",
    //     "applicationId": "b7f76359-7e57-4f12-9c51-cb56d15793f0",
    //     "webhookUrl": "https://envvd2bkso7sc.x.pipedream.net/",
    //     "status": "initiated",
    //     "createdAt": "2024-08-04T06:52:39.821Z",
    //     "_id": "66af25392ac4a05ca64a33cd"
    //   };

    //   const consentHandle = mockschedulerResponse.applicationId;
    //   const status = mockschedulerResponse.status;

    //   // Await the schedulerNotification function
    //   await schedulerNotification(consentHandle, status);

    // }
  } catch (error) {
    console.log("ERROR : 5594", error);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}

exports.fiDataSchedulerNotificationAPICall = async function (body) {
  try {
    
    console.log("fiDataschedulerNotificationAPICall called ");
    console.log("body :",body);

      let sessionId = body.sessionId;
      let queueName = body.queuename;
      console.log("sessionId,queueName : ",sessionId,queueName);
      
      // await schedulerNotification(consentHandle);  //FUNCTION CALL 

      // FOR GETTING fi data available or not 
      const findSessionId = await SequelizeDao.findOnee("FI_DATA", { sessionId: sessionId });
      console.log("findConsentHandle :5590", findSessionId);

      if (!findSessionId) {
        console.log("findSessionId has no data");
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: errorResponses.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      }

      try {
        // delete FI data
        const fiDataDeleted = await SequelizeDao.deleteData("FI_DATA", { sessionId: sessionId });
        console.log("fiDataDeleted :5590", fiDataDeleted);

        const response = {
          statusCode :200,
          error: false,
          message: "webhook called successfully"
        }
        return await response// Return the result 

      } catch (error) {
        console.log("Error in delete fi data record in FI data:", error);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      }

  } catch (error) {
    console.log("ERROR in fiData notification: 5594", error);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}

exports.postScheduler = async function (body) {
  console.log("insertData");
  try {
    const existingConsent = await SequelizeDao.getAllData('SCHEDULER', { queueName: body.queueName });
    console.log("existingConsent--->", existingConsent)
    if (existingConsent.length) {
      let responseBody = {
        message: "TaskName already exists. Please choose a different task name.",
        error: true,
        statusCode: 409, // Conflict status code
      };
      throw responseBody;
    }

    const insertData = await SequelizeDao.insertData(body, 'SCHEDULER');
    console.log("insertData", insertData)



    console.log("process.env.SCHEDULER_BASE_URL+'schedulers'", process.env.SCHEDULER_BASE_URL + 'schedulers')
    try {
      const createScheduleBody = {
        "queueName": body.queueName
      }
      console.log("reqBodyofScheduleCreate------>", createScheduleBody)
      // Sending POST request to scheduler API
      const response = await axios.post(process.env.SCHEDULER_BASE_URL + 'schedulers', createScheduleBody);
      console.log("create scheduler successfully:", response);
      console.log("process.env.SCHEDULER_BASE_URL+`schedulers/${body.queueName}/jobs", process.env.SCHEDULER_BASE_URL + `schedulers/${body.queueName}/jobs`)
      try {
        let reqBody = {}
        if(body.scheduleTime) {
            reqBody = {
              "jobName": "fiRequest Notification",
              "jobData": {
                  "url": process.env.NOTIFICATION_WEBHOOK_URL,
                  "method": "POST",
                  "data": {
                      "queuename":body.queueName,
                      "consentHandle": body.consentHandle,
                      "comparisionKey": body.comparisonKey,
                      "comparisionValue": +body.comparisonValue,
                      "comparisionExpression": body.comparisonExpression
                  }
              },
              "scheduleTime":body.scheduleTime
          }
        }else {
          reqBody = {
            "jobName": "fiRequest Notification",
            "jobData": {
                "url": process.env.NOTIFICATION_WEBHOOK_URL,
                "method": "POST",
                "data": {
                    "queuename":body.queueName,
                    "consentHandle": body.consentHandle,
                    "comparisionKey": body.comparisonKey,
                    "comparisionValue": +body.comparisonValue,
                    "comparisionExpression": body.comparisonExpression
                }
            },
            "cron": body.cronExpression,
            "limit": +body.limit
          }
        }
        
        console.log("reqBodyOfJobCreate------>",reqBody)
        // Sending POST request to scheduler API
        const response = await axios.post(process.env.SCHEDULER_BASE_URL + `schedulers/${body.queueName}/jobs`, reqBody);
        console.log("create scheduler successfully:", response.data);
        const responseBody = {
          message: "Success",
          error: false,
          data: response.data,
          statusCode: 200
        };
        return responseBody;
      } catch (error) {
        console.error("Error while creating scheduler", error.response);
        throw new Error("Failed to create scheduler");
      }
    } catch (error) {
      console.error("Error while creating scheduler", error);
      throw new Error("Failed to create scheduler");
    }
  } catch (error) {
    console.error(`Error in create scheduler ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}


exports.getScheduler = async function (consentHandle) {
  try {

    const existingConsent = await SequelizeDao.getAllData('SCHEDULER', { consentHandle: consentHandle });

    console.log("existingConsent", existingConsent)
    const scheduleData = []
    for (let i = 0; i < existingConsent.length; i++) {
      const data = existingConsent[i]
      // console.log("existingConsentinloop-->",existingConsent[i])
      console.log("data-->",data.dataValues.queueName)
      try { 
        console.log("process.env.SCHEDULER_BASE_URL+`schedulers/${data.dataValues.queueName}/jobs`",process.env.SCHEDULER_BASE_URL+`schedulers/${data.dataValues.queueName}/jobs`)
        const response = await axios.get(process.env.SCHEDULER_BASE_URL+`schedulers/${data.dataValues.queueName}/jobs`);
        console.log("get list of response--->", response);
        console.log("get list of response123--->", response.data.length);
        if(response.data.jobs.length) {
          console.log("get list of response--->", response.data[0]);
          console.log("response.data[0]",response.data[0])
          const data = []
          data.push(response.data)
          console.log("data------->",data)
          scheduleData.push(data)
          console.log("insideloop---->",scheduleData)
        }
        console.log("get list of schedulers", response.data);
      }catch (error) {
        console.error(`Error in get scheduler ${error}`);
        let errorBody = {
          message: errorResponses[500].message,
          error: errorResponses[500].error,
          errorMessage: error.message,
          statusCode: errorResponses[500].statusCode,
        };
        throw errorBody;
      }
      
    }
    console.log("scheduleData---->", scheduleData)
    const responseBody = {
      message: "Success",
      error: false,
      data: scheduleData,
      statusCode: 200
    };
    return responseBody;
  } catch (error) {
    console.error(`Error in get scheduler ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}

exports.pauseScheduler = async function (queueName) { 
  try {

    const response = await axios.post(process.env.SCHEDULER_BASE_URL+`schedulers/${queueName}/pause`);
    console.log("scheduler pause successfully:", response.data);
    const responseBody = {
      message: response.data.message,
      error: false,
      statusCode: 200
    };
    return responseBody;
  }catch (error) {
    console.error(`Error in pause scheduler ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}

exports.resumeScheduler = async function (queueName) { 
  try {

    const response = await axios.post(process.env.SCHEDULER_BASE_URL+`schedulers/${queueName}/resume`);
    console.log("scheduler pause successfully:", response.data);
    const responseBody = {
      message: response.data.message,
      error: false,
      statusCode: 200
    };
    return responseBody;
  }catch (error) {
    console.error(`Error in pause scheduler ${error}`);
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}

exports.getAnalyticalReportByConsentHandle = async function (consentHandle) { 
  try {
    let result = await SequelizeDao.getAllData('FI_REQUEST', { consentHandle: consentHandle });
    console.log(`Wrapper function result: ${JSON.stringify(result)}`);

    const responseBody = {
      message: "Success",
      error: false,
      data: result,
      statusCode: 200 // Ensure a valid statusCode is always returned on success
    };

    return responseBody;

  } catch (error) {
    console.error(`Error in pause scheduler: ${error}`);
    const errorBody = {
      message: errorResponses?.[500]?.message || "Internal Server Error",
      error: errorResponses?.[500]?.error || true,
      errorMessage: error.message,
      statusCode: errorResponses?.[500]?.statusCode || 500, // Ensure a valid statusCode is always set on error
    };
    throw errorBody;
  }
}

exports.getAnalyticalReports = async function (realm,group) { 
  try {
    // Assuming that `getAllDataWithFI_RequestConsentHandle` is a valid method
    let result = await SequelizeDao.getAllDataWithFI_RequestConsentHandle(realm,group); // Pass conditions as needed
    console.log(`Wrapper function result: ${JSON.stringify(result)}`);

    const responseBody = {
      message: "Success",
      error: false,
      data: result,
      statusCode: 200 // Ensure a valid statusCode is always returned on success
    };

    return responseBody;

  } catch (error) {
    console.error(`Error in getAnalyticalReports: ${error}`);
    const errorBody = {
      message: errorResponses?.[500]?.message || "Internal Server Error",
      error: errorResponses?.[500]?.error || true,
      errorMessage: error.message,
      statusCode: errorResponses?.[500]?.statusCode || 500, // Ensure a valid statusCode is always set on error
    };
    throw errorBody;
  }
}
exports.getAllRealmConfig = async function (realm) {
  console.log("realm : ",realm);
  try {
    const getAllRealmConfig = await SequelizeDao.getAllData('REALM_CONFIG', { realm: realm });
    console.log(`getAllRealmConfig : ${JSON.stringify(getAllRealmConfig)}`);

    const responseBody = {
      message: "Success",
      error: false,
      data: getAllRealmConfig,
      statusCode: 200 
    };
    return responseBody;
  } catch (error) {
    console.error(`Error in getAllRealmConfig: ${error}`);
    const errorBody = {
      message: errorResponses?.[500]?.message || "Internal Server Error",
      error: errorResponses?.[500]?.error || true,
      errorMessage: error.message,
      statusCode: errorResponses?.[500]?.statusCode || 500, 
    };
    throw errorBody;
  } 
}

exports.updateRealConfig = async function(realm,body){
  try {
    console.log("updateRealConfig : service");
    await SequelizeDao.updateData(body, 'REALM_CONFIG', { realm: realm });

    const responseBody = {
      message: "Organization data updated Successsfully.",
      error: false,
      statusCode: 200 
    };
    return responseBody;

  } catch (error) {
    console.error(`An error occurred while updating realm config : ${JSON.stringify(error)}`);
    let errorBody = {
      message: errorResponses[400].message || "Internal Server Error",
      error: errorResponses[400].error || true,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode || 500,
    };
    throw errorBody;
  }
}

exports.postQueueJob = async function(body){
    try {
      console.log("postQueueJob : service");
      
      await sendMessage(body);
     
      const responseBody = {
        message: "Scheduler Created Successsfully.",
        error: false,
        statusCode: 200 
      };
      return responseBody;

    } catch (error) {
      console.log("ERROR IN sendMessage: ",error);
      let errorBody = {
        message: errorResponses[500].message || "Internal Server Error",
        error: errorResponses[500].error || true,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode || 500,
      };
      throw errorBody;
    }

}

exports.getFiRequestStatus = async function (sessionId, realm) {
  console.log("inside getFiRequestStatus servie");
  
  let response ;
  let getallData;
  let fiRquestStatus;
  try {
     getallData = await SequelizeDao.getAllData('CONSENT_REQUEST_REPLICA', { session_id: sessionId ,realm:realm});
    
      console.log("getallData : ",getallData[0]);
      const consentRquestData = getallData[0];
      console.log("consentRquestData :",consentRquestData);
      
      fiRquestStatus ={
      fiRquest_status: consentRquestData.dataValues?.firequest_status,
      session_id: consentRquestData.dataValues?.session_id,
      // consent_status:consentRquestData.dataValues?.consent_status,
      }
    console.log("getFiRequestStatus : ",fiRquestStatus);

  } catch (error) {
    let errorBody = {
      message: errorResponses[404].message || "Not Found",
      error: errorResponses[404].error || true,
      errorMessage: error.message,
      statusCode: errorResponses[404].statusCode || 404,
    };
    throw errorBody;
  }
   
 response = {
    data:fiRquestStatus,
    statusCode : 200,
    error : false
  }
  console.log("response : getFiRequestStatus",response);
  
  return response;
}
exports.postFiRequestinfo = async function(body) {
  try {
    console.log("body : body",body);
   
    if(body) {
      const responseBody = {
        message: "Successsfully.",
        error: false,
        statusCode: 200,
        resilt: body.data
      };
      return responseBody;
    }

  } catch (error) {
    console.log("ERROR IN sendMessage: ",error);
    let errorBody = {
      message: errorResponses[500].message || "Internal Server Error",
      error: errorResponses[500].error || true,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode || 500,
    };
    throw errorBody;
  }
} 

/* Auth Service */

exports.generateSession = async function (realmid, correlation_id, productId, payload) {
  const deferred = Q.defer();
  console.log("Inside session service - generate Session");
  console.log("PD 22", productId)
  console.log("ID", correlation_id)
  console.log("PAYLOAD : ",payload);
  const sessionid = uuid();
  console.log("sessionid : ",sessionid);
  const currentDate = new Date();
  const validTill = new Date(currentDate.getTime() + 1440 * 60000); // Adding 1440 minutes (24 hours)
  // const expirationDate = new Date(currentDate.getTime() + 1440 * 60000);
  // const TokenValidTill = Math.floor(expirationDate.getTime() / 1000);
  // const currentEpochTime = Math.floor(currentDate/ 1000);
const nextDayDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
const nextDayEpochTime = Math.floor(nextDayDate.getTime() / 1000);
console.log("Epoch Timestamp for Next Day: 41", nextDayEpochTime);
const nextDayReadableDate = new Date(nextDayEpochTime * 1000);
console.log("Date for Next Day: 43", nextDayReadableDate.toLocaleString());
// -------------------------------------------------
  console.log("VALID TILL SESSION :28 ",validTill);
// Get Organization Name 
let orgName;
try {
  const dbResp = await SequelizeDao.getRealmConfig('realm_config', realmid );
  console.log("dbResp for KC_CONFIG : ",dbResp);
  const realmData = dbResp[0];
  orgName = realmData.organizationName;
  console.log("organization Name : ",orgName);
} catch (error) {
  console.error("Error in get realmConfig:", error);
  const errorRes = {
    status: "error",
    statusCode: 404,
    message: error.message || "Organization name Not Found",
    error: error.error

  };
  deferred.reject(errorRes);
}

// 
  const payloads = {
    sub: sessionid,
    exp: nextDayEpochTime,
    aud: orgName,
    user_groups: payload.group,
    realm_id: realmid,
  }
  try {
    const auth = jwsSignature.jwsToken(payloads)
    console.log("JWSTOKEN 31 :", auth)
    // const auth = await keycloakHelper.getMasterToken(keycloakBody, realmid);
    console.log("auth resp:", auth);


    if (auth.error) {
      console.error("Authentication error:", auth);
      const errorRes = {
        status: "error",
        statusCode: 400,
        message: auth.error_description || "Unauthorized access.",
        error: auth.error

      };
      deferred.reject(errorRes);
    } else {

      const accessToken = auth.jwsToken;
      // const currentDate = new Date();
      // const validTill = new Date(currentDate.getTime() + 1440 * 60000); // Adding 1440 minutes (24 hours)
      const correlationId = correlation_id;
      const sessionStatus = "Open";
      const group = payload.group

      console.log("sessionID", sessionid);


      // Fetch product details using the productId
      // let productDetails;
      // try {
      //   const response = await axios.get(process.env.MW_URL + '/getProductDetailsById/' + productId);
      //   productDetails = response.data;
      // } catch (error) {
      //   console.error("Error fetching product details:", error);
      //   productDetails = null;
      // }

      const dbResp = await SequelizeDao.getDataByConditions('KC_CONFIG', { realm: realmid });
      let webUrl = dbResp[0].web_url; //After added to db uncomment this
      // let webUrl = 'http://vdcap-uat-consent.s3-website.ap-south-1.amazonaws.com';
      // let webUrl = 'http://localhost:4500';
      console.log("WEBURL : 71", webUrl);
      let redirectURL;

      if (productId) {
       
        redirectURL = `${webUrl}/consent-generation?sessionid=${sessionid}&correlationid=${correlationId}&auth=${accessToken}&productId=${productId}&group=${group}`;
        // redirectURL = ` http://localhost:4200/consent-generation?sessionid=${sessionid}&correlationid=${correlationId}&auth=${accessToken}&productId=${productId}&group=${group}`;
      } else {
        redirectURL = `${webUrl}/consent?sessionid=${sessionid}&correlationid=${correlationId}&auth=${accessToken}&group=${group}`;
      }


      const sessionBody = {
        sessionid: sessionid,
        validTill: validTill,
        redirectURL: redirectURL,
        sessionStatus: sessionStatus,
        correlationId: correlationId,
        successRedirectURL: payload.successRedirectURL,
        failureRedirectURL: payload.failureRedirectURL,
      };

      try {
        console.log("sessionbody", sessionBody);
        const sessionRes = await SequelizeDao.insertData(sessionBody, "SESSIONMGMNT");

        // Check if sessionRes is resolved
        if (sessionRes) {
          console.log("Session created:", sessionRes);
          const successRes = {
            status: "success in creating session",
            statusCode: 200,
            data: {
              sessionid: sessionid,
              validTill: validTill,
              redirectURL: redirectURL,
            },
          };
          deferred.resolve(successRes);
        } else {
          console.error("Session creation failed.");
          const errorRes = {
            status: "error",
            statusCode: 500,
            message: "Session creation failed.",
          };
          deferred.reject(errorRes);
        }
      } catch (error) {
        console.error("Error in sessionRes:", error);
        deferred.reject(error);
      }
    }
  } catch (error) {
    console.error("Error in generateSession:", error);
    deferred.reject(error);
  }

  return deferred.promise;
};

exports.validateSession = async function (sessionid, correlation_id, payload, group, redirectURL,realmId) {
  try {
    const signature = process.env.signatureSecret;
    console.log("signature : 170",signature);
    console.log("Inside session service - validate Session");
    console.log("sessionid:", sessionid);
    console.log("correlation_id", correlation_id);
    console.log("redirectURL : 149", redirectURL);
    console.log("group : ",group);
    
    // Check if the sessionid and correlation_id exist in the database
    const searchBy = {
      sessionid: sessionid,
      correlationId: correlation_id
    };

    console.log("search", searchBy);
    const dbResp = await SequelizeDao.getDataByConditions('SESSIONMGMNT', searchBy);
    console.log("dbresp:", dbResp);

    if (dbResp.length === 0) {
      const notFoundError = {
        status: "error",
        statusCode: 404,
        message: 'Session not found.'
      };
      throw notFoundError;
    }

    const sessionData = dbResp[0];
    const dataValues = sessionData.dataValues; //To get redirect url
    const redirectURL1 = dataValues.redirectURL;

    console.log("REDIRECTURL : GATEWAY : 162", redirectURL1);

    const parsedUrl = new URL(redirectURL1); //To get auth from url
    const authValue = parsedUrl.searchParams.get('auth');

    if (!authValue) {
      console.log('Auth parameter not found. 184');
      throw {
        status: "error",
        statusCode: 404,
        message: 'Auth not found.'
      };
    }

    try {
      // eslint-disable-next-line no-unused-vars
      const decoded = await new Promise((resolve, reject) => {
        // const isValid = jws.verify(token, 'HS256', secret);
        console.log("signature : 347 ",signature);
        jwt.verify(authValue, signature, (err, decoded) => {
          if (err) {
            console.log("INVALID TOKEN 185", err);
            return reject({
              status: "error",
              statusCode: 401,
              message: 'Unauthorised'
            });
          }
          console.log(`TOKEN IS VALID : 188 ,${JSON.stringify(decoded)}`);
          resolve(decoded);
        });
      });
  
      const validTill = new Date(sessionData.validTill);
      const currentTime = new Date();
      console.log("CURRENT TIME 189:", currentTime, "VALID TILL :", validTill);
  
      if (sessionData.sessionStatus !== "Open") {
        throw {
          status: "error",
          statusCode: 401,
          message: 'Invalid session status.'
        };
      }
  
      console.log("Valid : 210");
      console.log("INSIDE TRY :213");
      try {
        // const consentHandle = await axios.post(process.env.MW_URL + '/api/fiu/v1/consentsIFrame', payload, { headers: { 'group': group, 'redirecturl': redirectURL, 'sessionid': sessionid,'Authorization': authValue } }); //comment for mock
        const consentHandle = await exports.postBulkConsent(payload, group, realmId);
        // const consentHandle = {
          
        //     "message": "Bulk consent posting completed",
        //     "error": false,
        //     "statusCode": 200,
        //     "data": [
        //         {
        //             "message": "success in posting consent",
        //             "error": false,
        //             "statusCode": 200,
        //             "data": {
        //                 "Customer": {
        //                     "id": "8108546138@onemoney"
        //                 },
        //                 "ConsentHandle": "2740488d-a4ac-4944-866e-b9805f3bb2f1",
        //                 "ver": "2.0.0",
        //                 "timestamp": "2024-11-08T06:24:52.768Z",
        //                 "txnid": "7661a810-8046-4c8d-b69a-983d7845c0e9",
        //                 "data_consumer": {
        //                     "id": "GWEPSFIU001",
        //                     "type": "FIU"
        //                 },
        //                 "AABaseUrl": "https://aa-prod.onemoney.in",
        //                 "aggregator_id": "onemoney",
        //                 "AARedirectURL": "https://aa-prod.onemoney.in?ecreq=ROukDd/rdxzdYcI6CnZKAIHj0JoYD0HhrvyCaLG9n+ybxicqnparsWH8DFqfzI8hyE8XQn9YHahkH/cBM1ta18OB6gnAVZWwkny6ZywPJSN34rYNYwMThUr95V0njEOp1la8UhQIjLHNDEt4z33yB94UwOyp51h6jk6XxYqJ41gPwR8V4SsXwZc//sfBaAMWKcbUJJCIDdd+YpU2ybqDzrsZ3yhfJKDqOdBEWJM/5Yx0GAuuLjrpHsuZ9+Trs0uquD30244uVkJ1+9tFjyV2T4doJ7HEIqwkk7tBZN9ZC5A=&reqdate=081120240624768&fi=d290YWF2e2EABgM=",
        //                 "successRedirectURL": "https://growxcd.electronicpay.in/success"
        //             }
        //         }
        //     ]
        // };   
        console.log("CONSENT HANDLE : 217 ", consentHandle);
    
        if (consentHandle.statusCode === 200) {
          sessionData.sessionStatus = "Closed";
          console.log("sessionData.sessionStatus 250 :", sessionData.sessionStatus);
    
          const updateResp = await SequelizeDao.updateData(sessionData.dataValues, 'SESSIONMGMNT', searchBy);
    
          if (!updateResp) {
            console.log("INSIDE !UPDATE:  220");
            throw {
              status: "error",
              statusCode: 500,
              message: 'Failed to update session status.'
            };
          }
    
          const consentHandles = [];
          let AARedirectURL;
          
          consentHandle.data.forEach(item => {
              const handle = item.data.ConsentHandle; 
              consentHandles.push(handle);
              AARedirectURL = item.data.AARedirectURL;
          });
          
          console.log("consentHandle 2:",consentHandle.data);
          
          const successRes = {
              status: "success",
              statusCode: 200,
              data: {
                  successRedirectURL: consentHandle.data[0].data.successRedirectURL, 
                  consentHandle: consentHandles,
                  AARedirectURL: AARedirectURL
              }
          };
          console.log("successRes :",successRes);
          return successRes;

        } else {
          return {
            status: "error",
            statusCode: consentHandle.status,
            data: {
              failureRedirectURL: sessionData.failureRedirectURL
            },
            message: 'Internal Server error'
          };
        }
      } catch (error) {
        console.log("Error in consent call on middleware");
        throw{
          status: "error",
          statusCode: 500,
          
          message: error.message
        }
      }
     
    } catch (error) {
      console.error("Error in validateSession: ", error);
      if(error.statusCode ===401){
        return{
          status: "error",
          statusCode: 401,
          message: 'Unauthorised'
        }
      }else{
        return {
          status: "error",
          statusCode: 500,
          message: 'Internal Server error'
        };
      }
      
    }


  } catch (error) {
    console.error("Error in validateSession: 319", error);
    throw error;
  }
};

exports.getActiveAggregators = async function (realm) {
  console.log("INSIDE AGGREGATOR SERVICE");
  try {
    const aggregators = await SequelizeDao.getActiveAggregators('fiu_aggregator',realm); //, {status:"ACTIVE"}, [['aggregator_id', 'DESC']]

    if (aggregators.error) {
      const { statusCode, message } = aggregators.error;
      return {
        message: message,
        error: true,
        errorMessage: message,
        statusCode: statusCode,
      };
    }

    console.log("Aggregators", aggregators);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: aggregators,
      },
    };
    // await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in getAllAggregators ${error}`);
    let errorBody = {
      message: "Internal Server Error",
      error: true,
      errorMessage: error,
      statusCode: 500,
    };
    throw errorBody;
  }
};

exports.getDefaultAggregator = async function () {
  console.log("INSIDE default AGGREGATOR SERVICE");
  try {
    const aggregators = await SequelizeDao.getDefaultAggregators('aggregator'); //, {status:"ACTIVE"}, [['aggregator_id', 'DESC']]
    if (aggregators.error) {
      const { statusCode, message } = aggregators.error;
      return {
        message: message,
        error: true,
        errorMessage: message,
        statusCode: statusCode,
      };
    }

    console.log("Aggregators", aggregators);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: aggregators,
      },
    };
    // await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get default Aggregators ${error}`);
    let errorBody = {
      message: "Internal Server Error",
      error: true,
      errorMessage: error,
      statusCode: 500,
    };
    throw errorBody;
  }
};

exports.getProductDetailsbyProductId = async function (product_id) {
  try {
    let productDetails = await SequelizeDao.getProduct("product", product_id);

    if (!productDetails || productDetails.length === 0) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      error.errorMessage = "Product not found"; // Include a custom error message
      throw error;
    }

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: productDetails[0],
      },
    };
    // await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get product by id: ${error.message}`);
    throw error;
  }
};

exports.getAllMasterTableDetailsData = async function () {
  console.log("INSIDE getAllMasterTableDetailsData SERVICE");
  try {
    const allData = {};

    const fiTypes = await SequelizeDao.getConfiguration('FI_TYPE', {});
    const operators = await SequelizeDao.getConfiguration('OPERATORS', {});
    const consentTypes = await SequelizeDao.getConfiguration('CONSENT_TYPE', {});
    const consentModes = await SequelizeDao.getConfiguration('CONSENT_MODE', {});
    const purposeCodes = await SequelizeDao.getConfiguration('PURPOSE_CODE', {});
    const aggregators = await SequelizeDao.getConfiguration('AGGREGATOR', {});
    const fiStatus = await SequelizeDao.getConfiguration('FI_STATUS', {});

    if (fiTypes.error) {
      const { statusCode, message } = fiTypes.error;
      return {
        message: message,
        error: true,
        errorMessage: message,
        statusCode: statusCode,
      };
    }
    if (operators.error) {
      const { statusCode, message } = operators.error;
      return {
        message: message,
        error: true,
        errorMessage: message,
        statusCode: statusCode,
      };
    } if (consentTypes.error) {
      const { statusCode, message } = consentTypes.error;
      return {
        message: message,
        error: true,
        errorMessage: message,
        statusCode: statusCode,
      };
    } if (consentModes.error) {
      const { statusCode, message } = consentModes.error;
      return {
        message: message,
        error: true,
        errorMessage: message,
        statusCode: statusCode,
      };
    } if (purposeCodes.error) {
      const { statusCode, message } = purposeCodes.error;
      return {
        message: message,
        error: true,
        errorMessage: message,
        statusCode: statusCode,
      };
    }
    if (aggregators.error) {
      const { statusCode, message } = aggregators.error;
      return {
        message: message,
        error: true,
        errorMessage: message,
        statusCode: statusCode,
      };
    }

    if (fiStatus.error) {
      const { statusCode, message } = fiStatus.error;
      return {
        message: message,
        error: true,
        errorMessage: message,
        statusCode: statusCode,
      };
    }
    allData.fiTypes = fiTypes;
    allData.operators = operators;
    allData.consentTypes = consentTypes;
    allData.consentModes = consentModes;
    allData.purposeCodes = purposeCodes;
    allData.aggregators = aggregators;
    allData.fiStatus = fiStatus;


    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: allData,
      },
    };

    return responseBody;
  } catch (error) {
    console.error(`Error in get all master table data fiTypes ${error}`);
    let errorBody;
    errorBody = {
      message: "Internal Server Error",
      error: true,
      errorMessage: error,
      statusCode: 500,
    };
    throw errorBody;
  }
};

exports.getBrandConfigurations = async function () {
  console.log("INSIDE GET BRAND CONFIGURATION SERVICE");
  try {
    // const cacheKey = "configuration";
    // const reply = await GET_ASYNC(cacheKey);

    // if (reply) {
    //   const parsedData = JSON.parse(reply);
    //   return parsedData;
    // }
    const brandConfigs = await SequelizeDao.getConfiguration('configuration');

    if (brandConfigs.error) {
      const { statusCode, message } = brandConfigs.error;
      return {
        message: message,
        error: true,
        errorMessage: message,
        statusCode: statusCode,
      };
    }

    console.log("Brand Configuration", brandConfigs);

    const responseBody = {
      message: "Success",
      error: false,
      statusCode: 200,
      result: {
        data: brandConfigs,
      },
    };
    // await SET_ASYNC(cacheKey, JSON.stringify(responseBody), 'EX', 60);

    return responseBody;
  } catch (error) {
    console.error(`Error in get all purpose codes ${error}`);
    let errorBody;
    errorBody = {
      message: "Internal Server Error",
      error: true,
      errorMessage: error,
      statusCode: 500,
    };
    throw errorBody;
  }
};
exports.getBsaReportAuth = async function (auth, body) {
  try {
    const params = {
      SecretId: process.env.BSAAUTHARN
    };
    const getSecret = await getSecretKey(params);
    console.log('getSecret', getSecret);
    console.log('AUTH', auth);
    const authHeaderValue = auth.split(" ")
    const Buffer = require('buffer').Buffer;
    const decodedString = Buffer.from(authHeaderValue[1], 'base64').toString('utf-8');
    console.log(decodedString);
    const parts = decodedString.split(':');
    if (parts[0] === getSecret.CLIENTID && parts[1] === getSecret.CLIENTSECERT) {
      console.log('body', body);
      const reqBody = {
        excelUrl: body.data.excelUrl,
        referenceId: body.data.referenceId
      }
      console.log('reqBody', reqBody);
      const resp = await axios.post(process.env.MW_URL + '/api/fiu/v1/bsa/reportDownload', reqBody);
      console.log('resp', resp);
      if (resp.status === 200) {

        const successRes = {
          status: "success",
          statusCode: 200,
          message: "Acknowledged",
          // result: resp.data.result.data
        };
        return successRes;
      } else {
        const errorRes = {
          status: "error",
          statusCode: resp.status,
          data: {},
          message: resp.message
        };
        return errorRes;
      }
    } else {
      let errorBody = {
        message: "Unauthorized access",
        error: true,
        errorMessage: error,
        statusCode: 400,
      };
      throw errorBody;
    }
  } catch (error) {
    console.error("Axios Error :", error.response.data);

    const errorResponse = {
      error: error.response.data.error,
      statusCode: error.response.data.statusCode,
      message: error.response.data.message
    };

    return errorResponse;
  }
};

exports.getFiFetch =  async function (body,realm,group) { 
  var deferred = Q.defer();
  try {
    const data = await SequelizeDao.getFiFetchDataForBilling('FI_REQUEST_REPLICA',body,realm,group);
    console.log("data--->",data)

    const getCountOfTotalConsent = await SequelizeDao.getCountOfTotalConsents('CONSENT_REQUEST_REPLICA',body,realm,group);
    console.log("getCountOfTotalConsent--->",getCountOfTotalConsent)

    const getCountOfTotalFIFetch = await SequelizeDao.getCountOfTotalFIFetch('FI_REQUEST_REPLICA',body,realm,group);
    console.log("getCountOfTotalFIFetch--->",getCountOfTotalFIFetch)

    const getCountOfTotalActiveConsent = await SequelizeDao.getCountOfTotalActiveConsents('CONSENT_REQUEST_REPLICA',body,realm,group);
    console.log("getCountOfTotalActiveConsent--->",getCountOfTotalActiveConsent)

    const getCountOfFailedFiRequest = await SequelizeDao.getCountOfTotalFailedFIFetch('FI_REQUEST_REPLICA',body,realm,group);
    console.log("getCountOfFailedFiRequest--->",getCountOfFailedFiRequest)

    const getCountOfNoResponseFiRequest = await SequelizeDao.getCountOfTotalNoResponseFIFetch('FI_REQUEST_REPLICA',body,realm,group);
    console.log("getCountOfNoResponseFiRequest--->",getCountOfNoResponseFiRequest)

    const getCountOfExpiredConsent = await SequelizeDao.getCountOfExpiredConsent('CONSENT_REQUEST_REPLICA',body,realm,group);
    console.log("getCountOfExpiredConsent--->",getCountOfExpiredConsent)

    const billDate = new Date();

    const billDatemomentObject = moment(billDate);
    const formattedBillDate = billDatemomentObject.format('DD/MM/YYYY');

    const startDate = body.startDate

    const momentObject = moment(startDate);
    const formattedStartDate = momentObject.format('DD/MM/YYYY');

    const endDate = body.endDate

    const endDatemomentObject = moment(endDate);
    const formattedendDate = endDatemomentObject.format('DD/MM/YYYY');

    const FIUData = await SequelizeDao.getFiuID('DATA_CONSUMER',realm);
    console.log("FIUData--->",FIUData)

    // const responseBody = {
    //   message: "Success",
    //   error: false,
    //   statusCode: 200,
    //   result: {
    //     fiuDetails: {
    //       fiuID:FIUData[0].id,
    //       noOfConsent: getCountOfTotalConsent[0].count,
    //       noOfFIFetch: getCountOfTotalFIFetch[0].count,
    //       noOfActiveConsent: getCountOfTotalActiveConsent[0].count,
    //       noOfFailedFiRequest: getCountOfFailedFiRequest[0].count,
    //       noOfNoResponseFiRequest: getCountOfNoResponseFiRequest[0].count,
    //       billDate: formattedBillDate,
    //       startDate:formattedStartDate,
    //       endDate:formattedendDate
    //     },
    //     data: data,
    //   },
    // };
    let fiuName = ''
    let address = ''
    if(realm.includes('vdcap')) {
      fiuName = 'VDCAP Finserv Private Limited'
      address = 'UL 18, Samudra Complex, Near Girish Cold Drink Cross Roads, Chimanlal Girdharlal Rd, Ahmedabad, Gujarat 380009'
    }
    if(realm.includes('growxcd')) {
      fiuName = 'GrowXCD Finance Private Limited'
      address = 'First Floor, GR Complex, 408, Annexe, Anna Salai, Nandanam, Chennai, Tamil Nadu 600035'
    }
    
    data.map((res)=>{
      const endDatemomentObject = moment(res.timestamp);
      const formattedendDate = endDatemomentObject.format('DD/MM/YYYY');
      res.timestamp = formattedendDate
    })

    const totalAccounts =  await data
        .filter(item => (item.session_status === "COMPLETED" || item.session_status === "ACTIVE") && item.no_of_accounts)
        .reduce((sum, item) => sum + Number(item.no_of_accounts), 0);

    console.log("totalAccounts---->",totalAccounts)

    const consolidatedJson =  {
      fiuDetails: {
        fiuName: fiuName,
        address:address,
        fiuID: FIUData[0].id,
        noOfConsent: getCountOfTotalConsent[0].count,
        noOfFIFetch: getCountOfTotalFIFetch[0].count,
        noOfActiveConsent: getCountOfTotalActiveConsent[0].count,
        noOfFailedFiRequest: getCountOfFailedFiRequest[0].count,
        noOfExpiredConsent: getCountOfExpiredConsent[0].count,
        noOfNoResponseFiRequest: getCountOfNoResponseFiRequest[0].count,
        billDate: formattedBillDate,
        startDate:formattedStartDate,
        endDate:formattedendDate,
        totalAccounts: totalAccounts
      },
      data: data,
    }
    console.log("consolidatedJson----->",consolidatedJson)
    const pdfReport = await client.render({
      template: {
        name: 'FIFetch-report-test'
      },
      data: consolidatedJson
    });
    console.log("pdfReport--->",pdfReport)
    const bodyBuffer = await pdfReport.body()
    // Set the appropriate response headers for downloading the PDF
    // res.set('Content-Type', 'application/pdf');
    // res.set('Content-Disposition', 'attachment; filename="report.pdf"');


    // console.log("typeof", typeof(bodyBuffer));
    // fs.writeFileSync('report.pdf', bodyBuffer);

    let responseBody;
    responseBody = {
      message: 'success',
      error: false,
      statusCode: 200,
      result: {
        data: bodyBuffer,
      }
    }

    deferred.resolve(responseBody);

  }  catch (error) {
    console.error(`Error in xmlConverter: ${error}`);
    // throw new Error('An error occurred while generating CSV');
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    deferred.reject(errorBody);
  }
  return deferred.promise;
}

exports.postBulkFiRequest = async function (body,realm,group) {
  try{
    //check empty
    if(!body.length) {
      let errorBody = {
        message: "Bad Request",
        error: true,
        // eslint-disable-next-line no-dupe-keys
        message: "Invalid request",
        statusCode: 400,
      };
      throw errorBody;
    }

    let count = 0
    console.log("body",body)
    for (let i = 0; i < body.length; i++) { 
      if(body[i].length != 36) {
        count = count +1
      }
    }
    console.log("count-->",count)
    if(count>0) {
      let errorBody = {
        message: "Bad Request",
        error: true,
        // eslint-disable-next-line no-dupe-keys
        message: "Invalid request",
        statusCode: 400,
      };
      throw errorBody;
    }
    
    const reqBody = [...new Set(body)];
    console.log("bodyBeforecondition",body)
    if(body.length) {
      let indexesToRemove = [];
      //check dublicate
      const result = [...new Set(body)];
      body = result;
      // const dublicate = new Set(body).size !== body.length;

      // if(dublicate) {
      //   let errorBody = {
      //     message: "Bad Request",
      //     error: true,
      //     // eslint-disable-next-line no-dupe-keys
      //     message: "Invalid request",
      //     statusCode: 400,
      //   };
      //   throw errorBody;
      // }
    
    
      var noData = 0;
      var consentStatusPending = 0;
      // var consentPeriodic = 0;
      for (let i = 0; i < body.length; i++) {
        console.log("consent_handle", body[i]);
        const response = await SequelizeDao.findOnee("CONSENT_REQUEST_REPLICA", {
          consent_handle: body[i], realm: realm, group: group 
        });

        console.log("response", response?.dataValues);
        console.log("response",response)

        if(response && response?.dataValues?.consent_status === "PENDING") {
          consentStatusPending = consentStatusPending + 1;
          indexesToRemove.push(i);
        }

        if(response == null) {
          noData = noData +1;
          indexesToRemove.push(i);
        }

        if (response && response?.dataValues?.firequest_status === 'DONE' && response?.dataValues?.fetch_type !== 'PERIODIC') {
          indexesToRemove.push(i);
        }

        // if (response && response?.dataValues?.firequest_status === 'DONE' && response?.dataValues?.fetch_type === 'PERIODIC') { 
        //   consentPeriodic = consentPeriodic + 1;
        // }
      }

      // Remove elements in reverse order to avoid index shifting issues
      for (let i = indexesToRemove.length - 1; i >= 0; i--) {
        body.splice(indexesToRemove[i], 1);
      }
    }
    console.log("consentStatusPending",consentStatusPending)

    // if(consentStatusPending > 0) {
      // let errorBody = {
      //   message: "Bad Request",
      //   error: true,
      //   // eslint-disable-next-line no-dupe-keys
      //   message: "Invalid request",
      //   statusCode: 400,
      // };
      // throw errorBody;
    // } 
    // if(consentPeriodic == 0) {
    //   const exist = await SequelizeDao.getCheckConsentHandle(body)

      // if(exist.length > 0) {
      //   let errorBody = {
      //     message: "Bad Request",
      //     error: true,
      //     // eslint-disable-next-line no-dupe-keys
      //     message: "Already FI request",
      //     statusCode: 400,
      //   };
      //   throw errorBody;
      // }
    // }
    
    console.log("noData--->",noData)
    // if(noData > 0) {
      // let errorBody = {
      //   message: "Bad Request",
      //   error: true,
      //   // eslint-disable-next-line no-dupe-keys
      //   message: "consentHandle not found",
      //   statusCode: 400,
      // };
      // throw errorBody;
    // }

    
    console.log("bodyafterCondition------>",body)
    let id = uuid();
    let now = new Date();
    let timestamp = now.toISOString();
    // if(body.length) {
      const data = {
        uuid:id,
        realm:realm,
        group:group,
        data:body
      }
      console.log("data--->",data)
      const response = await fiRequestAddQueue.fiRequestAddQueue(data)
  
      const requestBody = {
        id:id,
        req_body:[
          {
            "consentHandles": reqBody
          }
        ],
        realm:realm,
        group:group,
        timestamp:timestamp
      }
      console.log("requestBody---->",requestBody)

      const inserData = await SequelizeDao.insertData(requestBody, "BULK_FIREQUEST");
      console.log("inserData---->",inserData)

      console.log("test",response)
      let responseBody;
      responseBody = {
        message: 'acknowledgement',
        error: false,
        statusCode: 200,
        result: {
          data: {
            id:id
          }
        }
      }
      return responseBody
    // }else {
    //   let errorBody = {
    //     message: "Bad Request",
    //     error: true,
    //     // eslint-disable-next-line no-dupe-keys
    //     message: "Already FI request",
    //     statusCode: 400,
    //   };
    //   throw errorBody;
    // }

  }catch(error) {
    if(error.statusCode ===400) {
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
    }else {
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    }
  }
}

exports.postBulkFiRequestStatus = async function (req_id,realm,group) {
  try{
    if(!req_id) {
      let errorBody = {
        message: "Bad Request",
        error: true,
        errorMessage: "Invalid request",
        statusCode: 400,
      };
      throw errorBody;
    }

    const modify_realm = realm.replace(/^"|"$/g, '')
    console.log("modify_realm",modify_realm)
    const response = await SequelizeDao.findOnee("BULK_FIREQUEST",{id:req_id, realm:modify_realm, group:group})
    console.log("response-->",response)
    if(response == null){
      let errorBody = {
        message: "Bad Request",
        error: true,
        errorMessage: "N0 Consent handle again this id",
        statusCode: 400,
      };
      throw errorBody;
    }
    const body = JSON.parse(JSON.stringify(response.dataValues.req_body))[0].consentHandles;
    console.log("body--->",typeof body)
    const allResponse = []
    for(let consentHandle of body) {
      try{
      const response = await SequelizeDao.findOnee("CONSENT_REQUEST_REPLICA",{consent_handle:consentHandle, realm:realm, group:group})
      console.log("response---->",response)
      allResponse.push({
        consent_handle:consentHandle,
        session_id: response.session_id,
        firequest_status: response.firequest_status
      })
      }catch(error) {
        console.log("error--->",error)
        allResponse.push({
          consent_handle:consentHandle,
          session_id: null,
          firequest_status: "failed"
        })
      }
    }
    // console.log("test",response)
    let responseBody;
    responseBody = {
      message: 'success',
      error: false,
      statusCode: 200,
      result: {
        data: allResponse,
      }
    }
    return responseBody

  }catch(error) {
    let errorBody = {
      message: errorResponses[500].message,
      error: errorResponses[500].error,
      errorMessage: error.message,
      statusCode: errorResponses[500].statusCode,
    };
    throw errorBody;
  }
}
/*END */ 

