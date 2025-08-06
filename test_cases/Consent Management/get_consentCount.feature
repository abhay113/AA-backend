Feature: Getting the count of requests

Scenario: User successfully gets the count of requests
  Given the API endpoint /count/consent
  When I send a GET request
  Then the response status code should be 200
  And the response should contain the count of requests

Scenario: User receives an error if the server encounters an issue
  Given the API endpoint /count/consent
  And the server is experiencing issues
  When I send a GET request
  Then the response status code should be 500
  And the response should contain an error message
