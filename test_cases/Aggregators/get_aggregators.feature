Feature: Get Aggregators API

  Scenario: Successful retrieval of aggregators
    Given the Get Aggregators API endpoint exists
    When a GET request is made to the endpoint
    Then the response status code should be 200
    And the response should be in JSON format
    And the response should contain a list of aggregators
    And each aggregator in the response should have a unique identifier
    And the response should adhere to the expected schema

  Scenario: Pagination support
    Given the Get Aggregators API endpoint exists
    When a GET request is made to the endpoint with pagination parameters, such as page number and page size
    Then the response should only include the specified number of aggregators for the requested page
    And the response should provide information about pagination, such as total pages and total aggregators

  Scenario: Filtering by parameters
    Given the Get Aggregators API endpoint exists
    When a GET request is made to the endpoint with filtering parameters, such as aggregator type or status
    Then the response should only include aggregators that match the specified criteria
    And the response should provide information about the applied filters

  Scenario: Sorting
    Given the Get Aggregators API endpoint exists
    When a GET request is made to the endpoint with sorting parameters, such as sorting by name or creation date
    Then the response should include aggregators sorted according to the specified criteria

  Scenario: Unauthorized access attempt
    Given the Get Aggregators API endpoint exists
    When a GET request is made to the endpoint without proper authentication
    Then the response status code should be 403
    And the response should indicate unauthorized access

  Scenario: Server error handling
    Given the Get Aggregators API endpoint exists
    When a GET request is made to the endpoint
    And an unexpected server error occurs
    Then the response status code should be 500
    And the response should provide details about the encountered server error

  Scenario: API documentation
    Given comprehensive documentation for the Get Aggregators API
    When referring to the documentation for the GET endpoint
    Then it should include details about the response format, supported parameters, pagination, filtering, sorting, and potential error scenarios
