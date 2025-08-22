 /* global process token*/
var Q = require('q');
const keycloakDao = require('../dao/keycloak.dao');
let SequelizeDao = require('../dao/sequelize.dao');
require('dotenv').config();
const winston = require('winston');
const { errorResponses } = require('../utils/messageCode.json')
const jws = require('jws');


/*
 * @author: adarsh
 * @description: POST create realm.
 * @param: {} req.param will nothing.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */


/**
 * @summary Orchestrates the creation of a new realm in Keycloak and sets up its initial configuration.
 * @description This is a complex, multi-step function that performs a full setup for a new tenant (realm). It handles:
 * 1. Creating the realm in Keycloak with default settings.
 * 2. Storing the realm's metadata in the local database.
 * 3. Creating a default 'angular' client for the frontend application.
 * 4. Creating an initial administrative user for the new realm.
 * 5. Assigning the 'realm-admin' role to this new user.
 * 6. Setting up an Identity Provider (IDP) for brokering authentication.
 * 7. Creating a 'resource-server' client for API authorization.
 * 8. Configuring authorization scopes, resources, policies, and permissions for the resource server.
 * Each step is an asynchronous operation, and the function ensures they are executed in the correct order, handling errors at each stage.
 * @param {object} body - The request body containing configuration details for the new realm. Expected properties include `realm`, `postLoginUrl`, `redirectUris`, `webOrigins`, user details (`email`, `firstName`, `lastName`, `username`, `password`), and authorization `resources` and `roles`.
 * @returns {Promise<object>} A promise that resolves to a structured response object indicating success or failure. On success, it returns the created user's data.
 */
