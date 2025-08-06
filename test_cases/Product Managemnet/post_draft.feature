Feature: Save Draft API

  Scenario: Successful creation of a draft
    Given the Save Draft API endpoint exists
    When a POST request is made to the endpoint with valid draft data
    Then the response status code should be 201
    And the response should contain a unique identifier for the saved draft
    And the saved draft should be retrievable using the provided identifier

  Scenario: Validation of required fields
    Given the Save Draft API endpoint exists
    When a POST request is made to the endpoint with missing or invalid required fields
    Then the response status code should be 400
    And the response should contain details about the missing or invalid fields
    And no draft should be created

  Scenario: Unauthorized access attempt
    Given the Save Draft API endpoint exists
    When a POST request is made to the endpoint without proper authentication
    Then the response status code should be 401
    And the response should indicate unauthorized access
    And no draft should be created

  Scenario: Server error handling
    Given the Save Draft API endpoint exists
    When a POST request is made to the endpoint
    And an unexpected server error occurs
    Then the response status code should be 500
    And the response should provide details about the encountered server error
    And no draft should be created

 
 