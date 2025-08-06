Feature: Post Consent Information API

  Scenario: Successful creation of consent information
    Given the Post Consent Information API endpoint exists
    When a POST request is made to the endpoint with valid consent information data
    Then the response status code should be 201
    And the response should be in JSON format
    And the response should contain a unique identifier for the created consent information
    And the created consent information should be retrievable using the provided identifier

  Scenario: Validation of required fields
    Given the Post Consent Information API endpoint exists
    When a POST request is made to the endpoint with missing or invalid required fields
    Then the response status code should be 400
    And the response should contain details about the missing or invalid fields
    And no consent information should be created

  Scenario: Unauthorized access attempt
    Given the Post Consent Information API endpoint exists
    When a POST request is made to the endpoint without proper authentication
    Then the response status code should be 401
    And the response should indicate unauthorized access
    And no consent information should be created

  Scenario: Server error handling
    Given the Post Consent Information API endpoint exists
    When a POST request is made to the endpoint
    And an unexpected server error occurs
    Then the response status code should be 500
    And the response should provide details about the encountered server error
    And no consent information should be created

  Scenario: Consent revocation
    Given a valid consent information has been created
    When the specified revocation mechanism is triggered
    Then the consent status should be updated to indicate revocation
    And any associated permissions should be appropriately revoked

  Scenario: Notification of Consent
    Given a valid consent information has been created
    When the specified notification mechanism is triggered
    Then the intended parties should be notified of the consent information
    And the notification status should be updated accordingly

  Scenario: API documentation
    Given comprehensive documentation for the Post Consent Information API
    When referring to the documentation for the POST endpoint
    Then it should include details about the required payload, response format, revocation mechanisms, notification mechanisms, and potential error scenarios
