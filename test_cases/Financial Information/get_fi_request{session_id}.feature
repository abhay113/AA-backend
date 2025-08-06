Feature: Retrieve Financial Institution (FI) Session Information

  Scenario: Successfully retrieve FI session information
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/fi/request/session/9b0e13a3-6bcf-4be9-9cf4-40626edb5622
    When a GET request is made to the endpoint
    Then the response status code should be 200
    And the response should be in JSON format
    And the response should contain relevant information for the FI session
    And the response should adhere to the expected schema

  Scenario: Unauthorized access attempt
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/fi/request/session/9b0e13a3-6bcf-4be9-9cf4-40626edb5622
    When a GET request is made to the endpoint without proper authentication
    Then the response status code should be 401
    And the response should indicate unauthorized access

  Scenario: Incorrect targetPath parameter
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to an incorrect value, e.g., /api/fiu/v1/fi/request/session/invalid
    When a GET request is made to the endpoint
    Then the response status code should be 400
    And the response should indicate a bad request with details on the invalid parameter

  Scenario: Server error handling
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/fi/request/session/9b0e13a3-6bcf-4be9-9cf4-40626edb5622
    When a GET request is made to the endpoint
    And an unexpected server error occurs
    Then the response status code should be 500
    And the response should provide details about the encountered server error

  Scenario: API documentation
    Given comprehensive documentation for the Resource Server Home API
    And the targetPath /api/fiu/v1/fi/request/session/9b0e13a3-6bcf-4be9-9cf4-40626edb5622 is documented
    When referring to the documentation for the GET endpoint
    Then it should include details about the response format, authentication requirements, potential error scenarios, and any specific data related to the FI session
