Feature: This API is used by the user to post consent data, this data is saved in the database and also the FIU module API is invoked, FIU returns with the response of the AA and the response recieved is updated in the database with the following consent

Scenario: 1. On calling the post consent API, with valid consent request details   
    Given Calling the POST/consent API.
    And  user enters valid details
    Then Verify the status code is 200
    And verify that consent has been generated and request details are stored in the database.

Scenario: 2.  On calling the post consent API, with invalid consent request details   
    Given Calling the POST/consent API.
    And  user enters invalid details
    Then Verify the status code is 404
    And verify that consent has not been generated and request details are not stored in the database.


Scenario: 3.  On calling the post consent API, with invalid consent request details   
    Given Calling the POST/consent API.
    And  user enters invalid details
    Then Verify the status code is 400
    And verify that consent has not been generated and request details are not stored in the database.

Scenario: 4.  On calling the post consent API, with empty body 
    Given Calling the POST/consent API.
    And  user does not enter any details 
    Then Verify the status code is 400
    And verify that consent has not been generated and request details are not stored in the database.


Scenario: 5.  On calling the post consent API, with duplicate value
    Given Calling the POST/consent API.
    And   user enters duplicate txn id
    Then Verify the status code is 400
    And verify that consent has not been generated and request details are not stored in the database.
