Feature: Decrypt Financial Institution (FI) Data

  Scenario: Successfully decrypt FI data
    Given the FI Decrypt API endpoint exists
    When a GET request is made to /api/fiu/v1/fi/decrypt/9b0e13a3-6bcf-4be9-9cf4-40626edb5622
    Then the response status code should be 200
    And the response should be in JSON format
    And the response should contain the decrypted FI data
    And the decrypted data should adhere to the expected schema

  Scenario: Unauthorized access attempt
    Given the FI Decrypt API endpoint exists
    When a GET request is made to /api/fiu/v1/fi/decrypt/9b0e13a3-6bcf-4be9-9cf4-40626edb5622 without proper authentication
    Then the response status code should be 403
    And the response should indicate unauthorized access

  Scenario: Incorrect FI identifier
    Given the FI Decrypt API endpoint exists
    When a GET request is made to /api/fiu/v1/fi/decrypt/invalid-identifier
    Then the response status code should be 400
    And the response should indicate a bad request with details on the invalid FI identifier

  Scenario: FI data not found
    Given the FI Decrypt API endpoint exists
    When a GET request is made to /api/fiu/v1/fi/decrypt/non-existent-identifier
    Then the response status code should be 404
    And the response should indicate that the requested FI data was not found

  Scenario: Server error handling
    Given the FI Decrypt API endpoint exists
    When a GET request is made to /api/fiu/v1/fi/decrypt/9b0e13a3-6bcf-4be9-9cf4-40626edb5622
    And an unexpected server error occurs
    Then the response status code should be 500
    And the response should provide details about the encountered server error

  Scenario: API documentation
    Given comprehensive documentation for the FI Decrypt API
    When referring to the documentation for the GET endpoint
    Then it should include details about the response format, authentication requirements, potential error scenarios, and any specific considerations for decrypting FI data with the given identifier
