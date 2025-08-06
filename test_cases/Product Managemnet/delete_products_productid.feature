Feature: Deleting a product by its ID

Scenario: User successfully deletes a product by its ID
  Given the API endpoint /products/{product_id}
  And a valid product ID
  When I send a DELETE request
  Then the response status code should be 200
  And the response body should be empty

Scenario: User receives an error if the product ID is invalid
  Given the API endpoint /products/{product_id}
  And an invalid product ID
  When I send a DELETE request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the product ID does not exist
  Given the API endpoint /products/{product_id}
  And a non-existent product ID
  When I send a DELETE request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the server encounters an issue
  Given the API endpoint /products/{product_id}
  And a valid product ID
  And the server is experiencing issues
  When I send a DELETE request
  Then the response status code should be 500
  And the response should contain an error message
