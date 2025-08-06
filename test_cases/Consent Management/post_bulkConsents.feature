Feature: Posting an array of bulk consents

Scenario: User successfully posts an array of bulk consents
  Given the API endpoint /BulkConsent
  And the request body contains an array of bulk consents
  When I send a POST request
  Then the response status code should be 200
  And the response should contain a success message

Scenario: User receives an error if the request body is empty
  Given the API endpoint /BulkConsent
  And the request body is empty
  When I send a POST request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the request body is not in the correct format
  Given the API endpoint /BulkConsent
  And the request body is not in the correct format
  When I send a POST request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the request is not valid
  Given the API endpoint /BulkConsent
  And the request body contains invalid data
  When I send a POST request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the server encounters an issue
  Given the API endpoint /BulkConsent
  And the server is experiencing issues
  When I send a POST request
  Then the response status code should be 500
  And the response should contain an error message
