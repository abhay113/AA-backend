Feature: Retrieve Data for onemoney-aa Aggregator

  Scenario: Successful retrieval of data for onemoney-aa aggregator
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/aggregator/onemoney-aa
    When a GET request is made to the endpoint
    Then the response status code should be 200
    And the response should be in JSON format
    And the response should contain relevant data for the onemoney-aa aggregator
    And the response should adhere to the expected schema

  Scenario: Unauthorized access attempt
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/aggregator/onemoney-aa
    When a GET request is made to the endpoint without proper authentication
    Then the response status code should be 401
    And the response should indicate unauthorized access

  Scenario: Incorrect targetPath parameter
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to an incorrect value, e.g., /api/fiu/v1/aggregator/invalid
    When a GET request is made to the endpoint
    Then the response status code should be 400
    And the response should indicate a bad request with details on the invalid parameter

  Scenario: Server error handling
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/aggregator/onemoney-aa
    When a GET request is made to the endpoint
    And an unexpected server error occurs
    Then the response status code should be 500
    And the response should provide details about the encountered server error

  Scenario: API documentation
    Given comprehensive documentation for the Resource Server Home API
    And the targetPath /api/fiu/v1/aggregator/onemoney-aa is documented
    When referring to the documentation for the GET endpoint
    Then it should include details about the response format, authentication requirements, potential error scenarios, and any specific data related to the onemoney-aa aggregator
