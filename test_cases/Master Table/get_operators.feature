Feature: Retrieving a list of all operators

Scenario: User successfully retrieves a list of all operators
  Given the API endpoint /operators
  When I send a GET request
  Then the response status code should be 200
  And the response should contain a list of operators

Scenario: User receives an empty list if no operators are available
  Given the API endpoint /operators
  And there are no operators available
  When I send a GET request
  Then the response status code should be 200
  And the response should be an empty list

Scenario: User receives an error if the request is not valid
  Given the API endpoint /operators
  When I send an invalid GET request
  Then the response status code should be 400 or 402
  And the response should contain an error message

Scenario: User receives an error if the server encounters an issue
  Given the API endpoint /operators
  And the server is experiencing issues
  When I send a GET request
  Then the response status code should be 500 
  And the response should contain an error message
