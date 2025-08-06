Feature: Retrieving FIU configurations

  Scenario: Successfully retrieving FIU configurations
    Given the API endpoint for retrieving FIU configurations exists
    When a GET request is sent to the endpoint
    Then the response status code should be 200
    And the response should contain valid JSON data
    And the response should include the following fields:
      | field_name       | description                                   |
      | configuration_id | The unique identifier for the configuration   |
      | name             | The name of the configuration                  |
      | value            | The value associated with the configuration   |
      | description      | The description of the configuration          |

  Scenario: Handling unauthorized access
    Given the API endpoint for retrieving FIU configurations exists
    And the request is sent without proper authentication or authorization credentials
    When a GET request is sent to the endpoint
    Then the response status code should be 401 or 403 indicating unauthorized access

  Scenario: Handling endpoint not found
    When a GET request is sent to a non-existent endpoint
    Then the response status code should be 404 or appropriate indicating endpoint not found

  Scenario: Handling invalid request method
    Given the API endpoint for retrieving FIU configurations exists
    When a request other than GET method is sent to the endpoint (e.g., POST, PUT, DELETE)
    Then the response status code should be 405 indicating method not allowed

  Scenario: Handling internal server error
    Given the API endpoint for retrieving FIU configurations exists
    And the server encounters an internal error during processing
    When a GET request is sent to the endpoint
    Then the response status code should be 500 or appropriate indicating internal server error
