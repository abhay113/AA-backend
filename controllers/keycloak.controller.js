const keycloakService = require('../services/keycloak.service')
const winston = require('winston');
const { errorResponses } = require('../utils/messageCode.json')
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

/**
 * @author: aadarsh
 * @description: GET all realms.
 * @param: {} req.param will contain nothing.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

/**
 * @summary Retrieves a list of all available realms from the Keycloak server.
 * @description This route handler calls the `keycloakService` to fetch all configured realms. It does not require any parameters.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object used to send back the list of realms or an error.
 * @returns {void}
 */
function getAllRealms(req, res) {
    console.log('Inside getAllRealms controller');

    // Delegate the call to the service layer to handle the logic of fetching realms.
    keycloakService.getAllRealms().then(function (result) {
        // On successful retrieval, send the result with the appropriate status code.
        res.status(result.statusCode).send(result);
    }).catch(function (err) {
        // If an error occurs, log it and send back a formatted error response.
        console.log('Error in getAllRealms controller', err);
        winston.error('Error in getAllRealms controller', err);
        res.status(err.statusCode).send(err);
    });
}


/**
 * @summary Adds a new realm to the Keycloak server.
 * @description This controller takes realm configuration data from the request body and passes it to the `keycloakService` to create a new realm.
 * @param {object} req - The Express request object, containing the new realm's configuration in `req.body`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function addRealm(req, res) {
    console.log('Inside addRealm controller');
    keycloakService
    // Extract the realm configuration from the request body.
    var body = req.body;

    console.log(body);

    // Call the service to create the new realm.
    keycloakService.addRealm(body).then(function (result) {
        // Send a success response upon creation.
        res.status(result.statusCode).send(result);
    }).catch(function (err) {
        // Handle and log any errors during realm creation.
        console.log('Error in addRealm controller', err);
        winston.error('Error in addRealm controller', err);
        res.status(err.statusCode).send(err);
    });
}

/**
 * @summary Retrieves detailed data for a specific realm.
 * @description Fetches comprehensive information about a single realm identified by its name. Requires a valid admin Authorization token.
 * @param {object} req - The Express request object, with the realm name in `req.params.realm` and an Authorization header.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getRealmData(req, res) {
    console.log('Inside getRealmData controller');

    // Check for the presence of an Authorization header.
    if (req.get('Authorization')) {
        // Extract the JWT from the "Bearer <token>" format.
        var token = req.get('Authorization').split(' ')[1];

        // Get the realm name from the URL parameters.
        var realmName = req.params.realm;

        console.log(token);

        // Call the service to fetch the realm's data.
        keycloakService.getRealmData(token, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getRealmData controller', err);
            winston.error('Error in getRealmData controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
        // If the token is missing, send a 403 Forbidden error.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}


/**
 * @summary Retrieves realm details from the local database.
 * @description Fetches realm-specific information stored in the application's own database, rather than from the Keycloak Admin API.
 * @param {object} req - The Express request object, with the realm ID in `req.params.realm`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getRealmDbDetails(req, res) {
    console.log('Inside getRealmDbDetails controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        // The realm ID is passed as a URL parameter.
        var realmId = req.params.realm;

        console.log(token);
        console.log(realmId);

        // Call the service to query the local database for realm details.
        keycloakService.getRealmDbDetails(realmId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getRealmDbDetails controller', err);
            winston.error('Error in getRealmDbDetails controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Retrieves all clients (applications) within a specific realm.
 * @description A client in Keycloak represents an application or service that is secured by Keycloak. This function fetches a list of all such clients for a given realm.
 * @param {object} req - The Express request object, containing the realm name in `req.params.realm`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getRealmClients(req, res) {
    console.log('Inside getRealmClients controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;

        console.log(token);

        // Call the service to get the list of clients for the specified realm.
        keycloakService.getRealmClients(token, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getRealmClients controller', err);
            winston.error('Error in getRealmClients controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Creates a resource server client in Keycloak.
 * @description A resource server is a client that has its authorization services enabled. This function creates such a client, allowing it to define protected resources and policies.
 * @param {object} req - The Express request object, with the resource server configuration in `req.body`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function createResourceServer(req, res) {
    console.log('Inside createResourceServer controller');

    var body = req.body;

    // Delegate the creation logic to the keycloak service.
    keycloakService.createResourceServer(body).then(function (result) {
        res.status(result.statusCode).send(result);
    }).catch(function (err) {
        console.log('Error in createResourceServer controller', err);
        winston.error('Error in createResourceServer controller', err);
        res.status(err.statusCode).send(err);
    });
}

/**
 * @summary Retrieves all users within a specific realm.
 * @description Fetches a list of all user accounts that exist in the specified Keycloak realm.
 * @param {object} req - The Express request object, with the realm name in `req.params.realm`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllRealmUsers(req, res) {
    console.log('Inside getAllRealmUsers controller');

    if (req.get('Authorization')) {
        var realmName = req.params.realm;

        var token = req.get('Authorization').split(' ')[1];

        console.log(token);

        // Call the service to fetch all users for the given realm.
        keycloakService.getAllRealmUsers(token, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getAllRealmUsers controller', err);
            winston.error('Error in getAllRealmUsers controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}


/**
 * @summary Registers a new user in a specified Keycloak realm.
 * @description Creates a new user account with the details provided in the request body.
 * @param {object} req - The Express request object, containing user details and the target realm in `req.body`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function registerKeycloakUser(req, res) {
    console.log('Inside registerKeycloakUser controller');
    console.log('Request Headers:', req.headers);

    const authorizationHeader = req.get('Authorization');
    console.log("::::::", authorizationHeader)

    if (authorizationHeader) {
        const token = authorizationHeader.split(' ')[1];
        console.log('Token:', token);

        // The target realm is specified in the request body.
        const realm = req.body.realm;
        const body = req.body;

        console.log('REALM', realm);
        console.log('Request Body', body);

        // Call the service to perform the user registration.
        keycloakService.registerKeycloakUser(body, token, realm)
            .then(function (result) {
                res.status(result.statusCode).send(result);
            })
            .catch(function (err) {
                console.log('Error in registerKeycloakUser controller', err);
                winston.error('Error in registerKeycloakUser controller', err);
                res.status(err.statusCode || 500).send(err);
            });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}


/**
 * @summary Creates a new role within a specific client.
 * @description Client roles are specific to an application (client) and are separate from realm-level roles. This function creates a new role in the namespace of a given client.
 * @param {object} req - The Express request object, with realm and clientId in params, and role details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function createClientRole(req, res) {
    console.log('Inside createClientRole controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        // Extract realm and client ID from URL parameters.
        var realmName = req.params.realm;
        var clientId = req.params.clientId;

        // The new role's definition is in the request body.
        var body = req.body;

        console.log(token);

        // Call the service to create the client-specific role.
        keycloakService.createClientRole(token, realmName, clientId, body).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in createClientRole controller', err);
            winston.error('Error in createClientRole controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}
/**
 * @summary Retrieves all roles associated with a specific client.
 * @description Fetches a list of roles that are defined within the namespace of a particular client (application).
 * @param {object} req - The Express request object, containing the realm name and client ID in `req.params`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getClientRoles(req, res) {
    console.log('Inside getClientRoles controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;
        var clientId = req.params.clientId;

        console.log(token);

        // Call the service to fetch the client's roles.
        keycloakService.getClientRoles(token, realmName, clientId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getClientRoles controller', err);
            winston.error('Error in getClientRoles controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Creates a new resource within a client's authorization settings.
 * @description Resources represent protectable assets, like a URL or a set of data. This function defines a new resource under a specific client's resource server.
 * @param {object} req - The Express request object, with realm and clientId in params, and resource details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function createResources(req, res) {
    console.log('Inside getClientRoles controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;
        var clientId = req.params.clientId;
        var resourceBody = req.body


        console.log(token);

        // Call the service to create the resource.
        keycloakService.createResources(token, realmName, clientId, resourceBody).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getClientRoles controller', err);
            winston.error('Error in getClientRoles controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Deletes a user from a specified Keycloak realm.
 * @description Permanently removes a user account from Keycloak using their unique user ID.
 * @param {object} req - The Express request object, with the realm and user_id in `req.params`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function deleteKeyCloakUser(req, res) {
    console.log('Inside delete Keycloak user');

    var token = req.get('Authorization');

    if (token) {
        token = token.split(' ')[1]; // Extract token from "Bearer <token>"

        var user_id = req.params.user_id;
        var realm = req.params.realm;

        console.log('User ID:', user_id);
        console.log('Realm:', realm);

        // Call the service to delete the user.
        keycloakService.deleteKeyCloakUser(token, realm, user_id)
            .then(function (result) {
                console.log('User deleted successfully');
                res.status(result.statusCode).send(result);
            })
            .catch(function (err) {
                console.log('Error in delete user controller', err);
                res.status(err.statusCode || 500).send(err);
            });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}


/**
 * @summary Maps a client role to a specific user.
 * @description Assigns a role that is defined within a client to a user, granting them the permissions associated with that role for that client.
 * @param {object} req - The Express request object, with realm, user_id, and client_id in params, and an array of roles in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function addClientRoleMapping(req, res) {
    console.log('Inside createClientRole controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;
        var user_id = req.params.user_id;
        var client_id = req.params.client_id;

        var body = req.body;

        console.log(token);

        // Call the service to add the role mapping to the user.
        keycloakService.addClientRoleMapping(token, realmName, user_id, body, client_id).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in addClientRoleMapping controller', err);
            winston.error('Error in addClientRoleMapping controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Retrieves all role mappings for a specific user.
 * @description Fetches a comprehensive list of all roles (both realm-level and client-level) that have been assigned to a given user.
 * @param {object} req - The Express request object, with realm and user_id in `req.params`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getUserRoleMappings(req, res) {
    console.log('Inside getUserRoleMappings controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;
        var user_id = req.params.user_id;

        console.log(token);

        // Call the service to get the user's role mappings.
        keycloakService.getUserRoleMappings(token, realmName, user_id)
            .then(function (result) {
                res.status(result.statusCode).send(result);
            })
            .catch(function (err) {
                console.log('Error in getUserRoleMappings controller', err);
                winston.error('Error in getUserRoleMappings controller', err);
                res.status(err.statusCode).send(err);
            });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Creates a new user group within a realm.
 * @description Groups are used to manage sets of users and apply roles or attributes to them collectively.
 * @param {object} req - The Express request object, with group details and realm name in `req.body`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function createGroup(req, res) {
    console.log('Inside createGroup controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.body.realm;
        var body = req.body;

        console.log(token);

        // Call the service to create the new group.
        keycloakService.createGroup(token, realmName, body).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in createGroup controller', err);
            winston.error('Error in createGroup controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Retrieves all groups within a specified realm.
 * @description Fetches a list of all user groups that have been defined in a realm.
 * @param {object} req - The Express request object, with the realm name in `req.query.realm`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getAllGroups(req, res) {
    console.log('Inside getAllGroups controller');

    if (req.get('Authorization')) {
        var realmName = req.query.realm;

        var token = req.get('Authorization').split(' ')[1];

        console.log(token);

        // Call the service to fetch all groups.
        keycloakService.getAllGroups(token, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getAllGroups controller', err);
            winston.error('Error in getAllGroups controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Retrieves detailed data for a specific group by its ID.
 * @description Fetches the configuration, attributes, and roles of a single group.
 * @param {object} req - The Express request object, with realm in query and groupId in params.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getGroupDataById(req, res) {
    console.log('Inside getGroupDataById controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        var groupId = req.params.groupId;

        console.log(token);

        // Call the service to fetch group data by its unique ID.
        keycloakService.getGroupDataById(token, realmName, groupId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getGroupDataById controller', err);
            winston.error('Error in getGroupDataById controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Updates the details of an existing group.
 * @description Modifies the properties (e.g., name, attributes) of a group identified by its ID.
 * @param {object} req - The Express request object, with group data, realm, and groupId in `req.body`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function updateGroup(req, res) {
    console.log('Inside updateGroup controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.body.realm;
        var groupId = req.body.groupId;
        var body = req.body;

        console.log(token);

        // Call the service to update the group's information.
        keycloakService.updateGroup(token, realmName, groupId, body).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in updateGroup controller', err);
            winston.error('Error in updateGroup controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Adds a user to a group.
 * @description Assigns a user to an existing group, making them a member. This is used for managing user collections.
 * @param {object} req - The Express request object, with user and group details in `req.body`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function addUserToGroup(req, res) {
    console.log('Inside addUserToGroup controller');

    if (req.get('Authorization')) {
        var realmName = req.body.realm;
        var body = req.body;
        var token = req.get('Authorization').split(' ')[1];

        console.log(token);

        // Call the service to add the user to the specified group.
        keycloakService.addUserToGroup(token, body, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in addUserToGroup controller', err);
            winston.error('Error in addUserToGroup controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}
/**
 * @summary Creates a new child group under an existing parent group.
 * @description Keycloak supports nested groups. This function creates a new group that is a subgroup of a specified parent group.
 * @param {object} req - The Express request object, with child group details and parent groupId in `req.body`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function createChildGroup(req, res) {
    console.log('Inside createChildGroup controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.body.realm;
        var body = req.body;
        var groupId = req.body.groupId; // This is the parent group's ID.


        console.log(token);

        // Call the service to create the new subgroup.
        keycloakService.createChildGroup(token, realmName, body, groupId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in createChildGroup controller', err);
            winston.error('Error in createChildGroup controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}
/**
 * @summary Retrieves a list of all members of a specific group.
 * @description Fetches the user accounts that are members of the group identified by `groupId`.
 * @param {object} req - The Express request object, with realm and groupId in `req.query`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getGroupMembers(req, res) {
    console.log('Inside getGroupMembers controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        var groupId = req.query.groupId;

        console.log(token);

        // Call the service to fetch the list of group members.
        keycloakService.getGroupMembers(token, realmName, groupId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getGroupMembers controller', err);
            winston.error('Error in getGrogetGroupMembersupDataById controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Deletes a group from a realm.
 * @description Permanently removes a group, including any of its child groups.
 * @param {object} req - The Express request object, with realm in query and groupId in params.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function deleteGroup(req, res) {
    console.log('Inside deleteGroup controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        var groupId = req.params.groupId;

        console.log(token);

        // Call the service to delete the specified group.
        keycloakService.deleteGroup(token, realmName, groupId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in deleteGroup controller', err);
            winston.error('Error in deleteGroup controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Assigns one or more realm roles to a group.
 * @description All members of the group will inherit the permissions granted by these roles.
 * @param {object} req - The Express request object, with realm, groupId, and an array of roles in `req.body`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function addRolesToGroup(req, res) {
    console.log('Inside addRolesToGroup controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        // Extract role information, realm, and group ID from the request body.
        var roleBody = req.body.roles;
        var realmName = req.body.realm;
        var groupId = req.body.groupId

        console.log(token);

        // Call the service to map the roles to the group.
        keycloakService.addRolesToGroup(token, roleBody, realmName, groupId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in addRolesToGroup controller', err);
            winston.error('Error in addRolesToGroup controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Retrieves all available role mappings in a realm.
 * @description Fetches a list of roles that can be assigned to users or groups.
 * @param {object} req - The Express request object, with the realm name in `req.query`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getRoleMappings(req, res) {
    console.log('Inside getRoleMappingByClientId controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;

        console.log(token);

        // Call the service to get all available role mappings.
        keycloakService.getRoleMappings(token, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getRoleMappings controller', err);
            winston.error('Error in getRoleMappings controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Removes a role mapping from a group.
 * @description Revokes a role from a group, so its members no longer inherit the associated permissions.
 * @param {object} req - The Express request object, with realm and groupId in query, and roles to be removed in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function deleteGroupRole(req, res) {
    console.log('Inside deleteGroupRole controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        var groupId = req.query.groupId;

        var body = req.body;

        console.log(token);

        // Call the service to delete the role mapping from the group.
        keycloakService.deleteGroupRole(token, realmName, groupId, body).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in delete Group role controller', err);
            winston.error('Error in delete group role controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}
/**
 * @summary Retrieves the roles that are currently assigned to a group.
 * @description Fetches the list of realm-level and client-level roles that have been mapped to a specific group.
 * @param {object} req - The Express request object, with realm in query and groupId in params.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getGroupRole(req, res) {
    console.log('Inside getGroupRole controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        var groupId = req.params.groupId;

        console.log(token);

        // Call the service to fetch the roles assigned to the group.
        keycloakService.getGroupRole(token, realmName, groupId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getGroupRole controller', err);
            winston.error('Error in getGroupRole controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Removes a user from a group.
 * @description Revokes a user's membership from a specified group.
 * @param {object} req - The Express request object, with realm in query and user/group details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function removeUserFromGroup(req, res) {
    console.log('Inside removeUserFromGroup controller');

    if (req.get('Authorization')) {
        var realmName = req.query.realm;
        var body = req.body;
        var token = req.get('Authorization').split(' ')[1];

        console.log(token);

        // Call the service to remove the user from the group.
        keycloakService.removeUserFromGroup(token, body, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in removeUserFromGroup controller', err);
            winston.error('Error in removeUserFromGroup controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Retrieves authorization policies for a resource server.
 * @description Fetches all the defined policies (e.g., role-based, user-based) that govern access to resources.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getResourceServerPolicy(req, res) {
    console.log('Inside getResourceServerPolicy controller');

    if (req.get('Authorization')) {
        // var token = req.get('Authorization').split(' ')[1];

        // console.log(token);

        // Call the service to fetch the policies.
        keycloakService.getResourceServerPolicy().then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getResourceServerPolicy controller', err);
            // winston.error('Error in getResourceServerPolicy controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Adds a new authorization policy to a resource server.
 * @description Creates a new policy that can be used to define access control rules for resources.
 * @param {object} req - The Express request object, with policy details in `req.body`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function addResourceServerPolicy(req, res) {
    console.log('Inside addResourceServerPolicy controller');

    if (req.get('Authorization')) {
        // var realmName = req.query.realm;
        var body = req.body;
        // var token = req.get('Authorization').split(' ')[1];

        // console.log(token);

        // Call the service to create the new authorization policy.
        keycloakService.addResourceServerPolicy(body).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in addResourceServerPolicy controller', err);
            // winston.error('Error in addResourceServerPolicy controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Creates a new realm-level role.
 * @description Defines a new role at the realm level, which can then be assigned to users or groups across different clients.
 * @param {object} req - The Express request object, with realm in query and role details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function createRole(req, res) {
    console.log('Inside createRole controller');

    if (req.get('Authorization')) {
        var realmName = req.query.realm;
        var body = req.body;
        var token = req.get('Authorization').split(' ')[1];
        // Generate a unique ID for the new role and associate it with the realm.
        body.role_id = uuid.v4();
        body.realm = realmName;
        // console.log(token);

        // Call the service to create the new realm role.
        keycloakService.createRole(token, body, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in add role controller', err);
            // winston.error('Error in addResourceServerPolicy controller', err);
            let errorBody = {
                message: err.message,
                error: err.error,
                errorMessage: err.errorMessage,
                statusCode: err.statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Retrieves a realm-level role by its name.
 * @description Fetches the details of a specific role within a realm using the role's name.
 * @param {object} req - The Express request object, with realm and roleName in `req.query`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getRoleByName(req, res) {
    console.log('Inside getRoleByName controller');

    if (req.get('Authorization')) {
        var realmName = req.query.realm;
        var roleName = req.query.roleName;
        var token = req.get('Authorization').split(' ')[1];

        // console.log(token);

        // Call the service to fetch the role by its name.
        keycloakService.getRoleByName(token, realmName, roleName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getRoleByName controller', err);
            // winston.error('Error in getResourceServerPolicy controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}

/**
 * @summary Associates a policy with a role.
 * @description Creates a permission that links a role to an authorization policy, effectively defining what the role is allowed to do.
 * @param {object} req - The Express request object, with realm in query and policy details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function setRolePolicy(req, res) {
    console.log('Inside setRolePolicy controller');

    if (req.get('Authorization')) {
        var body = req.body;
        var realmName = req.query.realm;
        var token = req.get('Authorization').split(' ')[1];
        // console.log(token);

        // Call the service to create the role-policy association.
        keycloakService.setRolePolicy(token, realmName, body).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in setRolePolicy controller', err);
            // winston.error('Error in getResourceServerPolicy controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);

    }
}

/**
 * @summary Retrieves all groups for a given realm.
 * @description An alternative to `getAllGroups` that uses a URL parameter for the realm name.
 * @param {object} req - The Express request object, with the realm name in `req.params.realm`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getGroups(req, res) {
    console.log("In Get groups controller");
    if (req.get('Authorization')) {
        var realmName = req.params.realm;
        var token = req.get('Authorization').split(' ')[1];
        // console.log(token);

        // Call the service to fetch the groups.
        keycloakService.getGroups(token, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getGroups controller', err);
            // winston.error('Error in getResourceServerPolicy controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);

    }
}

/**
 * @summary Retrieves all users in a given realm.
 * @description An alternative to `getAllRealmUsers`, fetching all user accounts.
 * @param {object} req - The Express request object, with the realm name in `req.params.realm`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getUser(req, res) {
    console.log("In Get user controller");
    if (req.get('Authorization')) {
        var realmName = req.params.realm;
        var token = req.get('Authorization').split(' ')[1];
        // console.log(token);

        // Call the service to fetch the list of users.
        keycloakService.getUser(token, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in get user controller', err);
            // winston.error('Error in getResourceServerPolicy controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);

    }
}


/**
 * @summary Updates a user's profile information.
 * @description Modifies the details (e.g., email, name, attributes) of an existing user.
 * @param {object} req - The Express request object, with realm in params and user data in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function updateUser(req, res) {
    console.log("In update user controller");
    if (req.get('Authorization')) {
        var body = req.body;
        var realmName = req.params.realm;
        var token = req.get('Authorization').split(' ')[1];
        // console.log(token);

        // Call the service to apply the updates to the user.
        keycloakService.updateUser(token, realmName, body).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in update user controller', err);
            // winston.error('Error in getResourceServerPolicy controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);

    }
}


/**
 * @summary Decodes a JWT to extract the realm name from the issuer ('iss') claim.
 * @description This helper function inspects the payload of a JWT to find the issuer URL and extracts the last part of the path, which is assumed to be the realm name.
 * @param {string} accessToken - The JSON Web Token string.
 * @returns {string} The name of the realm.
 * @throws {Error} Throws an error if the token is invalid or the 'iss' claim is missing.
 */
