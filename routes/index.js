/**
 * Main API Routes Configuration
 * 
 * This module configures and exports all API routes for the FIU middleware application.
 * It acts as the central routing hub, organizing different route modules by functionality.
 * 
 * Route Structure:
 * - /api/fiu/v1/* - Main FIU API endpoints (client and notification routes)
 * - /aa/tsp/* - Scheduler and task management endpoints
 * 
 * Route Modules:
 * - ClientRoute: Handles client-related operations
 * - NotificationRoute: Manages notification services
 * - SchedulerRoute: Handles scheduled tasks and job management
 * 
 * Note: Some routes are currently commented out (FIU.route, keycloak.route)
 * and may be enabled in future versions.
 * 
 * @author FIU Development Team
 * @version 1.0.0
 */

const express = require('express');
const apiRoutes = express.Router({});

// Route module imports
// const FIURoute = require('./FIU.route'); // Currently disabled - main FIU operations
const ClientRoute = require('./client.routes'); // Client management operations
const NotificationRoute = require('./notification.routes'); // Notification services
// const keycloakRoute = require('./keycloak.route'); // Currently disabled - Keycloak authentication
const schedulerRoute = require('./scheduler.route'); // Task scheduling and job management

// Debug log - TODO: Remove in production
console.log("index.js1 file 7");

// Mount routes with their respective base paths
apiRoutes.use('/api/fiu/v1', ClientRoute); // Client API endpoints
apiRoutes.use('/api/fiu/v1', NotificationRoute); // Notification API endpoints
// apiRoutes.use('/api/fiu/v1', keycloakRoute); // Keycloak endpoints (disabled)
apiRoutes.use('/aa/tsp', schedulerRoute); // Task scheduling endpoints

module.exports = apiRoutes