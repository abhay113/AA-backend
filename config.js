/**
 * Application Configuration Module
 * 
 * This module handles all configuration settings for the FIU middleware application.
 * It manages database connections, Redis configuration, and environment-specific settings.
 * 
 * Configurations included:
 * - Redis connection settings for BullMQ and caching
 * - PostgreSQL database configuration for different environments
 * - Environment variable management
 * - Connection pooling and retry logic
 * 
 * Environment Variables Required:
 * - REDIS_HOST: Redis server hostname
 * - REDIS_PORT: Redis server port
 * - POSTGRES_USER: Database username
 * - POSTGRES_PASSWORD: Database password
 * - POSTGRES_DATABASE: Database name
 * - POSTGRES_HOST_NAME: Database hostname
 * - POSTGRES_PORT: Database port
 * 
 * @author FIU Development Team
 * @version 1.0.0
 */

const IORedis = require('ioredis');

// Redis connection configuration for BullMQ and caching
const redisOptions = {
    // Redis server hostname from environment variable
    // eslint-disable-next-line no-undef
    host: process.env.REDIS_HOST, 
    // Redis server port from environment variable
    // eslint-disable-next-line no-undef
    port: process.env.REDIS_PORT,
    // Disable request retry limit for better reliability with BullMQ
    maxRetriesPerRequest: null,
};

// Create Redis connection instance
const connection = new IORedis(redisOptions);

// Database configuration for different environments
module.exports = {
    // Development environment database settings
    development: {
         // PostgreSQL username from environment variable
         // eslint-disable-next-line no-undef
        username: process.env.POSTGRES_USER,
         // PostgreSQL password from environment variable
         // eslint-disable-next-line no-undef
        password: process.env.POSTGRES_PASSWORD,
         // PostgreSQL database name from environment variable
         // eslint-disable-next-line no-undef
        database: process.env.POSTGRES_DATABASE,
         // PostgreSQL hostname from environment variable
         // eslint-disable-next-line no-undef
        host: process.env.POSTGRES_HOST_NAME,
         // PostgreSQL port from environment variable
         // eslint-disable-next-line no-undef
        port: process.env.POSTGRES_PORT,
        // Database dialect specification
        dialect: 'postgres',
        // Connection pool settings (currently commented out)
        // pool: {
        //     max: 15, // Maximum number of connections in the pool
        //     min: 10, // Minimum number of connections in the pool
        //     acquire: 1000000, // Maximum time (in milliseconds) to acquire a connection
        //     idle: 5000, // Maximum time (in milliseconds) that a connection can be idle before being released
        // },
        retry: {
            max: 3, // Maximum number of retries
            match: [
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/,
            ], // Specify the error types to retry
        },
        schema: 'fiu_middleware'
    },
    auth_server: {
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
        host: process.env.POSTGRES_HOST_NAME,
        port: process.env.POSTGRES_PORT,
        dialect: 'postgres',
        // pool: {
        //     max: 20, // Maximum number of connections in the pool
        //     min: 2, // Minimum number of connections in the pool
        //     acquire: 1000000, // Maximum time (in milliseconds) to acquire a connection
        //     idle: 1000000, // Maximum time (in milliseconds) that a connection can be idle before being released
        // },
        retry: {
            max: 3, // Maximum number of retries
            match: [
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/,
            ], // Specify the error types to retry
        },
        schema: 'fiu_auth'
    },
    production: {
        // production configuration
    },
    connection
};

// username: 'psql',
//         password: 'psql1234',
//         database: 'postgres',
//         host: 'https://65.0.130.187',
//         port:'5432',
//         dialect: 'postgres'