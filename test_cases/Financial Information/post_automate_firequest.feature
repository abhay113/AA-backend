Feature: Post FI Automation Request

  Scenario: Successfully post FI automation request
    Given the FI Automation Request API endpoint exists
    When a POST request is made to /api/fiu/v1/automation/fi/request?config_id=vdcap with valid data
    Then the response status code should be 200
    And the response should be in JSON format
    And the response should contain a unique identifier for the posted automation request
    And subsequent GET requests should retrieve the posted automation request using the provided identifier

  Scenario: Unauthorized access attempt
    Given the FI Automation Request API endpoint exists
    When a POST request is made to /api/fiu/v1/automation/fi/request?config_id=vdcap without proper authentication
    Then the response status code should be 403
    And the response should indicate unauthorized access
    And no automation request should be posted

  Scenario: Incorrect config_id parameter
    Given the FI Automation Request API endpoint exists
    When a POST request is made to /api/fiu/v1/automation/fi/request?config_id=invalid with valid data
    Then the response status code should be 400
    And the response should indicate a bad request with details on the invalid config_id parameter
    And no automation request should be posted

  Scenario: Missing or invalid data
    Given the FI Automation Request API endpoint exists
    When a POST request is made to /api/fiu/v1/automation/fi/request?config_id=vdcap with missing or invalid data
    Then the response status code should be 400
    And the response should indicate details about the missing or invalid data
    And no automation request should be posted

  Scenario: Server error handling
    Given the FI Automation Request API endpoint exists
    When a POST request is made to /api/fiu/v1/automation/fi/request?config_id=vdcap
    And an unexpected server error occurs
    Then the response status code should be 500
    And the response should provide details about the encountered server error
    And no automation request should be posted

  Scenario: API documentation
    Given comprehensive documentation for the FI Automation Request API
    When referring to the documentation for the POST endpoint
    Then it should include details about the required payload, response format, authentication requirements, potential error scenarios, and any specific considerations for posting FI automation requests with the given config_id
