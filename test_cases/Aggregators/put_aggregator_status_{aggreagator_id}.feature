Feature: Update Status for onemoney-aa Aggregator

  Scenario: Successfully update status for onemoney-aa aggregator
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/aggregator/status/onemoney-aa
    When a PUT request is made to the endpoint to update the status of onemoney-aa aggregator
    Then the response status code should be 200
    And the response should be in JSON format
    And the response should confirm the successful update of the status for onemoney-aa aggregator
    And subsequent GET requests should reflect the updated status

  Scenario: Unauthorized access attempt
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/aggregator/status/onemoney-aa
    When a PUT request is made to the endpoint without proper authentication
    Then the response status code should be 401
    And the response should indicate unauthorized access
    And the status of onemoney-aa aggregator should remain unchanged

  Scenario: Incorrect targetPath parameter
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to an incorrect value, e.g., /api/fiu/v1/aggregator/status/invalid
    When a PUT request is made to the endpoint
    Then the response status code should be 400
    And the response should indicate a bad request with details on the invalid parameter
    And the status of onemoney-aa aggregator should remain unchanged

  Scenario: Update status with invalid data
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/aggregator/status/onemoney-aa
    When a PUT request is made to the endpoint with invalid or incomplete data
    Then the response status code should be 400
    And the response should indicate the validation errors
    And the status of onemoney-aa aggregator should remain unchanged

  Scenario: Server error handling
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/aggregator/status/onemoney-aa
    When a PUT request is made to the endpoint
    And an unexpected server error occurs
    Then the response status code should be 500
    And the response should provide details about the encountered server error
    And the status of onemoney-aa aggregator should remain unchanged

  Scenario: API documentation
    Given comprehensive documentation for the Resource Server Home API
    And the targetPath /api/fiu/v1/aggregator/status/onemoney-aa is documented
    When referring to the documentation for the PUT endpoint
    Then it should include details about the required payload, response format, authentication requirements, potential error scenarios, and any specific considerations for updating the status of onemoney-aa aggregator
