/**
 * @author Girijashankar Mishra
 * @version 1.1.0
 * @since 17-Aug-2018
 */
//  var appRoot = require('app-root-path');
 var winston = require('winston');
 require('winston-daily-rotate-file');
 require('dotenv').config();
 // define the custom settings for each transport (file, console)
 var options = {
     file: {
         level: 'info',
         name: 'file.info',
         filename: `./../Logs/app.log`,
         handleExceptions: true,
         // eslint-disable-next-line no-undef
         maxsize: process.env.LOG_MAX_SIZE, // 5MB
         zippedArchive: true,
         // eslint-disable-next-line no-undef
         maxFiles: process.env.LOG_MAX_FILE,
         format: winston.format.combine(
             winston.format.colorize({
                 message: true
             }),
             winston.format.simple()
         ),
         timestamp: function () {
             var date = new Date();
             return date.getDate() + '/' + (date.getMonth() + 1) + ' ' + date.toTimeString().substr(0, 5) + ' [' + global.process.pid + ']';
         },
         prettyPrint: true,
     },
     errorFile: {
         level: 'error',
         name: 'file.error',
         filename: `./../Logs/error.log`,
         handleExceptions: true,
         // eslint-disable-next-line no-undef
         maxsize: process.env.LOG_MAX_SIZE, // 5MB
         zippedArchive: true,
         // eslint-disable-next-line no-undef
         maxFiles: process.env.LOG_MAX_FILE,
         format: winston.format.combine(
             winston.format.colorize({
                 message: true
             }),
             winston.format.simple()
         ),
         timestamp: function () {
             var date = new Date();
             return date.getDate() + '/' + (date.getMonth() + 1) + ' ' + date.toTimeString().substr(0, 5) + ' [' + global.process.pid + ']';
         },
         prettyPrint: true,
     },
     console: {
         level: 'debug',
         handleExceptions: true,
         format: winston.format.combine(
             winston.format.colorize({
                 message: true
             }),
             winston.format.simple()
         ),
         timestamp: function () {
             var date = new Date();
             return date.getDate() + '/' + (date.getMonth() + 1) + ' ' + date.toTimeString().substr(0, 5) + ' [' + global.process.pid + ']';
         },
         prettyPrint: true,
     },
 };
 
 
 // instantiate a new Winston Logger with the settings defined above
 var logger = winston.createLogger({
     transports: [
         new(winston.transports.DailyRotateFile)(options.file),
         new(winston.transports.DailyRotateFile)(options.errorFile),
         new winston.transports.Console(options.console)
     ],
     exitOnError: false, // do not exit on handled exceptions
 });
 
 // create a stream object with a 'write' function that will be used by `morgan`
 logger.stream = {
     write: function (message) {
         // use the 'info' log level so the output will be picked up by both transports (file and console)
         logger.info(message);
     },
 };
 
 module.exports = logger;