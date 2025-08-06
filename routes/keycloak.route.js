const express = require('express');
const keycloakController = require('../controllers/keycloak.controller');

const keycloakRoute = express.Router();


keycloakRoute.post('/addRealm', keycloakController.addRealm);
keycloakRoute.get('/realms', keycloakController.getAllRealms);
keycloakRoute.get('/realmUsers/:realm', keycloakController.getAllRealmUsers);
keycloakRoute.post('/registerKeycloakUser', keycloakController.registerKeycloakUser);
keycloakRoute.post('/createClientRole/:realm/:clientId', keycloakController.createClientRole);
keycloakRoute.get('/realmClients/:realm', keycloakController.getRealmClients);
keycloakRoute.get('/clientRoles/:realm/:clientId', keycloakController.getClientRoles);
keycloakRoute.post('/createResources/:realm/:clientId', keycloakController.createResources);
keycloakRoute.delete('/deleteKeycloakUser/:realm/:user_id', keycloakController.deleteKeyCloakUser);
keycloakRoute.post('/addClientRoleMapping/:realm/:user_id/:client_id', keycloakController.addClientRoleMapping);
keycloakRoute.get('/getUserRoleMappings/:realm/:user_id', keycloakController.getUserRoleMappings);
keycloakRoute.post('/groups', keycloakController.createGroup);
keycloakRoute.put('/groups', keycloakController.updateGroup);
keycloakRoute.get('/groups', keycloakController.getAllGroups);
keycloakRoute.get('/groups/:groupId', keycloakController.getGroupDataById);
keycloakRoute.post('/group/users', keycloakController.addUserToGroup);
keycloakRoute.post('/group/child', keycloakController.createChildGroup);
keycloakRoute.get('/group/users', keycloakController.getGroupMembers);
keycloakRoute.delete('/groups/:groupId', keycloakController.deleteGroup);
keycloakRoute.post('/group/roles', keycloakController.addRolesToGroup);
keycloakRoute.get('/realm/roles', keycloakController.getRoleMappings);
keycloakRoute.delete('/group/roles', keycloakController.deleteGroupRole);
keycloakRoute.get('/group/roles/:groupId', keycloakController.getGroupRole);
keycloakRoute.delete('/group/users', keycloakController.removeUserFromGroup);
keycloakRoute.get('/policy', keycloakController.getResourceServerPolicy);
keycloakRoute.post('/policy', keycloakController.addResourceServerPolicy);
keycloakRoute.get('/role/name', keycloakController.getRoleByName);
keycloakRoute.post('/role', keycloakController.createRole);
keycloakRoute.post('/role/policy', keycloakController.setRolePolicy);
keycloakRoute.post('/roleMapping/:user_id', keycloakController.roleMapping);
keycloakRoute.get('/roleMapping', keycloakController.getRoles);
keycloakRoute.delete('/role', keycloakController.deleteRole);
keycloakRoute.put('/role', keycloakController.updateRole);

//For non-admin
keycloakRoute.get('/realm/:realm/account/groups', keycloakController.getGroups)
keycloakRoute.get('/realms/:realm/account/', keycloakController.getUser)
keycloakRoute.post('/realms/:realm/account/', keycloakController.updateUser)


/* user login api */
keycloakRoute.post('/login',keycloakController.userLogin);

module.exports = keycloakRoute;  