function getRealm(accessToken) {
    // Decode the token without verifying its signature, as we only need to read the payload.
    const decoded = jwt.decode(accessToken);
    if (decoded) {
        // Get the 'iss' (issuer) claim from the decoded token.
        const issuer = decoded.iss;
        if (issuer) {
            // Extract realm name from the issuer URL by splitting the URL by '/' and taking the last element.
            const realm = issuer.split('/').pop(); // Assumes the realm name is the last part of the URL
            console.log('Realm:', realm);
            return realm;
        } else {
            // If the 'iss' claim is not found, throw a formatted error.
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
        // If the token is malformed or invalid, throw a formatted error.
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
 * @summary Assigns one or more roles to a user.
 * @description Maps roles to a user account, granting them the associated permissions.
 * @param {object} req - The Express request object, with user_id in params and roles in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function roleMapping(req, res) {
    console.log('Inside roleMapping controller');

    if (req.get('Authorization')) {
        let token = req.get('Authorization').split(' ')[1];
        const realm = getRealm(token);
        var body = req.body;
        var userId = req.params.user_id;
        // var token = req.get('Authorization').split(' ')[1];

        // Call the service to perform the role mapping.
        keycloakService.roleMapping(token, realm, body, userId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in roleMapping controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
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

    }
}


/**
 * @summary Retrieves all roles for the current user's realm.
 * @description Fetches a list of all realm-level roles available in the realm extracted from the user's JWT.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function getRoles(req, res) {
    console.log('Inside getRoles controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];
        // Determine the realm from the user's token.
        const realm = getRealm(token);
       
        // Call the service to fetch all roles for that realm.
        keycloakService.getRoles(realm).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getRoles controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
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
    }
}


/**
 * @summary Deletes a realm-level role.
 * @description Permanently removes a role from the realm.
 * @param {object} req - The Express request object, with realm in query and role details in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function deleteRole(req, res) {
    console.log('Inside deleteRole controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        // var groupId = req.query.groupId;

        var body = req.body;

        console.log(token);

        // Call the service to delete the specified role.
        keycloakService.deleteRole(token, realmName, body).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in delete role controller', err);
            winston.error('Error in delete role controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);
    }
}


/**
 * @summary Updates an existing realm-level role.
 * @description Modifies the properties of a realm role, such as its name or description.
 * @param {object} req - The Express request object, with realm in query and updated role data in the body.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function updateRole(req, res) {
    console.log("In update role controller");
    if (req.get('Authorization')) {
        var body = req.body;
        var realmName = req.query.realm;
        var token = req.get('Authorization').split(' ')[1];
        // console.log(token);

        // Call the service to apply the updates to the role.
        keycloakService.updateRole(token, realmName, body).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in update role controller', err);
            // winston.error('Error in getResourceServerPolicy controller', err);
            let errorBody = {
                message: errorResponses[500].message,
                error: errorResponses[500].error,
                errorMessage: err.message,
                statusCode: errorResponses[500].statusCode,
            };
            res.status(errorBody.statusCode).send({ errorBody });
        });
    } else {
        // Handle missing authorization token.
        // res.status(403).send('No Authorization token found!');
        const error = new Error("No Authorization token found!");
        let errorBody = {
            message: errorResponses[403].message,
            error: errorResponses[403].error,
            errorMessage: error.message,
            statusCode: errorResponses[403].statusCode,
        };
        res.status(errorBody.statusCode).send(errorBody);

    }
}

/**
 * @summary Handles user login against a specific realm.
 * @description Takes user credentials and attempts to authenticate them with Keycloak to obtain access and refresh tokens. The realm is dynamically determined from the request URL.
 * @param {object} req - The Express request object. The realm is inferred from `req.baseUrl`, and credentials are in `req.body`.
 * @param {object} res - The Express response object.
 * @returns {void}
 */
function userLogin(req, res) {
    console.log("req",req.baseUrl)
    // The realm is dynamically extracted from the last part of the base URL (e.g., /api/v1/auth/{realmName}).
    const parts = req.baseUrl.split("/");
    const realmName = parts[parts.length - 1]; // Extract the last part
    console.log("baseurl---->",realmName)
    // Call the service to handle the login logic.
    keycloakService.postLogin(req.body,realmName)
    .then(function (result) {
      console.log('login successfully');
      res.status(result.statusCode).send(result);
    })
    .catch(function (err) {
      console.log("Error in post login", err);
      res.status(err.statusCode).send(err);
    });
  }

module.exports = {
    addRealm,
    getRealmData,
    getRealmDbDetails,
    getRealmClients,
    getAllRealms,
    createResourceServer,
    getAllRealmUsers,
    registerKeycloakUser,
    createClientRole,
    getClientRoles,
    createResources,
    deleteKeyCloakUser,
    addClientRoleMapping,
    getUserRoleMappings,
    createGroup,
    getAllGroups,
    getGroupDataById,
    updateGroup,
    addUserToGroup,
    createChildGroup,
    getGroupMembers,
    deleteGroup,
    addRolesToGroup,
    getRoleMappings,
    deleteGroupRole,
    getGroupRole,
    removeUserFromGroup,
    getResourceServerPolicy,
    addResourceServerPolicy,
    createRole,
    getRoleByName,
    setRolePolicy,
    getGroups,
    getUser,
    updateUser,
    roleMapping,
    getRoles,
    getRealm,
    deleteRole,
    updateRole,
    userLogin
}