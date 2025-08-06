const express = require('express');
const { FIUController } = require('../controllers/index');
const schedulerRoute = express.Router();

schedulerRoute.post('/scheduler/notification',FIUController.schedulerNotification)
schedulerRoute.post('/fidata/scheduler/notification',FIUController.fiDataSchedulerNotification)


module.exports = schedulerRoute;  