Feature: Retrieving FIU branding configuration

  Scenario: Retrieving branding configuration successfully
    Given the API endpoint for FIU branding configuration exists
    When a GET request is sent to the endpoint
    Then the response status code should be 200
    And the response should contain valid JSON data
    And the response should include the following fields:
      | field_name         | description                               |
      | company_logo       | The logo of the company                   |
      | company_name       | The name of the company                   |
      | theme_color        | The theme color used for branding         |
      | banner_message     | The message displayed on the banner       |
      | contact_information | The contact information for the company   |

  Scenario: Handling empty branding configuration
    Given the API endpoint for FIU branding configuration exists
    And there is no branding configuration available
    When a GET request is sent to the endpoint
    Then the response status code should be 200
    And the response body should be an empty JSON object or an appropriate message indicating no branding configuration is available

  Scenario: Validation of branding configuration fields
    Given the API endpoint for FIU branding configuration exists
    When a GET request is sent to the endpoint
    Then the response status code should be 200
    And the response should contain valid JSON data
    And the response should include the expected fields with appropriate data types and formats

  Scenario: Handling unauthorized access
    Given the API endpoint for FIU branding configuration exists
    When a GET request is sent to the endpoint without proper authentication or authorization credentials
    Then the response status code should be 401 or 403 indicating unauthorized access

  Scenario: Handling endpoint not found
    When a GET request is sent to a non-existent endpoint
    Then the response status code should be 404 or appropriate indicating endpoint not found

  Scenario: Handling invalid request method
    Given the API endpoint for FIU branding configuration exists
    When a request other than GET method is sent to the endpoint (e.g., POST, PUT, DELETE)
    Then the response status code should be 405 indicating method not allowed

  Scenario: Handling invalid parameters
    Given the API endpoint for FIU branding configuration exists
    When a GET request is sent to the endpoint with invalid or missing parameters
    Then the response status code should be 400 or appropriate indicating bad request

  Scenario: Handling internal server error
    Given the API endpoint for FIU branding configuration exists
    When a GET request is sent to the endpoint and the server encounters an internal error
    Then the response status code should be 500 or appropriate indicating internal server error

  Scenario: Handling timeout
    Given the API endpoint for FIU branding configuration exists
    When a GET request is sent to the endpoint but it takes too long to respond
    Then the response should not hang indefinitely, and there should be appropriate handling for timeout
