Feature: Creating a new product

Scenario: User successfully creates a new product
  Given the API endpoint /addProduct
  And the request body contains valid product information
  When I send a POST request
  Then the response status code should be 200
  And the response should contain the newly created product's details

Scenario: User receives an error if the request body is empty
  Given the API endpoint /addProduct
  And the request body is empty
  When I send a POST request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the request body is not in the correct format
  Given the API endpoint /addProduct
  And the request body is not in the correct format
  When I send a POST request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the product information is invalid
  Given the API endpoint /addProduct
  And the request body contains invalid product information
  When I send a POST request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the server encounters an issue
  Given the API endpoint /addProduct
  And the server is experiencing issues
  When I send a POST request
  Then the response status code should be 500
  And the response should contain an error message
