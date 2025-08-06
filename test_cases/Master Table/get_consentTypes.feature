Feature: Retrieving a list of all consent types

Scenario: User successfully retrieves a list of all consent types
  Given the API endpoint /consentTypes
  When I send a GET request
  Then the response status code should be 200
  And the response should contain a list of consent types

Scenario: User receives an empty list if no consent types are available
  Given the API endpoint /consentTypes
  And there are no consent types available
  When I send a GET request
  Then the response status code should be 200
  And the response should be an empty list

Scenario: User receives an error if the request is not valid
  Given the API endpoint /consentTypes
  When I send an invalid GET request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the server encounters an issue
  Given the API endpoint /consentTypes
  And the server is experiencing issues
  When I send a GET request
  Then the response status code should be 500 
  And the response should contain an error message