exports.addRealm = async function (body) {
    var deferred = Q.defer();

    // Construct the initial realm configuration object for the Keycloak API.
    let realmBody = {
        enabled: true,
        id: body.realm,
        realm: body.realm,
        registrationAllowed: true,
        // smtpServer: {
        //     auth: "true",
        //     from: process.env.SMTP_FROM,
        //     fromDisplayName: process.env.SMTP_FROM_NAME,
        //     host: process.env.SMTP_HOST,
        //     password: process.env.SMTP_PASSWORD,
        //     port: process.env.SMTP_PORT,
        //     ssl: "false",
        //     starttls: "true",
        //     user: process.env.SMTP_USER_NAME
        // },
        loginTheme: "eps",
        resetPasswordAllowed: true,
        registrationEmailAsUsername: true,
        ssoSessionIdleTimeout: 432000,
        ssoSessionMaxLifespan: 432000,
        accessTokenLifespan: 432000
    }

    // Step 1: Call the DAO to create the realm in Keycloak.
    await keycloakDao.addRealm(token, realmBody).then(async function (res) {
        console.log("======", res);

        // Handle potential errors from the Keycloak API during realm creation.
        if (res?.error) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured creating realm',
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        }
        if (res?.errorMessage) {
            const responseBody = {
                message: errorResponses[400].message, //'An error occured creating realm',
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            // Step 2: If realm creation is successful, add a corresponding record to the local database.
            let realmDbData = {
                realm_id: body.realm,
                realm_name: body.realm
            }
            await keycloakDao.addRealmToDB(realmDbData).then(async function (addRealmToDBRes) {
                console.log(addRealmToDBRes);

                if (addRealmToDBRes?.error) {
                    let responseBody = {
                        message: errorResponses[400].message, //'An error occured adding realm to db',
                        error: errorResponses[400].error,
                        errorMessage: addRealmToDBRes.error.message,
                        statusCode: errorResponses[400].statusCode
                    }

                    deferred.resolve(responseBody);
                } else {
                    // Step 3: Create the default 'angular' client for the realm's frontend.
                    let createClientBody = {
                        "clientId": "angular",
                        "name": "angular",
                        "adminUrl": "",
                        "alwaysDisplayInConsole": false,
                        "access": {
                            "view": true,
                            "configure": true,
                            "manage": true
                        },
                        "attributes": {
                            "post.logout.redirect.uris": body.postLoginUrl.join('##'),
                        },
                        "authenticationFlowBindingOverrides": {},
                        "authorizationServicesEnabled": false,
                        "bearerOnly": false,
                        "directAccessGrantsEnabled": true,
                        "enabled": true,
                        "protocol": "openid-connect",
                        "description": "rest-api",
                        "rootUrl": "",
                        "baseUrl": "",
                        "surrogateAuthRequired": false,
                        "clientAuthenticatorType": "client-secret",
                        "defaultRoles": [
                            "manage-account",
                            "view-profile"
                        ],
                        "redirectUris": body.redirectUris,
                        "webOrigins": body.webOrigins,
                        "notBefore": 0,
                        "consentRequired": false,
                        "standardFlowEnabled": true,
                        "implicitFlowEnabled": false,
                        "serviceAccountsEnabled": false,
                        "publicClient": true,
                        "frontchannelLogout": false,
                        "fullScopeAllowed": true,
                        "nodeReRegistrationTimeout": 0,
                        "defaultClientScopes": [
                            "web-origins",
                            "role_list",
                            "profile",
                            "roles",
                            "email"
                        ],
                        "optionalClientScopes": [
                            "address",
                            "phone",
                            "offline_access",
                            "microprofile-jwt"
                        ]
                    }

                    await keycloakDao.createClientForRealm(token, createClientBody, body.realm).then(async function (res) {
                        console.log(res);
                        if (res?.error) {
                            const responseBody = {
                                message: errorResponses[400].message, //'An error occured creating realm',
                                error: errorResponses[400].error,
                                errorMessage: res.error,
                                statusCode: errorResponses[400].statusCode
                            }

                            deferred.resolve(responseBody);
                        } if (res?.errorMessage) {
                            const responseBody = {
                                message: errorResponses[400].message, //'An error occured creating realm',
                                error: errorResponses[400].error,
                                errorMessage: res.errorMessage,
                                statusCode: errorResponses[400].statusCode
                            }

                            deferred.resolve(responseBody);
                        } else {
                            // Step 4: Create the initial admin user in Keycloak and the local DB.
                            let userFunctionRes = await addUserToKeycloakAndDB(token, body);
                            if (userFunctionRes.error) {
                                deferred.resolve(userFunctionRes);
                            }

                            // Step 5: Fetch details of the newly created clients.
                            let getClientsRes = await getAngularAndRealmManageClients(token, body);
                            console.log(getClientsRes);
                            if (getClientsRes.error) {
                                deferred.resolve(getClientsRes);
                            }
                            
                            // eslint-disable-next-line no-unused-vars
                            let angularClient = getClientsRes.result.data.angularClient;
                            let realmManagementClient = getClientsRes.result.data.realmManagementClient;

                            // Step 6: Get the ID of the 'realm-admin' role.
                            let getRealmAdminRoleRes = await getRealmAdminRoleId(token, body, realmManagementClient[0].id);
                            if (getRealmAdminRoleRes.error) {
                                deferred.resolve(getClientsRes);
                            }
                            let realmAdminRole = getRealmAdminRoleRes.result.data;

                            // Step 7: Get the ID of the newly created admin user.
                            let getUserIdRes = await getUserId(token, body);
                            if (getUserIdRes.error) {
                                deferred.resolve(getUserIdRes);
                            }
                            let userData = getUserIdRes.result.data;

                            // Step 8: Assign the 'realm-admin' role to the user.
                            let createRealmAdminRes = await createRealmAdmin(token, body, realmManagementClient[0].id, realmAdminRole.id, userData[0].id);
                            if (createRealmAdminRes.error) {
                                deferred.resolve(createRealmAdminRes);
                            }

                            // Step 9: Update the local DB with the admin user's ID.
                            let updateUserDetailsToRealmTableRes = await updateUserDetailsToRealmTable(body, userData[0].id);
                            if (updateUserDetailsToRealmTableRes.error) {
                                deferred.resolve(updateUserDetailsToRealmTableRes);
                            }

                            // Step 10: Create an Identity Provider for authentication brokering.
                            let createIdentityProviderRes = await createIdentityProvider(token, body);
                            if (createIdentityProviderRes.error) {
                                deferred.resolve(createIdentityProviderRes);
                            }

                            let realmName = body.realm

                            // Step 11: Fetch all clients again to get the new ones.
                            let getAllClientsRes = await getAllRealmClients(token, realmName);

                            if (getAllClientsRes.error) {
                                deferred.resolve(getAllClientsRes);
                                console.log("clientsss===", getAllClientsRes)
                            }

                            // let brokerClient = getAllClientsRes.result.filter(client => client.clientId == 'tenant-broker');


                            // let updateBrokerClientRes = await updateBrokerclient(token, body, brokerClient);

                            // if (updateBrokerClientRes.error) {
                            //     deferred.resolve(updateBrokerClientRes);
                            // }

                            // Create group mapper

                            // let createGroupMapperRes = await createGroupMapper(token, body, angularClient[0].id);

                            // if (createGroupMapperRes.error) {
                            //     deferred.resolve(createGroupMapperRes);
                            // }

                            // Step 12: Create and configure the resource server and its authorization settings.
                            let resourceServerRes = await createResourceServer(body, userData);

                            if (resourceServerRes.error) {
                                deferred.resolve(resourceServerRes);
                            } else {
                                // If all steps succeed, resolve the promise with a success message.
                                let responseBody = {
                                    message: 'success',
                                    error: false,
                                    errorMessage: 'success',
                                    statusCode: 201,
                                    result: {
                                        data: userData
                                    }
                                }

                                deferred.resolve(responseBody);
                            }


                            // let createClientRolesStatus = await createClientRoles(token, body, angularClient[0].id);
                            // if (createClientRolesStatus.error) {
                            //     deferred.resolve(createClientRolesStatus);
                            // }

                            // let createGroupsStatus = await createGroups(token, body);
                            // if (createGroupsStatus.error) {
                            //     deferred.resolve(createGroupsStatus);
                            // }

                            // let mappingStatus = await mappings(token, body, userData[0].id, angularClient[0].id);
                            // if (mappingStatus.error) {
                            //     deferred.resolve(mappingStatus);
                            // } else {
                            //     let responseBody = {
                            //         message: 'success',
                            //         error: false,
                            //         errorMessage: 'success',
                            //         statusCode: 201,
                            //         result: {
                            //             data: {
                            //                 userData
                            //             }
                            //         }
                            //     }

                            //     deferred.resolve(responseBody);
                            // }

                        }
                    }).catch(function (err) {
                        console.log(err);
                        winston.error('Error in createClientForRealm service', err);
                        deferred.reject(err);
                    });

                    // deferred.resolve(userData);
                }

            }).catch(function (err) {
                console.log(err);
                winston.error('Error in addRealmToDB service', err);
                deferred.reject(err);
            });

        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in addRealm service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}


/**
 * @author: Adarsh
 * @description: GET a single realms details.
 * @param: {string} req.param will contain realm id.
 * @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
 */

/**
 * @summary Retrieves detailed information about a specific realm from the Keycloak Admin API.
 * @description This function calls the `keycloakDao` to fetch the complete configuration object for a realm identified by its name.
 * @param {string} token - An admin-level JWT for authenticating with the Keycloak API.
 * @param {string} realmName - The name of the realm to retrieve.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the realm data or an error.
 */
exports.getRealmData = async function (token, realmName) {
    var deferred = Q.defer();

    // Call the DAO to fetch realm data from Keycloak.
    keycloakDao.getRealmData(token, realmName).then(function (res) {
        console.log(res);

        // Check for and handle errors returned from the DAO.
        if (res?.error) {
            const responseBody = {
                message: 'An error occured while fetching realm details',
                error: true,
                errorMessage: res.error,
                statusCode: 400
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            const responseBody = {
                message: 'An error occured while fetching realm details',
                error: true,
                errorMessage: res.errorMessage,
                statusCode: 400
            }

            deferred.resolve(responseBody);
        } else {
            // On success, format the response with the fetched realm data.
           const responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getRealmData service', err);
        deferred.reject(err);
    });


    return deferred.promise;
}


/**
* @author: Aadarsh
* @description: GET realms details.
* @param: {string} req.param will contain realm id.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/

/**
 * @summary Retrieves details for a specific realm from the local application database.
 * @description This function queries the local database for metadata associated with a realm, identified by its ID. This is distinct from fetching the full configuration from Keycloak.
 * @param {string} realmId - The unique identifier of the realm to look up in the database.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the database record or an error.
 */
exports.getRealmDbDetails = async function (realmId) {
    var deferred = Q.defer();

    // Call the DAO to query the local database.
    keycloakDao.getRealmDbDetails(realmId).then(function (res) {
        console.log(res);

        // Handle any database or query errors.
        if (res?.error) {
            const responseBody = {
                message: 'An error occured while fetching realm details',
                error: true,
                errorMessage: res.error,
                statusCode: 400
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            const responseBody = {
                message: 'An error occured while fetching realm details',
                error: true,
                errorMessage: res.errorMessage,
                statusCode: 400
            }

            deferred.resolve(responseBody);
        } else {
            // Format the success response with the retrieved data.
            const responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res.data
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getRealmData service', err);
        deferred.reject(err);
    });


    return deferred.promise;
}

/**
* @author: aadarsh
* @description: GET realm clients details.
* @param: {string} req.param will contain realm id.
* @return: {object} res will contain a message, statusCode, error (i.e true or false) and result (data, count, page etc).
*/
/**
 * @summary Retrieves a list of all clients configured within a specific realm.
 * @description This function calls the Keycloak API to get an array of all client applications (e.g., 'angular', 'realm-management') associated with the given realm.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm whose clients are to be fetched.
 * @returns {Promise<object>} A promise that resolves to a structured response containing the list of clients or an error.
 */
exports.getRealmClients = async function (token, realmName) {
    var deferred = Q.defer();

    // Call the DAO to fetch all clients for the specified realm.
    keycloakDao.getAllRealmClients(token, realmName).then(function (res) {
        console.log(res);

        // Handle potential errors from the Keycloak API.
        if (res?.error) {
            const responseBody = {
                message: 'An error occured while fetching realm client details',
                error: true,
                errorMessage: res.error,
                statusCode: 400
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            const responseBody = {
                message: 'An error occured while fetching realm client details',
                error: true,
                errorMessage: res.errorMessage,
                statusCode: 400
            }

            deferred.resolve(responseBody);
        } else {
            // eslint-disable-next-line no-unused-vars
            // Filter the results to find specific clients if needed (currently commented out).
            let clients = res.filter(value => (value.clientId == 'angular' || value.clientId == 'realm-management'))

            // Format the success response.
            const responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getRealmClients service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Updates the settings of an existing realm in Keycloak.
 * @description This function takes a partial or complete realm representation object and applies the changes to the specified realm via the Keycloak Admin API.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - An object containing the realm attributes to update.
 * @param {string} realmName - The name of the realm to be updated.
 * @returns {Promise<object>} A promise that resolves to a structured response indicating success or failure of the update operation.
 */
exports.updateKeycloakRealmSettings = async function (token, body, realmName) {
    var deferred = Q.defer();

    console.log(body);

    // Call the DAO to perform the update operation.
    keycloakDao.updateRealm(token, body, realmName).then(function (res) {
        console.log(res);

        // Handle any errors returned by the API.
        if (res?.error) {
            const responseBody = {
                message: 'An error occured while updating realm settings',
                error: true,
                errorMessage: res.error,
                statusCode: 400
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            const responseBody = {
                message: 'An error occured while updating realm settings',
                error: true,
                errorMessage: res.errorMessage,
                statusCode: 400
            }

            deferred.resolve(responseBody);
        } else {
            // On success, return a success message.
            const responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }

    }).catch(function (err) {
        console.log(err);
        winston.error('Error in updateRealm service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}


/**
 * @summary Internal helper to create a user in Keycloak and set their password.
 * @description This function handles the two-step process of first creating a user record and then setting their initial password. It is used as part of the `addRealm` orchestration.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - An object containing the new user's details, including `email`, `firstName`, `lastName`, `username`, `password`, and `realm`.
 * @returns {Promise<object>} A promise that resolves to a success or error object.
 * @internal
 */
async function addUserToKeycloakAndDB(token, body) {
    var deferred = Q.defer();

    // Construct the user object for the Keycloak API.
    let newUserBody = {
        'attributes': {},
        'email': body.email,
        'emailVerified': '',
        'enabled': true,
        'firstName': body.firstName,
        'groups': [],
        'lastName': body.lastName,
        'username': body.username,
    }

    // First, register the user in Keycloak.
    await keycloakDao.registerKeycloakUser(token, newUserBody, body.realm).then(function (result) {
        console.log(result, 'inside registerKeycloakUser')
        if (result?.error) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured registering user',
                error: errorResponses[400].error,
                errorMessage: result.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (result?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured registering user',
                error: errorResponses[400].error,
                errorMessage: result.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            // After successful creation, fetch the user's ID to set their password.
            keycloakDao.getRealmUsers(token, body.realm).then(function (result) {
                console.log(result)
                if (result?.error) {
                    let responseBody = {
                        message: errorResponses[400].message, //'An error occured while getting realm user',
                        error: errorResponses[400].error,
                        errorMessage: result.error,
                        statusCode: errorResponses[400].statusCode
                    }

                    deferred.resolve(responseBody);
                } else if (result?.errorMessage) {
                    let responseBody = {
                        message: errorResponses[400].message, //'An error occured while getting realm user',
                        error: errorResponses[400].error,
                        errorMessage: result.errorMessage,
                        statusCode: errorResponses[400].statusCode
                    }

                    deferred.resolve(responseBody);
                } else {
                    // Find the newly created user in the list of realm users.
                    let userData = result.filter(value => value.username === body.username);

                    if (userData.length > 0) {
                        console.log("userrrr", userData[0].username);

                        // Prepare the password credentials object.
                        let setPasswordBody = {
                            'type': 'password',
                            'value': body.password,
                            'temporary': false
                        }

                        // Set the user's password using their ID.
                        keycloakDao.setUserPassword(token, setPasswordBody, body.realm, userData[0].id).then(function (result) {
                            console.log(result)
                            if (result?.error) {
                                let responseBody = {
                                    message: errorResponses[400].message, //'An error occured while setting realm user password',
                                    error: errorResponses[400].error,
                                    errorMessage: result.error,
                                    statusCode: errorResponses[400].statusCode
                                }

                                deferred.resolve(responseBody);
                            } else if (result?.errorMessage) {
                                let responseBody = {
                                    message: errorResponses[400].error, //'An error occured while setting realm user password',
                                    error: errorResponses[400].error,
                                    errorMessage: result.errorMessage,
                                    statusCode: errorResponses[400].statusCode
                                }

                                deferred.resolve(responseBody);
                            } else {
                                // If both steps are successful, resolve with a success message.
                                let responseBody = {
                                    message: 'success',
                                    error: false,
                                    errorMessage: 'Successfully added user to keycloak and db',
                                    statusCode: 200
                                }

                                deferred.resolve(responseBody);
                            }
                        }).catch(function (err) {
                            console.log(err);
                            winston.error('Error in setUserPassword service', err);
                            deferred.reject(err);
                        })
                    }
                }
            }).catch(function (err) {
                console.log(err);
                winston.error('Error in getRealmUsers service', err);
                deferred.reject(err);
            })
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in registerKeycloakUser service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Internal helper to fetch the 'angular' and 'realm-management' clients.
 * @description After creating a new realm, this function retrieves the client representations for the default frontend client and the built-in realm management client, which are needed for subsequent configuration steps.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - The original request body, containing the `realm` name.
 * @returns {Promise<object>} A promise that resolves to an object containing the two client representations or an error.
 * @internal
 */
async function getAngularAndRealmManageClients(token, body) {
    var deferred = Q.defer();

    // Fetch all clients for the given realm.
    await keycloakDao.getAllRealmClients(token, body.realm).then(function (res) {
        if (res?.error) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured getting realm clients',
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured getting realm clients',
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            console.log(res);

            // let clients = JSON.parse(res);
            let clients = res;

            // Filter the list to find the 'angular' client.
            let angularClient = clients.filter(client => client.clientId == 'angular');
            // Filter the list to find the 'realm-management' client.
            let realmManagementClient = clients.filter(client => client.clientId === 'realm-management');

            // Return both clients in a structured response.
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200,
                result: {
                    data: {
                        angularClient: angularClient,
                        realmManagementClient: realmManagementClient
                    }
                }
            }

            deferred.resolve(responseBody);
        }

    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getAllRealmClients service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Internal helper to get the 'realm-admin' role from the 'realm-management' client.
 * @description To assign administrative privileges, the specific 'realm-admin' role must be identified. This function fetches its representation, including its unique ID.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - The original request body, containing the `realm` name.
 * @param {string} clientId - The unique ID of the 'realm-management' client.
 * @returns {Promise<object>} A promise that resolves to an object containing the role representation or an error.
 * @internal
 */
async function getRealmAdminRoleId(token, body, clientId) {
    var deferred = Q.defer();

    // Call the DAO to fetch the role by name from within the specified client.
    await keycloakDao.getClientRoleByName(token, body.realm, clientId).then(function (res) {
        if (res?.error) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured getting realm clients',
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured getting realm clients',
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            console.log(res);

            let clientRole = res;

            // Return the fetched role data.
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200,
                result: {
                    data: clientRole
                }
            }

            deferred.resolve(responseBody);
        }

    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getClientRoleByName service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Internal helper to retrieve a user's ID by their username.
 * @description After creating a user, their unique ID is needed for subsequent operations like assigning roles. This function fetches all users in a realm and filters the list to find the ID of a specific user.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - The original request body, containing the `realm` and `username`.
 * @returns {Promise<object>} A promise that resolves to an object containing an array with the matching user's data, or an error.
 * @internal
 */
async function getUserId(token, body) {
    var deferred = Q.defer();

    // Fetch all users for the realm.
    await keycloakDao.getRealmUsers(token, body.realm).then(function (result) {
        console.log(result, 'inside getUserId')
        if (result?.error) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured while fetching keycloak users',
                error: errorResponses[400].error,
                errorMessage: result.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (result?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured while fetching keycloak users',
                error: errorResponses[400].error,
                errorMessage: result.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            // Filter the user list to find the user with the matching username.
            let userData = result.filter(value => value.username == body.username);

            // Return the found user data.
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200,
                result: {
                    data: userData
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getRealmUsers service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Internal helper to assign the 'realm-admin' role to a user.
 * @description This function performs the role mapping to grant a user administrative privileges over the realm.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - The original request body, containing the `realm` name.
 * @param {string} realmManageClientId - The ID of the 'realm-management' client.
 * @param {string} realmManageRoleId - The ID of the 'realm-admin' role.
 * @param {string} userId - The ID of the user to whom the role will be assigned.
 * @returns {Promise<object>} A promise that resolves to a success or error object.
 * @internal
 */
async function createRealmAdmin(token, body, realmManageClientId, realmManageRoleId, userId) {
    var deferred = Q.defer();

    // The body for the role mapping API call requires an array of role representations.
    let createRealmAdminBody = [{
        'clientRole': true,
        'composite': true,
        'containerId': realmManageClientId,
        'description': '${role_realm-admin}',
        'id': realmManageRoleId,
        'name': 'realm-admin'
    }]

    // Call the DAO to add the client role mapping to the user.
    await keycloakDao.createRealmAdmin(token, createRealmAdminBody, body.realm, userId, realmManageClientId).then(function (res) {
        if (res?.error) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured while creating realm admin',
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured while creating realm admin',
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200,
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in createRealmAdmin service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

// eslint-disable-next-line no-unused-vars
/**
 * @summary Internal helper to create a set of default roles for a client.
 * @description This function iterates through a predefined list of role names and creates each one within the specified client's namespace.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - The original request body, containing the `realm` name.
 * @param {string} angularClientId - The ID of the client where the roles will be created.
 * @returns {Promise<object>} A promise that resolves to a success or error object once all roles are created.
 * @internal
 */
async function createClientRoles(token, body, angularClientId) {
    var deferred = Q.defer();

    // Define the default roles to be created.
    let roles = [
        {
            name: 'admin',
            description: 'admin'
        },
        {
            name: 'user',
            description: 'user'
        },
        {
            name: 'maintainer',
            description: 'maintainer'
        }
    ];

    // Loop through the roles and create them one by one.
    for (let i = 0; i < roles.length; i++) {
        await keycloakDao.
            createClientRoles(token, roles[i], body.realm, angularClientId).then(function (res) {
                console.log(res);

                // Handle errors during creation.
                if (res?.error) {
                    let responseBody = {
                        message: errorResponses[400].message,//'An error occured while creating client roles',
                        error: errorResponses[400].error,
                        errorMessage: res.error,
                        statusCode: errorResponses[400].statusCode
                    }

                    deferred.resolve(responseBody);
                } else if (res?.errorMessage) {
                    let responseBody = {
                        message: errorResponses[400].message,//'An error occured while creating client roles',
                        error: errorResponses[400].error,
                        errorMessage: res.errorMessage,
                        statusCode: errorResponses[400].statusCode
                    }

                    deferred.resolve(responseBody);
                } else if (i == roles.length - 1) {
                    // If this is the last role in the loop, resolve with success.
                    let responseBody = {
                        message: 'success',
                        error: false,
                        errorMessage: 'success',
                        statusCode: 200,
                    }

                    deferred.resolve(responseBody);
                }
            }).catch(function (err) {
                console.log(err);
                winston.error('Error in createClientRoles service', err);
                deferred.reject(err);
            });
    }

    return deferred.promise;

}
/**
 * @summary Internal helper to update the local database record for a realm with the admin user's ID.
 * @description After the admin user is created in Keycloak, their unique ID is stored in the local `realms` table for reference.
 * @param {object} body - The original request body, containing the `realm` name.
 * @param {string} userId - The unique ID of the newly created realm admin user.
 * @returns {Promise<object>} A promise that resolves to a success or error object.
 * @internal
 */
async function updateUserDetailsToRealmTable(body, userId) {
    var deferred = Q.defer();

    // Prepare the update payload.
    let realmBody = {
        realm_admin_id: userId
    }

    console.log()

    // Call the DAO to update the database record.
    await keycloakDao.updateUserDetailsToRealmTable(body.realm, realmBody).then(function (res) {
        if (res?.error) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured updating realm details',
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured updating realm details',
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
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
        console.log(err);
        winston.error('Error in updateUserDetailsToRealmTable service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}
/**
 * @summary Internal helper to create and configure an Identity Provider (IDP) for authentication brokering.
 * @description This sets up the new realm to trust and delegate authentication to a central 'eps' realm, enabling a form of single sign-on (SSO) across tenants.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - The original request body, containing the `realm` name.
 * @returns {Promise<object>} A promise that resolves with the result of the IDP creation or an error.
 * @internal
 */
async function createIdentityProvider(token, body) {
    var deferred = Q.defer();

    console.log(body);

    // Construct the configuration for the OIDC Identity Provider.
    let IDPBody = {
        addReadTokenRoleOnCreate: '',
        alias: 'login-with-eps',
        authenticateByDefault: false,
        config: {
            acceptsPromptNoneForwardFromClient: '',
            authorizationUrl: `${process.env.KEYCLOAK_URL}/realms/eps/protocol/openid-connect/auth`,
            backchannelSupported: '',
            clientAuthMethod: 'client_secret_basic',
            clientId: process.env.KEYCLOAK_BROKER_CLIENT_ID,
            clientSecret: process.env.KEYCLOAK_BROKER_CLIENT_SECRET,
            disableUserInfo: '',
            hideOnLoginPage: '',
            loginHint: 'true',
            pkceEnabled: '',
            syncMode: 'IMPORT', // Sync user data on first login.
            tokenUrl: `${process.env.KEYCLOAK_URL}/realms/eps/protocol/openid-connect/token`,
            uiLocales: '',
            useJwksUrl: 'true',
            validateSignature: ''
        },
        displayName: "eps login",
        enabled: true,
        firstBrokerLoginFlowAlias: 'first broker login',
        linkOnly: '',
        postBrokerLoginFlowAlias: '',
        providerId: 'keycloak-oidc',
        storeToken: '',
        trustEmail: ''
    }

    // Call the DAO to create the IDP in the new realm.
    keycloakDao.createIdentityProvider(token, body.realm, IDPBody).then(function (res) {

        if (res?.error) {
            const responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            const responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            const responseBody = {
                message: 'success',
                error: false,
                statusCode: 201,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }

    }).catch(function (err) {
        console.log(err);
        winston.error('Error in createIdentityProvider service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

// async function getRealmClients(token, realmName) {
//     var deferred = Q.defer();

//     keycloakDao.getAllRealmClients(token, realmName).then(function (res) {
//         console.log(res);

//         if (res?.error) {
//             responseBody = {
//                 message: errorResponses[400].message,//'An error occured while fetching realm client details',
//                 error: errorResponses[400].error,
//                 errorMessage: res.error,
//                 statusCode: errorResponses[400].statusCode
//             }

//             deferred.resolve(responseBody);
//         } else if (res?.errorMessage) {
//             responseBody = {
//                 message: errorResponses[400].message,//'An error occured while fetching realm client details',
//                 error: errorResponses[400].error,
//                 errorMessage: res.errorMessage,
//                 statusCode: errorResponses[400].statusCode
//             }

//             deferred.resolve(responseBody);
//         } else {

//             responseBody = {
//                 message: 'success',
//                 error: false,
//                 statusCode: 200,
//                 result: {
//                     data: res
//                 }
//             }

//             deferred.resolve(responseBody);
//         }
//     }).catch(function (err) {
//         console.log(err);
//         winston.error('Error in getRealmClients service', err);
//         deferred.reject(err);
//     });

//     return deferred.promise;
// }

// async function updateBrokerclient(token, body, brokerClient) {
//     var deferred = Q.defer();

//     brokerClient[0].redirectUris.push(`${process.env.KEYCLOAK_URL}/realms/${body.realm}/broker/login-with-eps/endpoint`);
//     console.log(brokerClient[0].redirectUris);

//     await keycloakDao.updateRealmClient(token, 'eps', brokerClient[0].id, brokerClient[0]).then(async function (res) {
//         console.log(res);

//         if (res?.error) {
//             let responseBody = {
//                 message: errorResponses[400].message,//'An error occured updating client',
//                 error: errorResponses[400].error,
//                 errorMessage: res.error,
//                 statusCode: errorResponses[400].statusCode
//             }

//             deferred.resolve(responseBody);
//         }
//         if (res?.errorMessage) {
//             responseBody = {
//                 message: errorResponses[400].message,//'An error occured updating client',
//                 error: errorResponses[400].error,
//                 errorMessage: res.errorMessage,
//                 statusCode: errorResponses[400].statusCode
//             }

//             deferred.resolve(responseBody);
//         } else {
//             let responseBody = {
//                 message: 'success',
//                 error: false,
//                 errorMessage: 'success',
//                 statusCode: 200
//             }

//             deferred.resolve(responseBody);
//         }
//     }).catch(function (err) {
//         console.log(err);
//         winston.error('Error in updateRealmClient service', err);
//         deferred.reject(err);
//     });

//     return deferred.promise;
// }

// async function createGroupMapper(token, body, angularClientId) {
//     var deferred = Q.defer();

//     let mapperBody = {
//         config: {
//             'access.token.claim': 'true',
//             'claim.name': 'groups',
//             'full.path': 'true',
//             'id.token.claim': 'true',
//             'userinfo.token.claim': 'true',
//         },
//         name: 'user-groups',
//         protocol: 'openid-connect',
//         protocolMapper: 'oidc-group-membership-mapper'
//     }

//     await keycloakDao.createGroupMapper(token, body.realm, angularClientId, mapperBody).then(async function (res) {
//         console.log(res);

//         if (res?.error) {
//             let responseBody = {
//                 message: errorResponses[400].message,//'An error occured creating realm group mapping',
//                 error: errorResponses[400].error,
//                 errorMessage: res.error,
//                 statusCode: errorResponses[400].statusCode
//             }

//             deferred.resolve(responseBody);
//         }
//         if (res?.errorMessage) {
//             responseBody = {
//                 message: errorResponses[400].message,//'An error occured creating realm group mapping',
//                 error: errorResponses[400].error,
//                 errorMessage: res.errorMessage,
//                 statusCode: errorResponses[400].statusCode
//             }

//             deferred.resolve(responseBody);
//         } else {
//             let responseBody = {
//                 message: 'success',
//                 error: false,
//                 errorMessage: 'success',
//                 statusCode: 200
//             }

//             deferred.resolve(responseBody);
//         }
//     }).catch(function (err) {
//         console.log(err);
//         winston.error('Error in createGroupMapper service', err);
//         deferred.reject(err);
//     });

//     return deferred.promise;
// }

/**
 * @summary Internal helper to create multiple authorization scopes for a client.
 * @description Scopes represent permissions (e.g., read, create) that can be associated with resources. This function creates a set of predefined scopes.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {Array<object>} scopeBody - An array of scope definition objects.
 * @param {string} realm - The name of the realm.
 * @param {string} clientId - The ID of the client (resource server) where the scopes will be created.
 * @returns {Promise<object>} A promise that resolves with an array of the created scope objects or an error.
 * @internal
 */
async function createAuthorizationScope(token, scopeBody, realm, clientId) {
    var deferred = Q.defer();

    let scopeRes = [];

    // Iterate through the provided scope definitions and create each one.
    for (let i = 0; i < scopeBody.length; i++) {
        await keycloakDao.createAuthorizationScope(token, scopeBody[i], realm, clientId).then(function (res) {
            console.log(res);
            if (res?.error) {
                let responseBody = {
                    message: errorResponses[400].message,//'An error occured creating authorization scope',
                    error: errorResponses[400].error,
                    errorMessage: res.error,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else if (res?.errorMessage) {
                let responseBody = {
                    message: errorResponses[400].message,//'An error occured creating authorization scope',
                    error: errorResponses[400].error,
                    errorMessage: res.errorMessage,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else {
                // Collect the successful creation responses.
                scopeRes.push(res);
            }



        }).catch(function (err) {
            console.log(err);
            winston.error('Error in createAuthorizationScope service', err);
            deferred.reject(err);
        });

        // After the loop finishes, resolve the promise with all created scopes.
        if (i == scopeBody.length - 1) {
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200,
                result: scopeRes
            }

            deferred.resolve(responseBody);
        }

    }

    return deferred.promise;
}


/**
 * @summary Internal helper that orchestrates the creation of a 'resource-server' client and its full authorization setup.
 * @description This function is a major part of the realm setup. It creates the client, defines authorization scopes, creates protected resources, defines roles, sets up policies, and creates permissions linking them all together.
 * @param {object} body - The original request body containing configuration for roles and resources.
 * @param {object} userData - The data object for the newly created realm admin user.
 * @returns {Promise<object>} A promise that resolves to a final success or error object for the entire operation.
 * @internal
 */
async function createResourceServer(body, userData) {
    var deferred = Q.defer();

    console.log(body);

    // Define the 'resource-server' client. It is a confidential client with service accounts and authorization enabled.
    let createClientBody = {
        "clientId": "resource-server",
        "name": "resource-server",
        "adminUrl": "",
        "alwaysDisplayInConsole": false,
        "access": {
            "view": true,
            "configure": true,
            "manage": true
        },
        "attributes": {},
        "authenticationFlowBindingOverrides": {},
        "authorizationServicesEnabled": false,
        "bearerOnly": false,
        "directAccessGrantsEnabled": true,
        "enabled": true,
        "protocol": "openid-connect",
        "description": "rest-api",
        "rootUrl": "",
        "baseUrl": "",
        "surrogateAuthRequired": false,
        "clientAuthenticatorType": "client-secret",
        "defaultRoles": [
            "manage-account",
            "view-profile"
        ],
        "redirectUris": body.redirectUris,
        "webOrigins": body.webOrigins,
        // eslint-disable-next-line no-dupe-keys
        "webOrigins": [
            "http://localhost:4200",
            `http://${body.realm}.localhost:4200`
        ],
        "notBefore": 0,
        "consentRequired": false,
        "standardFlowEnabled": true,
        "implicitFlowEnabled": false,
        "serviceAccountsEnabled": true,
        "publicClient": false,
        // eslint-disable-next-line no-dupe-keys
        "authorizationServicesEnabled": true,
        "frontchannelLogout": false,
        "fullScopeAllowed": true,
        "nodeReRegistrationTimeout": -1,
        "defaultClientScopes": [
            "web-origins",
            "role_list",
            "profile",
            "roles",
            "email"
        ],
        "optionalClientScopes": [
            "address",
            "phone",
            "offline_access",
            "microprofile-jwt"
        ]
    }

    // Step 1: Create the client itself.
    let createRealmClientRes = await createRealmClient(token, createClientBody, body.realm);
    if (createRealmClientRes.error) {
        deferred.resolve(createRealmClientRes);
    }

    // Step 2: Fetch all clients to get the ID of the newly created resource-server.
    let getAllRealmClientRes = await getAllRealmClients(token, body.realm);
    console.log("CLIENTS", getAllRealmClientRes.result)
    if (getAllRealmClientRes.error) {
        deferred.resolve(getAllRealmClientRes);
    }

    if (getAllRealmClientRes.result.length < 0) {
        const error = new Error("No client found for the realm")
        let responseBody = {
            message: errorResponses[400].message,//'An error occured getting realm clients',
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode
        }
        deferred.resolve(responseBody);
    }

    let clients = getAllRealmClientRes.result
    console.log("//////", clients)
    let resourceServerClient = clients.filter(client => client.clientId == 'resource-server');
    console.log(">>>>>", resourceServerClient)

    // Step 3: Define and create standard CRUD authorization scopes.
    let scopeBody = [
        { displayName: "scopes:create", name: "scopes:create" },
        { displayName: "scopes:read", name: "scopes:read" },
        { displayName: "scopes:update", name: "scopes:update" },
        { displayName: "scopes:delete", name: "scopes:delete" }
    ];
    let scope = body.resources[0].scopes[0]
    console.log("[[[[[", scope)
    let createAuthorizationScopeRes = await createAuthorizationScope(token, scopeBody, body.realm, resourceServerClient[0].id);
    console.log(token)
    console.log(scopeBody)
    console.log(body.realm)
    console.log(resourceServerClient[0].id)

   console.log("authorization", createAuthorizationScopeRes);
    if (createAuthorizationScopeRes.error) {
        deferred.resolve(createAuthorizationScopeRes);
    }
    let scopes = createAuthorizationScopeRes.result;
    console.log("scopes", scopes)

    // Step 4: Define and create a protected resource (e.g., an API endpoint).
    let resourcesBody = [
        {
            attributes: {},
            displayName: "createConsent",
            name: "createConsent",
            ownerManagedAccess: "",
            scopes: scopes.filter(scope => scope.name === 'scopes:create'),
            uris: [ '/api/fiu/v1/consent' ]
        },
        // {
        //     attributes: {},
        //     displayName: "getAllProject",
        //     name: "getAllProject",
        //     ownerManagedAccess: "",
        //     scopes: scopes.filter(scope => scope.name === 'scopes:read'),
        //     uris: [
        //         '/api/projects/getAllProject'
        //     ]
        // },
        // {
        //     attributes: {},
        //     displayName: "getProjectById",
        //     name: "getProjectById",
        //     ownerManagedAccess: "",
        //     scopes: scopes.filter(scope => scope.name === 'scopes:read'),
        //     uris: [
        //         '/api/projects/getProjectById/{id}'
        //     ]
        // },
        // {
        //     attributes: {},
        //     displayName: "getPublishedProject",
        //     name: "getPublishedProject",
        //     ownerManagedAccess: "",
        //     scopes: scopes.filter(scope => scope.name === 'scopes:read'),
        //     uris: [
        //         '/api/projects/getPublishedProject'
        //     ]
        // },
        // {realm
        //     attributes: {},
        //     displayName: "getOrgProject",
        //     name: "getOrgProject",
        //     ownerManagedAccess: "",
        //     scopes: scopes.filter(scope => scope.name === 'scopes:read'),
        //     uris: [
        //         '/api/projects/getOrgProject/{realm}'
        //     ]
        // },
        // {
        //     attributes: {},
        //     displayName: "getOrgUnpublishedProject",
        //     name: "getOrgUnpublishedProject",
        //     ownerManagedAccess: "",
        //     scopes: scopes.filter(scope => scope.name === 'scopes:read'),
        //     uris: [
        //         '/api/projects/getOrgUnpublishedProject/{realm}'
        //     ]
        // },
        // {
        //     attributes: {},
        //     displayName: "publishProject",
        //     name: "publishProject",
        //     ownerManagedAccess: "",
        //     scopes: scopes.filter(scope => scope.name === 'scopes:update'),
        //     uris: [
        //         '/api/projects/publishProject'
        //     ]
        // },
        // {
        //     attributes: {},
        //     displayName: "getProjectBasedOnCauses",
        //     name: "getProjectBasedOnCauses",
        //     ownerManagedAccess: "",
        //     scopes: scopes.filter(scope => scope.name === 'scopes:read'),
        //     uris: [
        //         '/api/projects/getProjectBasedOnCauses/{cause}'
        //     ]
        // },
        // {
        //     attributes: {},
        //     displayName: "getProjectByFilter",
        //     name: "getProjectByFilter",
        //     ownerManagedAccess: "",
        //     scopes: scopes.filter(scope => scope.name === 'scopes:read'),
        //     uris: [
        //         '/api/projects/getProjectByFilter'
        //     ]
        // }
   ]
    let createResourcesRes = await createResources(token, resourcesBody, body.realm, resourceServerClient[0].id);
    console.log(createResourcesRes);
    if (createResourcesRes.error) {
        deferred.resolve(createResourcesRes);
    }
    let resources = createResourcesRes.result;

    // Step 5: Define and create realm-level roles.
    let roles = body.roles;
    let createRealmRoleRes = await createRealmRole(token, roles, body.realm);
    console.log(createRealmRoleRes);
    if (createRealmRoleRes.error) {
        deferred.resolve(createRealmRoleRes);
    }

    // Step 6: Fetch all realm roles to get their IDs.
    let getRealmRolesRes = await getRealmRoles(token, body.realm);
    console.log(getRealmRolesRes);
    if (getRealmRolesRes.error) {
        deferred.resolve(getRealmRolesRes);
    }
    let realmRoles = getRealmRolesRes.result;
    let adminRole = realmRoles.filter(role => role.name === 'admin');
    let userRole = realmRoles.filter(role => role.name === 'user');
    let defaultRole = realmRoles.filter(role => role.name === 'default-roles-' + body.realm);

    // Step 7: Assign the 'admin' role to the initial admin user.
    const addUserToAdminRoleRes = await addUserToAdminRole(token, body.realm, adminRole, userData);
    if (addUserToAdminRoleRes.error) {
        deferred.resolve(addUserToAdminRoleRes);
    }

    // Step 8: Make the 'user' role a default role for the realm.
    const addDefaultRealmRoleRes = await addDefaultRealmRole(token, body.realm, userRole, defaultRole[0].id);
    if (addDefaultRealmRoleRes.error) {
        deferred.resolve(addDefaultRealmRoleRes);
    }

    // Step 9: Define role-based authorization policies.
    let policiesBody = [
        {
            decisionStrategy: 'UNANIMOUS',
            description: 'Only admin',
            logic: 'POSITIVE',
            name: 'Only admin',
            type: 'role',
            roles: [
                {
                    id: realmRoles.filter(role => role.name === 'admin').map(x => x.id)[0]
                }
            ]
       },
        {
            decisionStrategy: 'UNANIMOUS',
            description: 'Only admin and maintainer',
            logic: 'POSITIVE',
            name: 'Only admin and maintainer',
            type: 'role',
            roles: [
                {
                    id: realmRoles.filter(role => role.name === 'admin').map(x => x.id)[0]
                },
                {
                    id: realmRoles.filter(role => role.name === 'maintainer').map(x => x.id)[0]
                }
           ]
        },
        {
            decisionStrategy: 'UNANIMOUS',
            description: 'Only admin, maintainer and user',
            logic: 'POSITIVE',
            name: 'Only admin, maintainer and user',
            type: 'role',
            roles: [
                {
                    id: realmRoles.filter(role => role.name === 'admin').map(x => x.id)[0]
                },
                {
                    id: realmRoles.filter(role => role.name === 'maintainer').map(x => x.id)[0]
                },
                {
                    id: realmRoles.filter(role => role.name === 'user').map(x => x.id)[0]
                }
           ]
        }
    ];
    let createPoliciesRes = await createPolicies(token, body.realm, policiesBody, resourceServerClient[0].id);
    console.log(createPoliciesRes);
    if (createPoliciesRes.error) {
        deferred.resolve(createPoliciesRes);
    }
    let policies = createPoliciesRes.result;

    // Step 10: Create permissions to link resources with policies.
    let permissionsBody = [
        {
            decisionStrategy: "UNANIMOUS",
            description: "createConsent",
            logic: "POSITIVE",
            name: "createConsent",
            type: "resource",
            policies: [
                policies.filter(policy => policy.name === 'Only admin, maintainer and user').map(x => x.id)[0]
            ],
            resources: [
                resources.filter(resource => resource.name === 'createConsent').map(x => x._id)[0]
            ]
        },
        // {
        //     decisionStrategy: "UNANIMOUS",
        //     description: "getAllProject",
        //     logic: "POSITIVE",
        //     name: "getAllProject",
        //     type: "resource",
        //     policies: [
        //         policies.filter(policy => policy.name === 'Only admin').map(x => x.id)[0]
        //     ],
        //     resources: [
        //         resources.filter(resource => resource.name === 'getAllProject').map(x => x._id)[0]
        //     ]
        // },
        // {
        //     decisionStrategy: "UNANIMOUS",
        //     description: "getOrgProject",
        //     logic: "POSITIVE",
        //     name: "getOrgProject",
        //     type: "resource",
        //     policies: [
        //         policies.filter(policy => policy.name === 'Only admin, maintainer and user').map(x => x.id)[0]
        //     ],
        //     resources: [
        //         resources.filter(resource => resource.name === 'getOrgProject').map(x => x._id)[0]
        //     ]
        // },
        // {
        //     decisionStrategy: "UNANIMOUS",
        //     description: "getOrgUnpublishedProject",
        //     logic: "POSITIVE",
        //     name: "getOrgUnpublishedProject",
        //     type: "resource",
        //     policies: [
        //         policies.filter(policy => policy.name === 'Only admin and maintainer').map(x => x.id)[0]
        //     ],
        //     resources: [
        //         resources.filter(resource => resource.name === 'getOrgUnpublishedProject').map(x => x._id)[0]
        //     ]
        // },
        // {
        //     decisionStrategy: "UNANIMOUS",
        //     description: "getProjectBasedOnCauses",
        //     logic: "POSITIVE",
        //     name: "getProjectBasedOnCauses",
        //     type: "resource",
        //     policies: [
        //         policies.filter(policy => policy.name === 'Only admin, maintainer and user').map(x => x.id)[0]
        //     ],
        //     resources: [
        //         resources.filter(resource => resource.name === 'getProjectBasedOnCauses').map(x => x._id)[0]
        //     ]
        // },
        // {
        //     decisionStrategy: "UNANIMOUS",
        //     description: "getProjectByFilter",
        //     logic: "POSITIVE",
        //     name: "getProjectByFilter",
        //     type: "resource",
        //     policies: [
        //         policies.filter(policy => policy.name === 'Only admin, maintainer and user').map(x => x.id)[0]
        //     ],
        //     resources: [
        //         resources.filter(resource => resource.name === 'getProjectByFilter').map(x => x._id)[0]
        //     ]
        // },
        // {
        //     decisionStrategy: "UNANIMOUS",
        //     description: "getProjectById",
        //     logic: "POSITIVE",
        //     name: "getProjectById",
        //     type: "resource",
        //     policies: [
        //         policies.filter(policy => policy.name === 'Only admin, maintainer and user').map(x => x.id)[0]
        //     ],
        //     resources: [
        //         resources.filter(resource => resource.name === 'getProjectById').map(x => x._id)[0]
        //     ]
        // },
        // {
        //     decisionStrategy: "UNANIMOUS",
        //     description: "getPublishedProject",
        //     logic: "POSITIVE",
        //     name: "getPublishedProject",
        //     type: "resource",
        //     policies: [
        //         policies.filter(policy => policy.name === 'Only admin, maintainer and user').map(x => x.id)[0]
        //     ],
        //     resources: [
        //         resources.filter(resource => resource.name === 'getPublishedProject').map(x => x._id)[0]
        //     ]
        // },
        // {
        //     decisionStrategy: "UNANIMOUS",
        //     description: "publishProject",
        //     logic: "POSITIVE",
        //     name: "publishProject",
        //     type: "resource",
        //     policies: [
        //         policies.filter(policy => policy.name === 'Only admin and maintainer').map(x => x.id)[0]
        //     ],
        //     resources: [
        //         resources.filter(resource => resource.name === 'publishProject').map(x => x._id)[0]
        //     ]
        // },
    ]

    console.log(permissionsBody);

   const createPermissionsRes = await createPermissions(token, permissionsBody, body.realm, resourceServerClient[0].id);
    console.log(createPermissionsRes);
    if (createPermissionsRes.error) {
        deferred.resolve(createPermissionsRes);
    }

    // Final success if all steps complete.
    deferred.resolve({
        message: 'success',
        error: false,
        errorMessage: 'success',
        statusCode: 200
    })

    return deferred.promise;
}
/**
 * @summary Internal helper to create a single client in a realm.
 * @description A wrapper around the `keycloakDao.createClientForRealm` method for creating clients like 'resource-server'.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - The configuration object for the new client.
 * @param {string} realm - The name of the realm where the client will be created.
 * @returns {Promise<object>} A promise that resolves to a success or error object.
 * @internal
 */
async function createRealmClient(token, body, realm) {
    var deferred = Q.defer();

    keycloakDao.createClientForRealm(token, body, realm).then(function (res) {
        console.log(res);

        if (res?.error) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured creating realm',
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } if (res?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message,//'An error occured creating realm',
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
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
        console.log(err);
        winston.error('Error in createClientForRealm service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Internal helper to retrieve all clients for a specific realm.
 * @description A wrapper around the `keycloakDao.getAllRealmClients` method, providing standardized error and success handling.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realm - The name of the realm.
 * @returns {Promise<object>} A promise that resolves with an object containing the list of clients or an error.
 * @internal
 */
async function getAllRealmClients(token, realm) {
    var deferred = Q.defer();

    keycloakDao.getAllRealmClients(token, realm).then(function (res) {
        if (res?.error) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured getting realm clients',
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured getting realm clients',
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200,
                result: res
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getAllRealmClients service', err);
        deferred.reject(err);
    });


    return deferred.promise;
}
/**
 * @summary Internal helper to create multiple authorization resources for a client.
 * @description This function iterates through a list of resource definitions and creates each one under the specified client's authorization services.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {Array<object>} resourceBody - An array of resource definition objects.
 * @param {string} realm - The name of the realm.
 * @param {string} clientId - The ID of the client (resource server).
 * @returns {Promise<object>} A promise that resolves with an array of the created resource objects or an error.
 * @internal
 */
async function createResources(token, resourceBody, realm, clientId) {
    var deferred = Q.defer();

    console.log(resourceBody);

    let resourceRes = [];

    // Loop through and create each resource.
    for (let i = 0; i < resourceBody.length; i++) {
        await keycloakDao.createResources(token, resourceBody[i], realm, clientId).then(function (res) {
            console.log(res);
            if (res?.error) {
                let responseBody = {
                    message: errorResponses[400].message, //'An error occured creating resources',
                    error: errorResponses[400].error,
                    errorMessage: res.error,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else if (res?.errorMessage) {
                let responseBody = {
                    message: errorResponses[400].message, //'An error occured creating resources',
                    error: errorResponses[400].error,
                    errorMessage: res.errorMessage,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else {
                resourceRes.push(res);
            }

        }).catch(function (err) {
            console.log(err);
            winston.error('Error in createResources service', err);
            deferred.reject(err);
        });

        // After the loop, resolve with the collected results.
        if (i == resourceBody.length - 1) {
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200,
                result: resourceRes
            }

            deferred.resolve(responseBody);
        }

    }

    return deferred.promise;
}
/**
 * @summary Internal helper to create multiple realm-level roles.
 * @description This function takes an array of role names and creates each one within the specified realm.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {Array<string>} roles - An array of role names to be created.
 * @param {string} realm - The name of the realm.
 * @returns {Promise<object>} A promise that resolves to a success or error object.
 * @internal
 */
async function createRealmRole(token, roles, realm) {
    var deferred = Q.defer();

    console.log(roles);

    // Loop through the list of role names.
    for (let i = 0; i < roles.length; i++) {

        // Construct the role body for the API call.
        let rolesBody = {
            name: roles[i],
            description: roles[i]
        }

        await keycloakDao.createRealmRole(token, rolesBody, realm).then(function (res) {
            console.log(res);
            if (res?.error) {
                let responseBody = {
                    message: errorResponses[400].message, //'An error occured creating realm roles',
                    error: errorResponses[400].error,
                    errorMessage: res.error,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else if (res?.errorMessage) {
                let responseBody = {
                    message: errorResponses[400].message, //'An error occured creating realm roles',
                    error: errorResponses[400].error,
                    errorMessage: res.errorMessage,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            }
        }).catch(function (err) {
            console.log(err);
            winston.error('Error in createRealmRole service', err);
            deferred.reject(err);
        });

        // Resolve successfully after the last role is created.
        if (i == roles.length - 1) {
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200
            }

            deferred.resolve(responseBody);
        }
    }

    return deferred.promise;
}
/**
 * @summary Internal helper to retrieve all realm-level roles.
 * @description Fetches a list of all roles that are defined at the realm level.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realm - The name of the realm.
 * @returns {Promise<object>} A promise that resolves with an object containing the list of roles or an error.
 * @internal
 */
async function getRealmRoles(token, realm) {
    var deferred = Q.defer();

    keycloakDao.getRealmRoles(token, realm).then(function (res) {
        console.log(res);
        if (res?.error) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured creating resources',
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured creating resources',
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200,
                result: res
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in createResources service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Internal helper to assign the 'admin' role to a user.
 * @description A specific wrapper function for mapping the realm's 'admin' role to the initial administrative user.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realm - The name of the realm.
 * @param {object} adminRole - The role representation object for the 'admin' role.
 * @param {object} userData - The user representation object for the user who will be made an admin.
 * @returns {Promise<object>} A promise that resolves to a success or error object.
 * @internal
 */
async function addUserToAdminRole(token, realm, adminRole, userData) {
    var deferred = Q.defer();

    keycloakDao.addUserToRealmRole(token, adminRole, realm, userData[0].id).then(function (res) {
        console.log(res);
        if (res?.error) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured creating resources',
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured creating resources',
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
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
        console.log(err);
        winston.error('Error in createResources service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Internal helper to add a role to the realm's default roles composite.
 * @description This makes the specified role ('user' role in this context) automatically assigned to all new users in the realm.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realm - The name of the realm.
 * @param {object} userRole - The role representation object for the role to be made default (e.g., 'user').
 * @param {string} defaultRoleId - The ID of the composite role that holds all default roles (e.g., 'default-roles-myrealm').
 * @returns {Promise<object>} A promise that resolves to a success or error object.
 * @internal
 */
async function addDefaultRealmRole(token, realm, userRole, defaultRoleId) {
    var deferred = Q.defer();

    console.log(userRole, defaultRoleId);

    keycloakDao.addDefaultRealmRole(token, realm, userRole, defaultRoleId).then(function (res) {
        console.log(res);
        if (res?.error) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured creating resources',
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            let responseBody = {
                message: errorResponses[400].message, //'An error occured creating resources',
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
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
        console.log(err);
        winston.error('Error in createResources service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Internal helper to create multiple role-based authorization policies.
 * @description This function iterates through a list of policy definitions and creates each one under the specified client's authorization services.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realm - The name of the realm.
 * @param {Array<object>} policiesBody - An array of policy definition objects.
 * @param {string} clientId - The ID of the client (resource server).
 * @returns {Promise<object>} A promise that resolves with an array of the created policy objects or an error.
 * @internal
 */
async function createPolicies(token, realm, policiesBody, clientId) {
    var deferred = Q.defer();

    console.log("policies>>>", policiesBody);
    console.log(clientId)

    let policyRes = [];

    // Loop through and create each policy.
    for (let i = 0; i < policiesBody.length; i++) {
        await keycloakDao.createPolicy(token, policiesBody[i], realm, clientId).then(function (res) {
            console.log(res);
            if (res?.error) {
                let responseBody = {
                    message: errorResponses[400].message, //'An error occured creating policy',
                    error: errorResponses[400].error,
                    errorMessage: res.error,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else if (res?.errorMessage) {
                let responseBody = {
                    message: errorResponses[400].message, //'An error occured creating policy',
                    error: errorResponses[400].error,
                    errorMessage: res.errorMessage,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else {
                policyRes.push(res);
            }



        }).catch(function (err) {
            console.log(err);
            winston.error('Error in createAuthorizationScope service', err);
            deferred.reject(err);
        });

        // Resolve after the last policy is created.
        if (i == policiesBody.length - 1) {
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200,
                result: policyRes
            }

            deferred.resolve(responseBody);
        }

    }

    return deferred.promise;
}

/**
 * @summary Internal helper to create multiple resource-based permissions.
 * @description Permissions link protected resources with the authorization policies that govern access to them. This function iterates through a list of permission definitions and creates them.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {Array<object>} permissionsBody - An array of permission definition objects.
 * @param {string} realm - The name of the realm.
 * @param {string} clientId - The ID of the client (resource server).
 * @returns {Promise<object>} A promise that resolves with an array of the created permission objects or an error.
 * @internal
 */
async function createPermissions(token, permissionsBody, realm, clientId) {
    var deferred = Q.defer();

    let permissionRes = [];

    // Loop through and create each permission.
    for (let i = 0; i < permissionsBody.length; i++) {
        await keycloakDao.createPermission(token, permissionsBody[i], realm, clientId).then(function (res) {
            console.log(res);
            if (res?.error) {
                let responseBody = {
                    message: errorResponses[400].message, //'An error occured creating permission',
                    error: errorResponses[400].error,
                    errorMessage: res.error,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else if (res?.errorMessage) {
                let responseBody = {
                    message: errorResponses[400].message, //'An error occured creating permissions',
                    error: errorResponses[400].error,
                    errorMessage: res.errorMessage,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else {
                permissionRes.push(res);
            }



        }).catch(function (err) {
            console.log(err);
            winston.error('Error in createAuthorizationScope service', err);
            deferred.reject(err);
        });

        // After the loop, resolve with the collected results.
        if (i == permissionsBody.length - 1) {
            let responseBody = {
                message: 'success',
                error: false,
                errorMessage: 'success',
                statusCode: 200,
                result: permissionRes
            }

            deferred.resolve(responseBody);
        }
    }

    return deferred.promise;
}

/**
 * @summary Retrieves a list of all realms from Keycloak.
 * @description Fetches all available realms and transforms the response to include only the `id` and `realm` name for each.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the simplified list of realms or an error.
 */
exports.getAllRealms = async function () {
    var deferred = Q.defer();


    keycloakDao.getAllRealms(token).then(function (result) {
        console.log(result);

        let responseBody;

        if (result?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: result.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (result?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,//'An error occured while fetching all realms',
                error: errorResponses[400].error,
                errorMessage: result.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            let newData = [];

            // Transform the raw realm data into a simpler format.
            for (let i = 0; i < result.length; i++) {
                let obj = {
                    id: result[i].id,
                    realm: result[i].realm
                }
                newData.push(obj);
            }

            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: newData
                }
            }

            deferred.resolve(responseBody);
        }

    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getAllRealms service', err);
        deferred.reject(err);
    })

    return deferred.promise;
}

/**
 * @summary Retrieves all users within a specified realm.
 * @description This function calls the DAO to fetch a list of all user representations for a given realm.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm from which to fetch users.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the list of users or an error.
 */
exports.getAllRealmUsers = async function (token, realmName) {
    var deferred = Q.defer();

    // let token = await getMasterToken();

    keycloakDao.getAllRealmUsers(token, realmName).then(function (users) {
        console.log(users);

        let responseBody;

        if (users?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: users.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (users?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: users.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: users
                }
            }

            deferred.resolve(responseBody);
        }

    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getAllRealmUsers service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

const nodemailer = require('nodemailer');
// const uuid = require('uuid');
// const { async } = require('q');

/**
 * @summary Generates a random password string that meets specific complexity requirements.
 * @description Creates a password of a given maximum length that is guaranteed to contain at least one uppercase letter and one special character. The final string is shuffled to randomize character positions.
 * @param {number} maxLength - The desired length of the password.
 * @returns {string} The generated random password.
 */
function generateRandomPassword(maxLength) {
    // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*+=';
    // const splChars = '!@#$%^&*+='
    // let password = '';
    // for (let i = 0; i < length; i++) {
    //     const randomIndex = Math.floor(Math.random() * characters.length);
    //     password += characters.charAt(randomIndex);
    // }
    // return password;

    // Define the character sets to be used.
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const specialChars = '!@#$%^&*+=';
    const numbers = '0123456789';

    let password = '';

    // Ensure the password contains at least one character from required sets.
    // Generate at least 1 uppercase letter
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));

    // Generate at least 1 special character
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

    // Fill the rest of the password length with characters from a combined set.
    const remainingLength = maxLength - 2; // Minimum 8, Maximum 14
    // console.log("Remaining length:", remainingLength);
    const allChars = lowercaseChars + numbers + specialChars;
    for (let i = 0; i < remainingLength; i++) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        password += allChars.charAt(randomIndex);
    }

    // Shuffle the generated password characters to avoid predictable patterns (e.g., uppercase always first).
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    return password;
}
/**
 * @summary Internal helper function to create a new user in Keycloak and set their initial temporary password.
 * @description This async function orchestrates the multi-step process of user creation. It first registers the user with their profile information, then fetches the complete user list for the realm to find the newly created user's unique ID, and finally uses that ID to set a temporary password, marking it for required update on first login.
 * @param {string} token - An admin-level JWT for authenticating with the Keycloak API.
 * @param {object} body - An object containing the new user's details (email, firstName, lastName, username, groups).
 * @param {string} realm - The name of the realm where the user will be created.
 * @param {string} initialPassword - The temporary password to be set for the new user.
 * @returns {Promise<object>} A promise that resolves to a structured response object indicating success or failure.
 * @internal
 */
async function addUserToKeycloak(token, body, realm, initialPassword) {
    try {
        // Prepare the user representation object for the Keycloak Admin API.
        let newUserBody = {
            'attributes': {},
            'email': body.email,
            'emailVerified': false, // User will need to verify their email.
            'enabled': true,
            'firstName': body.firstName,
            'lastName': body.lastName,
            'username': body.username,
            'groups': body.groups
        };

        // Step 1: Register the user in Keycloak using the DAO.
        const registerResult = await keycloakDao.registerKeycloakUser(token, newUserBody, realm);

        // Check if the user registration failed.
        if (registerResult?.error || registerResult?.errorMessage) {
            return {
                message: errorResponses[400].message, //'An error occurred registering user',
                error: errorResponses[400].error,
                errorMessage: registerResult.error || registerResult.errorMessage,
                statusCode: errorResponses[400].statusCode
            };
        }

        // Step 2: Retrieve all users from the realm to find the ID of the one just created.
        // Keycloak's registration endpoint doesn't return the full user object, so this step is necessary.
        const realmUsersResult = await keycloakDao.getAllRealmUsers(token, realm);

        if (realmUsersResult?.error || realmUsersResult?.errorMessage) {
            return {
                message: errorResponses[400].message, //'An error occurred while getting realm user',
                error: errorResponses[400].error,
                errorMessage: realmUsersResult.error || realmUsersResult.errorMessage,
                statusCode: errorResponses[400].statusCode
            };
        }

        // Find the newly created user in the list by matching their email.
        const userData = realmUsersResult.find(user => user.email === body.email);

        // If the user is not found, it indicates a problem with the registration process.
        if (!userData) {
            const error = new Error("User not found in Keycloak after registration")
            return {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: error.message,
                statusCode: errorResponses[400].statusCode
            };
        }

        // Step 3: Set the user's initial password.
        const setPasswordBody = {
            'type': 'password',
            'value': initialPassword,
            'temporary': true // This forces the user to change their password on first login.
        };
        console.log("password", setPasswordBody)
        console.log("password", userData.id)

        const setPasswordResult = await keycloakDao.setUserPassword(token, setPasswordBody, realm, userData.id);
        console.log("result", setPasswordResult)


        // Check if setting the password failed.
        if (setPasswordResult?.error || setPasswordResult?.errorMessage) {
            return {
                message: errorResponses[400].message, //'An error occurred while setting realm user password',
                error: errorResponses[400].error,
                errorMessage: setPasswordResult.error || setPasswordResult.errorMessage,
                statusCode: errorResponses[400].statusCode
            };
        }

        // If all steps succeed, return a success response.
        return {
            message: 'success',
            error: false,
            errorMessage: 'Successfully added user to Keycloak and set temporary password',
            statusCode: 200
        };
    } catch (error) {
        // Catch any unexpected errors during the process.
        console.log(error);
        winston.error('Error in addUserToKeycloak service', error);
        throw error;
    }
}

/**
 * @summary Retrieves email server configuration details from the local database for a specific realm.
 * @description This function queries the `MAIL_CONFIGURATION` table to get the SMTP settings (e.g., email address, password) required to send emails on behalf of a realm.
 * @param {string} realm - The name of the realm for which to fetch mail configuration.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the mail server details.
 * @internal
 */
async function getMailDetails(realm) {
    var deferred = Q.defer();

    try {
        // Use SequelizeDao to fetch all data matching the realm from the mail configuration table.
        let mailData = await SequelizeDao.getAllData("MAIL_CONFIGURATION", { realm: realm });

        // Format the success response.
        let responseBody = {
            message: 'success',
            error: false,
            statusCode: 200,
            result: {
                data: mailData[0] // Assuming one configuration per realm.
            }
        }
        deferred.resolve(responseBody);
    } catch (error) {
        // Handle any database query errors.
        console.log(error);
        winston.error('Error in getMailDetails service', error);
        deferred.reject(error);
    }

    return deferred.promise;
}

/**
 * @summary Orchestrates the registration of a new user, including sending an activation email.
 * @description This service function handles the complete user registration workflow. It generates a random temporary password, calls the `addUserToKeycloak` helper to create the user and set the password in Keycloak, and then, upon success, sends an email to the user with their temporary password and a link to activate their account.
 * @param {object} body - An object containing the new user's profile information (firstName, email, etc.).
 * @param {string} token - An admin-level JWT for authenticating with the Keycloak API.
 * @param {string} realm - The name of the realm where the user will be registered.
 * @returns {Promise<object>} A promise that resolves to the result of the `addUserToKeycloak` operation.
 */
exports.registerKeycloakUser = async function (body, token, realm) {
    try {
        // Generate a cryptographically suitable random password for the new user.
        const randomPassword = generateRandomPassword(15);
        console.log('randomPassword', randomPassword);

        // Create the user in Keycloak with the generated temporary password.
        const result = await addUserToKeycloak(token, body, realm, randomPassword);

        // Fetch the realm-specific web URL for the activation link from the database.
        const getWebUrl = await SequelizeDao.getWebUrl('REALM_CONFIG', { realm });
        let webUrl = getWebUrl[0].web_url;

        // Fetch the email server credentials for the realm.
        const getMailDetailsResult = await getMailDetails(realm);
        let emailId = getMailDetailsResult.result.data.email_id;
        let password = getMailDetailsResult.result.data.password;

        // Configure the Nodemailer transport with the fetched credentials.
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            post: '587',
            service: 'gmail',
            secure: true,
            auth: {
                user: emailId,
                pass: password
            }
        });

        console.log('result', result);
        // If the user was successfully created in Keycloak, proceed to send the activation email.
        if (!result.error) {
            const mailOptions = {
                from: 'aa@cateina.com',
                to: body.email,
                subject: 'Activate Your Account Now !',
                text: `              
                Hello ${body.firstName},  
                
                The one-time password for your account registered with ${body.email} is ${randomPassword}
                
                We request you to enter the one-time password on the link provided below to activate your account: ${webUrl}
                
                By activating your account, you will gain access to features and content. We look forward to welcoming you to the platform.
                Best regards,`
            };

            // Send the email.
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }

        // Return the result of the user creation operation.
        return result;
    } catch (err) {
        // Catch and log any unexpected errors during the process.
        console.log(err);
        winston.error('Error in registerKeycloakUser service', err);
        return {
            message: errorResponses[500].message, //'An error occurred registering user',
            error: errorResponses[500].error,
            errorMessage: err.message,
            statusCode: errorResponses[500].statusCode
        };
    }
};

/**
 * @summary Creates a new role within a specific client's namespace.
 * @description This function takes a role name and description and creates a new client-level role in Keycloak. Client roles are specific to a single application (client) within a realm.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm where the client resides.
 * @param {string} clientId - The unique ID of the client where the role will be created.
 * @param {object} body - An object containing the role's `name` and `description`.
 * @returns {Promise<object>} A promise that resolves to a structured response object indicating success or failure.
 */
exports.createClientRole = async function (token, realmName, clientId, body) {
    var deferred = Q.defer();

    // Prepare the request body for the DAO, containing only the necessary fields.
    var createRoleBody = {
        description: body.description,
        name: body.name
    }

    console.log("client", clientId)
    console.log("client", createRoleBody)
    console.log("client", realmName)

    // Call the DAO to execute the API call to Keycloak.
    keycloakDao.createClientRoles(token, createRoleBody, realmName, clientId).then(function (res) {
        console.log(res);
        let responseBody;

        // Handle error responses from the DAO.
        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            // Format and resolve the success response.
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        // Catch any exceptions during the process.
        console.log(err);
        winston.error('Error in createClientRole service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Retrieves all roles defined for a specific client.
 * @description This function fetches a list of all client-level roles associated with a given client ID within a realm.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm where the client resides.
 * @param {string} clientId - The unique ID of the client whose roles are to be fetched.
 * @returns {Promise<object>} A promise that resolves to a structured response containing the list of roles or an error.
 */
exports.getClientRoles = async function (token, realmName, clientId) {
    var deferred = Q.defer();

    // Call the DAO to get all client roles from Keycloak.
    keycloakDao.getAllClientRoles(token, realmName, clientId).then(function (res) {
        console.log(res);
        let responseBody;

        // Handle potential errors from the Keycloak API.
        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            // On success, format the response with the list of roles.
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        // Catch and log any exceptions.
        console.log(err);
        winston.error('Error in getClientRoles service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}
/**
 * @summary Creates multiple authorization resources for a client's resource server.
 * @description This service function iterates over an array of resource definitions and creates each one in Keycloak. Resources represent protectable assets, like API endpoints.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {Array<object>} resourceBody - An array of objects, where each object defines a resource (e.g., name, URI, scopes).
 * @param {string} realm - The name of the realm.
 * @param {string} clientId - The ID of the client (resource server) where the resources will be created.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing an array of the created resources, or an error object if any creation fails.
 */
exports.createResources = async (token, resourceBody, realm, clientId) => {
    console.log("res body >>>", resourceBody, realm, clientId)
    let resourceRes = [];
    let response;

    // Loop through each resource definition in the input array.
    for (let i = 0; i < resourceBody.length; i++) {
        // Call the DAO to create the individual resource.
        const resourceCreationRes = await keycloakDao.createResource(token, JSON.stringify(resourceBody[i]), realm, clientId)
            .catch((err) => {
                console.log(err);
                winston.error('Error in createResources service', err);
            });
        // If an error occurs for any resource, stop and return the error immediately.
        if (resourceCreationRes?.error) {
            response = {
                message: errorResponses[400].message, //'An error occured creating resources',
                error: errorResponses[400].error,
                errorMessage: resourceCreationRes.error_description,
                statusCode: errorResponses[400].statusCode
            }
            console.log('error');
            return response;
        } else if (resourceCreationRes?.errorMessage) {
            response = {
                message: errorResponses[400].message,//'An error occured creating resources',
                error: errorResponses[400].error,
                errorMessage: resourceCreationRes.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            return response;
        } else {
            // Collect the successful responses.
            resourceRes.push(resourceCreationRes);
        }

        // After the last resource is successfully created, format and return the success response.
        if (i == resourceBody.length - 1) {
            response = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: resourceRes
            }
            console.log('data', resourceRes);
            return response;
        }

    }


    return response;
}

/**
 * @summary Deletes a user from Keycloak.
 * @description This function calls the DAO to permanently remove a user from a specified realm using their unique user ID.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realm - The name of the realm where the user exists.
 * @param {string} user_id - The unique ID of the user to be deleted.
 * @returns {Promise<object>} A promise that resolves to a success response object or throws a formatted error object on failure.
 */
exports.deleteKeyCloakUser = async function (token, realm, user_id) {
    try {
        // Call the DAO to perform the deletion.
        await keycloakDao.deleteKeycloakUser(token, realm, user_id);

        // If the DAO call does not throw, the operation was successful.
        const responseBody = {
            message: 'User deleted successfully',
            error: false,
            statusCode: 200,
        };

        return responseBody;
    } catch (error) {
        // If the DAO throws an error (e.g., user not found), catch it and re-throw a structured error.
        console.error(`An error occurred while deleting user: ${error.message}`);

        const responseBody = {
            message: errorResponses[404].message,
            error: errorResponses[404].statusCode,
            errorMessage: error.message,
            statusCode: errorResponses[404].statusCode // Using the error's statusCode or default to 404
        };

        throw responseBody;
    }
};

/**
 * @summary Maps one or more client-level roles to a user.
 * @description This service function assigns specific roles, which are scoped to a particular client, to a user account, thereby granting them permissions within that client's context.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {string} user_id - The unique ID of the user to whom the roles will be mapped.
 * @param {Array<object>} body - An array of role representation objects to be assigned to the user.
 * @param {string} client_id - The unique ID of the client to which the roles belong.
 * @returns {Promise<object>} A promise that resolves to a structured response object indicating success or failure.
 */
exports.addClientRoleMapping = async function (token, realmName, user_id, body, client_id) {
    var deferred = Q.defer();

    var createRoleBody = body

    console.log("client_id", client_id)
    console.log("client_body", createRoleBody)
    console.log("realm", realmName)
    console.log("user_id", user_id)


    // Call the DAO to perform the role mapping.
    keycloakDao.addClientRoleMapping(token, createRoleBody, realmName, client_id, user_id).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: "Client Role-mapping added for"
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in addClientRoleMapping service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}
/**
 * @summary Retrieves all role mappings for a specific user.
 * @description Fetches a complete list of both realm-level and client-level roles that have been assigned to a given user.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm where the user exists.
 * @param {string} user_id - The unique ID of the user whose roles are to be fetched.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the role mappings, or throws an error.
 */
exports.getUserRoleMappings = async function (token, realmName, user_id) {
    try {
        console.log("user", user_id);
        const res = await keycloakDao.getUserRoleMappings(token, realmName, user_id);

        let responseBody;

        if (res?.error || res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error || res.errorMessage,
                statusCode: errorResponses[400].statusCode
            };
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            };
        }

        return responseBody;

    } catch (err) {
        console.log(err);
        winston.error('Error in getUserRoleMappings service', err);
        throw err;
    }
};
/**
 * @summary Creates a new user group in a realm.
 * @description Groups are used to manage collections of users. This function creates a new top-level group with a specified name.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm where the group will be created.
 * @param {object} body - An object containing the `name` for the new group.
 * @returns {Promise<object>} A promise that resolves to a structured response object indicating success or failure.
 */
exports.createGroup = async function (token, realmName, body) {
    var deferred = Q.defer();

    // The path for a top-level group is typically '/' followed by the group name.
    var createGroupBody = {
        name: body.name,
        path: '/' + body.name,
        subGroups: []
    }
    console.log(createGroupBody);

    keycloakDao.createGroup(token, realmName, createGroupBody).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            console.log('inside else');
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in createGroup service', err);
        deferred.reject(err);
    });


    return deferred.promise;
}

/**
 * @summary Retrieves all groups defined in a realm.
 * @description Fetches a list of all user groups, including their hierarchy, for a specified realm.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the list of groups.
 */
exports.getAllGroups = async function (token, realmName) {
    var deferred = Q.defer();

    // let token = await getMasterToken();

    keycloakDao.getAllGroups(token, realmName).then(function (groupData) {
        console.log(groupData);

        let responseBody;

        if (groupData?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: groupData.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (groupData?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: groupData.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: groupData
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getAllGroups service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Retrieves detailed information for a single group by its ID.
 * @description Fetches the full representation of a group, including its attributes, roles, and path.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {string} groupId - The unique ID of the group to retrieve.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the group's data.
 */
exports.getGroupDataById = async function (token, realmName, groupId) {
    var deferred = Q.defer();

    keycloakDao.getGroupDataById(token, realmName, groupId).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getGroupDataById service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Updates the properties of an existing group.
 * @description This function modifies the details of a group, such as its name.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {string} groupId - The ID of the group to update.
 * @param {object} body - An object containing the new properties for the group (e.g., `name`).
 * @returns {Promise<object>} A promise that resolves to a structured response object indicating the result of the update operation.
 */
exports.updateGroup = async function (token, realmName, groupId, body) {
    var deferred = Q.defer();

    // Prepare the update payload.
    var updateGroupBody = {
        name: body.name,
    }

    keycloakDao.updateGroup(token, realmName, groupId, updateGroupBody).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in updateGroup service', err);
        deferred.reject(err);
    });


    return deferred.promise;
}


/**
 * @summary Assigns a user to a group.
 * @description This function makes a user a member of a specified group.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - An object containing the `userId` and `groupId`.
 * @param {string} realmName - The name of the realm.
 * @returns {Promise<object>} A promise that resolves to a structured response object indicating the result of the operation.
 */
exports.addUserToGroup = async function (token, body, realmName) {
    var deferred = Q.defer();

    console.log("BODY", body);

    // Call the DAO to add the user to the group.
    keycloakDao.assignGroupToUser(token, realmName, body.userId, body.groupId).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in addUserToGroup service', err);
        deferred.reject(err);
    });


    return deferred.promise;
}

/**
 * @summary Creates a new subgroup under a parent group.
 * @description Keycloak supports a hierarchy of groups. This function creates a new group as a child of an existing group.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {object} body - An object containing the `name` of the new child group.
 * @param {string} groupId - The ID of the parent group.
 * @returns {Promise<object>} A promise that resolves to a structured response object.
 */
exports.createChildGroup = async function (token, realmName, body, groupId) {
    var deferred = Q.defer();

    var createGroupBody = {
        name: body.name,
    }
    console.log(createGroupBody);

    keycloakDao.createChildGroup(token, realmName, createGroupBody, groupId).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            console.log('inside else');
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in createGroup service', err);
        deferred.reject(err);
    });


    return deferred.promise;
}

/**
 * @summary Retrieves a list of users who are members of a specific group.
 * @description Fetches the user representations for all members of a given group.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {string} groupId - The ID of the group whose members are to be retrieved.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the list of group members.
 */
exports.getGroupMembers = async function (token, realmName, groupId) {
    var deferred = Q.defer();

    keycloakDao.getGroupMembers(token, realmName, groupId).then(function (res) {
        console.log("getGroupMembers response:", res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getGroupMembers service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Deletes a group from a realm.
 * @description Permanently removes a group and its hierarchy from Keycloak.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {string} groupId - The ID of the group to be deleted.
 * @returns {Promise<object>} A promise that resolves to a structured response object indicating the result of the deletion.
 */
exports.deleteGroup = async function (token, realmName, groupId) {
    var deferred = Q.defer();

    keycloakDao.deleteGroup(token, realmName, groupId).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in deleteGroup service', err);
        deferred.reject(err);
    });


    return deferred.promise;
}

/**
 * @summary Assigns roles to a group, handling both realm and client roles based on stored policies.
 * @description This is a complex function that assigns a set of roles to a group. It first finds the role in the local database to get its associated policies. It then maps the main role as a realm role to the group, and subsequently maps all client roles defined in the policy to the group for the realm's specific resource server client.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {Array<object>} roleBody - An array of role objects (containing `name` and `id`) to be assigned.
 * @param {string} realmName - The name of the realm.
 * @param {string} groupId - The ID of the group to which roles will be added.
 * @returns {Promise<object>} A promise that resolves to a final success or error response object.
 */
exports.addRolesToGroup = async function (token, roleBody, realmName, groupId) {
    var deferred = Q.defer();

    // First, fetch all clients to identify the resource server for this realm.
    let getAllRealmClientRes = await getAllRealmClients(token, realmName);
    if (getAllRealmClientRes.error) {
        deferred.resolve(getAllRealmClientRes);
    }

    // Find the role in the local database to update its group associations.
    const findGroup = await SequelizeDao.findOnee('ROLES', { role_name: roleBody[0].name });

    let addGroupReqBody = {}
    if (findGroup.groups == null) {
        addGroupReqBody = {
            groups: [groupId]
        }
    } else {
        findGroup.groups.push(groupId);
        addGroupReqBody = {
            groups: findGroup.groups
        }
    }
    await SequelizeDao.updateData(addGroupReqBody, 'ROLES', { role_name: roleBody[0].name })

    if (getAllRealmClientRes.result.length < 0) {
        const error = new Error("No client found for the realm")
        let responseBody = {
            message: errorResponses[400].message,//'An error occured getting realm clients',
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode
        }

        deferred.resolve(responseBody);
    }
    let clients = getAllRealmClientRes.result
    console.log("client------>",clients)
    // Find the correct client ID from the LOGIN_CONFIG table.
    const clientDetails = await SequelizeDao.findOnee('LOGIN_CONFIG', { realm: realmName })
    console.log("clientDetails-->",clientDetails)
    let resourceServerClient = clients.filter(client => client.clientId == clientDetails.kc_clientId);
    console.log("resourceServerClient[0].id>>>>>", resourceServerClient[0].id)
    let responseBody;

    // Iterate through each role to be added.
    for (let i = 0; i < roleBody.length; i++) {
        // Get the full realm role representation from Keycloak.
        keycloakDao.getRoleByName(token, realmName, roleBody[i].name).then(async function (res) {

            // Get the role's policy definitions from the local database.
            const getRoles = await SequelizeDao.getAllData('ROLES', { role_id: roleBody[i].id });

            const addrealmRole = {
                id: res.id,
                name: res.name
            }
            // Assign the main role as a realm role to the group.
            // eslint-disable-next-line no-unused-vars
            const responsse = await keycloakDao.addRealmRoles(token, [addrealmRole], realmName, groupId)

            // Iterate through the associated policies to assign client roles.
            for (let j = 0; j < getRoles[0].role_policies.length; j++) {

                let policy = getRoles[0].role_policies[j];
                let policyRoleId = policy.role_id;
                let policyRoleName = policy.role_name;

                // Assign the client role defined in the policy to the group.
                keycloakDao.addRolesToGroup(token, [{ id: policyRoleId, name: policyRoleName }], realmName, groupId, resourceServerClient[0].id).then(function (res) {
                    let responseBody;

                    if (res?.error) {
                        responseBody = {
                            message: errorResponses[400].message,
                            error: errorResponses[400].error,
                            errorMessage: res.error,
                            statusCode: errorResponses[400].statusCode
                        }

                        deferred.resolve(responseBody);
                    } else if (res?.errorMessage) {
                        responseBody = {
                            message: errorResponses[400].message,
                            error: errorResponses[400].error,
                            errorMessage: res.errorMessage,
                            statusCode: errorResponses[400].statusCode
                        }

                        deferred.resolve(responseBody);
                    } else {
                        responseBody = {
                            message: 'success',
                            error: false,
                            statusCode: 200,
                            result: {
                                data: res
                            }
                        }

                        deferred.resolve(responseBody);
                    }
                }).catch(function (err) {
                    console.log(err);
                    winston.error('Error in addRolesToGroup service', err);
                    deferred.reject(err);
                });
            }
            if (res?.error) {
                responseBody = {
                    message: errorResponses[400].message,
                    error: errorResponses[400].error,
                    errorMessage: res.error,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else if (res?.errorMessage) {
                responseBody = {
                    message: errorResponses[400].message,
                    error: errorResponses[400].error,
                    errorMessage: res.errorMessage,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            }
        }).catch(function (err) {
            console.log(err);
            winston.error('Error in createRole service', err);
            deferred.reject(err);
        });
    }



    return deferred.promise;
}


/**
 * @summary Retrieves all available role mappings within a realm.
 * @description Fetches a list of all roles that can be assigned.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing role data.
 */
exports.getRoleMappings = async function (token, realmName) {
    var deferred = Q.defer();

    keycloakDao.getRoleMappings(token, realmName).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getRoleMappings service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Removes roles from a group.
 * @description This function revokes roles from a group. It handles the removal of both the main realm role and any associated client roles defined by the role's policies stored in the local database.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {string} groupId - The ID of the group from which roles will be removed.
 * @param {Array<object>} body - An array of role objects to be removed.
 * @returns {Promise<object>} A promise that resolves to a final success or error response object.
 */
exports.deleteGroupRole = async function (token, realmName, groupId, body) {
    var deferred = Q.defer();
    // Find the resource server client for the realm.
    let getAllRealmClientRes = await getAllRealmClients(token, realmName);
    if (getAllRealmClientRes.error) {
        deferred.resolve(getAllRealmClientRes);
    }

    if (getAllRealmClientRes.result.length < 0) {
        const error = new Error("No client found for the realm")
        let responseBody = {
            message: errorResponses[400].message,//'An error occured getting realm clients',
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode
        }

        deferred.resolve(responseBody);
    }
    let clients = getAllRealmClientRes.result
    console.log("clients",clients)
    const clientDetails = await SequelizeDao.findOnee('LOGIN_CONFIG', { realm: realmName })
    console.log("clientDetails-->",clientDetails)
    let resourceServerClient = clients.filter(client => client.clientId == clientDetails.kc_clientId);
    console.log("resourceServerClient[0].id>>>>>", resourceServerClient[0].id)

    // Iterate through each role to be deleted from the group.
    for (let i = 0; i < body.length; i++) {

        // Get the role's policy definitions from the local database.
        const getRoles = await SequelizeDao.getAllData('ROLES', { role_name: body[i].name });

        // Remove the associated client roles defined in the policies.
        for (let j = 0; j < getRoles[0].role_policies.length; j++) {

            let policy = getRoles[0].role_policies[j];
            let policyRoleId = policy.role_id;
            let policyRoleName = policy.role_name;

            await keycloakDao.deleteRoles(token, [{ id: policyRoleId, name: policyRoleName }], realmName, resourceServerClient[0].id, groupId)
        }
    }
    // Remove the role association from the local database.
    await SequelizeDao.deleteData('ROLES', { role_id: body[0].id, role_name: body[0].name })

    // Remove the main realm role from the group in Keycloak.
    keycloakDao.deleteGroupRole(token, body, realmName, groupId).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in delete group role service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Retrieves the roles assigned to a specific group.
 * @description Fetches all realm-level and client-level roles that are currently mapped to a group.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {string} groupId - The ID of the group.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the group's roles.
 */
exports.getGroupRole = async function (token, realmName, groupId) {
    var deferred = Q.defer();

    keycloakDao.getGroupRole(token, realmName, groupId).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: errorResponses[400].statusCode,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getGroupRole service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Removes a user from a group.
 * @description Revokes a user's membership in a specific group.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - An object containing the `userId` and `groupId`.
 * @param {string} realmName - The name of the realm.
 * @returns {Promise<object>} A promise that resolves to a structured response object indicating the result.
 */
exports.removeUserFromGroup = async function (token, body, realmName) {
    var deferred = Q.defer();

    console.log(body);

    keycloakDao.removeUserFromGroup(token, realmName, body.userId, body.groupId).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in removeUserFromGroup service', err);
        deferred.reject(err);
    });


    return deferred.promise;
}

/**
 * @summary Retrieves all authorization policies from the local database.
 * @description This function fetches policy definitions that have been stored locally in the `POLICY` table.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the list of policies.
 */
exports.getResourceServerPolicy = async function () {
    var deferred = Q.defer();

    try {
        // Fetch all records from the POLICY table.
        let policyData = await SequelizeDao.getAllData("POLICY", {});
        let responseBody = {
            message: 'success',
            error: false,
            statusCode: 200,
            result: {
                data: policyData
            }
        }
        deferred.resolve(responseBody);
    } catch (error) {
        console.log(error);
        winston.error('Error in getResourceServerPolicy service', error);
        deferred.reject(error);
    }

    return deferred.promise;
}

/**
 * @summary Adds a new authorization policy to the local database.
 * @description This function saves a new policy definition to the local `POLICY` table for later use.
 * @param {object} body - The policy object to be saved.
 * @returns {Promise<object>} A promise that resolves to a success response or rejects on error.
 */
exports.addResourceServerPolicy = async function (body) {
    var deferred = Q.defer();

    // console.log(body);

    try {
        // Insert the new policy data into the database.
        await SequelizeDao.insertData(body, 'POLICY');
        let responseBody = {
            message: "Success",
            error: false,
            statusCode: 200,
        };
        deferred.resolve(responseBody);
    } catch (error) {
        console.log(error);
        winston.error('Error in addResourceServerPolicy service', error);
        deferred.reject(error);
    }


    return deferred.promise;
}

/**
 * @summary Creates a new role in both the local database and Keycloak.
 * @description This function ensures a role with a given name doesn't already exist in the local database before attempting to create it. If it's new, it's added to the local DB and then created as a realm role in Keycloak.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {object} body - An object containing the role details (`role_id`, `role_name`, `role_description`, etc.).
 * @param {string} realmName - The name of the realm.
 * @returns {Promise<object>} A promise that resolves to a structured response object.
 */
exports.createRole = async function (token, body, realmName) {
    var deferred = Q.defer();
    let responseBody;
    const name = body.role_name.trim();
    const trimmedBody = { ...body, role_name: name };
    // Use findOrCreate to prevent creating duplicate roles in the local database.
    // eslint-disable-next-line no-unused-vars
    const [role, created] = await SequelizeDao.findOrCreate('ROLES', { role_name: name }, trimmedBody);
    if (!created) {
        // If the role already exists locally, return an error.
        const error = new Error("Role already exists!");
        responseBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode
        }

        deferred.resolve(responseBody);
    }
    else {
        // If the role is new locally, proceed to create it in Keycloak.
        const updateReqBody = {
            name: trimmedBody.role_name,
            description: trimmedBody.role_description
        };
      
        keycloakDao.addRealmRole(token, realmName, updateReqBody).then(function (res) {
            if (res?.error) {
                responseBody = {
                    message: errorResponses[400].message,
                    error: errorResponses[400].error,
                    errorMessage: res.error,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else if (res?.errorMessage) {
                responseBody = {
                    message: errorResponses[400].message,
                    error: errorResponses[400].error,
                    errorMessage: res.errorMessage,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else {
                responseBody = {
                    message: 'success',
                    error: false,
                    statusCode: 200,
                    result: {
                        data: res
                    }
                }

                deferred.resolve(responseBody);
            }
        }).catch(function (err) {
            console.log(err);
            winston.error('Error in createRole service', err);
            deferred.reject(err);
        });
    }
    return deferred.promise;
}

/**
 * @summary Retrieves a realm-level role from Keycloak by its name.
 * @description Fetches the full representation of a role within a specific realm.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {string} roleName - The name of the role to retrieve.
 * @returns {Promise<object>} A promise that resolves to a structured response object with the role data.
 */
exports.getRoleByName = async function (token, realmName, roleName) {
    var deferred = Q.defer();

    keycloakDao.getRoleByName(token, realmName, roleName).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in createRole service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Associates a Keycloak role with one or more authorization policies.
 * @description This function implements a many-to-many relationship between roles and policies. It fetches each specified policy, adds the role's ID to the policy's role list, and then updates the policy in Keycloak.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {object} payload - An object containing the `roleId` and an array of policy names (`policy`).
 * @returns {Promise<object>} A promise that resolves once all policies have been updated.
 */
exports.setRolePolicy = async function (token, realmName, payload) {
    var deferred = Q.defer();

    var roleId = payload.roleId;
    var policies = payload.policy;
    let clientId = process.env.RESOURCE_SERVER;

    // Iterate through each policy that needs to be associated with the role.
    for (let i = 0; i < policies.length; i++) {
        // Step 1: Fetch the current state of the policy.
        await keycloakDao.getPolicyDetails(token, realmName, clientId, policies[i]).then(function (res) {
            console.log("getPolicyDetails response:", res);
            let responseBody;

            if (res?.error) {
                responseBody = {
                    message: errorResponses[400].message,
                    error: errorResponses[400].error,
                    errorMessage: res.error,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else if (res?.errorMessage) {
                responseBody = {
                    message: errorResponses[400].message,
                    error: errorResponses[400].error,
                    errorMessage: res.errorMessage,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else {
                // Step 2: Modify the policy by adding the new role ID to its list.
                var updatePolicyPayload = res;
                updatePolicyPayload.roles.push({
                    "id": roleId,
                    "required": false
                });
                // Step 3: Update the policy in Keycloak with the modified data.
                keycloakDao.updatePolicyDetails(token, realmName, clientId, policies[i], updatePolicyPayload).then(function (res) {
                    console.log("updatePolicyDetails response:", res);
                    let responseBody;

                    if (res?.error) {
                        responseBody = {
                            message: errorResponses[400].message,
                            error: errorResponses[400].error,
                            errorMessage: res.error,
                            statusCode: errorResponses[400].statusCode
                        }

                        deferred.resolve(responseBody);
                    } else if (res?.errorMessage) {
                        responseBody = {
                            message: errorResponses[400].message,
                            error: errorResponses[400].error,
                            errorMessage: res.errorMessage,
                            statusCode: errorResponses[400].statusCode
                        }

                        deferred.resolve(responseBody);
                    } else {
                        responseBody = {
                            message: 'success',
                            error: false,
                            statusCode: 200,
                            result: {
                                data: res
                            }
                        }

                        deferred.resolve(responseBody);
                    }
                }).catch(function (err) {
                    console.log(err);
                    winston.error('Error in createRole service', err);
                    deferred.reject(err);
                });
            }
        }).catch(function (err) {
            console.log(err);
            winston.error('Error in createRole service', err);
            deferred.reject(err);
        });
    }
    return deferred.promise;
}

/**
 * @summary Retrieves all groups for a realm.
 * @description A wrapper function for `keycloakDao.getGroups` that provides standard response formatting.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @returns {Promise<object>} A promise that resolves to a structured response with the list of groups.
 */
exports.getGroups = async function (token, realmName) {
    var deferred = Q.defer();

    keycloakDao.getGroups(token, realmName).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in getGroups service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Retrieves all users for a realm.
 * @description A wrapper function for `keycloakDao.getUser` providing standard response formatting. Note: The DAO method appears to be `getUser`, which might be a naming inconsistency for getting *all* users.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @returns {Promise<object>} A promise that resolves to a structured response with the list of users.
 */
exports.getUser = async function (token, realmName) {
    var deferred = Q.defer();

    keycloakDao.getUser(token, realmName).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in get user service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Updates a user's profile information in Keycloak.
 * @description A wrapper for the `keycloakDao.updateUser` method with standard response formatting.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {object} body - The user object containing the fields to be updated.
 * @returns {Promise<object>} A promise that resolves to a structured response object.
 */
exports.updateUser = async function (token, realmName, body) {
    var deferred = Q.defer();

    keycloakDao.updateUser(token, realmName, body).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in update user service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}


/**
 * @summary Maps client-level roles to a user.
 * @description This function assigns a list of client-specific roles to a user. It first determines the correct client ID for the realm's resource server.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {object} payload - An object containing an array of `policy` (roles) to be mapped.
 * @param {string} userId - The unique ID of the user.
 * @returns {Promise<object>} A promise that resolves to a structured response object.
 */
exports.roleMapping = async function (token, realmName, payload, userId) {
    var deferred = Q.defer();
    let responseBody;
    var roles = payload.policy;
    let clientId;
    // Get all clients to find the one configured as the resource server.
    const getClient = await keycloakDao.getClients(token, realmName);
    if (getClient?.error || getClient?.errorMessage) {
        responseBody = {
            message: errorResponses[400].message,
            error: errorResponses[400].error,
            errorMessage: getClient.error || getClient.errorMessage,
            statusCode: errorResponses[400].statusCode
        };
        deferred.resolve(responseBody);
    }
    // Find the client ID from the local LOGIN_CONFIG database table.
    const clientDetails = await SequelizeDao.findOnee('LOGIN_CONFIG', { realm: realmName })
    console.log("clientDetails-->",clientDetails)
    let findClient = getClient.find(client => client.clientId === clientDetails.kc_clientId)
    clientId = findClient && findClient.id

    // Iterate through the roles and map each one to the user.
    for (let i = 0; i < roles.length; i++) {
        var requestBody = [{
            "id": roles[i].role_id,
            "name": roles[i].role_name,
            "description": ""
        }];

        keycloakDao.roleMapping(token, realmName, userId, clientId, requestBody).then(function (res) {
            console.log("roleMapping response:", res);

            if (res?.error) {
                responseBody = {
                    message: errorResponses[400].message,
                    error: errorResponses[400].error,
                    errorMessage: res.error,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else if (res?.errorMessage) {
                responseBody = {
                    message: errorResponses[400].message,
                    error: errorResponses[400].error,
                    errorMessage: res.errorMessage,
                    statusCode: errorResponses[400].statusCode
                }

                deferred.resolve(responseBody);
            } else {
                responseBody = {
                    message: 'success',
                    error: false,
                    statusCode: 200,
                    result: {
                        data: res
                    }
                }

                deferred.resolve(responseBody);
            }
        }).catch(function (err) {
            console.log(err);
            winston.error('Error in roleMapping service', err);
            deferred.reject(err);
        });
    }
    return deferred.promise;
}


/**
 * @summary Retrieves role mapping data from the local database.
 * @description Fetches all records from the `ROLE_MAPPING` table for a specific realm.
 * @param {string} realm - The name of the realm.
 * @returns {Promise<object>} A promise that resolves to a structured response with the role mapping data.
 */
exports.getRoles = async function (realm) {
    var deferred = Q.defer();

    try {
        let roleData = await SequelizeDao.getAllData("ROLE_MAPPING", { realm: realm });
        let responseBody = {
            message: 'success',
            error: false,
            statusCode: 200,
            result: {
                data: roleData
            }
        }
        deferred.resolve(responseBody);
    } catch (error) {
        console.log(error);
        winston.error('Error in getRoles service', error);
        deferred.reject(error);
    }

    return deferred.promise;
}


/**
 * @summary Deletes a role from Keycloak and the local database, and cleans up associated group mappings.
 * @description This is a complex deletion function that ensures consistency between Keycloak and the local system. It removes client role mappings from any groups associated with the role's policies, deletes the local DB record for the role, and finally deletes the realm role from Keycloak.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {object} body - An object representing the role to be deleted (containing `id` and `name`).
 * @returns {Promise<object>} A promise that resolves to a structured response object.
 */
exports.deleteRole = async function (token, realmName, body) {
    var deferred = Q.defer();
    // Step 1: Find the resource server client for the realm.
    let getAllRealmClientRes = await getAllRealmClients(token, realmName);
    if (getAllRealmClientRes.error) {
        deferred.resolve(getAllRealmClientRes);
    }

    if (getAllRealmClientRes.result.length < 0) {
        const error = new Error("No client found for the realm")
        let responseBody = {
            message: errorResponses[400].message,//'An error occured getting realm clients',
            error: errorResponses[400].error,
            errorMessage: error.message,
            statusCode: errorResponses[400].statusCode
        }

        deferred.resolve(responseBody);
    }
    let clients = getAllRealmClientRes.result
    const clientDetails = await SequelizeDao.findOnee('LOGIN_CONFIG', { realm: realmName })
    console.log("clientDetails-->",clientDetails)
    let resourceServerClient = clients.filter(client => client.clientId == clientDetails.kc_clientId);
    console.log("resourceServerClient[0].id>>>>>", resourceServerClient[0].id)

    // Step 2: Get the role's details from the local DB, including its policies and group associations.
    const getRoles = await SequelizeDao.getAllData('ROLES', { role_id: body.id });
    console.log('getRoles', getRoles);
    // Step 3: Iterate through the policies and groups to remove the client role mappings.
    for (let i = 0; i < getRoles[0].role_policies.length; i++) {

        let policy = getRoles[0].role_policies[i];
        let policyRoleId = policy.role_id;
        let policyRoleName = policy.role_name;

        let groupId;
        for (let j = 0; j < getRoles[0].groups.length; j++) {
            groupId = getRoles[0].groups[j]
            await keycloakDao.deleteRoles(token, [{ id: policyRoleId, name: policyRoleName }], realmName, resourceServerClient[0].id, groupId)

        }
    }

    // Step 4: Delete the role record from the local database.
    await SequelizeDao.deleteData('ROLES', { role_id: body.id })

    // Step 5: Get the full role representation from Keycloak to ensure we have the correct ID.
    const getRoleByName = await keycloakDao.getRoleByName(token, realmName, body.name)

    let updatedReqBody = [{
        id: getRoleByName.id,
        name: getRoleByName.name
    }]

    // Step 6: Delete the realm role from Keycloak.
    keycloakDao.deleteRoleByid(token, updatedReqBody, realmName, getRoleByName.id).then(function (res) {
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in delete role service', err);
        deferred.reject(err);
    });


    return deferred.promise;
}


/**
 * @summary Updates a role's details in both the local database and Keycloak.
 * @description This function first updates the role's description and associated policies in the local `ROLES` table. It then updates the corresponding realm role in Keycloak with the new description.
 * @param {string} token - An admin-level JWT for Keycloak API authentication.
 * @param {string} realmName - The name of the realm.
 * @param {object} body - An object containing the role's `role_id`, `role_name`, `role_description`, and `role_policies`.
 * @returns {Promise<object>} A promise that resolves to a structured response object.
 */
exports.updateRole = async function (token, realmName, body) {
    var deferred = Q.defer();
    console.log('body', body, realmName);
    // Step 1: Update the role record in the local database.
    await SequelizeDao.updateData({ role_description: body.role_description, role_policies: body.role_policies }, 'ROLES', { role_id: body.role_id })
    // Step 2: Fetch the role from Keycloak to get its current ID and state.
    const getRoleByName = await keycloakDao.getRoleByName(token, realmName, body.role_name)
    console.log('getRoleByName', getRoleByName);
    // Prepare the payload for the Keycloak update API call.
    const updatedBody = {
        id: getRoleByName.id,
        description: body.role_description,
        name: body.role_name
    }
    // Step 3: Update the role in Keycloak.
    keycloakDao.updateRole(token, realmName, updatedBody, getRoleByName.id).then(function (res) {
        console.log(res);
        let responseBody;

        if (res?.error) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }
    }).catch(function (err) {
        console.log(err);
        winston.error('Error in update role service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

/**
 * @summary Handles user login by exchanging credentials for tokens at the Keycloak token endpoint.
 * @description This function acts as a proxy to the Keycloak `/token` endpoint, taking user credentials and the realm name to facilitate a direct grant (password) authentication flow.
 * @param {object} body - An object containing user credentials (`username`, `password`, `client_id`, `grant_type`).
 * @param {string} realm - The name of the realm against which to authenticate.
 * @returns {Promise<object>} A promise that resolves to a structured response object containing the access and refresh tokens, or an error.
 */
exports.postLogin = async function(body,realm){
    var deferred = Q.defer();
    console.log("body-----",body)
    // const loginData = await SequelizeDao.findOnee('LOGIN_CONFIG', { client_id: body.client });
        // console.log("loginData--->", loginData);    
    
    // Call the DAO which will make the POST request to the Keycloak token endpoint.
    keycloakDao.postLogin(body,realm).then(function (res) {
        console.log(res);
        
        // Handle authentication failures (e.g., invalid credentials) and other errors.
        if (res?.error) {
            const responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.error,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else if (res?.errorMessage) {
            const responseBody = {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: res.errorMessage,
                statusCode: errorResponses[400].statusCode
            }

            deferred.resolve(responseBody);
        } else {
            // On successful login, return the token data.
            const responseBody = {
                message: 'success',
                error: false,
                statusCode: 200,
                result: {
                    data: res
                }
            }

            deferred.resolve(responseBody);
        }


    }).catch(function (err) {
        console.log(err);
        winston.error('Error in login', err);
        deferred.reject(err);
    });

    return deferred.promise;
  }

/**
 * @summary Creates a JSON Web Signature (JWS) token.
 * @description This utility function signs a given payload using a secret from environment variables to produce a JWS token with an HS256 algorithm.
 * @param {object} payload - The JSON payload to be signed.
 * @returns {object} An object containing either the `jwsToken` string or an `error` object.
 */
  exports.jwsToken = function(payload){
    // const header = {   typ : 'JWT', alg: 'HS256' }
    try {
        // const token = jwt.sign(payload, signature, { algorithm: 'HS256' });
        const signature = process.env.signatureSecret;
        console.log("signature :45 ",signature);
        // Use the 'jws' library to sign the payload.
        const token = jws.sign({
            header: { alg: 'HS256' },
            payload: payload,
            secret: signature
        });
        console.log("TOKEN : 48 ",token);
        return {jwsToken:token};
    } catch (error) {
        console.log("ERROR 51 :",error);
        return {error:error};
    }
  
  }