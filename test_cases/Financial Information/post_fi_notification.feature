Feature:This API will be invoked by the FIU module to notify the middleware of the FI status information. This information will be then updated in database.

Scenario: 1. On calling the post fi notification, with valid details
    Given Calling the POST/fi/notification API.
    And  user enters valid details
    Then Verify the status code is 200
    And verify the fi status of that fi request .

Scenario: 2. On calling the post fi notification, with invalid details
    Given Calling the POST/fi/notification API.
    And  user enters inalid details
    Then Verify the status code is 400/404
    And verify the response body as Bad request/Not Found.   
