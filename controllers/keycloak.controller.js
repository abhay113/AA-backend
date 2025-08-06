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

function getAllRealms(req, res) {
    console.log('Inside getAllRealms controller');

    keycloakService.getAllRealms().then(function (result) {
        res.status(result.statusCode).send(result);
    }).catch(function (err) {
        console.log('Error in getAllRealms controller', err);
        winston.error('Error in getAllRealms controller', err);
        res.status(err.statusCode).send(err);
    });
}



function addRealm(req, res) {
    console.log('Inside addRealm controller');
    keycloakService
    var body = req.body;

    console.log(body);

    keycloakService.addRealm(body).then(function (result) {
        res.status(result.statusCode).send(result);
    }).catch(function (err) {
        console.log('Error in addRealm controller', err);
        winston.error('Error in addRealm controller', err);
        res.status(err.statusCode).send(err);
    });
}


function getRealmData(req, res) {
    console.log('Inside getRealmData controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;

        console.log(token);

        keycloakService.getRealmData(token, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getRealmData controller', err);
            winston.error('Error in getRealmData controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
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



function getRealmDbDetails(req, res) {
    console.log('Inside getRealmDbDetails controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmId = req.params.realm;

        console.log(token);
        console.log(realmId);

        keycloakService.getRealmDbDetails(realmId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getRealmDbDetails controller', err);
            winston.error('Error in getRealmDbDetails controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
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


function getRealmClients(req, res) {
    console.log('Inside getRealmClients controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;

        console.log(token);

        keycloakService.getRealmClients(token, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getRealmClients controller', err);
            winston.error('Error in getRealmClients controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
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

function createResourceServer(req, res) {
    console.log('Inside createResourceServer controller');

    var body = req.body;

    keycloakService.createResourceServer(body).then(function (result) {
        res.status(result.statusCode).send(result);
    }).catch(function (err) {
        console.log('Error in createResourceServer controller', err);
        winston.error('Error in createResourceServer controller', err);
        res.status(err.statusCode).send(err);
    });
}

function getAllRealmUsers(req, res) {
    console.log('Inside getAllRealmUsers controller');

    if (req.get('Authorization')) {
        var realmName = req.params.realm;

        var token = req.get('Authorization').split(' ')[1];

        console.log(token);

        keycloakService.getAllRealmUsers(token, realmName).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getAllRealmUsers controller', err);
            winston.error('Error in getAllRealmUsers controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
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


function registerKeycloakUser(req, res) {
    console.log('Inside registerKeycloakUser controller');
    console.log('Request Headers:', req.headers);

    const authorizationHeader = req.get('Authorization');
    console.log("::::::", authorizationHeader)

    if (authorizationHeader) {
        const token = authorizationHeader.split(' ')[1];
        console.log('Token:', token);

        const realm = req.body.realm;
        const body = req.body;

        console.log('REALM', realm);
        console.log('Request Body', body);

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



function createClientRole(req, res) {
    console.log('Inside createClientRole controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;
        var clientId = req.params.clientId;

        var body = req.body;

        console.log(token);

        keycloakService.createClientRole(token, realmName, clientId, body).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in createClientRole controller', err);
            winston.error('Error in createClientRole controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
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
function getClientRoles(req, res) {
    console.log('Inside getClientRoles controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;
        var clientId = req.params.clientId;

        console.log(token);

        keycloakService.getClientRoles(token, realmName, clientId).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getClientRoles controller', err);
            winston.error('Error in getClientRoles controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
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

function createResources(req, res) {
    console.log('Inside getClientRoles controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;
        var clientId = req.params.clientId;
        var resourceBody = req.body


        console.log(token);

        keycloakService.createResources(token, realmName, clientId, resourceBody).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in getClientRoles controller', err);
            winston.error('Error in getClientRoles controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
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

function deleteKeyCloakUser(req, res) {
    console.log('Inside delete Keycloak user');

    var token = req.get('Authorization');

    if (token) {
        token = token.split(' ')[1]; // Extract token from "Bearer <token>"

        var user_id = req.params.user_id;
        var realm = req.params.realm;

        console.log('User ID:', user_id);
        console.log('Realm:', realm);

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


function addClientRoleMapping(req, res) {
    console.log('Inside createClientRole controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;
        var user_id = req.params.user_id;
        var client_id = req.params.client_id;

        var body = req.body;

        console.log(token);

        keycloakService.addClientRoleMapping(token, realmName, user_id, body, client_id).then(function (result) {
            res.status(result.statusCode).send(result);
        }).catch(function (err) {
            console.log('Error in addClientRoleMapping controller', err);
            winston.error('Error in addClientRoleMapping controller', err);
            res.status(err.statusCode).send(err);
        });
    } else {
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

function getUserRoleMappings(req, res) {
    console.log('Inside getUserRoleMappings controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.params.realm;
        var user_id = req.params.user_id;

        console.log(token);

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

function createGroup(req, res) {
    console.log('Inside createGroup controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.body.realm;
        var body = req.body;

        console.log(token);

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

function getAllGroups(req, res) {
    console.log('Inside getAllGroups controller');

    if (req.get('Authorization')) {
        var realmName = req.query.realm;

        var token = req.get('Authorization').split(' ')[1];

        console.log(token);

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

function getGroupDataById(req, res) {
    console.log('Inside getGroupDataById controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        var groupId = req.params.groupId;

        console.log(token);

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

function updateGroup(req, res) {
    console.log('Inside updateGroup controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.body.realm;
        var groupId = req.body.groupId;
        var body = req.body;

        console.log(token);

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

function addUserToGroup(req, res) {
    console.log('Inside addUserToGroup controller');

    if (req.get('Authorization')) {
        var realmName = req.body.realm;
        var body = req.body;
        var token = req.get('Authorization').split(' ')[1];

        console.log(token);

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
function createChildGroup(req, res) {
    console.log('Inside createChildGroup controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.body.realm;
        var body = req.body;
        var groupId = req.body.groupId;


        console.log(token);

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
function getGroupMembers(req, res) {
    console.log('Inside getGroupMembers controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        var groupId = req.query.groupId;

        console.log(token);

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

function deleteGroup(req, res) {
    console.log('Inside deleteGroup controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        var groupId = req.params.groupId;

        console.log(token);

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

function addRolesToGroup(req, res) {
    console.log('Inside addRolesToGroup controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];



        var roleBody = req.body.roles;
        var realmName = req.body.realm;
        var groupId = req.body.groupId

        console.log(token);

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

function getRoleMappings(req, res) {
    console.log('Inside getRoleMappingByClientId controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;

        console.log(token);

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

function deleteGroupRole(req, res) {
    console.log('Inside deleteGroupRole controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        var groupId = req.query.groupId;

        var body = req.body;

        console.log(token);

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
function getGroupRole(req, res) {
    console.log('Inside getGroupRole controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        var groupId = req.params.groupId;

        console.log(token);

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

function removeUserFromGroup(req, res) {
    console.log('Inside removeUserFromGroup controller');

    if (req.get('Authorization')) {
        var realmName = req.query.realm;
        var body = req.body;
        var token = req.get('Authorization').split(' ')[1];

        console.log(token);

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

function getResourceServerPolicy(req, res) {
    console.log('Inside getResourceServerPolicy controller');

    if (req.get('Authorization')) {
        // var token = req.get('Authorization').split(' ')[1];

        // console.log(token);

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

function addResourceServerPolicy(req, res) {
    console.log('Inside addResourceServerPolicy controller');

    if (req.get('Authorization')) {
        // var realmName = req.query.realm;
        var body = req.body;
        // var token = req.get('Authorization').split(' ')[1];

        // console.log(token);

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

function createRole(req, res) {
    console.log('Inside createRole controller');

    if (req.get('Authorization')) {
        var realmName = req.query.realm;
        var body = req.body;
        var token = req.get('Authorization').split(' ')[1];
        body.role_id = uuid.v4();
        body.realm = realmName;
        // console.log(token);

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

function getRoleByName(req, res) {
    console.log('Inside getRoleByName controller');

    if (req.get('Authorization')) {
        var realmName = req.query.realm;
        var roleName = req.query.roleName;
        var token = req.get('Authorization').split(' ')[1];

        // console.log(token);

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

function setRolePolicy(req, res) {
    console.log('Inside setRolePolicy controller');

    if (req.get('Authorization')) {
        var body = req.body;
        var realmName = req.query.realm;
        var token = req.get('Authorization').split(' ')[1];
        // console.log(token);

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

function getGroups(req, res) {
    console.log("In Get groups controller");
    if (req.get('Authorization')) {
        var realmName = req.params.realm;
        var token = req.get('Authorization').split(' ')[1];
        // console.log(token);

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

function getUser(req, res) {
    console.log("In Get user controller");
    if (req.get('Authorization')) {
        var realmName = req.params.realm;
        var token = req.get('Authorization').split(' ')[1];
        // console.log(token);

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


function updateUser(req, res) {
    console.log("In update user controller");
    if (req.get('Authorization')) {
        var body = req.body;
        var realmName = req.params.realm;
        var token = req.get('Authorization').split(' ')[1];
        // console.log(token);

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


function roleMapping(req, res) {
    console.log('Inside roleMapping controller');

    if (req.get('Authorization')) {
        let token = req.get('Authorization').split(' ')[1];
        const realm = getRealm(token);
        var body = req.body;
        var userId = req.params.user_id;
        // var token = req.get('Authorization').split(' ')[1];

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


function getRoles(req, res) {
    console.log('Inside getRoles controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];
        const realm = getRealm(token);
       
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


function deleteRole(req, res) {
    console.log('Inside deleteRole controller');

    if (req.get('Authorization')) {
        var token = req.get('Authorization').split(' ')[1];

        var realmName = req.query.realm;
        // var groupId = req.query.groupId;

        var body = req.body;

        console.log(token);

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


function updateRole(req, res) {
    console.log("In update role controller");
    if (req.get('Authorization')) {
        var body = req.body;
        var realmName = req.query.realm;
        var token = req.get('Authorization').split(' ')[1];
        // console.log(token);

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

function userLogin(req, res) {
    console.log("req",req.baseUrl)
    const parts = req.baseUrl.split("/");
    const realmName = parts[parts.length - 1]; // Extract the last part
    console.log("baseurl---->",realmName)
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
