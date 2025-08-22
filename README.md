# FIU Middleware

A Node.js/Express.js middleware application for Financial Information User (FIU) operations, providing secure financial data processing, authentication, and job queue management.

## Overview

This middleware serves as the central processing hub for financial information requests, handling authentication via Keycloak, managing background job processing with BullMQ, and providing RESTful APIs for financial data operations.

## Features

- **🔐 Authentication**: Keycloak integration with JWT token validation
- **📊 Queue Management**: BullMQ-based job processing with Redis backend
- **🚀 RESTful APIs**: Comprehensive API endpoints for financial operations
- **📈 Monitoring**: Bull Board dashboard for queue monitoring
- **🔄 Background Processing**: Asynchronous task processing
- **🗄️ Database Support**: PostgreSQL integration with Sequelize ORM
- **⚡ Performance**: Response time monitoring and optimization

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│  FIU Middleware │───▶│   External APIs │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Background     │
                    │  Job Queues     │
                    │  (BullMQ/Redis) │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    └─────────────────┘
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache/Queue**: Redis with BullMQ
- **Authentication**: Keycloak (JWT)
- **Monitoring**: Bull Board
- **Linting**: ESLint

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Redis server
- Keycloak server (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://gitlab.gitlabsh.cateina.com/aa_tsp/fiu_middleware.git
   cd fiu_middleware
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database Configuration
   POSTGRES_USER=your_db_user
   POSTGRES_PASSWORD=your_db_password
   POSTGRES_DATABASE=fiu_database
   POSTGRES_HOST_NAME=localhost
   POSTGRES_PORT=5432

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Application Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   # Development
   npm start

   # With Redis server
   npm run redis

   # Run tests
   npm test

   # Linting
   npm run lint
   ```

## API Endpoints

### Base URLs
- **Client Operations**: `/api/fiu/v1/*`
- **Notifications**: `/api/fiu/v1/*`
- **Task Scheduling**: `/aa/tsp/*`
- **Queue Monitoring**: `/admin/queues` (Bull Board Dashboard)

### Health Check
- **GET** `/` - Returns application status

## Project Structure

```
fiu_middleware/
├── controllers/          # Request handlers and business logic controllers
│   ├── FIU.controller.js
│   └── keycloak.controller.js
├── services/            # Business logic and external service integrations
│   ├── FIU.service.js
│   └── keycloak.service.js
├── routes/              # API route definitions
│   ├── index.js         # Main route configuration
│   ├── client.routes.js
│   ├── notification.routes.js
│   └── scheduler.route.js
├── middlewares/         # Custom Express middlewares
├── dao/                 # Data Access Objects
├── utils/               # Utility functions and helpers
├── validator/           # Input validation logic
├── scheduler_queue/     # Background job queue consumers
├── fiRequest_queue/     # Financial request queue management
├── test_cases/          # API test cases
├── unit_tests_UI/       # Frontend unit tests
├── unit_tests_server/   # Backend unit tests
├── uploads/             # File upload storage
├── config.js            # Database and Redis configuration
├── index.js             # Application entry point
└── FIU.model.js         # Database models
```

## Queue Management

The application uses BullMQ for background job processing:

- **Scheduler Queue**: Handles scheduled financial data processing tasks
- **FI Request Queue**: Manages financial information requests
- **Monitoring**: Access the Bull Board dashboard at `/admin/queues`

## Authentication

Authentication is handled via Keycloak with JWT tokens:
- Tokens are validated on protected routes
- Realm information is extracted for multi-tenant support
- Support for both standard and iframe-based authentication

## Development

### Code Style
- ESLint configuration included
- Run `npm run lint` to check code style
- Follow JSDoc commenting standards for functions

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
```

### Docker Support
```bash
# Build and run with Docker
docker-compose up --build
```

## Monitoring and Debugging

- **Queue Dashboard**: `/admin/queues` - Monitor job queues and processing status
- **Response Time**: Automatic response time headers added to all requests
- **Logging**: Console logging for debugging (TODO: Implement structured logging)

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `POSTGRES_USER` | Database username | Yes | - |
| `POSTGRES_PASSWORD` | Database password | Yes | - |
| `POSTGRES_DATABASE` | Database name | Yes | - |
| `POSTGRES_HOST_NAME` | Database hostname | Yes | - |
| `POSTGRES_PORT` | Database port | Yes | - |
| `REDIS_HOST` | Redis hostname | Yes | - |
| `REDIS_PORT` | Redis port | Yes | - |
| `PORT` | Application port | No | 3000 |
| `NODE_ENV` | Environment | No | development |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Merge Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please contact the FIU Development Team.
