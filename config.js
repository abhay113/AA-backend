const IORedis = require('ioredis');

const redisOptions = {
    // eslint-disable-next-line no-undef
    host: process.env.REDIS_HOST, 
    // eslint-disable-next-line no-undef
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null,
};

const connection = new IORedis(redisOptions);

module.exports = {
    development: {
         // eslint-disable-next-line no-undef
        username: process.env.POSTGRES_USER,
         // eslint-disable-next-line no-undef
        password: process.env.POSTGRES_PASSWORD,
         // eslint-disable-next-line no-undef
        database: process.env.POSTGRES_DATABASE,
         // eslint-disable-next-line no-undef
        host: process.env.POSTGRES_HOST_NAME,
         // eslint-disable-next-line no-undef
        port: process.env.POSTGRES_PORT,
        dialect: 'postgres',
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