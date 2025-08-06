Feature: Retrieving consents by filters

Scenario: User successfully retrieves consents with filters
  Given the API endpoint /getConsentsByFilters
  And the request includes valid filters
  When I send a GET request
  Then the response status code should be 200
  And the response should contain a list of consents matching the filters

Scenario: User successfully retrieves all consents without filters
  Given the API endpoint /getConsentsByFilters
  When I send a GET request without filters
  Then the response status code should be 200
  And the response should contain a list of all consents

Scenario: User receives an error if the filters are not in the correct format
  Given the API endpoint /getConsentsByFilters
  And the request includes invalid filters
  When I send a GET request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the server encounters an issue
  Given the API endpoint /getConsentsByFilters
  And the server is experiencing issues
  When I send a GET request
  Then the response status code should be 500
  And the response should contain an error message
