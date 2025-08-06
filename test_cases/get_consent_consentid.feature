Feature: This API uses a consent_id in the path,invokes FIU module /consent/{id} API which returns us with the information for the provided consent_id and saves the response in database.

Scenario: 1. On calling the get consent {consent_id} API, with valid consent request details   
    Given Calling the GET/consent/{consent_id} API.
    And  user enters valid consent_id
    Then Verify the status code is 200
    And verify the consent details for that specfic consent_id are received.


Scenario: 2. On calling the get consent {consent_id} API, with invalid consent request details   
    Given Calling the GET/consent/{consent_id} API.
    And  user enters invalid consent_id
    Then Verify the status code is 400/404
    And verify the response body should be invalid consent_id/ consent_id not found.

