var Q = require('q');
var request = require('request');

require('dotenv').config();

// const { createClient } = require('@supabase/supabase-js');
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// eslint-disable-next-line no-undef
const keycloakURL = process.env.KEYCLOAK_URL;

// const winston = require('./../winston/winston');


exports.logoutUser = function (bearerToken, realmId, userId) {
    var deferred = Q.defer();
    
    // var formData = querystring.stringify(body);

    console.log(realmId, userId)

    request({
        headers: {
            'Authorization': 'Bearer ' + bearerToken,
            'Content-Type': 'application/json'
        },
        uri: `${keycloakURL}/admin/realms/${realmId}/users/${userId}/logout`,
        json: true,
        body: {},
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