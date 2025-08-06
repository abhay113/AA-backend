const express = require('express');
const { FIUController } = require('../controllers/index');
const { ConsentNotificationSchema } = require("../validator/validations");

const middleware = require("../middlewares/schemaValidation");


const FIURoute = express.Router();


FIURoute.post('/consent/notifcation', middleware(ConsentNotificationSchema), FIUController.postConsentNotification)
FIURoute.post('/consent/information', FIUController.postConsentInformation)
FIURoute.post('/fi/notification', FIUController.postFINotification)
FIURoute.post('/fi/data/:sessionId', FIUController.postFIdata)

module.exports = FIURoute

