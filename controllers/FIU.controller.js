const FIUService = require('../services/FIU.service')
const jwt = require('jsonwebtoken');
const { errorResponses } = require('../utils/messageCode.json');
const uuid = require('uuid');

/**
 * Decodes a JWT access token to extract the realm name from the issuer ('iss') claim.
 * The realm is assumed to be the last part of the issuer URL.
 * @param {string} accessToken - The JSON Web Token from which to extract the realm.
 * @returns {string} The extracted realm name.
 * @throws {object} An error object with a message and status code if the token is invalid or the issuer claim is not found.
 */
function getRealm(accessToken) {
  // Decode the JWT without verifying the signature. This is safe as we only need to read the payload.
  const decoded = jwt.decode(accessToken);
  if (decoded) {
    // Retrieve the 'iss' (issuer) claim from the token payload.
    const issuer = decoded.iss;
    if (issuer) {
      // Extract realm name from the issuer URL
      // The realm is assumed to be the last segment of the issuer URL path.
      const realm = issuer.split('/').pop(); // Assumes the realm name is the last part of the URL
      console.log('Realm:', realm);
      // Return the extracted realm name.
      return realm;
    } else {
      // If the 'iss' claim is not found, throw a structured error.
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
    // If the token cannot be decoded, throw a structured error indicating an invalid token.
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

/**
 * Decodes a JWT access token to extract the 'realm_id' claim directly from the payload.
 * This is specifically used for IFrame-based authentication flows.
 * @param {string} accessToken - The JSON Web Token from which to extract the realm_id.
 * @returns {string} The extracted realm ID.
 * @throws {object} An error object with a message and status code if the token is invalid or the realm_id claim is not found.
 */
function getRealmIFrame(accessToken) {
  // Decode the JWT to inspect its payload.
  const decoded = jwt.decode(accessToken);
  if (decoded) {
    // Directly access the 'realm_id' claim from the decoded token.
    const realm_id = decoded.realm_id;
    if (realm_id) {
      const realm =realm_id; 
      console.log('Realm:', realm);
      // Return the found realm ID.
      return realm;
    } else {
      // If 'realm_id' is missing, construct and throw a specific error.
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
    // If decoding fails, throw an invalid token error.
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

/**
 * Decodes a JWT access token to extract the user's associated groups from the 'user_groups' claim.
 * @param {string} accessToken - The JSON Web Token.
 * @returns {Array<string> | null} An array of user group names, or null if not found.
 * @throws {object} An error object if the token is invalid or the 'user_groups' claim is missing.
 */
function getGroup(accessToken) {
  try {
    // Decode the token to read its payload.
    const decoded = jwt.decode(accessToken);
    if (decoded) {
      // Extract the 'user_groups' claim.
      const userGroups = decoded.user_groups;
      if (userGroups) {
        // Extract realm name from the issuer URL
        const userGroup = userGroups; // Assumes the realm name is the last part of the URL
        console.log('userGroup:', userGroup);
        // Return the array of user groups.
        return userGroup;
      } else {
        // If 'user_groups' claim is not present, throw a structured error.
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
      // If the token is invalid and cannot be decoded, throw an error.
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
    // Catch any other synchronous errors during execution.
    console.log("Error:", error)
  }

}
/*
 * @author: adarsh
 * @description: POST consent .
 * @param: {} req.param will contain consent detail.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

/**
 * Handles the HTTP POST request to create a new consent.
 * It extracts realm and group information from the JWT and passes the consent details to the FIU service.
 * @param {object} req - The Express request object, containing the Authorization header and consent data in the body.
 * @param {object} res - The Express response object, used to send the result of the operation.
 * @returns {void}
 */
function postConsent(req, res) {
  console.log("In post consent controller");

  // Check if the Authorization header exists.
  if (req.get('Authorization')) {
    // Extract the token from the "Bearer <token>" format.
    var token = req.get('Authorization').split(' ')[1];
    // Get realm and group from the token.
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    // Use the first group if available, otherwise null.
    group = group ? group[0] : null;
    const body = req.body;
    console.log(body);

    // Call the service layer to process the consent creation.
    FIUService.postConsent(body, realm, group)
      .then(function (result) {
        // On success, send the result back to the client.
        console.log('Consent saved successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        // On failure, log the error and send an error response.
        console.log("Error in post consent controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // If no Authorization header is found, return a 403 Forbidden error.
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

/**
 * Handles the HTTP POST request to create a new Financial Information (FI) request.
 * It uses a consent handle to initiate the request and associates it with the user's realm and group.
 * @param {object} req - The Express request object, containing Authorization header and consentHandle in params.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postFIRequest(req, res) {
  console.log("In post consent controller");

  // Verify the presence of an Authorization token.
  if (req.get('Authorization')) {
    // Extract token, realm, and group.
    var token = req.get('Authorization').split(' ')[1];
    let realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    // Default to the first group in the user's group list.
    group = group ? group[0] : null;
    console.log('Group name:', group);
    // Extract the consent handle from the URL parameters.
    const consentHandle = req.params.consentHandle

    // Delegate the FI request creation to the service layer.
    FIUService.postFIRequest(consentHandle, realm, group)
      .then(function (result) {
        // If successful, send the response.
        console.log('FI Request saved successfully');
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        // If an error occurs, send the error response.
        console.log("Error in post FIRequest controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Respond with an error if the Authorization token is missing.
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

/**
 * Handles the HTTP GET request to fetch the status of a consent request using its handle.
 * @param {object} req - The Express request object, with consentHandle as a URL parameter.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getStatusByConsentHandle(req, res) {
  console.log('In Get FI by IDs controller');

  if (req.get('Authorization')) {
    // Extract user context (token, realm, group) from the request.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;
    // Get the consent handle from the request parameters.
    var consentHandle = req.params.consentHandle;

    // Validate that the consentHandle is provided.
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

    // Call the service to get the status.
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
    // Handle missing Authorization token.
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

/**
 * Handles incoming consent notifications, typically from a webhook.
 * This endpoint validates required headers and passes the notification body to the service layer.
 * @param {object} req - The Express request object, containing the notification payload and headers.
 * @param {object} res - The Express response object.
 * @returns {void}
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
  
  // Define required headers for the incoming notification webhook.
  const requiredHeaders = ['Authorization'];
  // Filter out which required headers are missing from the request.
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  // If any headers are missing, send a 400 Bad Request response.
  if (missingHeaders.length > 0) {
    return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
    // Extract the Authorization header and the request body.
    let auth = req.header('Authorization');
    console.log('auth', auth);
    const body = req.body

    // Call the service to process the consent notification.
    FIUService.postConsentNotification(body, auth)
      .then(function (result) {
        // Send the result from the service as the response.
        res.status(result.statusCode).send(result);
      }).catch(function (err) {
        // Handle any errors during processing.
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

/**
 * Retrieves Financial Information (FI) data for a given session ID and optional FIP ID.
 * It authenticates the user via JWT and passes the request to the FIU service.
 * @param {object} req - The Express request object, with sessionId in params and fipID in query.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getFinancialInfo(req, res) {
  console.log("In Get FI by IDs controller");

  // Extract session ID from URL parameters and fipID from query string.
  var sessionId = req.params.sessionId;
  var fipID = req.query.fipID;
  console.log("sessionId: ", sessionId);
  console.log("FIP>>", fipID)
  // Extract token, group, and realm for authorization and context.
  let token = req.get('Authorization').split(' ')[1];
  let group = getGroup(token);
  console.log("Group name:", group);
  group = group ? group[0] : null;
  let realm = getRealm(token);
  console.log("realm name:", realm);

  // Call the service to fetch the financial information.
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

/**
 * Handles incoming Financial Information (FI) notifications from a webhook.
 * It passes the notification payload to the FIU service for processing.
 * @param {object} req - The Express request object, containing the FI notification in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postFINotification(req, res) {
  console.log("In post fi notification controller");

  // if (req.get('Authorization')) {
  //   var token = req.get('Authorization').split(' ')[1];
  //   const realm = getRealm(token);
  //   console.log("Realm name:", realm);

  // Extract the notification body.
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

  // Call the service to handle the FI notification.
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

/**
 * Retrieves detailed information about a specific consent artifact using its ID.
 * The user's realm and group are used for authorization.
 * @param {object} req - The Express request object, with consent_id in the URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getConsentInfoByConsentId(req, res) {
  console.log("In Get consent by ID controller");

  if (req.get('Authorization')) {
    // Extract user context from the JWT.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;

    // Get the consent ID from the request parameters.
    var consent_id = req.params.consent_id;
    console.log("consent_id: ", consent_id);

    // Call the service to fetch the consent information.
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
    // Return an error if no authorization is provided.
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
/**
 * Webhook endpoint for receiving consent information, typically from an external system.
 * It validates required headers and forwards the consent data to the service layer.
 * @param {object} req - The Express request object containing the consent body and Authorization header.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postConsentInformation(req, res) {
  console.log("In Get consent information by ID controller");

  // if (req.get('Authorization')) {
  //   var token = req.get('Authorization').split(' ')[1];
  //   const realm = getRealm(token);
  //   console.log("Realm name:", realm);

  // Extract the consent body from the request.
  var consent_body = req.body;
  console.log("consent details: ", consent_body);
  // Ensure the Authorization header is present.
  const requiredHeaders = ['Authorization'];
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  if (missingHeaders.length > 0) {
    return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
    let auth = req.header('Authorization');
    console.log('auth', auth);

    // Pass the consent data and auth header to the service.
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

/**
 * Webhook endpoint for receiving decrypted Financial Information (FI) data.
 * The data is associated with a specific session ID.
 * @param {object} req - The Express request object with sessionId in params and FI data in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postFIdata(req, res) {
  console.log("In postFIdata controller");

  // Extract payload and session ID.
  const body = req.body;
  const sessionId = req.params.sessionId;
  console.log("Session id:", sessionId);

  // Call the service to process and store the incoming FI data.
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

/**
 * Retrieves a list of Financial Information (FI) requests based on query filter parameters.
 * The results are scoped to the user's realm and group.
 * @param {object} req - The Express request object, with filters in the query string.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getFiRequestsByFilters(req, res) {
  console.log("In Get all consents by filter controller");
  if (req.get('Authorization')) {
    // Extract user context and query filters.
    var token = req.get('Authorization').split(' ')[1];
    const filters = req.query;
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call the service to fetch FI requests matching the filters.
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
    // Handle missing authorization.
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

/**
 * Retrieves a list of consent requests based on query filter parameters.
 * Results are scoped to the user's realm and group.
 * @param {object} req - The Express request object, with filters in the query string.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getConsentsByFilters(req, res) {
  console.log("In Get all consents by filter controller");
  if (req.get('Authorization')) {
    // Extract user context and filters.
    var token = req.get('Authorization').split(' ')[1];
    const filters = req.query;
    console.log("FIlterss", filters)
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call service to fetch consents.
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
    // Handle missing authorization.
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

/**
 * Retrieves the count of consents, grouped by their status (e.g., ACTIVE, PENDING).
 * The count can be filtered by a specific group or defaults to the user's group from the token.
 * @param {object} req - The Express request object. Can contain an optional 'group' query parameter.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getConsentsCount(req, res) {
  console.log("In Get all consents count by status controller");
  if (req.get('Authorization')) {
    let group;
    var token = req.get('Authorization').split(' ')[1];
    // Check if a group is provided in the query, otherwise get it from the token.
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call the service to get the consent counts.
    FIUService.getConsentsCount(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization.
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

/**
 * Retrieves the count of FI requests, grouped by status.
 * The count can be filtered by a group provided in the query parameters.
 * @param {object} req - The Express request object. Can contain an optional 'group' query parameter.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getRequestCount(req, res) {
  if (req.get('Authorization')) {
    let token = req.get('Authorization').split(' ')[1];
    let group;
    // Determine the group from query param or JWT.
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call the service to get the FI request counts.
    FIUService.getRequestCount(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization token.
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

/**
 * Retrieves consent details using the consent request ID.
 * This is different from the consent artifact ID and is used to track the initial request.
 * @param {object} req - The Express request object with `consent_request_id` in the URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getConsentsByConsentRequestId(req, res) {
  console.log("In Get consent by ID controller");

  if (req.get('Authorization')) {
    // Extract realm for context.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    // let group = getGroup(token);
    // console.log("Group name:", group);
    // group = group ? group[0] : null;
    // Get the ID from params.
    var consent_request_id = req.params.consent_request_id;
    console.log("consent_id: ", consent_request_id);

    // Call the service to fetch the consent details.
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
    // Handle missing authorization.
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


/**
 * Converts fetched FI data (in XML format) for a given session into a CSV format for download.
 * @param {object} req - The Express request object with `sessionId` in the URL parameters.
 * @param {object} res - The Express response object, which will stream the CSV file.
 * @returns {void}
 */
function xmlConverter(req, res) {
  console.log("In Download CSV controller");

  var sessionId = req.params.sessionId;
  console.log("sessionId: ", sessionId);

  // Call the service responsible for the XML to CSV conversion and response streaming.
  FIUService.xmlConverter(sessionId, res)
    .then(function (result) {
      // The service handles the response directly, but this resolves the promise.
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("error in Download CSV controller", err);
      res.status(err.statusCode).send(err);
    });
}

// convert to pdf
/**
 * Converts fetched FI data (in XML format) for a given session into a PDF format for download.
 * @param {object} req - The Express request object with `sessionId` in the URL parameters.
 * @param {object} res - The Express response object, which will stream the PDF file.
 * @returns {void}
 */
function xmlConverterToPdf(req, res) {
  console.log("In Download PDF controller");

  // Extract session ID and user context.
  var sessionId = req.params.sessionId;
  console.log("sessionId: ", sessionId);
  var token = req.get('Authorization').split(' ')[1];
  const realm = getRealm(token);
  console.log("Realm name:", realm);
  const body = req.body

  // Call the service responsible for XML to PDF conversion.
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

/**
 * Handles the user logout process.
 * It calls the FIU service to perform logout operations, such as token invalidation.
 * @param {object} req - The Express request object, containing the Authorization token and body with logout info.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function logoutUser(req, res) {
  console.log('Inside logoutUser controller');

  // if (req.get('Authorization')) {
  var token = req.get('Authorization').split(' ')[1];

  var body = req.body;

  console.log(token);

  // Delegate logout logic to the service layer.
  FIUService.logoutUser(body).then(function (result) {
    res.status(result.statusCode).send(result);
  }).catch(function (err) {
    console.log('Error in logoutUser controller', err);
    // winston.error('Error in logoutUser controller', err);
    res.status(err.statusCode).send(err);
  });
}


/**
 * Retrieves data from a specified database table by matching a column with a given value.
 * A generic endpoint for fetching table data.
 * @param {object} req - The Express request object with `tableName`, `columnName`, and `columnValue` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getTableDataByValue(req, res) {
  console.log("In getTableDataByValue controller");

  // Extract parameters from the request URL.
  const tableName = req.params.tableName;
  const columnName = req.params.columnName;
  const columnValue = req.params.columnValue;

  console.log("Data", tableName, columnName, columnValue);

  // Validate that all required parameters are present.
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

  // Call the service to query the database.
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

/**
 * Retrieves a list of all configured Account Aggregators (AAs) for the user's realm.
 * Rejects requests that include any query parameters.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {Promise<void>}
 */
async function getAllAggregators(req, res) {
  console.log("In Get All Aggregators controller");

  // Check for query parameters and return a 400 error if they exist
  // This endpoint expects no query parameters.
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

  // Extract realm from token for context.
  var token = req.get('Authorization').split(' ')[1];
  const realm = getRealm(token);
  console.log("Realm name:", realm);

  try {
    // Asynchronously call the service to get all aggregators.
    const result = await FIUService.getAllAggregators(realm);
    console.log('Fetched aggregators successfully');
    res.status(result.statusCode).json(result);
  } catch (err) {
    // Handle any errors from the service call.
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

/**
 * Retrieves and decrypts the Financial Information (FI) data associated with a session ID.
 * @param {object} req - The Express request object, with `sessionId` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getDecryptedFI(req, res) {
  console.log("In Get FI by IDs controller");

  // Extract session ID and user realm.
  var sessionId = req.params.sessionId;
  console.log("sessionId: ", sessionId);

  var token = req.get('Authorization').split(' ')[1];
  const realm = getRealm(token);
  console.log("Realm name:", realm);

  // Call the service to fetch and decrypt the FI data.
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


/**
 * Retrieves all available purpose codes from the master data.
 * Purpose codes define the reason for data access (e.g., wealth management, loan application).
 * @param {object} req - The Express request object. Should not contain query parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllPurposeCodes(req, res) {
  console.log("In Get All purpose codes controller");

  // Ensure no query parameters are passed to this endpoint.
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

  // Fetch all purpose codes from the service.
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


/**
 * Retrieves all available consent modes (e.g., STORE, VIEW, QUERY).
 * These define how the financial data can be used.
 * @param {object} req - The Express request object. Should not contain query parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllConsentModes(req, res) {
  console.log("In Get All consent mode controller");

  // Validate that no query parameters were sent.
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

  // Fetch all consent modes from the service.
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


/**
 * Retrieves all available consent types (e.g., one-time, periodic).
 * @param {object} req - The Express request object. Should not contain query parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllConsentTypes(req, res) {
  console.log("In Get All consent types controller");

  // Reject requests with query parameters.
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

  // Fetch all consent types from the service.
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


/**
 * Retrieves all available Financial Information (FI) types (e.g., deposit, credit card).
 * @param {object} req - The Express request object. Should not contain query parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllFiTypes(req, res) {
  console.log("In Get All FI types controller");
  // Reject requests with query parameters.
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


  // Fetch all FI types from the service.
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


/**
 * Retrieves all available data filter operators (e.g., =, >, <, BETWEEN).
 * @param {object} req - The Express request object. Should not contain any query parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllOperators(req, res) {
  console.log("In Get All FI types controller");

  // Reject requests with query parameters.
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

  // Fetch all operators from the service.
  FIUService.getAllOperators().then(function (result) {
    console.log(' fetched operators successfully');
    res.status(result.statusCode).send(result);
  })
    .catch(function (err) {
      console.log("Error in  get all operators  controller", err);
      res.status(err.statusCode).send(err);
    });
}

/**
 * Handles a bulk creation of consent requests.
 * The request body should be an array of consent objects.
 * @param {object} req - The Express request object, with an array of consents in the body.
 * @param {object} res - The Express response object.
 * @returns {Promise<void>}
 */
async function postBulkConsent(req, res) {
  console.log("In postBulkConsent controller");
  // Extract user context from token.
  var token = req.get('Authorization').split(' ')[1];
  const realm = getRealm(token);
  console.log("Realm name:", realm);
  let group = getGroup(token)[0];
  // The request body is expected to be an array of consent objects.
  const consentsArray = req.body;
  console.log(consentsArray);
  // console.log('reqheaders', req.headers);
  // let group = req.headers['group'];
  console.log('group', group);
  // let redirectURL = req.headers['redirecturl'];
  // let sessionid = req.headers['sessionid'];

  try {
    // Asynchronously call the service to process the bulk consent request.
    const result = await FIUService.postBulkConsent(consentsArray, group, realm); //, redirectURL, sessionid
    res.status(result.statusCode).send(result);
  } catch (err) {
    console.log("Error in post bulk consent controller", err);
    res.status(err.statusCode).send(err);;
  }
}
/**
 * Handles a bulk creation of consent requests initiated from within an IFrame.
 * It uses a specific token decoding method (`getRealmIFrame`) to extract the realm.
 * @param {object} req - The Express request object, with an array of consents in the body.
 * @param {object} res - The Express response object.
 * @returns {Promise<void>}
 */
async function postBulkConsentIFrame(req, res) {
  console.log("In postBulkConsent controller");

  // var token = req.get('Authorization').split(' ')[1];
  console.log("990 :",req.get('Authorization')
  );
  var token = req.get('Authorization');
  console.log("Token : ",token);
  // Handle tokens that may or may not have the "Bearer " prefix.
  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }
  console.log("getRealmIFrame : 1040",getRealmIFrame(token));
  // console.log("getRealm(token) : 998",getRealm(token)); //THIS IS FOR ISS
  // const realm = getRealm(token); //THIS IS FOR ISS
  // Use the IFrame-specific function to get the realm.
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
    // Call the service to create consents in bulk.
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

/**
 * Creates a new product definition. Products can be used to template consent requests.
 * @param {object} req - The Express request object containing product details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postProduct(req, res) {
  console.log("In post product controller");

  if (req.get('Authorization')) {
    // Extract user context.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    const productBody = req.body;
    console.log(productBody);

    // Call the service to create the new product.
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
    // Handle missing authorization.
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

/**
 * Deletes a product by its ID.
 * @param {object} req - The Express request object with `product_id` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function deleteProduct(req, res) {
  console.log("In delete product controller");

  if (req.get('Authorization')) {
    // Extract user context and product ID.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    const product_id = req.params.product_id;
    console.log(product_id);


    // Call the service to delete the product.
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
    // Handle missing authorization.
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

/**
 * Updates an existing product's details.
 * @param {object} req - The Express request object with `product_id` in params and update data in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function updateProduct(req, res) {
  console.log("In update product controller");

  if (req.get('Authorization')) {
    // Extract user context, product ID, and update payload.
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

    // Call the service to update the product.
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
    // Handle missing authorization.
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

/**
 * Retrieves the details of a single product by its ID.
 * @param {object} req - The Express request object with `product_id` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getProductDetailsbyId(req, res) {
  console.log("In Get product details by IDs controller");

  if (req.get('Authorization')) {
    // Extract user context and product ID.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    var product_id = req.params.product_id;
    console.log(product_id);

    // Call service to fetch product details.
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
    // Handle missing authorization.
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

/**
 * Retrieves all product details available for the user's realm and group.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllProductDetails(req, res) {
  console.log("In Get all products by IDs controller");

  if (req.get('Authorization')) {
    // Extract user context from JWT.
    var token = req.get('Authorization').split(' ')[1];
    console.log('token', token);
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    
    // Call service to fetch all products.
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
    // Handle missing authorization.
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

/**
 * Retrieves all configuration settings for the user's realm.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllConfigurations(req, res) {
  console.log("In Get configurations controller");

  if (req.get('Authorization')) {
    // Extract realm from token.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call service to get all configurations for the realm.
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
    // Handle missing authorization.
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

/**
 * Updates the status of an Account Aggregator (e.g., to active or inactive).
 * @param {object} req - The Express request object, with `aggregator_id` in params and status info in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function updateAggregatorStatus(req, res) {
  console.log("In update consent controller");

  if (req.get('Authorization')) {
  // Extract payload and ID.
  const aggregatorBody = req.body;
  console.log(aggregatorBody);

  const aggregator_id = req.params.aggregator_id;
  console.log(aggregator_id);

  // Extract realm for context.
  var token = req.get('Authorization').split(' ')[1];
  const realm = getRealm(token);

  // Call service to perform the update.
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
    // Handle missing authorization.
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

/**
 * Sets a specific Account Aggregator as the default for the system.
 * @param {object} req - The Express request object, with `aggregator_id` in params and details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
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
  
  // Extract payload and ID.
  const aggregatorBody = req.body;
  console.log(aggregatorBody);

  const aggregator_id = req.params.aggregator_id;
  console.log(aggregator_id);

  // Call service to set the default aggregator.
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


/**
 * Generates an authentication session with the authentication server.
 * This is used to initiate a secure session for a given product and realm.
 * @param {object} req - The Express request object, containing `product_id` and `realm_id` as query parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function authServerGenerateSession(req, res) {
  console.log("in validation of token")

  // Extract query parameters.
  const product_id = req.query.product_id;
  console.log(product_id);

  const realm_id = req.query.realm_id;
  console.log(realm_id);

  // Call the service to generate the session.
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



/**
 * Configures branding settings, such as logos and themes.
 * This endpoint handles multipart/form-data for file uploads (e.g., a logo).
 * @param {object} req - The Express request object, potentially containing a file in `req.file` and JSON payload in `req.body.payload`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function brandingConfiguration(req, res) {
  // Extract file and payload from the multipart request.
  var fileInfo = req.file;
  var payload = req.body.payload;

  if (req.get('Authorization')) {
    // Extract user context (realm and group).
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group;
    // Determine group from query param or from the JWT.
    if (!req.query.group) {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    } else {
      group = req.query.group
    }

    // Ensure that either a file or a JSON payload is provided.
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

    // Parse the JSON payload string into an object.
    var body = JSON.parse(payload || "{}");
    console.log(body);

    // Call the service to create the branding configuration.
    FIUService.brandingConfiguration(body, fileInfo, realm, group)
      .then(function (result) {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in creating brand config controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    // Handle missing authorization.
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


/**
 * Retrieves the branding configuration for the user's realm and group.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getBrandConfiguration(req, res) {
  console.log("In Get brand configurations controller");

  if (req.get('Authorization')) {
    // Extract user context.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group;
    // Determine group from query param or JWT.
    if (!req.query.group) {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    } else {
      group = req.query.group
    }

    // Call service to fetch branding configuration.
    FIUService.getBrandConfiguration(realm, group).then(function (result) {
      console.log(' fetched brand configration successfully');
      res.status(result.statusCode).send(result);
    })
      .catch(function (err) {
        console.log("Error in  get getBrandConfiguration  controller", err);
        res.status(err.statusCode).send(err);
      });

  } else {
    // Handle missing authorization.
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

/**
 * Updates an existing branding configuration.
 * Handles multipart/form-data for updating logos or other files.
 * @param {object} req - The Express request object with `config_id` in params, and optional file and payload.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function updateBrandingConfiguration(req, res) {
  // Extract file and payload from the request.
  var fileInfo = req.file;
  var payload = req.body.payload;
  console.log('fileInfo', fileInfo);

  if (req.get('Authorization')) {
    // Extract user context.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group;
    // Determine group from query param or JWT.
    if (!req.query.group) {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    } else {
      group = req.query.group
    }

    // Validate that there is something to update.
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
    // Get the ID of the configuration to update.
    let config_id = req.params.config_id;
    console.log(fileInfo);
    console.log(payload);

    // Parse the JSON payload.
    var body = JSON.parse(payload || "{}");
    console.log(body);

    // Call service to update the branding configuration.
    FIUService.updateBrandingConfiguration(body, fileInfo, realm, group, config_id)
      .then(function (result) {
        res.status(result.status).send(result);
      })
      .catch(function (err) {
        console.log("Error in updating brand config controller", err);
        res.status(err.status).send(err);
      });
  } else {
    // Handle missing authorization.
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

/**
 * Automates the FI request process based on a configuration.
 * This might be used for recurring data fetches.
 * @param {object} req - The Express request object with configuration details in the body and `config_id` in query.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function automateFiRequest(req, res) {
  console.log("In update consent controller");

  if (req.get('Authorization')) {
    // Extract user context and configuration details.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    const body = req.body;
    console.log(body);

    const config_id = req.query.config_id;
    console.log(config_id);


    // Call the service to trigger the automated FI request.
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
    // Handle missing authorization.
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

/**
 * Saves a product definition as a draft.
 * This allows creating products without publishing them immediately.
 * @param {object} req - The Express request object containing the draft product details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postDraftProduct(req, res) {
  console.log("In post draft product controller");

  if (req.get('Authorization')) {
    // Extract user context.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;
    const productBody = req.body;
    // Add realm and group to the product body before saving.
    productBody.realm = realm;
    productBody.group = group;
    console.log(productBody);

    // Call service to save the draft product.
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
    // Handle missing authorization.
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

/**
 * Generates a report based on deposit account data.
 * @param {object} req - The Express request object containing report parameters in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function generateDepositReport(req, res) {
  console.log("In generate report controller");

  const report = req.body;
  console.log(report);

  // Call the service to generate the report.
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


/**
 * Retrieves the details of a specific Account Aggregator by its ID.
 * @param {object} req - The Express request object with `aggregator_id` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAggregatorDetailsbyId(req, res) {
  console.log("In Get aggregator by IDs controller");

  var aggregator_id = req.params.aggregator_id;
  console.log(aggregator_id);

  // Call service to fetch aggregator details.
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

/**
 * Updates the details of a specific Account Aggregator.
 * @param {object} req - The Express request object with `aggregator_id` in params and update data in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function updateAggregatorDetailsById(req, res) {
  console.log("In update AggregatorDetailsById controller");

  // Extract payload and ID.
  const aggregatorBody = req.body;
  console.log(aggregatorBody);

  const aggregator_id = req.params.aggregator_id;
  console.log(aggregator_id);

  // Call service to perform the update.
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

/**
 * Retrieves all data from all master tables in the system.
 * This is a powerful endpoint for fetching all configuration and metadata at once.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllMasterTableData(req, res) {
  console.log("In Get All consent types controller");
  if (req.get('Authorization')) {
    // Extract user context.
    var token = req.get('Authorization').split(' ')[1];
    let realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call service to fetch all master data.
    FIUService.getAllMasterTableData().then(function (result) {
      console.log('fetched AllMasterTableData successfully');
      res.status(result.statusCode).send(result);
    })
      .catch(function (err) {
        console.log("Error in  getAllMasterTableData controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization.
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

/**
 * Retrieves the details of a specific FI request using its session ID.
 * @param {object} req - The Express request object with `sessionId` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getFIRequestBySessionId(req, res) {
  console.log("In fi request by session id controller");
  if (req.get('Authorization')) {
    // Extract user context and session ID.
    var token = req.get('Authorization').split(' ')[1];
    let realm = getRealm(token);
    console.log("Realm name:", realm);
    // let group = getGroup(token);
    // console.log("Group name:", group);
    // group = group ? group[0] : null;
    const session_id = req.params.sessionId

    // Call service to fetch the FI request details.
    FIUService.getFIRequestBySessionId(session_id).then(function (result) {
      console.log('fetched fi request by session id successfully');
      res.status(result.statusCode).send(result);
    })
      .catch(function (err) {
        console.log("Error in getFIRequestBySessionId controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization.
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

/**
 * Generates an analytics report for a specific session ID.
 * @param {object} req - The Express request object with `sessionId` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function generateAnalyticsReport(req, res) {
  console.log("In generate analytics by session id controller");
  if (req.get('Authorization')) {
    // Extract user context and session ID.
    var token = req.get('Authorization').split(' ')[1];
    let realm = getRealm(token);
    console.log("Realm name:", realm);
    const session_id = req.params.sessionId

    // Call service to generate the analytics report.
    FIUService.getAnalyticstBySessionId(session_id,realm).then(function (result) {
      console.log('analytics by session id successfully');
      res.status(result.statusCode).send(result);
    }).catch(function (err) {
      console.log("Error in generateAnalyticsReport controller", err);
      res.status(err.statusCode).send(err);
    });
  } else {
    // Handle missing authorization.
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

/**
 * Retrieves the consent trail (audit log) for a consent request using its correlation ID.
 * @param {object} req - The Express request object with `correlationId` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getConsentTrail(req, res) {
  console.log("In Get consent Trail controller");
  if (req.get('Authorization')) {
    // Extract user context and correlation ID.
    var token = req.get('Authorization').split(' ')[1];
    let realm = getRealm(token);
    console.log("Realm name:", realm);
    const correlationId = req.params.correlationId

    // Call service to fetch the consent trail.
    FIUService.getConsentTrail(correlationId).then(function (result) {
      console.log('fetched getConsentTrail successfully');
      res.status(result.statusCode).send(result);
    })
      .catch(function (err) {
        console.log("Error in  getConsentTrail controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization.
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

/**
 * Gets the total count of unique customers.
 * Can be filtered by group.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function customerCount(req, res) {
  // const filters = req.require;
  let token = req.get('Authorization').split(' ')[1];
  if (req.get('Authorization')) {
    let group;
    // Determine group from query param or JWT.
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }

    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call service to get the customer count.
    FIUService.customerCount(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization.
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


/**
 * Gets the count of different FI types requested.
 * Can be filtered by group.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function fiTypesCount(req, res) {
  // const filters = req.require;
  let token = req.get('Authorization').split(' ')[1];
  if (req.get('Authorization')) {
    let group;
    // Determine group from query param or JWT.
    if (req.query.group) {
      group = req.query.group
    } else {
     
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call service to get the FI types count.
    FIUService.fiTypesCount(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization.
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


/**
 * Gets a count of FI requests grouped by Account Aggregator.
 * Can be filtered by group.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAggregatorsByFiRequest(req, res) {
  if (req.get('Authorization')) {
    let token = req.get('Authorization').split(' ')[1];
    let group;
    // Determine group from query param or JWT.
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call service to get the counts.
    FIUService.getAggregatorsByFiRequest(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization.
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


/**
 * Gets a count of consents grouped by Account Aggregator.
 * Can be filtered by group.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAggregatorsByConsent(req, res) {
  if (req.get('Authorization')) {
    let group;
    let token = req.get('Authorization').split(' ')[1];
    // Determine group from query param or JWT.
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }

    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call service to get the counts.
    FIUService.getAggregatorsByConsent(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization.
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


/**
 * Gets the count of consents that are expiring soon.
 * Can be filtered by group.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getConsentExpiryCount(req, res) {
  // const filters = req.require;
  if (req.get('Authorization')) {
    let group;
    let token = req.get('Authorization').split(' ')[1];
    // Determine group from query param or JWT.
    if (req.query.group) {
      group = req.query.group
    } else {
      group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
    }

    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call service to get the expiry counts.
    FIUService.getConsentExpiryCount(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization.
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


/**
 * Gets a count of different FI types associated with FI requests.
 * Can be filtered by group.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getFiTypesByFiRequest(req, res) {
  // const filters = req.require;
  if (req.get('Authorization')) {
    let token = req.get('Authorization').split(' ')[1];
    let group;
    // Determine group from query param or JWT.
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

    // Call service to get the FI type counts.
    FIUService.getFiTypesByFiRequest(group,realm)
      .then(result => {
        res.status(result.statusCode).send(result);
      })
      .catch(function (err) {
        console.log("error in get all consents count controller", err);
        res.status(err.statusCode).send(err);
      });
  } else {
    // Handle missing authorization.
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


/**
 * Retrieves role details by role ID.
 * @param {object} req - The Express request object with `role_id` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
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

    // Call service to fetch role information.
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


/**
 * Retrieves all available roles in the system.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllRoles(req, res) {
  console.log("In Get FI by IDs controller");
  if (req.get('Authorization')) {
    // var token = req.get('Authorization').split(' ')[1];

    // Call service to fetch all roles.
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

/**
 * Deletes a branding configuration by its ID.
 * @param {object} req - The Express request object with `config_id` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function deleteBrandingConfiguration(req, res) {
  console.log("In delete product controller");
  if (req.get('Authorization')) {
    // Extract user context and config ID.
    let token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    let config_id = req.params.config_id;
    
    // Call service to delete the branding config.
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
    // Handle missing authorization.
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

/**
 * Initiates the download of a Bank Statement Analysis (BSA) report.
 * @param {object} req - The Express request object containing report parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function bsaReportDownload(req, res) {
  console.log("In generate analytics by session id controller");

  // Call the service with the request body to generate and download the report.
  FIUService.bsaReportDownload(req.body).then(function (result) {
    console.log('analytics by session id successfully');
    res.status(result.statusCode).send(result);
  }).catch(function (err) {
    console.log("Error in generateAnalyticsReport controller", err);
    res.status(err.statusCode).send(err);
  });
}

/**
 * Retrieves a previously generated Bank Statement Analysis (BSA) report.
 * @param {object} req - The Express request object with `sessionId` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getBsaReport(req, res) {
  console.log("In get bsa report controller");

  if (req.get('Authorization')) {
    // Extract user context and session ID.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    // let group = getGroup(token);
    // console.log('Group name:', group);
    // group = group ? group[0] : null;
    let session_id = req.params.sessionId;

    // Call service to fetch the BSA report.
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
    // Handle missing authorization.
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

/**
 * Sends an SMS notification.
 * @param {object} req - The Express request object with SMS details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function sendSms(req, res) {
  console.log("In get sms controller");

  if (req.get('Authorization')) {
    // Extract user context.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);

    // Call service to send the SMS.
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
    // Handle missing authorization.
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

/**
 * Webhook endpoint for receiving notifications from the scheduler service regarding consent status.
 * @param {object} req - The Express request object with notification details.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function schedulerNotification(req,res) {
  // const requiredHeaders = ['Authorization'];
  // const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  
  // if (missingHeaders.length > 0) {
  //   return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  // } else {
    // let auth = req.header('Authorization');
    // console.log('auth', auth);
    const body = req.body
    const auth = 'test' // Placeholder for auth as it's not strictly required here.

    // Call the service to process the scheduler notification.
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

/**
 * Webhook endpoint for receiving notifications from the scheduler service regarding FI data fetch status.
 * @param {object} req - The Express request object with notification details.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function fiDataSchedulerNotification(req,res) {
  // const requiredHeaders = ['Authorization'];
  // const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  
  // if (missingHeaders.length > 0) {
  //   return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  // } else {
    // let auth = req.header('Authorization');
    // console.log('auth', auth);
    const body = req.body
    const auth = 'test' // Placeholder for auth.

    // Call the service to process the FI data scheduler notification.
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
/**
 * Creates a new scheduler job.
 * @param {object} req - The Express request object with scheduler job details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postScheduler(req, res) {
  if (req.get('Authorization')) {
    // Extract user context.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    // Assign a new UUID and the realm to the job details.
    req.body.id = uuid.v4();
    req.body.realm = realm;

    // Call service to create the scheduler job.
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
    // Handle missing authorization.
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

/**
 * Retrieves scheduler job details by consent handle.
 * @param {object} req - The Express request object with `consentHandle` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getScheduler(req, res) {
  if (req.get('Authorization')) {
    // var token = req.get('Authorization').split(' ')[1];
    const consentHandle = req.params.consentHandle

    // Call service to get scheduler details.
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
    // Handle missing authorization.
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

/**
 * Pauses a running scheduler job (queue).
 * @param {object} req - The Express request object with `queueName` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function pauseScheduler(req, res) {
  if (req.get('Authorization')) {
    // var token = req.get('Authorization').split(' ')[1];
    const queueName = req.params.queueName

    // Call service to pause the queue.
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
    // Handle missing authorization.
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


/**
 * Resumes a paused scheduler job (queue).
 * @param {object} req - The Express request object with `queueName` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function resumeScheduler(req, res) {
  if (req.get('Authorization')) {
    // var token = req.get('Authorization').split(' ')[1];
    const queueName = req.params.queueName

    // Call service to resume the queue.
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
    // Handle missing authorization.
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

/**
 * Retrieves a detailed analytical report for a specific consent handle.
 * @param {object} req - The Express request object containing the `consentHandle` in the URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAnalyticalReportByConsentHandle(req, res) {
  if (req.get('Authorization')) {
    // const token = req.get('Authorization').split(' ')[1];
    const consentHandle = req.params.consentHandle;

    // Call the service to fetch the analytical report for the given consent handle.
    FIUService.getAnalyticalReportByConsentHandle(consentHandle)
      .then(function (result) {
        console.log('get scheduler successfully', result);
        // Ensure the result contains a valid statusCode, defaulting to 200 if not present.
        const statusCode = result.statusCode || 200;
        res.status(statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post scheduler controller", err);
        // Fallback to status code 500 if err.statusCode is undefined for robust error handling.
        const statusCode = err.statusCode || 500;
        res.status(statusCode).send(err);
      });

  } else {
    // If no authorization token is provided, construct and send a 403 Forbidden error response.
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

/**
 * Retrieves a summary of all analytical reports for the user's realm and group.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAnalyticalReports(req, res) {
  if (req.get('Authorization')) {
    // Extract realm and group from the JWT for scoping the data.
    const token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;

    // Call the service to fetch all relevant analytical reports.
    FIUService.getAnalyticalReports(realm,group)
      .then(function (result) {
        console.log('get scheduler successfully', result);
        // Ensure a valid status code is sent with the response.
        const statusCode = result.statusCode || 200;
        res.status(statusCode).send(result);
      })
      .catch(function (err) {
        console.log("Error in post scheduler controller", err);
        // Provide a fallback status code for unexpected errors.
        const statusCode = err.statusCode || 500;
        res.status(statusCode).send(err);
      });

  } else {
    // Handle missing authorization token.
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
/**
 * Retrieves all configuration settings for a specific realm.
 * @param {object} req - The Express request object with `realm` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllRealmConfig(req, res) {
  if (req.get('Authorization')) {
    // const token = req.get('Authorization').split(' ')[1];
    
    const realm = req.params.realm;
    console.log("realm : controller ",realm);
    // Call service to fetch the configuration for the specified realm.
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
    // Handle missing authorization.
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
/**
 * Updates the configuration for a specific realm.
 * @param {object} req - The Express request object with `realm` in params and update data in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function updateRealConfig(req, res) {
  if (req.get('Authorization')) {
    // const token = req.get('Authorization').split(' ')[1];
    
    const realm = req.params.realm;
    const body = req.body
    console.log("realm : controller ",realm);
    // Call service to update the realm's configuration.
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
    // Handle missing authorization.
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

/**
 * Creates a new job in a queue.
 * @param {object} req - The Express request object with job details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postQueueJob(req, res) {
    // Assign a new UUID to the job.
    req.body.id = uuid.v4();
    // Call service to create the queue job.
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

/**
 * Retrieves the status of a specific FI request using its session ID.
 * @param {object} req - The Express request object with `sessionId` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getFiRequestStatus(req, res) {
  console.log('In getFiRequestStatus controller');

  if (req.get('Authorization')) {
    // Extract user context and session ID.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log("Group name:", group);
    group = group ? group[0] : null;
    var sessionId = req.params.sessionId;

    // Validate that session ID is provided.
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

    // Call service to get the FI request status.
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
    // Handle missing authorization.
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

/**
 * Webhook for posting FI request information.
 * @param {object} req - The Express request object with FI request data in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postFiRequestData(req, res) {
  const body = req.body
  console.log("body",body)
  // Call the service to process the incoming FI request data.
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

/**
 * Generates a new session for a user journey.
 * Requires correlation ID and product ID to track the user flow.
 * @param {object} req - The Express request object. Requires 'x-correlation-id' and 'product-id' headers, and 'realmId' in params.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function generateSession(req, res) {
  console.log("inside generateSession controller");
  
  var realmId = req.params.realmId;
  console.log("Realm id:", realmId);

  // Check if required headers are present for tracking and context.
  const requiredHeaders = ['x-correlation-id']; //, 'grant_type'
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));

  if (missingHeaders.length > 0) {
      return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
      // Extract headers and payload.
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

      // Call service to generate a new session.
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

/**
 * Validates an existing session.
 * This is used to continue a user journey after an external step, like authentication.
 * @param {object} req - The Express request object. Requires 'x-correlation-id' and 'sessionid' headers, and 'realmId' in params.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function validateSession(req, res) {
  // Check for required headers for session validation.
  const requiredHeaders = ['x-correlation-id', 'sessionid'];
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));
 
  if (missingHeaders.length > 0) {
      return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
      // Extract all necessary headers, parameters, and payload.
      let correlationId = req.header('x-correlation-id');
      let sessionid = req.header('sessionid');
      let group = req.header('group');
      console.log("GROUP : ",group);
      
      let redirectURL = req.header('redirectURL')
      let payload = req.body;
      const realmId = req.params.realmId;
      console.log("realmId :",realmId);
      
      // Call service to validate the session.
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

/**
 * Retrieves a list of all active Account Aggregators for the user's realm.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {Promise<void>}
 */
async function getActiveAggregators(req, res) {
  console.log("In Get All Aggregators controller");

  if (req.get('Authorization')) {
  // Check for query parameters and return a 400 error if they exist
  // This endpoint should not receive any query parameters.
    if (Object.keys(req.query).length > 0) {
        const errorResponse = {
            message: "Query parameters should be empty",
            error: true,
            statusCode: 400,
        };
        console.error("Query parameters provided");
        return res.status(400).json(errorResponse);
    }

    // Extract realm from token to scope the result.
    var token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
  try {
      // Asynchronously call the service to fetch active aggregators.
      const result = await FIUService.getActiveAggregators(realm);
      console.log('Fetched aggregators successfully');
      res.status(result.statusCode).json(result);
  } catch (err) {
      // Handle potential errors from the service.
      console.error("Error in get all aggregators controller", err);
      res.status(err.statusCode || 500).json(err);
  }
  }else {
    // Handle missing authorization.
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

/**
 * Retrieves the currently configured default Account Aggregator.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getDefaultAggregator(req, res) {
  console.log("In Get default Aggregator controller");

  // Call the service to get the default aggregator.
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

/**
 * Retrieves the details of a product using its unique product ID.
 * @param {object} req - The Express request object with `productId` in URL parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getProductDetailsbyProductId(req, res) {
  console.log("In Get FI by IDs controller");

  var product_id = req.params.productId;
  console.log(product_id);

  // Call the service to fetch product details by its ID.
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

/**
 * Retrieves all data from all master detail tables.
 * This is a comprehensive endpoint for fetching system metadata.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllMasterTableDetailsData(req, res) {
  console.log("In Get All consent types controller");

  // Call the service to fetch all master table data.
  FIUService.getAllMasterTableDetailsData().then(function (result) {
    console.log('fetched AllMasterTableData successfully');
    res.status(result.statusCode).send(result);
  })
    .catch(function (err) {
      console.log("Error in  getAllMasterTableData controller", err);
      res.status(err.statusCode).send(err);
    });
}

/**
 * Retrieves all branding configurations available in the system.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getBrandConfigurations(req, res) {
  console.log("In Get brand configurations controller");

  // Call the service to fetch all branding configurations.
  FIUService.getBrandConfigurations().then(function (result) {
      console.log(' fetched brand configration successfully');
      res.status(result.statusCode).send(result);
  })
      .catch(function (err) {
          console.log("Error in  get getBrandConfigurations  controller", err);
          res.status(err.statusCode).send(err);
      });
}
/**
 * Retrieves a Bank Statement Analysis (BSA) report, requiring authorization.
 * @param {object} req - The Express request object, requires Authorization header.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getBsaReportAuth(req, res) {
  console.log("In Get BSA Report controller");
  // var session_id = req.params.session_id;
  // console.log(session_id);
  // Ensure the authorization header is present.
  const requiredHeaders = ['Authorization'];
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  if (missingHeaders.length > 0) {
      return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
      // Extract auth header and call the service.
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

/**
 * Retrieves the count of FI fetches based on criteria in the request body.
 * @param {object} req - The Express request object, with filters in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getFiFetchCountDetails(req, res) {
  // Check for authorization header.
  const requiredHeaders = ['Authorization'];
  const missingHeaders = requiredHeaders.filter(header => !req.header(header));
  if (missingHeaders.length > 0) {
      return res.status(400).send({ message: `Unauthorised access. Missing headers: ${missingHeaders.join(', ')}` });
  } else {
      // Extract user context.
      var token = req.get('Authorization').split(' ')[1];
      const realm = getRealm(token);
      console.log("Realm name:", realm);
      let group = getGroup(token);
      console.log("Group name:", group);
      group = group ? group[0] : null;
      // Call service to get the fetch counts.
      FIUService.getFiFetch(req.body,realm,group).then(function (result) {
          console.log('fetched BSA Report successfully',result);
            res.status(result.statusCode).send(result.result.data);
      }).catch(function (err) {
              console.log("Error in  getBsaReportAuth controller", err);
              res.status(err.statusCode).send(err);
          });
  }
}

/**
 * Initiates multiple FI requests in a single bulk operation.
 * @param {object} req - The Express request object, containing an array of FI request details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postBulkFIRequets(req,res) {
  if (req.get('Authorization')) {
    // Extract user context.
    const token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;

    // Call service to process the bulk FI request.
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
    // Handle missing authorization.
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

/**
 * Retrieves the status of a bulk FI request operation using its unique ID.
 * @param {object} req - The Express request object, with the bulk request 'id' in the query parameters.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function postBulkFIRequetStatus(req,res) {
  if (req.get('Authorization')) {
    // Extract user context.
    const token = req.get('Authorization').split(' ')[1];
    const realm = getRealm(token);
    console.log("Realm name:", realm);
    let group = getGroup(token);
    console.log('Group name:', group);
    group = group ? group[0] : null;
    console.log("req.params--->",req)
    // Validate that the ID is provided in the query.
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
  


    // Call the service to get the status of the bulk request.
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
    // Handle missing authorization.
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
