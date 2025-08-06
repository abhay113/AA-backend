const express = require('express');
const apiRoutes = express.Router({});

// const FIURoute = require('./FIU.route');
const ClientRoute = require('./client.routes');
const NotificationRoute = require('./notification.routes');
// const keycloakRoute = require('./keycloak.route');
const schedulerRoute = require('./scheduler.route');
console.log("index.js1 file 7");
apiRoutes.use('/api/fiu/v1', ClientRoute);
apiRoutes.use('/api/fiu/v1', NotificationRoute);
// apiRoutes.use('/api/fiu/v1', keycloakRoute);
apiRoutes.use('/aa/tsp', schedulerRoute);

module.exports = apiRoutes