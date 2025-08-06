const FIUService = require('../services/FIU.service')
const jwt = require('jsonwebtoken');
const { errorResponses } = require('../utils/messageCode.json');
const uuid = require('uuid');

function getRealm(accessToken) {
  const decoded = jwt.decode(accessToken);
  if (decoded) {
    const issuer = decoded.iss;
    if (issuer) {
      // Extract realm name from the issuer URL
      const realm = issuer.split('/').pop(); // Assumes the realm name is the last part of the URL
      console.log('Realm:', realm);
      return realm;
    } else {
      // console.log('Issuer (iss) claim not found in the token.');
      const error = new Error("Issuer (iss) claim not found in the token.");
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      throw errorBody;
      // return null;
    }
  } else {
    // console.log('Invalid access token.');
    const error = new Error("Invalid access token");
    let errorBody = {
      message: errorResponses[401].message,
      error: errorResponses[401].error,
      errorMessage: error.message,
      statusCode: errorResponses[401].statusCode,
    };
    throw errorBody;
    // return null;
  }
}
function getRealmIFrame(accessToken) {
  const decoded = jwt.decode(accessToken);
  if (decoded) {
    const realm_id = decoded.realm_id;
    if (realm_id) {
      const realm =realm_id; 
      console.log('Realm:', realm);
      return realm;
    } else {
      const error = new Error("realm_id not found in the token.");
      let errorBody = {
        message: errorResponses[404].message,
        error: errorResponses[404].error,
        errorMessage: error.message,
        statusCode: errorResponses[404].statusCode,
      };
      throw errorBody;
      // return null;
    }
  } else {
    // console.log('Invalid access token.');
    const error = new Error("Invalid access token");
    let errorBody = {
      message: errorResponses[401].message,
      error: errorResponses[401].error,
      errorMessage: error.message,
      statusCode: errorResponses[401].statusCode,
    };
    throw errorBody;
    // return null;
  }
}
function getGroup(accessToken) {
  try {
    const decoded = jwt.decode(accessToken);
    if (decoded) {
      const userGroups = decoded.user_groups;
      if (userGroups) {
        // Extract realm name from the issuer URL
        const userGroup = userGroups; // Assumes the realm name is the last part of the URL
        console.log('userGroup:', userGroup);
        return userGroup;
      } else {
        // console.log('Issuer (iss) claim not found in the token.');
        const error = new Error("Groups not found in the token.");
        let errorBody = {
          message: errorResponses[404].message,
          error: errorResponses[404].error,
          errorMessage: error.message,
          statusCode: errorResponses[404].statusCode,
        };
        throw errorBody;
        // return null;
      }
    } else {
      // console.log('Invalid access token.');
      const error = new Error("Invalid access token");
      let errorBody = {
        message: errorResponses[401].message,
        error: errorResponses[401].error,
        errorMessage: error.message,
        statusCode: errorResponses[401].statusCode,
      };
      throw errorBody;
      // return null;
    }
  } catch (error) {
    console.log("Error:", error)
  }

}
/*
 * @author: adarsh
 * @description: POST consent .
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function postConsent(req, res) {
  console.log("In post consent controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    const body = req.body;
    console.log(body);

    FIUService.postConsent(body, realm, group)
      .then(function (result) {
        console.log('Consent saved successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post consent controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}


/*
 * @author: adarsh
 * @description: POST FI request .
 * @param: {} req.param will contain FI details.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function postFIRequest(req, res) {
  console.log("In post consent controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    let realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    group = group ? group[0] : null;
    console.log('Group name:', group);
    const consentHandle = req.params.consentHandle

    FIUService.postFIRequest(consentHandle, realm, group)
      .then(function (result) {
        console.log('FI Request saved successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post FIRequest controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }


}
/*
 * @author: adarsh
 * @description: GET status by consentHandle .
 * @param: {} req.param will contain FI details.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function getStatusByConsentHandle(req, res) {
  console.log('In Get FI by IDs controller');

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;
    var consentHandle = req.params.consentHandle;

    if (!consentHandle) {
      console.error('consentHandle is missing');
      const error = new Error("consentHandle is missing")
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      res.status(errorBody.statusCode).send(errorBody);
      // return res.status(400).send({
      //   message: 'consentHandle is missing',
      //   error: true,
      // });
    }

    FIUService.getStatusByConsentHandle(consentHandle, realm, group)
      .then(function (result) {
        console.log('status fetched successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  get status by handle controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }


}
/*
 * @author: adarsh
 * @description: POST consent Notification.
 * @param: {} req.param will contain .
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function postConsentNotification(req, res) {
  console.log("In post consent notification controller");

  // if (req.get('Authorization')) {
  //   var token = req.get('Authorization').split(' ')[1];
  //   const realm = getRealm(token);
  //   console.log("Realm name:", realm);
  // } else {
  //   res.status(403).send('No Authorization token found!');
  // }
  const requiredHeaders = ['Authorization'];
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  if (missingHeaders.length > 0) {
    return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
    let auth = req.header('Authorization');
    console.log('auth', auth);
    const body = req.body

    FIUService.postConsentNotification(body, auth)
      .then(function (result) {
        res.status(result.statusCode).send(result);
      }).catch(function (err) {
        console.log("error in sending consent Notification", err)
        res.status(err.statusCode).send(err);
      });
  }


}

/*
* @author: adarsh
* @description: GET FI by session id .
* @param: {} req.param will nothing.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/

function getFinancialInfo(req, res) {
  console.log("In Get FI by IDs controller");

  var sessionId = req.params.sessionId;
  var fipID = req.query.fipID;
  console.log("sessionId: ", sessionId);
  console.log("FIP>>", fipID)
  let token = req.get('Authorization').split(' ')[1];
  let group = getGroup(token);
  console.log("Group name:", group);
  group = group ? group[0] : null;
  let realm = getRealm(token);
  console.log("realm name:", realm);

  FIUService.getFinancialInfo(sessionId, fipID, group,realm)
    .then(function (result) {
      console.log(' fetched info successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in  get financial info controller", err);
      res.status(err.statusCode).send(err);
    });
}
/*
 * @author: adarsh
 * @description: POST FI Notification.
 * @param: {} req.param will contain .
 * @return: {object} res will contain a message, statusCode, error (i.logoute true or false) and result (data, count, page etc).
 */

