Feature: Download PDF via Resource Server API

  Scenario: Successfully download PDF file
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/downloadPDF/02bdfde4-5dbb-4995-bd1f-0f0e82ea7485
    When a GET request is made to the endpoint
    Then the response status code should be 200
    And the response should have a Content-Type header indicating PDF format
    And the response should have a Content-Disposition header specifying the filename
    And the response body should contain the PDF file
    And the PDF file should be valid and readable

  Scenario: Unauthorized access attempt
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/downloadPDF/02bdfde4-5dbb-4995-bd1f-0f0e82ea7485
    When a GET request is made to the endpoint without proper authentication
    Then the response status code should be 401
    And the response should indicate unauthorized access

  Scenario: Incorrect targetPath parameter
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to an incorrect value, e.g., /api/fiu/v1/downloadPDF/invalid
    When a GET request is made to the endpoint
    Then the response status code should be 400
    And the response should indicate a bad request with details on the invalid parameter

  Scenario: PDF not found
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to a valid PDF identifier, but the PDF file is not available
    When a GET request is made to the endpoint
    Then the response status code should be 404
    And the response should indicate that the requested PDF file was not found

  Scenario: Server error handling
    Given the Resource Server Home API endpoint exists
    And the targetPath is set to /api/fiu/v1/downloadPDF/02bdfde4-5dbb-4995-bd1f-0f0e82ea7485
    When a GET request is made to the endpoint
    And an unexpected server error occurs
    Then the response status code should be 500
    And the response should provide details about the encountered server error

  Scenario: API documentation
    Given comprehensive documentation for the Resource Server Home API
    And the targetPath /api/fiu/v1/downloadPDF/02bdfde4-5dbb-4995-bd1f-0f0e82ea7485 is documented
    When referring to the documentation for the GET endpoint
    Then it should include details about the respon
