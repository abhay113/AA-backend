const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

// Set the AWS credentials and region
const awsConfig = {
  // eslint-disable-next-line no-undef
  accessKeyId: process.env.AWS_ACCESS_KEY,
  // eslint-disable-next-line no-undef
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // eslint-disable-next-line no-undef
  region: process.env.AWS_REGION // Replace with your desired AWS region
};

// Create a Winston CloudWatch transport
const cloudWatchTransport = new WinstonCloudWatch({
  logGroupName: '/ecs/middleware-dev',
  logStreamName: 'fiu_middleware_logs',
  awsConfig: awsConfig
});

// Configure Winston with the CloudWatch Logs transport
const logger = winston.createLogger({
  transports: [cloudWatchTransport]
});

module.exports = logger;