function postFINotification(req, res) {
  console.log("In post fi notification controller");

  // if (req.get('Authorization')) {
  //   var token = req.get('Authorization').split(' ')[1];
  //   const realm = getRealm(token);
  //   console.log("Realm name:", realm);

  const body = req.body

  //   FIUService.postFINotification(body, realm)
  //     .then(function (result) {
  //       console.log('notification sent successfully');
  //       res.status(result.statusCode).send(result);
  //     })
  //     .catch(function (err) {
  //       console.log("Error in post fi notification  controller", err);
  //       res.status(err.statusCode).send(err);
  //     });
  // } else {
  //   res.status(403).send('No Authorization token found!');
  // }

  FIUService.postFINotification(body)
    .then(function (result) {
      console.log('notification sent successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in post fi notification  controller", err);
      res.status(err.statusCode).send(err);
    });

}
/*
 * @author: adarsh
 * @description: GET consents by consent ID .
 * @param: {} req.param will nothing.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function getConsentInfoByConsentId(req, res) {
  console.log("In Get consent by ID controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;

    var consent_id = req.params.consent_id;
    console.log("consent_id: ", consent_id);

    FIUService.getConsentInfoByConsentId(consent_id, group,realm)
      .then(function (result) {
        console.log(' fetched consent info successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  get consent info controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }


}

/*
* @author: gokul
* @description: Webhook to POST consent information.
* @param: {} req.param will contain .
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/
function postConsentInformation(req, res) {
  console.log("In Get consent information by ID controller");

  // if (req.get('Authorization')) {
  //   var token = req.get('Authorization').split(' ')[1];
  //   const realm = getRealm(token);
  //   console.log("Realm name:", realm);

  var consent_body = req.body;
  console.log("consent details: ", consent_body);
  const requiredHeaders = ['Authorization'];
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  if (missingHeaders.length > 0) {
    return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
    let auth = req.header('Authorization');
    console.log('auth', auth);

    FIUService.postConsentInformation(consent_body, auth)
      .then(function (result) {
        console.log(' consent info posted  successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  post consent info controller", err);
        res.status(err.statusCode).send(err);
      });
  }


  // } else {
  //   res.status(403).send('No Authorization token found!');
  // }


}

/*
* @author: gokul
* @description: Webhook to POST FI Notification.
* @param: {} req.param will contain .
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/

function postFIdata(req, res) {
  console.log("In postFIdata controller");

  const body = req.body;
  const sessionId = req.params.sessionId;
  console.log("Session id:", sessionId);

  FIUService.postFIdata(sessionId, body)
    .then(function (result) {
      console.log(' posted fi successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in  post financial info controller", err);
      res.status(err.statusCode).send(err);
    });
}

/*
 * @author: adarsh
 * @description: GET FI requests by filters .
 * @param: {} req.param will contain filters.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function getFiRequestsByFilters(req, res) {
  console.log("In Get all consents by filter controller");
  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const filters = req.query;
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.getFiRequestsByFilters(filters, group, realm)
      .then(function (result) {
        console.log(' fetched fi request successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  get fi requests  controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}
/*
 * @author: adarsh
 * @description: GET consents by filters .
 * @param: {} req.param will contain filters.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function getConsentsByFilters(req, res) {
  console.log("In Get all consents by filter controller");
  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const filters = req.query;
    console.log("FIlterss", filters)
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.getConsentsByFilters(filters, group,realm)
      .then(function (result) {
        console.log(' fetched consent request successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  get consent requests  controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

/*
 * @author: Gokul
 * @description: GET the count of consents by status.
 * @param: {} req.param will contain filters.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function getConsentsCount(req, res) {
  console.log("In Get all consents count by status controller");
  if (req.get('Authorization')) {
    let group;
    var token = req.get('Authorization').split(' ')[1];
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.getConsentsCount(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function getRequestCount(req, res) {
  if (req.get('Authorization')) {
    let token = req.get('Authorization').split(' ')[1];
    let group;
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.getRequestCount(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

/*
 * @author: adarsh
 * @description: GET consents by consent ID .
 * @param: {} req.param will nothing.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function getConsentsByConsentRequestId(req, res) {
  console.log("In Get consent by ID controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    // let group = getGroup(token);
    // console.log("Group name:", group);
    // group = group ? group[0] : null;
    var consent_request_id = req.params.consent_request_id;
    console.log("consent_id: ", consent_request_id);

    FIUService.getConsentsByConsentRequestId(consent_request_id, realm)
      .then(function (result) {
        console.log(' fetched consent by id successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  get consent by id  controller", err);
        res.body = err;
        console.log('res.body', res.body);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }


}


function xmlConverter(req, res) {
  console.log("In Download CSV controller");

  var sessionId = req.params.sessionId;
  console.log("sessionId: ", sessionId);

  FIUService.xmlConverter(sessionId, res)
    .then(function (result) {
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("error in Download CSV controller", err);
      res.status(err.statusCode).send(err);
    });
}

// convert to pdf
function xmlConverterToPdf(req, res) {
  console.log("In Download PDF controller");

  var sessionId = req.params.sessionId;
  console.log("sessionId: ", sessionId);
  var token = req.get('Authorization').split(' ')[1];
  const realm = getRealm(token);
  console.log("Realm name:", realm);
  const body = req.body

  FIUService.xmlConverterToPdf(sessionId,realm,body)
    .then(function (result) {
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("error in Download PDF controller", err);
      res.status(err.statusCode).send(err);
    });
}
// convert to pdf

/**
 * @author: Gokul
 * @description: POST logout user.
 * @param: {} req.param will contain nothing.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function logoutUser(req, res) {
  console.log('Inside logoutUser controller');

  // if (req.get('Authorization')) {
  var token = req.get('Authorization').split(' ')[1];

  var body = req.body;

  console.log(token);

  FIUService.logoutUser(body).then(function (result) {
    res.status(result.statusCode).send(result);
  }).catch(function (err) {
    console.log('Error in logoutUser controller', err);
    // winston.error('Error in logoutUser controller', err);
    res.status(err.statusCode).send(err);
  });
}


function getTableDataByValue(req, res) {
  console.log("In getTableDataByValue controller");

  const tableName = req.params.tableName;
  const columnName = req.params.columnName;
  const columnValue = req.params.columnValue;

  console.log("Data", tableName, columnName, columnValue);

  if (!tableName || !columnName || !columnValue) {
    const error = new Error("Invalid request parameters");
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    return res.status(errorBody.statusCode).send(errorBody)
    // return res.status(400).json({
    //   message: "Invalid request parameters",
    //   error: true,
    //   statusCode: 400
    // });
  }

  FIUService.getTableDataByValue(tableName, columnName, columnValue)
    .then(function (result) {
      console.log(' fetched data by value successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in  get table data by value  controller", err);
      res.status(err.statusCode).send(err);
    });
}

async function getAllAggregators(req, res) {
  console.log("In Get All Aggregators controller");

  // Check for query parameters and return a 400 error if they exist
  if (Object.keys(req.query).length > 0) {
    const error = new Error("Query Parameters Should be empty")
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    // const errorResponse = {
    //   message: "Query parameters should be empty",
    //   error: true,
    //   statusCode: 400,
    // };
    console.error("Query parameters provided");
    return res.status(errorBody.statusCode).json(errorBody);
  }

  var token = req.get('Authorization').split(' ')[1];
  const realm = getRealm(token);
  console.log("Realm name:", realm);

  try {
    const result = await FIUService.getAllAggregators(realm);
    console.log('Fetched aggregators successfully');
    res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("Error in get all aggregators controller", err);
    res.status(err.statusCode || 500).json(err);
  }
}

/*
* @author: adarsh
* @description: GET FI by session id .
* @param: {} req.param will nothing.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/

function getDecryptedFI(req, res) {
  console.log("In Get FI by IDs controller");

  var sessionId = req.params.sessionId;
  console.log("sessionId: ", sessionId);

  var token = req.get('Authorization').split(' ')[1];
  const realm = getRealm(token);
  console.log("Realm name:", realm);

  FIUService.getDecryptedFI(sessionId,realm)
    .then(function (result) {
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in getting decrypted data controller", err);
      res.status(err.statusCode).send(err);
    });
}
/*
* @author: adarsh
* @description: GET all purpose Codes .
* @param: {} req.param will nothing.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/


function getAllPurposeCodes(req, res) {
  console.log("In Get All purpose codes controller");

  if (Object.keys(req.query).length > 0) {
    const error = new Error("Query parameters should be empty")
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    return res.status(errorBody.statusCode).json(errorBody);
    // const errorResponse = {
    //   message: "Query parameters should be empty",
    //   error: true,
    //   statusCode: 400,
    // };
    // console.error("Query parameters provided");
    // return res.status(400).json(errorResponse);
  }

  FIUService.getAllPurposeCodes().then(function (result) {
    console.log(' fetched purpose codes successfully');
    res.status(result.statusCode).send(result);
  })
    .catch(function (err) {
      console.log("Error in  get all purpose codes  controller", err);
      res.status(err.statusCode).send(err);
    });
}
/*
* @author: adarsh
* @description: GET all consent modes .
* @param: {} req.param will nothing.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/


function getAllConsentModes(req, res) {
  console.log("In Get All consent mode controller");

  if (Object.keys(req.query).length > 0) {
    const error = new Error("Query parameters should be empty")
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    return res.status(errorBody.statusCode).json(errorBody);
    // const errorResponse = {
    //   message: "Query parameters should be empty",
    //   error: true,
    //   statusCode: 400,
    // };
    // console.error("Query parameters provided");
    // return res.status(400).json(errorResponse);
  }

  FIUService.getAllConsentModes().then(function (result) {
    console.log(' fetched consent modes successfully');
    res.status(result.statusCode).send(result);
  })
    .catch(function (err) {
      console.log("Error in  get all consent modes controller", err);
      res.status(err.statusCode).send(err);
    });
}
/*
* @author: adarsh
* @description: GET all consent types .
* @param: {} req.param will nothing.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/


function getAllConsentTypes(req, res) {
  console.log("In Get All consent types controller");

  if (Object.keys(req.query).length > 0) {
    const error = new Error("Query parameters should be empty")
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    return res.status(errorBody.statusCode).json(errorBody);

    // const errorResponse = {
    //   message: "Query parameters should be empty",
    //   error: true,
    //   statusCode: 400,
    // };
    // console.error("Query parameters provided");
    // return res.status(400).json(errorResponse);
  }

  FIUService.getAllConsentTypes().then(function (result) {
    console.log(' fetched consent types successfully');
    res.status(result.statusCode).send(result);
  })
    .catch(function (err) {
      console.log("Error in  get all consent types  controller", err);
      res.status(err.statusCode).send(err);
    });
}

/*
* @author: adarsh
* @description: GET all fi types .
* @param: {} req.param will nothing.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/


function getAllFiTypes(req, res) {
  console.log("In Get All FI types controller");
  if (Object.keys(req.query).length > 0) {
    const error = new Error("Query parameters should be empty")
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    return res.status(errorBody.statusCode).json(errorBody);

    // const errorResponse = {
    //   message: "Query parameters should be empty",
    //   error: true,
    //   statusCode: 400,
    // };
    // console.error("Query parameters provided");
    // return res.status(400).json(errorResponse);
  }


  FIUService.getAllFiTypes().then(function (result) {
    console.log(' fetched fi types successfully');
    res.status(result.statusCode).send(result);
  })
    .catch(function (err) {
      console.log("Error in  get all fi types  controller", err);
      res.status(err.statusCode).send(err);
    });
}

/*
* @author: adarsh
* @description: GET all data filter operators .
* @param: {} req.param will nothing.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/


function getAllOperators(req, res) {
  console.log("In Get All FI types controller");

  if (Object.keys(req.query).length > 0) {
    let errorBody = {
      message: errorResponses[400].message,
      error: errorResponses[400].error,
      // eslint-disable-next-line no-undef
      errorMessage: error.message,
      statusCode: errorResponses[400].statusCode,
    };
    return res.status(errorBody.statusCode).json(errorBody);
    // throw errorBody;
    // const errorResponse = {
    //   message: "Query parameters should be empty",
    //   error: true,
    //   statusCode: 400,
    // };
    // console.error("Query parameters provided");
    // return res.status(400).json(errorResponse);
  }

  FIUService.getAllOperators().then(function (result) {
    console.log(' fetched operators successfully');
    res.status(result.statusCode).send(result);
  })
    .catch(function (err) {
      console.log("Error in  get all operators  controller", err);
      res.status(err.statusCode).send(err);
    });
}

async function postBulkConsent(req, res) {
  console.log("In postBulkConsent controller");
  var token = req.get('Authorization').split(' ')[1];
  const realm = getRealm(token);
  console.log("Realm name:", realm);
  let group = getGroup(token)[0];
  const consentsArray = req.body;
  console.log(consentsArray);
  // console.log('reqheaders', req.headers);
  // let group = req.headers['group'];
  console.log('group', group);
  // let redirectURL = req.headers['redirecturl'];
  // let sessionid = req.headers['sessionid'];

  try {
    const result = await FIUService.postBulkConsent(consentsArray, group, realm); //, redirectURL, sessionid
    res.status(result.statusCode).send(result);
  } catch (err) {
    console.log("Error in post bulk consent controller", err);
    res.status(err.statusCode).send(err);;
  }
}
async function postBulkConsentIFrame(req, res) {
  console.log("In postBulkConsent controller");

  // var token = req.get('Authorization').split(' ')[1];
  console.log("990 :",req.get('Authorization')
  );
  var token = req.get('Authorization');
  console.log("Token : ",token);
  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }
  console.log("getRealmIFrame : 1040",getRealmIFrame(token));
  // console.log("getRealm(token) : 998",getRealm(token)); //THIS IS FOR ISS
  // const realm = getRealm(token); //THIS IS FOR ISS
  const realm = getRealmIFrame(token)
  console.log("Realm name:", realm);
  let group = getGroup(token)[0];
  const consentsArray = req.body;
  console.log(consentsArray);
  // console.log('reqheaders', req.headers);
  // let group = req.headers['group'];
  console.log('group', group);
  // let redirectURL = req.headers['redirecturl'];
  // let sessionid = req.headers['sessionid'];

  try {
    const result = await FIUService.postBulkConsent(consentsArray, group, realm); //, redirectURL, sessionid
    res.status(result.statusCode).send(result);
  } catch (err) {
    console.log("Error in post bulk consent controller", err);
    res.status(err.statusCode).send(err);;
  }
}

/*
 * @author: adarsh
 * @description: POST product .
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function postProduct(req, res) {
  console.log("In post product controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    const productBody = req.body;
    console.log(productBody);

    FIUService.postProduct(productBody, realm, group)
      .then(function (result) {
        console.log('Product saved successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post product controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }


}

/*
 * @author: adarsh
 * @description: DELETE product .
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function deleteProduct(req, res) {
  console.log("In delete product controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    const product_id = req.params.product_id;
    console.log(product_id);


    FIUService.deleteProduct(product_id, realm, group)
      .then(function (result) {
        console.log('Product deleted successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in delete product controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }


}

/*
 * @author: adarsh
 * @description: UPDATE product .
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function updateProduct(req, res) {
  console.log("In update product controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    const productBody = req.body;
    console.log(productBody);

    const product_id = req.params.product_id;
    console.log(product_id);

    FIUService.updateProduct(productBody, product_id, realm, group)
      .then(function (result) {
        console.log('updated Product successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in update product controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }


}


/*
* @author: adarsh
* @description: GET product details by Id .
* @param: {} req.param will nothing.  
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/

function getProductDetailsbyId(req, res) {
  console.log("In Get product details by IDs controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    var product_id = req.params.product_id;
    console.log(product_id);

    FIUService.getProductDetailsbyId(product_id, realm, group)
      .then(function (result) {
        console.log('product fetched successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in get product controller", err);
        res.status(err.statusCode || 500).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

/*
* @author: adarsh
* @description: GET All product details .
* @param: {} req.param will nothing.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/

function getAllProductDetails(req, res) {
  console.log("In Get all products by IDs controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    console.log('token', token);
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    FIUService.getAllProductDetails(realm, group)
      .then(function (result) {
        console.log('products fetched successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in get product controller", err);
        res.status(err.statusCode || 500).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }

}

/*
* @author: Gokul
* @description: GET All configuration details .
* @param: {} req.param will nothing.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/

function getAllConfigurations(req, res) {
  console.log("In Get configurations controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.getAllConfigurations(realm)
      .then(function (result) {
        console.log('product fetched successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in get product controller", err);
        res.status(err.statusCode || 500).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

/*
 * @author: adarsh
 * @description: UPDATE status of aa .
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function updateAggregatorStatus(req, res) {
  console.log("In update consent controller");

  if (req.get('Authorization')) {
  const aggregatorBody = req.body;
  console.log(aggregatorBody);

  const aggregator_id = req.params.aggregator_id;
  console.log(aggregator_id);

  var token = req.get('Authorization').split(' ')[1];
  const realm = getRealm(token);

  FIUService.updateAggregatorStatus(aggregatorBody, aggregator_id,realm)
    .then(function (result) {
      console.log('updated aggregator successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in update aggregator controller", err);
      res.status(err.statusCode).send(err);
    });
  }else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

/*
 * @author: adarsh
 * @description: UPDATE default AA .
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

function setDefaultAggregator(req, res) {
  console.log("In update consent controller");
  // function getProductDetailsbyId(req, res) {
  //   console.log("In Get FI by IDs controller");

  //   var product_id = req.params.product_id;
  //   console.log(product_id);

  //   FIUService.getProductDetailsbyId(product_id)
  //     .then(function (result) {
  //       console.log('product fetched successfully');
  //       res.status(result.statusCode).send(result);
  //     })
  //     .catch(function (err) {
  //       console.log("Error in get product controller", err);
  //       res.status(err.statusCode || 500).send(err);
  //     });
  // }
  const aggregatorBody = req.body;
  console.log(aggregatorBody);

  const aggregator_id = req.params.aggregator_id;
  console.log(aggregator_id);

  FIUService.setDefaultAggregator(aggregatorBody, aggregator_id)
    .then(function (result) {
      console.log('updated aggregator successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in update aggregator controller", err);
      res.status(err.statusCode).send(err);
    });
}


function authServerGenerateSession(req, res) {
  console.log("in validation of token")

  const product_id = req.query.product_id;
  console.log(product_id);

  const realm_id = req.query.realm_id;
  console.log(realm_id);

  FIUService.authServerGenerateSession(product_id, realm_id)
    .then(function (result) {
      console.log('genereated session successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in generate session controller", err);
      res.status(err.statusCode).send(err);
    });
}



function brandingConfiguration(req, res) {
  var fileInfo = req.file;
  var payload = req.body.payload;

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group;
    if (!req.query.group) {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    } else {
      group = req.query.group
    }

    if (!fileInfo && !payload) {
      const error = new Error("No fileInfo or payload provided");
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      return res.status(errorBody.statusCode).send(errorBody);
    }
    // payload.config_id = realm;
    console.log(fileInfo);
    console.log(payload);

    var body = JSON.parse(payload || "{}");
    console.log(body);

    FIUService.brandingConfiguration(body, fileInfo, realm, group)
      .then(function (result) {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in creating brand config controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}


function getBrandConfiguration(req, res) {
  console.log("In Get brand configurations controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group;
    if (!req.query.group) {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    } else {
      group = req.query.group
    }

    FIUService.getBrandConfiguration(realm, group).then(function (result) {
      console.log(' fetched brand configration successfully');
      res.status(result.statusCode).send(result);
    })
      .catch(function (err) {
        console.log("Error in  get getBrandConfiguration  controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function updateBrandingConfiguration(req, res) {
  var fileInfo = req.file;
  var payload = req.body.payload;
  console.log('fileInfo', fileInfo);

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group;
    if (!req.query.group) {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    } else {
      group = req.query.group
    }

    if (!fileInfo && !payload) {
      const error = new Error("No fileInfo or payload provided");
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      return res.status(errorBody.statusCode).send(errorBody);
    }
    let config_id = req.params.config_id;
    console.log(fileInfo);
    console.log(payload);

    var body = JSON.parse(payload || "{}");
    console.log(body);

    FIUService.updateBrandingConfiguration(body, fileInfo, realm, group, config_id)
      .then(function (result) {
        res.status(result.status).send(result);
      })
      .catch(function (err) {
        console.log("Error in updating brand config controller", err);
        res.status(err.status).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function automateFiRequest(req, res) {
  console.log("In update consent controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    const body = req.body;
    console.log(body);

    const config_id = req.query.config_id;
    console.log(config_id);


    FIUService.automateFiRequest(body, config_id)
      .then(function (result) {
        console.log('automated FI request successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in automate fi request controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function postDraftProduct(req, res) {
  console.log("In post draft product controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;
    const productBody = req.body;
    productBody.realm = realm;
    productBody.group = group;
    console.log(productBody);

    FIUService.postDraftProduct(productBody)
      .then(function (result) {
        console.log('Draft product saved successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post draft product controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function generateDepositReport(req, res) {
  console.log("In generate report controller");

  const report = req.body;
  console.log(report);

  FIUService.generateDepositReport(report)
    .then(function (result) {
      console.log('Draft product saved successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in post draft product controller", err);
      res.status(err.statusCode).send(err);
    });
}


function getAggregatorDetailsbyId(req, res) {
  console.log("In Get aggregator by IDs controller");

  var aggregator_id = req.params.aggregator_id;
  console.log(aggregator_id);

  FIUService.getAggregatorDetailsbyId(aggregator_id)
    .then(function (result) {
      console.log('aggregator fetched successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in get aggregator by id controller", err);
      res.status(err.statusCode).send(err);
    });
}

function updateAggregatorDetailsById(req, res) {
  console.log("In update AggregatorDetailsById controller");

  const aggregatorBody = req.body;
  console.log(aggregatorBody);

  const aggregator_id = req.params.aggregator_id;
  console.log(aggregator_id);

  FIUService.updateAggregatorDetailsById(aggregatorBody, aggregator_id)
    .then(function (result) {
      console.log('updated aggregator successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in update AggregatorDetailsById controller", err);
      res.status(err.statusCode).send(err);
    });
}

function getAllMasterTableData(req, res) {
  console.log("In Get All consent types controller");
  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    let realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.getAllMasterTableData().then(function (result) {
      console.log('fetched AllMasterTableData successfully');
      res.status(result.statusCode).send(result);
    })
      .catch(function (err) {
        console.log("Error in  getAllMasterTableData controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function getFIRequestBySessionId(req, res) {
  console.log("In fi request by session id controller");
  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    let realm = getRealm(token);
    console.log("Realm name:", realm);
    // let group = getGroup(token);
    // console.log("Group name:", group);
    // group = group ? group[0] : null;
    const session_id = req.params.sessionId

    FIUService.getFIRequestBySessionId(session_id).then(function (result) {
      console.log('fetched fi request by session id successfully');
      res.status(result.statusCode).send(result);
    })
      .catch(function (err) {
        console.log("Error in getFIRequestBySessionId controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function generateAnalyticsReport(req, res) {
  console.log("In generate analytics by session id controller");
  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    let realm = getRealm(token);
    console.log("Realm name:", realm);
    const session_id = req.params.sessionId

    FIUService.getAnalyticstBySessionId(session_id,realm).then(function (result) {
      console.log('analytics by session id successfully');
      res.status(result.statusCode).send(result);
    }).catch(function (err) {
      console.log("Error in generateAnalyticsReport controller", err);
      res.status(err.statusCode).send(err);
    });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function getConsentTrail(req, res) {
  console.log("In Get consent Trail controller");
  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    let realm = getRealm(token);
    console.log("Realm name:", realm);
    const correlationId = req.params.correlationId

    FIUService.getConsentTrail(correlationId).then(function (result) {
      console.log('fetched getConsentTrail successfully');
      res.status(result.statusCode).send(result);
    })
      .catch(function (err) {
        console.log("Error in  getConsentTrail controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function customerCount(req, res) {
  // const filters = req.require;
  let token = req.get('Authorization').split(' ')[1];
  if (req.get('Authorization')) {
    let group;
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }

    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.customerCount(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}


function fiTypesCount(req, res) {
  // const filters = req.require;
  let token = req.get('Authorization').split(' ')[1];
  if (req.get('Authorization')) {
    let group;
    if (req.query.group) {
      group = req.query.group
    } else {
     
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.fiTypesCount(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}


function getAggregatorsByFiRequest(req, res) {
  if (req.get('Authorization')) {
    let token = req.get('Authorization').split(' ')[1];
    let group;
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.getAggregatorsByFiRequest(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}


function getAggregatorsByConsent(req, res) {
  if (req.get('Authorization')) {
    let group;
    let token = req.get('Authorization').split(' ')[1];
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }

    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.getAggregatorsByConsent(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}


function getConsentExpiryCount(req, res) {
  // const filters = req.require;
  if (req.get('Authorization')) {
    let group;
    let token = req.get('Authorization').split(' ')[1];
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }

    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.getConsentExpiryCount(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}


function getFiTypesByFiRequest(req, res) {
  // const filters = req.require;
  if (req.get('Authorization')) {
    let token = req.get('Authorization').split(' ')[1];
    let group;
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }

    // var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.getFiTypesByFiRequest(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}


function getRole(req, res) {
  console.log("In Get FI by IDs controller");
  if (req.get('Authorization')) {
    // var token = req.get('Authorization').split(' ')[1];
    // var sessionId = req.params.sessionId;
    var roleId = req.params.role_id;
    // console.log("sessionId: ", sessionId);
    // console.log("FIP>>", fipID)
    // let group = getGroup(token);
    // console.log("Group name:", group);
    // group = group ? group[0] : null;

    FIUService.getRole(roleId)
      .then(function (result) {
        console.log(' fetched info successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  get financial info controller", err);
        res.status(err.statusCode).send(err);
      });
  }

}


function getAllRoles(req, res) {
  console.log("In Get FI by IDs controller");
  if (req.get('Authorization')) {
    // var token = req.get('Authorization').split(' ')[1];

    FIUService.getAllRoles()
      .then(function (result) {
        console.log(' fetched info successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  get financial info controller", err);
        res.status(err.statusCode).send(err);
      });
  }

}

function deleteBrandingConfiguration(req, res) {
  console.log("In delete product controller");
  if (req.get('Authorization')) {
    let token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    let config_id = req.params.config_id;
    FIUService.deleteBrandingConfiguration(realm, config_id)
      .then(function (result) {
        console.log('Product deleted successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in delete product controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}


// function deleteBrandingConfiguration(req, res) {
//   console.log("In delete product controller");

//   if (req.get('Authorization')) {
//     let token = req.get('Authorization').split(' ')[1];
//     const realm = getRealm(token);
//     console.log("Realm name:", realm);
//     let group = getGroup(token);
//     console.log('Group name:', group);
//     group = group ? group[0] : null;
//     let config_id = req.params.config_id;


//     FIUService.deleteBrandingConfiguration(realm, config_id)
//       .then(function (result) {
//         console.log('Product deleted successfully');
//         res.status(result.statusCode).send(result);
//       })
//       .catch(function (err) {
//         console.log("Error in delete product controller", err);
//         res.status(err.statusCode).send(err);
//       });

//   } else {
//     const error = new Error("No Authorization token found!");
//     let errorBody = {
//       message: errorResponses[403].message,
//       error: errorResponses[403].error,
//       errorMessage: error.message,
//       statusCode: errorResponses[403].statusCode,
//     };
//     res.status(errorBody.statusCode).send(errorBody);
//     // res.status(403).send('No Authorization token found!');
//   }
// }

function bsaReportDownload(req, res) {
  console.log("In generate analytics by session id controller");

  FIUService.bsaReportDownload(req.body).then(function (result) {
    console.log('analytics by session id successfully');
    res.status(result.statusCode).send(result);
  }).catch(function (err) {
    console.log("Error in generateAnalyticsReport controller", err);
    res.status(err.statusCode).send(err);
  });
}

function getBsaReport(req, res) {
  console.log("In get bsa report controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    // let group = getGroup(token);
    // console.log('Group name:', group);
    // group = group ? group[0] : null;
    let session_id = req.params.sessionId;

    FIUService.getBsaReport(session_id)
      .then(function (result) {
        console.log('Report Downloaded Successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in get bsa report controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function sendSms(req, res) {
  console.log("In get sms controller");

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    FIUService.sendSms(req.body)
      .then(function (result) {
        console.log('Sms Sent Successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in get sms controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function schedulerNotification(req,res) {
  // const requiredHeaders = ['Authorization'];
  // const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  
  // if (missingHeaders.length > 0) {
  //   return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  // } else {
    // let auth = req.header('Authorization');
    // console.log('auth', auth);
    const body = req.body
    const auth = 'test'

    FIUService.schedulerNotificationAPICall(body,auth)
    .then(function (result) {
      console.log('schedulerNotificationApi called');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in get schedular notification ", err);
      res.status(err.statusCode).send(err);
    });
  // }
}

function fiDataSchedulerNotification(req,res) {
  // const requiredHeaders = ['Authorization'];
  // const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  
  // if (missingHeaders.length > 0) {
  //   return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  // } else {
    // let auth = req.header('Authorization');
    // console.log('auth', auth);
    const body = req.body
    const auth = 'test'

    FIUService.fiDataSchedulerNotificationAPICall(body,auth)
    .then(function (result) {
      console.log('schedulerNotificationApi called');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in get schedular notification ", err);
      res.status(err.statusCode).send(err);
    });
  // }
}
function postScheduler(req, res) {
  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    req.body.id = uuid.v4();
    req.body.realm = realm;

    FIUService.postScheduler(req.body)
      .then(function (result) {
        console.log('create scheduler successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post scheduler controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function getScheduler(req, res) {
  if (req.get('Authorization')) {
    // var token = req.get('Authorization').split(' ')[1];
    const consentHandle = req.params.consentHandle

    FIUService.getScheduler(consentHandle)
      .then(function (result) {
        console.log('get scheduler successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post scheduler controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function pauseScheduler(req, res) {
  if (req.get('Authorization')) {
    // var token = req.get('Authorization').split(' ')[1];
    const queueName = req.params.queueName

    FIUService.pauseScheduler(queueName)
      .then(function (result) {
        console.log('pause scheduler successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in pause scheduler controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}


function resumeScheduler(req, res) {
  if (req.get('Authorization')) {
    // var token = req.get('Authorization').split(' ')[1];
    const queueName = req.params.queueName

    FIUService.resumeScheduler(queueName)
      .then(function (result) {
        console.log('resume scheduler successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post scheduler controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function getAnalyticalReportByConsentHandle(req, res) {
  if (req.get('Authorization')) {
    // const token = req.get('Authorization').split(' ')[1];
    const consentHandle = req.params.consentHandle;

    FIUService.getAnalyticalReportByConsentHandle(consentHandle)
      .then(function (result) {
        console.log('get scheduler successfully', result);
        // Ensure the result contains a valid statusCode
        const statusCode = result.statusCode || 200;
        res.status(statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post scheduler controller", err);
        // Fallback to status code 500 if err.statusCode is undefined
        const statusCode = err.statusCode || 500;
        res.status(statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    const errorBody = {
      message: errorResponses[403]?.message || "Forbidden",
      error: errorResponses[403]?.error || true,
      errorMessage: error.message,
      statusCode: errorResponses[403]?.statusCode || 403,
    };
    res.status(errorBody.statusCode).send(errorBody);
  }
}

function getAnalyticalReports(req, res) {
  if (req.get('Authorization')) {
    const token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;

    FIUService.getAnalyticalReports(realm,group)
      .then(function (result) {
        console.log('get scheduler successfully', result);
        // Ensure the result contains a valid statusCode
        const statusCode = result.statusCode || 200;
        res.status(statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post scheduler controller", err);
        // Fallback to status code 500 if err.statusCode is undefined
        const statusCode = err.statusCode || 500;
        res.status(statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    const errorBody = {
      message: errorResponses[403]?.message || "Forbidden",
      error: errorResponses[403]?.error || true,
      errorMessage: error.message,
      statusCode: errorResponses[403]?.statusCode || 403,
    };
    res.status(errorBody.statusCode).send(errorBody);
  }
}
function getAllRealmConfig(req, res) {
  if (req.get('Authorization')) {
    // const token = req.get('Authorization').split(' ')[1];
    
    const realm = req.params.realm;
    console.log("realm : controller ",realm);
    FIUService.getAllRealmConfig(realm)
      .then(function (result) {
        console.log('get realm data successfully', result);
        const statusCode = result.statusCode || 200;
        res.status(statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in get realm config", err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    const errorBody = {
      message: errorResponses[403]?.message || "Forbidden",
      error: errorResponses[403]?.error || true,
      errorMessage: error.message,
      statusCode: errorResponses[403]?.statusCode || 403,
    };
    res.status(errorBody.statusCode).send(errorBody);
  }
}
function updateRealConfig(req, res) {
  if (req.get('Authorization')) {
    // const token = req.get('Authorization').split(' ')[1];
    
    const realm = req.params.realm;
    const body = req.body
    console.log("realm : controller ",realm);
    FIUService.updateRealConfig(realm,body)
      .then(function (result) {
        console.log('Organization data updated successfully', result);
        const statusCode = result.statusCode || 200;
        res.status(statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in update realm config", err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    const errorBody = {
      message: errorResponses[403]?.message || "Forbidden",
      error: errorResponses[403]?.error || true,
      errorMessage: error.message,
      statusCode: errorResponses[403]?.statusCode || 403,
    };
    res.status(errorBody.statusCode).send(errorBody);
  }
}

function postQueueJob(req, res) {
    req.body.id = uuid.v4();
    FIUService.postQueueJob(req.body)
      .then(function (result) {
        console.log('create queue job successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post queue job controller", err);
        res.status(err.statusCode).send(err);
      });
}

function getFiRequestStatus(req, res) {
  console.log('In getFiRequestStatus controller');

  if (req.get('Authorization')) {
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;
    var sessionId = req.params.sessionId;

    if (!sessionId) {
      console.error('sessionId is missing');
      const error = new Error("sessionId is missing")
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      res.status(errorBody.statusCode).send(errorBody);
    }

    FIUService.getFiRequestStatus(sessionId, realm)
      .then(function (result) {
        console.log('status fetched successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  getFiRequestStatus controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function postFiRequestData(req, res) {
  const body = req.body
  console.log("body",body)
  FIUService.postFiRequestinfo(body)
  .then(function (result) {
    console.log('get data', result);
    const statusCode = result.statusCode || 200;
    res.status(statusCode).send(result);
  })
  .catch(function (err) {
    console.log("Error in update realm config", err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).send(err);
  });

}

/* Auth Controller */ 

function generateSession(req, res) {
  console.log("inside generateSession controller");
  
  var realmId = req.params.realmId;
  console.log("Realm id:", realmId);

  // Check if required headers are present
  const requiredHeaders = ['x-correlation-id']; //, 'grant_type'
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));

  if (missingHeaders.length > 0) {
      return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
      console.log("X-CORELATION-ID : 7",req.header('x-correlation-id'));
      console.log("product_id :",req.header('product_id'));
      console.log("req.body :",req.body);
      // console.log("req : ",req);
      console.log("req.header :",req.header);
      console.log("req.product_id",req.header('product_id'));
      console.log("req.product-id",req.header('product-id'));

      let correlationId = req.header('x-correlation-id');
      // let productId = req.header('product_id');      
      let productId = req.header('product-id');
      let payload = req.body;

      FIUService.generateSession(realmId, correlationId, productId, payload).then(function (result) {
          res.status(result.statusCode).send(result);
      }).catch(function (err) {
          console.log("Error:", err);
          res.status(err.statusCode).send({
              message: err.message,
              error: true,
              errorMessage: err.errorMessage
          })
      })
  }
}

