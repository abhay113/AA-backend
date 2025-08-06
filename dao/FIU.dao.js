var Q = require('q');
require('dotenv').config();

// const { createClient } = require('@supabase/supabase-js');
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// exports.updateData = function (body,tableName) {
//     var deferred = Q.defer();
  
//     console.log('Inside insert consent notification Dao');
   
  
//     supabase
//       .from(tableName)
//       .update(body)
//       .then(function (response) {
//         console.log(response);
  
//         if (response.error == null) {
//           deferred.resolve(response);
//         } else {
//           deferred.reject(response.error);
//         }
//       })
//       .catch(function (err) {
//         console.log(err);
//         winston.error('Error in insertConsentNotification dao', err);
//         deferred.reject(err);
//       })
  
//     return deferred.promise;
//   }
  
exports.insertData = function (body,tableName) {
  var deferred = Q.defer();

  console.log('Inside post data Dao');

  // eslint-disable-next-line no-undef
  supabase
    .from(tableName)
    .insert(body)
    .then(function (response) {
      console.log(response);
      if (response.error == null) {
        deferred.resolve(response);
      } else {  
        deferred.resolve(response);
      }
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error('Error in post dao', err);
      deferred.reject(err);
    });

  return deferred.promise;
};


exports.getData = function (tablename, condition) {
  var deferred = Q.defer();

  console.log("Inside getData DAO");

  // eslint-disable-next-line no-undef
  supabase
    .from(tablename)
    .select("*")
    .match(condition)
    .then(function (response) {
      console.log(response);

      if (response.error == null) {
        deferred.resolve(response);
      } else {
        deferred.resolve(response);
      }
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error("Error in getData DAO", err);
      deferred.reject(err);
    })

  return deferred.promise;
}

exports.updateData = function (body, tableName, condition) {
  var deferred = Q.defer();

  console.log('Inside update data DAO');

  // eslint-disable-next-line no-undef
  supabase
    .from(tableName)
    .update(body)
    .match(condition)
    .then(function (response) {
      console.log(response);

      if (response.error == null) {
        deferred.resolve(response);
      } else {
        deferred.reject(response.error);
      }
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error('Error in update data DAO', err);
      deferred.reject(err);
    })

  return deferred.promise;
}

exports.updateConsentHandleData = function (body, tableName, consent_request_id) {
  var deferred = Q.defer();

  console.log('Inside update consent data Dao');

  // eslint-disable-next-line no-undef
  supabase
    .from(tableName)
    .update(body)
    .match({ consent_request_id: consent_request_id })
    .then(function (response) {
      console.log(response);

      if (response.error == null) {
        deferred.resolve(response);
      } else {
        deferred.reject(response.error);
      }
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error('Error in update consent data dao', err);
      deferred.reject(err);
    })

  return deferred.promise;
} 

exports.getFiRequestsByFilters = function (filters) {
  console.log("Inside getFiRequestsByFilters DAO");

  return new Promise(function(resolve, reject) {
    
    // eslint-disable-next-line no-undef
    let query = supabase.from('fi_request').select('*');
    
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('FIRequest_id')) {
      query = query.filter('FIRequest_id', 'eq', filters.FIRequest_id);
    }

    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('FIDataRange')) {
      query = query.filter('FIDataRange', 'eq', filters.FIDataRange);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('timestamp')) {
      query = query.match({timestamp: filters.timestamp});
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('sessionId')) {
      query = query.filter('sessionId', 'eq', filters.sessionId);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('consent_id')) {
      query = query.filter('consent_id', 'eq', filters.consent_id);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('aggregator_id')) {
      query = query.filter('aggregator_id', 'eq', filters.aggregator_id);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('customer_id')) {
      query = query.ilike('customer_id', `%${filters.customer_id}%`);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('txnid')) {
      query = query.filter('txnid', 'eq', filters.txnid);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('FIStatus')) {
      query = query.ilike('FIStatus', `%${filters.FIStatus}%`);
    }

    // Execute the query and return the result
    query.then(function(response) {  
      resolve(response);
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error("Error in getFiRequestsByFilters DAO", err);
      reject(err);
    })
  });
};


