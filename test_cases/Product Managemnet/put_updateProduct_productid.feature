Feature: Updating a product's details by its ID
 

Scenario: User successfully updates a product's details by its ID
  Given the API endpoint /updateProduct/{product_id}
  And a valid product ID
  And the request body contains valid updated product details
  When I send a PUT request
  Then the response status code should be 200
  And the response should contain the updated product's details

Scenario: User receives an error if the product ID is invalid
  Given the API endpoint /updateProduct/{product_id}
  And an invalid product ID
  And the request body contains valid updated product details
  When I send a PUT request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the product ID does not exist
  Given the API endpoint /updateProduct/{product_id}
  And a non-existent product ID
  And the request body contains valid updated product details
  When I send a PUT request
  Then the response status code should be 404
  And the response should contain an error message

Scenario: User receives an error if the request body is not in the correct format
  Given the API endpoint /updateProduct/{product_id}
  And a valid product ID
  And the request body is not in the correct format
  When I send a PUT request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the updated product details are invalid
  Given the API endpoint /updateProduct/{product_id}
  And a valid product ID
  And the request body contains invalid updated product details
  When I send a PUT request
  Then the response status code should be 400
  And the response should contain an error message

Scenario: User receives an error if the server encounters an issue
  Given the API endpoint /updateProduct/{product_id}
  And a valid product ID
  And the request body contains valid updated product details
  And the server is experiencing issues
  When I send a PUT request
  Then the response status code should be 500
  And the response should contain an error message
