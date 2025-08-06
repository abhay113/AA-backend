Feature: Retrieving consents by consent request ID

Scenario: User successfully retrieves consents by consent request ID
  Given the API endpoint /getConsentsByConsentRequestId/{consent_request_id}
  And a valid consent request ID
  When I send a GET request
  Then the response status code should be 200
  And the response should contain a list of consents associated with the consent request ID

Scenario: User receives an error if the consent request ID is invalid
  Given the API endpoint /getConsentsByConsentRequestId/{consent_request_id}
  And an invalid consent request ID
  When I send a GET request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the consent request ID does not exist
  Given the API endpoint /getConsentsByConsentRequestId/{consent_request_id}
  And a non-existent consent request ID
  When I send a GET request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the server encounters an issue
  Given the API endpoint /getConsentsByConsentRequestId/{consent_request_id}
  And a valid consent request ID
  And the server is experiencing issues
  When I send a GET request
  Then the response status code should be 500
  And the response should contain an error message