function validateSession(req, res) {
  const requiredHeaders = ['x-correlation-id', 'sessionid'];
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));
 
  if (missingHeaders.length > 0) {
      return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
      let correlationId = req.header('x-correlation-id');
      let sessionid = req.header('sessionid');
      let group = req.header('group');
      console.log("GROUP : ",group);
      
      let redirectURL = req.header('redirectURL')
      let payload = req.body;
      const realmId = req.params.realmId;
      console.log("realmId :",realmId);
      
      FIUService.validateSession(sessionid, correlationId, payload, group, redirectURL,realmId).then(function (result) {
          console.log("RESULT : CONTROLLER :106",result);
          res.status(result.statusCode).send(result);
      }).catch(function (err) {
          console.log("Error: 109", err);
          res.status(err.statusCode).send({
              message: err.message,
              error: true,
              errorMessage: err.errorMessage
          })
      })
     
  }
}

async function getActiveAggregators(req, res) {
  console.log("In Get All Aggregators controller");

  if (req.get('Authorization')) {
  // Check for query parameters and return a 400 error if they exist
    if (Object.keys(req.query).length > 0) {
        const errorResponse = {
            message: "Query parameters should be empty",
            error: true,
            statusCode: 400,
        };
        console.error("Query parameters provided");
        return res.status(400).json(errorResponse);
    }

    // Check for query parameters and return a 400 error if they exist
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
  try {
      const result = await FIUService.getActiveAggregators(realm);
      console.log('Fetched aggregators successfully');
      res.status(result.statusCode).json(result);
  } catch (err) {
      console.error("Error in get all aggregators controller", err);
      res.status(err.statusCode || 500).json(err);
  }
  }else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function getDefaultAggregator(req, res) {
  console.log("In Get default Aggregator controller");

  FIUService.getDefaultAggregator()
      .then(function (result) {
          console.log('Default Aggregator fetched successfully');
          res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
          console.log("Error in get default Aggregator controller", err);
          res.status(err.statusCode || 500).send(err);
      });
}

function getProductDetailsbyProductId(req, res) {
  console.log("In Get FI by IDs controller");

  var product_id = req.params.productId;
  console.log(product_id);

  FIUService.getProductDetailsbyProductId(product_id)
      .then(function (result) {
          console.log('product fetched successfully');
          res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
          console.log("Error in get product controller", err);
          res.status(err.statusCode || 500).send(err);
      });
}

function getAllMasterTableDetailsData(req, res) {
  console.log("In Get All consent types controller");

  FIUService.getAllMasterTableDetailsData().then(function (result) {
    console.log('fetched AllMasterTableData successfully');
    res.status(result.statusCode).send(result);
  })
    .catch(function (err) {
      console.log("Error in  getAllMasterTableData controller", err);
      res.status(err.statusCode).send(err);
    });
}

function getBrandConfigurations(req, res) {
  console.log("In Get brand configurations controller");

  FIUService.getBrandConfigurations().then(function (result) {
      console.log(' fetched brand configration successfully');
      res.status(result.statusCode).send(result);
  })
      .catch(function (err) {
          console.log("Error in  get getBrandConfigurations  controller", err);
          res.status(err.statusCode).send(err);
      });
}
function getBsaReportAuth(req, res) {
  console.log("In Get BSA Report controller");
  // var session_id = req.params.session_id;
  // console.log(session_id);
  const requiredHeaders = ['Authorization'];
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  if (missingHeaders.length > 0) {
      return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
      let auth = req.header('Authorization');
      console.log('auth',auth);
      FIUService.getBsaReportAuth(auth,req.body).then(function (result) {
          console.log('fetched BSA Report successfully',result);
          res.status(result.statusCode).send(result);
      })
          .catch(function (err) {
              console.log("Error in  getBsaReportAuth controller", err);
              res.status(err.statusCode).send(err);
          });
  }
}

function getFiFetchCountDetails(req, res) {
  const requiredHeaders = ['Authorization'];
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  if (missingHeaders.length > 0) {
      return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
      var token = req.get('Authorization').split(' ')[1];
      const realm = getRealm(token);
      console.log("Realm name:", realm);
      let group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
      FIUService.getFiFetch(req.body,realm,group).then(function (result) {
          console.log('fetched BSA Report successfully',result);
            res.status(result.statusCode).send(result.result.data);
      }).catch(function (err) {
              console.log("Error in  getBsaReportAuth controller", err);
              res.status(err.statusCode).send(err);
          });
  }
}

function postBulkFIRequets(req,res) {
  if (req.get('Authorization')) {
    const token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;

    FIUService.postBulkFiRequest(req.body,realm,group)
      .then(function (result) {
        console.log('status fetched successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  getFiRequestStatus controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

function postBulkFIRequetStatus(req,res) {
  if (req.get('Authorization')) {
    const token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    console.log("req.params--->",req)
    if (!Object.keys(req.query).length) {
      const error = new Error("Please provide id in query parameter")
      let errorBody = {
        message: errorResponses[400].message,
        error: errorResponses[400].error,
        errorMessage: error.message,
        statusCode: errorResponses[400].statusCode,
      };
      console.error("Query parameters provided");
      return res.status(errorBody.statusCode).json(errorBody);
    }
    var id = req.query.id;
  


    FIUService.postBulkFiRequestStatus(id,realm,group)
      .then(function (result) {
        console.log('status fetched successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in  getFiRequestStatus controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    const error = new Error("No Authorization token found!");
    let errorBody = {
      message: errorResponses[403].message,
      error: errorResponses[403].error,
      errorMessage: error.message,
      statusCode: errorResponses[403].statusCode,
    };
    res.status(errorBody.statusCode).send(errorBody);
    // res.status(403).send('No Authorization token found!');
  }
}

/*END Auth Controller*/ 

module.exports = {
  postConsent,
  postFIRequest,
  getStatusByConsentHandle,
  postConsentNotification,
  postFIdata,
  getFinancialInfo,
  postFINotification,
  getConsentInfoByConsentId,
  postConsentInformation,
  getFiRequestsByFilters,
  getConsentsByFilters,
  getConsentsByConsentRequestId,
  xmlConverter,
  logoutUser,
  getTableDataByValue,
  getAllAggregators,
  getDecryptedFI,
  getConsentsCount,
  getRequestCount,
  getAllPurposeCodes,
  getAllConsentModes,
  xmlConverterToPdf,
  getAllConsentTypes,
  getAllFiTypes,
  getAllOperators,
  postBulkConsent,
  postProduct,
  deleteProduct,
  updateProduct,
  getProductDetailsbyId,
  getAllProductDetails,
  updateAggregatorStatus,
  setDefaultAggregator,
  getAllConfigurations,
  authServerGenerateSession,
  brandingConfiguration,
  getBrandConfiguration,
  updateBrandingConfiguration,
  automateFiRequest,
  postDraftProduct,
  generateDepositReport,
  getAggregatorDetailsbyId,
  updateAggregatorDetailsById,
  getAllMasterTableData,
  getFIRequestBySessionId,
  generateAnalyticsReport,
  getGroup,
  getConsentTrail,
  customerCount,
  fiTypesCount,
  getAggregatorsByFiRequest,
  getAggregatorsByConsent,
  getConsentExpiryCount,
  getFiTypesByFiRequest,
  getRole,
  getAllRoles,
  deleteBrandingConfiguration,
  bsaReportDownload,
  getBsaReport,
  sendSms,
  schedulerNotification,
  postScheduler,
  getScheduler,
  pauseScheduler,
  resumeScheduler,
  getAnalyticalReportByConsentHandle,
  getAnalyticalReports,
  getAllRealmConfig,
  updateRealConfig,
  getRealmIFrame,
  postBulkConsentIFrame,
  postQueueJob,
  getFiRequestStatus,
  postFiRequestData,

  generateSession,
  validateSession,
  getActiveAggregators,
  getDefaultAggregator,
  getProductDetailsbyProductId,
  getAllMasterTableDetailsData,
  getBrandConfigurations,
  getBsaReportAuth,
  fiDataSchedulerNotification,
  getFiFetchCountDetails,
  postBulkFIRequets,
  postBulkFIRequetStatus
}