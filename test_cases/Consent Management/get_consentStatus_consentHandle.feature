Feature: This API uses a consentHandle in the path then invokes the FIU module /Consent/handle/{consentHandle} API which returns us with the status of the following consent for which the consentHandle was provided,the status is then updated in the 

Scenario: 1. On calling the get consentstatus {consentHandle} API, with valid consent request details   
    Given Calling the GET/consentstatus/{consentHandle} API.
    And  user enters valid consentHandle
    Then Verify the status code is 200
    And verify the consent status for that specfic consentHandle are received.

Scenario: 2. On calling the get consentstatus {consentHandle} API, with invalid consent request details   
    Given Calling the GET/consentstatus/{consentHandle} API.
    And  user enters invalid consentHandle
    Then Verify the status code is 400/404
    And verify the response body should be invalid consent_id/ consent_id not found.


Scenario: 3. On calling the get consentstatus {consentHandle} API, with empty consent request details   
    Given Calling the GET/consentstatus/{consentHandle} API.
    And  user enters empty consentHandle
    Then Verify the status code is 400/404
    And verify the response body should be invalid consent_id/ consent_id not found.