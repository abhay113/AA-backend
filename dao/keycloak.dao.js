var Q = require('q');
require('dotenv').config();
var querystring = require('querystring');
var request = require('request');

// const { createClient } = require('@supabase/supabase-js');
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// eslint-disable-next-line no-undef
const keycloakURL = process.env.KEYCLOAK_URL


exports.addRealmToDB = function (data) {
  var deferred = Q.defer();

  // eslint-disable-next-line no-undef
  supabase
    .from('realms')
    .insert(data)
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
      winston.error('Error in addRealmToDB dao', err);
      deferred.reject(err);
    })

  return deferred.promise;
}

exports.addRealm = function (bearerToken, body) {
  var deferred = Q.defer();

  console.log('------------------------------', body);
  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createClientForRealm = function (bearerToken, body, realm) {
  var deferred = Q.defer();

  console.log('------------------------------', body);
  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.registerKeycloakUser = function (bearerToken, body, realm) {
  var deferred = Q.defer();

  console.log('Bearer token:', bearerToken);
  console.log('KEYCLOAK REQ body:', body);
  console.log(`uri: ${keycloakURL}/admin/realms/${realm}/users`);
  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/users`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        console.log(`error registering user: ${err}`);
        deferred.reject(err);
      } else {
        console.log(`Registering user response: ${JSON.stringify(body)}`);
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};


exports.getRealmUsers = function (bearerToken, realm) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/users`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.setUserPassword = function (bearerToken, body, realm, userID) {
  var deferred = Q.defer();

  console.log('Setting password for user with ID:', userID);

  var requestUrl = `${keycloakURL}/admin/realms/${realm}/users/${userID}/reset-password`;

  console.log('Request URL:', requestUrl);
  console.log('Request Body:', body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: requestUrl,
    body: body,
    json: true,
    method: 'PUT'
  },
    function (err, res, body) {
      if (err) {
        console.log('Error:', err);
        deferred.reject(err);
      } else {
        console.log('Response Body:', body);
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};


exports.getClientRoleByName = function (bearerToken, realm, clientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/roles/realm-admin`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createRealmAdmin = function (bearerToken, body, realm, userId, clientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createClientRoles = function (bearerToken, body, realm, clientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/roles`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createGroups = function (bearerToken, body, realm) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.getAllGroups = function (bearerToken, realm) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.getAllClientRoles = function (bearerToken, realm, angularClientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${angularClientId}/roles`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.mapRolesToGroups = function (bearerToken, body, realm, groupId, angularClientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}/role-mappings/clients/${angularClientId}`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.updateUserDetailsToRealmTable = function (realm, body) {
  var deferred = Q.defer();

  // eslint-disable-next-line no-undef
  supabase
    .from('realms')
    .update(body)
    .match({
      realm_id: realm
    })
    .then(function (response) {
      console.log(response, '----------------');
      if (response.error == null) {
        deferred.resolve(response);
      } else {
        deferred.resolve(response);
      }
    })
    .catch(function (err) {
      console.log(err);
      // eslint-disable-next-line no-undef
      winston.error('Error in updateUserDetailsToRealmTable dao', err);
      deferred.reject(err);
    })

  return deferred.promise;
}

exports.createIdentityProvider = function (bearerToken, realm, body) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/identity-provider/instances`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createAuthorizationScope = function (bearerToken, body, realm, clientId) {
  var deferred = Q.defer();
  console.log("bodyyy", body)
  console.log(realm)
  console.log(clientId)
  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/scope`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.getAllRealmClients = function (bearerToken, realm) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createResources = function (bearerToken, body, realm, clientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/resource`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createRealmRole = function (bearerToken, body, realm) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/roles`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};
exports.getRealmRoles = function (bearerToken, realm) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/roles`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.addDefaultRealmRole = function (bearerToken, realm, body, defaultRoleId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/roles-by-id/${defaultRoleId}/composites`,
    json: true,
    body: body,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createPolicy = function (bearerToken, body, realm, clientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/policy/role`,
    json: true,
    body: body,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createPermission = function (bearerToken, body, realm, clientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/permission/resource`,
    json: true,
    body: body,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.addUserToRealmRole = function (bearerToken, body, realm, userId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/users/${userId}/role-mappings/realm`,
    json: true,
    body: body,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};
exports.createPolicy = function (bearerToken, body, realm, clientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/policy/role`,
    json: true,
    body: body,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createPermission = function (bearerToken, body, realm, clientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/permission/resource`,
    json: true,
    body: body,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.getAllRealmUsers = function (bearerToken, realm) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/users`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};
exports.getAllRealms = function (bearerToken) {
  var deferred = Q.defer();

  console.log('------------------------------', bearerToken)

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken
    },
    uri: `${keycloakURL}/admin/realms`,
    method: 'GET',
    json: true
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });


  return deferred.promise;
};
exports.createResource = function (bearerToken, body, realm, clientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/resource`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};


exports.deleteKeycloakUser = function (bearerToken, realm, user_id) {
  return new Promise((resolve, reject) => {

    request(
      {
        headers: {
          'Authorization': 'Bearer ' + bearerToken,
          'Content-Type': 'application/json'
        },
        uri: `${keycloakURL}/admin/realms/${realm}/users/${user_id}`,
        method: 'DELETE'
      },
      (err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log("Response:", res.statusCode);
          if (res.statusCode === 204) {
            resolve();
          } else {
            reject(new Error(`Failed to delete user with status: ${res.statusCode}`));
          }
        }
      }
    );
  });
};


exports.addClientRoleMapping = function (bearerToken, body, realm, client_id, user_id) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/users/${user_id}/role-mappings/clients/${client_id}`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.getUserRoleMappings = function (bearerToken, realm, user_id) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/users/${user_id}/role-mappings`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};
exports.createGroup = function (bearerToken, realm, body) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.getGroupDataById = function (bearerToken, realm, groupId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.updateGroup = function (bearerToken, realm, groupId, body) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}`,
    body: body,
    json: true,
    method: 'PUT'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.assignGroupToUser = function (bearerToken, realm, userId, groupId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/users/${userId}/groups/${groupId}`,
    json: true,
    method: 'PUT'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.createChildGroup = function (bearerToken, realm, body, groupId) {
  var deferred = Q.defer();
  console.log(groupId)

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}/children`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.getGroupMembers = function (bearerToken, realm, groupId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}/members`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.deleteGroup = function (bearerToken, realm, groupId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}`,
    json: true,
    method: 'DELETE'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.addRolesToGroup = function (bearerToken, body, realm, groupId, clientId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}/role-mappings/clients/${clientId}`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.getRoleMappings = function (bearerToken, realm) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/roles`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.deleteGroupRole = function (bearerToken, body, realm, groupId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}/role-mappings/realm`,
    body: body,
    json: true,
    method: 'DELETE'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
}

exports.getGroupRole = function (bearerToken, realm, groupId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}/role-mappings/realm`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
}

exports.removeUserFromGroup = function (bearerToken, realm, userId, groupId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/users/${userId}/groups/${groupId}`,
    json: true,
    method: 'DELETE'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.addRealmRole = function (bearerToken, realm, body) {
  var deferred = Q.defer();

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/roles`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
}

exports.getRoleByName = function (bearerToken, realm, role) {
  var deferred = Q.defer();

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/roles/${role}`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
}

exports.getPolicyDetails = function (bearerToken, realm, clientId, policy) {
  var deferred = Q.defer();

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/policy/role/${policy}`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
}

exports.updatePolicyDetails = function (bearerToken, realm, clientId, policy, body) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    // /admin/realms/sandbox/clients/ec9ca5be-9214-4cfb-bce9-33f2b04af1af/authz/resource-server/policy/role/4765798e-7b46-4045-9b55-7e2676d5860b
    uri: `${keycloakURL}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/policy/role/${policy}`,
    body: body,
    json: true,
    method: 'PUT'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.getGroups = function (bearerToken, realm) {
  var deferred = Q.defer();

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/realms/${realm}/account/groups`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
}

exports.getUser = function (bearerToken, realm) {
  var deferred = Q.defer();

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/realms/${realm}/account/`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
}

exports.updateUser = function (bearerToken, realm, body) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/realms/${realm}/account/`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};


exports.getClients = function (bearerToken, realm) {
  var deferred = Q.defer();

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/clients`,
    json: true,
    method: 'GET'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
}


exports.roleMapping = function (bearerToken, realm, userId, clientId, body) {
  var deferred = Q.defer();

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${clientId}`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        console.log('err',err);
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};


exports.addRealmRoles = function (bearerToken, body, realm, groupId) {
  var deferred = Q.defer();

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}/role-mappings/realm`,
    body: body,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};


exports.deleteRoles = function (bearerToken, body, realm, clientId, groupId) {
  var deferred = Q.defer();

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/groups/${groupId}/role-mappings/clients/${clientId}`,
    body: body,
    json: true,
    method: 'DELETE'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
}


exports.deleteRoleByid = function (bearerToken, body, realm, roleId) {
  var deferred = Q.defer();

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/roles-by-id/${roleId}`,
    body: body,
    json: true,
    method: 'DELETE'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
}


exports.updateRole = function (bearerToken, realm, body, roleId) {
  var deferred = Q.defer();

  // var formData = querystring.stringify(body);

  request({
    headers: {
      'Authorization': 'Bearer ' + bearerToken,
      'Content-Type': 'application/json'
    },
    uri: `${keycloakURL}/admin/realms/${realm}/roles-by-id/${roleId}`,
    body: body,
    json: true,
    method: 'PUT'
  },
    function (err, res, body) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};

exports.postLogin = function (body,realm) {
  var deferred = Q.defer();
  const payload = {
    "client_id": body.client_Id,
    "client_secret": body.client_secret,
    "grant_type": "client_credentials",   //password
    // "username": body.username,
    // "password": body.password
  }
  console.log("keycloakbody",payload)
  const realmName = realm;
  console.log("realm",realmName)
  // eslint-disable-next-line no-undef
  const formBody = querystring.stringify(payload);
  request({
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    uri: `${keycloakURL}/realms/${realmName}/protocol/openid-connect/token`,
    body: formBody,
    json: true,
    method: 'POST'
  },
    function (err, res, body) {
      if (err) {
        console.log("err----->",err)
        deferred.reject(err);
      } else {
        console.log("body--->",body)
        deferred.resolve(body);
      }
    });

  return deferred.promise;
};