exports.getPaginatedFIrequest= function (filters) {
  console.log("Inside getPaginatedFIrequest DAO");

  return new Promise(function(resolve, reject) {
    // eslint-disable-next-line no-undef
    let query = supabase.from('fi_request').select('*');
    
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('FIRequest_id')) {
      query = query.filter('FIRequest_id', 'eq', filters.FIRequest_id);
    }

    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('FIDataRange')) {
      query = query.filter('FIDataRange', 'eq', filters.FIDataRange);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('timestamp')) {
      query = query.match({timestamp: filters.timestamp});
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('sessionId')) {
      query = query.filter('sessionId', 'eq', filters.sessionId);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('consent_id')) {
      query = query.filter('consent_id', 'eq', filters.consent_id);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('aggregator_id')) {
      query = query.filter('aggregator_id', 'eq', filters.aggregator_id);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('customer_id')) {
      query = query.ilike('customer_id', `%${filters.customer_id}%`);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('txnid')) {
      query = query.filter('txnid', 'eq', filters.txnid);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('FIStatus')) {
      query = query.ilike('FIStatus', `%${filters.FIStatus}%`);
    }

    // Execute the query and return the result
    query.then(function(response) {  
      resolve(response);
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error("Error in getFiRequestsByFilters DAO", err);
      reject(err);
    })
  });
}


exports.getConsentsByFilters = function (filters) {
  console.log("Inside getConsentsByFilters DAO");

  return new Promise(function(resolve, reject) {
    // eslint-disable-next-line no-undef
    let query = supabase.from('consent_request_detail').select('*');
    
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('DataConsumer')) {
      query = query.filter('DataConsumer', 'eq', filters.DataConsumer);
    }

    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('consent_id')) {
      query = query.filter('consent_id', 'eq', filters.consent_id);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('timestamp')) {
      query = query.match({timestamp: filters.timestamp});
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('Purpose.code')) {
      query = query.filter('Purpose.code', 'eq', filters.Purpose.code);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('fiTypes')) {
      // Use contains filter to filter on an array column
      query = query.filter('fiTypes', 'contains', filters.fiTypes);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('FIDataRange')) {
      query = query.filter('FIDataRange', 'eq', filters.FIDataRange);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('consent_request_id')) {
      query = query.filter('consent_request_id', 'eq', filters.consent_request_id);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('customer_id')) {
      query = query.ilike('customer_id', `%${filters.customer_id}%`);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('consentStatus')) {
      query = query.ilike('consentStatus', `%${filters.consentStatus}%`);
    }

    // Execute the query and return the result
    query.then(function(response) {  
      resolve(response);
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error("Error in getConsentsByFilters DAO", err);
      reject(err);
    });
  });
};


exports.getPaginatedConsents= function (filters) {
  console.log("Inside getPaginatedConsents DAO");
  
  return new Promise(function(resolve, reject) {
    // eslint-disable-next-line no-undef
    let query = supabase.from('consent_request_detail').select('*');
    
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('DataConsumer')) {
      query = query.filter('DataConsumer', 'eq', filters.DataConsumer);
    }

    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('consent_id')) {
      query = query.filter('consent_id', 'eq', filters.consent_id);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('timestamp')) {
      query = query.match({timestamp: filters.timestamp});
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('Purpose.code')) {
      query = query.filter('Purpose.code', 'eq', filters.Purpose.code);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('fiTypes')) {
      // Use contains filter to filter on an array column
      query = query.filter('fiTypes', 'contains', filters.fiTypes);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('FIDataRange')) {
      query = query.filter('FIDataRange', 'eq', filters.FIDataRange);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('consent_request_id')) {
      query = query.filter('consent_request_id', 'eq', filters.consent_request_id);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('customer_id')) {
      query = query.ilike('customer_id', `%${filters.customer_id}%`);
    }
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty('consentStatus')) {
      query = query.ilike('consentStatus', `%${filters.consentStatus}%`);
    }

    // Execute the query and return the result
    query.then(function(response) {  
      resolve(response);
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error("Error in getConsentsByFilters DAO", err);
      reject(err);
    });
  });
}

exports.getCount = function (tableName) {
  var deferred = Q.defer();
  // eslint-disable-next-line no-undef
  supabase
    .from(tableName)
    .select('*',{ count: 'exact'})
    .then(function (response) { 
      console.log(response);

      if (response.error == null) {
        deferred.resolve(response);
      } else {
        deferred.resolve(response);
      }
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error("Error in getConsentsByConsentId DAO", err);
      deferred.reject(err);
    })

  return deferred.promise;
}


exports.getTableDataByValue = function (tableName, columnName, columnValue) {
  console.log("Inside getTableDataByValue DAO");

  var deferred = Q.defer();

  // eslint-disable-next-line no-undef
  supabase
    .from(tableName)
    .select()
    .eq(columnName, columnValue)
    .then(function (response) {
      console.log(response);

      if (response.error == null) {
        deferred.resolve(response);
      } else {
        deferred.resolve(response);
      }
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error("Error in getTableDataByValue DAO", err);
      deferred.reject(err);
    });

  return deferred.promise;
};