const { Sequelize } = require('sequelize');
const sequelizeConfig = require('../config');
const FIU_model = require('../FIU.model');
const { Op } = require('sequelize');
const sequelize = new Sequelize(sequelizeConfig.development);
const { errorResponses } = require('../utils/messageCode.json')
const moment = require('moment'); // Optional: For date manipulation
/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */

exports.insertData = function (body, modelName) {
  const Model = FIU_model[modelName]; // Get the specified model based on the modelName

  if (!Model) {
    throw new Error(`Model '${modelName}' does not exist.`);
  }
  return Model.create(body)
    .then(function (createdRecord) {
      console.log('Record created:', createdRecord);
      return createdRecord;
    })
    .catch(function (error) {
      console.log(`${modelName} insertData error: ${error}`);
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};

exports.updateData = function (body, modelName, condition) {
  const Model = FIU_model[modelName]; // Get the specified model based on the modelName

  if (!Model) {
    throw new Error(`Model '${modelName}' does not exist.`);
  }

  return Model.update(body, {
    where: condition
  })
    .then(function (updatedRows) {
      console.log('Rows updated:', updatedRows);
      return updatedRows;
    })
    .catch(function (error) {
      console.log(error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });
};


exports.findOnee = function (modelName, condition) {
  const Model = FIU_model[modelName]; // Get the specified model based on the modelName

  if (!Model) {
    throw new Error(`Model '${modelName}' does not exist.`);
  }
  
  return Model.findOne({
    where: condition
  })
    .then(function (result) {
      console.log('Rows Found:', result);
      return result;
    })
    .catch(function (error) {
      console.log(error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });
};

exports.getAllData = function (modelName, condition, orderBy) {
  const Model = FIU_model[modelName]; // Get the specified model based on the modelName

  if (!Model) {
    throw new Error(`Model '${modelName}' does not exist.`);
  }

  const queryOptions = {
    where: condition
  };

  if (orderBy) {
    queryOptions.order = orderBy;
  }

  return Model.findAll(queryOptions)
    .then(function (result) {
      return result;
    })
    .catch(function (error) {
      console.log("error in getAllData", error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
};


exports.getAllDataWithCounts = function (conditions) {
  const Model = FIU_model['CONSENT_REQUEST_REPLICA']; // Get the specified model based on the modelName

  if (!Model) {
    throw new Error(`Model '${modelName}' does not exist.`);
  }

  return Model.findAll({
    where: conditions ,
    attributes: ['consent_status', [sequelize.fn('COUNT', sequelize.col('consent_status')), 'status_count']],
    group: ['consent_status'],
    raw: true
  })
    .then(function (results) {

      // Convert results to JSON
      JSON.stringify(results, null, 2);
      // console.log("Data retrieved:", jsonData);

      return results;
    })
    .catch(function (error) {
      console.log("error in getAllDataWithCounts", error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};

exports.getAllDataWithFI_RequestCounts = function (conditions) {
  const Model = FIU_model['FI_REQUEST_REPLICA']; // Get the specified model based on the modelName

  if (!Model) {
    throw new Error(`Model '${modelName}' does not exist.`);
  }

  return Model.findAll({
    where: conditions ,
    attributes: ['fi_status', [sequelize.fn('COUNT', sequelize.col('fi_status')), 'status_count']],
    group: ['fi_status'],
    raw: true
  })
    .then(function (results) {

      // Convert results to JSON
      JSON.stringify(results, null, 2);
      // console.log("Data retrieved:", jsonData);

      return results;
    })
    .catch(function (error) {
      console.log("error in getAllDataWithCounts", error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};

exports.getDataByCondition = async function (modelName, attributes) {
  const Model = FIU_model[modelName];
  if (!Model) {
    console.error(`Model '${modelName}' not found.`);
    return;
  }

  // try {
  //   const results = await Model.findAll({ attributes });
  //   console.log(`${modelName} IDs:`, results.map((result) => result.get({ plain: true })));
  // } catch (error) {
  //   console.error(`Error querying ${modelName} table:`, error);
  // }
  return Model.findAll({ attributes })
    .then(function (result) {
      // console.log("Data retrieved:", JSON.stringify(result, null, 2));
      JSON.stringify(result, null, 2)
      // console.log('Data retrieved:', result.dataValues);
      return result;
    })
    .catch(function (error) {
      console.log(error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
}

exports.getCount = function (modelName, conditions) {
  const Model = FIU_model[modelName];
  if (!Model) {
    console.error(`Model '${modelName}' not found.`);
    return;
  }
  return Model.count({ where: conditions })
    .then(function (count) {
      console.log('Count:', count);
      return count;
    })
    .catch(function (error) {
      console.error('Error:', error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};

exports.getPaginatedFIrequest = function (filters, limit, offset) {
  const Model = FIU_model['FI_REQUEST_REPLICA'];
  console.log("Inside getFiRequestsByFilters DAO");

  const queryOptions = {
    where: {},
    limit: limit,
    offset: offset,
    order: [['timestamp', 'DESC']]
  };

  if (filters.hasOwnProperty('FIRequest_id')) {
    queryOptions.where.FIRequest_id = filters.FIRequest_id;
  }
  if (filters.hasOwnProperty('FIDataRange')) {
    queryOptions.where.FIDataRange = filters.FIDataRange;
  }
  if (filters.hasOwnProperty('timestamp')) {
    queryOptions.where.timestamp = filters.timestamp;
  }
  if (filters.hasOwnProperty('sessionId')) {
    queryOptions.where.sessionId = filters.sessionId;
  }
  if (filters.hasOwnProperty('consentId')) {
    queryOptions.where.consentId = filters.consentId;
  }
  if (filters.hasOwnProperty('aggregator_id')) {
    queryOptions.where.aggregator_id = filters.aggregator_id;
  }
  if (filters.hasOwnProperty('customer_id')) {
    queryOptions.where.customer_id = { [Op.contains]: [filters.customer_id] }; //`%${filters.customer_id}%`
  }
  if (filters.hasOwnProperty('txnid')) {
    queryOptions.where.txnid = filters.txnid;
  }
  if (filters.hasOwnProperty('FIStatus')) {
    queryOptions.where.FIStatus = { [Op.contains]: [filters.FIStatus] }; //`%${filters.FIStatus}%`
  }

  return Model.findAndCountAll(queryOptions)
    .then(function (result) {
      const response = {
        count: result.count,
        data: result.rows
      };
      return response;
    })
    .catch(function (error) {
      console.error('Error:', error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};

exports.getFiRequestsByFilters = function (filters, group, realm) {
  console.log("Inside getFiRequestsByFilters DAO");
  const Model = FIU_model['FI_REQUEST_REPLICA'];
  let queryOptions;
  if (group == 'admin') {
    queryOptions = {
      where: { realm: realm },
      order: [['timestamp', 'DESC']]
    };
  } else {
    queryOptions = {
      where: { group: group , realm: realm },
      order: [['timestamp', 'DESC']]
    };
  }

  if (filters.hasOwnProperty('FIRequest_id')) {
    queryOptions.where.FIRequest_id = filters.FIRequest_id;
  }
  if (filters.hasOwnProperty('FIDataRange')) {
    queryOptions.where.FIDataRange = filters.FIDataRange;
  }
  if (filters.hasOwnProperty('timestamp')) {
    queryOptions.where.timestamp = filters.timestamp;
  }
  if (filters.hasOwnProperty('sessionId')) {
    queryOptions.where.sessionId = filters.sessionId;
  }
  if (filters.hasOwnProperty('consentId')) {
    queryOptions.where.consentId = filters.consentId;
  }
  if (filters.hasOwnProperty('aggregator_id')) {
    queryOptions.where.aggregator_id = filters.aggregator_id;
  }
  if (filters.hasOwnProperty('customer_id')) {
    queryOptions.where.customer_id = { [Op.contains]: [filters.customer_id] }; //`%${filters.customer_id}%`
  }
  if (filters.hasOwnProperty('txnid')) {
    queryOptions.where.txnid = filters.txnid;
  }
  if (filters.hasOwnProperty('FIStatus')) {
    queryOptions.where.FIStatus = { [Op.contains]: [filters.FIStatus] }; //`%${filters.FIStatus}%`
  }

  return Model.findAll(queryOptions)
    .then(function (response) {
      return response;
    })
    .catch(function (error) {
      console.error('Error:', error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};

exports.getPaginatedConsents = function (filters, limit, offset) {
  console.log("Inside getPaginatedConsents DAO");
  const Model = FIU_model['CONSENT_REQUEST_REPLICA'];

  const queryOptions = {
    where: {},
    limit: limit,
    offset: offset,
    order: [['timestamp', 'DESC']]
  };

  if (filters.hasOwnProperty('DataConsumer')) {
    queryOptions.where.DataConsumer = filters.DataConsumer;
  }
  if (filters.hasOwnProperty('consentId')) {
    queryOptions.where.consentId = filters.consentId;
  }
  if (filters.hasOwnProperty('timestamp')) {
    queryOptions.where.timestamp = filters.timestamp;
  }
  if (filters.hasOwnProperty('Purpose.code')) {
    queryOptions.where.Purpose.code = filters.Purpose.code;
  }
  if (filters.hasOwnProperty('fiTypes')) {
    // Use contains filter to filter on an array column
    queryOptions.where.fiTypes = filters.fiTypes;
  }
  if (filters.hasOwnProperty('FIDataRange')) {
    queryOptions.where.FIDataRange = filters.FIDataRange;
  }
  if (filters.hasOwnProperty('consent_request_id')) {
    queryOptions.where.consent_request_id = filters.consent_request_id;
  }
  if (filters.hasOwnProperty('customer_id')) {
    queryOptions.where.customer_id = filters.customer_id;
  }
  if (filters.hasOwnProperty('consentStatus')) {
    queryOptions.where.consentStatus = filters.consentStatus;
  }

  return Model.findAndCountAll(queryOptions)
    .then(function (result) {
      const response = {
        count: result.count,
        data: result.rows
      };
      return response;
    })
    .catch(function (error) {
      console.error('Error:', error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};

exports.getConsentsByFilters = function (filters, group,realm) {
  console.log("Inside getConsentsByFilters DAO");
  const Model = FIU_model['CONSENT_REQUEST_REPLICA'];
  let queryOptions;
  if (group == 'admin') {
    queryOptions = {
      where: {realm: realm},
      order: [['timestamp', 'DESC']]
    };
  } else {
    queryOptions = {
      where: { group: group , realm: realm},
      order: [['timestamp', 'DESC']]
    };
  }

  if (filters.hasOwnProperty('DataConsumer')) {
    queryOptions.where.DataConsumer = filters.DataConsumer;
  }
  if (filters.hasOwnProperty('consentId')) {
    queryOptions.where.consentId = filters.consentId;
  }
  if (filters.hasOwnProperty('timestamp')) {
    queryOptions.where.timestamp = filters.timestamp;
  }
  if (filters.hasOwnProperty('Purpose.code')) {
    queryOptions.where.Purpose.code = filters.Purpose.code;
  }
  if (filters.hasOwnProperty('fiTypes')) {
    queryOptions.where.fiTypes = filters.fiTypes;
  }
  if (filters.hasOwnProperty('consent_request_id')) {
    queryOptions.where.consent_request_id = filters.consent_request_id;
  }
  if (filters.hasOwnProperty('customer_id')) {
    queryOptions.where.customer_id = { [Op.contains]: [filters.customer_id] }; //`%${filters.customer_id}%`
  }
  if (filters.hasOwnProperty('consentStatus')) {
    queryOptions.where.consentStatus = filters.consentStatus;
  }

  return Model.findAll(queryOptions)
    .then(function (response) {
      return response;
    })
    .catch(function (error) {
      console.error('Error:', error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};

exports.deleteData = function (modelName, condition) {
  const Model = FIU_model[modelName]; // Get the specified model based on the modelName

  if (!Model) {
    throw new Error(`Model does not exist.`);
  }

  return Model.destroy({
    where: condition
  })
    .then(function (deletedRows) {
      console.log(`Deleted rows from ${modelName} where`, condition);
      return deletedRows;
    })
    .catch(function (error) {
      console.log(`Error in deleteData for ${modelName}`, error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};


exports.getWebUrl = function (modelName, condition) {
  const Model = FIU_model[modelName]; // Get the specified model based on the modelName

  if (!Model) {
    throw new Error(`Model '${modelName}' does not exist.`);
  }

  const queryOptions = {
    where: condition
  };

  return Model.findAll(queryOptions)
    .then(function (result) {
      return result;
    })
    .catch(function (error) {
      console.log("error in getWebUrl", error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
    });
}


exports.getConsentTrail = async function (correlation_id) {
  const Model = FIU_model['CONSENT_REQUEST_REPLICA'];

  const queryOptions = {
    attributes: ['consent_status', 'timestamp'],
    include: [{
      model: FIU_model['FI_REQUEST_REPLICA'],
      attributes: ['fi_status', 'timestamp'],
      required: true
    }],
    where: { correlation_id: correlation_id },
    raw: true
  };

  return Model.findAll(queryOptions)
    .then(function (result) {
      JSON.stringify(result, null, 2)
      return result;
    })
    .catch(function (error) {
      console.log(error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
}


exports.fiTypesCount = function (conditions) {
  const Model = FIU_model['CONSENT_REQUEST_REPLICA']; // Get the specified model based on the modelName
 
  if (!Model) {
    throw new Error(`Model '${modelName}' does not exist.`);
  }

  return Model.findAll({
    where: conditions ,
    attributes: ['fi_types',[sequelize.fn('COUNT', sequelize.col('fi_types')), 'fi_types_count']],
    group: ['fi_types'],
    raw: true
  })
    .then(function (results) {

      // Convert results to JSON
      JSON.stringify(results, null, 2);
      // console.log("Data retrieved:", jsonData);

      return results;
    })
    .catch(function (error) {
      console.log("error in getAllDataWithCounts", error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};


exports.getAggregatorsByFiRequest = function (conditions) {
  const Model = FIU_model['FI_REQUEST_REPLICA']; // Get the specified model based on the modelName

  return Model.findAll({
    where: conditions ,
    attributes: ['fi_types', 'aggregator_id',
    [
      sequelize.literal('COUNT(*)'), 
      'fi_types_aggregator_count'
    ]],
    group: ['fi_types','aggregator_id'],
    raw: true
  })
    .then(function (results) {

      // Convert results to JSON
      JSON.stringify(results, null, 2);
      // console.log("Data retrieved:", jsonData);

      return results;
    })
    .catch(function (error) {
      console.log("error in getAllDataWithCounts", error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};


exports.getAggregatorsByConsent = function (group,realm) {
  const Model = FIU_model['CONSENT_REQUEST_REPLICA']; // Get the specified model based on the modelName
  let condition;
    if (group == 'admin') {
      condition = {realm:realm};
    } else {
      condition = {
        group: group,
        realm: realm
      };
    }
  return Model.findAll({
    where: condition ,
    attributes: ['fi_types', 'aggregator_id',
    [
      sequelize.literal('COUNT(*)'), 
      'fi_types_aggregator_count'
    ]],
    group: ['fi_types','aggregator_id'],
    raw: true
  })
    .then(function (results) {

      // Convert results to JSON
      JSON.stringify(results, null, 2);
      // console.log("Data retrieved:", jsonData);

      return results;
    })
    .catch(function (error) {
      console.log("error in getAllDataWithCounts", error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};


exports.getConsentExpiryCount = function (group,realm) {
  const Model = FIU_model['CONSENT_REQUEST_REPLICA']; // Get the specified model based on the modelName
  let condition;
    if (group == 'admin') {
      condition = {
        consent_status: 'EXPIRED',
        realm: realm
      };
    } else {
      condition = {
        group: group,
        consent_status: 'EXPIRED',
        realm: realm
      };
    }
  return Model.findAll({
    where: condition,
    attributes: [[sequelize.literal('DATE(consent_expiry)'), 'consent_expiry_date'],[sequelize.fn('COUNT', sequelize.col('consent_expiry')), 'consent_expiry_count']],
    group: [sequelize.literal('DATE(consent_expiry)')],
    raw: true
  })
    .then(function (results) {

      // Convert results to JSON
      JSON.stringify(results, null, 2);
      // console.log("Data retrieved:", jsonData);

      return results;
    })
    .catch(function (error) {
      console.log("error in getAllDataWithCounts", error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};


exports.getFiTypesByFiRequest = function (conditions) {
  const Model = FIU_model['FI_REQUEST_REPLICA']; // Get the specified model based on the modelName

  return Model.findAll({
    where: conditions,
    attributes: ['fi_types',[sequelize.literal('DATE(fi_data_range_from)'),'fi_data_range_from'],[sequelize.fn('COUNT', sequelize.col('fi_types')), 'fi_types_count']],
    group: ['fi_types',sequelize.literal('DATE(fi_data_range_from)')],
    raw: true
  })
    .then(function (results) {

      // Convert results to JSON
      JSON.stringify(results, null, 2);
      // console.log("Data retrieved:", jsonData);

      return results;
    })
    .catch(function (error) {
      console.log("error in getAllDataWithCounts", error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};


exports.findOrCreate = function (modelName, condition, body) {
  const Model = FIU_model[modelName]; // Get the specified model based on the modelName

  if (!Model) {
    throw new Error(`Model '${modelName}' does not exist.`);
  }
  
  return Model.findOrCreate({
    where: condition,
    defaults: body
  })
    .then(function (result) {
      console.log('Rows Found:', result);
      return result;
    })
    .catch(function (error) {
      console.log(error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw err;
    });
};

exports.getAllDataWithFI_RequestConsentHandle = function (realm,group) {
  const Model = FIU_model['FI_REQUEST']; // Get the specified model

  if (!Model) {
    throw new Error(`Model 'FI_REQUEST' does not exist.`);
  }

  // Calculate the date 6 months ago from today
  const sixMonthsAgo = moment().subtract(6, 'months').toDate();

  return Model.findAll({
    attributes: [
      'consentHandle',
      'txnid',
      'FIDataRange',
      'Consent',
      'timestamp',
      'ver',
      'sessionId',
      'correlation_id',
      'consentId',
      'FIRequest_id',
      'aggregator_id',
      'customer_id',
      'FIStatus',
      'sessionStatus',
      'FIStatusResponse',
      'realm',
      'group',
      'queueid',
      'comparison_status',
      'customer_ref'
    ],
    where: {
      timestamp: {
        [Op.gte]: sixMonthsAgo // Filter to return only the last 6 months of data
      },
      group:group,
      realm:realm
    },
    order: [['timestamp', 'DESC']],
    raw: true
  })
    .then(function (results) {
      // Group the results by consentHandle
      const groupedResults = results.reduce((acc, curr) => {
        const { consentHandle } = curr;
        if(consentHandle) {
          if (!acc[consentHandle]) {
            acc[consentHandle] = [];
          }
          acc[consentHandle].push(curr);
        }
        return acc;
      }, {});

      console.log("Grouped Data by consentHandle:", JSON.stringify(groupedResults, null, 2));
      const formattedData = formatDataForTable(groupedResults);
      return formattedData;
    })
    .catch(function (error) {
      console.log("Error in getAllDataWithFI_RequestConsentHandle", error);
      let errorBody = {
        message: errorResponses[500]?.message || "Internal Server Error",
        error: errorResponses[500]?.error || true,
        errorMessage: error.message,
        statusCode: errorResponses[500]?.statusCode || 500,
      };
      throw errorBody;
    });
};

/* Auth Dao*/ 
exports.getRealmConfig = function (tableName, realmId) {
  const condition = `realm = '${realmId}'`;
  return sequelize.query(`SELECT * FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getRealmConfig data", err);
      throw err;
    });
};
exports.getDataByConditions = async function (modelName, attributes) {
  const Model = FIU_model[modelName];
  if (!Model) {
    console.error(`Model '${modelName}' not found.`);
    return;
  }
  return Model.findAll({ where: attributes })
    .then(function (result) {
      JSON.stringify(result, null, 2)
      return result;
    })
    .catch(function (err) {
      console.log(err);
      throw err;
    });
}
exports.getActiveAggregators = function (tableName,realm) {
  // let queryCondition = JSON.stringify(condition)
  // const condition = `status = 'ACTIVE'`;
  const condition = `"realmName" = '${realm}'`
  const orderBy = 'aggregator_id DESC';
  return sequelize.query(`SELECT * FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition} ORDER BY ${orderBy}`, { // WHERE ${condition} ORDER BY ${orderBy}
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};

exports.getDefaultAggregators = function (tableName) {
  // let queryCondition = JSON.stringify(condition)
  const condition = `default_aggregator = true`;
  return sequelize.query(`SELECT * FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { // WHERE ${condition} ORDER BY ${orderBy}
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in get default aggregator", err);
      throw err;
    });
};
exports.getProduct = function (tableName, productId) {
  // let queryCondition = JSON.stringify(condition)
  const condition = `product_id = '${productId}'`;
  // eslint-disable-next-line no-unused-vars
  const orderBy = 'aggregator_id DESC';
  return sequelize.query(`SELECT * FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};
exports.getConfiguration = function (tableName) {
  return sequelize.query(`SELECT * FROM ${sequelizeConfig.development.schema}.${tableName}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};

/* END Auth Dao*/ 
exports.deleteFIData_publicSchema = function (modelName, condition) {
  const Model = modelName; // Get the specified model based on the modelName

  if (!Model) {
    throw new Error(`Model does not exist.`);
  }

  return Model.destroy({
    where: condition
  })
    .then(function (deletedRows) {
      console.log(`Deleted rows from ${modelName} where`, condition);
      return deletedRows;
    })
    .catch(function (error) {
      console.log(`Error in deleteData for ${modelName}`, error);
      let errorBody = {
        message: errorResponses[500].message,
        error: errorResponses[500].error,
        errorMessage: error.message,
        statusCode: errorResponses[500].statusCode,
      };
      throw errorBody;
      // throw error;
    });
};

function formatDataForTable(groupedData) {
  return Object.entries(groupedData).map(([consentHandle, records]) => ({
    consentHandle,
    records
  }));

  
}

exports.getFiFetchDataForBilling = function (tableName, body,realm,group) {
  // let queryCondition = JSON.stringify(condition)
  const condition = `timestamp >= '${body.startDate}' AND timestamp <= '${body.endDate}' AND realm = '${realm}' AND "group" = '${group}'`;

  return sequelize.query(`SELECT timestamp, customer_id, consent_handle, session_id, aggregator_id, fi_types, session_status, no_of_accounts FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};

exports.getCountOfTotalConsents = function (tableName, body,realm,group) {
  // let queryCondition = JSON.stringify(condition)
  const condition = `timestamp >= '${body.startDate}' AND timestamp <= '${body.endDate}' AND realm = '${realm}' AND "group" = '${group}'`;

  return sequelize.query(`SELECT COUNT(*) FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};

exports.getCountOfTotalFIFetch = function (tableName, body,realm,group) {
  // let queryCondition = JSON.stringify(condition)
  const condition = `timestamp >= '${body.startDate}' AND timestamp <= '${body.endDate}' AND realm = '${realm}' AND "group" = '${group}' AND session_status = 'COMPLETED'`;

  return sequelize.query(`SELECT COUNT(*) FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};

exports.getFiuID = function (tableName, realm) {
  // let queryCondition = JSON.stringify(condition)
  const condition = `realm = '${realm}'`;

  return sequelize.query(`SELECT * FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};

exports.getCountOfTotalActiveConsents = function (tableName, body,realm,group) {
  // let queryCondition = JSON.stringify(condition)
  const condition = `timestamp >= '${body.startDate}' AND timestamp <= '${body.endDate}' AND realm = '${realm}' AND "group" = '${group}' AND "consent_status"='ACTIVE'`;

  return sequelize.query(`SELECT COUNT(*) FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};

exports.getCountOfTotalFailedFIFetch = function (tableName, body,realm,group) {
  // let queryCondition = JSON.stringify(condition)
  const condition = `timestamp >= '${body.startDate}' AND timestamp <= '${body.endDate}' AND realm = '${realm}' AND "group" = '${group}' AND session_status = 'FAILED'`;

  return sequelize.query(`SELECT COUNT(*) FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};

exports.getCountOfTotalNoResponseFIFetch = function (tableName, body,realm,group) {
  // let queryCondition = JSON.stringify(condition)
  const condition = `timestamp >= '${body.startDate}' AND timestamp <= '${body.endDate}' AND realm = '${realm}' AND "group" = '${group}' AND ("session_status" IS NULL OR "session_status" = '')`;

  return sequelize.query(`SELECT COUNT(*) FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};

exports.getCountOfExpiredConsent  = function (tableName, body,realm,group) {
  // let queryCondition = JSON.stringify(condition)
  const condition = `timestamp >= '${body.startDate}' AND timestamp <= '${body.endDate}' AND realm = '${realm}' AND "group" = '${group}' AND "consent_status"='EXPIRED'`;

  return sequelize.query(`SELECT COUNT(*) FROM ${sequelizeConfig.development.schema}.${tableName} WHERE ${condition}`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
};

exports.getCheckConsentHandle = async function (body) {
  const newBody = JSON.stringify(body)
  console.log("NewBody--->",newBody)
  return sequelize.query(`SELECT *
      FROM fiu_middleware."bulk_fiRequest"
      WHERE req_body::jsonb @> '[
        {
          "consentHandles": ${newBody}
        }
      ]'::jsonb;`, { 
    type: Sequelize.QueryTypes.SELECT,
  })
    .then(function (result) {
      return result;
    })
    .catch(function (err) {
      console.log("error in getAllData", err);
      throw err;
    });
  
};