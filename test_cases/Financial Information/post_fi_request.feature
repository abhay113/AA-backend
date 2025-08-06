Feature: This API is used by the FI user (FIU OPS TEAM) to issue a Financial information request by invoking the FIU module POST /FI/request API. FIU returns the untransformed response from the AA. The response containing sessionId is then saved in the database.


Scenario: 1. On calling the post FI Request API, with valid FI request details   
    Given Calling the POST/FI/request API.
    And  user enters valid details
    Then Verify the status code is 200
    And verify that FI request has been generated and request details are stored in the database.

Scenario: 2.  On calling the post FI Request API, with invalid consent request details   
    Given Calling the POST /FI/request API.
    And  user enters invalid details
    Then Verify the status code is 404
    And verify that FI request has not been generated and request details are not stored in the database.

Scenario: 3.  On calling the post FI Request API, with invalid consent request details   
    Given Calling the POST /FI/request API.
    And  user enters invalid details
    Then Verify the status code is 400
    And verify that FI request has not been generated and request details are not stored in the database.

Scenario: 4.  On calling the post FI Request API, with empty body 
    Given Calling the POST /FI/request API.
    And  user does not enter any details 
    Then Verify the status code is 400
    And verify that FI request has not been generated and request details are not stored in the database.


Scenario: 5.  On calling the post FI Request API, with duplicate value
    Given Calling the POST /FI/request API.
    And   user enters duplicate txn id
    Then Verify the status code is 400
    And verify that FI request has not been generated and request details are not stored in the database.