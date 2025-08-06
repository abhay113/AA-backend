const express = require('express');
const apiRoutes = express.Router({});

const FIURoute = require('./FIU.route');
const keycloakRoute = require('./keycloak.route');

console.log("index.js2 file 7");
apiRoutes.use('/vdcap-uat-fiu', FIURoute); //UAT
apiRoutes.use('/growxcd-uat-fiu', FIURoute); //UAT
apiRoutes.use('/vdcap', FIURoute);  //PROD
apiRoutes.use('/growxcd', FIURoute); //PROD

apiRoutes.use('/vdcap-uat-fiu', keycloakRoute); //UAT
apiRoutes.use('/growxcd-uat-fiu', keycloakRoute); //UAT
apiRoutes.use('/vdcap', keycloakRoute);  //PROD
apiRoutes.use('/growxcd', keycloakRoute); //PROD

module.exports = apiRoutes