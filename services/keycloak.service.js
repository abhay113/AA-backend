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



exports.addRealm = async function (body) {
    var deferred = Q.defer();


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


    await keycloakDao.addRealm(token, realmBody).then(async function (res) {
        console.log("======", res);

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
                            let userFunctionRes = await addUserToKeycloakAndDB(token, body);

                            if (userFunctionRes.error) {
                                deferred.resolve(userFunctionRes);
                            }

                            let getClientsRes = await getAngularAndRealmManageClients(token, body);

                            console.log(getClientsRes);

                            if (getClientsRes.error) {
                                deferred.resolve(getClientsRes);
                            }
                            // eslint-disable-next-line no-unused-vars
                            let angularClient = getClientsRes.result.data.angularClient;
                            let realmManagementClient = getClientsRes.result.data.realmManagementClient;

                            let getRealmAdminRoleRes = await getRealmAdminRoleId(token, body, realmManagementClient[0].id);
                            if (getRealmAdminRoleRes.error) {
                                deferred.resolve(getClientsRes);
                            }
                            let realmAdminRole = getRealmAdminRoleRes.result.data;

                            let getUserIdRes = await getUserId(token, body);
                            if (getUserIdRes.error) {
                                deferred.resolve(getUserIdRes);
                            }
                            let userData = getUserIdRes.result.data;

                            let createRealmAdminRes = await createRealmAdmin(token, body, realmManagementClient[0].id, realmAdminRole.id, userData[0].id);
                            if (createRealmAdminRes.error) {
                                deferred.resolve(createRealmAdminRes);
                            }

                            let updateUserDetailsToRealmTableRes = await updateUserDetailsToRealmTable(body, userData[0].id);
                            if (updateUserDetailsToRealmTableRes.error) {
                                deferred.resolve(updateUserDetailsToRealmTableRes);
                            }

                            let createIdentityProviderRes = await createIdentityProvider(token, body);
                            if (createIdentityProviderRes.error) {
                                deferred.resolve(createIdentityProviderRes);
                            }

                            let realmName = body.realm

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


                            let resourceServerRes = await createResourceServer(body, userData);

                            if (resourceServerRes.error) {
                                deferred.resolve(resourceServerRes);
                            } else {
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

exports.getRealmData = async function (token, realmName) {
    var deferred = Q.defer();

    keycloakDao.getRealmData(token, realmName).then(function (res) {
        console.log(res);

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

exports.getRealmDbDetails = async function (realmId) {
    var deferred = Q.defer();

    keycloakDao.getRealmDbDetails(realmId).then(function (res) {
        console.log(res);

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
exports.getRealmClients = async function (token, realmName) {
    var deferred = Q.defer();

    keycloakDao.getAllRealmClients(token, realmName).then(function (res) {
        console.log(res);

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
            let clients = res.filter(value => (value.clientId == 'angular' || value.clientId == 'realm-management'))

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

exports.updateKeycloakRealmSettings = async function (token, body, realmName) {
    var deferred = Q.defer();

    console.log(body);

    keycloakDao.updateRealm(token, body, realmName).then(function (res) {
        console.log(res);

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


async function addUserToKeycloakAndDB(token, body) {
    var deferred = Q.defer();

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
                    let userData = result.filter(value => value.username === body.username);

                    if (userData.length > 0) {
                        console.log("userrrr", userData[0].username);

                        let setPasswordBody = {
                            'type': 'password',
                            'value': body.password,
                            'temporary': false
                        }


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

async function getAngularAndRealmManageClients(token, body) {
    var deferred = Q.defer();

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

            let angularClient = clients.filter(client => client.clientId == 'angular');
            let realmManagementClient = clients.filter(client => client.clientId === 'realm-management');

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

async function getRealmAdminRoleId(token, body, clientId) {
    var deferred = Q.defer();

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

async function getUserId(token, body) {
    var deferred = Q.defer();

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
            let userData = result.filter(value => value.username == body.username);

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

async function createRealmAdmin(token, body, realmManageClientId, realmManageRoleId, userId) {
    var deferred = Q.defer();

    let createRealmAdminBody = [{
        'clientRole': true,
        'composite': true,
        'containerId': realmManageClientId,
        'description': '${role_realm-admin}',
        'id': realmManageRoleId,
        'name': 'realm-admin'
    }]

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
async function createClientRoles(token, body, angularClientId) {
    var deferred = Q.defer();

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

    for (let i = 0; i < roles.length; i++) {
        await keycloakDao.
            createClientRoles(token, roles[i], body.realm, angularClientId).then(function (res) {
                console.log(res);

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
async function updateUserDetailsToRealmTable(body, userId) {
    var deferred = Q.defer();

    let realmBody = {
        realm_admin_id: userId
    }

    console.log()

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
async function createIdentityProvider(token, body) {
    var deferred = Q.defer();

    console.log(body);

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
            syncMode: 'IMPORT',
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

async function createAuthorizationScope(token, scopeBody, realm, clientId) {
    var deferred = Q.defer();

    let scopeRes = [];

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
                scopeRes.push(res);
            }



        }).catch(function (err) {
            console.log(err);
            winston.error('Error in createAuthorizationScope service', err);
            deferred.reject(err);
        });

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


async function createResourceServer(body, userData) {
    var deferred = Q.defer();

    console.log(body);

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

    let createRealmClientRes = await createRealmClient(token, createClientBody, body.realm);

    if (createRealmClientRes.error) {
        deferred.resolve(createRealmClientRes);
    }

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
    // let clientId = clients[0].clientId

    let resourceServerClient = clients.filter(client => client.clientId == 'resource-server');
    console.log(">>>>>", resourceServerClient)

    let scopeBody = [
        {
            displayName: "scopes:create",
            name: "scopes:create"
        },
        {
            displayName: "scopes:read",
            name: "scopes:read"
        },
        {
            displayName: "scopes:update",
            name: "scopes:update"
        },
        {
            displayName: "scopes:delete",
            name: "scopes:delete"
        }

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

    let resourcesBody = [
        {
            attributes: {},
            displayName: "createConsent",
            name: "createConsent",
            ownerManagedAccess: "",
            scopes: scopes.filter(scope => scope.name === 'scopes:create'),
            uris: [
                '/api/fiu/v1/consent'
            ]
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

    let roles = body.roles;

    let createRealmRoleRes = await createRealmRole(token, roles, body.realm);

    console.log(createRealmRoleRes);

    if (createRealmRoleRes.error) {
        deferred.resolve(createRealmRoleRes);
    }

    let getRealmRolesRes = await getRealmRoles(token, body.realm);

    console.log(getRealmRolesRes);

    if (getRealmRolesRes.error) {
        deferred.resolve(getRealmRolesRes);
    }

    let realmRoles = getRealmRolesRes.result;

    let adminRole = realmRoles.filter(role => role.name === 'admin');
    let userRole = realmRoles.filter(role => role.name === 'user');
    let defaultRole = realmRoles.filter(role => role.name === 'default-roles-' + body.realm);

    const addUserToAdminRoleRes = await addUserToAdminRole(token, body.realm, adminRole, userData);

    if (addUserToAdminRoleRes.error) {
        deferred.resolve(addUserToAdminRoleRes);
    }

    const addDefaultRealmRoleRes = await addDefaultRealmRole(token, body.realm, userRole, defaultRole[0].id);

    if (addDefaultRealmRoleRes.error) {
        deferred.resolve(addDefaultRealmRoleRes);
    }

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

    deferred.resolve({
        message: 'success',
        error: false,
        errorMessage: 'success',
        statusCode: 200
    })

    return deferred.promise;
}
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
async function createResources(token, resourceBody, realm, clientId) {
    var deferred = Q.defer();

    console.log(resourceBody);

    let resourceRes = [];

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
async function createRealmRole(token, roles, realm) {
    var deferred = Q.defer();

    console.log(roles);

    for (let i = 0; i < roles.length; i++) {

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

async function createPolicies(token, realm, policiesBody, clientId) {
    var deferred = Q.defer();

    console.log("policies>>>", policiesBody);
    console.log(clientId)

    let policyRes = [];

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

async function createPermissions(token, permissionsBody, realm, clientId) {
    var deferred = Q.defer();

    let permissionRes = [];

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

function generateRandomPassword(maxLength) {
    // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*+=';
    // const splChars = '!@#$%^&*+='
    // let password = '';
    // for (let i = 0; i < length; i++) {
    //     const randomIndex = Math.floor(Math.random() * characters.length);
    //     password += characters.charAt(randomIndex);
    // }
    // return password;

    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const specialChars = '!@#$%^&*+=';
    const numbers = '0123456789';

    let password = '';

    // Generate at least 1 uppercase letter
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));

    // Generate at least 1 special character
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

    // Generate other characters to fill the password
    const remainingLength = maxLength - 2; // Minimum 8, Maximum 14
    // console.log("Remaining length:", remainingLength);
    const allChars = lowercaseChars + numbers + specialChars;
    for (let i = 0; i < remainingLength; i++) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        password += allChars.charAt(randomIndex);
    }

    // Shuffle the password characters
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    return password;
}

async function addUserToKeycloak(token, body, realm, initialPassword) {
    try {
        let newUserBody = {
            'attributes': {},
            'email': body.email,
            'emailVerified': false,
            'enabled': true,
            'firstName': body.firstName,
            'lastName': body.lastName,
            'username': body.username,
            'groups': body.groups
        };

        // Register the user in Keycloak
        const registerResult = await keycloakDao.registerKeycloakUser(token, newUserBody, realm);

        if (registerResult?.error || registerResult?.errorMessage) {
            return {
                message: errorResponses[400].message, //'An error occurred registering user',
                error: errorResponses[400].error,
                errorMessage: registerResult.error || registerResult.errorMessage,
                statusCode: errorResponses[400].statusCode
            };
        }

        // Retrieve the user data from Keycloak to get the user's ID
        const realmUsersResult = await keycloakDao.getAllRealmUsers(token, realm);

        if (realmUsersResult?.error || realmUsersResult?.errorMessage) {
            return {
                message: errorResponses[400].message, //'An error occurred while getting realm user',
                error: errorResponses[400].error,
                errorMessage: realmUsersResult.error || realmUsersResult.errorMessage,
                statusCode: errorResponses[400].statusCode
            };
        }

        // Find the user data for the registered user
        const userData = realmUsersResult.find(user => user.email === body.email);

        if (!userData) {
            const error = new Error("User not found in Keycloak after registration")
            return {
                message: errorResponses[400].message,
                error: errorResponses[400].error,
                errorMessage: error.message,
                statusCode: errorResponses[400].statusCode
            };
        }

        const setPasswordBody = {
            'type': 'password',
            'value': initialPassword,
            'temporary': true
        };
        console.log("password", setPasswordBody)
        console.log("password", userData.id)

        const setPasswordResult = await keycloakDao.setUserPassword(token, setPasswordBody, realm, userData.id);
        console.log("result", setPasswordResult)


        if (setPasswordResult?.error || setPasswordResult?.errorMessage) {
            return {
                message: errorResponses[400].message, //'An error occurred while setting realm user password',
                error: errorResponses[400].error,
                errorMessage: setPasswordResult.error || setPasswordResult.errorMessage,
                statusCode: errorResponses[400].statusCode
            };
        }

        return {
            message: 'success',
            error: false,
            errorMessage: 'Successfully added user to Keycloak and set temporary password',
            statusCode: 200
        };
    } catch (error) {
        console.log(error);
        winston.error('Error in addUserToKeycloak service', error);
        throw error;
    }
}

async function getMailDetails(realm) {
    var deferred = Q.defer();

    try {
        let mailData = await SequelizeDao.getAllData("MAIL_CONFIGURATION", { realm: realm });

        let responseBody = {
            message: 'success',
            error: false,
            statusCode: 200,
            result: {
                data: mailData[0]
            }
        }
        deferred.resolve(responseBody);
    } catch (error) {
        console.log(error);
        winston.error('Error in getMailDetails service', error);
        deferred.reject(error);
    }

    return deferred.promise;
}

exports.registerKeycloakUser = async function (body, token, realm) {
    try {
        const randomPassword = generateRandomPassword(15);
        console.log('randomPassword', randomPassword);

        const result = await addUserToKeycloak(token, body, realm, randomPassword);
        const getWebUrl = await SequelizeDao.getWebUrl('REALM_CONFIG', { realm });
        let webUrl = getWebUrl[0].web_url
        const getMailDetailsResult = await getMailDetails(realm);
        let emailId = getMailDetailsResult.result.data.email_id;
        let password = getMailDetailsResult.result.data.password;
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

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }

        return result;
    } catch (err) {
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

exports.createClientRole = async function (token, realmName, clientId, body) {
    var deferred = Q.defer();

    var createRoleBody = {
        description: body.description,
        name: body.name
    }

    console.log("client", clientId)
    console.log("client", createRoleBody)
    console.log("client", realmName)

    keycloakDao.createClientRoles(token, createRoleBody, realmName, clientId).then(function (res) {
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
        winston.error('Error in createClientRole service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}

exports.getClientRoles = async function (token, realmName, clientId) {
    var deferred = Q.defer();

    keycloakDao.getAllClientRoles(token, realmName, clientId).then(function (res) {
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
        winston.error('Error in getClientRoles service', err);
        deferred.reject(err);
    });

    return deferred.promise;
}
exports.createResources = async (token, resourceBody, realm, clientId) => {
    console.log("res body >>>", resourceBody, realm, clientId)
    let resourceRes = [];
    let response;

    for (let i = 0; i < resourceBody.length; i++) {
        const resourceCreationRes = await keycloakDao.createResource(token, JSON.stringify(resourceBody[i]), realm, clientId)
            .catch((err) => {
                console.log(err);
                winston.error('Error in createResources service', err);
            });
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
            resourceRes.push(resourceCreationRes);
        }

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

exports.deleteKeyCloakUser = async function (token, realm, user_id) {
    try {
        await keycloakDao.deleteKeycloakUser(token, realm, user_id);

        const responseBody = {
            message: 'User deleted successfully',
            error: false,
            statusCode: 200,
        };

        return responseBody;
    } catch (error) {
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

exports.addClientRoleMapping = async function (token, realmName, user_id, body, client_id) {
    var deferred = Q.defer();

    var createRoleBody = body

    console.log("client_id", client_id)
    console.log("client_body", createRoleBody)
    console.log("realm", realmName)
    console.log("user_id", user_id)


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
exports.createGroup = async function (token, realmName, body) {
    var deferred = Q.defer();

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

exports.updateGroup = async function (token, realmName, groupId, body) {
    var deferred = Q.defer();

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


exports.addUserToGroup = async function (token, body, realmName) {
    var deferred = Q.defer();

    console.log("BODY", body);

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

exports.addRolesToGroup = async function (token, roleBody, realmName, groupId) {
    var deferred = Q.defer();

    let getAllRealmClientRes = await getAllRealmClients(token, realmName);
    if (getAllRealmClientRes.error) {
        deferred.resolve(getAllRealmClientRes);
    }

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
    const clientDetails = await SequelizeDao.findOnee('LOGIN_CONFIG', { realm: realmName })
    console.log("clientDetails-->",clientDetails)
    let resourceServerClient = clients.filter(client => client.clientId == clientDetails.kc_clientId);
    console.log("resourceServerClient[0].id>>>>>", resourceServerClient[0].id)
    let responseBody;

    for (let i = 0; i < roleBody.length; i++) {
        keycloakDao.getRoleByName(token, realmName, roleBody[i].name).then(async function (res) {

            const getRoles = await SequelizeDao.getAllData('ROLES', { role_id: roleBody[i].id });

            const addrealmRole = {
                id: res.id,
                name: res.name
            }
            // eslint-disable-next-line no-unused-vars
            const responsse = await keycloakDao.addRealmRoles(token, [addrealmRole], realmName, groupId)

            for (let j = 0; j < getRoles[0].role_policies.length; j++) {

                let policy = getRoles[0].role_policies[j];
                let policyRoleId = policy.role_id;
                let policyRoleName = policy.role_name;

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

exports.deleteGroupRole = async function (token, realmName, groupId, body) {
    var deferred = Q.defer();
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

    for (let i = 0; i < body.length; i++) {

        const getRoles = await SequelizeDao.getAllData('ROLES', { role_name: body[i].name });

        for (let j = 0; j < getRoles[0].role_policies.length; j++) {

            let policy = getRoles[0].role_policies[j];
            let policyRoleId = policy.role_id;
            let policyRoleName = policy.role_name;

            await keycloakDao.deleteRoles(token, [{ id: policyRoleId, name: policyRoleName }], realmName, resourceServerClient[0].id, groupId)
        }
    }
    await SequelizeDao.deleteData('ROLES', { role_id: body[0].id, role_name: body[0].name })

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

exports.getResourceServerPolicy = async function () {
    var deferred = Q.defer();

    try {
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

exports.addResourceServerPolicy = async function (body) {
    var deferred = Q.defer();

    // console.log(body);

    try {
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

exports.createRole = async function (token, body, realmName) {
    var deferred = Q.defer();
    let responseBody;
    const name = body.role_name.trim();
    const trimmedBody = { ...body, role_name: name };
    // eslint-disable-next-line no-unused-vars
    const [role, created] = await SequelizeDao.findOrCreate('ROLES', { role_name: name }, trimmedBody);
    if (!created) {
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

exports.setRolePolicy = async function (token, realmName, payload) {
    var deferred = Q.defer();

    var roleId = payload.roleId;
    var policies = payload.policy;
    let clientId = process.env.RESOURCE_SERVER;

    for (let i = 0; i < policies.length; i++) {
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
                var updatePolicyPayload = res;
                updatePolicyPayload.roles.push({
                    "id": roleId,
                    "required": false
                });
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


exports.roleMapping = async function (token, realmName, payload, userId) {
    var deferred = Q.defer();
    let responseBody;
    var roles = payload.policy;
    let clientId;
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
    const clientDetails = await SequelizeDao.findOnee('LOGIN_CONFIG', { realm: realmName })
    console.log("clientDetails-->",clientDetails)
    let findClient = getClient.find(client => client.clientId === clientDetails.kc_clientId)
    clientId = findClient && findClient.id

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


exports.deleteRole = async function (token, realmName, body) {
    var deferred = Q.defer();
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

    const getRoles = await SequelizeDao.getAllData('ROLES', { role_id: body.id });
    console.log('getRoles', getRoles);
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

    await SequelizeDao.deleteData('ROLES', { role_id: body.id })

    const getRoleByName = await keycloakDao.getRoleByName(token, realmName, body.name)

    let updatedReqBody = [{
        id: getRoleByName.id,
        name: getRoleByName.name
    }]

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


exports.updateRole = async function (token, realmName, body) {
    var deferred = Q.defer();
    console.log('body', body, realmName);
    await SequelizeDao.updateData({ role_description: body.role_description, role_policies: body.role_policies }, 'ROLES', { role_id: body.role_id })
    const getRoleByName = await keycloakDao.getRoleByName(token, realmName, body.role_name)
    console.log('getRoleByName', getRoleByName);
    const updatedBody = {
        id: getRoleByName.id,
        description: body.role_description,
        name: body.role_name
    }
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

exports.postLogin = async function(body,realm){
    var deferred = Q.defer();
    console.log("body-----",body)
    // const loginData = await SequelizeDao.findOnee('LOGIN_CONFIG', { client_id: body.client });
        // console.log("loginData--->", loginData);    
    
    keycloakDao.postLogin(body,realm).then(function (res) {
        console.log(res);
        
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

  exports.jwsToken = function(payload){
    // const header = {   typ : 'JWT', alg: 'HS256' }
    try {
        // const token = jwt.sign(payload, signature, { algorithm: 'HS256' });
        const signature = process.env.signatureSecret;
        console.log("signature :45 ",signature);
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