Feature: This API will be invoked by the FIU module to notify the middleware of the consent status information. This information will be updated in database.

Scenario: 1. On calling the post consent notification, with valid details
    Given Calling the POST/consent/notification API.
    And  user enters valid details
    Then Verify the status code is 200
    And verify the consent status of that consent.

Scenario: 2. On calling the post consent notification, with invalid details
    Given Calling the POST/consent/notification API.
    And  user enters inalid details
    Then Verify the status code is 400/404
    And verify the response body as Bad request/Not Found.   
