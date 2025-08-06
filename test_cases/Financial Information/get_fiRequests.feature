Feature: Retrieving FI requests based on filters

Scenario: User successfully retrieves FI requests with filters
  Given the API endpoint /fi/requests
  And the request includes valid filters
  When I send a GET request
  Then the response status code should be 200
  And the response should contain a list of FI requests matching the filters

Scenario: User receives an error if the filters are not in the correct format
  Given the API endpoint /fi/requests
  And the request includes invalid filters
  When I send a GET request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the server encounters an issue
  Given the API endpoint /fi/requests
  And the server is experiencing issues
  When I send a GET request
  Then the response status code should be 500
  And the response should contain an error message
