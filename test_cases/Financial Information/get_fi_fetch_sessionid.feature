Feature: This API uses sessionId as a path parameter & invokes FIU module GET /FI/fetch/{sessionId} API which fetches the Financial Information from the AA, & returns a decrypted XML of the retrieved FI in response

Scenario: 1. On calling the GET FI fetch {sessionId} API, with valid sessionId 
    Given Calling the GET /FI/fetch/{sessionId} API.
    And  user enters valid sessionId 
    Then Verify the status code is 200
    And verify the FI data for that specfic sessionId are received and stored in the database.

Scenario: 2. On calling the GET FI fetch{sessionId} API, with invalid sessionId  
    Given Calling the GET /FI/fetch/{sessionId}  API.
    And  user enters invalid sessionId 
    Then Verify the status code is 400/404
    And verify the FI data is not received and not stored in the database.

 
Scenario: 3. On calling the GET FI fetch{sessionId} API, with empty sessionId  
    Given Calling the GET /FI/fetch/{sessionId}  API.
    And  user enters empty sessionId 
    Then Verify the status code is 400/404
    And verify the FI data is not received and not stored in the database.
   